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
import { Badge } from "@/components/ui/badge";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables";

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
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected table when orders change
  useEffect(() => {
    if (orders.length === 0) {
      setSelectedTable("");
    }
  }, [orders]);

  const tables = data?.tables || [];
  const total = getTotalPrice();
  const isEmpty = orders.length === 0;

  // Filter available tables (empty ones)
  const availableTables = tables.filter(table => table.status === "empty");
  
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

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Order requested for Table ${selectedTableObj?.table_number}`, { duration: 800 });
    clearOrders();
    setSelectedTable("");
    onOpenChange(false);
    setIsSubmitting(false);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 sm:w-96 p-0 flex flex-col gap-0"
      >
        {/* Header - Fixed at top */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-left flex items-center gap-2">
            <span>Your Order</span>
            {!isEmpty && (
              <span className="text-xs font-normal text-muted-foreground">
                ({orders.length} {orders.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Table Selection - Only show if there are orders */}
        {!isEmpty && (
          <div className="px-4 py-3 border-b bg-muted/20">
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
                  ) : availableTables.length === 0 ? (
                    <SelectItem value="no-tables" disabled>
                      No available tables
                    </SelectItem>
                  ) : (
                    availableTables.map((table) => (
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
        )}

        {/* Orders List - Scrollable area */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
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
              orders.map((item) => (
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
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-background px-4 py-3 shrink-0 space-y-3">
          <Separator className="mb-2" />

          {/* Total */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-base">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Selected Table Summary */}
          {selectedTableObj && !isEmpty && (
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
              disabled={isEmpty || isSubmitting || !selectedTable}
              className="w-full h-10 text-sm font-medium"
            >
              {isSubmitting ? (
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
          {!isEmpty && (
            <p className="text-[10px] text-center text-muted-foreground pt-1">
              Taxes and delivery charges calculated at checkout
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};