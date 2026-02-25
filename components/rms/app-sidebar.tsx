import {
  Calculator,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  Grid3X3,
  LayoutDashboard,
  LucideIcon,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { AvailableRoutes } from "@/utils/rbac/role-n-permissiona";
import Link from "next/link";
import { UserPropsTypes } from "../wrapper/rms-wrapper";
import { hasRoutePermission } from "@/utils/helper/check-permission";
import { ModeToggle } from "../shared/mode-toggle";
import Image from "next/image";

export interface RouteItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const sidebarRoutes: RouteItem[] = [
  { title: "Dashboard", path: AvailableRoutes.DASHBOARD, icon: LayoutDashboard },
  { title: "Attendance", path: AvailableRoutes.ATTENDANCE, icon: Users },
  { title: "Cashier", path: AvailableRoutes.CASHIER_ROUTE, icon: Calculator },
  { title: "Kitchen", path: AvailableRoutes.CHEF_ROUTE, icon: ChefHat },
  { title: "Orders", path: AvailableRoutes.ORDER_MANAGEMENT, icon: ClipboardList },
  { title: "Tables", path: AvailableRoutes.TABLE_MANAGEMENT, icon: Grid3X3 },
  { title: "Menu Categories", path: AvailableRoutes.FOOD_CATEGORY, icon: UtensilsCrossed },
  { title: "Inventory", path: AvailableRoutes.RAW_MATERIALS, icon: Package },
  { title: "Clients", path: AvailableRoutes.CLIENT_MANAGEMENT, icon: Users },
  { title: "Reports", path: AvailableRoutes.REPORTS, icon: FileBarChart },
  { title: "Settings", path: AvailableRoutes.SETTINGS, icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: UserPropsTypes;
}

export function AppSidebar({ collapsed, onToggle, user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const allowedRoutes = sidebarRoutes.filter((route) =>
    hasRoutePermission(user.role, route.path)
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-[78px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="px-6 py-7 flex flex-col items-start border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="relative w-12 h-12">
            <Image
              src="/logo.png"
              alt="DineX Logo"
              fill
              className="object-contain"
            />
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-base font-semibold tracking-widest text-sidebar-foreground">
                DineX
              </h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Hospitality OS
              </p>
            </div>
          )}
        </div>

        <div className={cn("mt-6 w-full", collapsed && "flex justify-center")}>
          <ModeToggle isCollapsed={collapsed} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto">
        {allowedRoutes.map((route) => {
          const isActive = pathname === route.path;
          const Icon = route.icon;

          const navItem = (
            <Link
              key={route.path}
              href={route.path}
              onMouseEnter={() => router.prefetch(route.path)}
              className={cn(
                "group relative flex items-center gap-4 px-4 py-3 text-sm transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full bg-accent" />
              )}

              <Icon
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive
                    ? "text-accent"
                    : "group-hover:text-sidebar-foreground"
                )}
              />

              {!collapsed && (
                <span
                  className={cn(
                    "transition-all",
                    isActive && "text-sidebar-foreground font-medium"
                  )}
                >
                  {route.title}
                </span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={route.path} delayDuration={0}>
                <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                <TooltipContent side="right">
                  {route.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navItem;
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-6 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="w-9 h-9">
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-8 w-7 h-7 rounded-full bg-card border border-border shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>
    </aside>
  );
}