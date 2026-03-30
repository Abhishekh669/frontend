"use client"
import { createPayment } from '@/utils/actions/payment/payment.post';
import { useGetOrderDetailsForCashierById } from '@/utils/hooks/tanstack-query/query-hook/payment/use-get-order-details-by-order-id';
import { CreatePayment, PaymentMethod, OnlineGateway } from '@/utils/types/payment.types';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  if (!order_id) return null;

  const { data, isLoading, isError } = useGetOrderDetailsForCashierById(order_id);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [onlineGateway, setOnlineGateway] = useState<OnlineGateway>("esewa");
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [discountError, setDiscountError] = useState<string>("");
  const [applyVAT, setApplyVAT] = useState<boolean>(true); // VAT toggle

  if (isLoading) return <BillSkeleton />;
  if (isError || !data?.order) return <ErrorState />;

  const order = data.order;
  const subtotal = order.order_menu_items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const tax = applyVAT ? subtotal * 0.13 : 0;
  
  // Calculate token discount (max 5% of subtotal or available tokens)
  const maxTokenDiscount = subtotal * 0.05;
  const tokenDiscount = order.token ? Math.min(order.token.total_tokens, maxTokenDiscount) : 0;
  
  // Total after token discount and VAT
  const totalAfterTokenDiscount = subtotal + tax - tokenDiscount;
  
  // Validate manual discount
  const validateDiscount = (value: number): string => {
    if (value < 0) return "Discount cannot be negative";
    if (value > totalAfterTokenDiscount) {
      return `Discount cannot exceed total amount (${fmt(totalAfterTokenDiscount)})`;
    }
    return "";
  };

  // Handle manual discount change
  const handleManualDiscountChange = (value: number) => {
    const error = validateDiscount(value);
    setDiscountError(error);
    if (!error) {
      setManualDiscount(value);
    } else {
      setManualDiscount(Math.min(value, totalAfterTokenDiscount));
    }
  };

  // Reset discount when modal opens or total changes
  useEffect(() => {
    if (showPaymentModal) {
      setManualDiscount(0);
      setDiscountError("");
    }
  }, [showPaymentModal, totalAfterTokenDiscount]);

  // Final payable amount
  const finalPayable = totalAfterTokenDiscount - manualDiscount;

  const chipStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES['not-approved'];
  const dotStyle  = STATUS_DOT[order.status]    ?? STATUS_DOT['not-approved'];

  const handlePayment = async () => {
    // Validate discount before processing
    const validationError = validateDiscount(manualDiscount);
    if (validationError) {
      setDiscountError(validationError);
      return;
    }

    setPaying(true);
    
    // Create payment object based on CreatePayment type
    const paymentData: CreatePayment = {
      order_id: order.order_id,
      payment_method: paymentMethod,
      paid_amount: finalPayable,
      discount: tokenDiscount + manualDiscount, // Total discount (token + manual)
    };
    
    // Add online_gateway only if payment method is online
    if (paymentMethod === "online") {
      paymentData.online_gateway = onlineGateway;
    }
    
    try {
      console.log("Processing payment:", paymentData);
      const res = await createPayment(paymentData);
      if(!res.success){
        toast.error(res.error || "failed to create payment");
        return;
      }
      setShowPaymentModal(false);
      // Reset form
      setPaymentMethod("cash");
      setOnlineGateway("esewa");
      setManualDiscount(0);
      setDiscountError("");
      
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      {/* ── print styles: only show #print-bill, no scroll, fits one page ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-bill, #print-bill * { visibility: visible !important; }
          #print-bill {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important;
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
          }
          @page { size: 80mm auto; margin: 6mm; }
        }
        @media screen {
          #print-bill { display: flex; align-items: flex-start; justify-content: center; }
        }
      `}</style>

      <div className="min-h-screen bg-stone-100 font-sans text-stone-800">

        {/* ── SCREEN LAYOUT: split left / right ── */}
        <div className="flex flex-col lg:flex-row min-h-screen">

          {/* ══ LEFT: Full detail preview ══ */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">

              {/* header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Bill Summary</h1>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">{fmtDate(order.created_at)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${chipStyle}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                  {order.status}
                </span>
              </div>

              {/* VAT Toggle Card */}
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
                    <input
                      type="checkbox"
                      checked={applyVAT}
                      onChange={(e) => setApplyVAT(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    <span className="ms-3 text-sm font-medium text-stone-700">
                      {applyVAT ? 'VAT Applied' : 'VAT Exempt'}
                    </span>
                  </label>
                </div>
              </div>

              {/* meta cards */}
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

              {/* items table */}
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-amber-700">
                    Order Items ({order.order_menu_items.length})
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_48px_80px_96px] px-5 py-2 border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                  <span>Item</span><span className="text-center">Qty</span>
                  <span className="text-right">Unit</span><span className="text-right">Total</span>
                </div>
                {order.order_menu_items.map((item: any) => (
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

              {/* totals */}
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
                        <span className="text-xs text-stone-400">({order.token?.total_tokens || 0} pts available)</span>
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
                {(tokenDiscount + manualDiscount) > 0 && (
                  <p className="text-xs text-center text-emerald-600 mt-2">
                    Total savings: {fmt(tokenDiscount + manualDiscount)}
                  </p>
                )}
              </div>

              {/* waiter + token */}
              <div className="grid grid-cols-2 gap-3 mb-6">
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
                <div className={`bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3 ${!order.token ? 'opacity-40' : ''}`}>
                  <div className="text-2xl">🪙</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Loyalty Tokens</p>
                    <p className="text-sm font-semibold text-stone-800">
                      {order.token ? `${order.token.total_tokens.toFixed(2)} pts` : 'No tokens'}
                    </p>
                    {order.token && tokenDiscount > 0 && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        Auto-applied: {fmt(tokenDiscount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* restaurant strip */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">S</div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Spice Garden</p>
                  <p className="text-[10px] text-stone-500">Thamel, Kathmandu · +977-01-4xxxxxx · VAT: 12345678</p>
                </div>
              </div>

              {/* action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
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

          {/* ══ RIGHT: Print preview panel (screen only) ══ */}
          <div className="hidden lg:flex w-[320px] shrink-0 bg-stone-200 border-l border-stone-300 flex-col">
            <div className="px-5 py-4 border-b border-stone-300 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">Print Preview</p>
                <p className="text-[10px] text-stone-400 mt-0.5">80mm thermal receipt</p>
              </div>
              <button
                onClick={() => window.print()}
                className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-all active:scale-95 font-semibold"
              >
                🖨️ Print
              </button>
            </div>
            {/* scrollable preview area */}
            <div className="flex-1 overflow-y-auto p-5 flex justify-center">
              <ReceiptPreview 
                order={order} 
                subtotal={subtotal} 
                tax={tax} 
                tokenDisc={tokenDiscount} 
                manualDisc={manualDiscount}
                total={finalPayable}
                applyVAT={applyVAT}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !paying && setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-900">Payment Details</h2>
              <p className="text-sm text-stone-500 mt-1">Complete the payment to finalize the bill</p>
            </div>
            
            <div className="p-6 space-y-5">
              {/* VAT Toggle in Modal */}
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-700">VAT (13%)</span>
                    {applyVAT && <span className="text-xs text-emerald-600">✓ Applied</span>}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyVAT}
                      onChange={(e) => setApplyVAT(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* Total Amount Display */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-stone-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-amber-700">{fmt(totalAfterTokenDiscount)}</p>
                {tokenDiscount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Includes {fmt(tokenDiscount)} token discount
                  </p>
                )}
                {!applyVAT && (
                  <p className="text-xs text-stone-500 mt-1">
                    VAT exempted
                  </p>
                )}
              </div>
              
              {/* Discount Input */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Additional Discount
                  <span className="text-xs font-normal text-stone-400 ml-2">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={manualDiscount}
                  onChange={(e) => handleManualDiscountChange(Number(e.target.value))}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    discountError ? 'border-red-500 bg-red-50' : 'border-stone-300'
                  }`}
                  placeholder="Enter additional discount amount"
                  min="0"
                  max={totalAfterTokenDiscount}
                  step="1"
                  disabled={paying}
                />
                {discountError && (
                  <p className="text-xs text-red-500 mt-1">{discountError}</p>
                )}
                {!discountError && manualDiscount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Remaining balance: {fmt(totalAfterTokenDiscount - manualDiscount)}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-1">
                  Maximum additional discount: {fmt(totalAfterTokenDiscount)}
                </p>
              </div>
              
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      paymentMethod === "cash"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    disabled={paying}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      paymentMethod === "online"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    disabled={paying}
                  >
                    📱 Online
                  </button>
                </div>
              </div>
              
              {/* Online Gateway Selection (only show if payment method is online) */}
              {paymentMethod === "online" && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Select Gateway</label>
                  <select
                    value={onlineGateway}
                    onChange={(e) => setOnlineGateway(e.target.value as OnlineGateway)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    disabled={paying}
                  >
                    <option value="esewa">🏦 eSewa</option>
                    <option value="khalti">💎 Khalti</option>
                    <option value="fonepay">📱 FonePay</option>
                    <option value="banking">🏛️ Banking</option>
                    <option value="other">🔄 Other</option>
                  </select>
                </div>
              )}
              
              {/* Payment Summary */}
              <div className="border-t border-stone-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-mono">{fmt(subtotal)}</span>
                </div>
                {applyVAT && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">VAT (13%):</span>
                    <span className="font-mono">{fmt(tax)}</span>
                  </div>
                )}
                {tokenDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600 flex items-center gap-1">
                      <span>🪙 Token Discount</span>
                      <span className="text-xs text-stone-400">({order.token?.total_tokens || 0} pts)</span>
                    </span>
                    <span className="font-mono text-emerald-600">-{fmt(tokenDiscount)}</span>
                  </div>
                )}
                {manualDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Manual Discount:</span>
                    <span className="font-mono text-red-600">-{fmt(manualDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200">
                  <span className="text-stone-900">Payable Amount:</span>
                  <span className="text-amber-700 font-mono">{fmt(finalPayable)}</span>
                </div>
                {(tokenDiscount + manualDiscount) > 0 && (
                  <p className="text-xs text-center text-emerald-600 pt-1">
                    Total savings: {fmt(tokenDiscount + manualDiscount)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-stone-200 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition-all"
                disabled={paying}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Confirm Payment ${fmt(finalPayable)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared receipt data props ─────────────────────────────────────────────────
interface ReceiptProps {
  order: any;
  subtotal: number;
  tax: number;
  tokenDisc: number;
  manualDisc: number;
  total: number;
  applyVAT: boolean;
}

// ── Receipt inner content (used for both preview & hidden print target) ───────
function ReceiptInner({ order, subtotal, tax, tokenDisc, manualDisc, total, applyVAT }: ReceiptProps) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-NP', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const fmtR = (n: number) =>
    `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(n)}`;

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
        <Row left="Date:" right={fmtDate(order.created_at)} />
        <Row left="Table:" right={`#${order.table_number}`} />
        <Row left="Order ID:" right={order.order_id.slice(0, 8).toUpperCase()} />
        {order.customer_name && <Row left="Customer:" right={order.customer_name} />}
        {order.customer_phone && <Row left="Phone:" right={order.customer_phone} />}
        <Row left="Waiter:" right={order.waiter_name} />
      </div>

      <DashedLine />

      {/* Items header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
        <span style={{ flex: 1 }}>ITEM</span>
        <span style={{ width: '28px', textAlign: 'right' }}>QTY</span>
        <span style={{ width: '56px', textAlign: 'right' }}>PRICE</span>
        <span style={{ width: '64px', textAlign: 'right' }}>TOTAL</span>
      </div>

      <DashedLine />

      {/* Items */}
      {order.order_menu_items.map((item: any) => (
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

      {/* Totals */}
      <div style={{ fontSize: '11px', marginBottom: '6px' }}>
        <Row left="Subtotal:" right={fmtR(subtotal)} />
        {applyVAT && <Row left="VAT (13%):" right={fmtR(tax)} />}
        {tokenDisc > 0 && <Row left="Token Disc:" right={`-${fmtR(tokenDisc)}`} />}
        {manualDisc > 0 && <Row left="Manual Disc:" right={`-${fmtR(manualDisc)}`} />}
      </div>

      <DashedLine char="=" />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', margin: '6px 0' }}>
        <span>GRAND TOTAL</span>
        <span>Rs {new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(total)}</span>
      </div>

      <DashedLine char="=" />

      {/* Loyalty tokens */}
      {order.token && tokenDisc > 0 && (
        <div style={{ fontSize: '10px', color: '#555', textAlign: 'center', margin: '6px 0' }}>
          Loyalty tokens used: {order.token.total_tokens.toFixed(2)} pts
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#555', marginTop: '10px' }}>
        <div>Thank you for dining with us!</div>
        <div style={{ marginTop: '2px' }}>Please visit again</div>
        <div style={{ marginTop: '6px', fontSize: '9px', color: '#888' }}>
          *** CUSTOMER COPY ***
        </div>
      </div>
    </div>
  );
}

// ── Receipt preview shell (right panel on screen) ─────────────────────────────
function ReceiptPreview(props: ReceiptProps) {
  return (
    <div style={{
      width: '240px',
      background: '#fff',
      borderRadius: '4px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      padding: '16px 14px',
    }}>
      <ReceiptInner {...props} />
    </div>
  );
}

// ── Small receipt helpers ─────────────────────────────────────────────────────
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

// ── skeleton ──────────────────────────────────────────────────────────────────
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
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-stone-200 rounded-xl" />
          <div className="h-16 bg-stone-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="h-12 bg-stone-300 rounded-xl" />
          <div className="h-12 bg-amber-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── error ─────────────────────────────────────────────────────────────────────
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