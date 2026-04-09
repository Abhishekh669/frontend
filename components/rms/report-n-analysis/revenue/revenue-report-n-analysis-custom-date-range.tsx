"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CalendarDays, RefreshCw } from "lucide-react";
import {
  format, subDays, subMonths, subYears, isAfter, startOfDay, parseISO,
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

import { useGetCustomRangeRevenueReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/revenue/use-get-custom-range-revenue-report";
import type {
  NewCustomRangeRevenueResponse, NewTrendPoint, NewPaymentMethodBreakdown,
  NewGatewayBreakdown, NewPeakDayPoint, NewPaginatedTrendPoints,
} from "@/utils/types/report-n-analysis.types";
import type { CustomQuery } from "@/utils/actions/report-n-analysis/revenue/revenue.get";

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

// ─── Safe date string → Date (avoids UTC midnight timezone shift) ─────────────
// new Date("2026-04-01") → Mar 31 in UTC+5:45. parseISO fixes this.
const safeDate = (s: string) => parseISO(s);

// ─── Config ───────────────────────────────────────────────────────────────────
const GATEWAY_LABELS: Record<string, string> = {
  esewa: "eSewa", khalti: "Khalti", fonepay: "FonePay",
  banking: "Banking", other: "Other", cash: "Cash", online: "Online",
};
const getLabel = (key: string | undefined) =>
  key ? (GATEWAY_LABELS[key.toLowerCase()] ?? key) : "—";

const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556"];

export type TrendType = "daily" | "weekly" | "monthly" | "yearly";

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md min-w-[140px]">
      <p className="text-xs text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name === "revenue" || p.name === "Revenue"
            ? fmtRs(p.value)
            : `${fmtNum(p.value)} orders`}
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
      <p className="text-xs text-muted-foreground mb-1 font-mono">{getLabel(d.name)}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">
        {fmtRs(d.value)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
        {(d.payload.percent ?? 0).toFixed(1)}%
      </p>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-5">
    <div className="flex justify-between">
      <div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-3.5 w-36" /></div>
      <Skeleton className="h-8 w-28" />
    </div>
    <Skeleton className="h-36 w-full" />
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
    <Skeleton className="h-72 w-full" />
    <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, sub, accent, icon,
}: {
  label: string; value: string; sub?: string; accent?: string; icon?: string;
}) => (
  <div className="bg-secondary/60 rounded-xl p-4 space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {icon && <span className="text-base opacity-60">{icon}</span>}
    </div>
    <div className="text-[22px] font-semibold font-mono leading-none" style={{ color: accent }}>
      {value}
    </div>
    {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
  </div>
);

// ─── Section badge ────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "default" }: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "warn";
}) => {
  const cls = {
    default: "bg-secondary text-muted-foreground",
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }[variant];
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full font-mono", cls)}>
      {children}
    </span>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportAndAnalysisCustomDateRangePage() {
  const today = startOfDay(new Date());
  const defaultFrom = subDays(today, 30);

  const [query, setQuery] = useState<CustomQuery>({
    start_date: format(defaultFrom, "yyyy-MM-dd"),
    end_date: format(today, "yyyy-MM-dd"),
    limit: 20,
    page: 0,
  });

  // Local date picker state — kept separate so Apply is explicit
  const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
  const [toDate, setToDate] = useState<Date | undefined>(today);
  const [dateError, setDateError] = useState("");
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [chartMode, setChartMode] = useState<"revenue" | "orders" | "both">("revenue");
  const [activePreset, setActivePreset] = useState<string>("30d");

  const { data, isLoading, isError, error, isFetching } = useGetCustomRangeRevenueReport(query);

  // ── Validation ──
  const validate = useCallback((from?: Date, to?: Date): boolean => {
    if (!from || !to) { setDateError("Both dates are required"); return false; }
    if (isAfter(from, today)) { setDateError("From date cannot be in the future"); return false; }
    if (isAfter(to, today)) { setDateError("To date cannot be in the future"); return false; }
    if (isAfter(from, to)) { setDateError("From date must be before to date"); return false; }
    setDateError("");
    return true;
  }, [today]);

  useEffect(() => { validate(fromDate, toDate); }, [fromDate, toDate, validate]);

  // ── Apply filters ──
  const applyFilters = (from?: Date, to?: Date, preset?: string) => {
    const f = from ?? fromDate;
    const t = to ?? toDate;
    if (!validate(f, t) || !f || !t) { toast.error(dateError || "Invalid dates"); return; }
    setQuery(prev => ({
      ...prev,
      start_date: format(f, "yyyy-MM-dd"),
      end_date: format(t, "yyyy-MM-dd"),
      page: 0,
    }));
    if (preset) setActivePreset(preset);
  };

  // ── Quick presets — fix: they call applyFilters directly ──
  const presets = [
    {
      label: "Last 7 days", key: "7d",
      from: subDays(today, 7), to: today,
    },
    {
      label: "Last 30 days", key: "30d",
      from: subDays(today, 30), to: today,
    },
    {
      label: "Last 3 months", key: "3m",
      from: subMonths(today, 3), to: today,
    },
    {
      label: "Last year", key: "1y",
      from: subYears(today, 1), to: today,
    },
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
    setChartMode("revenue");
    setActivePreset("30d");
    setQuery({ start_date: format(defaultFrom, "yyyy-MM-dd"), end_date: format(today, "yyyy-MM-dd"), limit: 20, page: 0 });
  };

  // ── Trend data ──
  const trendData = useMemo((): NewTrendPoint[] => {
    if (!data?.report) return [];
    const map: Record<TrendType, NewPaginatedTrendPoints | undefined> = {
      daily: data.report.daily_trend,
      weekly: data.report.weekly_trend,
      monthly: data.report.monthly_trend,
      yearly: data.report.yearly_trend,
    };
    return map[trendFilter]?.data ?? [];
  }, [trendFilter, data]);

  const paginationInfo = useMemo(() => {
    if (!data?.report) return null;
    const map: Record<TrendType, NewPaginatedTrendPoints | undefined> = {
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

  if (isLoading && !data) return <DashboardSkeleton />;

  if (isError) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex gap-4">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-medium text-destructive mb-1">Failed to load revenue data</p>
          <p className="text-sm text-muted-foreground mb-4">{error?.message}</p>
        </div>
      </div>
    </div>
  );

  const report = data?.report;
  if (!report) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-muted rounded-xl p-6 text-center">
        <p className="font-medium mb-2">No data for selected range</p>
        <Button variant="outline" size="sm" onClick={handleClear}>Reset filters</Button>
      </div>
    </div>
  );

  const ov = report.overview;
  const sc = report.stats_card;
  const disc = report.discounts;
  const maxPeakRev = report.peak_days?.length
    ? Math.max(...report.peak_days.map((d: NewPeakDayPoint) => d.revenue))
    : 1;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Revenue analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Custom date range · Nepalese Rupee (NPR)
          </p>
        </div>
        {ov.growth_percent != null && ov.growth_percent !== 0 && (
          <span className={cn(
            "text-xs font-semibold font-mono px-3 py-1.5 rounded-full",
            ov.growth_percent >= 0
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
          )}>
            {ov.growth_percent >= 0 ? "↑" : "↓"} {Math.abs(ov.growth_percent).toFixed(1)}% vs prior period
          </span>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Date range &amp; filters
          </span>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button
              key={p.key}
              variant="outline"
              size="sm"
              onClick={() => handlePreset(p)}
              disabled={loading}
              className={cn(
                "rounded-lg text-xs h-7 px-3",
                activePreset === p.key && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* From */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={loading}
                  className={cn("w-full h-9 justify-start rounded-lg text-sm font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {fromDate ? format(fromDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xl border shadow-lg">
                <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate}
                  disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={loading}
                  className={cn("w-full h-9 justify-start rounded-lg text-sm font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {toDate ? format(toDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xl border shadow-lg">
                <CalendarComponent mode="single" selected={toDate} onSelect={setToDate}
                  disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Limit */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Items per page</Label>
            <Select value={String(query.limit)} disabled={loading}
              onValueChange={v => setQuery(prev => ({ ...prev, limit: Number(v), page: 0 }))}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[10, 20, 50, 100].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => applyFilters()}
              disabled={!!dateError || !fromDate || !toDate || loading}
              className="h-9 rounded-lg flex-1 text-sm"
            >
              {loading ? "Loading…" : "Apply filters"}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={loading}
              className="h-9 rounded-lg px-3">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {dateError && <p className="text-xs text-destructive">{dateError}</p>}
        {!dateError && query.start_date && query.end_date && (
          <p className="text-xs text-muted-foreground font-mono">
            Showing {format(safeDate(query.start_date), "MMM d, yyyy")} → {format(safeDate(query.end_date), "MMM d, yyyy")}
          </p>
        )}
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Gross revenue" value={fmtRs(ov.gross_revenue)} accent="#d85a30" icon="💰" />
        <KpiCard label="Net revenue" value={fmtRs(ov.net_revenue)} accent="#3b6d11" icon="✓" />
        <KpiCard label="Total orders" value={fmtNum(ov.total_orders)}
          sub={`AOV ${fmtRs(ov.average_order_value)}`} icon="🛒" />
        <KpiCard label="Discounts given" value={fmtRs(ov.total_discounts)} accent="#ba7517" icon="🏷" />
      </div>

      {/* ── All-time stats ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            All-time statistics
          </span>
          <Chip>Global</Chip>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            ["Gross rev", fmtRs(sc.total_gross_revenue)],
            ["Net rev", fmtRs(sc.total_net_revenue)],
            ["Orders", fmtNum(sc.total_orders)],
            ["Discounts", fmtRs(sc.total_discounts)],
            ["AOV", fmtRs(sc.average_order_value)],
            ["Customers", fmtNum(sc.total_customers)],
            ["Discount %", `${(sc.discount_rate_percent ?? 0).toFixed(1)}%`],
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
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Revenue trend
            </span>
            <Chip variant="accent">{trendFilter}</Chip>
            {paginationInfo && (
              <Chip>{paginationInfo.total} records</Chip>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Chart mode */}
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["revenue", "orders", "both"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all",
                    chartMode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {m}
                </button>
              ))}
            </div>
            {/* Granularity */}
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                <button key={f} onClick={() => { setTrendFilter(f); setQuery(prev => ({ ...prev, page: 0 })); }}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all",
                    trendFilter === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-68">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No trend data for this period
            </div>
          ) : chartMode === "both" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false} tickLine={false} tickFormatter={fmtRs} width={78} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke={COLORS[0]}
                  strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={COLORS[2]}
                  strokeWidth={2} dot={{ r: 3 }} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                barCategoryGap={trendData.length === 1 ? "60%" : "22%"}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false}
                  tickLine={false}
                  tickFormatter={chartMode === "revenue" ? fmtRs : undefined}
                  width={chartMode === "revenue" ? 78 : 40} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey={chartMode} fill={chartMode === "revenue" ? COLORS[0] : COLORS[2]}
                  radius={[5, 5, 0, 0]}
                  name={chartMode === "revenue" ? "Revenue" : "Orders"}
                  maxBarSize={trendData.length === 1 ? 80 : undefined} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pagination */}
        {paginationInfo && paginationInfo.total > query.limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-mono">
              {trendData.length} of {paginationInfo.total} records
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#"
                    onClick={e => { e.preventDefault(); if (!isFirstPage) setQuery(p => ({ ...p, page: p.page - 1 })); }}
                    className={cn("rounded-lg text-xs", isFirstPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
                {visiblePages().map(n => (
                  <PaginationItem key={n}>
                    <PaginationLink href="#"
                      onClick={e => { e.preventDefault(); setQuery(p => ({ ...p, page: n })); }}
                      className={cn("rounded-lg text-xs border",
                        currentPage === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      )}>
                      {n + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#"
                    onClick={e => { e.preventDefault(); if (!isLastPage) setQuery(p => ({ ...p, page: p.page + 1 })); }}
                    className={cn("rounded-lg text-xs", isLastPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* ── Payment methods + Gateways ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payment methods</span>
            <Chip>{report.payment_methods?.length ?? 0} types</Chip>
          </div>
          {!report.payment_methods?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.payment_methods} dataKey="revenue" nameKey="method"
                      cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={3}>
                      {report.payment_methods.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-3">
                {report.payment_methods.map((m: NewPaymentMethodBreakdown, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{getLabel(m.method)}</span>
                    <strong className="font-mono">{(m.percent ?? 0).toFixed(1)}%</strong>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Online gateways</span>
            <Chip>{report.gateways?.length ?? 0}</Chip>
          </div>
          {!report.gateways?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-4">
              {report.gateways.map((g: NewGatewayBreakdown, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium">{getLabel(g.gateway)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{fmtNum(g.orders)} orders</span>
                      <span className="text-sm font-semibold font-mono"
                        style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(g.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${g.percent ?? 0}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Peak hours + days ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Peak hours</p>
          {!report.peak_hours?.length ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.peak_hours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={h => `${h}h`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false}
                    tickLine={false} tickFormatter={fmtRs} width={72} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Peak days</p>
          {!report.peak_days?.length ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {report.peak_days.map((d: NewPeakDayPoint, i: number) => (
                <div key={i} className="flex items-center gap-3">
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
          )}
        </div>
      </div>

      {/* ── Discount analysis ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Discount analysis</span>
          <Chip variant="warn">{(disc.discount_rate_percent ?? 0).toFixed(1)}% rate</Chip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            ["Discounts given", fmtRs(disc.total_discounts_given), "#ba7517"],
            ["Gross revenue", fmtRs(disc.gross_revenue), "#d85a30"],
            ["Net revenue", fmtRs(disc.net_revenue), "#3b6d11"],
            ["Discount rate", `${(disc.discount_rate_percent ?? 0).toFixed(1)}%`, "#a32d2d"],
            ["Orders w/ discount", fmtNum(disc.orders_with_discount), "#185fa5"],
            ["Total orders", fmtNum(disc.total_orders), "var(--foreground)"],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-semibold font-mono" style={{ color: c as string }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}