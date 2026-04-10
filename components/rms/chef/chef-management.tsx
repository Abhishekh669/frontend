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
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-400",
    btnBg: "bg-amber-500/10",
    btnText: "text-amber-600 dark:text-amber-400",
    btnBorder: "border-amber-200 dark:border-amber-800",
  },
  "not-approved": {
    label: "Pending",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-400",
    btnBg: "bg-amber-500/10",
    btnText: "text-amber-600 dark:text-amber-400",
    btnBorder: "border-amber-200 dark:border-amber-800",
  },
  progress: {
    label: "Cooking",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-400",
    btnBg: "bg-blue-500/10",
    btnText: "text-blue-600 dark:text-blue-400",
    btnBorder: "border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Done",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-400",
    btnBg: "bg-emerald-500/10",
    btnText: "text-emerald-600 dark:text-emerald-400",
    btnBorder: "border-emerald-200 dark:border-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-400",
    btnBg: "bg-rose-500/10",
    btnText: "text-rose-600 dark:text-rose-400",
    btnBorder: "border-rose-200 dark:border-rose-800",
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
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[12px] font-semibold border transition-all duration-150
        ${
          active
            ? `${cfg.btnBg} ${cfg.btnText} ${cfg.btnBorder}`
            : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
        }
        ${(disabled && !active) || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-95"}
      `}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <>
          <span>{icon}</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
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
    <div className="rounded-3xl border border-border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col shadow-sm">
      {/* Gold top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Header */}
      <div className="relative px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Table number badge */}
            <div className="w-14 h-14 flex-shrink-0 bg-primary rounded-2xl flex flex-col items-center justify-center shadow-sm ring-1 ring-border">
              <span className="text-[8px] font-bold tracking-widest text-primary-foreground/60 uppercase leading-none mb-0.5">
                TBL
              </span>
              <span className="text-2xl font-bold text-primary-foreground leading-none">
                {order.table_session.table_number}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {order.customer_name ?? <span className="text-muted-foreground font-normal">Guest</span>}
              </p>
              {order.customer_phone && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <span>📞</span> {order.customer_phone}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">Opened {formatTime(order.table_session.open_time)}</span>
                <span className="text-muted-foreground/40 text-[10px]">•</span>
                <span className="text-[10px] text-muted-foreground">{formatAgo(order.table_session.open_time)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <span className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-5 py-3.5 bg-muted/10 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Order Progress</span>
          <span className="text-sm font-bold text-accent">{pct}%</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4">
          {pendingCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] text-muted-foreground">{pendingCt} pending</span>
            </div>
          )}
          {cookingCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[11px] text-muted-foreground">{cookingCt} cooking</span>
            </div>
          )}
          {doneCt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-muted-foreground">{doneCt} done</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4 space-y-3">
        {order.note && (
          <div className="bg-amber-500/8 rounded-xl px-3 py-2.5 flex items-start gap-2 border border-amber-200/40 dark:border-amber-800/40">
            <span className="text-amber-500 text-sm">💬</span>
            <span className="text-xs text-muted-foreground italic line-clamp-2">{order.note}</span>
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
                className={`rounded-2xl border p-3.5 transition-all ${
                  isCompleted
                    ? "bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/40"
                    : isCancelled
                    ? "bg-rose-500/5 border-rose-200/50 dark:border-rose-800/40"
                    : "bg-muted/20 border-border hover:border-accent/30 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{item.menu_name}</p>
                      {item.quantity > 1 && (
                        <span className="text-xs font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">₹{item.price.toLocaleString("en-IN")}</span>
                      <span className="text-border">•</span>
                      <span className="font-semibold text-foreground">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Actions */}
                {!isCompleted && !isCancelled && (
                  <div className="flex gap-2 mt-2.5">
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
                      isCompleted ? "border-emerald-200/50 dark:border-emerald-800/40" : "border-rose-200/50 dark:border-rose-800/40"
                    }`}
                  >
                    <span className="text-sm">{isCompleted ? "✅" : "❌"}</span>
                    <span className={`text-xs font-medium ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
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
        <div key={i} className="bg-card rounded-3xl border border-border overflow-hidden animate-pulse shadow-sm">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-muted rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-full w-2/3" />
                <div className="h-3 bg-muted rounded-full w-1/2" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="h-2 bg-muted rounded-full" />
            <div className="h-20 bg-muted/60 rounded-2xl" />
            <div className="h-20 bg-muted/60 rounded-2xl" />
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
      if (statusFilter === "completed" || statusFilter === "cancelled") {
        if (!isOrderFullyTerminal(order)) return false;
        if (!order.order_items.some((i) => i.status === statusFilter)) return false;
      } else {
        if (isOrderFullyTerminal(order)) return false;
        if (statusFilter !== "all") {
          if (!order.order_items.some((i) => i.status === statusFilter)) return false;
        }
      }
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
    <div className="space-y-8">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        {/* Gold radial glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)] pointer-events-none" />
        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Kitchen Operations</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Kitchen Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-foreground hover:bg-muted/60 transition-all disabled:opacity-50 shadow-sm"
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
      </div>

      {/* ── KPI Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Progress Card */}
        <div className="lg:col-span-2 relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all" />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[radial-gradient(circle,var(--color-accent)/8%,transparent_70%)] pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Overall Progress
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.pct}%</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">of {stats.active} active</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-accent/70 to-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Pending: {stats.pending}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-muted-foreground">Cooking: {stats.cooking}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Done: {stats.completed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span className="text-muted-foreground">Cancelled: {stats.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Pending Items */}
        <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
              <span className="text-amber-500 text-lg">⏳</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mt-1">Pending Items</p>
        </div>

        {/* Cooking Now */}
        <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center">
              <span className="text-blue-500 text-lg">🍳</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.cooking}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mt-1">Cooking Now</p>
        </div>

        {/* Completed */}
        <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
              <span className="text-emerald-500 text-lg">✅</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mt-1">Completed</p>
        </div>
      </div>

      {/* ── Filters & Search ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
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
                className="w-full h-9 pl-10 pr-10 bg-muted/30 focus:bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
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

        {/* Segmented Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-medium border transition-all duration-150
                ${
                  statusFilter === f.value
                    ? "bg-card border-border text-foreground shadow-sm"
                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {f.value !== "all" && (
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === f.value ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
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

      {/* ── Orders Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="absolute inset-0 scale-110 rounded-3xl border border-destructive/10" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Failed to load orders</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-5">
            Something went wrong fetching kitchen data.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Try again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-2xl">
              🍽️
            </div>
            <div className="absolute inset-0 scale-110 rounded-3xl border border-border/50" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No orders to display</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
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
  );
}