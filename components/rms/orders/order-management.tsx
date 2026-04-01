"use client";

import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  Eye,
  Receipt,
} from "lucide-react";
import { format, isAfter } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { useGetAllOrderHistory } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-all-order-history-for-admin";
import { GetAllOrderHistoryQuery } from "@/utils/actions/order/order.get";
import { ApprovedOrderLists, OrderItemType } from "@/utils/types/order.types";

const PAGE_SIZES = [5, 10, 20, 50];
const TODAY = new Date();

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  completed: "success",
  approved: "info",
  progress: "warning",
  cancelled: "destructive",
  "not-approved": "secondary",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function OrderManagementPage() {
  const [query, setQuery] = useState<GetAllOrderHistoryQuery>({
    limit: 10,
    page: 0,
    fromDate: "",
    toDate: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedOrder, setSelectedOrder] = useState<ApprovedOrderLists | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetAllOrderHistory(query);

  // Get the actual response data
  const orderHistoryResponse = data?.order_history_response;
  const orders = orderHistoryResponse?.orders || [];
  const totalOrders = orderHistoryResponse?.total || 0;
  const totalPages = totalOrders ? Math.ceil(totalOrders / query.limit) : 1;
  const currentPage = query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm) {
        // Add search to query if needed
        setQuery((p) => ({ ...p, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const applyFilters = () => {
    if (fromDate && isAfter(fromDate, TODAY)) {
      toast.error("From date cannot be in the future");
      return;
    }
    if (toDate && isAfter(toDate, TODAY)) {
      toast.error("To date cannot be in the future");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setQuery((p) => ({
      ...p,
      fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
      toDate: toDate ? format(toDate, "yyyy-MM-dd") : "",
      page: 0,
    }));
  };

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setQuery((p) => ({
      ...p,
      fromDate: "",
      toDate: "",
      page: 0,
    }));
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page > totalPages - 1 || isLoading) return;
    setQuery((p) => ({ ...p, page }));
  };

  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const windowSize = 2;
    let startPage = Math.max(0, currentPage - windowSize);
    let endPage = Math.min(totalPages - 1, currentPage + windowSize);
    if (currentPage <= windowSize) endPage = Math.min(totalPages - 1, 2 * windowSize);
    if (currentPage >= totalPages - 1 - windowSize)
      startPage = Math.max(0, totalPages - 1 - 2 * windowSize);
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);
    return visiblePages;
  };

  const handleViewOrder = (order: ApprovedOrderLists) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const calculateOrderTotal = (items: OrderItemType[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                Orders
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Order History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all customer orders, track order status and details.
            </p>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
            />
          </div>

          <Select
            value={String(query.limit)}
            onValueChange={(v) => setQuery((p) => ({ ...p, limit: +v, page: 0 }))}
          >
            <SelectTrigger className="w-28 h-9 rounded-xl border-border bg-muted/40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filters row */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Date Filters
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DatePicker label="From Date" date={fromDate} setDate={setFromDate} />
            <DatePicker label="To Date" date={toDate} setDate={setToDate} />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 rounded-xl text-xs border-border"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={applyFilters}
              className="h-8 rounded-xl text-xs min-w-[80px]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {isError ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Failed to load orders</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <OrderTableSkeleton rows={query.limit} />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No orders found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or date range
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Table</TableHead>
                <TableHead className="font-semibold">Items</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">
                    {order.order_id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {order.customer_name || "Guest"}
                      </p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      Table #{order.table_number}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm">{order.order_menu_items.length} items</p>
                      <p className="text-xs text-muted-foreground">
                        {order.order_menu_items.slice(0, 2).map((i) => i.menu_name).join(", ")}
                        {order.order_menu_items.length > 2 && "..."}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(calculateOrderTotal(order.order_menu_items))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_BADGE_VARIANTS[order.status] as any}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-accent/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* PAGINATION - Only show if more than 1 page */}
      {totalPages > 1 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="animate-pulse">Loading…</span>
              ) : (
                <>
                  Page{" "}
                  <span className="font-semibold text-foreground">
                    {currentPage + 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {totalPages}
                  </span>{" "}
                  •{" "}
                  <span className="font-semibold text-foreground">
                    {totalOrders}
                  </span>{" "}
                  orders total
                </>
              )}
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <div
                    className={cn(
                      "rounded-xl",
                      (isFirstPage || isLoading) && "pointer-events-none opacity-40"
                    )}
                  >
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </PaginationItem>

                {getVisiblePages().map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      className={cn(
                        "rounded-xl text-xs border",
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <div
                    className={cn(
                      "rounded-xl",
                      (isLastPage || isLoading) && "pointer-events-none opacity-40"
                    )}
                  >
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order Details</span>
                  <Badge variant={STATUS_BADGE_VARIANTS[selectedOrder.status] as any} className="capitalize">
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Summary */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Order ID</p>
                        <p className="font-mono text-sm font-semibold">
                          {selectedOrder.order_id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Table</p>
                        <p className="font-semibold">#{selectedOrder.table_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-semibold">{selectedOrder.customer_name || "Guest"}</p>
                        {selectedOrder.customer_phone && (
                          <p className="text-xs text-muted-foreground">{selectedOrder.customer_phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Waiter</p>
                        <p className="font-semibold">{selectedOrder.waiter_name}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                      <p className="text-sm">{fmtDate(selectedOrder.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.order_menu_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.menu_name}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              ×{item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {fmt(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-semibold font-mono">
                              {fmt(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-end">
                  <div className="w-64 rounded-xl bg-muted/30 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        {fmt(calculateOrderTotal(selectedOrder.order_menu_items))}
                      </span>
                    </div>
                    <div className="border-t border-border mt-2 pt-2 flex justify-between">
                      <span className="font-semibold">Grand Total</span>
                      <span className="text-lg font-bold text-accent">
                        {fmt(calculateOrderTotal(selectedOrder.order_menu_items))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- SKELETON ---------------- */
function OrderTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="animate-pulse">
        <div className="bg-muted/30 h-12" />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="border-t border-border p-4">
            <div className="grid grid-cols-8 gap-4">
              <div className="col-span-1 h-4 bg-muted rounded" />
              <div className="col-span-2 h-4 bg-muted rounded" />
              <div className="col-span-1 h-4 bg-muted rounded" />
              <div className="col-span-2 h-4 bg-muted rounded" />
              <div className="col-span-1 h-4 bg-muted rounded" />
              <div className="col-span-1 h-4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- DATE PICKER ---------------- */
function DatePicker({
  label,
  date,
  setDate,
}: {
  label: string;
  date?: Date;
  setDate: (d?: Date) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 justify-start rounded-xl border-border bg-muted/30 text-sm font-normal"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            {date ? (
              <span className="text-foreground">{format(date, "yyyy-MM-dd")}</span>
            ) : (
              <span className="text-muted-foreground">Select date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 rounded-2xl border border-border shadow-xl">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ after: TODAY }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}