"use client"
import { useGetOrderRequestsByTableNumNPhone } from '@/utils/hooks/tanstack-query/query-hook/order/use-get-order-req-from-phone-n-table'
import { TableType } from '@/utils/types/table.types';
import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  ClockIcon, 
  PhoneIcon, 
  UserIcon, 
  ClipboardListIcon,
  SearchIcon,
  ShoppingBagIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CustomerOrderRequest, OrderItemType } from '@/utils/types/order.types';

function CustomerOrderRequestTracking({ tables }: { tables: TableType[] }) {
  const [tableNumber, setTableNumber] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  
  const { data, isLoading, isError, refetch } = useGetOrderRequestsByTableNumNPhone(
    phoneNumber, 
    tableNumber,
    true,
     // Don't auto-fetch, only fetch when search button is clicked
  );

  const handleSearch = () => {
    if (!tableNumber || !phoneNumber) {
      alert("Please select a table and enter a phone number");
      return;
    }
    setHasSearched(true);
    refetch();
  };

  const handleReset = () => {
    setTableNumber(0);
    setPhoneNumber("");
    setHasSearched(false);
  };

  const orderRequest = data?.order_request as CustomerOrderRequest | undefined;
  const hasOrders = orderRequest && orderRequest.order_items && orderRequest.order_items.length > 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total amount
  const calculateTotal = (items: OrderItemType[] = []) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="shadow-lg border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <ClipboardListIcon className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">Track Your Order</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Select your table and enter your phone number to view your order status
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="table-select" className="text-sm font-medium text-gray-700">
                Select Table
              </Label>
              <Select 
                value={tableNumber.toString()} 
                onValueChange={(value) => setTableNumber(parseInt(value))}
              >
                <SelectTrigger id="table-select" className="w-full border-orange-200 focus:ring-orange-500">
                  <SelectValue placeholder="Choose your table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.table_number.toString()}>
                      Table {table.table_number} {table.status === 'occupied' ? '(Occupied)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch}
                disabled={!tableNumber || !phoneNumber || isLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⌛</span> Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <SearchIcon className="h-4 w-4" /> Track Order
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-orange-200 text-gray-600 hover:bg-orange-50"
              >
                Reset
              </Button>
            </div>
          </div>

          <Separator className="my-6 bg-orange-100" />

          {/* Results Section */}
          {hasSearched && (
            <div className="space-y-4">
              {isLoading ? (
                // Loading Skeletons
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full bg-orange-100" />
                  <Skeleton className="h-32 w-full bg-orange-50" />
                  <Skeleton className="h-32 w-full bg-orange-50" />
                </div>
              ) : isError ? (
                // Error State
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircleIcon className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-800 font-semibold">Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Failed to load order details. Please try again.
                  </AlertDescription>
                </Alert>
              ) : !hasOrders ? (
                // No Orders Found
                <Alert className="border-orange-200 bg-orange-50">
                  <XCircleIcon className="h-5 w-5 text-orange-600" />
                  <AlertTitle className="text-orange-800 font-semibold">No Orders Found</AlertTitle>
                  <AlertDescription className="text-orange-700">
                    No orders found for Table {tableNumber} with phone {phoneNumber}.
                  </AlertDescription>
                </Alert>
              ) : (
                // Orders Found - Display Order Details
                <div className="space-y-6">
                  {/* Session Info Card */}
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-orange-600" />
                        Session Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Table:</span>
                          <span className="font-semibold text-gray-800">{orderRequest.table_session.table_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Opened:</span>
                          <span className="text-sm text-gray-800">{formatDate(orderRequest.table_session.open_time)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Info Card */}
                  {(orderRequest.customer_name || orderRequest.customer_phone || orderRequest.note) && (
                    <Card className="border-orange-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-orange-600" />
                          Customer Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {orderRequest.customer_name && (
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Name:</span>
                              <span className="font-medium text-gray-800">{orderRequest.customer_name}</span>
                            </div>
                          )}
                          {orderRequest.customer_phone && (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Phone:</span>
                              <span className="font-medium text-gray-800">{orderRequest.customer_phone}</span>
                            </div>
                          )}
                          {orderRequest.note && (
                            <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm text-gray-700 italic">"{orderRequest.note}"</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Items Card */}
                  <Card className="border-orange-200">
                    <CardHeader className="pb-2 bg-orange-50/50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <ClipboardListIcon className="h-5 w-5 text-orange-600" />
                          Order Items ({orderRequest.order_items.length})
                        </CardTitle>
                        <Badge variant="outline" className="bg-white border-orange-200 text-orange-700">
                          Total: ₹{calculateTotal(orderRequest.order_items)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {orderRequest.order_items.map((item, index) => (
                          <div key={item.id} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                            {/* Item Image */}
                            <div className="w-16 h-16 flex-shrink-0 bg-orange-50 rounded-lg overflow-hidden border border-orange-100">
                              {item.menu_image ? (
                                <img 
                                  src={item.menu_image} 
                                  alt={item.menu_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBagIcon className="h-6 w-6 text-orange-300" />
                                </div>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-800 truncate">{item.menu_name}</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Qty: {item.quantity} × ₹{item.price}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-orange-600">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(item.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Section */}
                      <div className="mt-6 pt-4 border-t border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Grand Total</span>
                          <span className="text-xl font-bold text-orange-600">
                            ₹{calculateTotal(orderRequest.order_items)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-orange-50/50 border-t border-orange-200 flex justify-between">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                        Order placed on {formatDate(orderRequest.table_session.created_at)}
                      </p>
                      {getStatusBadge('pending')}
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <SearchIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Search for your order</h3>
              <p className="text-gray-500">
                Select your table and enter your phone number to view your order status
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerOrderRequestTracking;