"use client";

import { useGetApprovedOrdersForCashier } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-approved-orders-for-cashier";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Search,
  Phone,
  Hash,
  User,
  Receipt,
  Trash2,
  Clock,
  ChefHat,
  TableProperties,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowRight,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";
import { ApprovedOrderLists, OrderItemType, orderStatus } from "@/utils/types/order.types";
import { User as Utype } from "@/utils/types/user.types";

// ── Helpers ────────────────────────────────────────────────────────────────
const statusConfig: Record<
  orderStatus,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  approved: {
    label: "Approved",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  "not-approved": {
    label: "Not Approved",
    color: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    icon: <XCircle className="w-3 h-3" />,
  },
  progress: {
    label: "In Progress",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: <Timer className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function StatusBadge({ status }: { status: orderStatus }) {
  const cfg = statusConfig[status] ?? statusConfig["not-approved"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Only count non-cancelled items in the total
function calcTotal(items: OrderItemType[]) {
  return items
    .filter((i) => i.status !== "cancelled")
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500/20 text-blue-700",
    "bg-emerald-500/20 text-emerald-700",
    "bg-amber-500/20 text-amber-700",
    "bg-violet-500/20 text-violet-700",
    "bg-rose-500/20 text-rose-700",
    "bg-cyan-500/20 text-cyan-700",
  ];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return colors[idx];
}

// ── Order Detail Dialog ────────────────────────────────────────────────────
function OrderDetailDialog({
  order,
  open,
  onClose,
}: {
  order: ApprovedOrderLists | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!order) return null;

  const total = calcTotal(order.order_menu_items);
  const cancelledCount = order.order_menu_items.filter(i => i.status === "cancelled").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent z-10" />

        {/* Header */}
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <TableProperties className="w-4.5 h-4.5 text-accent-foreground" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                  Order Details
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  #{order.order_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-4">

            {/* Customer + Table Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                  <User className="w-3.5 h-3.5" /> Customer Info
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {order.customer_name ?? (
                    <span className="text-muted-foreground italic font-normal">No name</span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {order.customer_phone ?? (
                    <span className="italic">No phone</span>
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                  <Hash className="w-3.5 h-3.5" /> Table Info
                </p>
                <p className="font-semibold text-foreground text-sm">
                  Table{" "}
                  <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                    #{order.table_number}
                  </span>
                </p>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>

            {/* Waiter Info */}
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
                <ChefHat className="w-3.5 h-3.5" /> Served By
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-xl ring-1 ring-border">
                  {order.waiter_image && (
                    <AvatarImage src={order.waiter_image} />
                  )}
                  <AvatarFallback className={`rounded-xl text-sm font-bold ${getAvatarColor(order.waiter_name ?? "")}`}>
                    {order.waiter_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {order.waiter_name}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono">
                    ID: {order.waiter_id.slice(0, 12)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-foreground" style={{ color: 'var(--accent)' }}>
                  Order Items
                </p>
                <span className="ml-1 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                  {order.order_menu_items.length}
                </span>
                {cancelledCount > 0 && (
                  <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {cancelledCount} cancelled
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-2.5">Item</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-2.5 text-center">Qty</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-2.5 text-right">Price</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-2.5 text-right">Subtotal</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-2.5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_menu_items.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`hover:bg-muted/20 transition-colors ${item.status === "cancelled" ? "opacity-50" : ""}`}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            {item.menu_image ? (
                              <img
                                src={item.menu_image}
                                alt={item.menu_name}
                                className="w-8 h-8 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-border flex items-center justify-center">
                                <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                              </div>
                            )}
                            <span className={`font-medium text-sm ${item.status === "cancelled" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {item.menu_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground py-3">
                          ×{item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground py-3">
                          Rs{item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-semibold py-3 ${item.status === "cancelled" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.status === "cancelled" ? <span className="text-muted-foreground text-xs">—</span> : `Rs${(item.price * item.quantity).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="mt-3 flex justify-end">
                <div className="rounded-xl bg-primary text-primary-foreground px-5 py-3 flex items-center gap-4">
                  <span className="text-sm font-medium opacity-80">
                    Total Amount
                    {cancelledCount > 0 && <span className="text-xs opacity-60 ml-1">(excl. cancelled)</span>}
                  </span>
                  <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                    Rs{total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-border flex justify-between items-center">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          <Button
            onClick={() => router.push(`/cashier/generate-bills?id=${order.order_id}`)}
            className="rounded-xl font-semibold flex items-center gap-2 min-w-[160px]"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
          >
            <Receipt className="w-4 h-4" />
            Generate Bill
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function CashierManagementPage({user} : {user : Utype}) {
  if(!user)return null;
  const { data, isError, isLoading } = useGetApprovedOrdersForCashier(true);

  const [searchName, setSearchName] = useState("");
  const [searchTable, setSearchTable] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<ApprovedOrderLists | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const orders: ApprovedOrderLists[] = data?.orders ?? [];

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const nameMatch =
        !searchName ||
        o.customer_name?.toLowerCase().includes(searchName.toLowerCase());
      const tableMatch =
        !searchTable ||
        String(o.table_number).includes(searchTable.trim());
      const phoneMatch =
        !searchPhone ||
        o.customer_phone?.includes(searchPhone.trim());
      return nameMatch && tableMatch && phoneMatch;
    });
  }, [orders, searchName, searchTable, searchPhone]);

  function handleViewOrder(order: ApprovedOrderLists) {
    setSelectedOrder(order);
    setDialogOpen(true);
  }

  function handleDeleteClick(orderId: string) {
    setDeleteTarget(orderId);
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    console.log("Delete order:", deleteTarget);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">Loading orders…</p>
          <p className="text-xs text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110" />
          </div>
          <p className="text-sm font-semibold text-foreground">Failed to load orders</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Something went wrong while fetching order data. Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        {/* Gold radial glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--accent) 12%, transparent) 0%, transparent 70%)' }} />
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--accent)_30%,transparent)] to-transparent" />

        <div className="flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>
                Cashier Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              Cashier Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and process approved customer orders
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-bold text-foreground leading-none mt-1" style={{ color: 'var(--accent)' }}>
              {orders.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name…"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
            />
          </div>

          <div className="relative sm:w-44">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Table number"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              type="number"
              min={0}
              className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
            />
          </div>

          <div className="relative sm:w-52">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Phone number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
            />
          </div>

          {(searchName || searchTable || searchPhone) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchName("");
                setSearchTable("");
                setSearchPhone("");
              }}
              className="rounded-xl text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear
            </Button>
          )}
        </div>

        {(searchName || searchTable || searchPhone) && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Search className="w-3 h-3" />
            Showing{" "}
            <span className="font-semibold text-foreground mx-1">
              {filtered.length}
            </span>
            of {orders.length} orders
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-3.5">
                Order ID
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Table
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Phone
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Items
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                        <UtensilsCrossed className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 rounded-3xl border border-border scale-110 opacity-50" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No orders found</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Try adjusting your search filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow
                  key={order.order_id}
                  className="hover:bg-muted/20 transition-colors cursor-default border-b border-border/50"
                >
                  {/* Order ID */}
                  <TableCell className="py-3.5">
                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                      #{order.order_id.slice(0, 8).toUpperCase()}
                    </span>
                  </TableCell>

                  {/* Table */}
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-bold text-sm rounded-lg px-2.5 py-1"
                      style={{ background: 'color-mix(in oklch, var(--accent) 15%, transparent)', color: 'var(--accent-foreground)' }}>
                      <Hash className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      <span style={{ color: 'var(--accent)' }}>{order.table_number}</span>
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {order.customer_name ?? (
                          <span className="text-muted-foreground italic font-normal text-xs">
                            Guest
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {order.customer_phone ?? (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </span>
                  </TableCell>

                  {/* Items count */}
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      {order.order_menu_items.length}
                      <span className="text-muted-foreground font-normal text-xs">items</span>
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.created_at)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="rounded-lg text-xs h-8 px-3 flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Check Order
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(order.order_id)}
                        className="rounded-lg text-xs h-8 px-3 flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />
          <AlertDialogHeader className="px-6 pt-6 pb-5 border-b border-border">
            <AlertDialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to delete order{" "}
              <span className="font-mono font-semibold text-foreground">
                #{deleteTarget?.slice(0, 8).toUpperCase()}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CashierManagementPage;