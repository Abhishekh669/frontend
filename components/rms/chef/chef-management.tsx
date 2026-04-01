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
import { format } from "date-fns";

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
  approved: {
    label: "Pending",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    dot: "bg-amber-400",
    btnBg: "bg-amber-50",
    btnText: "text-amber-700",
    btnBorder: "border-amber-200",
  },
  "not-approved": {
    label: "Pending",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    dot: "bg-amber-400",
    btnBg: "bg-amber-50",
    btnText: "text-amber-700",
    btnBorder: "border-amber-200",
  },
  progress: {
    label: "Cooking",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    dot: "bg-blue-400",
    btnBg: "bg-blue-50",
    btnText: "text-blue-700",
    btnBorder: "border-blue-200",
  },
  completed: {
    label: "Done",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    dot: "bg-green-400",
    btnBg: "bg-green-50",
    btnText: "text-green-700",
    btnBorder: "border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    dot: "bg-red-400",
    btnBg: "bg-red-50",
    btnText: "text-red-600",
    btnBorder: "border-red-200",
  },
};

const STATUS_FILTERS: Array<{ value: FilterValue; label: string; icon: string }> = [
  { value: "all", label: "All Orders", icon: "📋" },
  { value: "approved", label: "Pending", icon: "⏳" },
  { value: "progress", label: "Cooking", icon: "🍳" },
  { value: "completed", label: "Completed", icon: "✅" },
  { value: "cancelled", label: "Cancelled", icon: "❌" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isOrderFullyTerminal = (o: CustomerOrderRequest) =>
  o.order_items.every((i) => i.status === "completed" || i.status === "cancelled");

const getOrderPct = (o: CustomerOrderRequest) => {
  const active = o.order_items.filter((i) => i.status !== "cancelled");
  if (!active.length) return 100;
  const done = active.filter((i) => i.status === "completed").length;
  return Math.round((done / active.length) * 100);
};

const formatTime = (s: string) => {
  try {
    const d = new Date(s);
    const h = d.getHours() % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m} ${d.getHours() >= 12 ? "PM" : "AM"}`;
  } catch {
    return "—";
  }
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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
function ActionButton({
  label,
  icon,
  cfg,
  active,
  loading,
  disabled,
  onClick,
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
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[12px] font-semibold border transition-all duration-150
        ${
          active
            ? `${cfg.btnBg} ${cfg.btnText} ${cfg.btnBorder}`
            : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
        }
        ${(disabled && !active) || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-95"}
      `}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      ) : (
        <>
          <span>{icon}</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ─── Order Card (always expanded on web) ─────────────────────────────────────
function OrderCard({
  order,
  loadingItem,
  onUpdateStatus,
}: {
  order: CustomerOrderRequest;
  loadingItem: Record<string, orderStatus | null>;
  onUpdateStatus: (orderId: string, itemId: string, status: orderStatus) => void;
}) {
  const pct = getOrderPct(order);
  const pendingCt = order.order_items.filter((i) => i.status === "approved" || i.status === "not-approved").length;
  const cookingCt = order.order_items.filter((i) => i.status === "progress").length;
  const doneCt = order.order_items.filter((i) => i.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-[9px] font-bold tracking-widest text-orange-100 uppercase leading-none mb-0.5">
                TBL
              </span>
              <span className="text-2xl font-bold text-white leading-none">
                {order.table_session.table_number}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-stone-800 truncate">
                {order.customer_name ?? <span className="text-stone-400 font-normal">Guest</span>}
              </p>
              {order.customer_phone && (
                <p className="text-xs text-stone-400 truncate flex items-center gap-1 mt-0.5">
                  <span>📞</span> {order.customer_phone}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-stone-400">Opened {formatTime(order.table_session.open_time)}</span>
                <span className="text-stone-300 text-[10px]">•</span>
                <span className="text-[10px] text-stone-400">{formatAgo(order.table_session.open_time)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <span className="text-[10px] text-stone-400 font-mono">#{order.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 py-3 bg-stone-50/50 border-b border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-stone-500">Order Progress</span>
          <span className="text-sm font-bold text-orange-500">{pct}%</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4">
          {pendingCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-stone-600">{pendingCt} pending</span>
            </div>
          )}
          {cookingCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[11px] text-stone-600">{cookingCt} cooking</span>
            </div>
          )}
          {doneCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] text-stone-600">{doneCt} done</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4 space-y-3">
        {order.note && (
          <div className="bg-amber-50 rounded-xl px-3 py-2.5 flex items-start gap-2 border border-amber-100">
            <span className="text-amber-500 text-sm">💬</span>
            <span className="text-xs text-stone-600 italic line-clamp-2">{order.note}</span>
          </div>
        )}

        <div className="space-y-2">
          {order.order_items.map((item: OrderItemType) => {
            const loadingAction = loadingItem[item.id] ?? null;
            const isCancelled = item.status === "cancelled";
            const isCompleted = item.status === "completed";

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 transition-all ${
                  isCompleted
                    ? "bg-green-50/30 border-green-100"
                    : isCancelled
                    ? "bg-red-50/30 border-red-100"
                    : "bg-white border-stone-200 hover:border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-stone-800 truncate">{item.menu_name}</p>
                      {item.quantity > 1 && (
                        <span className="text-xs font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-400">₹{item.price.toLocaleString("en-IN")}</span>
                      <span className="text-stone-300">•</span>
                      <span className="font-semibold text-orange-600">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Actions */}
                {!isCompleted && !isCancelled && (
                  <div className="flex gap-2 mt-2">
                    <ActionButton
                      label="Cooking"
                      icon="🍳"
                      cfg={STATUS_CFG.progress}
                      active={item.status === "progress"}
                      loading={loadingAction === "progress"}
                      disabled={item.status === "progress" || !!loadingAction}
                      onClick={() => onUpdateStatus(order.id, item.id, "progress")}
                    />
                    <ActionButton
                      label="Done"
                      icon="✅"
                      cfg={STATUS_CFG.completed}
                      active={false}
                      loading={loadingAction === "completed"}
                      disabled={!!loadingAction}
                      onClick={() => onUpdateStatus(order.id, item.id, "completed")}
                    />
                    <ActionButton
                      label="Cancel"
                      icon="❌"
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
                  <div
                    className={`flex items-center gap-2 mt-2 pt-2 border-t ${
                      isCompleted ? "border-green-100" : "border-red-100"
                    }`}
                  >
                    <span className="text-sm">{isCompleted ? "✅" : "❌"}</span>
                    <span className={`text-xs font-medium ${isCompleted ? "text-green-600" : "text-red-600"}`}>
                      {isCompleted ? "Item completed" : "Item cancelled"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-stone-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-2/3" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="h-8 bg-stone-100 rounded" />
            <div className="h-20 bg-stone-50 rounded" />
            <div className="h-20 bg-stone-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const { data, isError, isLoading, refetch, isRefetching } = useGetOrdersStatus(true);
  const rawOrders: CustomerOrderRequest[] = data?.order_requests ?? [];

  const [loadingItem, setLoadingItem] = useState<Record<string, orderStatus | null>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let total = 0,
      pending = 0,
      cooking = 0,
      completed = 0,
      cancelled = 0;
    rawOrders.forEach((o) =>
      o.order_items.forEach((item) => {
        total++;
        if (item.status === "approved" || item.status === "not-approved") pending++;
        if (item.status === "progress") cooking++;
        if (item.status === "completed") completed++;
        if (item.status === "cancelled") cancelled++;
      })
    );
    const active = total - cancelled;
    const pct = active > 0 ? Math.round((completed / active) * 100) : 0;
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
          (order.customer_phone?.includes(q) ?? false) ||
          order.id.toLowerCase().includes(q)
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
  const handleUpdateStatus = async (orderId: string, itemId: string, newStatus: orderStatus) => {
    if (newStatus === "cancelled" && !window.confirm("Cancel this item?")) return;

    setLoadingItem((p) => ({ ...p, [itemId]: newStatus }));
    try {
      const payload: UpdateOrderItemType = {
        order_id: orderId,
        order_item_id: itemId,
        status: newStatus,
      };
      await updateOrderItem(payload);
      await refetch();
    } catch (err) {
      console.error("Failed to update order item:", err);
    } finally {
      setLoadingItem((p) => {
        const n = { ...p };
        delete n[itemId];
        return n;
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-orange-50/20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-stone-800 to-orange-600 bg-clip-text text-transparent">
                Kitchen Dashboard
              </h1>
              <p className="text-stone-500 mt-1">
                {format(new Date(), "EEEE, MMMM do, yyyy")}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-orange-300 transition-all disabled:opacity-50 shadow-sm"
            >
              <svg
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Orders
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Progress Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Overall Progress
                  </p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{stats.pct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-stone-800">{stats.completed}</p>
                  <p className="text-xs text-stone-400">of {stats.active} active</p>
                </div>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-stone-600">Pending: {stats.pending}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-stone-600">Cooking: {stats.cooking}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-stone-600">Done: {stats.completed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-stone-600">Cancelled: {stats.cancelled}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Items</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{stats.pending}</p>
                </div>
                <span className="text-3xl">⏳</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Cooking Now</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{stats.cooking}</p>
                </div>
                <span className="text-3xl">🍳</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Completed</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{stats.completed}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by table number, customer name, phone, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={sortOrder === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  />
                </svg>
                {sortOrder === "asc" ? "Oldest First" : "Newest First"}
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                  ${
                    statusFilter === f.value
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-500"
                  }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
                {f.value !== "all" && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === f.value ? "bg-white/20" : "bg-stone-100"
                    }`}
                  >
                    {f.value === "approved"
                      ? stats.pending
                      : f.value === "progress"
                      ? stats.cooking
                      : f.value === "completed"
                      ? stats.completed
                      : f.value === "cancelled"
                      ? stats.cancelled
                      : ""}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-stone-700 mb-1">Failed to load orders</p>
            <p className="text-sm text-stone-400 mb-4">Something went wrong fetching kitchen data.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-200">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-3xl mb-4">🍽️</div>
            <p className="text-lg font-semibold text-stone-700 mb-1">No orders to display</p>
            <p className="text-sm text-stone-400">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "All caught up — great work! Orders will appear here when they come in."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                loadingItem={loadingItem}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}