"use client"
import { buildCategoryTree } from "@/utils/helper/cache";
import {
  CategoryCache,
  MenuItemCache,
} from "@/utils/types/food-category.types";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, UtensilsCrossed, ChevronDown, X } from "lucide-react";
import { useGetCachedMenuItems } from "@/utils/hooks/tanstack-query/query-hook/customer/get-all-cached-menu-items";
import { MobileCategoryHeader } from "./mobile-category-header";
import { CategoryFilter } from "./category-filter";
import { MenuItems } from "./menu-items";
import { Menu } from "lucide-react";
import { MobileMenuSidebar } from "./mobile-menu-sidebar";
import { useOrderStore } from "@/utils/store/customer-order/use-customer-order";
import { DesktopOrderSidebar } from "./desktop-order-sidebar";

const buildCategoryPathMap = (
  categories: CategoryCache[],
  categoryChildren: Record<string, string[]>
): Record<string, string[]> => {
  const pathMap: Record<string, string[]> = {};
  const categoryMap: Record<string, CategoryCache> = {};
  categories.forEach((cat) => (categoryMap[cat.id] = cat));

  categories.forEach((cat) => {
    const path: string[] = [cat.name];
    let currentParentId = cat.parent_id;
    while (currentParentId && categoryMap[currentParentId]) {
      path.unshift(categoryMap[currentParentId].name);
      currentParentId = categoryMap[currentParentId].parent_id;
    }
    pathMap[cat.id] = path;
  });
  return pathMap;
};

const getAllDescendantIds = (
  categoryId: string,
  categoryChildren: Record<string, string[]>
): string[] => {
  const result: string[] = [categoryId];
  const queue = [categoryId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = categoryChildren[currentId] || [];
    for (const childId of children) {
      result.push(childId);
      queue.push(childId);
    }
  }
  return [...new Set(result)];
};

const MenuSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        {/* Logo and title row skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-7 w-32 bg-muted rounded-lg mb-2" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>

        {/* Search bar skeleton */}
        <div className="relative mb-3">
          <div className="w-full h-11 bg-muted rounded-xl" />
        </div>

        {/* Categories skeleton */}
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-2 min-w-max">
              <div className="w-20 h-9 bg-muted rounded-full" />
              <div className="w-24 h-9 bg-muted rounded-full" />
              <div className="w-28 h-9 bg-muted rounded-full" />
              <div className="w-20 h-9 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Main content skeleton */}
    <div className="max-w-6xl mx-auto flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border p-4">
        <div className="h-5 w-24 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-8 w-full bg-muted rounded" />
          <div className="h-8 w-full bg-muted rounded" />
          <div className="h-8 w-full bg-muted rounded" />
        </div>
      </aside>

      <main className="flex-1 px-4 py-5 sm:py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  </div>
);

export const CustomerMenu: React.FC = () => {
  const { data, isLoading, isError } = useGetCachedMenuItems();
  console.log("this is the data : :", data)

  // Add mounting state to handle client-side only rendering
  const [isMounted, setIsMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { orders } = useOrderStore()
  const count = orders.length

  // Handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categoryTree = useMemo(() => {
    if (!data?.categories || !data?.category_children) return [];
    return buildCategoryTree(data.categories, data.category_children);
  }, [data]);

  const categoryPathMap = useMemo(() => {
    if (!data?.categories || !data?.category_children) return {};
    return buildCategoryPathMap(data.categories, data.category_children);
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data?.menu_items) return [];

    let itemsToShow: (MenuItemCache & { categoryPath: string[] })[] = [];

    if (!selectedCategoryId) {
      itemsToShow = Object.entries(data.menu_items).flatMap(([categoryId, items]) =>
        items.map((item) => ({
          ...item,
          categoryPath: categoryPathMap[categoryId] || [categoryId],
        }))
      );
    } else {
      const allCategoryIds = getAllDescendantIds(
        selectedCategoryId,
        data.category_children || {}
      );
      itemsToShow = allCategoryIds.flatMap((categoryId) =>
        (data.menu_items?.[categoryId] || []).map((item) => ({
          ...item,
          categoryPath: categoryPathMap[categoryId] || [],
        }))
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      itemsToShow = itemsToShow.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    itemsToShow.sort((a, b) => {
      const pathA = a.categoryPath.join("");
      const pathB = b.categoryPath.join("");
      if (pathA !== pathB) return pathA.localeCompare(pathB);
      return a.name.localeCompare(b.name);
    });

    return itemsToShow;
  }, [selectedCategoryId, data, categoryPathMap, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  // Show skeleton during SSR and initial client render
  if (!isMounted || isLoading) {
    return <MenuSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-display text-lg font-semibold text-foreground">
            Error loading menu
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please try again later
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.categories || !data.menu_items) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No menu data available</p>
      </div>
    );
  }

  const selectedCategoryName = selectedCategoryId
    ? data.categories.find((c) => c.id === selectedCategoryId)?.name
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          {/* Logo and title row */}
          <div className="flex items-center gap-3 mb-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate">
                Our Menu
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="relative lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />

              {/* Badge */}
              {count > 0 && (
                <span
                  className="
        absolute -top-1 -right-2
        w-5 h-5
        bg-red-500 text-white
        text-[11px] font-bold
        rounded-full
        flex items-center justify-center
        leading-none
      "
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-body 
                placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile category header */}
          <div className="lg:hidden">
            <MobileCategoryHeader
              categories={categoryTree}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onOpenFilter={() => setMobileFilterOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Selected category indicator (mobile) */}
      {selectedCategoryName && (
        <div className="lg:hidden bg-secondary/50 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{selectedCategoryName}</span>
          </span>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="text-xs bg-card text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors font-medium shadow-sm"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto flex justify-between">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border p-4 sticky top-0 h-screen overflow-y-auto">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Categories
          </h2>
          <CategoryFilter
            categories={categoryTree}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </aside>

        {/* Menu items */}
        <main className="flex-1 px-4 py-5 sm:py-6">
          <MenuItems items={filteredItems} />
        </main>
        <aside className="hidden lg:block w-96 shrink-0">
          <DesktopOrderSidebar />
        </aside>
      </div>
      <MobileMenuSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
    </div>
  );
};