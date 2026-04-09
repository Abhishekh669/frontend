"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
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

import { useGetCustomRangeCustomerReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/customer/use-get-customer-report-n-analysis-default";
import type { CustomQuery } from "@/utils/actions/report-n-analysis/customer/customer.get";
import type {
  NewCustomRangeCustomerResponse,
  NewCustomerTrendPoint,
  NewCustomerPaginatedTrendPoints,
  NewTopCustomer,
  NewFrequentCustomer,
  NewRetentionMetrics,
  NewCustomerSegment,
  NewStreakAnalytics,
  NewTokenAnalytics,
  NewTopTokenCustomer,
} from "@/utils/types/report-n-analysis.types";

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
const fmtPct = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
};
const fmtDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Never";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid date";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-NP", { month: "short", day: "numeric" });
  } catch {
    return "Invalid date";
  }
};

const safeDate = (s: string) => {
  try {
    return parseISO(s);
  } catch {
    return new Date();
  }
};

// ─── Config ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556", "#0891b2", "#a21caf"];
const SEGMENT_COLORS: Record<string, string> = {
  "High Spender": "#d85a30",
  "Regular": "#378add",
  "Occasional": "#1d9e75",
  "New": "#534ab7",
};

export type TrendType = "daily" | "weekly" | "monthly" | "yearly";

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md min-w-[140px]">
      <p className="text-xs text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name?.toLowerCase().includes("revenue") || p.name === "Revenue"
            ? fmtRs(p.value)
            : fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  if (!d) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1 font-mono capitalize">{d.name}</p>
      <p style={{ color: d.payload?.fill }} className="text-sm font-semibold font-mono">{fmtNum(d.value)}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{(d.payload?.percent ?? 0).toFixed(1)}%</p>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-5">
    <div className="flex justify-between">
      <div className="space-y-2"><Sk className="h-7 w-52" /><Sk className="h-3.5 w-36" /></div>
    </div>
    <Sk className="h-36 w-full" />
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} className="h-24" />)}</div>
    <Sk className="h-72 w-full" />
    <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <Sk key={i} className="h-56" />)}</div>
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
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full font-mono", cls)}>
      {children}
    </span>
  );
};

// ─── Retention Gauge ──────────────────────────────────────────────────────────
const RetentionGauge = ({ value, label }: { value: number | null | undefined; label: string }) => {
  const safeValue = value ?? 0;
  const getColor = (v: number) => {
    if (v >= 70) return "#1d9e75";
    if (v >= 40) return "#ba7517";
    return "#d85a30";
  };
  
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--secondary)" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={getColor(safeValue)} strokeWidth="6"
            strokeDasharray={`${safeValue * 2.26} 226`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono" style={{ color: getColor(safeValue) }}>{fmtPct(safeValue)}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-mono">{label}</p>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerReportAndAnalysisCustomDateRangePage() {
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
  const [chartMode, setChartMode] = useState<"users" | "both">("both");
  const [activePreset, setActivePreset] = useState<string>("30d");

  const { data, isLoading, isError, error, isFetching } = useGetCustomRangeCustomerReport(query);

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
    setChartMode("both");
    setActivePreset("30d");
    setQuery({ start_date: format(defaultFrom, "yyyy-MM-dd"), end_date: format(today, "yyyy-MM-dd"), limit: 20, page: 0 });
  };

  // ── Trend data ──
  const trendData = useMemo((): NewCustomerTrendPoint[] => {
    if (!data?.report) return [];
    const report: NewCustomRangeCustomerResponse = data.report;
    const map: Record<TrendType, NewCustomerPaginatedTrendPoints | null> = {
      daily: report.daily_trend ?? null,
      weekly: report.weekly_trend ?? null,
      monthly: report.monthly_trend ?? null,
      yearly: report.yearly_trend ?? null,
    };
    return map[trendFilter]?.data ?? [];
  }, [trendFilter, data]);

  const paginationInfo = useMemo(() => {
    if (!data?.report) return null;
    const report: NewCustomRangeCustomerResponse = data.report;
    const map: Record<TrendType, NewCustomerPaginatedTrendPoints | null> = {
      daily: report.daily_trend ?? null,
      weekly: report.weekly_trend ?? null,
      monthly: report.monthly_trend ?? null,
      yearly: report.yearly_trend ?? null,
    };
    return map[trendFilter]?.pagination ?? null;
  }, [trendFilter, data]);

  // ─── All useMemo hooks BEFORE any conditional returns ───
  const segmentData = useMemo(() => {
    if (!data?.report?.customer_segments) return [];
    return data.report.customer_segments.map(s => ({
      name: s.segment ?? "Unknown",
      value: s.count ?? 0,
      percent: s.percent ?? 0,
      revenue: s.total_revenue ?? 0,
    }));
  }, [data]);

  const streakDistData = useMemo(() => {
    if (!data?.report?.streak_analytics?.streak_distribution) return [];
    return data.report.streak_analytics.streak_distribution.map(s => ({
      name: s.streak_range ?? "Unknown",
      value: s.count ?? 0,
      percent: s.percent ?? 0,
    }));
  }, [data]);

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
          <p className="font-medium text-destructive mb-1">Failed to load customer data</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message}</p>
        </div>
      </div>
    </div>
  );

  const report: NewCustomRangeCustomerResponse | undefined = data?.report;

  if (!report) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-muted rounded-xl p-6 text-center">
        <p className="font-medium mb-2">No data for selected range</p>
        <Button variant="outline" size="sm" onClick={handleClear}>Reset filters</Button>
      </div>
    </div>
  );

  // Safe access with defaults
  const ov = report.overview ?? {} as any;
  const sc = report.stats_card ?? {} as any;
  const rm = report.retention_metrics ?? {} as NewRetentionMetrics;
  const sa = report.streak_analytics ?? {} as NewStreakAnalytics;
  const ta = report.token_analytics ?? {} as NewTokenAnalytics;

  const returningRate = ov.total_customers ? (ov.returning_customers / ov.total_customers) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customer analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Custom date range · Customer insights & retention
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
        <KpiCard label="Total Customers" value={fmtNum(ov.total_customers)} accent="#378add" icon="👥" />
        <KpiCard label="New Customers" value={fmtNum(ov.new_customers)} 
          sub={`Active: ${fmtNum(ov.active_customers)}`} icon="✨" />
        <KpiCard label="Returning Rate" value={fmtPct(returningRate)} 
          accent="#1d9e75" icon="🔄" />
        <KpiCard label="Avg Spend/Customer" value={fmtRs(ov.avg_spend_per_customer)} 
          sub={`${fmtNum(ov.avg_orders_per_customer)} orders/cust`} accent="#ba7517" icon="💰" />
      </div>

      {/* ── All-time stats ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            All-time statistics
          </span>
          <Chip>Global</Chip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {[
            ["Total Customers", fmtNum(sc.total_customers)],
            ["Total Orders", fmtNum(sc.total_orders)],
            ["Total Revenue", fmtRs(sc.total_revenue)],
            ["Avg Lifetime Value", fmtRs(sc.avg_lifetime_value)],
            ["Tokens Issued", fmtNum(sc.total_tokens_issued)],
            ["Tokens Redeemed", fmtNum(sc.total_tokens_redeemed)],
            ["Active Streakers", fmtNum(sc.active_streak_customers)],
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
              Customer growth
            </span>
            <Chip variant="accent">{trendFilter}</Chip>
            {paginationInfo && <Chip>{paginationInfo.total} records</Chip>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["both", "users"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all",
                    chartMode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {m === "both" ? "All" : "New Only"}
                </button>
              ))}
            </div>
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

        <div className="h-72">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No trend data for this period
            </div>
          ) : chartMode === "both" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="total_users" stroke={COLORS[0]} fill={`${COLORS[0]}20`} 
                  strokeWidth={2} name="Total Users" />
                <Area type="monotone" dataKey="new_users" stroke={COLORS[2]} fill={`${COLORS[2]}20`} 
                  strokeWidth={2} name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="new_users" fill={COLORS[2]} radius={[5, 5, 0, 0]} name="New Users" />
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

      {/* ── Retention Metrics ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Retention metrics
          </span>
          <Chip variant="success">Health</Chip>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <RetentionGauge value={rm.retention_rate_30_days} label="30-Day Retention" />
          <RetentionGauge value={rm.retention_rate_90_days} label="90-Day Retention" />
          <RetentionGauge value={rm.repeat_purchase_rate} label="Repeat Purchase" />
          <div className="col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Churn Rate</span>
              <span className="text-sm font-semibold font-mono" style={{ color: (rm.churn_rate ?? 0) > 20 ? "#d85a30" : "#1d9e75" }}>
                {fmtPct(rm.churn_rate)}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(rm.churn_rate ?? 0, 100)}%`, background: (rm.churn_rate ?? 0) > 20 ? "#d85a30" : "#1d9e75" }} />
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted-foreground">Avg Days Between Orders</span>
              <span className="text-sm font-semibold font-mono">{fmtNum(rm.avg_days_between_orders)} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Segments + Streak Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Customer segments
            </span>
            <Chip>{segmentData.length} segments</Chip>
          </div>
          {segmentData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No segment data</div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={segmentData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {segmentData.map((entry, i) => (
                        <Cell key={i} fill={SEGMENT_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {report.customer_segments?.map((s: NewCustomerSegment, i: number) => (
                  <div key={s.segment} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEGMENT_COLORS[s.segment] || COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-medium">{s.segment}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{fmtPct(s.percent)}</span>
                      <span className="text-xs font-mono font-semibold">{fmtRs(s.avg_spend)} avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Streak distribution
            </span>
            <Chip variant="accent">🔥 {fmtNum(sa.total_streak_customers)} streakers</Chip>
          </div>
          {streakDistData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No streak data</div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streakDistData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill={COLORS[3]} radius={[0, 5, 5, 0]} name="Customers">
                      {streakDistData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 pt-2 border-t border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Avg Streak</span>
                  <p className="text-lg font-bold font-mono">{fmtNum(sa.avg_streak_length)} days</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase">Max Streak</span>
                  <p className="text-lg font-bold font-mono" style={{ color: COLORS[0] }}>{fmtNum(sa.max_streak_length)} days</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Top Customers ─── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Top customers
          </span>
          <Chip>{report.top_customers?.length ?? 0}</Chip>
        </div>
        {!report.top_customers?.length ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Customer", "Orders", "Total Spent", "AOV", "Last Order"].map(h => (
                    <th key={h} className="pb-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.top_customers.map((c: NewTopCustomer, i: number) => (
                  <tr key={c.customer_id}>
                    <td className="py-2.5 pr-4 font-mono text-muted-foreground">#{i + 1}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{c.customer_name ?? "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.phone_number ?? "-"}</p>
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{fmtNum(c.total_orders)}</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(c.total_spent)}</td>
                    <td className="py-2.5 pr-4 font-mono">{fmtRs(c.avg_order_value)}</td>
                    <td className="py-2.5 font-mono text-muted-foreground">{fmtDate(c.last_order_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Frequent Customers + Token Analytics ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Frequent visitors
            </span>
            <Chip>{report.frequent_customers?.length ?? 0}</Chip>
          </div>
          {!report.frequent_customers?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {report.frequent_customers.map((c: NewFrequentCustomer, i: number) => (
                <div key={c.customer_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                    style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                    {c.customer_name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.customer_name ?? "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {fmtNum(c.visit_frequency)} visits/week · {c.favorite_category ?? "N/A"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-semibold">{fmtNum(c.total_orders)} orders</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.days_since_last_visit === 0 ? "Today" : `${c.days_since_last_visit}d ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Token analytics
            </span>
            <Chip variant="accent">🎫 Tokens</Chip>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Earned</p>
              <p className="text-xl font-bold font-mono text-[#378add]">{fmtNum(ta.total_tokens_earned)}</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Spent</p>
              <p className="text-xl font-bold font-mono text-[#d85a30]">{fmtNum(ta.total_tokens_spent)}</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Balance</p>
              <p className="text-xl font-bold font-mono text-[#1d9e75]">{fmtNum(ta.active_token_balance)}</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Redemption Rate</p>
              <p className="text-xl font-bold font-mono text-[#ba7517]">{fmtPct(ta.token_redemption_rate)}</p>
            </div>
          </div>
          
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Top token earners</p>
          {!ta.top_token_earners?.length ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">No token data</div>
          ) : (
            <div className="space-y-2">
              {ta.top_token_earners.map((t: NewTopTokenCustomer, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{t.customer_name ?? "Unknown"}</span>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.phone_number ?? "-"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[#378add]">+{fmtNum(t.tokens_earned)}</span>
                    <span className="text-xs font-mono text-[#d85a30]">-{fmtNum(t.tokens_spent)}</span>
                    <span className="text-xs font-mono font-semibold">{fmtNum(t.token_balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}