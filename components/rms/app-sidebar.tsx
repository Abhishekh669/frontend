import { Calculator, ChefHat, ChevronLeft, ChevronRight, ClipboardList, FileBarChart, Grid3X3, LayoutDashboard, LucideIcon, Package, Settings, Users, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter} from "next/navigation";
import { AvailableRoutes } from "@/utils/rbac/role-n-permissiona";
import Link from "next/link";
import { UserPropsTypes } from "../wrapper/rms-wrapper";
import { hasRoutePermission } from "@/utils/helper/check-permission";
import { ModeToggle } from "../shared/mode-toggle";
export interface RouteItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const sidebarRoutes: RouteItem[] = [
  { title: "Attendance", path: AvailableRoutes.ATTENDANCE, icon: Users },
  { title: "Cashier", path: AvailableRoutes.CASHIER_ROUTE, icon: Calculator },
  { title: "Chef", path: AvailableRoutes.CHEF_ROUTE, icon: ChefHat },
  { title: "Client Management", path: AvailableRoutes.CLIENT_MANAGEMENT, icon: Users },
  { title: "Dashboard", path: AvailableRoutes.DASHBOARD, icon: LayoutDashboard },
  { title: "Food Category", path: AvailableRoutes.FOOD_CATEGORY, icon: UtensilsCrossed },
  { title: "Order Management", path: AvailableRoutes.ORDER_MANAGEMENT, icon: ClipboardList },
  { title: "Raw Materials", path: AvailableRoutes.RAW_MATERIALS, icon: Package },
  { title: "Reports & Analysis", path: AvailableRoutes.REPORTS, icon: FileBarChart },
  { title: "Settings", path: AvailableRoutes.SETTINGS, icon: Settings },
  { title: "Table Management", path: AvailableRoutes.TABLE_MANAGEMENT, icon: Grid3X3 },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: UserPropsTypes
}

export function AppSidebar({ collapsed, onToggle, user }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedRoutes = sidebarRoutes.filter((route) => hasRoutePermission(user.role, route.path))
  const router = useRouter();
  if (!user) {
    return null;
  }
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-18" : "w-65"
      )}
    >
      {/* Logo Section */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        {/* Top row: Logo + Text */}
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                RestaurantPOS
              </h1>
              <p className="text-xs text-sidebar-muted truncate">
                Management System
              </p>
            </div>
          )}
        </div>

        {/* Mode Toggle – always below logo */}
        <div
          className={cn(
            "mt-4 flex",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <ModeToggle isCollapsed={collapsed} />
        </div>
      </div>



      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {allowedRoutes.map((route) => {
          const isActive = pathname === route.path;
          const Icon = route.icon;

          const navItem = (
            <Link
              onMouseEnter={()=>{
                  router.prefetch(route.path);
              }}
              href={route.path}
              className={cn(
                "sidebar-item",
                isActive && "sidebar-item-active",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="truncate text-sm font-medium">{route.title}</span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={route.path} delayDuration={0}>
                <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {route.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={route.path}>{navItem}</div>;
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-card border shadow-sm hover:bg-muted"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        )}
      </Button>
    </aside>
  );
}
