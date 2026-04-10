"use client"
import { createPayment } from '@/utils/actions/payment/payment.post';
import { useGetOrderDetailsForCashierById } from '@/utils/hooks/tanstack-query/query-hook/payment/use-get-order-details-by-order-id';
import {
  CreatePayment,
  PaymentMethod,
  OnlineGateway,
  PaymentDetailsForCashierWithDiscount,
  OrderItemType,
} from '@/utils/types/payment.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Receipt, Printer, CreditCard, Coins, Flame, User, Hash,
  Phone, ChefHat, AlertCircle, Loader2, ArrowLeft, BadgePercent,
  UtensilsCrossed, X, CheckCircle2, Timer, XCircle,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-NP', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Bug fix: exclude cancelled items from subtotal ─────────────────────────
function calcSubtotal(items: OrderItemType[] | undefined): number {
  if (!items) return 0;
  return items
    .filter((i) => i.status !== 'cancelled')
    .reduce((s, i) => s + i.price * i.quantity, 0);
}

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string }> = {
  completed:      { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  approved:       { bg: 'bg-blue-500/10',    dot: 'bg-blue-500',    text: 'text-blue-600' },
  progress:       { bg: 'bg-amber-500/10',   dot: 'bg-amber-500',   text: 'text-amber-600' },
  cancelled:      { bg: 'bg-destructive/10', dot: 'bg-destructive', text: 'text-destructive' },
  'not-approved': { bg: 'bg-muted',          dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
};

const ITEM_STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
  approved:  <CheckCircle2 className="w-3 h-3 text-blue-500" />,
  progress:  <Timer className="w-3 h-3 text-amber-500" />,
  cancelled: <XCircle className="w-3 h-3 text-destructive" />,
};

// ── page ─────────────────────────────────────────────────────────────────────
function GenerateBillsManagementPage() {
  const params   = useSearchParams();
  const order_id = params.get('id');
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useGetOrderDetailsForCashierById(order_id ?? '');

  const [paying, setPaying]                     = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod]       = useState<PaymentMethod>(PaymentMethod.Cash);
  const [onlineGateway, setOnlineGateway]       = useState<OnlineGateway>(OnlineGateway.Esewa);
  const [manualDiscount, setManualDiscount]     = useState<number>(0);
  const [discountError, setDiscountError]       = useState<string>('');
  const [applyVAT, setApplyVAT]                 = useState<boolean>(false);

  const order = data?.order as PaymentDetailsForCashierWithDiscount | undefined;

  // ── Bug fix: use only non-cancelled items for subtotal ──────────────────
  const subtotal = calcSubtotal(order?.order_menu_items);

  const tax = applyVAT ? subtotal * 0.13 : 0;

  const totalTokens   = order?.token_details?.token_details?.total_tokens ?? 0;
  const tokenDiscount = order?.token_details?.discount || 0;

  const totalAfterTokenDiscount = subtotal + tax - tokenDiscount;

  const validateDiscount = (value: number): string => {
    if (value < 0) return 'Discount cannot be negative';
    if (value > totalAfterTokenDiscount)
      return `Discount cannot exceed total amount (${fmt(totalAfterTokenDiscount)})`;
    return '';
  };

  const handleManualDiscountChange = (value: number) => {
    const error = validateDiscount(value);
    setDiscountError(error);
    setManualDiscount(error ? Math.min(value, totalAfterTokenDiscount) : value);
  };

  useEffect(() => {
    if (showPaymentModal) {
      setManualDiscount(0);
      setDiscountError('');
    }
  }, [showPaymentModal, totalAfterTokenDiscount]);

  const finalPayable  = totalAfterTokenDiscount - manualDiscount;
  const totalDiscount = tokenDiscount + manualDiscount;

  const cancelledItems = order?.order_menu_items?.filter(i => i.status === 'cancelled') ?? [];
  const cancelledTotal = cancelledItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handlePayment = async () => {
    const validationError = validateDiscount(manualDiscount);
    if (validationError) {
      setDiscountError(validationError);
      return;
    }

    setPaying(true);

    const paymentData: CreatePayment = {
      order_id:       order?.order_id || '',
      payment_method: paymentMethod,
      paid_amount:    finalPayable,
    };

    if (paymentMethod === PaymentMethod.Online) {
      paymentData.online_gateway = onlineGateway;
    }

    try {
      const res = await createPayment(paymentData);
      if (!res.success) {
        toast.error(res.error || 'Failed to create payment');
        setPaying(false);
        return;
      }
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setPaymentMethod(PaymentMethod.Cash);
      setOnlineGateway(OnlineGateway.Esewa);
      setManualDiscount(0);
      setDiscountError('');
      setTimeout(() => { router.replace("/cashier"); }, 1500);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('An unexpected error occurred');
      setPaying(false);
    }
  };

  if (!order_id)         return null;
  if (isLoading)         return <BillSkeleton />;
  if (isError || !order) return <ErrorState />;

  const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES['not-approved'];

  const streak      = order.token_details?.current_streak ?? 0;
  const monthlyDays = order.token_details?.monthly_days   ?? 0;
  const lastVisit   = order.token_details?.last_visit;

  return (
    <>
      {/* ── print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-bill, #print-bill * { visibility: visible !important; }
          #print-bill {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-bill .receipt-inner {
            width: 80mm !important;
            margin: 0 auto !important;
            font-size: 11px !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 16px !important;
          }
          @page { size: 80mm auto; margin: 6mm; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <div className="flex flex-col lg:flex-row min-h-screen">

          {/* ══ LEFT ══ */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Header */}
              <div className="relative rounded-3xl border border-border bg-card px-8 py-7 shadow-sm overflow-hidden">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--accent) 12%, transparent) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--accent)_30%,transparent)] to-transparent" />

                <div className="flex items-start justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>
                        Bill Generation
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Bill Summary</h1>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {fmtDate(order.order_menu_items?.[0]?.created_at ?? new Date().toISOString())}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {order.status}
                  </span>
                </div>
              </div>

              {/* VAT Toggle */}
              <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <BadgePercent className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Value Added Tax (VAT)</p>
                      <p className="text-xs text-muted-foreground">13% tax on subtotal</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer gap-3">
                    <input type="checkbox" checked={applyVAT} onChange={e => setApplyVAT(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                    <span className="text-sm font-medium text-foreground">{applyVAT ? 'VAT Applied' : 'VAT Exempt'}</span>
                  </label>
                </div>
              </div>

              {/* Meta cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Table',    value: `#${order.table_number}`,               icon: <Hash className="w-4 h-4" /> },
                  { label: 'Order ID', value: order.order_id.slice(0, 8).toUpperCase(), icon: <Receipt className="w-4 h-4" /> },
                  { label: 'Customer', value: order.customer_name ?? '—',              icon: <User className="w-4 h-4" /> },
                  { label: 'Phone',    value: order.customer_phone ?? '—',             icon: <Phone className="w-4 h-4" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-2">
                      {icon}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">{label}</p>
                    <p className="text-sm font-semibold text-foreground font-mono truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Items table */}
              <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                    <p className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--accent)' }}>
                      Order Items
                    </p>
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {order.order_menu_items?.length ?? 0}
                    </span>
                  </div>
                  {cancelledItems.length > 0 && (
                    <span className="text-[11px] font-medium text-destructive bg-destructive/10 rounded-full px-2.5 py-1">
                      {cancelledItems.length} cancelled · −{fmt(cancelledTotal)}
                    </span>
                  )}
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_48px_80px_96px_80px] px-5 py-2.5 border-b border-border/50 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold bg-muted/20">
                  <span>Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Unit</span>
                  <span className="text-right">Total</span>
                  <span className="text-center">Status</span>
                </div>

                {(order.order_menu_items ?? []).map((item: OrderItemType) => {
                  const isCancelled = item.status === 'cancelled';
                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-[1fr_48px_80px_96px_80px] px-5 py-3.5 border-b border-border/50 last:border-none hover:bg-muted/20 transition-colors items-center ${isCancelled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.menu_image ? (
                          <img src={item.menu_image} alt={item.menu_name} className="w-8 h-8 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-border flex items-center justify-center">
                            <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.menu_name}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground text-center">×{item.quantity}</p>
                      <p className="text-xs font-mono text-muted-foreground text-right">{fmt(item.price)}</p>
                      <p className={`text-sm font-semibold font-mono text-right ${isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {isCancelled ? <span className="text-muted-foreground/50">—</span> : fmt(item.price * item.quantity)}
                      </p>
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]?.bg ?? 'bg-muted'} ${STATUS_STYLES[item.status]?.text ?? 'text-muted-foreground'}`}>
                          {ITEM_STATUS_ICONS[item.status]}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="rounded-2xl border border-border bg-card shadow-sm px-5 py-5">
                <div className="space-y-2.5">
                  {cancelledItems.length > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                        Cancelled Items Deducted
                      </span>
                      <span className="text-destructive font-mono">−{fmt(cancelledTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground font-mono">
                    <span>Subtotal {cancelledItems.length > 0 && <span className="text-xs">(active items only)</span>}</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {applyVAT && (
                    <div className="flex justify-between text-sm text-muted-foreground font-mono">
                      <span>VAT (13%)</span><span>{fmt(tax)}</span>
                    </div>
                  )}
                  {tokenDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Token Discount</span>
                        <span className="text-xs text-muted-foreground">({totalTokens.toFixed(2)} pts)</span>
                      </div>
                      <span>−{fmt(tokenDiscount)}</span>
                    </div>
                  )}
                  {manualDiscount > 0 && (
                    <div className="flex justify-between text-sm text-destructive font-mono">
                      <span>Manual Discount</span>
                      <span>−{fmt(manualDiscount)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
                  <span className="text-base font-bold text-foreground">Grand Total</span>
                  <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{fmt(finalPayable)}</span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-xs text-center text-emerald-600 mt-2">
                    Total savings: {fmt(totalDiscount)}
                  </p>
                )}
              </div>

              {/* Waiter + Tokens + Streak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm flex-shrink-0 ring-1 ring-border">
                    {order.waiter_image
                      ? <img src={order.waiter_image} alt={order.waiter_name} className="w-full h-full object-cover" />
                      : <ChefHat className="w-5 h-5" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Served By</p>
                    <p className="text-sm font-semibold text-foreground truncate">{order.waiter_name}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Loyalty Tokens</p>
                    <p className="text-sm font-semibold text-foreground">
                      {totalTokens > 0 ? `${totalTokens.toFixed(2)} pts` : '0 pts'}
                    </p>
                    {tokenDiscount > 0 && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        Discount: {fmt(tokenDiscount)} (max 5%)
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Visit Streak</p>
                    <p className="text-sm font-semibold text-foreground">
                      {streak > 0 ? `${streak} day streak` : '0 day streak'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {monthlyDays > 0 ? `${monthlyDays} days this month` : '0 days this month'}
                    </p>
                    {lastVisit && (
                      <p className="text-[10px] text-muted-foreground">
                        Last: {new Date(lastVisit).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RestroX brand strip */}
              <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-accent-foreground font-bold text-base flex-shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    R
                  </div>
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">RestroX</p>
                  <p className="text-[10px] text-muted-foreground">Bagar, Pokhara · +977-61-xxxxxx · VAT: 12345678</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-all active:scale-95 border border-border bg-card text-foreground hover:bg-muted/50"
                >
                  <Printer className="w-4 h-4" />
                  Print Bill
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-all active:scale-95 text-accent-foreground"
                  style={{ background: 'var(--accent)' }}
                >
                  <CreditCard className="w-4 h-4" />
                  Pay {fmt(finalPayable)}
                </button>
              </div>

            </div>
          </div>

          {/* ══ RIGHT: Print preview ══ */}
          <div id="print-bill" ref={printRef} className="hidden lg:flex w-[320px] shrink-0 bg-muted/30 border-l border-border flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Print Preview</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">80mm thermal receipt</p>
              </div>
              <button
                onClick={handlePrint}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all active:scale-95 text-accent-foreground"
                style={{ background: 'var(--accent)' }}
              >
                Print
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex justify-center">
              <ReceiptPreview
                order={order}
                subtotal={subtotal}
                tax={tax}
                tokenDisc={tokenDiscount}
                manualDisc={manualDiscount}
                total={finalPayable}
                applyVAT={applyVAT}
                streak={streak}
                monthlyDays={monthlyDays}
                totalTokens={totalTokens}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ══ Payment Modal ══ */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !paying && setShowPaymentModal(false)}
        >
          <div
            className="bg-card rounded-3xl border border-border max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent rounded-t-3xl" />

            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Payment Details</h2>
                  <p className="text-xs text-muted-foreground">Complete payment to finalise the bill</p>
                </div>
              </div>
              {!paying && (
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* VAT Toggle */}
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">VAT (13%)</span>
                    {applyVAT && <span className="text-xs text-emerald-600 font-medium">✓ Applied</span>}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={applyVAT} onChange={e => setApplyVAT(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>
              </div>

              {/* Loyalty Banner */}
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Customer Loyalty</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{totalTokens.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">Total Tokens</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">Day Streak 🔥</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-500">{monthlyDays}</p>
                    <p className="text-[10px] text-muted-foreground">Monthly Days</p>
                  </div>
                </div>
                {tokenDiscount > 0 && (
                  <div className="bg-emerald-500/10 rounded-xl px-3 py-2 text-center mt-3">
                    <p className="text-xs text-emerald-600 font-semibold">
                      Token discount of {fmt(tokenDiscount)} auto-applied (max 5% of subtotal)
                    </p>
                  </div>
                )}
              </div>

              {/* Amount display */}
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4"
                style={{ borderColor: 'color-mix(in oklch, var(--accent) 30%, var(--border))' }}>
                <p className="text-xs text-muted-foreground mb-1.5">Amount Before Additional Discount</p>
                <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{fmt(totalAfterTokenDiscount)}</p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {cancelledItems.length > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Cancelled items removed</span>
                      <span className="font-mono">−{fmt(cancelledTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
                  {applyVAT && <div className="flex justify-between"><span>VAT (13%)</span><span className="font-mono">{fmt(tax)}</span></div>}
                  {tokenDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Token discount ({totalTokens.toFixed(2)} pts)</span>
                      <span className="font-mono">−{fmt(tokenDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount input */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Additional Discount
                  <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={manualDiscount}
                  onChange={e => handleManualDiscountChange(Number(e.target.value))}
                  className={`w-full h-9 px-4 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors bg-muted/30 focus:bg-background ${
                    discountError ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-ring/30'
                  }`}
                  placeholder="Enter additional discount amount"
                  min="0"
                  max={totalAfterTokenDiscount}
                  step="1"
                  disabled={paying}
                />
                {discountError && <p className="text-xs text-destructive mt-1">{discountError}</p>}
                {!discountError && manualDiscount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    After discount: {fmt(totalAfterTokenDiscount - manualDiscount)}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: PaymentMethod.Cash,   label: 'Cash',   icon: '💵' },
                    { value: PaymentMethod.Online, label: 'Online', icon: '📱' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      disabled={paying}
                      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        paymentMethod === opt.value
                          ? 'text-accent-foreground shadow-md'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                      style={paymentMethod === opt.value ? { background: 'var(--accent)' } : {}}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Online Gateway */}
              {paymentMethod === PaymentMethod.Online && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Select Gateway</label>
                  <select
                    value={onlineGateway}
                    onChange={e => setOnlineGateway(e.target.value as OnlineGateway)}
                    className="w-full h-9 px-4 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 bg-muted/30 focus:bg-background transition-colors"
                    disabled={paying}
                  >
                    <option value={OnlineGateway.Esewa}>🏦 eSewa</option>
                    <option value={OnlineGateway.Khalti}>💎 Khalti</option>
                    <option value={OnlineGateway.Fonepay}>📱 FonePay</option>
                    <option value={OnlineGateway.Banking}>🏛️ Banking</option>
                    <option value={OnlineGateway.Other}>🔄 Other</option>
                  </select>
                </div>
              )}

              {/* Final summary */}
              <div className="rounded-2xl bg-primary px-5 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-primary-foreground/60">Total Payable</p>
                    <p className="text-[10px] text-primary-foreground/40 mt-0.5 capitalize">
                      via {paymentMethod === PaymentMethod.Online ? onlineGateway : 'Cash'}
                    </p>
                  </div>
                  <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{fmt(finalPayable)}</span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Savings: {fmt(totalDiscount)}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-border flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paying}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-foreground font-semibold hover:bg-muted/50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paying || !!discountError}
                className="flex-1 px-4 py-2.5 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm text-accent-foreground min-w-[140px]"
                style={{ background: 'var(--accent)' }}
              >
                {paying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${fmt(finalPayable)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Receipt props ─────────────────────────────────────────────────────────────
interface ReceiptProps {
  order: PaymentDetailsForCashierWithDiscount;
  subtotal: number;
  tax: number;
  tokenDisc: number;
  manualDisc: number;
  total: number;
  applyVAT: boolean;
  streak: number;
  monthlyDays: number;
  totalTokens: number;
}

// ── Receipt inner ─────────────────────────────────────────────────────────────
function ReceiptInner({
  order, subtotal, tax, tokenDisc, manualDisc, total,
  applyVAT, streak, monthlyDays, totalTokens,
}: ReceiptProps) {
  const fmtR = (n: number) =>
    `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(n)}`;

  const firstItem     = order.order_menu_items?.[0];
  const totalDiscount = tokenDisc + manualDisc;

  // Only show non-cancelled items in receipt
  const activeItems = (order.order_menu_items ?? []).filter((i: OrderItemType) => i.status !== 'cancelled');
  const cancelledItems = (order.order_menu_items ?? []).filter((i: OrderItemType) => i.status === 'cancelled');

  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#1c1c1c', lineHeight: 1.5 }}>

      {/* Header — RestroX branding */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px' }}>RESTROX</div>
        <div style={{ fontSize: '10px', color: '#555' }}>Bagar, Pokhara</div>
        <div style={{ fontSize: '10px', color: '#555' }}>+977-61-xxxxxx</div>
        <div style={{ fontSize: '10px', color: '#555' }}>VAT: 12345678</div>
      </div>

      <DashedLine />

      {/* Meta */}
      <div style={{ fontSize: '11px', marginBottom: '6px' }}>
        {firstItem && <Row left="Date:"    right={fmtDate(firstItem.created_at)} />}
        <Row left="Table:"    right={`#${order.table_number}`} />
        <Row left="Order ID:" right={order.order_id.slice(0, 8).toUpperCase()} />
        {order.customer_name  && <Row left="Customer:" right={order.customer_name} />}
        {order.customer_phone && <Row left="Phone:"    right={order.customer_phone} />}
        <Row left="Waiter:"   right={order.waiter_name} />
      </div>

      <DashedLine />

      {/* Column headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
        <span style={{ flex: 1 }}>ITEM</span>
        <span style={{ width: '28px', textAlign: 'right' }}>QTY</span>
        <span style={{ width: '56px', textAlign: 'right' }}>PRICE</span>
        <span style={{ width: '64px', textAlign: 'right' }}>TOTAL</span>
      </div>

      <DashedLine />

      {/* Active Items only */}
      {activeItems.map((item: OrderItemType) => (
        <div key={item.id} style={{ marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600 }}>{item.menu_name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#333' }}>
            <span style={{ flex: 1, color: '#777', fontSize: '10px' }}>{item.status}</span>
            <span style={{ width: '28px', textAlign: 'right' }}>×{item.quantity}</span>
            <span style={{ width: '56px', textAlign: 'right' }}>{fmtR(item.price)}</span>
            <span style={{ width: '64px', textAlign: 'right', fontWeight: 600 }}>{fmtR(item.price * item.quantity)}</span>
          </div>
        </div>
      ))}

      {/* Cancelled Items note */}
      {cancelledItems.length > 0 && (
        <>
          <DashedLine />
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>CANCELLED (not charged):</div>
            {cancelledItems.map((item: OrderItemType) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textDecoration: 'line-through' }}>{item.menu_name} ×{item.quantity}</span>
                <span style={{ textDecoration: 'line-through' }}>{fmtR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <DashedLine />

      {/* Subtotal / VAT */}
      <div style={{ fontSize: '11px', marginBottom: '4px' }}>
        <Row left="Subtotal:"  right={fmtR(subtotal)} />
        {applyVAT && <Row left="VAT (13%):" right={fmtR(tax)} />}
      </div>

      {/* Discount section */}
      {totalDiscount > 0 && (
        <>
          <DashedLine />
          <div style={{ fontSize: '11px', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '3px' }}>
              DISCOUNTS
            </div>
            {tokenDisc > 0 && (
              <Row
                left={`Token Disc (${totalTokens.toFixed(1)} pts):`}
                right={`-${fmtR(tokenDisc)}`}
              />
            )}
            {manualDisc > 0 && (
              <Row left="Manual Disc:" right={`-${fmtR(manualDisc)}`} />
            )}
            <Row left="Total Savings:" right={`-${fmtR(totalDiscount)}`} />
          </div>
        </>
      )}

      <DashedLine char="=" />

      {/* Grand total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', margin: '6px 0' }}>
        <span>GRAND TOTAL</span>
        <span>{fmtR(total)}</span>
      </div>

      <DashedLine char="=" />

      {/* Loyalty */}
      <div style={{ fontSize: '10px', color: '#555', margin: '6px 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '3px' }}>
          LOYALTY SUMMARY
        </div>
        <Row left="Total Tokens:"   right={`${totalTokens.toFixed(2)} pts`} />
        {tokenDisc > 0 && <Row left="Token Savings:" right={`-${fmtR(tokenDisc)}`} />}
        <Row left="Visit Streak:"   right={`${streak} days`} />
        <Row left="Monthly Visits:" right={`${monthlyDays} days`} />
      </div>
      <DashedLine />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#555', marginTop: '10px' }}>
        <div>Thank you for dining with us!</div>
        <div style={{ marginTop: '2px' }}>Please visit again</div>
        <div style={{ marginTop: '6px', fontSize: '9px', color: '#888' }}>*** CUSTOMER COPY ***</div>
      </div>
    </div>
  );
}

// ── Receipt preview shell ─────────────────────────────────────────────────────
function ReceiptPreview(props: ReceiptProps) {
  return (
    <div
      className="receipt-inner"
      style={{ width: '240px', background: '#fff', borderRadius: '4px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', padding: '16px 14px' }}
    >
      <ReceiptInner {...props} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function DashedLine({ char = '-' }: { char?: string }) {
  return (
    <div style={{ overflow: 'hidden', height: '12px', fontSize: '11px', color: '#ccc', marginBottom: '4px', whiteSpace: 'nowrap' }}>
      {char.repeat(42)}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#666' }}>{left}</span>
      <span style={{ fontWeight: 500 }}>{right}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BillSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-muted rounded-3xl" />
        <div className="h-16 bg-muted rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-52 bg-muted rounded-3xl" />
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-3 max-w-xs">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110 opacity-50" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Order not found</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The order may have been removed or the ID is invalid.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}

export default GenerateBillsManagementPage;