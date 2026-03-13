"use client";

import { Minus, Plus, Trash2, Phone, Search, User, Calendar, Clock, ShoppingBag, XCircle, Package, CheckCircle, Clock3, X, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables";
import { CreateCustomerOrderRequest, CustomerOrderRequest, OrderItemType, orderStatus } from "@/utils/types/order.types";
import { useCreateOrderRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-order-request";
import { useGetOrderRequestsByTableNumNPhone } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-order-req-from-phone-n-table";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMenuSidebar: React.FC<Props> = ({
  open,
  onOpenChange,
}) => {
  const {
    orders,
    updateQuantity,
    removeOrder,
    clearOrders,
    getTotalPrice,
  } = useOrderStore();

  const { data, isLoading, error } = useGetTables(true);
  const { mutate: create_customer_order, isPending: is_creating_order } = useCreateOrderRequest();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("order-request");

  // Track order states
  const [trackTableNumber, setTrackTableNumber] = useState("");
  const [trackPhoneNumber, setTrackPhoneNumber] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  
  const { 
    data: orderData, 
    isLoading: isTrackingLoading, 
    isError: isTrackingError, 
    refetch 
  } = useGetOrderRequestsByTableNumNPhone(
    trackPhoneNumber, 
    parseInt(trackTableNumber) || 0,
    true,
  );

  // Reset states when orders change
  useEffect(() => {
    if (orders.length === 0) {
      setSelectedTable("");
      setNote("");
    }
  }, [orders]);

  const tables = data?.tables || [];
  const total = getTotalPrice();
  const isEmpty = orders.length === 0;

  // Find the selected table object
  const selectedTableObj = tables.find(t => t.id === selectedTable);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleQuantityChange = (menuId: string, value: number) => {
    const roundedValue = Math.round(value * 10) / 10;
    updateQuantity(menuId, Math.max(1, roundedValue));
  };

  const handleRequestOrder = async () => {
    if (isEmpty) {
      toast.error("Cart is empty", { duration: 800 });
      return;
    }

    if (!selectedTable) {
      toast.error("Please select a table", { duration: 800 });
      return;
    }

    if (is_creating_order) return;
    const orderMenuItems = orders.map(order => ({
      menu_item_id: order.menu_id,
      quantity: order.quantity,
      price: order.menu_price
    }));

    const customerOrderRequest: CreateCustomerOrderRequest = {
      table_number: selectedTableObj?.table_number || 0,
      note: note || undefined,
      order_menu_items: orderMenuItems
    };

    create_customer_order(customerOrderRequest, {
      onSuccess: (res) => {
        if (res.success && res.message) {
          toast.success(res.message || "successfully requested order")
          clearOrders();
          setSelectedTable("")
          setNote("")
          onOpenChange(false)
        }
      },
      onError: (err) => {
        toast.error(err.message || "failed to request order")
      }
    })
  };

  // Format phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setTrackPhoneNumber(value);
    }
  };

  const handleTrackSearch = () => {
    if (!trackTableNumber || !trackPhoneNumber) {
      toast.error("Please enter table number and phone number");
      return;
    }
    if (trackPhoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setHasSearched(true);
    refetch();
  };

  const handleTrackReset = () => {
    setTrackTableNumber("");
    setTrackPhoneNumber("");
    setHasSearched(false);
  };

  const orderRequest = orderData?.order_request as CustomerOrderRequest | undefined;
  const hasOrders = orderRequest && orderRequest.order_items && orderRequest.order_items.length > 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total amount
  const calculateTotal = (items: OrderItemType[] = []) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Get order status badge with appropriate styling and icon
  const getOrderStatusBadge = (status: orderStatus) => {
    const statusConfig = {
      'approved': { 
        label: 'Approved', 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600'
      },
      'not-approved': { 
        label: 'Pending Approval', 
        icon: Clock3, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600'
      },
      'progress': { 
        label: 'In Progress', 
        icon: Clock, 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-600'
      },
      'completed': { 
        label: 'Completed', 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600'
      },
      'cancelled': { 
        label: 'Cancelled', 
        icon: X, 
        className: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600'
      }
    };

    const config = statusConfig[status] || statusConfig['not-approved'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1 px-2 py-0.5 text-xs font-medium`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {config.label}
      </Badge>
    );
  };

  // Get item status badge for individual items
  const getItemStatusBadge = (status: orderStatus) => {
    const statusConfig = {
      'approved': { label: 'Approved', className: 'bg-green-100 text-green-800' },
      'not-approved': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'progress': { label: 'Preparing', className: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Ready', className: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "empty": return "bg-green-500";
      case "occupied": return "bg-orange-500";
      case "booked": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  // Get order status color for the main order
  const getOrderStatusColor = (status: orderStatus) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "not-approved": return "bg-yellow-500";
      case "progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85%] sm:w-96 p-0 flex flex-col h-full"
        onInteractOutside={(e) => {
          // This allows clicking outside to close
          e.preventDefault();
          onOpenChange(false);
        }}
      >
        {/* Header - Fixed at top */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-left">
            <span>Menu</span>
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          defaultValue="order-request"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent shrink-0">
            <TabsTrigger
              value="order-request"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Order Request
            </TabsTrigger>
            <TabsTrigger
              value="your-orders"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Your Orders
            </TabsTrigger>
          </TabsList>

          {/* Order Request Tab - Shows cart items with note */}
          <TabsContent value="order-request" className="flex-1 flex flex-col min-h-0 mt-0">
            {/* Table Selection */}
            <div className="px-4 py-3 border-b bg-muted/20 shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Select Table
                  </label>
                  {selectedTableObj && (
                    <Badge
                      className={`${getTableStatusColor(selectedTableObj.status)} text-white text-xs`}
                    >
                      {selectedTableObj.status}
                    </Badge>
                  )}
                </div>

                <Select
                  value={selectedTable}
                  onValueChange={setSelectedTable}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading tables...
                      </SelectItem>
                    ) : tables.length === 0 ? (
                      <SelectItem value="no-tables" disabled>
                        No available tables
                      </SelectItem>
                    ) : (
                      tables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-medium">Table {table.table_number}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Cap: {table.capacity}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${getTableStatusColor(table.status)}`} />
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Selected Table Info */}
                {selectedTableObj && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Capacity: {selectedTableObj.capacity} seats</span>
                    <span>Table ID: {selectedTableObj.id.slice(0, 6)}...</span>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <p className="text-xs text-destructive mt-1">
                    Failed to load tables
                  </p>
                )}
              </div>
            </div>

            {/* Note Textarea */}
            {!isEmpty && (
              <div className="px-4 py-3 border-b bg-muted/20 shrink-0">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Special Instructions (Optional)
                  </label>
                  <Textarea
                    placeholder="Add any special requests or notes for your order..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-15 text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* Orders List - Scrollable area */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full px-4 py-3">
                {isEmpty ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Your cart is empty
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-50">
                      Add delicious items from the menu to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((item) => (
                      <div
                        key={item.menu_id}
                        className="flex gap-2.5 p-2 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        {/* Avatar */}
                        <div className="shrink-0">
                          <Avatar className="w-14 h-14 rounded-md">
                            {item.menu_image ? (
                              <AvatarImage
                                src={item.menu_image}
                                alt={item.menu_name}
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">
                                {item.menu_name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-sm font-medium truncate pr-1">
                              {item.menu_name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOrder(item.menu_id)}
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                              aria-label={`Remove ${item.menu_name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.menu_price)}
                          </p>

                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.menu_id, item.quantity - 0.5)}
                              className="h-7 w-7"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <Input
                              type="number"
                              min={1}
                              step={0.5}
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 1;
                                handleQuantityChange(item.menu_id, value);
                              }}
                              className="h-7 w-16 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.menu_id, item.quantity + 0.5)}
                              className="h-7 w-7"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>

                            <span className="text-xs font-medium ml-auto">
                              {formatCurrency(item.menu_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show total items count at bottom of scroll */}
                    <div className="text-xs text-center text-muted-foreground py-2">
                      {orders.length} items in cart • Total: {formatCurrency(total)}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Your Orders Tab - Simplified Mobile-Friendly Tracking */}
          <TabsContent value="your-orders" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Simple Search Form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Table Number
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter table number"
                      value={trackTableNumber}
                      onChange={(e) => setTrackTableNumber(e.target.value)}
                      className="w-full"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={trackPhoneNumber}
                        onChange={handlePhoneChange}
                        className="pl-9 w-full"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleTrackSearch}
                      disabled={!trackTableNumber || !trackPhoneNumber || trackPhoneNumber.length !== 10 || isTrackingLoading}
                      className="flex-1"
                    >
                      {isTrackingLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Searching
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Track Order
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleTrackReset}
                      className="px-3"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Search Results */}
                {hasSearched && (
                  <div className="space-y-4">
                    {isTrackingLoading ? (
                      // Loading State
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : isTrackingError ? (
                      // Error State
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Failed to load orders</p>
                        <p className="text-xs text-muted-foreground mt-1">Please try again</p>
                      </div>
                    ) : !hasOrders ? (
                      // No Orders Found
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No Orders Found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Table {trackTableNumber} • {trackPhoneNumber}
                        </p>
                      </div>
                    ) : orderRequest && (
                      // Order Details - Enhanced with IDs and Status
                      <div className="space-y-4">
                        {/* Order Header with ID and Status */}
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-orange-700">
                                Order #{orderRequest.id.slice(0, 8)}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${getOrderStatusColor(orderRequest.status)}`} />
                            </div>
                            {getOrderStatusBadge(orderRequest.status)}
                          </div>
                          
                          {/* Session Info */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-orange-600">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(orderRequest.table_session.open_time)}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-white">
                              Table {orderRequest.table_session.table_number}
                            </Badge>
                          </div>

                          {/* Customer Info */}
                          {(orderRequest.customer_name || orderRequest.customer_phone) && (
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              {orderRequest.customer_name && (
                                <div className="flex items-center gap-1 text-xs text-orange-700">
                                  <User className="h-3 w-3" />
                                  <span className="font-medium">{orderRequest.customer_name}</span>
                                </div>
                              )}
                              {orderRequest.customer_phone && (
                                <div className="flex items-center gap-1 text-xs text-orange-700 mt-0.5">
                                  <Phone className="h-3 w-3" />
                                  <span>{orderRequest.customer_phone}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Note if exists */}
                          {orderRequest.note && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-100/50 p-1.5 rounded">
                              <span className="font-medium">Note:</span> {orderRequest.note}
                            </div>
                          )}
                        </div>

                        {/* Items List with Individual Status */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Items ({orderRequest.order_items.length})
                          </p>
                          {orderRequest.order_items.map((item) => (
                            <div key={item.id} className="flex gap-2 bg-gray-50 rounded-lg p-2">
                              <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                {item.menu_image ? (
                                  <img src={item.menu_image} alt={item.menu_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">{item.menu_name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-semibold">₹{item.price}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      ₹{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-muted-foreground">
                                    ID: {item.id.slice(0, 6)}...
                                  </span>
                                  {getItemStatusBadge(item.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-sm font-medium">Total Amount</span>
                          <span className="text-lg font-bold text-orange-600">
                            ₹{calculateTotal(orderRequest.order_items).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Initial State */}
                {!hasSearched && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Track Your Order</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your table and phone number to see your order status
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer - Only show in Order Request tab when cart has items */}
        {activeTab === "order-request" && !isEmpty && (
          <div className="border-t bg-background px-4 py-2 shrink-0 space-y-1">
            <Separator className="mb-2" />

            {/* Total */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-base">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Selected Table Summary */}
            {selectedTableObj && (
              <div className="bg-muted/30 p-2 rounded-lg text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Table {selectedTableObj.table_number}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedTableObj.capacity} seats
                  </Badge>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleRequestOrder}
                disabled={isEmpty || is_creating_order || !selectedTable}
                className="w-full h-10 text-sm font-medium"
              >
                {is_creating_order ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Requesting...
                  </>
                ) : (
                  'Request Order'
                )}
              </Button>

              {/* Clear Cart with Confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isEmpty}
                    className="w-full h-9 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear Cart
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">
                      Clear your cart?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This action cannot be undone. All {orders.length} items will be removed from your cart.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
                    <AlertDialogCancel className="mt-0 flex-1">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearOrders();
                        setSelectedTable("");
                        setNote("");
                        toast.success("Cart cleared", { duration: 700 });
                      }}
                      className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Tax/Delivery info */}
            <p className="text-[10px] text-center text-muted-foreground pt-1">
              Taxes and delivery charges calculated at checkout
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};