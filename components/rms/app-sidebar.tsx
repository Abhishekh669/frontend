"use client";

import {
  Calculator,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Grid3X3,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
  Utensils,
  Tag,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { AvailableRoutes } from "@/utils/rbac/role-n-permissiona";
import Link from "next/link";
import { UserPropsTypes } from "../wrapper/rms-wrapper";
import { hasRoutePermission } from "@/utils/helper/check-permission";
import { ModeToggle } from "../shared/mode-toggle";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";


export const sidebarRoutes = [
  { title: "Dashboard",  path: AvailableRoutes.DASHBOARD,         icon: LayoutDashboard },
  { title: "Attendance", path: AvailableRoutes.ATTENDANCE,         icon: Users           },
  { title: "Cashier",    path: AvailableRoutes.CASHIER_ROUTE,      icon: Calculator      },
  { title: "Kitchen",    path: AvailableRoutes.CHEF_ROUTE,         icon: ChefHat         },
  { title: "Orders",     path: AvailableRoutes.ORDER_MANAGEMENT,   icon: ClipboardList   },
  { title: "Tables",     path: AvailableRoutes.TABLE_MANAGEMENT,   icon: Grid3X3         },
  { title: "Ingredients",  path: AvailableRoutes.RAW_MATERIALS,      icon: Package         },
  { title: "Staff",      path: AvailableRoutes.CLIENT_MANAGEMENT,  icon: Users           },
  { title: "Reports",    path: AvailableRoutes.REPORTS,            icon: FileBarChart    },
  { title: "Settings",   path: AvailableRoutes.SETTINGS,           icon: Settings        },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: UserPropsTypes;
}

export function AppSidebar({ collapsed, onToggle, user }: AppSidebarProps) {
  const pathname = usePathname();
  const submenuRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>("");

  if (!user) return null;

  const allowedRoutes = sidebarRoutes.filter((route) =>
    hasRoutePermission(user.role, route.path)
  );

  useEffect(() => {
    const matched = sidebarRoutes.find((r) => r.path === pathname);
    if (pathname === AvailableRoutes.FOOD_CATEGORY) {
      setActiveItem("Category");
      setIsMenuOpen(true);
    } else if (matched) {
      setActiveItem(matched.title);
      setIsMenuOpen(false);
    }
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-[72px]" : "w-[252px]"
      )}
    >
      {/* ── Top gold accent line ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent pointer-events-none" />

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-b border-sidebar-border transition-all duration-300",
        collapsed ? "px-4 py-5" : "px-5 py-5"
      )}>
        <div className="flex items-center gap-3 min-h-[40px]">
          {/* Logo mark with gold ring */}
          <div className="relative shrink-0 w-9 h-9 rounded-xl bg-sidebar-accent border border-sidebar-border flex items-center justify-center ring-1 ring-accent/20 shadow-sm">
            <Image src="/logo.png" alt="DineX Logo" fill className="object-contain rounded-xl" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight tracking-tight">
                DineX
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight tracking-wide">
                Restaurant Management
              </p>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className={cn("mt-4 transition-all duration-300", collapsed ? "flex justify-center" : "")}>
          <ModeToggle isCollapsed={collapsed} />
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5 scrollbar-hide">

        {/* Section label */}
        {!collapsed && (
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 select-none">
            Navigation
          </p>
        )}

        {allowedRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = activeItem === route.title;

          return (
            <div key={route.path}>
              <Link
                href={route.path}
                onClick={() => { setActiveItem(route.title); setIsMenuOpen(false); }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group select-none",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {/* Active left bar */}
                <span className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full bg-accent transition-all duration-200",
                  isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                )} />

                {/* Icon container */}
                <span className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground group-hover:bg-sidebar-accent/40"
                )}>
                  <Icon className="w-[15px] h-[15px]" />
                </span>

                {!collapsed && (
                  <span className={cn(
                    "text-sm font-medium transition-all duration-200 truncate",
                    isActive ? "text-sidebar-accent-foreground" : ""
                  )}>
                    {route.title}
                  </span>
                )}

                {/* Active dot when collapsed */}
                {collapsed && isActive && (
                  <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>

              {/* ── Menu submenu (after Tables) ──────────────────────────── */}
              {route.title === "Tables" && (
                <div className="mt-0.5">
                  {/* Menu parent button */}
                  <button
                    onClick={() => { setActiveItem("Menu"); setIsMenuOpen((p) => !p); }}
                    className={cn(
                      "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group select-none",
                      activeItem === "Menu" || activeItem === "Category" || activeItem === "Dishes"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Active bar */}
                    <span className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full bg-accent transition-all duration-200",
                      (activeItem === "Menu" || activeItem === "Category" || activeItem === "Dishes") ? "h-5 opacity-100" : "h-0 opacity-0"
                    )} />

                    {/* Icon */}
                    <span className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0",
                      activeItem === "Menu" || activeItem === "Category" || activeItem === "Dishes"
                        ? "bg-accent/15 text-accent"
                        : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground group-hover:bg-sidebar-accent/40"
                    )}>
                      <UtensilsCrossed className="w-[15px] h-[15px]" />
                    </span>

                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left truncate">Menu</span>
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                          isMenuOpen && "rotate-180"
                        )} />
                      </>
                    )}
                  </button>

                  {/* Submenu — animated grid rows */}
                  {!collapsed && (
                    <div className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      isMenuOpen ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"
                    )}>
                      <div ref={submenuRef} className="overflow-hidden">
                        <div className="ml-[46px] space-y-0.5 py-1 border-l border-sidebar-border pl-3">

                          {/* Dishes */}
                          <Link
                            href={`${AvailableRoutes.FOOD_CATEGORY}/all-menu-items`}
                            onClick={() => setActiveItem("Dishes")}
                            className={cn(
                              "relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer select-none",
                              activeItem === "Dishes"
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-150 shrink-0",
                              activeItem === "Dishes" ? "bg-accent scale-110" : "bg-sidebar-border"
                            )} />
                            <Utensils className="w-3 h-3 shrink-0" />
                            Dishes
                          </Link>

                          {/* Category */}
                          <Link
                            href={AvailableRoutes.FOOD_CATEGORY}
                            onClick={() => setActiveItem("Category")}
                            className={cn(
                              "relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 select-none",
                              activeItem === "Category"
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-150 shrink-0",
                              activeItem === "Category" ? "bg-accent scale-110" : "bg-sidebar-border"
                            )} />
                            <Tag className="w-3 h-3 shrink-0" />
                            Category
                          </Link>

                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── User profile ─────────────────────────────────────────────────── */}
      <div className={cn(
        "border-t border-sidebar-border transition-all duration-300",
        collapsed ? "px-3 py-4" : "px-4 py-4"
      )}>
        <div className={cn(
          "flex items-center gap-3 rounded-xl transition-all duration-200",
          collapsed ? "justify-center" : "px-2 py-2 hover:bg-sidebar-accent/40 cursor-default"
        )}>
          <Avatar className="w-8 h-8 rounded-xl ring-1 ring-sidebar-border shrink-0">
            <AvatarImage src={user.image} className="rounded-xl" />
            <AvatarFallback className="bg-accent/20 text-accent text-xs font-semibold rounded-xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Collapse toggle button ────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 z-50"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </Button>
    </aside>
  );
}