"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, UtensilsCrossed, X, Menu, SlidersHorizontal, ImageOff, Package, Minus, Plus, Trash2 } from "lucide-react";
import { useGetCachedMenuItems } from "@/utils/hooks/tanstack-query/query-hook/customer/get-all-cached-menu-items";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";

// ── shadcn/ui ─────────────────────────────────────────────────────────────────
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables";
import { CreateCustomerOrderRequest } from "@/utils/types/order.types";
import { useCreateOrderRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-order-request";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItemsResponse {
  id: string;
  category_name: string;
  category_slug: string;
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CategoryMenuGroup = {
  category_name: string;
  category_slug: string;
  menu_items: MenuItemsResponse[];
};

export type GroupedMenuResponse = {
  [slug: string]: CategoryMenuGroup;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

// ── Skeleton ──────────────────────────────────────────────────────────────────

const MenuSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="w-full h-11 rounded-xl mb-3" />
        <div className="flex gap-2">
          {[80, 96, 112, 80].map((w, i) => (
            <Skeleton key={i} style={{ width: w }} className="h-9 rounded-full" />
          ))}
        </div>
      </div>
    </header>
    <div className="max-w-6xl mx-auto flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border p-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
      <main className="flex-1 px-4 py-5 sm:py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  </div>
);

// ── Category Filter — desktop left sidebar ────────────────────────────────────

interface CategoryFilterProps {
  slugs: string[];
  grouped: GroupedMenuResponse;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  slugs,
  grouped,
  selectedSlug,
  onSelect,
}) => (
  <ul className="space-y-0.5">
    {slugs.map((slug) => (
      <li key={slug}>
        <button
          onClick={() => onSelect(selectedSlug === slug ? null : slug)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedSlug === slug
              ? "bg-primary text-primary-foreground font-medium"
              : "text-foreground hover:bg-muted"
            }`}
        >
          {grouped[slug].category_name}
        </button>
      </li>
    ))}
  </ul>
);

// ── Mobile Category Header — horizontal scrolling chips ───────────────────────

interface MobileCategoryHeaderProps {
  slugs: string[];
  grouped: GroupedMenuResponse;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onOpenFilter: () => void;
}

const MobileCategoryHeader: React.FC<MobileCategoryHeaderProps> = ({
  slugs,
  grouped,
  selectedSlug,
  onSelect,
  onOpenFilter,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onOpenFilter}
      className="shrink-0 p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
    >
      <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
    </button>
    <div className="overflow-x-auto scrollbar-hide pb-1 flex-1">
      <div className="flex gap-2 min-w-max">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${!selectedSlug
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          All
        </button>
        {slugs.map((slug) => (
          <button
            key={slug}
            onClick={() => onSelect(selectedSlug === slug ? null : slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedSlug === slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            {grouped[slug].category_name}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Menu Items List ───────────────────────────────────────────────────────────

interface MenuItemsListProps {
  grouped: GroupedMenuResponse;
  visibleSlugs: string[];
  searchQuery: string;
}

const MenuItemsList: React.FC<MenuItemsListProps> = ({
  grouped,
  visibleSlugs,
  searchQuery,
}) => {
  const { addOrder } = useOrderStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] ?? 1;

  const incrementQty = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Number(((prev[id] ?? 1) + 0.5).toFixed(1)),
    }));
  };

  const decrementQty = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Number((Math.max(0.5, (prev[id] ?? 1) - 0.5)).toFixed(1)),
    }));
  };

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5) {
      const rounded = Math.round(numValue * 2) / 2;
      setQuantities((prev) => ({
        ...prev,
        [id]: Number(rounded.toFixed(1)),
      }));
    } else if (value === "" || value === "-") {
      setQuantities((prev) => ({
        ...prev,
        [id]: 0.5,
      }));
    }
  };

  const handleBlur = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.5) {
      setQuantities((prev) => ({
        ...prev,
        [id]: 0.5,
      }));
    }
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleSlugs
      .map((slug) => {
        const group = grouped[slug];
        const items = q
          ? group.menu_items.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q)
          )
          : group.menu_items;
        const sorted = [...items].sort(
          (a, b) =>
            a.display_order - b.display_order || a.name.localeCompare(b.name)
        );
        return { slug, category_name: group.category_name, items: sorted };
      })
      .filter((g) => g.items.length > 0);
  }, [grouped, visibleSlugs, searchQuery]);

  const handleAdd = (item: MenuItemsResponse) => {
    const qty = getQty(item.id);
    const ok = addOrder({
      menu_id: item.id,
      menu_name: item.name,
      menu_image: item.image_url || "",
      menu_price: item.price,
      quantity: qty,
    });
    if (!ok) toast.error("Failed to add item", { duration: 500 });
    else {
      toast.success(`${item.name} added`, { duration: 600 });
      setQuantities((prev) => ({
        ...prev,
        [item.id]: 1,
      }));
    }
  };

  if (filteredGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ImageOff className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-semibold text-lg">No items found</p>
        <p className="text-sm mt-1">Try a different category or search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filteredGroups.map(({ slug, category_name, items }) => (
        <section key={slug}>
          <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            {category_name}
          </h3>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group bg-card rounded-xl border border-border hover:shadow-md transition-all duration-300 overflow-hidden flex flex-row ${!item.is_available ? "opacity-60" : ""
                  }`}
              >
                <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="font-semibold text-card-foreground text-[15px] leading-tight truncate">
                        {item.name}
                      </h4>
                      {!item.is_available && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] uppercase tracking-wide"
                        >
                          Sold out
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base text-primary">
                      ₹{item.price.toFixed(0)}
                    </span>

                    {item.is_available && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => decrementQty(item.id)}
                          disabled={getQty(item.id) <= 0.5}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>

                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={getQty(item.id)}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onBlur={(e) => handleBlur(item.id, e.target.value)}
                          className="w-16 text-center text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => incrementQty(item.id)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleAdd(item)}
                          className="flex items-center gap-1 text-xs h-8 px-3 ml-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ADD
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 self-center m-3 rounded-xl overflow-hidden bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name || "image"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// ── Cart Item List (shared by both sidebars) ──────────────────────────────────

const CartItemList: React.FC = () => {
  const { orders, updateQuantity, removeOrder } = useOrderStore();

  const handleQtyChange = (menuId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5) {
      const rounded = Math.round(numValue * 2) / 2;
      updateQuantity(menuId, Number(rounded.toFixed(1)));
    }
  };

  const handleBlur = (menuId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.5) {
      updateQuantity(menuId, 0.5);
    }
  };

  const incrementQty = (menuId: string, currentQty: number) => {
    updateQuantity(menuId, Number(((currentQty + 0.5)).toFixed(1)));
  };

  const decrementQty = (menuId: string, currentQty: number) => {
    updateQuantity(menuId, Number((Math.max(0.5, currentQty - 0.5)).toFixed(1)));
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((item) => (
        <div
          key={item.menu_id}
          className="flex gap-2 p-1.5 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
        >
          <div className="shrink-0 w-10 h-10 rounded-md relative overflow-hidden bg-muted">
            {item.menu_image ? (
              <Image
                src={item.menu_image}
                alt={item.menu_name || "menu image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <UtensilsCrossed className="w-4 h-4 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h4 className="text-xs font-medium truncate">{item.menu_name}</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOrder(item.menu_id)}
                className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-0.5 -mr-1"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatCurrency(item.menu_price)} × {item.quantity}
            </p>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => decrementQty(item.menu_id, item.quantity)}
                  className="h-6 w-6"
                  disabled={item.quantity <= 0.5}
                >
                  <Minus className="w-2.5 h-2.5" />
                </Button>

                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={item.quantity}
                  onChange={(e) => handleQtyChange(item.menu_id, e.target.value)}
                  onBlur={(e) => handleBlur(item.menu_id, e.target.value)}
                  className="h-6 w-10 text-center text-[10px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => incrementQty(item.menu_id, item.quantity)}
                  className="h-6 w-6"
                >
                  <Plus className="w-2.5 h-2.5" />
                </Button>
              </div>

              <span className="text-xs font-medium">
                {formatCurrency(item.menu_price * item.quantity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Order Footer (shared by both sidebars) ────────────────────────────────────

interface OrderFooterProps {
  onClose?: () => void;
}

// ── Order Footer (shared by both sidebars) ────────────────────────────────────

interface OrderFooterProps {
  onClose?: () => void;
}

const OrderFooter: React.FC<OrderFooterProps> = ({ onClose }) => {
  const { orders, clearOrders, getTotalPrice } = useOrderStore();
  const { data, isLoading, error } = useGetTables(true);
  const { mutate: createOrder, isPending } = useCreateOrderRequest();
  const [selectedTable, setSelectedTable] = useState("");
  const [note, setNote] = useState("");

  const tables = data?.tables || [];
  const total = getTotalPrice();
  const isEmpty = orders.length === 0;
  const selectedTableObj = tables.find((t) => t.id === selectedTable);

  useEffect(() => {
    if (isEmpty) {
      setSelectedTable("");
      setNote("");
    }
  }, [isEmpty]);

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "empty": return "bg-green-500";
      case "occupied": return "bg-orange-500";
      case "booked": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const handleRequestOrder = () => {
    if (isEmpty) { toast.error("Cart is empty", { duration: 800 }); return; }
    if (!selectedTable) { toast.error("Please select a table", { duration: 800 }); return; }
    if (isPending) return;

    const payload: CreateCustomerOrderRequest = {
      table_number: selectedTableObj?.table_number || 0,
      note: note || undefined,
      order_menu_items: orders.map((o) => ({
        menu_item_id: o.menu_id,
        quantity: o.quantity,
        price: o.menu_price,
      })),
    };

    createOrder(payload, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "Order requested!");
          clearOrders();
          setSelectedTable("");
          setNote("");
          onClose?.();
        }
      },
      onError: (err) =>
        toast.error(err.message || "Failed to request order"),
    });
  };

  const handleClearCart = () => {
    clearOrders();
    setSelectedTable("");
    setNote("");
    toast.success("Cart cleared", { duration: 700 });
  };

  if (isEmpty) return null;

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Table Selection */}
      <div className="space-y-1.5">
        <Select
          value={selectedTable}
          onValueChange={setSelectedTable}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select table" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading tables…
              </SelectItem>
            ) : tables.length === 0 ? (
              <SelectItem value="empty" disabled>
                No tables available
              </SelectItem>
            ) : (
              tables.map((table) => (
                <SelectItem key={table.id} value={table.id} className="text-xs">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>Table {table.table_number}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {table.capacity}p
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getTableStatusColor(table.status)}`}
                      />
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedTableObj && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded">
            <span className="font-medium">Table {selectedTableObj.table_number}</span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
              {selectedTableObj.capacity} seats • {selectedTableObj.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Note Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-muted-foreground">
            Special Instructions
          </label>
          {note && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 px-1 text-[8px]"
              onClick={() => setNote("")}
            >
              Clear
            </Button>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any special requests..."
          rows={1}
          className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Cart Summary - Moved above actions for better visibility */}
      <div className="flex items-center justify-between text-xs py-1">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold text-primary">{formatCurrency(total)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1 h-9 text-xs font-medium"
          onClick={handleRequestOrder}
          disabled={!selectedTable || isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Placing...
            </span>
          ) : (
            `Place Order`
          )}
        </Button>

        {/* Clear Cart Button - Now more visible with text */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="h-9 px-3 text-xs font-medium border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isEmpty}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove all {orders.length} items from your cart.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0 sm:flex-1">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearCart}
                className="sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Error message if any */}
      {error && (
        <p className="text-[9px] text-destructive text-center">
          Failed to load tables
        </p>
      )}
    </div>
  );
};
// ── Desktop Order Sidebar ─────────────────────────────────────────────────────

const DesktopOrderSidebar: React.FC = () => {
  const { orders } = useOrderStore();

  return (
    <div className="w-96 bg-background border-l border-border flex flex-col h-full max-h-[calc(100vh-116px)]">
      {/* Header - fixed */}
      <div className="px-4 py-3 border-b shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Your Order</h2>
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {orders.length} {orders.length === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
          {orders.length > 0 && (
            <span className="text-sm font-medium text-primary">
              {formatCurrency(orders.reduce((sum, item) => sum + (item.menu_price * item.quantity), 0))}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable cart items - takes remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 py-3">
          <CartItemList />
        </div>
      </div>

      {/* Footer - fixed at bottom */}
      <div className="shrink-0 border-t bg-card">
        <OrderFooter />
      </div>
    </div>
  );
};

// ── Mobile Sidebar — shadcn Sheet ─────────────────────────────────────────────

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenuSidebar: React.FC<MobileSidebarProps> = ({
  open,
  onOpenChange,
}) => {
  const { orders } = useOrderStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85%] sm:w-96 p-0 flex flex-col h-full"
        onInteractOutside={(e) => {
          e.preventDefault();
          onOpenChange(false);
        }}
      >
        {/* Header - fixed */}
        <SheetHeader className="px-4 py-3 border-b shrink-0 bg-card">
          <SheetTitle className="text-left flex items-center justify-between">
            <div className="flex items-center gap-2">
              Your Order
              {orders.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {orders.length} {orders.length === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>

          </SheetTitle>
        </SheetHeader>

        {/* Scrollable cart items */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 py-3">
            <CartItemList />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-card">
          <OrderFooter onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const NewMenuItemsPage: React.FC = () => {
  const { data, isLoading, isError } = useGetCachedMenuItems(true);

  const [isMounted, setIsMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { orders } = useOrderStore();
  const count = orders.length;

  useEffect(() => { setIsMounted(true); }, []);

  const grouped_menu = data?.grouped_menu as GroupedMenuResponse | undefined;

  const allSlugs = useMemo(
    () => (grouped_menu ? Object.keys(grouped_menu) : []),
    [grouped_menu]
  );

  const visibleSlugs = useMemo(
    () => (selectedSlug ? [selectedSlug] : allSlugs),
    [selectedSlug, allSlugs]
  );

  const visibleItemCount = useMemo(() => {
    if (!grouped_menu) return 0;
    const q = searchQuery.trim().toLowerCase();
    return visibleSlugs.reduce((sum, slug) => {
      const items = grouped_menu[slug].menu_items;
      const filtered = q
        ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        )
        : items;
      return sum + filtered.length;
    }, 0);
  }, [grouped_menu, visibleSlugs, searchQuery]);

  const totalItems = orders.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orders.reduce((sum, item) => sum + (item.menu_price * item.quantity), 0);

  if (!isMounted || isLoading) return <MenuSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-semibold text-lg text-foreground">Error loading menu</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!grouped_menu || allSlugs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No menu data available</p>
      </div>
    );
  }

  const selectedCategoryName = selectedSlug
    ? grouped_menu[selectedSlug]?.category_name
    : null;

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky Header with Order Summary */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3">

          {/* First row: Logo, title, mobile hamburger */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">Our Menu</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {visibleItemCount} item{visibleItemCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Desktop order summary */}
            {orders.length > 0 && (
              <div className="hidden lg:flex items-center gap-3 bg-secondary/50 px-3 py-1.5 rounded-full">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="relative lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-[11px] font-bold rounded-full flex items-center justify-center leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 pr-9 sm:pr-10 py-1.5 sm:py-2.5 text-sm bg-secondary rounded-lg sm:rounded-xl border-none focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Mobile category chips */}
          <div className="lg:hidden">
            <MobileCategoryHeader
              slugs={allSlugs}
              grouped={grouped_menu}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              onOpenFilter={() => setMobileFilterOpen(true)}
            />
          </div>

          {/* Mobile cart indicator */}
          {orders.length > 0 && (
            <div className="lg:hidden mt-2 flex items-center justify-between bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">
                  {formatCurrency(totalPrice)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  View Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Active category strip (mobile only) */}
      {selectedCategoryName && (
        <div className="lg:hidden bg-secondary/50 px-4 py-2 flex items-center justify-between sticky top-[136px] sm:top-[152px] z-40 backdrop-blur-sm border-b border-border">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing:{" "}
            <span className="font-medium text-foreground">
              {selectedCategoryName}
            </span>
          </span>
          <button
            onClick={() => setSelectedSlug(null)}
            className="text-[10px] sm:text-xs bg-card text-secondary-foreground px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-muted transition-colors font-medium shadow-sm"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* 3-column body */}
      <div className="max-w-6xl mx-auto flex justify-between relative">

        {/* Desktop left: category sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border p-4 sticky top-[116px] h-[calc(100vh-116px)] overflow-y-auto">
          <button
            onClick={() => setSelectedSlug(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${!selectedSlug
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-muted"
              }`}
          >
            All Items
          </button>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4">
            Categories
          </h2>
          <CategoryFilter
            slugs={allSlugs}
            grouped={grouped_menu}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
          />
        </aside>

        {/* Center: menu items */}
        <main className="flex-1 px-4 py-5 sm:py-6 min-w-0">
          <MenuItemsList
            grouped={grouped_menu}
            visibleSlugs={visibleSlugs}
            searchQuery={searchQuery}
          />
        </main>

        {/* Desktop right: order sidebar */}
        <aside className="hidden lg:block w-96 shrink-0 sticky top-[116px] h-[calc(100vh-116px)]">
          <DesktopOrderSidebar />
        </aside>
      </div>

      {/* Mobile: order sheet */}
      <MobileMenuSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* Mobile: category filter sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-left">Categories</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full p-4">
            <button
              onClick={() => {
                setSelectedSlug(null);
                setMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${!selectedSlug
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
                }`}
            >
              All Items
            </button>
            <CategoryFilter
              slugs={allSlugs}
              grouped={grouped_menu}
              selectedSlug={selectedSlug}
              onSelect={(slug) => {
                setSelectedSlug(slug);
                setMobileFilterOpen(false);
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Quick scroll to top button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-background/80 backdrop-blur-sm z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </Button>
    </div>
  );
};

export default NewMenuItemsPage;