"use client";

import { updateOrderItem } from "@/utils/actions/order/order.put";
import { useGetOrdersStatus } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-order-status";
import {
  CustomerOrderRequest,
  OrderItemType,
  orderStatus,
  UpdateOrderItemType,
} from "@/utils/types/order.types";
import { useState, useMemo } from "react";

// ─── Filter type ─────────────────────────────────────────────────────────────
type FilterValue = orderStatus | "all";

// ─── Status config ────────────────────────────────────────────────────────────
type StatusCfg = {
  label: string;
  badgeBg: string;
  badgeText: string;
  dot: string;
  btnBg: string;
  btnText: string;
  btnBorder: string;
};

const STATUS_CFG: Record<orderStatus, StatusCfg> = {
  approved:      { label: "Pending",   badgeBg: "bg-amber-50",  badgeText: "text-amber-700", dot: "bg-amber-400",  btnBg: "bg-amber-50",  btnText: "text-amber-700", btnBorder: "border-amber-200" },
  "not-approved":{ label: "Pending",   badgeBg: "bg-amber-50",  badgeText: "text-amber-700", dot: "bg-amber-400",  btnBg: "bg-amber-50",  btnText: "text-amber-700", btnBorder: "border-amber-200" },
  progress:      { label: "Cooking",   badgeBg: "bg-blue-50",   badgeText: "text-blue-700",  dot: "bg-blue-400",   btnBg: "bg-blue-50",   btnText: "text-blue-700",  btnBorder: "border-blue-200"  },
  completed:     { label: "Done",      badgeBg: "bg-green-50",  badgeText: "text-green-700", dot: "bg-green-400",  btnBg: "bg-green-50",  btnText: "text-green-700", btnBorder: "border-green-200" },
  cancelled:     { label: "Cancelled", badgeBg: "bg-red-50",    badgeText: "text-red-600",   dot: "bg-red-400",    btnBg: "bg-red-50",    btnText: "text-red-600",   btnBorder: "border-red-200"   },
};

const STATUS_FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "all",       label: "All"       },
  { value: "approved",  label: "Pending"   },
  { value: "progress",  label: "Cooking"   },
  { value: "completed", label: "Done"      },
  { value: "cancelled", label: "Cancelled" },
];



// ─── Helpers ──────────────────────────────────────────────────────────────────
const isOrderFullyTerminal = (o: CustomerOrderRequest) =>
  o.order_items.every((i) => i.status === "completed" || i.status === "cancelled");

const getOrderPct = (o: CustomerOrderRequest) => {
  const active = o.order_items.filter((i) => i.status !== "cancelled");
  if (!active.length) return 100;
  const done = active.filter((i) => i.status === "completed" || i.status === "progress").length;
  return Math.round((done / active.length) * 100);
};

const formatTime = (s: string) => {
  try {
    const d = new Date(s);
    const h = d.getHours() % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m} ${d.getHours() >= 12 ? "PM" : "AM"}`;
  } catch { return "—"; }
};

const formatAgo = (s: string) => {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: orderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
function ActionButton({
  label, icon, cfg, active, loading, disabled, onClick,
}: {
  label: string;
  icon: string;
  cfg: StatusCfg;
  active: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all duration-150
        ${active ? `${cfg.btnBg} ${cfg.btnText} ${cfg.btnBorder}` : "bg-stone-50 text-stone-400 border-stone-200"}
        ${(disabled && !active) || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}
      `}
    >
      {loading ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <span className="flex items-center gap-1">{icon} {label}</span>
      )}
    </button>
  );
}

// ─── Mobile Order Card (accordion) ───────────────────────────────────────────
function MobileOrderCard({
  order,
  expanded,
  onToggle,
  loadingItem,
  onUpdateStatus,
}: {
  order: CustomerOrderRequest;
  expanded: boolean;
  onToggle: () => void;
  loadingItem: Record<string, orderStatus | null>;
  onUpdateStatus: (orderId: string, itemId: string, status: orderStatus) => void;
}) {
  const pct       = getOrderPct(order);
  const pendingCt = order.order_items.filter((i) => i.status === "approved").length;
  const cookingCt = order.order_items.filter((i) => i.status === "progress").length;
  const doneCt    = order.order_items.filter((i) => i.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-orange-200">
      {/* Header — tap to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-stone-50/80 transition-colors text-left"
      >
        <div className="w-[52px] h-[52px] flex-shrink-0 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[8px] font-bold tracking-widest text-orange-500 uppercase leading-none mb-0.5">TBL</span>
          <span className="text-xl font-bold text-orange-500 leading-none">{order.table_session.table_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 truncate mb-1.5">
            {order.customer_name ?? <span className="text-stone-400 font-normal">Guest</span>}
          </p>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-orange-500 min-w-[28px]">{pct}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingCt > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{pendingCt} pending</span>}
            {cookingCt > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{cookingCt} cooking</span>}
            {doneCt    > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{doneCt} done</span>}
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <OrderBody order={order} loadingItem={loadingItem} onUpdateStatus={onUpdateStatus} />
      )}
    </div>
  );
}

// ─── Desktop Order Card (always expanded) ─────────────────────────────────────
function DesktopOrderCard({
  order,
  loadingItem,
  onUpdateStatus,
}: {
  order: CustomerOrderRequest;
  loadingItem: Record<string, orderStatus | null>;
  onUpdateStatus: (orderId: string, itemId: string, status: orderStatus) => void;
}) {
  const pct       = getOrderPct(order);
  const pendingCt = order.order_items.filter((i) => i.status === "approved").length;
  const cookingCt = order.order_items.filter((i) => i.status === "progress").length;
  const doneCt    = order.order_items.filter((i) => i.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-200 flex flex-col">
      {/* Always-visible header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-[52px] h-[52px] flex-shrink-0 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[8px] font-bold tracking-widest text-orange-500 uppercase leading-none mb-0.5">TBL</span>
          <span className="text-xl font-bold text-orange-500 leading-none">{order.table_session.table_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 truncate">
            {order.customer_name ?? <span className="text-stone-400 font-normal">Guest</span>}
          </p>
          {order.customer_phone && (
            <p className="text-xs text-stone-400 truncate">{order.customer_phone}</p>
          )}
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-bold text-orange-500">{pct}%</span>
        </div>
        <div className="flex gap-3">
          {pendingCt > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{pendingCt} pending</span>}
          {cookingCt > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{cookingCt} cooking</span>}
          {doneCt    > 0 && <span className="flex items-center gap-1 text-[11px] text-stone-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{doneCt} done</span>}
        </div>
      </div>

      {/* Body always visible on desktop */}
      <div className="border-t border-stone-100 flex-1">
        <OrderBody order={order} loadingItem={loadingItem} onUpdateStatus={onUpdateStatus} />
      </div>
    </div>
  );
}

// ─── Shared Order Body ────────────────────────────────────────────────────────
function OrderBody({
  order,
  loadingItem,
  onUpdateStatus,
}: {
  order: CustomerOrderRequest;
  loadingItem: Record<string, orderStatus | null>;
  onUpdateStatus: (orderId: string, itemId: string, status: orderStatus) => void;
}) {
  return (
    <div className="p-4 bg-[#fdfcfb] space-y-3">
      {/* Customer note strip */}
      {order.note && (
        <div className="bg-orange-50 rounded-xl px-3 py-2 flex items-start gap-2">
          <span className="text-orange-400 text-xs mt-0.5">💬</span>
          <span className="text-xs text-stone-500 italic line-clamp-2">{order.note}</span>
        </div>
      )}

      {/* Items table */}
      <div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
          Items · {order.order_items.length}
        </p>
        <div className="space-y-2">
          {order.order_items.map((item: OrderItemType) => {
            const loadingAction = loadingItem[item.id] ?? null;
            const isCancelled   = item.status === "cancelled";
            const isCompleted   = item.status === "completed";

            return (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-stone-100 space-y-2">
                {/* Item row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-stone-800 truncate">{item.menu_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-stone-400">×{item.quantity}</span>
                      <span className="text-stone-200 text-xs">·</span>
                      <span className="text-xs text-stone-400">₹{item.price}</span>
                      <span className="text-stone-200 text-xs">·</span>
                      <span className="text-xs font-semibold text-orange-500">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Actions — only for active items */}
                {!isCompleted && !isCancelled && (
                  <div className="flex gap-1.5">
                    <ActionButton
                      label="Cooking" icon="🍳"
                      cfg={STATUS_CFG.progress}
                      active={item.status === "progress"}
                      loading={loadingAction === "progress"}
                      disabled={item.status === "progress" || !!loadingAction}
                      onClick={() => onUpdateStatus(order.id, item.id, "progress")}
                    />
                    <ActionButton
                      label="Done" icon="✓"
                      cfg={STATUS_CFG.completed}
                      active={false}
                      loading={loadingAction === "completed"}
                      disabled={!!loadingAction}
                      onClick={() => onUpdateStatus(order.id, item.id, "completed")}
                    />
                    <ActionButton
                      label="Cancel" icon="✕"
                      cfg={STATUS_CFG.cancelled}
                      active={false}
                      loading={loadingAction === "cancelled"}
                      disabled={!!loadingAction}
                      onClick={() => onUpdateStatus(order.id, item.id, "cancelled")}
                    />
                  </div>
                )}

                {/* Terminal banner */}
                {(isCompleted || isCancelled) && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                    ${isCompleted ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    <span>{isCompleted ? "✓" : "✕"}</span>
                    {isCompleted ? "Item is Done" : "Item was Cancelled"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
        <span className="text-[10px] text-stone-400">Opened {formatTime(order.table_session.open_time)}</span>
        <span className="text-stone-200 mx-0.5">·</span>
        <span className="text-[10px] text-stone-400">{formatAgo(order.table_session.open_time)}</span>
        <div className="flex-1" />
        <span className="text-[10px] text-stone-300 font-mono">#{order.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] bg-stone-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-stone-100 rounded w-2/3" />
              <div className="h-2 bg-stone-100 rounded w-full" />
              <div className="h-2 bg-stone-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="h-16 bg-stone-50 rounded-xl border border-stone-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const { data, isError, isLoading, refetch, isRefetching } = useGetOrdersStatus();
  const rawOrders: CustomerOrderRequest[] = data?.order_requests ?? [];

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [loadingItem,    setLoadingItem]    = useState<Record<string, orderStatus | null>>({});
  const [searchQuery,    setSearchQuery]    = useState("");
  const [statusFilter,   setStatusFilter]   = useState<FilterValue>("all");
  const [sortOrder,      setSortOrder]      = useState<"asc" | "desc">("asc");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let total = 0, pending = 0, cooking = 0, completed = 0, cancelled = 0;
    rawOrders.forEach((o) =>
      o.order_items.forEach((item) => {
        total++;
        if (item.status === "approved")  pending++;
        if (item.status === "progress")  cooking++;
        if (item.status === "completed") completed++;
        if (item.status === "cancelled") cancelled++;
      })
    );
    const active = total - cancelled;
    const pct    = active > 0 ? Math.round(((completed + cooking) / active) * 100) : 0;
    return { total, pending, cooking, completed, cancelled, pct, active };
  }, [rawOrders]);

  // ── Filtered + sorted orders ───────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const filtered = rawOrders.filter((order) => {
      // Terminal vs active bucket
      if (statusFilter === "completed" || statusFilter === "cancelled") {
        if (!isOrderFullyTerminal(order)) return false;
        if (!order.order_items.some((i) => i.status === statusFilter)) return false;
      } else {
        if (isOrderFullyTerminal(order)) return false;
        if (statusFilter !== "all") {
          if (!order.order_items.some((i) => i.status === statusFilter)) return false;
        }
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          order.table_session.table_number.toString().includes(q) ||
          (order.customer_name?.toLowerCase().includes(q) ?? false) ||
          (order.customer_phone?.includes(q) ?? false)
        );
      }
      return true;
    });

    const dir = sortOrder === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const ta = new Date(a.table_session.open_time).getTime();
      const tb = new Date(b.table_session.open_time).getTime();
      return (ta - tb) * dir;
    });
  }, [rawOrders, statusFilter, searchQuery, sortOrder]);

  // ── Update item status ─────────────────────────────────────────────────────
  const handleUpdateStatus = async (
    orderId: string,
    itemId: string,
    newStatus: orderStatus,
  ) => {
    if (newStatus === "cancelled" && !window.confirm("Cancel this item?")) return;

    setLoadingItem((p) => ({ ...p, [itemId]: newStatus }));
    try {
      const payload: UpdateOrderItemType = {
        order_id:      orderId,
        order_item_id: itemId,
        status:        newStatus,
      };
      await updateOrderItem(payload);
      await refetch();
    } catch (err) {
      console.error("Failed to update order item:", err);
    } finally {
      setLoadingItem((p) => { const n = { ...p }; delete n[itemId]; return n; });
    }
  };

  const toggleOrder = (id: string) =>
    setExpandedOrders((p) => ({ ...p, [id]: !p[id] }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#fffcf8]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
    
      {/* ── Main ── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 lg:px-6 h-16 flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-1 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h1 className="text-[17px] font-bold text-stone-800 leading-tight">Kitchen</h1>
            <p className="text-[11px] text-stone-400 hidden sm:block leading-tight">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-stone-500 bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={sortOrder === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 space-y-5">

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Progress card */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-4">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Overall Progress</p>
              <div className="flex items-end justify-between mb-3">
                <span className="text-4xl font-bold text-orange-500">{stats.pct}%</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-stone-800">{stats.completed}</p>
                  <p className="text-xs text-stone-400">of {stats.active} done</p>
                </div>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { label: "Pending",   value: stats.pending,   dot: "bg-amber-400" },
                  { label: "Cooking",   value: stats.cooking,   dot: "bg-blue-400"  },
                  { label: "Done",      value: stats.completed, dot: "bg-green-400" },
                  { label: "Cancelled", value: stats.cancelled, dot: "bg-red-400"   },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-[11px] font-semibold text-stone-700">{s.value}</span>
                    <span className="text-[10px] text-stone-400 hidden sm:inline">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini stat cards */}
            {[
              { label: "Pending",  value: stats.pending,   color: "text-amber-600", top: "bg-amber-400"  },
              { label: "Cooking",  value: stats.cooking,   color: "text-blue-600",  top: "bg-blue-400"   },
              { label: "Done",     value: stats.completed, color: "text-green-600", top: "bg-green-400"  },
            ].map((s) => (
              <div key={s.label} className="relative bg-white rounded-2xl border border-stone-200 p-4 overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${s.top}`} />
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 mt-0.5">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color} leading-none`}>{s.value}</p>
                <p className="text-xs text-stone-400 mt-1">items</p>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex-1
              focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search table, customer, phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm text-stone-700 placeholder-stone-400 outline-none bg-transparent min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-stone-300 hover:text-stone-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort — mobile only */}
            <button
              onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
              className="sm:hidden flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold
                text-stone-500 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={sortOrder === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {sortOrder === "asc" ? "Oldest first" : "Newest first"}
            </button>
          </div>

          {/* ── Filter chips ── */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 lg:mx-0 lg:px-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150
                  ${statusFilter === f.value
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-stone-500 border-stone-200 hover:border-orange-300 hover:text-orange-500"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Orders ── */}
          {isLoading ? (
            <Skeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl mb-4">⚠️</div>
              <p className="text-base font-semibold text-stone-700 mb-1">Failed to load orders</p>
              <p className="text-sm text-stone-400 mb-4">Something went wrong fetching kitchen data.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🍽️</div>
              <p className="text-base font-semibold text-stone-700 mb-1">No orders here</p>
              <p className="text-sm text-stone-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "All caught up — great work!"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: accordion cards */}
              <div className="flex flex-col gap-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    expanded={expandedOrders[order.id] ?? false}
                    onToggle={() => toggleOrder(order.id)}
                    loadingItem={loadingItem}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>

              {/* Desktop: always-expanded grid */}
              <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <DesktopOrderCard
                    key={order.id}
                    order={order}
                    loadingItem={loadingItem}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </>
          )}

          <div className="h-8" />
        </main>
      </div>
    </div>
  );
}