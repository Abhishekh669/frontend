"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  UtensilsCrossed,
  X,
  Menu,
  SlidersHorizontal,
  ImageOff,
  Package,
  Minus,
  Plus,
  Trash2,
  ClipboardList,
  ShoppingCart,
  Clock,
  CheckCircle2,
  ChefHat,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useGetCachedMenuItems } from "@/utils/hooks/tanstack-query/query-hook/customer/get-all-cached-menu-items";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";

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
import {
  CreateCustomerOrderRequest,
  CustomerOrderRequest,
  OrderItemType,
  orderStatus,
} from "@/utils/types/order.types";
import { useCreateOrderRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-order-request";
import Image from "next/image";
import { useGetOrderRequestsByTableNumNPhone } from "@/utils/hooks/tanstack-query/query-hook/order/use-get-order-req-from-phone-n-table";
import { useGetRecommendationMenuItems } from "@/utils/hooks/tanstack-query/query-hook/customer/use-get-recommneded-menu-items";
import { RecommendationMenuItemsResponse } from "@/utils/actions/algo/algo.get";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TableValidationType {
  id: string;
  table_number: number;
  phone_number: string;
  waiter_id?: string;
  created_at: Date;
  updated_at: Date;
}

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

const GOLD = "#d2a85a";
const GOLD_SUBTLE = "rgba(210,168,90,0.10)";
const GOLD_BORDER = "rgba(210,168,90,0.18)";

// ── Skeleton ──────────────────────────────────────────────────────────────────

const MenuSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-32 mb-2 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-full h-10 rounded-2xl mb-3" />
        <div className="flex gap-2">
          {[80, 96, 112, 80].map((w, i) => (
            <Skeleton key={i} style={{ width: w }} className="h-8 rounded-full" />
          ))}
        </div>
      </div>
    </header>
    <div className="max-w-6xl mx-auto flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border p-5">
        <Skeleton className="h-4 w-24 mb-4 rounded-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <main className="flex-1 px-4 py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  </div>
);

// ── Category Filter ───────────────────────────────────────────────────────────

interface CategoryFilterProps {
  slugs: string[];
  grouped: GroupedMenuResponse;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ slugs, grouped, selectedSlug, onSelect }) => (
  <ul className="space-y-0.5">
    {slugs.map((slug) => (
      <li key={slug}>
        <button
          onClick={() => onSelect(selectedSlug === slug ? null : slug)}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 flex items-center gap-2.5 ${selectedSlug === slug
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
        >
          {selectedSlug === slug && (
            <span className="w-1 h-4 rounded-full bg-current opacity-60 shrink-0" />
          )}
          {grouped[slug].category_name}
        </button>
      </li>
    ))}
  </ul>
);

// ── Mobile Category Header ────────────────────────────────────────────────────

interface MobileCategoryHeaderProps {
  slugs: string[];
  grouped: GroupedMenuResponse;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onOpenFilter: () => void;
}

const MobileCategoryHeader: React.FC<MobileCategoryHeaderProps> = ({
  slugs, grouped, selectedSlug, onSelect, onOpenFilter,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onOpenFilter}
      className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
    >
      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
    </button>
    <div className="overflow-x-auto scrollbar-hide pb-0.5 flex-1">
      <div className="flex gap-1.5 min-w-max">
        <button
          onClick={() => onSelect(null)}
          className={`px-3.5 h-8 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${!selectedSlug ? "bg-foreground text-background shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
        >
          All
        </button>
        {slugs.map((slug) => (
          <button
            key={slug}
            onClick={() => onSelect(selectedSlug === slug ? null : slug)}
            className={`px-3.5 h-8 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${selectedSlug === slug ? "bg-foreground text-background shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
          >
            {grouped[slug].category_name}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Recommendation Banner ─────────────────────────────────────────────────────
// ── Recommendation Banner ─────────────────────────────────────────────────────

interface RecommendationBannerProps {
  recommendedItems: MenuItemsResponse[];
  onDismiss: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  cartItemIds?: Set<string>; // Add this prop
}

const RecommendationBanner: React.FC<RecommendationBannerProps> = ({
  recommendedItems,
  onDismiss,
  onRefresh,
  isRefreshing = false,
  cartItemIds = new Set(), // Default to empty set
}) => {
  const { addOrder } = useOrderStore();

  const handleAdd = (item: MenuItemsResponse) => {
    const ok = addOrder({
      menu_id: item.id,
      menu_name: item.name,
      menu_image: item.image_url || "",
      menu_price: item.price,
      quantity: 1,
    });
    if (!ok) toast.error("Failed to add item", { duration: 500 });
    else toast.success(`${item.name} added`, { duration: 600 });
  };

  if (recommendedItems.length === 0) return null;

  return (
    <div
      className="mb-4 transition-all duration-300 ease-out"
      style={{ animation: "fadeSlideIn 0.25s ease-out" }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
          >
            <Sparkles className="w-2.5 h-2.5 text-[#1a1408]" />
          </div>
          <span className="text-[11px] font-bold text-foreground tracking-tight">
            Recommended for you
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-[#1a1408] shrink-0"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
          >
            {recommendedItems.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
            aria-label="Refresh recommendations"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onDismiss}
            className="h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Dismiss recommendations"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex gap-2 min-w-max pb-1">
          {recommendedItems.map((item) => {
            const isInCart = cartItemIds.has(item.id);
            return (
              <div
                key={item.id}
                className="w-32 shrink-0 bg-card rounded-lg border border-border overflow-hidden flex flex-col hover:border-[var(--accent)]/40 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="relative w-full h-20 bg-muted shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="128px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-[8px] font-semibold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-full border border-border">
                        Sold out
                      </span>
                    </div>
                  )}
                  {isInCart && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-[8px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Added
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <p className="text-[10px] font-semibold text-foreground line-clamp-2 leading-tight flex-1 min-h-[26px]">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-foreground">
                      ₹{item.price.toFixed(0)}
                    </span>
                    {item.is_available && !isInCart && (
                      <button
                        onClick={() => handleAdd(item)}
                        className="relative flex items-center justify-center gap-0.5 h-5 px-2 rounded-md text-[9px] font-bold text-[#1a1408] overflow-hidden transition-all hover:opacity-90 active:scale-[0.97] shrink-0"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
                      >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                        <Plus className="w-2 h-2" />
                        Add
                      </button>
                    )}
                    {item.is_available && isInCart && (
                      <button
                        disabled
                        className="relative flex items-center justify-center gap-0.5 h-5 px-2 rounded-md text-[9px] font-bold text-muted-foreground bg-muted/60 cursor-not-allowed shrink-0"
                      >
                        <CheckCircle2 className="w-2 h-2" />
                        Added
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Menu Items List ───────────────────────────────────────────────────────────

interface MenuItemsListProps {
  grouped: GroupedMenuResponse;
  visibleSlugs: string[];
  searchQuery: string;
}

const MenuItemsList: React.FC<MenuItemsListProps> = ({ grouped, visibleSlugs, searchQuery }) => {
  const { addOrder } = useOrderStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] ?? 1;

  const incrementQty = (id: string) =>
    setQuantities((prev) => ({ ...prev, [id]: Number(((prev[id] ?? 1) + 0.5).toFixed(1)) }));

  const decrementQty = (id: string) =>
    setQuantities((prev) => ({ ...prev, [id]: Number((Math.max(0.5, (prev[id] ?? 1) - 0.5)).toFixed(1)) }));

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5) {
      setQuantities((prev) => ({ ...prev, [id]: Number((Math.round(numValue * 2) / 2).toFixed(1)) }));
    } else if (value === "" || value === "-") {
      setQuantities((prev) => ({ ...prev, [id]: 0.5 }));
    }
  };

  const handleBlur = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.5) setQuantities((prev) => ({ ...prev, [id]: 0.5 }));
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleSlugs
      .map((slug) => {
        const group = grouped[slug];
        const items = q
          ? group.menu_items.filter(
            (item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
          )
          : group.menu_items;
        const sorted = [...items].sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
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
      setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    }
  };

  return (
    <div className="space-y-8">
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mb-4">
            <ImageOff className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">No items found</p>
          <p className="text-xs text-muted-foreground mt-1.5">Try a different category or search term</p>
        </div>
      ) : (
        filteredGroups.map(({ slug, category_name, items }) => (
          <section key={slug}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-1 h-5 rounded-full bg-[var(--accent)]" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                {category_name}
              </h3>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`group relative bg-card rounded-2xl border border-border hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-row ${!item.is_available ? "opacity-55" : ""
                    }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start gap-2 mb-1.5">
                        <h4 className="font-semibold text-card-foreground text-[14px] leading-tight">{item.name}</h4>
                        {!item.is_available && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-muted/60 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Sold out
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground text-[12px] leading-relaxed line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-[15px] text-foreground">₹{item.price.toFixed(0)}</span>
                      {item.is_available && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-0.5">
                            <button
                              onClick={() => decrementQty(item.id)}
                              disabled={getQty(item.id) <= 0.5}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={getQty(item.id)}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              onBlur={(e) => handleBlur(item.id, e.target.value)}
                              className="w-10 h-7 text-center text-[12px] font-medium bg-transparent text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => incrementQty(item.id)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleAdd(item)}
                            className="relative flex items-center gap-1.5 h-8 px-3.5 rounded-xl overflow-hidden text-[12px] font-semibold text-[#1a1408] shadow-sm transition-all hover:opacity-90 active:scale-[0.97]"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
                          >
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            <Plus className="w-3 h-3" />
                            ADD
                          </button>
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
                        <ImageOff className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

// ── Cart Item List ────────────────────────────────────────────────────────────

const CartItemList: React.FC = () => {
  const { orders, updateQuantity, removeOrder } = useOrderStore();

  const handleQtyChange = (menuId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5)
      updateQuantity(menuId, Number((Math.round(numValue * 2) / 2).toFixed(1)));
  };
  const handleBlur = (menuId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.5) updateQuantity(menuId, 0.5);
  };
  const incrementQty = (menuId: string, currentQty: number) =>
    updateQuantity(menuId, Number((currentQty + 0.5).toFixed(1)));
  const decrementQty = (menuId: string, currentQty: number) =>
    updateQuantity(menuId, Number((Math.max(0.5, currentQty - 0.5)).toFixed(1)));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mb-3">
          <Package className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-[12px] font-medium text-foreground">Cart is empty</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((item) => (
        <div
          key={item.menu_id}
          className="flex gap-2.5 p-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg relative overflow-hidden bg-muted border border-border">
            {item.menu_image ? (
              <Image src={item.menu_image} alt={item.menu_name || "menu image"} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h4 className="text-[12px] font-semibold truncate text-foreground">{item.menu_name}</h4>
              <button
                onClick={() => removeOrder(item.menu_id)}
                className="h-5 w-5 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors -mt-0.5 -mr-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              {formatCurrency(item.menu_price)} × {item.quantity}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => decrementQty(item.menu_id, item.quantity)}
                  disabled={item.quantity <= 0.5}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors disabled:opacity-30"
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
                  className="h-5 w-9 text-center text-[10px] font-medium bg-transparent text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => incrementQty(item.menu_id, item.quantity)}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[12px] font-semibold text-foreground">
                {formatCurrency(item.menu_price * item.quantity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Order Footer ──────────────────────────────────────────────────────────────

interface OrderFooterProps {
  table_validation: TableValidationType;
  onClose?: () => void;
}

const OrderFooter: React.FC<OrderFooterProps> = ({ table_validation, onClose }) => {
  const { orders, clearOrders, getTotalPrice } = useOrderStore();
  const { mutate: createOrder, isPending } = useCreateOrderRequest();
  const [note, setNote] = useState("");

  const total = getTotalPrice();
  const isEmpty = orders.length === 0;

  useEffect(() => { if (isEmpty) setNote(""); }, [isEmpty]);

  const handleRequestOrder = () => {
    if (isEmpty) { toast.error("Cart is empty", { duration: 800 }); return; }
    if (isPending) return;
    const payload: CreateCustomerOrderRequest = {
      table_number: table_validation.table_number,
      customer_phone: table_validation.phone_number,
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
          setNote("");
          onClose?.();
        }
      },
      onError: (err) => toast.error(err.message || "Failed to request order"),
    });
  };

  const handleClearCart = () => {
    clearOrders();
    setNote("");
    toast.success("Cart cleared", { duration: 700 });
  };

  if (isEmpty) return null;

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <UtensilsCrossed className="w-3 h-3 text-[var(--accent)]" />
          </div>
          <span className="text-[12px] font-medium text-foreground">Table {table_validation.table_number}</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-muted/60 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Confirmed
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-[0.10em] text-muted-foreground/60">Special Instructions</label>
          {note && (
            <button onClick={() => setNote("")} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline">
              Clear
            </button>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any special requests…"
          rows={2}
          className="w-full text-[12px] border border-border rounded-xl px-3 py-2 bg-muted/30 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/30 focus:border-ring/50 focus:bg-background transition-all placeholder:text-muted-foreground/40"
        />
      </div>
      <div className="flex items-center justify-between px-1 py-1 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground font-medium">Subtotal</span>
        <span className="text-[14px] font-bold text-foreground">{formatCurrency(total)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRequestOrder}
          disabled={isPending}
          className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold text-[#1a1408] overflow-hidden shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          {isPending ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#1a1408]/25 border-t-[#1a1408] animate-spin" />
              Placing…
            </>
          ) : "Place Order"}
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="h-10 px-3 rounded-xl border border-destructive/30 text-destructive bg-transparent text-[12px] font-medium flex items-center gap-1.5 hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
            <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <AlertDialogTitle className="text-base font-semibold tracking-tight">Clear your cart?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                This will permanently remove all {orders.length} items from your cart.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row gap-2">
              <AlertDialogCancel className="flex-1 h-9 rounded-xl border-border text-sm">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCart} className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// ── TrackOrderTab ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<orderStatus, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  "not-approved": { label: "Not Approved", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-400", icon: <Clock className="w-3 h-3" /> },
  approved: { label: "Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-400", icon: <Clock className="w-3 h-3" /> },
  progress: { label: "Preparing", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-400", icon: <ChefHat className="w-3 h-3" /> },
  completed: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-400", icon: <XCircle className="w-3 h-3" /> },
};

function calcProgress(items: OrderItemType[] | null | undefined): number {
  if (!items?.length) return 0;
  const weight: Record<orderStatus, number> = { "not-approved": 0, approved: 0, progress: 0.5, completed: 1, cancelled: 0 };
  const activeItems = items.filter((i) => i.status !== "cancelled");
  if (!activeItems.length) return 0;
  return Math.round(activeItems.reduce((sum, i) => sum + (weight[i.status] ?? 0), 0) / activeItems.length * 100);
}

function StatusBadge({ status }: { status: orderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.approved;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">Overall progress</span>
        <span className="text-[11px] font-bold text-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: "linear-gradient(90deg, #7c3aed, #10b981)" }} />
      </div>
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItemType }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      {item.menu_image ? (
        <img src={item.menu_image} alt={item.menu_name} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-border" />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
          <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground truncate">{item.menu_name}</p>
        <p className="text-[10px] text-muted-foreground">×{item.quantity} · ₹{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</p>
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

function OrderCard({ order }: { order: CustomerOrderRequest }) {
  const safeItems: OrderItemType[] = order.order_items ?? [];
  const activeItems = safeItems.filter((i) => i.status !== "cancelled");
  const progress = calcProgress(safeItems);
  const totalAmount = activeItems.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 0), 0);
  const completedCount = safeItems.filter((i) => i.status === "completed").length;
  const totalCount = safeItems.filter((i) => i.status !== "cancelled").length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-3 border-b border-border/50 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-[0.06em]">#{order.id.slice(-6).toUpperCase()}</span>
            <StatusBadge status={order.status} />
          </div>
          {order.customer_name && <p className="text-[10px] text-muted-foreground">{order.customer_name}</p>}
        </div>
        <span className="text-[13px] font-bold text-foreground shrink-0">₹{totalAmount.toFixed(2)}</span>
      </div>
      <div className="px-4">
        {safeItems.length > 0 ? safeItems.map((item) => <OrderItemRow key={item.id} item={item} />) : (
          <p className="text-[12px] text-muted-foreground py-4 text-center">No items in this order yet.</p>
        )}
      </div>
      <div className="px-4 pt-3 pb-4 space-y-2 border-t border-border/50">
        <ProgressBar percent={progress} />
        <p className="text-[10px] text-muted-foreground text-right">{completedCount} of {totalCount} items done</p>
        {order.note && (
          <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-xl px-3 py-2 leading-relaxed border border-border/50">
            📝 {order.note}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-14 h-14 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mb-4">
        <ClipboardList className="w-5 h-5 text-muted-foreground/40" />
      </div>
      <p className="text-[13px] font-semibold text-foreground mb-1">No orders yet</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[180px]">Your placed orders will appear here once confirmed.</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-14 h-14 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-5 h-5 text-destructive" />
      </div>
      <p className="text-[13px] font-semibold text-foreground mb-1">Couldn&apos;t load orders</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">There was a problem fetching your orders. Please try again.</p>
    </div>
  );
}

const TrackOrderTab: React.FC<{ table_validation: { phone_number: string; table_number: number } }> = ({ table_validation }) => {
  const { data: order, isLoading, isError } = useGetOrderRequestsByTableNumNPhone(table_validation.phone_number, table_validation.table_number, true);
  const hasOrders = order?.success && order.order_request;
  const orderRequest = order?.order_request as CustomerOrderRequest | undefined;
  const overallProgress = calcProgress(orderRequest?.order_items ?? []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-foreground">Table {table_validation.table_number}</p>
              <p className="text-[10px] text-muted-foreground">Your session table</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          {hasOrders && <ProgressBar percent={overallProgress} />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
            <p className="text-[11px] text-muted-foreground">Loading your orders…</p>
          </div>
        ) : isError ? <ErrorState /> : !hasOrders ? <EmptyState /> : <OrderCard order={orderRequest!} />}
      </div>
    </div>
  );
};

// ── Sidebar Tabs / Header ─────────────────────────────────────────────────────

type SidebarTab = "order" | "track";

const SidebarTabs: React.FC<{ activeTab: SidebarTab; onTabChange: (tab: SidebarTab) => void; orderCount: number }> = ({ activeTab, onTabChange, orderCount }) => (
  <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border bg-card shrink-0">
    <div className="flex items-center w-full rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
      {(["order", "track"] as SidebarTab[]).map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button key={tab} onClick={() => onTabChange(tab)} className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-semibold transition-all ${isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === "order" ? (
              <>
                <ShoppingCart className="w-3 h-3" />
                Your Order
                {orderCount > 0 && (
                  <span className="ml-0.5 min-w-4 h-4 px-1 bg-foreground text-background text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {orderCount > 9 ? "9+" : orderCount}
                  </span>
                )}
              </>
            ) : (
              <><ClipboardList className="w-3 h-3" />Track Order</>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

function SidebarHeader({ tableNumber, total, showTotal }: { tableNumber: number; total: number; showTotal: boolean }) {
  return (
    <div className="relative px-4 py-3.5 border-b border-border shrink-0 bg-card">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold tracking-tight text-foreground">Table {tableNumber}</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
          </span>
        </div>
        {showTotal && <span className="text-[14px] font-bold text-foreground">{formatCurrency(total)}</span>}
      </div>
    </div>
  );
}

const DesktopOrderSidebar: React.FC<{ table_validation: TableValidationType }> = ({ table_validation }) => {
  const { orders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>("order");
  const cartTotal = orders.reduce((sum, item) => sum + item.menu_price * item.quantity, 0);
  return (
    <div className="w-96 bg-background border-l border-border flex flex-col h-full max-h-[calc(100vh-116px)]">
      <SidebarHeader tableNumber={table_validation.table_number} total={cartTotal} showTotal={orders.length > 0 && activeTab === "order"} />
      <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} orderCount={orders.length} />
      {activeTab === "order" ? (
        <>
          <div className="flex-1 overflow-y-auto min-h-0"><div className="px-4 py-3"><CartItemList /></div></div>
          <div className="shrink-0 border-t border-border bg-card"><OrderFooter table_validation={table_validation} /></div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0"><TrackOrderTab table_validation={table_validation} /></div>
      )}
    </div>
  );
};

const MobileMenuSidebar: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; table_validation: TableValidationType }> = ({ open, onOpenChange, table_validation }) => {
  const { orders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>("order");
  const cartTotal = orders.reduce((sum, item) => sum + item.menu_price * item.quantity, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85%] sm:w-96 p-0 flex flex-col h-full border-l border-border bg-background" onInteractOutside={(e) => { e.preventDefault(); onOpenChange(false); }}>
        <SheetHeader className="p-0 shrink-0">
          <SheetTitle className="sr-only">Order sidebar</SheetTitle>
          <SidebarHeader tableNumber={table_validation.table_number} total={cartTotal} showTotal={orders.length > 0 && activeTab === "order"} />
        </SheetHeader>
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} orderCount={orders.length} />
        {activeTab === "order" ? (
          <>
            <div className="flex-1 overflow-y-auto min-h-0"><div className="px-4 py-3"><CartItemList /></div></div>
            <div className="shrink-0 border-t border-border bg-card"><OrderFooter table_validation={table_validation} onClose={() => onOpenChange(false)} /></div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0"><TrackOrderTab table_validation={table_validation} /></div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const NewMenuItemsPage = ({ table_validation }: { table_validation: TableValidationType }) => {
  const { data, isLoading, isError } = useGetCachedMenuItems(true);

  const [isMounted, setIsMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Recommendation state ──────────────────────────────────────────────────
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationQueryIds, setRecommendationQueryIds] = useState<string[]>([]);
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false);

  const recommendationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOrderCountRef = useRef<number>(0);
  const prevOrderKeyRef = useRef<string>("");

  const { orders } = useOrderStore();

  useEffect(() => { setIsMounted(true); }, []);

  const grouped_menu = data?.grouped_menu as GroupedMenuResponse | undefined;
  const allSlugs = useMemo(() => (grouped_menu ? Object.keys(grouped_menu) : []), [grouped_menu]);
  const visibleSlugs = useMemo(() => (selectedSlug ? [selectedSlug] : allSlugs), [selectedSlug, allSlugs]);

  const {
    data: recommended_data,
    isSuccess: recommendationSuccess,
    isLoading: recommendationLoading,
    refetch: refetchRecommendations,
  } = useGetRecommendationMenuItems(recommendationQueryIds);

  const allMenuItems = useMemo<MenuItemsResponse[]>(() => {
    if (!grouped_menu) return [];
    return Object.values(grouped_menu).flatMap((g) => g.menu_items);
  }, [grouped_menu]);

  const cartMenuIds = useMemo(() => new Set(orders.map((o) => o.menu_id)), [orders]);

  // Replace the existing recommendedItems memo with this:
  const recommendedItems = useMemo<MenuItemsResponse[]>(() => {
    if (!recommendationSuccess || !recommended_data) return [];
    const payload = recommended_data as RecommendationMenuItemsResponse;
    if (!payload.recommended_menu_item_ids?.length) return [];
    const idSet = new Set<string>(payload.recommended_menu_item_ids);
    // Don't filter out cart items here - let the banner handle it
    return allMenuItems.filter((item) => idSet.has(item.id) && item.is_available);
  }, [recommended_data, recommendationSuccess, allMenuItems]);
  // ── Show banner once recommendations arrive ───────────────────────────────
  // Only show if not already visible (prevents flicker on cart updates)
  useEffect(() => {
    if (recommendedItems.length > 0 && !showRecommendations) {
      setShowRecommendations(true);
    }
  }, [recommendedItems]);  // intentionally omit showRecommendations from deps

  // ── Watch cart: debounce recommendation fetch by 3s after last add ────────
  useEffect(() => {
    const currentKey = orders.map((o) => o.menu_id).sort().join(",");

    // Cart is now empty — hide and reset
    if (orders.length === 0) {
      if (recommendationTimerRef.current) clearTimeout(recommendationTimerRef.current);
      setShowRecommendations(false);
      setRecommendationQueryIds([]);
      prevOrderKeyRef.current = "";
      prevOrderCountRef.current = 0;
      return;
    }

    // No change — skip
    if (currentKey === prevOrderKeyRef.current) return;

    prevOrderKeyRef.current = currentKey;
    prevOrderCountRef.current = orders.length;

    // Cancel any pending timer and schedule a fresh one.
    // We do NOT hide the banner here — let the existing banner stay visible
    // while the user keeps adding items. It will update once the fetch resolves.
    if (recommendationTimerRef.current) clearTimeout(recommendationTimerRef.current);

    recommendationTimerRef.current = setTimeout(() => {
      const ids = orders.map((o) => o.menu_id);
      setRecommendationQueryIds(ids);
    }, 3000);

    return () => {
      if (recommendationTimerRef.current) clearTimeout(recommendationTimerRef.current);
    };
  }, [orders]);

  // ── Manual refresh ────────────────────────────────────────────────────────
  const handleRefreshRecommendations = async () => {
    if (orders.length === 0) {
      toast.error("Add items to cart first", { duration: 800 });
      return;
    }
    setIsRefreshingRecommendations(true);
    setRecommendationQueryIds(orders.map((o) => o.menu_id));
    await refetchRecommendations();
    setIsRefreshingRecommendations(false);
    // No toast — the icon spinning is enough feedback
  };

  const visibleItemCount = useMemo(() => {
    if (!grouped_menu) return 0;
    const q = searchQuery.trim().toLowerCase();
    return visibleSlugs.reduce((sum, slug) => {
      const items = grouped_menu[slug].menu_items;
      return sum + (q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)).length : items.length);
    }, 0);
  }, [grouped_menu, visibleSlugs, searchQuery]);

  const totalItems = orders.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orders.reduce((sum, item) => sum + item.menu_price * item.quantity, 0);

  if (!isMounted || isLoading) return <MenuSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Error loading menu</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Please try again later</p>
          <button
            onClick={() => window.location.reload()}
            className="relative flex items-center justify-center h-9 px-6 rounded-xl text-[13px] font-semibold text-[#1a1408] overflow-hidden shadow-sm mx-auto"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!grouped_menu || allSlugs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No menu data available</p>
      </div>
    );
  }

  const selectedCategoryName = selectedSlug ? grouped_menu[selectedSlug]?.category_name : null;
  const router = useRouter();

  // Whether to show the recommendation area at all
  const showingRecommendationBanner = showRecommendations && !recommendationLoading && recommendedItems.length > 0;
  const showingRecommendationLoader = recommendationLoading && orders.length > 0;
  const showingRecommendationHidden = !showRecommendations && !recommendationLoading && orders.length > 0 && recommendedItems.length > 0;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ── */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3">

          {/* Row 1: brand + controls */}
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] sm:text-[17px] font-bold tracking-tight text-foreground truncate">Our Menu</h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">{visibleItemCount} item{visibleItemCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-[11px] font-medium text-foreground">
                <UtensilsCrossed className="w-3 h-3 text-muted-foreground" />
                Table {table_validation.table_number}
              </span>

              {/* ← NEW: Feedback button — desktop */}
              <button
                onClick={() => router.push("/feedbacks")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                Feedback
              </button>

              {orders.length > 0 && (
                <span className="inline-flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1.5 rounded-full">
                  <Package className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-[11px] font-semibold text-foreground">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                  <span className="w-px h-3 bg-border" />
                  <span className="text-[11px] font-bold text-foreground">{formatCurrency(totalPrice)}</span>
                </span>
              )}
            </div>

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="relative lg:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
            >
              <Menu className="w-4 h-4 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm bg-muted/30 rounded-2xl border-border focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:border-ring/50 focus-visible:bg-background transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Recommendation zone — stable container to prevent layout shift ── */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ maxHeight: showingRecommendationBanner ? "200px" : showingRecommendationLoader ? "48px" : showingRecommendationHidden ? "36px" : "0px" }}
          >
            {showingRecommendationBanner && (
              <RecommendationBanner
                recommendedItems={recommendedItems}
                onDismiss={() => setShowRecommendations(false)}
                onRefresh={handleRefreshRecommendations}
                isRefreshing={isRefreshingRecommendations}
                cartItemIds={cartMenuIds} // Pass the cart items set
              />
            )}

            {showingRecommendationLoader && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border">
                <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
                <span className="text-[11px] text-muted-foreground">Finding recommendations…</span>
              </div>
            )}

            {showingRecommendationHidden && (
              <div className="mb-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-[11px] text-muted-foreground">Recommendations hidden</span>
                <button onClick={() => setShowRecommendations(true)} className="text-[11px] font-semibold text-[var(--accent)] hover:underline">
                  Show
                </button>
              </div>
            )}
          </div>

          {/* Row 3: mobile category chips */}
          <div className="lg:hidden">
            <MobileCategoryHeader slugs={allSlugs} grouped={grouped_menu} selectedSlug={selectedSlug} onSelect={setSelectedSlug} onOpenFilter={() => setMobileFilterOpen(true)} />
          </div>

          {/* Mobile cart bar */}
          {orders.length > 0 && (
            <div className="lg:hidden mt-2 flex items-center justify-between rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-2">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[11px] font-semibold text-foreground">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-foreground">{formatCurrency(totalPrice)}</span>
                <button
                  onClick={() => router.push("/feedbacks")}
                  className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
                  aria-label="Leave feedback"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => setMobileSidebarOpen(true)} className="h-7 px-3 rounded-lg text-[11px] font-semibold text-[#1a1408] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${GOLD}, #b48a3c)` }}>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  View Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Active category strip (mobile) */}
      {selectedCategoryName && (
        <div className="lg:hidden bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between sticky top-[116px] sm:top-[130px] z-40 border-b border-border">
          <span className="text-[11px] text-muted-foreground">
            Showing: <span className="font-semibold text-foreground">{selectedCategoryName}</span>
          </span>
          <button onClick={() => setSelectedSlug(null)} className="text-[10px] font-medium bg-muted/60 border border-border text-muted-foreground px-2.5 py-1 rounded-full hover:bg-muted transition-colors">
            Clear filter
          </button>
        </div>
      )}

      {/* 3-column body */}
      <div className="max-w-6xl mx-auto flex justify-between relative">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border px-4 py-5 sticky top-[116px] h-[calc(100vh-116px)] overflow-y-auto gap-1">
          <button
            onClick={() => setSelectedSlug(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all mb-1 flex items-center gap-2 ${!selectedSlug ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
          >
            All Items
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]/70 px-3 py-2">Categories</p>
          <CategoryFilter slugs={allSlugs} grouped={grouped_menu} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
        </aside>

        <main className="flex-1 px-4 py-5 sm:py-6 min-w-0">
          <MenuItemsList grouped={grouped_menu} visibleSlugs={visibleSlugs} searchQuery={searchQuery} />
        </main>

        <aside className="hidden lg:block w-96 shrink-0 sticky top-[116px] h-[calc(100vh-116px)]">
          <DesktopOrderSidebar table_validation={table_validation} />
        </aside>
      </div>

      <MobileMenuSidebar open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} table_validation={table_validation} />

      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="left" className="w-72 p-0 border-r border-border bg-background">
          <SheetHeader className="relative px-5 py-4 border-b border-border">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
            <SheetTitle className="text-left text-[14px] font-bold tracking-tight">Categories</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full p-4">
            <button onClick={() => { setSelectedSlug(null); setMobileFilterOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all mb-1 ${!selectedSlug ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
              All Items
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]/70 px-3 py-2">Categories</p>
            <CategoryFilter slugs={allSlugs} grouped={grouped_menu} selectedSlug={selectedSlug} onSelect={(slug) => { setSelectedSlug(slug); setMobileFilterOpen(false); }} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 h-10 w-10 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all z-50 hover:-translate-y-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
};

export default NewMenuItemsPage;