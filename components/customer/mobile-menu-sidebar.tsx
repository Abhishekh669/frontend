"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
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
import { CreateCustomerOrderRequest } from "@/utils/types/order.types";
import { useCreateOrderRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-order-request";

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
  const {mutate : create_customer_order, isPending : is_creating_order} = useCreateOrderRequest();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("order-request");
  
  // Track order states
  const [trackTableNumber, setTrackTableNumber] = useState("");
  const [trackPhoneNumber, setTrackPhoneNumber] = useState("");

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

  // Filter available tables (empty ones)

  
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

    if(is_creating_order)return;
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
      onSuccess : (res) =>{
        if(res.success && res.message){
          toast.success(res.message || "successfully requested order")
          clearOrders();
          setSelectedTable("")
          setNote("")
          onOpenChange(false)
        }
      },
      onError : (err ) =>{
        toast.error(err.message || "failed to request order")
      }
    })
   
  };

  const handleTrackOrder = () => {
    if (!trackTableNumber || !trackPhoneNumber) {
      toast.error("Please enter table number and phone number", { duration: 800 });
      return;
    }

    if (trackPhoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number", { duration: 800 });
      return;
    }

    // Here you would typically fetch the order status
    toast.success(`Tracking order for Table ${trackTableNumber}`, { duration: 800 });
    
    // Reset tracking fields
    setTrackTableNumber("");
    setTrackPhoneNumber("");
  };

  // Get status badge color
  const getTableStatusColor = (status: string) => {
    switch(status) {
      case "empty": return "bg-green-500";
      case "occupied": return "bg-orange-500";
      case "booked": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  // Format phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setTrackPhoneNumber(value);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 sm:w-96 p-0 flex flex-col h-full"
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
          className="flex-1 flex flex-col min-h-0"
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
                      <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
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

          {/* Your Orders Tab - Track orders with table number and phone */}
          <TabsContent value="your-orders" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="flex-1 px-4 py-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Track Your Order</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your table number and phone number to track your order status
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Table Number Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Table Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter table number (e.g., 5)"
                      value={trackTableNumber}
                      onChange={(e) => setTrackTableNumber(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={trackPhoneNumber}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      className="h-11 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the phone number used when placing the order
                    </p>
                  </div>

                  {/* Track Button */}
                  <Button
                    onClick={handleTrackOrder}
                    disabled={!trackTableNumber || !trackPhoneNumber || trackPhoneNumber.length !== 10}
                    className="w-full h-11 text-base mt-4"
                  >
                    Track Order
                  </Button>

                  {/* Recent Orders Preview (Optional) */}
                  <div className="mt-8">
                    <h4 className="text-sm font-medium mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {/* This would be populated from an API */}
                      <div className="text-center text-sm text-muted-foreground py-8">
                        <p>No recent orders found</p>
                        <p className="text-xs mt-1">
                          Your order history will appear here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
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