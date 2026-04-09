"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type {
  NewDefaultSalesResponse,
  NewSalesTrendPoint,
  NewTopSellingItem,
  NewTopCategory,
  NewOrderStatusBreakdown,
  NewTablePerformance,
  NewStaffPerformance,
  NewMenuItemOrderStat,
} from "@/utils/types/report-n-analysis.types";
import { useGetDefaultSalesReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/sales/use-get-default-sales-report";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtRs = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "Rs. 0";
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(1)}K`;
  return `Rs. ${n.toLocaleString("en-NP")}`;
};
const fmtNum = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};
const fmtPct = (n: number | null | undefined): string => `${(n ?? 0).toFixed(1)}%`;

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556"];
const FALLBACK_IMG = "https://placehold.co/40x40/e2e8f0/94a3b8?text=%F0%9F%8D%BD";

type TrendType = "daily" | "weekly" | "monthly" | "yearly";
type MenuChartMode = "total_orders" | "total_quantity" | "total_revenue";

// ─── Shared Tooltips ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md min-w-[140px]">
      <p className="text-xs text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name === "revenue" || p.name === "Revenue" ? fmtRs(p.value) : `${fmtNum(p.value)} orders`}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1 font-mono capitalize">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">{fmtNum(d.value)}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{(d.payload.percent ?? 0).toFixed(1)}%</p>
    </div>
  );
};

// ─── Menu Item Image Bar Chart ────────────────────────────────────────────────
// Pure CSS horizontal bar chart — image always visible on every row,
// rich tooltip card on hover. Recharts XAxis can't render <img> natively.

const MenuItemImageBarChart = ({
  items,
  mode,
}: {
  items: NewMenuItemOrderStat[];
  mode: MenuChartMode;
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const getValue = (item: NewMenuItemOrderStat): number => {
    if (mode === "total_orders") return item.total_orders;
    if (mode === "total_quantity") return item.total_quantity;
    return item.total_revenue;
  };

  const maxVal = useMemo(() => Math.max(...items.map(getValue), 1), [items, mode]);

  const formatVal = (item: NewMenuItemOrderStat): string => {
    if (mode === "total_revenue") return fmtRs(item.total_revenue);
    if (mode === "total_orders") return `${fmtNum(item.total_orders)} orders`;
    return `${fmtNum(item.total_quantity)} qty`;
  };

  return (
    <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
      {items.map((item, i) => {
        const pct = (getValue(item) / maxVal) * 100;
        const isHov = hovered === item.item_id;
        const color = COLORS[i % COLORS.length];

        return (
          <div
            key={item.item_id}
            className="relative"
            onMouseEnter={() => setHovered(item.item_id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-3">
              {/* ── Item image with bar wrapper ── */}
              <div className="shrink-0 relative">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                  <img
                    src={item.image_url || FALLBACK_IMG}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                </div>
                {/* Small rank badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                </div>
              </div>

              {/* ── Bar + labels ── */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs font-medium truncate max-w-[55%] leading-none">
                    {item.item_name}
                  </span>
                  <span className="text-[11px] font-semibold font-mono shrink-0 ml-2" style={{ color }}>
                    {formatVal(item)}
                  </span>
                </div>
                <div className="relative h-8 bg-secondary/50 rounded-lg overflow-hidden">
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{ width: `${pct}%`, background: `${color}20`, borderRight: `2px solid ${color}` }}
                  />
                  {/* Category label inside bar */}
                  <div className="absolute inset-y-0 left-0 flex items-center px-3">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.category_name}
                    </span>
                  </div>
                  {/* Value label on the right */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-3">
                    <span className="text-[10px] font-mono font-semibold" style={{ color }}>
                      {formatVal(item)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Enhanced Hover tooltip card ── */}
            {isHov && (
              <div className="absolute left-14 top-0 z-50 pointer-events-none translate-y-[-10%]">
                <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-3 w-64">
                  {/* Header with image */}
                  <div className="flex gap-3 mb-3 pb-2 border-b border-border">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                      <img
                        src={item.image_url || FALLBACK_IMG}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.category_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Price: {fmtRs(item.price)}</p>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Orders</p>
                      <p className="text-xs font-bold font-mono text-[#d85a30]">{fmtNum(item.total_orders)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Quantity</p>
                      <p className="text-xs font-bold font-mono text-[#378add]">{fmtNum(item.total_quantity)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Revenue</p>
                      <p className="text-xs font-bold font-mono text-[#1d9e75]">{fmtRs(item.total_revenue)}</p>
                    </div>
                  </div>
                  
                  {/* Progress bar for this specific item relative to max */}
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                      <span>Performance</span>
                      <span>{pct.toFixed(0)}% of max</span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MenuItemVerticalBarChart = ({
  items,
  mode,
}: {
  items: NewMenuItemOrderStat[];
  mode: MenuChartMode;
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const getValue = (item: NewMenuItemOrderStat): number => {
    if (mode === "total_orders") return item.total_orders;
    if (mode === "total_quantity") return item.total_quantity;
    return item.total_revenue;
  };

  const formatVal = (item: NewMenuItemOrderStat): string => {
    if (mode === "total_revenue") return fmtRs(item.total_revenue);
    if (mode === "total_orders") return `${fmtNum(item.total_orders)} orders`;
    return `${fmtNum(item.total_quantity)} qty`;
  };

  // Prepare data with display names (truncated)
  const chartData = items.map(item => ({
    ...item,
    displayName: item.item_name.length > 15 ? item.item_name.slice(0, 12) + '...' : item.item_name,
    value: getValue(item),
  }));

  const CustomBarLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const item = chartData[index];
    if (!item) return null;
    
    return (
      <g>
        <foreignObject x={x + 5} y={y - 22} width={width - 10} height={20}>
          <div className="flex items-center gap-1 justify-center">
            <img 
              src={item.image_url || FALLBACK_IMG}
              alt=""
              className="w-4 h-4 rounded object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[9px] font-medium truncate">{item.displayName}</span>
          </div>
        </foreignObject>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-3 min-w-[200px]">
        <div className="flex gap-2 mb-2 pb-2 border-b border-border">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted">
            <img 
              src={data.image_url || FALLBACK_IMG}
              alt={data.item_name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{data.item_name}</p>
            <p className="text-[10px] text-muted-foreground">{data.category_name}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Orders:</span>
            <span className="font-mono font-semibold text-[#d85a30]">{fmtNum(data.total_orders)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Quantity:</span>
            <span className="font-mono font-semibold text-[#378add]">{fmtNum(data.total_quantity)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="font-mono font-semibold text-[#1d9e75]">{fmtRs(data.total_revenue)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 mt-1 border-t border-border">
            <span className="text-muted-foreground">Price/unit:</span>
            <span className="font-mono">{fmtRs(data.price)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
          barCategoryGap="15%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="displayName" 
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis 
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={mode === "total_revenue" ? fmtRs : undefined}
            width={mode === "total_revenue" ? 70 : 50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
          <Bar 
            dataKey="value" 
            fill={COLORS[0]}
            radius={[6, 6, 0, 0]}
            name={mode === "total_revenue" ? "Revenue" : mode === "total_orders" ? "Orders" : "Quantity"}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                opacity={activeIndex === index ? 1 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
);
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-5">
    <div className="flex justify-between">
      <div className="space-y-2"><Sk className="h-7 w-52" /><Sk className="h-3.5 w-36" /></div>
      <Sk className="h-8 w-28" />
    </div>
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} className="h-24" />)}</div>
    <Sk className="h-72 w-full" />
    <Sk className="h-[540px] w-full" />
    <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <Sk key={i} className="h-56" />)}</div>
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: string; icon?: string;
}) => (
  <div className="bg-secondary/60 rounded-xl p-4 space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {icon && <span className="text-base opacity-60">{icon}</span>}
    </div>
    <div className="text-[22px] font-semibold font-mono leading-none" style={{ color: accent }}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
  </div>
);

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "default" }: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "warn" | "success";
}) => {
  const cls = {
    default: "bg-secondary text-muted-foreground",
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  }[variant];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-mono ${cls}`}>
      {children}
    </span>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SalesAndReportAndAnalysisDefaultReportPage() {
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [chartMode, setChartMode] = useState<"revenue" | "orders" | "both">("revenue");
  const [menuChartMode, setMenuChartMode] = useState<MenuChartMode>("total_orders");
  const [menuSearch, setMenuSearch] = useState("");
  const [chartVisualization, setChartVisualization] = useState<"horizontal" | "vertical">("horizontal");

  const { data, isLoading, isError, error, refetch } = useGetDefaultSalesReport();
  const report: NewDefaultSalesResponse | undefined = data?.report;

  const trendData = useMemo((): NewSalesTrendPoint[] => {
    if (!report) return [];
    const map: Record<TrendType, NewSalesTrendPoint[]> = {
      daily: report.daily_trend,
      weekly: report.weekly_trend,
      monthly: report.monthly_trend,
      yearly: report.yearly_trend,
    };
    return map[trendFilter] ?? [];
  }, [trendFilter, report]);

  // Filtered + sorted menu items
  const filteredMenuItems = useMemo((): NewMenuItemOrderStat[] => {
    if (!report?.menu_items_order_stats) return [];
    const q = menuSearch.trim().toLowerCase();
    const items = q
      ? report.menu_items_order_stats.filter(
          m => m.item_name.toLowerCase().includes(q) || m.category_name.toLowerCase().includes(q),
        )
      : [...report.menu_items_order_stats];

    return items.sort((a, b) => {
      if (menuChartMode === "total_orders") return b.total_orders - a.total_orders;
      if (menuChartMode === "total_quantity") return b.total_quantity - a.total_quantity;
      return b.total_revenue - a.total_revenue;
    });
  }, [report?.menu_items_order_stats, menuSearch, menuChartMode]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex gap-4">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-medium text-destructive mb-1">Failed to load sales data</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message}</p>
          <button onClick={() => refetch()}
            className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (!report) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-muted rounded-xl p-6 text-center">
        <p className="font-medium mb-2">No sales data available</p>
      </div>
    </div>
  );

  const ov = report.overview;
  const sc = report.stats_card;
  const maxPeakRev = report.daily_sales?.length
    ? Math.max(...report.daily_sales.map(d => d.revenue))
    : 1;

  const topRevenueItem = report.menu_items_order_stats?.length
    ? [...report.menu_items_order_stats].sort((a, b) => b.total_revenue - a.total_revenue)[0]
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sales analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Last 7 days · Nepalese Rupee (NPR)</p>
        </div>
        {ov.growth_percent != null && ov.growth_percent !== 0 && (
          <span className={`text-xs font-semibold font-mono px-3 py-1.5 rounded-full ${
            ov.growth_percent >= 0
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}>
            {ov.growth_percent >= 0 ? "↑" : "↓"} {Math.abs(ov.growth_percent).toFixed(1)}% vs prior period
          </span>
        )}
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Revenue" value={fmtRs(ov.total_revenue)} accent="#d85a30" icon="💰" />
        <KpiCard label="Total Orders" value={fmtNum(ov.total_orders)} sub={`AOV ${fmtRs(ov.average_order_value)}`} icon="🛒" />
        <KpiCard label="Completion Rate" value={fmtPct(ov.completion_rate)} accent="#1d9e75" icon="✓" />
        <KpiCard label="Discounts Given" value={fmtRs(ov.total_discounts)} accent="#ba7517" icon="🏷" />
      </div>

      {/* ── All-time stats ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">All-time statistics</span>
          <Chip>Global</Chip>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            ["Total Rev", fmtRs(sc.total_revenue)],
            ["Orders", fmtNum(sc.total_orders)],
            ["Completed", fmtNum(sc.completed_orders)],
            ["Cancelled", fmtNum(sc.cancelled_orders)],
            ["Discounts", fmtRs(sc.total_discounts)],
            ["AOV", fmtRs(sc.average_order_value)],
            ["Customers", fmtNum(sc.unique_customers)],
            ["Completion %", fmtPct(sc.completion_rate_percent)],
          ].map(([l, v]) => (
            <div key={l} className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-semibold font-mono">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      {/* ── Trend chart ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sales trend</span>
            <Chip variant="accent">{trendFilter}</Chip>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["revenue", "orders", "both"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
                    chartMode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>{m}</button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                <button key={f} onClick={() => setTrendFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
                    trendFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-72">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No trend data</div>
          ) : chartMode === "both" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtRs} width={78} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap={trendData.length === 1 ? "60%" : "22%"}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={chartMode === "revenue" ? fmtRs : undefined} width={chartMode === "revenue" ? 78 : 40} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey={chartMode} fill={chartMode === "revenue" ? COLORS[0] : COLORS[2]}
                  radius={[5, 5, 0, 0]} name={chartMode === "revenue" ? "Revenue" : "Orders"}
                  maxBarSize={trendData.length === 1 ? 80 : undefined} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Menu Item Order Stats ── */}
      <div className="mt-4">
  {/* Toggle between horizontal and vertical bar charts */}
  <div className="flex gap-2 mb-4">
    <button
      onClick={() => setChartVisualization("horizontal")}
      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
        chartVisualization === "horizontal" 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      Horizontal Bars
    </button>
    <button
      onClick={() => setChartVisualization("vertical")}
      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
        chartVisualization === "vertical" 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      Vertical Chart
    </button>
  </div>
  
  {filteredMenuItems.length === 0 ? (
    <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">
      No items match your search
    </div>
  ) : chartVisualization === "horizontal" ? (
    <MenuItemImageBarChart items={filteredMenuItems} mode={menuChartMode} />
  ) : (
    <MenuItemVerticalBarChart items={filteredMenuItems} mode={menuChartMode} />
  )}
</div>

      {/* ── Top Items + Categories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Top selling items</span>
            <Chip>{report.top_selling_items?.length ?? 0}</Chip>
          </div>
          {!report.top_selling_items?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {report.top_selling_items.map((item: NewTopSellingItem, i: number) => (
                <div key={item.item_id} className="flex items-center gap-3">
                  <span className="w-5 text-[11px] font-semibold text-muted-foreground font-mono">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.item_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{item.category_name} · {fmtNum(item.quantity)} sold</p>
                  </div>
                  <span className="text-sm font-semibold font-mono shrink-0" style={{ color: COLORS[i % COLORS.length] }}>
                    {fmtRs(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Top categories</span>
            <Chip>{report.top_categories?.length ?? 0}</Chip>
          </div>
          {!report.top_categories?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {report.top_categories.map((cat: NewTopCategory, i: number) => {
                const maxRev = Math.max(...report.top_categories.map(c => c.revenue));
                return (
                  <div key={cat.category_id} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium">{cat.category_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">{fmtNum(cat.orders)} orders</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(cat.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${maxRev ? (cat.revenue / maxRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Status + Hourly Sales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Order status</span>
            <Chip>{report.order_status_breakdown?.length ?? 0} statuses</Chip>
          </div>
          {!report.order_status_breakdown?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.order_status_breakdown} dataKey="count" nameKey="status"
                      cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={3}>
                      {report.order_status_breakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-3">
                {report.order_status_breakdown.map((s: NewOrderStatusBreakdown, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground capitalize">{s.status}</span>
                    <strong className="font-mono">{(s.percent ?? 0).toFixed(1)}%</strong>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Hourly sales</p>
          {!report.hourly_sales?.length ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.hourly_sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtRs} width={72} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Table Performance ── */}
      {report.table_performance?.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Table performance</span>
            <Chip>{report.table_performance.length} tables</Chip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Table", "Orders", "Revenue", "AOV", "Customers"].map(h => (
                    <th key={h} className="pb-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.table_performance.map((t: NewTablePerformance) => (
                  <tr key={t.table_number}>
                    <td className="py-2.5 pr-4 font-mono font-medium">#{t.table_number}</td>
                    <td className="py-2.5 pr-4 font-mono">{fmtNum(t.total_orders)}</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-[#d85a30]">{fmtRs(t.total_revenue)}</td>
                    <td className="py-2.5 pr-4 font-mono">{fmtRs(t.average_order_value)}</td>
                    <td className="py-2.5 font-mono">{fmtNum(t.total_customers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Staff Performance ── */}
      {report.staff_performance?.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Staff performance</span>
            <Chip>{report.staff_performance.length} staff</Chip>
          </div>
          <div className="space-y-3">
            {report.staff_performance.map((s: NewStaffPerformance, i: number) => {
              const maxRev = Math.max(...report.staff_performance.map(x => x.total_revenue));
              return (
                <div key={s.staff_id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-medium">{s.staff_name}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground capitalize font-mono">{s.role}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{fmtNum(s.orders_served)} orders</span>
                      <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(s.total_revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${maxRev ? (s.total_revenue / maxRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Daily sales by day of week ── */}
      {report.daily_sales?.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Sales by day of week</p>
          <div className="space-y-3">
            {report.daily_sales.map((d, i: number) => (
              <div key={d.day_of_week} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-muted-foreground font-mono uppercase">
                  {d.day_of_week?.slice(0, 3)}
                </span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${maxPeakRev ? (d.revenue / maxPeakRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <span className="w-20 text-right text-xs font-semibold font-mono">{fmtRs(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}