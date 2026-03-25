"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search, UtensilsCrossed, X, ImageOff, Minus, Plus,
  Trash2, ChevronUp, ShoppingBag, Sparkles, ChevronDown,
} from "lucide-react";
import { useGetCachedMenuItems } from "@/utils/hooks/tanstack-query/query-hook/customer/get-all-cached-menu-items";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
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
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

// ── Skeleton ──────────────────────────────────────────────────────────────────

const MenuSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    {/* Header */}
    <div className="h-14 bg-card border-b border-border flex items-center gap-3 px-4">
      <Skeleton className="w-8 h-8 rounded-2xl bg-muted shrink-0" />
      <Skeleton className="flex-1 h-9 rounded-2xl bg-muted" />
      <Skeleton className="w-9 h-9 rounded-2xl bg-muted shrink-0" />
    </div>
    {/* Category accordion skeletons */}
    <div className="max-w-6xl mx-auto flex">
      <div className="flex-1 px-4 sm:px-6 py-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="hidden lg:block w-[340px] xl:w-[360px] shrink-0 border-l border-border p-4 space-y-3">
        <Skeleton className="h-12 w-full rounded-2xl bg-muted" />
        <Skeleton className="h-24 w-full rounded-2xl bg-muted" />
        <Skeleton className="h-12 w-full rounded-2xl bg-muted" />
      </div>
    </div>
  </div>
);

// ── Single Menu Item Row (inside accordion) ───────────────────────────────────

interface MenuItemRowProps {
  item: MenuItemsResponse;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onQtyChange: (v: string) => void;
  onQtyBlur: (v: string) => void;
  onAdd: () => void;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item, qty, onIncrement, onDecrement, onQtyChange, onQtyBlur, onAdd,
}) => (
  <div
    className={`group flex items-center gap-3 sm:gap-4 px-4 py-3.5 border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors ${
      !item.is_available ? "opacity-50 pointer-events-none" : ""
    }`}
  >
    {/* Thumbnail */}
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border">
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="80px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="w-5 h-5 text-muted-foreground/25" />
        </div>
      )}
      {!item.is_available && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Sold out</span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{item.name}</p>
      {item.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">{item.description}</p>
      )}
      <p className="text-sm font-black text-accent mt-1.5 leading-none">₹{item.price.toFixed(0)}</p>
    </div>

    {/* Controls */}
    {item.is_available && (
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Stepper */}
        <div className="flex items-center bg-muted/70 rounded-xl border border-border overflow-hidden">
          <button
            onClick={onDecrement}
            disabled={qty <= 0.5}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            onBlur={(e) => onQtyBlur(e.target.value)}
            className="w-9 text-center text-xs font-bold bg-transparent focus:outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={onIncrement}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {/* Add */}
        <button
          onClick={onAdd}
          className="h-7 px-3 rounded-xl bg-accent text-accent-foreground text-[11px] font-bold tracking-wider hover:bg-accent/85 active:scale-95 transition-all shadow-sm"
        >
          ADD
        </button>
      </div>
    )}
  </div>
);

// ── Category Accordion ────────────────────────────────────────────────────────

interface CategoryAccordionProps {
  slug: string;
  category_name: string;
  items: MenuItemsResponse[];
  previewImage?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  quantities: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onQtyChange: (id: string, v: string) => void;
  onQtyBlur: (id: string, v: string) => void;
  onAdd: (item: MenuItemsResponse) => void;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  category_name, items, previewImage, isOpen, onToggle,
  quantities, onIncrement, onDecrement, onQtyChange, onQtyBlur, onAdd,
}) => {
  const availableCount = items.filter(i => i.is_available).length;

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all duration-300 ${
        isOpen
          ? "border-accent/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.18)]"
          : "border-border hover:border-accent/25 hover:shadow-sm"
      }`}
    >
      {/* ── Header row — always visible ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        {/* Category cover image */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border">
          {previewImage ? (
            <Image
              src={previewImage}
              alt={category_name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          {/* Gold shimmer on open */}
          {isOpen && (
            <div className="absolute inset-0 ring-2 ring-inset ring-accent/40 rounded-2xl pointer-events-none" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-base sm:text-lg font-bold leading-tight tracking-tight transition-colors ${
            isOpen ? "text-accent" : "text-foreground"
          }`}>
            {category_name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {availableCount} of {items.length} available
          </p>
        </div>

        {/* Item count pill + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
            isOpen
              ? "bg-accent/15 border-accent/30 text-accent"
              : "bg-muted/60 border-border text-muted-foreground"
          }`}>
            {items.length} items
          </span>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isOpen ? "bg-accent text-accent-foreground rotate-180" : "bg-muted text-muted-foreground"
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* ── Expanded items ── */}
      {isOpen && (
        <div className="bg-card border-t border-border/50">
          {items.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              qty={quantities[item.id] ?? 1}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
              onQtyChange={(v) => onQtyChange(item.id, v)}
              onQtyBlur={(v) => onQtyBlur(item.id, v)}
              onAdd={() => onAdd(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Search Results (flat list, bypasses accordion) ────────────────────────────

interface SearchResultsProps {
  results: { item: MenuItemsResponse; category_name: string }[];
  quantities: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onQtyChange: (id: string, v: string) => void;
  onQtyBlur: (id: string, v: string) => void;
  onAdd: (item: MenuItemsResponse) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results, quantities, onIncrement, onDecrement, onQtyChange, onQtyBlur, onAdd,
}) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-muted-foreground/25" />
          </div>
          <div className="absolute -inset-3 rounded-[2.5rem] border border-border/30 pointer-events-none" />
        </div>
        <p className="text-sm font-bold text-foreground">Nothing found</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[180px]">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      </div>
      {results.map(({ item, category_name }) => (
        <div key={item.id}>
          <MenuItemRow
            item={item}
            qty={quantities[item.id] ?? 1}
            onIncrement={() => onIncrement(item.id)}
            onDecrement={() => onDecrement(item.id)}
            onQtyChange={(v) => onQtyChange(item.id, v)}
            onQtyBlur={(v) => onQtyBlur(item.id, v)}
            onAdd={() => onAdd(item)}
          />
        </div>
      ))}
    </div>
  );
};

// ── Main Menu Content (accordion browse) ─────────────────────────────────────

interface MenuContentProps {
  grouped: GroupedMenuResponse;
  allSlugs: string[];
  searchQuery: string;
}

const MenuContent: React.FC<MenuContentProps> = ({ grouped, allSlugs, searchQuery }) => {
  const { addOrder } = useOrderStore();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] ?? 1;
  const incrementQty = (id: string) => setQuantities(p => ({ ...p, [id]: Number(((p[id] ?? 1) + 0.5).toFixed(1)) }));
  const decrementQty = (id: string) => setQuantities(p => ({ ...p, [id]: Number((Math.max(0.5, (p[id] ?? 1) - 0.5)).toFixed(1)) }));
  const handleQtyChange = (id: string, value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n) && n >= 0.5) setQuantities(p => ({ ...p, [id]: Number((Math.round(n * 2) / 2).toFixed(1)) }));
    else if (value === "" || value === "-") setQuantities(p => ({ ...p, [id]: 0.5 }));
  };
  const handleQtyBlur = (id: string, value: string) => {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0.5) setQuantities(p => ({ ...p, [id]: 0.5 }));
  };

  const handleAdd = useCallback((item: MenuItemsResponse) => {
    const qty = getQty(item.id);
    const ok = addOrder({ menu_id: item.id, menu_name: item.name, menu_image: item.image_url || "", menu_price: item.price, quantity: qty });
    if (!ok) toast.error("Failed to add item", { duration: 500 });
    else {
      toast.success(`${item.name} added`, { duration: 600 });
      setQuantities(p => ({ ...p, [item.id]: 1 }));
    }
  }, [addOrder, quantities]);

  const toggleSlug = (slug: string) => setOpenSlug(prev => prev === slug ? null : slug);

  // Search — flat list bypassing accordion
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: { item: MenuItemsResponse; category_name: string }[] = [];
    allSlugs.forEach(slug => {
      grouped[slug].menu_items.forEach(item => {
        if (item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) {
          results.push({ item, category_name: grouped[slug].category_name });
        }
      });
    });
    return results;
  }, [searchQuery, allSlugs, grouped]);

  if (isSearching) {
    return (
      <SearchResults
        results={searchResults}
        quantities={quantities}
        onIncrement={incrementQty}
        onDecrement={decrementQty}
        onQtyChange={handleQtyChange}
        onQtyBlur={handleQtyBlur}
        onAdd={handleAdd}
      />
    );
  }

  return (
    <div className="space-y-3">
      {allSlugs.map((slug) => {
        const group = grouped[slug];
        const sortedItems = [...group.menu_items].sort(
          (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
        );
        const previewImage = sortedItems.find(i => i.image_url)?.image_url;

        return (
          <CategoryAccordion
            key={slug}
            slug={slug}
            category_name={group.category_name}
            items={sortedItems}
            previewImage={previewImage}
            isOpen={openSlug === slug}
            onToggle={() => toggleSlug(slug)}
            quantities={quantities}
            onIncrement={incrementQty}
            onDecrement={decrementQty}
            onQtyChange={handleQtyChange}
            onQtyBlur={handleQtyBlur}
            onAdd={handleAdd}
          />
        );
      })}
    </div>
  );
};

// ── Cart Item List ────────────────────────────────────────────────────────────

const CartItemList: React.FC = () => {
  const { orders, updateQuantity, removeOrder } = useOrderStore();

  const handleQtyChange = (menuId: string, value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n) && n >= 0.5) updateQuantity(menuId, Number((Math.round(n * 2) / 2).toFixed(1)));
  };
  const handleBlur = (menuId: string, value: string) => {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0.5) updateQuantity(menuId, 0.5);
  };
  const increment = (id: string, qty: number) => updateQuantity(id, Number((qty + 0.5).toFixed(1)));
  const decrement = (id: string, qty: number) => updateQuantity(id, Number((Math.max(0.5, qty - 0.5)).toFixed(1)));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-3xl bg-muted/50 border border-border flex items-center justify-center mb-3">
          <ShoppingBag className="w-6 h-6 text-muted-foreground/25" />
        </div>
        <p className="text-sm font-bold text-foreground">Cart is empty</p>
        <p className="text-[11px] text-muted-foreground mt-1">Browse the menu to add dishes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((item) => (
        <div
          key={item.menu_id}
          className="flex gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group"
        >
          <div className="shrink-0 w-11 h-11 rounded-2xl overflow-hidden bg-muted border border-border relative">
            {item.menu_image ? (
              <Image src={item.menu_image} alt={item.menu_name} fill className="object-cover" sizes="44px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-muted-foreground/25" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className="text-[13px] font-semibold line-clamp-1 flex-1">{item.menu_name}</p>
              <button
                onClick={() => removeOrder(item.menu_id)}
                className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(item.menu_price)} each</p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center bg-muted/60 rounded-lg border border-border/60 overflow-hidden">
                <button
                  onClick={() => decrement(item.menu_id, item.quantity)}
                  disabled={item.quantity <= 0.5}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={item.quantity}
                  onChange={(e) => handleQtyChange(item.menu_id, e.target.value)}
                  onBlur={(e) => handleBlur(item.menu_id, e.target.value)}
                  className="w-9 text-center text-[11px] font-bold bg-transparent focus:outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => increment(item.menu_id, item.quantity)}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-sm font-black text-accent">{formatCurrency(item.menu_price * item.quantity)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Order Footer ──────────────────────────────────────────────────────────────

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

  useEffect(() => { if (isEmpty) { setSelectedTable(""); setNote(""); } }, [isEmpty]);

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "empty": return "bg-emerald-500";
      case "occupied": return "bg-amber-500";
      case "booked": return "bg-blue-500";
      default: return "bg-muted-foreground";
    }
  };

  const handleRequestOrder = () => {
    if (isEmpty) { toast.error("Cart is empty", { duration: 800 }); return; }
    if (!selectedTable) { toast.error("Please select a table", { duration: 800 }); return; }
    if (isPending) return;

    const payload: CreateCustomerOrderRequest = {
      table_number: selectedTableObj?.table_number || 0,
      note: note || undefined,
      order_menu_items: orders.map((o) => ({ menu_item_id: o.menu_id, quantity: o.quantity, price: o.menu_price })),
    };

    createOrder(payload, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "Order requested!");
          clearOrders(); setSelectedTable(""); setNote(""); onClose?.();
        }
      },
      onError: (err) => toast.error(err.message || "Failed to request order"),
    });
  };

  const handleClearCart = () => {
    clearOrders(); setSelectedTable(""); setNote("");
    toast.success("Cart cleared", { duration: 700 });
  };

  if (isEmpty) return null;

  return (
    <div className="p-4 space-y-3">
      {/* Table select */}
      <Select value={selectedTable} onValueChange={setSelectedTable} disabled={isLoading}>
        <SelectTrigger className="h-10 text-sm rounded-2xl border-border bg-muted/40 font-medium">
          <SelectValue placeholder="Select a table…" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading tables…</SelectItem>
          ) : tables.length === 0 ? (
            <SelectItem value="empty" disabled>No tables available</SelectItem>
          ) : (
            tables.map((table) => (
              <SelectItem key={table.id} value={table.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span>Table {table.table_number}</span>
                  <span className="text-xs text-muted-foreground">{table.capacity}p</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTableStatusColor(table.status)}`} />
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedTableObj && (
        <div className="flex items-center gap-2 bg-accent/8 border border-accent/20 rounded-2xl px-3 py-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${getTableStatusColor(selectedTableObj.status)}`} />
          <span className="text-xs font-bold flex-1">Table {selectedTableObj.table_number}</span>
          <span className="text-[10px] text-muted-foreground">{selectedTableObj.capacity} seats · {selectedTableObj.status}</span>
        </div>
      )}

      {/* Note */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Special Instructions</label>
          {note && (
            <button onClick={() => setNote("")} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
              Clear
            </button>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, preferences…"
          rows={2}
          className="w-full text-xs border border-border rounded-2xl px-3 py-2.5 bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Subtotal</span>
        <span className="text-xl font-black text-accent">{formatCurrency(total)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleRequestOrder}
          disabled={!selectedTable || isPending}
          className="flex-1 h-11 rounded-2xl bg-accent text-accent-foreground text-sm font-bold tracking-wide hover:bg-accent/85 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              Placing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Place Order
            </>
          )}
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={isEmpty}
              className="h-11 w-11 rounded-2xl border border-border bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[88%] max-w-sm rounded-3xl border border-border bg-card p-0 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <AlertDialogTitle className="text-base font-bold">Clear your cart?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
                This will remove all {orders.length} items. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-6 py-4 flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="rounded-2xl h-10 text-sm font-semibold border-border flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearCart}
                className="rounded-2xl h-10 text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && <p className="text-[10px] text-destructive text-center">Failed to load tables</p>}
    </div>
  );
};

// ── Desktop Order Sidebar ─────────────────────────────────────────────────────

const DesktopOrderSidebar: React.FC = () => {
  const { orders } = useOrderStore();
  const totalPrice = orders.reduce((s, i) => s + i.menu_price * i.quantity, 0);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)] bg-card border-l border-border">
      <div className="px-5 py-4 border-b border-border shrink-0 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold">Your Order</p>
              <p className="text-[10px] text-muted-foreground">
                {orders.length > 0 ? `${orders.length} item${orders.length > 1 ? "s" : ""}` : "Empty"}
              </p>
            </div>
          </div>
          {orders.length > 0 && (
            <span className="text-lg font-black text-accent">{formatCurrency(totalPrice)}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4"><CartItemList /></div>
      </div>

      <div className="shrink-0 border-t border-border">
        <OrderFooter />
      </div>
    </div>
  );
};

// ── Mobile Order Sheet ────────────────────────────────────────────────────────

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileOrderSheet: React.FC<MobileSidebarProps> = ({ open, onOpenChange }) => {
  const { orders } = useOrderStore();
  const totalPrice = orders.reduce((s, i) => s + i.menu_price * i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[88%] sm:w-[400px] p-0 flex flex-col"
        onInteractOutside={(e) => { e.preventDefault(); onOpenChange(false); }}
      >
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <SheetTitle className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold">Your Order</p>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    {orders.length > 0 ? `${orders.length} item${orders.length > 1 ? "s" : ""}` : "Empty"}
                  </p>
                </div>
              </div>
              {orders?.length > 0 && (
                <span className="text-lg font-black text-accent">{formatCurrency(totalPrice)}</span>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4"><CartItemList /></div>
        </div>

        <div className="shrink-0 border-t border-border">
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
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const { orders } = useOrderStore();
  const count = orders.length;
  const totalPrice = orders.reduce((s, i) => s + i.menu_price * i.quantity, 0);
  const totalItems = orders.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => { setIsMounted(true); }, []);

  const grouped_menu = data?.grouped_menu as GroupedMenuResponse | undefined;
  const allSlugs = useMemo(() => (grouped_menu ? Object.keys(grouped_menu) : []), [grouped_menu]);

  const totalMenuItems = useMemo(() => {
    if (!grouped_menu) return 0;
    return allSlugs.reduce((sum, slug) => sum + grouped_menu[slug].menu_items.length, 0);
  }, [grouped_menu, allSlugs]);

  if (!isMounted || isLoading) return <MenuSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-3xl">😕</div>
            <div className="absolute -inset-3 rounded-[2.5rem] border border-destructive/10 pointer-events-none" />
          </div>
          <p className="text-base font-bold">Failed to load menu</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Something went wrong. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-6 h-10 rounded-2xl bg-accent text-accent-foreground text-sm font-bold hover:bg-accent/85 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!grouped_menu || allSlugs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/25" />
          </div>
          <p className="text-sm font-bold">No menu available</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ HEADER — single row, no chips, no sidebar toggle ═══ */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-2xl bg-accent flex items-center justify-center shadow-sm shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">Our Menu</p>
              <p className="text-[10px] text-muted-foreground leading-none">
                {allSlugs.length} categories · {totalMenuItems} dishes
              </p>
            </div>
          </div>

          {/* Search — full flex width, with clear button INSIDE, neatly aligned */}
          <div className={`flex-1 relative flex items-center mx-1 sm:mx-3 h-9 rounded-2xl border transition-all duration-200 ${
            searchFocused
              ? "border-accent/50 bg-background shadow-[0_0_0_3px_rgba(var(--accent)/0.12)]"
              : "border-border bg-muted/40"
          }`}>
            <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-full pl-9 pr-9 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground text-foreground"
            />
            {/* Clear button — only shown when there's a query, right-aligned inside the pill */}
            {searchQuery && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); }}
                className="absolute right-2.5 w-5 h-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Cart button */}
          <button
            onClick={() => setMobileOrderOpen(true)}
            className="lg:hidden relative shrink-0 w-9 h-9 rounded-2xl border border-border bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-accent-foreground text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {/* Desktop cart summary pill */}
          {orders.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-2xl shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold">{totalItems}</span>
              <span className="h-3 w-px bg-border" />
              <span className="text-xs font-black text-accent">{formatCurrency(totalPrice)}</span>
            </div>
          )}
        </div>

        {/* Mobile: floating cart summary bar — shown below header when cart has items */}
        {orders.length > 0 && (
          <div className="lg:hidden mx-4 mb-3 flex items-center justify-between bg-accent/8 border border-accent/20 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold">
                {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-black text-accent">{formatCurrency(totalPrice)}</span>
              <button
                onClick={() => setMobileOrderOpen(true)}
                className="text-[11px] font-bold bg-accent text-accent-foreground px-3 h-7 rounded-xl hover:bg-accent/85 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══ BODY ═══ */}
      <div className="max-w-6xl mx-auto flex">

        {/* Center — accordion menu */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 min-w-0">
          <MenuContent
            grouped={grouped_menu}
            allSlugs={allSlugs}
            searchQuery={searchQuery}
          />
        </main>

        {/* Right — desktop order sidebar */}
        <aside className="hidden lg:block w-[340px] xl:w-[360px] shrink-0 sticky top-14 h-[calc(100vh-56px)]">
          <DesktopOrderSidebar />
        </aside>
      </div>

      {/* ═══ MOBILE ORDER SHEET ═══ */}
      <MobileOrderSheet open={mobileOrderOpen} onOpenChange={setMobileOrderOpen} />

      {/* ═══ SCROLL TO TOP FAB ═══ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-5 right-5 w-10 h-10 rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-50"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NewMenuItemsPage;
