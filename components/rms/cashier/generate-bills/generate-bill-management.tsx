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

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-NP', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUS_STYLES: Record<string, string> = {
  completed:      'bg-green-100 text-green-700',
  approved:       'bg-blue-100 text-blue-700',
  progress:       'bg-yellow-100 text-yellow-700',
  cancelled:      'bg-red-100 text-red-700',
  'not-approved': 'bg-gray-100 text-gray-600',
};

const STATUS_DOT: Record<string, string> = {
  completed:      'bg-green-500',
  approved:       'bg-blue-500',
  progress:       'bg-yellow-500',
  cancelled:      'bg-red-500',
  'not-approved': 'bg-gray-400',
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

  const subtotal = order?.order_menu_items?.reduce(
    (s, i) => s + i.price * i.quantity, 0
  ) ?? 0;

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
      // Close modal and refresh or redirect
      setTimeout(() => {
        router.replace("/cashier")
      }, 1500);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('An unexpected error occurred');
      setPaying(false);
    }
  };

  if (!order_id)         return null;
  if (isLoading)         return <BillSkeleton />;
  if (isError || !order) return <ErrorState />;

  const chipStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES['not-approved'];
  const dotStyle  = STATUS_DOT[order.status]    ?? STATUS_DOT['not-approved'];

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
          @page { 
            size: 80mm auto; 
            margin: 6mm;
          }
        }
      `}</style>

      <div className="min-h-screen bg-stone-100 font-sans text-stone-800">
        <div className="flex flex-col lg:flex-row min-h-screen">

          {/* ══ LEFT ══ */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Bill Summary</h1>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {fmtDate(order.order_menu_items?.[0]?.created_at ?? new Date().toISOString())}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${chipStyle}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                  {order.status}
                </span>
              </div>

              {/* VAT Toggle */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">Value Added Tax (VAT)</p>
                      <p className="text-xs text-stone-500">13% tax on subtotal</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={applyVAT} onChange={e => setApplyVAT(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                    <span className="ms-3 text-sm font-medium text-stone-700">{applyVAT ? 'VAT Applied' : 'VAT Exempt'}</span>
                  </label>
                </div>
              </div>

              {/* Meta cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Table',    value: `#${order.table_number}` },
                  { label: 'Order ID', value: order.order_id.slice(0, 8).toUpperCase() },
                  { label: 'Customer', value: order.customer_name ?? '—' },
                  { label: 'Phone',    value: order.customer_phone ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">{label}</p>
                    <p className="text-sm font-semibold text-stone-800 font-mono truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Items table */}
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-amber-700">
                    Order Items ({order.order_menu_items?.length ?? 0})
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_48px_80px_96px] px-5 py-2 border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                  <span>Item</span><span className="text-center">Qty</span>
                  <span className="text-right">Unit</span><span className="text-right">Total</span>
                </div>
                {(order.order_menu_items ?? []).map((item: OrderItemType) => (
                  <div key={item.id} className="grid grid-cols-[1fr_48px_80px_96px] px-5 py-3 border-b border-stone-100 last:border-none hover:bg-stone-50 transition-colors items-center">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{item.menu_name}</p>
                      <p className="text-[10px] text-stone-400 font-mono capitalize mt-0.5">{item.status}</p>
                    </div>
                    <p className="text-xs font-mono text-stone-500 text-center">×{item.quantity}</p>
                    <p className="text-xs font-mono text-stone-500 text-right">{fmt(item.price)}</p>
                    <p className="text-sm font-semibold font-mono text-stone-800 text-right">{fmt(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-stone-500 font-mono">
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {applyVAT && (
                    <div className="flex justify-between text-sm text-stone-500 font-mono">
                      <span>VAT (13%)</span><span>{fmt(tax)}</span>
                    </div>
                  )}
                  {tokenDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-mono">
                      <div className="flex items-center gap-1">
                        <span>🪙 Token Discount</span>
                        <span className="text-xs text-stone-400">({totalTokens.toFixed(2)} pts)</span>
                      </div>
                      <span>−{fmt(tokenDiscount)}</span>
                    </div>
                  )}
                  {manualDiscount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 font-mono">
                      <span>Manual Discount</span>
                      <span>−{fmt(manualDiscount)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-stone-900">Grand Total</span>
                  <span className="text-2xl font-bold text-amber-700 font-mono">{fmt(finalPayable)}</span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-xs text-center text-emerald-600 mt-2">
                    Total savings: {fmt(totalDiscount)}
                  </p>
                )}
              </div>

              {/* Waiter + Tokens + Streak - Always show with 0 values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                    {order.waiter_image
                      ? <img src={order.waiter_image} alt={order.waiter_name} className="w-full h-full object-cover" />
                      : order.waiter_name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Served By</p>
                    <p className="text-sm font-semibold text-stone-800 truncate">{order.waiter_name}</p>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="text-2xl">🪙</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Loyalty Tokens</p>
                    <p className="text-sm font-semibold text-stone-800">
                      {totalTokens > 0 ? `${totalTokens.toFixed(2)} pts` : '0 pts'}
                    </p>
                    {tokenDiscount > 0 && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        Discount: {fmt(tokenDiscount)} (max 5%)
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Visit Streak</p>
                    <p className="text-sm font-semibold text-stone-800">
                      {streak > 0 ? `${streak} day streak` : '0 day streak'}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {monthlyDays > 0 ? `${monthlyDays} days this month` : '0 days this month'}
                    </p>
                    {lastVisit && (
                      <p className="text-[10px] text-stone-400">
                        Last: {new Date(lastVisit).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Restaurant strip */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">S</div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Spice Garden</p>
                  <p className="text-[10px] text-stone-500">Thamel, Kathmandu · +977-01-4xxxxxx · VAT: 12345678</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold py-3.5 rounded-xl transition-all active:scale-95"
                >
                  🖨️ Print Bill
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-3.5 rounded-xl transition-all active:scale-95"
                >
                  💳 Pay {fmt(finalPayable)}
                </button>
              </div>

            </div>
          </div>

          {/* ══ RIGHT: Print preview - Only visible on desktop ══ */}
          <div id="print-bill" ref={printRef} className="hidden lg:flex w-[320px] shrink-0 bg-stone-200 border-l border-stone-300 flex-col">
            <div className="px-5 py-4 border-b border-stone-300 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">Print Preview</p>
                <p className="text-[10px] text-stone-400 mt-0.5">80mm thermal receipt</p>
              </div>
              <button
                onClick={handlePrint}
                className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-all active:scale-95 font-semibold"
              >
                🖨️ Print
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

      {/* ══ Payment Modal - Single confirmation ══ */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !paying && setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-900">Payment Details</h2>
              <p className="text-sm text-stone-500 mt-1">Complete the payment to finalise the bill</p>
            </div>

            <div className="p-6 space-y-5">

              {/* VAT Toggle */}
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-700">VAT (13%)</span>
                    {applyVAT && <span className="text-xs text-emerald-600">✓ Applied</span>}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={applyVAT} onChange={e => setApplyVAT(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
              </div>

              {/* Streak & Token banner - Always show with values */}
              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-3">Customer Loyalty</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-amber-600">{totalTokens.toFixed(0)}</p>
                    <p className="text-[10px] text-stone-500">Total Tokens</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{streak}</p>
                    <p className="text-[10px] text-stone-500">Day Streak 🔥</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{monthlyDays}</p>
                    <p className="text-[10px] text-stone-500">Monthly Days</p>
                  </div>
                </div>
                {tokenDiscount > 0 && (
                  <div className="bg-emerald-100 rounded-lg px-3 py-1.5 text-center mt-3">
                    <p className="text-xs text-emerald-700 font-semibold">
                      🪙 Token discount of {fmt(tokenDiscount)} auto-applied (max 5% of subtotal)
                    </p>
                  </div>
                )}
              </div>

              {/* Amount display */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-stone-600 mb-1">Amount Before Additional Discount</p>
                <p className="text-2xl font-bold text-amber-700">{fmt(totalAfterTokenDiscount)}</p>
                <div className="mt-2 space-y-1 text-xs text-stone-500">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
                  {applyVAT && <div className="flex justify-between"><span>VAT (13%)</span><span className="font-mono">{fmt(tax)}</span></div>}
                  {tokenDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>🪙 Token discount ({totalTokens.toFixed(2)} pts)</span>
                      <span className="font-mono">−{fmt(tokenDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount input */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Additional Discount
                  <span className="text-xs font-normal text-stone-400 ml-2">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={manualDiscount}
                  onChange={e => handleManualDiscountChange(Number(e.target.value))}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    discountError ? 'border-red-500 bg-red-50' : 'border-stone-300'
                  }`}
                  placeholder="Enter additional discount amount"
                  min="0"
                  max={totalAfterTokenDiscount}
                  step="1"
                  disabled={paying}
                />
                {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
                {!discountError && manualDiscount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    After discount: {fmt(totalAfterTokenDiscount - manualDiscount)}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: PaymentMethod.Cash,   label: '💵 Cash' },
                    { value: PaymentMethod.Online, label: '📱 Online' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      disabled={paying}
                      className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                        paymentMethod === opt.value
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Online Gateway */}
              {paymentMethod === PaymentMethod.Online && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Select Gateway</label>
                  <select
                    value={onlineGateway}
                    onChange={e => setOnlineGateway(e.target.value as OnlineGateway)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
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
              <div className="rounded-xl bg-stone-900 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-stone-400">Total Payable</p>
                    <p className="text-[10px] text-stone-500 mt-0.5 capitalize">
                      via {paymentMethod === PaymentMethod.Online ? onlineGateway : 'Cash'}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-amber-400 font-mono">{fmt(finalPayable)}</span>
                </div>
                {totalDiscount > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Savings: {fmt(totalDiscount)}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-stone-200 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paying}
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paying || !!discountError}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
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

  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#1c1c1c', lineHeight: 1.5 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px' }}>SPICE GARDEN</div>
        <div style={{ fontSize: '10px', color: '#555' }}>Thamel, Kathmandu</div>
        <div style={{ fontSize: '10px', color: '#555' }}>+977-01-4xxxxxx</div>
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

      {/* Items */}
      {(order.order_menu_items ?? []).map((item: OrderItemType) => (
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

      <DashedLine />

      {/* Subtotal / VAT */}
      <div style={{ fontSize: '11px', marginBottom: '4px' }}>
        <Row left="Subtotal:"  right={fmtR(subtotal)} />
        {applyVAT && <Row left="VAT (13%):" right={fmtR(tax)} />}
      </div>

      {/* Discount section - shown if any discount exists */}
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

      {/* Loyalty section - always show with values */}
      <div style={{ fontSize: '10px', color: '#555', margin: '6px 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '3px' }}>
          LOYALTY SUMMARY
        </div>
        <Row left="Total Tokens:"  right={`${totalTokens.toFixed(2)} pts`} />
        {tokenDisc > 0 && <Row left="Token Savings:" right={`-${fmtR(tokenDisc)}`} />}
        <Row left="Visit Streak:"  right={`${streak} days`} />
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
    <div className="min-h-screen bg-stone-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-3 animate-pulse">
        <div className="h-7 w-48 bg-stone-300 rounded-lg" />
        <div className="h-4 w-32 bg-stone-200 rounded" />
        <div className="grid grid-cols-4 gap-3 pt-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-stone-200 rounded-xl" />)}
        </div>
        <div className="h-48 bg-stone-200 rounded-xl" />
        <div className="h-28 bg-stone-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-stone-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="h-12 bg-stone-300 rounded-xl" />
          <div className="h-12 bg-amber-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-stone-900">Order not found</h2>
        <p className="text-sm text-stone-400 mt-1">The order may have been removed or the ID is invalid.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-5 px-5 py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-900 transition-all active:scale-95"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

export default GenerateBillsManagementPage;