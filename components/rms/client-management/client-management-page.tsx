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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  SlidersHorizontal,
  TrendingUp,
  Package,
} from "lucide-react";

import { ApprovedOrderLists, OrderItemType, orderStatus } from "@/utils/types/order.types";
import { cn } from "@/lib/utils";

// ── Status config — uses semantic CSS vars so it works in both themes ──────
const statusConfig: Record<
  orderStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  "not-approved": {
    label: "Pending",
    icon: <Timer className="w-3 h-3" />,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  progress: {
    label: "In Progress",
    icon: <TrendingUp className="w-3 h-3" />,
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-3 h-3" />,
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

function StatusBadge({ status }: { status: orderStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border",
        cfg.className
      )}
    >
      {cfg.icon}
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

function calcTotal(items: OrderItemType[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden border-border bg-card gap-0 shadow-2xl rounded-2xl">

        {/* ── Gradient Header (adapts: dark bg in dark mode via foreground var) ── */}
        <div className="relative overflow-hidden bg-foreground px-6 pt-6 pb-5">
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full border border-background/10" />
          <div className="pointer-events-none absolute -top-4 -right-4 w-24 h-24 rounded-full border border-background/8" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-background/20 to-transparent" />

          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-background dark:text-foreground flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-background/10 dark:bg-foreground/10 border border-background/20 dark:border-foreground/20">
                    <TableProperties className="w-4 h-4 text-background dark:text-foreground" />
                  </span>
                  Order Details
                </DialogTitle>
                <p className="text-background/50 dark:text-foreground/40 text-xs mt-1.5 font-mono tracking-wider">
                  ORDER · #{order.order_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </DialogHeader>

          {/* Quick-stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { label: "Table", value: `#${order.table_number}`, icon: <Hash className="w-3.5 h-3.5" /> },
              { label: "Items",  value: `${order.order_menu_items.length} items`, icon: <Package className="w-3.5 h-3.5" /> },
              { label: "Total",  value: `Rs ${total}`, icon: <Receipt className="w-3.5 h-3.5" /> },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-background/10 dark:bg-background/5 border border-background/20 dark:border-background/10 px-3 py-2.5"
              >
                <p className="text-background/50 dark:text-foreground/40 text-[10px] uppercase tracking-widest flex items-center gap-1 mb-0.5">
                  {s.icon} {s.label}
                </p>
                <p className="text-background dark:text-foreground font-bold text-sm leading-none">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[55vh]">
          <div className="px-6 py-5 space-y-4">

            {/* Customer + Waiter cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-border bg-muted/30 shadow-none rounded-xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardDescription className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    <User className="w-3 h-3" /> Customer
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  <p className="font-semibold text-foreground text-sm">
                    {order.customer_name ?? (
                      <span className="text-muted-foreground italic font-normal">Guest</span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    {order.customer_phone ?? <span className="italic">No phone provided</span>}
                  </p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    {formatDate(order.created_at)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-muted/30 shadow-none rounded-xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardDescription className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                    <ChefHat className="w-3 h-3" /> Served By
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border shadow-sm">
                    {order.waiter_image && <AvatarImage src={order.waiter_image} />}
                    <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                      {order.waiter_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{order.waiter_name}</p>
                    <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                      {order.waiter_id.slice(0, 14)}…
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order items */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded-full bg-accent inline-block" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Order Items
                </p>
                <span className="ml-1 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium border border-border">
                  {order.order_menu_items.length}
                </span>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60 border-border">
                      {["Item", "Qty", "Price", "Subtotal", "Status"].map((h) => (
                        <TableHead
                          key={h}
                          className={cn(
                            "text-[11px] uppercase tracking-wider font-semibold text-muted-foreground py-3",
                            (h === "Price" || h === "Subtotal") && "text-right",
                            h === "Qty" && "text-center"
                          )}
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_menu_items.map((item, i) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "border-border hover:bg-muted/40 transition-colors",
                          i % 2 === 1 && "bg-muted/20"
                        )}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            {item.menu_image ? (
                              <img
                                src={item.menu_image}
                                alt={item.menu_name}
                                className="w-8 h-8 rounded-lg object-cover border border-border shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                <UtensilsCrossed className="w-3.5 h-3.5 text-accent" />
                              </div>
                            )}
                            <span className="font-medium text-foreground text-sm">{item.menu_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground py-3 font-medium">
                          ×{item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground py-3">
                          Rs {item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-foreground py-3">
                          Rs {(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total chip */}
              <div className="mt-3 flex justify-end">
                <div className="flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 shadow-lg">
                  <span className="text-background/60 dark:text-foreground/50 text-xs font-medium uppercase tracking-wider">
                    Total
                  </span>
                  <Separator orientation="vertical" className="h-4 bg-background/20" />
                  <span className="text-accent font-bold text-lg">Rs {total}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Close
          </Button>
          <Button
            onClick={() => router.push("/cashier/generate-bills")}
            className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center gap-2 shadow-md shadow-accent/20"
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
function CashierManagementPage() {
  const { data, isError, isLoading } = useGetApprovedOrdersForCashier(true);

  const [searchName, setSearchName]   = useState("");
  const [searchTable, setSearchTable] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<ApprovedOrderLists | null>(null);
  const [dialogOpen, setDialogOpen]       = useState(false);

  const [deleteTarget, setDeleteTarget]       = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const orders: ApprovedOrderLists[] = data?.orders ?? [];
  const hasFilters = searchName || searchTable || searchPhone;

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const nameMatch  = !searchName  || o.customer_name?.toLowerCase().includes(searchName.toLowerCase());
      const tableMatch = !searchTable || String(o.table_number).includes(searchTable.trim());
      const phoneMatch = !searchPhone || o.customer_phone?.includes(searchPhone.trim());
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
    // TODO: wire up actual delete mutation
    console.log("Delete order:", deleteTarget);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-medium">Loading orders…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium">Failed to load orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background space-y-6 px-1">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/5" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                Cashier Console
              </p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="w-6 h-6 text-accent" />
              Order Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              View, process, and generate bills for today's approved orders.
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-right min-w-[88px]">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-foreground leading-none mt-0.5">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">orders</p>
            </div>
            {hasFilters && (
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-right min-w-[88px]">
                <p className="text-[10px] text-accent font-semibold uppercase tracking-wider">Filtered</p>
                <p className="text-2xl font-bold text-accent leading-none mt-0.5">{filtered.length}</p>
                <p className="text-[10px] text-accent/70 mt-0.5">results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            {/* Customer name */}
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Customer name…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-9 h-9 text-sm rounded-xl border-border bg-muted/40 hover:bg-muted/70 focus:bg-background transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Table number */}
            <div className="relative sm:w-40">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Table no."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                type="number"
                min={0}
                className="pl-9 h-9 text-sm rounded-xl border-border bg-muted/40 hover:bg-muted/70 focus:bg-background transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Phone */}
            <div className="relative sm:w-48">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Phone number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="pl-9 h-9 text-sm rounded-xl border-border bg-muted/40 hover:bg-muted/70 focus:bg-background transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchName(""); setSearchTable(""); setSearchPhone(""); }}
                className="h-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
              >
                Clear
              </Button>
            )}
          </div>

          {hasFilters && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
              <Search className="w-3 h-3" />
              <span className="font-semibold text-foreground">{filtered.length}</span>
              {" "}of {orders.length}
            </p>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60 border-border">
              {["Order ID", "Table", "Customer", "Phone", "Items", "Status", "Created", "Actions"].map((h) => (
                <TableHead
                  key={h}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3.5",
                    h === "Actions" && "text-right"
                  )}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No orders found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hasFilters ? "Try adjusting your search filters" : "No approved orders for today"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order, idx) => (
                <TableRow
                  key={order.order_id}
                  className={cn(
                    "border-border hover:bg-muted/40 transition-colors",
                    idx % 2 === 1 && "bg-muted/20"
                  )}
                >
                  {/* Order ID */}
                  <TableCell className="py-3.5">
                    <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded-lg border border-border">
                      #{order.order_id.slice(0, 8).toUpperCase()}
                    </span>
                  </TableCell>

                  {/* Table */}
                  <TableCell>
                    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent font-bold text-sm rounded-lg px-2.5 py-1 border border-accent/20">
                      <Hash className="w-3 h-3" />
                      {order.table_number}
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {order.customer_name ?? (
                          <span className="text-muted-foreground italic font-normal text-xs">Guest</span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      {order.customer_phone ?? <span className="text-muted-foreground/40 text-xs">—</span>}
                    </span>
                  </TableCell>

                  {/* Items */}
                  <TableCell>
                    <span className="text-sm text-foreground font-semibold">
                      {order.order_menu_items.length}
                      <span className="text-muted-foreground font-normal text-xs ml-1">items</span>
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatDate(order.created_at)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="bg-foreground hover:bg-foreground/80 text-background text-xs h-8 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Check Order
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(order.order_id)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 text-xs h-8 px-3 rounded-xl flex items-center gap-1.5"
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

      {/* ── Order Detail Dialog ── */}
      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-card rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <span className="w-8 h-8 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </span>
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete order{" "}
              <span className="font-mono font-semibold text-foreground">
                #{deleteTarget?.slice(0, 8).toUpperCase()}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
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