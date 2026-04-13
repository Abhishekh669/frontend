"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CalendarDays, RefreshCw, Package, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import {
  format, subDays, subMonths, subYears, startOfDay, parseISO,
  isAfter,
} from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useGetCustomRangeRawMaterialsReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/raw-material/use-get-report-n-analysis-raw-material-custom-date-range";
import type {
  NewCustomRangeRawMaterialResponse,
  NewRawMaterialTrendPoint,
  NewTopUsedRawMaterial,
  NewRawMaterialUsageBreakdown,
  NewDailyRawMaterialUsage,
  NewRawMaterialPaginatedTrendPoints,
} from "@/utils/types/report-n-analysis.types";
import type { CustomQuery } from "@/utils/actions/report-n-analysis/customer/customer.get";

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatCurrency = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "Rs. 0";
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(1)}K`;
  return `Rs. ${n.toLocaleString("en-NP")}`;
};

const formatNumber = (n: number | null | undefined, suffix = ""): string => {
  if (n == null || isNaN(n)) return `0${suffix}`;
  return `${n.toLocaleString("en-NP")}${suffix}`;
};

const formatCompactNumber = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

// ─── Safe date ────────────────────────────────────────────────────────────────
const safeDate = (s: string) => parseISO(s);

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556"];

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-md min-w-[160px]">
      <p className="text-xs text-muted-foreground mb-2 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name === "Total Cost" || p.dataKey === "total_cost"
            ? formatCurrency(p.value)
            : p.name === "Material Used" || p.dataKey === "material_used"
              ? `${formatCompactNumber(p.value)} units`
              : `${formatCompactNumber(p.value)} orders`}
        </p>
      ))}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between">
      <div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-3.5 w-36" /></div>
      <Skeleton className="h-8 w-28" />
    </div>
    <Skeleton className="h-36 w-full" />
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
    <Skeleton className="h-72 w-full" />
    <Skeleton className="h-96 w-full" />
  </div>
);

// ─── Stats Card ───────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, subtitle, icon, trend }: any) => (
  <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-2">
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
    {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    {trend && (
      <div className={cn("text-xs font-medium flex items-center gap-1", trend > 0 ? "text-green-600" : "text-red-600")}>
        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend)}% from previous period
      </div>
    )}
  </div>
);

const Chip = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" }) => (
  <span className={cn(
    "text-[10px] font-medium px-2 py-0.5 rounded-full font-mono",
    variant === "accent" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
  )}>
    {children}
  </span>
);

export type TrendType = "daily" | "weekly" | "monthly" | "yearly";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RawMaterialReportAndAnalysisCustomDateRangePage() {
  const today = startOfDay(new Date());
  const defaultFrom = subDays(today, 30);

  const [query, setQuery] = useState<CustomQuery>({
    start_date: format(defaultFrom, "yyyy-MM-dd"),
    end_date: format(today, "yyyy-MM-dd"),
    limit: 20,
    page: 0,
  });

  const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
  const [toDate, setToDate] = useState<Date | undefined>(today);
  const [dateError, setDateError] = useState("");
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [chartMetric, setChartMetric] = useState<"usage" | "cost" | "both">("both");
  const [activePreset, setActivePreset] = useState<string>("30d");

  const { data, isLoading, isError, error, isFetching } = useGetCustomRangeRawMaterialsReport(query);

  const validate = useCallback((from?: Date, to?: Date): boolean => {
    if (!from || !to) { setDateError("Both dates are required"); return false; }
    if (isAfter(from, today)) { setDateError("From date cannot be in the future"); return false; }
    if (isAfter(to, today)) { setDateError("To date cannot be in the future"); return false; }
    if (isAfter(from, to)) { setDateError("From date must be before to date"); return false; }
    setDateError("");
    return true;
  }, [today]);

  const applyFilters = (from?: Date, to?: Date, preset?: string) => {
    const f = from ?? fromDate;
    const t = to ?? toDate;
    if (!validate(f, t) || !f || !t) { toast.error(dateError || "Invalid dates"); return; }
    setQuery(prev => ({ ...prev, start_date: format(f, "yyyy-MM-dd"), end_date: format(t, "yyyy-MM-dd"), page: 0 }));
    if (preset) setActivePreset(preset);
  };

  const presets = [
    { label: "Last 7 days", key: "7d", from: subDays(today, 7), to: today },
    { label: "Last 30 days", key: "30d", from: subDays(today, 30), to: today },
    { label: "Last 3 months", key: "3m", from: subMonths(today, 3), to: today },
    { label: "Last year", key: "1y", from: subYears(today, 1), to: today },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setFromDate(preset.from);
    setToDate(preset.to);
    applyFilters(preset.from, preset.to, preset.key);
  };

  const handleClear = () => {
    setFromDate(defaultFrom);
    setToDate(today);
    setTrendFilter("daily");
    setChartMetric("both");
    setActivePreset("30d");
    setQuery({ start_date: format(defaultFrom, "yyyy-MM-dd"), end_date: format(today, "yyyy-MM-dd"), limit: 20, page: 0 });
  };

  const trendData = useMemo((): NewRawMaterialTrendPoint[] => {
    if (!data?.report) return [];
    const map: Record<TrendType, NewRawMaterialPaginatedTrendPoints | null | undefined> = {
      daily: data.report.daily_trend,
      weekly: data.report.weekly_trend,
      monthly: data.report.monthly_trend,
      yearly: data.report.yearly_trend,
    };
    return map[trendFilter]?.data ?? [];
  }, [trendFilter, data]);

  const paginationInfo = useMemo(() => {
    if (!data?.report) return null;
    const map: Record<TrendType, NewRawMaterialPaginatedTrendPoints | null | undefined> = {
      daily: data.report.daily_trend,
      weekly: data.report.weekly_trend,
      monthly: data.report.monthly_trend,
      yearly: data.report.yearly_trend,
    };
    return map[trendFilter]?.pagination ?? null;
  }, [trendFilter, data]);

  const totalPages = paginationInfo ? Math.max(1, Math.ceil(paginationInfo.total / query.limit)) : 1;
  const currentPage = paginationInfo?.page ?? query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  const visiblePages = () => {
    const win = 2;
    const start = Math.max(0, Math.min(currentPage - win, totalPages - 1 - 2 * win));
    const end = Math.min(totalPages - 1, start + 2 * win);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const loading = isLoading || isFetching;

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
          <p className="font-medium text-destructive mb-2">Failed to load raw material report</p>
          <p className="text-sm text-muted-foreground mb-4">{error?.message || "An error occurred"}</p>
          <Button variant="outline" size="sm" onClick={handleClear}>Reset filters</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !data) return <DashboardSkeleton />;

  const report = data?.report;
  if (!report) {
    return (
      <div className="space-y-6">
        <div className="bg-muted rounded-xl p-6 text-center">
          <p className="font-medium mb-2">No data available for selected range</p>
          <Button variant="outline" size="sm" onClick={handleClear}>Reset filters</Button>
        </div>
      </div>
    );
  }

  const overview = report.overview ?? {
    total_material_used: 0,
    total_investment: 0,
    total_orders: 0,
    highest_cost_material_value: 0,
    highest_cost_material_name: "",
    most_used_material_quantity: 0,
    most_used_material_name: "",
  };

  const statsCard = report.stats_card ?? {
    total_materials: 0,
    total_current_stock: 0,
    total_inventory_value: 0,
    total_material_used_all_time: 0,
    total_investment_all_time: 0,
    max_used_quantity: 0,
    most_used_material_name: "",
    most_used_material_quantity: 0,
    most_expensive_unit_cost: 0,
    most_expensive_material_name: "",
    avg_material_value: 0,
  };

  const topMaterials = report.top_used_materials ?? [];
  const usageBreakdown = report.material_usage_breakdown ?? [];
  const dailyUsage = report.daily_usage_summary ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Raw Material Usage Report</h1>
        <p className="text-xs text-muted-foreground mt-1">Track material consumption and investment analysis</p>
      </div>

      {/* Date Filter */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date Range</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button key={p.key} variant="outline" size="sm" onClick={() => handlePreset(p)} disabled={loading}
              className={cn("rounded-xl text-xs h-7 px-3", activePreset === p.key && "bg-primary text-primary-foreground")}>
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={loading} className="w-full h-9 justify-start">
                  <CalendarDays className="w-3.5 h-3.5 mr-2" />
                  {fromDate ? format(fromDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xl">
                <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={loading} className="w-full h-9 justify-start">
                  <CalendarDays className="w-3.5 h-3.5 mr-2" />
                  {toDate ? format(toDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xl">
                <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Items per page</Label>
            <Select value={String(query.limit)} onValueChange={v => setQuery(prev => ({ ...prev, limit: Number(v), page: 0 }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => applyFilters()} disabled={!!dateError || loading} className="flex-1 h-9">
              {loading ? "Loading..." : "Apply"}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={loading} className="h-9 px-3">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {dateError && <p className="text-xs text-destructive">{dateError}</p>}
      </div>

      {/* KPI Cards - Focus on USAGE and INVESTMENT only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Material Used"
          value={formatNumber(overview.total_material_used, " units")}
          icon={<Package className="w-4 h-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Investment"
          value={formatCurrency(overview.total_investment)}
          icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Orders Processed"
          value={formatNumber(overview.total_orders)}
          icon={<Receipt className="w-4 h-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Most Used Material"
          value={overview.most_used_material_name || "—"}
          subtitle={`${formatNumber(overview.most_used_material_quantity)} units used`}
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      {/* All-time Investment Stats */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">All-time Investment Summary</span>
          <Chip>Lifetime</Chip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Total Materials Used</p>
            <p className="text-sm font-semibold font-mono">{formatNumber(statsCard.total_material_used_all_time, " units")}</p>
          </div>
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Total Investment</p>
            <p className="text-sm font-semibold font-mono">{formatCurrency(statsCard.total_investment_all_time)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Unique Materials</p>
            <p className="text-sm font-semibold font-mono">{formatNumber(statsCard.total_materials)}</p>
          </div>
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Highest Cost Material</p>
            <p className="text-sm font-semibold font-mono truncate" title={statsCard.most_expensive_material_name}>
              {statsCard.most_expensive_material_name || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(statsCard.most_expensive_unit_cost)}/unit</p>
          </div>
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Most Used All-time</p>
            <p className="text-sm font-semibold font-mono truncate" title={statsCard.most_used_material_name}>
              {statsCard.most_used_material_name || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">{formatNumber(statsCard.most_used_material_quantity)} units</p>
          </div>
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Average Material Cost</p>
            <p className="text-sm font-semibold font-mono">{formatCurrency(statsCard.avg_material_value)}</p>
          </div>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Usage & Cost Trend</span>
            <Chip variant="accent">{trendFilter}</Chip>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border">
              {(["usage", "cost", "both"] as const).map(m => (
                <button key={m} onClick={() => setChartMetric(m)}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md capitalize",
                    chartMetric === m ? "bg-background shadow-sm" : "text-muted-foreground")}>
                  {m === "usage" ? "Usage" : m === "cost" ? "Cost" : "Both"}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                <button key={f} onClick={() => { setTrendFilter(f); setQuery(prev => ({ ...prev, page: 0 })); }}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md capitalize",
                    trendFilter === f ? "bg-background shadow-sm" : "text-muted-foreground")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-80">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">No trend data available</div>
          ) : chartMetric === "both" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="cost" tickFormatter={formatCurrency} width={78} axisLine={false} tickLine={false} />
                <YAxis yAxisId="usage" orientation="right" tickFormatter={v => formatCompactNumber(v)} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line yAxisId="cost" type="monotone" dataKey="total_cost" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} name="Total Cost" />
                <Line yAxisId="usage" type="monotone" dataKey="material_used" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} name="Material Used" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={chartMetric === "cost" ? formatCurrency : v => formatCompactNumber(v)} width={78} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey={chartMetric === "cost" ? "total_cost" : "material_used"}
                  fill={chartMetric === "cost" ? COLORS[0] : COLORS[2]} radius={[5, 5, 0, 0]}
                  name={chartMetric === "cost" ? "Total Cost" : "Material Used"} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {paginationInfo && paginationInfo.total > query.limit && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="text-xs text-muted-foreground">{trendData.length} of {paginationInfo.total} records</span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={e => { e.preventDefault(); if (!isFirstPage) setQuery(p => ({ ...p, page: p.page - 1 })); }}
                    className={cn(isFirstPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
                {visiblePages().map(n => (
                  <PaginationItem key={n}>
                    <PaginationLink href="#" onClick={e => { e.preventDefault(); setQuery(p => ({ ...p, page: n })); }}
                      className={cn(currentPage === n && "bg-primary text-primary-foreground")}>
                      {n + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={e => { e.preventDefault(); if (!isLastPage) setQuery(p => ({ ...p, page: p.page + 1 })); }}
                    className={cn(isLastPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Top Used Materials - Cost Focus */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Top Materials by Cost</span>
          <Chip>Highest investment</Chip>
        </div>
        {topMaterials.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No material usage data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground text-xs">
                  <th className="pb-3 font-medium">Material</th>
                  <th className="pb-3 font-medium text-right">Unit Cost</th>
                  <th className="pb-3 font-medium text-right">Quantity Used</th>
                  <th className="pb-3 font-medium text-right">Total Investment</th>
                  <th className="pb-3 font-medium text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topMaterials.map((m: NewTopUsedRawMaterial, i: number) => (
                  <tr key={m.material_id} className="border-b border-border/50">
                    <td className="py-3 font-medium">{m.material_name}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{formatCurrency(m.unit_cost)}</td>
                    <td className="py-3 text-right font-mono">{formatNumber(m.total_quantity_used)}</td>
                    <td className="py-3 text-right font-mono font-semibold" style={{ color: COLORS[i % COLORS.length] }}>
                      {formatCurrency(m.total_cost)}
                    </td>
                    <td className="py-3 text-right font-mono">{formatNumber(m.affected_orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material Usage Breakdown - Investment Percentage */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Investment Breakdown by Material</span>
          <Chip>Cost distribution</Chip>
        </div>
        {usageBreakdown.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No breakdown data available</div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {usageBreakdown.slice(0, 15).map((m: NewRawMaterialUsageBreakdown, i: number) => (
              <div key={m.material_id} className="space-y-1.5">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <span className="text-sm font-medium">{m.material_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({m.unit})</span>
                  </div>
                  <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>
                    {formatCurrency(m.period_cost)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, m.usage_percent)}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-xs font-mono w-16 text-right">{m.usage_percent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {formatNumber(m.period_usage)} units</span>
                  <span>Affected {formatNumber(m.orders_count)} orders</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Usage - Shows consumption pattern over time */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Daily Consumption Pattern</span>
          <Chip variant="accent">Usage over time</Chip>
        </div>
        {dailyUsage.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No daily usage data available</div>
        ) : (
          <>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsage.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="usage_date" tickFormatter={date => format(parseISO(date), "MMM d")} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="cost" tickFormatter={formatCurrency} width={78} />
                  <YAxis yAxisId="usage" orientation="right" tickFormatter={v => formatCompactNumber(v)} width={50} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar yAxisId="cost" dataKey="total_cost" fill={COLORS[0]} radius={[4, 4, 0, 0]} name="Total Cost" />
                  <Bar yAxisId="usage" dataKey="total_material_used" fill={COLORS[2]} radius={[4, 4, 0, 0]} name="Material Used" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr className="text-left text-muted-foreground text-xs">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Material Used</th>
                    <th className="pb-2 font-medium text-right">Investment</th>
                    <th className="pb-2 font-medium text-right">Orders</th>
                    <th className="pb-2 font-medium text-right">Unique Materials</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyUsage.map((d: NewDailyRawMaterialUsage) => (
                    <tr key={d.usage_date} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 font-mono text-xs">{format(parseISO(d.usage_date), "EEE, MMM d, yyyy")}</td>
                      <td className="py-2 text-right font-mono">{formatNumber(d.total_material_used)}</td>
                      <td className="py-2 text-right font-mono text-orange-600 dark:text-orange-400 font-semibold">
                        {formatCurrency(d.total_cost)}
                      </td>
                      <td className="py-2 text-right font-mono">{formatNumber(d.orders_count)}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{formatNumber(d.unique_materials_used)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}