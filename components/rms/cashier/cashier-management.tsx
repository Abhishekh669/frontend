"use client";

import { useGetApprovedOrdersForCashier } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-approved-orders-for-cashier";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// ── shadcn/ui ──────────────────────────────────────────────────────────────
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
import { Badge } from "@/components/ui/badge";
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
  CardTitle,
} from "@/components/ui/card";
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

// ── lucide icons ───────────────────────────────────────────────────────────
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
} from "lucide-react";
import { ApprovedOrderLists, OrderItemType, orderStatus } from "@/utils/types/order.types";


// ── Helpers ────────────────────────────────────────────────────────────────
const statusConfig: Record<
  orderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  "not-approved": {
    label: "Not Approved",
    variant: "secondary",
    icon: <XCircle className="w-3 h-3" />,
  },
  progress: {
    label: "In Progress",
    variant: "outline",
    icon: <Timer className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function StatusBadge({ status }: { status: orderStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge
      variant={cfg.variant}
      className="flex items-center gap-1 w-fit text-xs font-medium"
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
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
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-amber-400" />
                Order Details
              </DialogTitle>
              <p className="text-slate-400 text-sm mt-1 font-mono">
                #{order.order_id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-5">

            {/* Customer + Table Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardDescription className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    <User className="w-3.5 h-3.5" /> Customer Info
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <p className="font-semibold text-slate-800 text-sm">
                    {order.customer_name ?? (
                      <span className="text-slate-400 italic font-normal">No name</span>
                    )}
                  </p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.customer_phone ?? (
                      <span className="italic text-slate-400">No phone</span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardDescription className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    <Hash className="w-3.5 h-3.5" /> Table Info
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <p className="font-semibold text-slate-800 text-sm">
                    Table{" "}
                    <span className="text-amber-600 font-bold text-lg">
                      #{order.table_number}
                    </span>
                  </p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(order.created_at)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Waiter Info */}
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardDescription className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-slate-500">
                  <ChefHat className="w-3.5 h-3.5" /> Served By
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-slate-200">
                  {order.waiter_image && (
                    <AvatarImage src={order.waiter_image} />
                  )}
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-bold">
                    {order.waiter_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {order.waiter_name}
                  </p>
                  <p className="text-slate-400 text-xs font-mono">
                    ID: {order.waiter_id.slice(0, 12)}...
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3 flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Order Items
                <span className="ml-1 bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs">
                  {order.order_menu_items.length}
                </span>
              </p>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-500 py-2.5">
                        Item
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-2.5 text-center">
                        Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-2.5 text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-2.5 text-right">
                        Subtotal
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-2.5">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_menu_items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            {item.menu_image ? (
                              <img
                                src={item.menu_image}
                                alt={item.menu_name}
                                className="w-8 h-8 rounded-md object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                              </div>
                            )}
                            <span className="font-medium text-slate-700 text-sm">
                              {item.menu_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-600 py-3">
                          ×{item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 py-3">
                          Rs{item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-800 py-3">
                          Rs{(item.price * item.quantity).toFixed(2)}
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
                <div className="bg-slate-900 text-white rounded-lg px-5 py-3 flex items-center gap-4">
                  <span className="text-slate-300 text-sm font-medium">
                    Total Amount
                  </span>
                  <span className="text-amber-400 text-xl font-bold">
                    Rs{total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <Button variant="outline" onClick={onClose} className="text-slate-600">
            Close
          </Button>
          <Button
            onClick={() => router.push(`/cashier/generate-bills?id=${order.order_id}`)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2"
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
    // TODO: wire up actual delete mutation
    console.log("Delete order:", deleteTarget);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Loading orders…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium">Failed to load orders</p>
        </div>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-500" />
              Cashier Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage and process approved customer orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-right">
              <p className="text-xs text-amber-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-amber-700 leading-none mt-0.5">
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Customer Name */}
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by customer name…"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus-visible:ring-amber-400"
                />
              </div>

              {/* Table Number */}
              <div className="relative sm:w-44">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Table number"
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  type="number"
                  min={0}
                  className="pl-9 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus-visible:ring-amber-400"
                />
              </div>

              {/* Phone */}
              <div className="relative sm:w-52">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Phone number"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="pl-9 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus-visible:ring-amber-400"
                />
              </div>

              {/* Clear */}
              {(searchName || searchTable || searchPhone) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchName("");
                    setSearchTable("");
                    setSearchPhone("");
                  }}
                  className="text-slate-500 hover:text-slate-700 shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Results count */}
            {(searchName || searchTable || searchPhone) && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Search className="w-3 h-3" />
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {filtered.length}
                </span>{" "}
                of {orders.length} orders
              </p>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900">
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider py-3.5">
                  Order ID
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Table
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Customer
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Phone
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Items
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  Created
                </TableHead>
                <TableHead className="text-slate-300 font-semibold text-xs uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-16 text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UtensilsCrossed className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No orders found</p>
                      <p className="text-xs">
                        Try adjusting your search filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order, idx) => (
                  <TableRow
                    key={order.order_id}
                    className={`
                      hover:bg-amber-50/40 transition-colors cursor-default
                      ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    `}
                  >
                    {/* Order ID */}
                    <TableCell className="py-3.5">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        #{order.order_id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>

                    {/* Table */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 font-bold text-sm rounded-md px-2.5 py-1">
                        <Hash className="w-3 h-3" />
                        {order.table_number}
                      </span>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">
                          {order.customer_name ?? (
                            <span className="text-slate-400 italic font-normal text-xs">
                              Guest
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {order.customer_phone ?? (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </span>
                    </TableCell>

                    {/* Items count */}
                    <TableCell>
                      <span className="text-sm text-slate-600 font-medium">
                        {order.order_menu_items.length}{" "}
                        <span className="text-slate-400 font-normal text-xs">
                          items
                        </span>
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
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
                          className="bg-slate-900 hover:bg-slate-700 text-white text-xs h-8 px-3 flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Check Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(order.order_id)}
                          className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs h-8 px-3 flex items-center gap-1.5"
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
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order{" "}
              <span className="font-mono font-semibold text-slate-700">
                #{deleteTarget?.slice(0, 8).toUpperCase()}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
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