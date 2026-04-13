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
import { DollarSign, ShoppingCart, CheckCircle, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl min-w-[140px]">
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
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1 font-mono capitalize">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">{fmtNum(d.value)}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{(d.payload.percent ?? 0).toFixed(1)}%</p>
    </div>
  );
};

// ─── Menu Item Image Bar Chart ────────────────────────────────────────────────
const MenuItemImageBarChart = ({ items, mode }: { items: NewMenuItemOrderStat[]; mode: MenuChartMode }) => {
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
          <div key={item.item_id} className="relative" onMouseEnter={() => setHovered(item.item_id)} onMouseLeave={() => setHovered(null)}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
                  <img src={item.image_url || FALLBACK_IMG} alt={item.item_name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs font-medium truncate max-w-[55%] leading-none text-foreground">{item.item_name}</span>
                  <span className="text-[11px] font-semibold font-mono shrink-0 ml-2" style={{ color }}>{formatVal(item)}</span>
                </div>
                <div className="relative h-8 bg-muted/50 rounded-xl overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-xl transition-all duration-500"
                    style={{ width: `${pct}%`, background: `${color}20`, borderRight: `2px solid ${color}` }} />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3">
                    <span className="text-[10px] text-muted-foreground font-mono">{item.category_name}</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3">
                    <span className="text-[10px] font-mono font-semibold" style={{ color }}>{formatVal(item)}</span>
                  </div>
                </div>
              </div>
            </div>
            {isHov && (
              <div className="absolute left-14 top-0 z-50 pointer-events-none translate-y-[-10%]">
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-3 w-64">
                  <div className="flex gap-3 mb-3 pb-2 border-b border-border">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                      <img src={item.image_url || FALLBACK_IMG} alt={item.item_name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight text-foreground">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.category_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Price: {fmtRs(item.price)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Orders</p>
                      <p className="text-xs font-bold font-mono text-[#d85a30]">{fmtNum(item.total_orders)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Quantity</p>
                      <p className="text-xs font-bold font-mono text-[#378add]">{fmtNum(item.total_quantity)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Revenue</p>
                      <p className="text-xs font-bold font-mono text-[#1d9e75]">{fmtRs(item.total_revenue)}</p>
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
      <div className="h-7 w-52 bg-muted rounded-full animate-pulse mb-2" />
      <div className="h-4 w-36 bg-muted rounded-full animate-pulse" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm animate-pulse">
          <div className="h-3 w-20 bg-muted rounded-full mb-4" />
          <div className="h-7 w-28 bg-muted rounded-full" />
        </div>
      ))}
    </div>
    <div className="rounded-3xl border border-border bg-card shadow-sm h-80 animate-pulse" />
    <div className="rounded-3xl border border-border bg-card shadow-sm h-[540px] animate-pulse" />
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, iconColor, icon: Icon }: {
  label: string; value: string; sub?: string; iconColor: string; icon: React.ElementType;
}) => (
  <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `radial-gradient(circle, ${iconColor}18, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="flex items-start justify-between mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15`, color: iconColor }}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">{sub}</div>}
  </div>
);

// ─── Segmented Toggle ─────────────────────────────────────────────────────────
const SegmentedToggle = ({ options, value, onChange, labels }: {
  options: string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string>;
}) => (
  <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)}
        className={`px-3 h-7 text-[11px] font-medium rounded-lg capitalize transition-all ${
          value === opt ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}>
        {labels?.[opt] ?? opt}
      </button>
    ))}
  </div>
);

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" | "warn" | "success" }) => {
  const cls = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent/15 text-accent",
    warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[variant];
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-mono ${cls}`}>{children}</span>;
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

  const filteredMenuItems = useMemo((): NewMenuItemOrderStat[] => {
    if (!report?.menu_items_order_stats) return [];
    const q = menuSearch.trim().toLowerCase();
    const items = q
      ? report.menu_items_order_stats.filter(m => m.item_name.toLowerCase().includes(q) || m.category_name.toLowerCase().includes(q))
      : [...report.menu_items_order_stats];
    return items.sort((a, b) => {
      if (menuChartMode === "total_orders") return b.total_orders - a.total_orders;
      if (menuChartMode === "total_quantity") return b.total_quantity - a.total_quantity;
      return b.total_revenue - a.total_revenue;
    });
  }, [report?.menu_items_order_stats, menuSearch, menuChartMode]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 relative">
          <span className="text-2xl">⚠️</span>
          <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load sales data</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Try Again
        </button>
      </div>
    </div>
  );

  if (!report) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No sales data available</h3>
      </div>
    </div>
  );

  const ov = report.overview;
  const sc = report.stats_card;
  const maxPeakRev = report.daily_sales?.length ? Math.max(...report.daily_sales.map(d => d.revenue)) : 1;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.12 85 / 12%), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="flex items-start justify-between gap-4 flex-wrap relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Last 7 days · Nepalese Rupee (NPR)</p>
          </div>
          {ov.growth_percent != null && ov.growth_percent !== 0 && (
            <div className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold font-mono border ${
              ov.growth_percent >= 0
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
            }`}>
              {ov.growth_percent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(ov.growth_percent).toFixed(1)}% vs prior period
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtRs(ov.total_revenue)} iconColor="#d85a30" icon={DollarSign} />
        <KpiCard label="Total Orders" value={fmtNum(ov.total_orders)} sub={`AOV ${fmtRs(ov.average_order_value)}`} iconColor="#3b82f6" icon={ShoppingCart} />
        <KpiCard label="Completion Rate" value={fmtPct(ov.completion_rate)} iconColor="#1d9e75" icon={CheckCircle} />
        <KpiCard label="Discounts Given" value={fmtRs(ov.total_discounts)} iconColor="#ba7517" icon={Tag} />
      </div>

      {/* ── All-time Stats ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">All-time statistics</span>
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
            <div key={l} className="bg-muted/30 rounded-xl p-3 border border-border/50">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">{l}</p>
              <p className="text-sm font-semibold font-mono text-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* ── Trend Chart ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sales Trend</span>
              <Chip variant="accent">{trendFilter}</Chip>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SegmentedToggle options={["revenue", "orders", "both"]} value={chartMode} onChange={(v) => setChartMode(v as any)} />
              <SegmentedToggle options={["daily", "weekly", "monthly", "yearly"]} value={trendFilter} onChange={(v) => setTrendFilter(v as any)} />
            </div>
          </div>
        </div>
        <div className="p-5">
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
      </div>

      {/* ── Menu Item Order Stats ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Menu Performance</span>
              <Chip>{filteredMenuItems.length} items</Chip>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  placeholder="Search items…"
                  className="h-9 pl-3 pr-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors w-40"
                />
              </div>
              {/* Mode toggle */}
              <SegmentedToggle
                options={["total_orders", "total_quantity", "total_revenue"]}
                value={menuChartMode}
                onChange={(v) => setMenuChartMode(v as MenuChartMode)}
                labels={{ total_orders: "Orders", total_quantity: "Qty", total_revenue: "Revenue" }}
              />
              {/* Chart type */}
              <SegmentedToggle
                options={["horizontal", "vertical"]}
                value={chartVisualization}
                onChange={(v) => setChartVisualization(v as any)}
                labels={{ horizontal: "Bars", vertical: "Chart" }}
              />
            </div>
          </div>
        </div>
        <div className="p-5">
          {filteredMenuItems.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">No items match your search</div>
          ) : (
            <MenuItemImageBarChart items={filteredMenuItems} mode={menuChartMode} />
          )}
        </div>
      </div>

      {/* ── Top Items + Categories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Top Selling Items</span>
            <Chip>{report.top_selling_items?.length ?? 0}</Chip>
          </div>
          {!report.top_selling_items?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {report.top_selling_items.map((item: NewTopSellingItem, i: number) => (
                <div key={item.item_id} className="flex items-center gap-3 hover:bg-muted/20 rounded-xl p-2 -mx-2 transition-colors">
                  <span className="w-5 text-[11px] font-semibold text-muted-foreground font-mono">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{item.item_name}</p>
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

        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Top Categories</span>
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
                      <span className="text-sm font-medium text-foreground">{cat.category_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">{fmtNum(cat.orders)} orders</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(cat.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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

      {/* ── Order Status ── */}
      {/* NOTE: Hourly sales section has been removed as requested */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Order Status</span>
          <Chip>{report.order_status_breakdown?.length ?? 0} statuses</Chip>
        </div>
        {!report.order_status_breakdown?.length ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
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
            <div className="flex flex-wrap gap-3">
              {report.order_status_breakdown.map((s: NewOrderStatusBreakdown, i: number) => (
                <span key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{s.status}</span>
                  <strong className="font-mono text-foreground">{(s.percent ?? 0).toFixed(1)}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Table Performance ── */}
      {report.table_performance?.length > 0 && (
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Table Performance</span>
            <Chip>{report.table_performance.length} tables</Chip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Table", "Orders", "Revenue", "AOV", "Customers"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.table_performance.map((t: NewTablePerformance) => (
                  <tr key={t.table_number} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-foreground">#{t.table_number}</td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{fmtNum(t.total_orders)}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-[#d85a30]">{fmtRs(t.total_revenue)}</td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{fmtRs(t.average_order_value)}</td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{fmtNum(t.total_customers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Staff Performance ── */}
      {report.staff_performance?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Staff Performance</span>
            <Chip>{report.staff_performance.length} staff</Chip>
          </div>
          <div className="space-y-3">
            {report.staff_performance.map((s: NewStaffPerformance, i: number) => {
              const maxRev = Math.max(...report.staff_performance.map(x => x.total_revenue));
              return (
                <div key={s.staff_id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-medium text-foreground">{s.staff_name}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground capitalize font-mono">{s.role}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{fmtNum(s.orders_served)} orders</span>
                      <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(s.total_revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${maxRev ? (s.total_revenue / maxRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Daily Sales by Day of Week ── */}
      {report.daily_sales?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block mb-4">Sales by Day of Week</span>
          <div className="space-y-3">
            {report.daily_sales.map((d: any, i: number) => (
              <div key={d.day_of_week} className="flex items-center gap-3">
                <span className="w-8 text-[11px] font-medium text-muted-foreground font-mono uppercase">{d.day_of_week?.slice(0, 3)}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${maxPeakRev ? (d.revenue / maxPeakRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <span className="w-20 text-right text-xs font-semibold font-mono text-foreground">{fmtRs(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}