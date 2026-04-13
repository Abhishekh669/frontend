"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { CalendarDays, RefreshCw } from "lucide-react";
import { format, subDays, subMonths, subYears, isAfter, startOfDay } from "date-fns";
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

import { useGetCustomRangeTableReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/tables/use-get-report-n-analysis-by-custom-date-range";
import type { CustomQuery } from "@/utils/actions/report-n-analysis/customer/customer.get";
import type {
  NewCustomRangeTableResponse,
  NewTableTrendPoint,
  NewTablePaginatedTrendPoints,
  NewTopTable,
  NewTableUsageBreakdown,
  NewTablePeakHour,
  NewOccupancyRate,
} from "@/utils/types/report-n-analysis.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a percentage value that may arrive as either:
 *   • 0–1   decimal  (e.g. 0.75  → 75 %)
 *   • 0–100 integer  (e.g. 75    → 75 %)
 * Values > 100 are treated as the 0–1 decimal range (× 100), clamped to 100.
 * Negative values are clamped to 0.
 */
const normalizePct = (n: number | null | undefined): number => {
  if (n == null || isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return Math.min(n * 100, 100);
  if (n <= 1) return n * 100;
  return n;
};

/** Clamp hours to non-negative — backend may return negative due to timezone bugs */
const safeHours = (n: number | null | undefined): number => Math.max(0, n ?? 0);

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
/** Always renders a clean 0–100 % string, normalizing whatever the backend sends */
const fmtPct = (n: number | null | undefined): string =>
  `${normalizePct(n).toFixed(1)}%`;

const fmtMin = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "0m";
  const absN = Math.abs(n);
  const h = Math.floor(absN / 60);
  const m = Math.round(absN % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
const fmtHour = (h: number): string => {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
};
const fmtHourShort = (h: number): string => {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556", "#2d8a8a", "#b55e26"];

const heatColor = (intensity: number): string => {
  if (intensity <= 0) return "rgb(226,232,240)";
  const stops = [
    [219, 234, 254],
    [96, 165, 250],
    [251, 191, 36],
    [239, 68, 68],
  ];
  const scaled = Math.min(intensity, 1) * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const t = scaled - lo;
  const r = Math.round(stops[lo][0] + (stops[hi][0] - stops[lo][0]) * t);
  const g = Math.round(stops[lo][1] + (stops[hi][1] - stops[lo][1]) * t);
  const b = Math.round(stops[lo][2] + (stops[hi][2] - stops[lo][2]) * t);
  return `rgb(${r},${g},${b})`;
};

type TrendType = "daily" | "weekly" | "monthly" | "yearly";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2"><Sk className="h-7 w-52" /><Sk className="h-3.5 w-36" /></div>
    <Sk className="h-36 w-full" />
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} className="h-24" />)}</div>
    <Sk className="h-72 w-full" />
    <Sk className="h-80 w-full" />
    <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <Sk key={i} className="h-56" />)}</div>
  </div>
);

// ─── Shared UI ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: string; icon?: string;
}) => (
  <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {icon && <span className="text-base opacity-60">{icon}</span>}
    </div>
    <div className="text-[22px] font-semibold font-mono leading-none" style={{ color: accent }}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
  </div>
);

const Chip = ({ children, variant = "default" }: {
  children: React.ReactNode; variant?: "default" | "accent" | "success";
}) => {
  const cls = {
    default: "bg-secondary text-muted-foreground",
    accent: "bg-accent/15 text-accent",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[variant];
  return <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full font-mono", cls)}>{children}</span>;
};

const Empty = ({ label = "No data available" }: { label?: string }) => (
  <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
    <span className="text-2xl opacity-30">📭</span>
    <span className="text-sm">{label}</span>
  </div>
);

// ─── Peak Hour Heatmap ────────────────────────────────────────────────────────
const PeakHourHeatmap = ({
  peakHours,
  occupancyRate,
}: {
  peakHours: NewTablePeakHour[];
  occupancyRate: NewOccupancyRate[];
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  /**
   * Build a 0–23 map merging peak_hours + occupancy_rate.
   * All percentage values are normalized to 0–100 range here.
   */
  const hourMap = useMemo(() => {
    const map: Record<number, {
      revenue: number;
      activeTables: number;
      sessions: number;
      occupancyRate: number;   // always 0–100 after normalization
      occupiedCount: number;
      totalCapacity: number;
    }> = {};
    for (let i = 0; i < 24; i++) {
      map[i] = { revenue: 0, activeTables: 0, sessions: 0, occupancyRate: 0, occupiedCount: 0, totalCapacity: 0 };
    }
    (peakHours ?? []).forEach(h => {
      if (map[h.hour] !== undefined) {
        map[h.hour].revenue = h.total_revenue ?? 0;
        map[h.hour].activeTables = h.active_tables ?? 0;
        map[h.hour].sessions = h.sessions_count ?? 0;
      }
    });
    (occupancyRate ?? []).forEach(o => {
      if (map[o.hour] !== undefined) {
        // FIX: normalize the rate — backend may send 0–1 decimal or 0–100
        map[o.hour].occupancyRate = normalizePct(o.rate);
        map[o.hour].occupiedCount = o.occupied_count ?? 0;
        map[o.hour].totalCapacity = o.total_capacity ?? 0;
      }
    });
    return map;
  }, [peakHours, occupancyRate]);

  const maxRevenue = Math.max(...Object.values(hourMap).map(h => h.revenue), 1);

  const peakEntry = Object.entries(hourMap).reduce<{ hour: number; revenue: number }>(
    (best, [h, d]) => d.revenue > best.revenue ? { hour: Number(h), revenue: d.revenue } : best,
    { hour: -1, revenue: 0 }
  );

  const activeHours = Object.entries(hourMap).filter(([, d]) => d.revenue > 0 || d.occupancyRate > 0);
  const hoveredData = hoveredHour != null ? hourMap[hoveredHour] : null;

  const HeatCell = ({ h }: { h: number }) => {
    const d = hourMap[h];
    const intensity = d.revenue / maxRevenue;
    const isPeak = h === peakEntry.hour;
    return (
      <div
        className={`rounded-lg cursor-pointer transition-all duration-150 select-none
          ${isPeak ? "ring-2 ring-[#d85a30] ring-offset-1" : ""}
          ${hoveredHour === h ? "scale-110 z-10 relative" : ""}`}
        style={{ background: heatColor(intensity), height: 52 }}
        onMouseEnter={() => setHoveredHour(h)}
        onMouseLeave={() => setHoveredHour(null)}
      >
        <div className="h-full flex flex-col items-center justify-center gap-0.5 px-1">
          <span className="text-[9px] font-bold leading-none"
            style={{ color: intensity > 0.55 ? "#fff" : "#334155" }}>
            {fmtHourShort(h)}
          </span>
          {d.revenue > 0 && (
            <span className="text-[8px] leading-none font-mono"
              style={{ color: intensity > 0.55 ? "rgba(255,255,255,0.85)" : "#64748b" }}>
              {fmtRs(d.revenue).replace("Rs. ", "Rs.")}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* Peak hour callout */}
      {peakEntry.hour >= 0 && peakEntry.revenue > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm font-semibold">
              Busiest time of day:{" "}
              <span className="text-[#d85a30] font-mono">{fmtHour(peakEntry.hour)}</span>
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {fmtRs(peakEntry.revenue)} revenue ·{" "}
              {fmtNum(hourMap[peakEntry.hour].activeTables)} tables active ·{" "}
              {fmtNum(hourMap[peakEntry.hour].sessions)} sessions ·{" "}
              {fmtPct(hourMap[peakEntry.hour].occupancyRate)} capacity used
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          24-hour activity heatmap — hover a cell for details
        </p>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map(i => (
              <div key={i} className="w-4 h-3 rounded-sm" style={{ background: heatColor(i) }} />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground font-mono">quiet → peak</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        <div className="flex gap-1 items-end">
          <span className="text-[9px] text-muted-foreground font-mono w-6 shrink-0 text-right">AM</span>
          <div className="grid grid-cols-12 gap-1 flex-1">
            {Array.from({ length: 12 }, (_, h) => <HeatCell key={h} h={h} />)}
          </div>
        </div>
        <div className="flex gap-1 items-end">
          <span className="text-[9px] text-muted-foreground font-mono w-6 shrink-0 text-right">PM</span>
          <div className="grid grid-cols-12 gap-1 flex-1">
            {Array.from({ length: 12 }, (_, i) => <HeatCell key={i + 12} h={i + 12} />)}
          </div>
        </div>
      </div>

      {/* Hour number labels */}
      <div className="flex gap-1 ml-7">
        <div className="grid grid-cols-12 gap-1 flex-1">
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
            <span key={n} className="text-[8px] text-center text-muted-foreground font-mono">{n}</span>
          ))}
        </div>
      </div>

      {/* Hover detail */}
      <div className={`transition-all duration-200 ${hoveredHour != null ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {hoveredHour != null && hoveredData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-background border border-border">
            <div className="sm:col-span-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Time slot</p>
              <p className="text-sm font-semibold font-mono">{fmtHour(hoveredHour)}</p>
              <p className="text-[10px] text-muted-foreground font-mono">to {fmtHour((hoveredHour + 1) % 24)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Revenue</p>
              <p className="text-sm font-semibold font-mono text-[#d85a30]">{fmtRs(hoveredData.revenue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active tables</p>
              <p className="text-sm font-semibold font-mono text-[#378add]">{fmtNum(hoveredData.activeTables)}</p>
              {hoveredData.totalCapacity > 0 && (
                <p className="text-[10px] text-muted-foreground font-mono">of {hoveredData.totalCapacity} total</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Occupancy</p>
              {/* FIX: already normalized in hourMap build */}
              <p className="text-sm font-semibold font-mono text-[#1d9e75]">{fmtPct(hoveredData.occupancyRate)}</p>
              <p className="text-[10px] text-muted-foreground font-mono">of capacity</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sessions</p>
              <p className="text-sm font-semibold font-mono">{fmtNum(hoveredData.sessions)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Revenue bar chart */}
      {/*
        X-axis: hour of day (0–23), shown as "12a", "1a" … "12p", "1p" …
        Y-axis: total revenue (Rs.) for that hour in the selected date range
      */}
      <div>
        <div className="mb-1">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Revenue per hour</p>
          <p className="text-[10px] text-muted-foreground font-mono">
            X-axis: time of day (12a = midnight … 12p = noon) · Y-axis: total revenue (Rs.)
          </p>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Array.from({ length: 24 }, (_, h) => ({ hour: h, ...hourMap[h] }))}
              margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
              barCategoryGap="8%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={fmtHourShort}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={fmtRs} width={72} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const h = label as number;
                  const d = hourMap[h];
                  return (
                    <div className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[200px]">
                      <p className="text-xs font-semibold mb-2 font-mono">{fmtHour(h)} – {fmtHour((h + 1) % 24)}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-mono font-semibold text-[#d85a30]">{fmtRs(d.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Active tables</span>
                          <span className="font-mono font-semibold text-[#378add]">{fmtNum(d.activeTables)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className="font-mono font-semibold text-[#1d9e75]">{fmtPct(d.occupancyRate)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Sessions</span>
                          <span className="font-mono">{fmtNum(d.sessions)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
                {Array.from({ length: 24 }, (_, h) => (
                  <Cell key={h} fill={heatColor(hourMap[h].revenue / maxRevenue)}
                    opacity={hoveredHour == null || hoveredHour === h ? 1 : 0.45} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Occupancy % horizontal bars */}
      {/*
        Each row = one hour that had activity.
        Bar width = occupancy % (normalized 0–100).
        Shows occupied / total table count and revenue per hour.
      */}
      <div>
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Table occupancy per hour
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Bar width = % of total table capacity occupied during that hour
          </p>
        </div>
        <div className="space-y-1.5">
          {activeHours.map(([hStr, d]) => {
            const h = Number(hStr);
            // FIX: occupancyRate is already normalized to 0–100 in hourMap
            const pct = Math.min(d.occupancyRate, 100);
            const intensity = d.revenue / maxRevenue;
            const isPeak = h === peakEntry.hour;
            return (
              <div
                key={h}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 transition-colors
                  ${isPeak ? "bg-orange-50 dark:bg-orange-950/20" : "hover:bg-muted/40"}`}
              >
                <span className="w-14 text-right text-[11px] font-mono text-muted-foreground shrink-0">{fmtHour(h)}</span>
                <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden relative">
                  <div className="h-full rounded-md flex items-center transition-all duration-500"
                    style={{ width: `${pct}%`, background: heatColor(intensity) }}>
                    {pct > 18 && (
                      <span className="text-[9px] font-bold ml-2 font-mono"
                        style={{ color: intensity > 0.55 ? "#fff" : "#1e293b" }}>
                        {fmtPct(pct)} occupied
                      </span>
                    )}
                  </div>
                  {pct <= 18 && pct > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground"
                      style={{ left: `${pct + 1}%` }}>
                      {fmtPct(pct)}
                    </span>
                  )}
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground">{d.occupiedCount}/{d.totalCapacity} tbls</span>
                  {isPeak && <span className="ml-1 text-[9px] text-[#d85a30] font-bold">🔥 peak</span>}
                </div>
                <span className="w-16 text-right text-[10px] font-semibold font-mono shrink-0 text-[#d85a30]">
                  {fmtRs(d.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
function TableReportAndAnalysisCustomDateRangeDatePage() {
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
  const [trendMode, setTrendMode] = useState<"total_revenue" | "total_sessions" | "avg_occupancy">("total_revenue");
  const [activePreset, setActivePreset] = useState<string>("30d");

  const { data, isLoading, isError, error, isFetching } = useGetCustomRangeTableReport(query);

  const validate = useCallback((from?: Date, to?: Date): boolean => {
    if (!from || !to) { setDateError("Both dates are required"); return false; }
    if (isAfter(from, today)) { setDateError("From date cannot be in the future"); return false; }
    if (isAfter(to, today)) { setDateError("To date cannot be in the future"); return false; }
    if (isAfter(from, to)) { setDateError("From date must be before to date"); return false; }
    setDateError(""); return true;
  }, [today]);

  useEffect(() => { validate(fromDate, toDate); }, [fromDate, toDate, validate]);

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

  const handlePreset = (p: typeof presets[0]) => {
    setFromDate(p.from); setToDate(p.to); applyFilters(p.from, p.to, p.key);
  };

  const handleClear = () => {
    setFromDate(defaultFrom); setToDate(today);
    setTrendFilter("daily"); setTrendMode("total_revenue"); setActivePreset("30d");
    setQuery({ start_date: format(defaultFrom, "yyyy-MM-dd"), end_date: format(today, "yyyy-MM-dd"), limit: 20, page: 0 });
  };

  const trendData = useMemo((): NewTableTrendPoint[] => {
    if (!data?.report) return [];
    const r: NewCustomRangeTableResponse = data.report;
    const map: Record<TrendType, NewTablePaginatedTrendPoints | null> = {
      daily: r.daily_trend ?? null, weekly: r.weekly_trend ?? null,
      monthly: r.monthly_trend ?? null, yearly: r.yearly_trend ?? null,
    };
    return map[trendFilter]?.data ?? [];
  }, [trendFilter, data]);

  /**
   * FIX: normalize avg_occupancy in trend data so the Y-axis always shows 0–100%.
   * Backend may return 0–1 decimal or 0–100 integer.
   */
  const normalizedTrendData = useMemo(
    () =>
      trendData.map(pt => ({
        ...pt,
        avg_occupancy: normalizePct(pt.avg_occupancy),
      })),
    [trendData]
  );

  const paginationInfo = useMemo(() => {
    if (!data?.report) return null;
    const r: NewCustomRangeTableResponse = data.report;
    const map: Record<TrendType, NewTablePaginatedTrendPoints | null> = {
      daily: r.daily_trend ?? null, weekly: r.weekly_trend ?? null,
      monthly: r.monthly_trend ?? null, yearly: r.yearly_trend ?? null,
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
    <div className="space-y-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex gap-4">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-medium text-destructive mb-1">Failed to load table data</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message ?? "Unknown error"}</p>
        </div>
      </div>
    </div>
  );

  const report: NewCustomRangeTableResponse | undefined = data?.report;

  if (!report) return (
    <div className="space-y-6">
      <div className="bg-muted rounded-xl p-6 text-center">
        <p className="font-medium mb-2">No data for selected range</p>
        <Button variant="outline" size="sm" onClick={handleClear}>Reset filters</Button>
      </div>
    </div>
  );

  const ov = report.overview;
  const sc = report.stats_card;

  const pieData = (report.table_usage_breakdown ?? [])
    .filter(t => (t.total_revenue ?? 0) > 0)
    .slice(0, 8)
    .map((t, i) => ({
      name: t.table_number,
      value: t.total_revenue,
      // FIX: normalize usage_percent for pie legend
      usage_percent: normalizePct(t.usage_percent),
      fill: COLORS[i % COLORS.length],
    }));

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Table analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Custom date range · Nepalese Rupee (NPR)</p>
        </div>
        {ov?.peak_occupancy_hour != null && ov.peak_occupancy_hour >= 0 && (
          <div className="text-xs font-semibold font-mono px-3 py-1.5 rounded-full bg-accent/15 text-accent border border-orange-200 dark:border-orange-800">
            {/* FIX: normalize peak occupancy rate in header badge */}
            🔥 Peak hour: {fmtHour(ov.peak_occupancy_hour)} — {fmtPct(ov.peak_occupancy_rate)} occupancy
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date range &amp; filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button key={p.key} variant="outline" size="sm" onClick={() => handlePreset(p)} disabled={loading}
              className={cn("rounded-xl text-xs h-7 px-3", activePreset === p.key && "bg-primary text-primary-foreground border-primary hover:bg-primary/90")}>
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
                  className={cn("w-full h-9 justify-start rounded-xl text-sm font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {fromDate ? format(fromDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-2xl border border-border shadow-xl">
                <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={loading}
                  className={cn("w-full h-9 justify-start rounded-xl text-sm font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {toDate ? format(toDate, "yyyy-MM-dd") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-2xl border border-border shadow-xl">
                <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={{ after: today }} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Items per page</Label>
            <Select value={String(query.limit)} disabled={loading}
              onValueChange={v => setQuery(prev => ({ ...prev, limit: Number(v), page: 0 }))}>
              <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {[10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => applyFilters()} disabled={!!dateError || !fromDate || !toDate || loading}
              className="h-9 rounded-xl flex-1 text-sm">
              {loading ? "Loading…" : "Apply filters"}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={loading} className="h-9 rounded-xl px-3">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        {dateError && <p className="text-xs text-destructive">{dateError}</p>}
        {!dateError && query.start_date && query.end_date && (
          <p className="text-xs text-muted-foreground font-mono">
            Showing {format(new Date(query.start_date), "MMM d, yyyy")} → {format(new Date(query.end_date), "MMM d, yyyy")}
          </p>
        )}
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Tables"
          value={fmtNum(ov?.total_tables)}
          sub={`${fmtNum(ov?.active_tables)} active this period`}
          icon="🪑"
        />
        <KpiCard
          label="Total Sessions"
          value={fmtNum(ov?.total_sessions)}
          sub={`Avg ${fmtMin(ov?.avg_session_duration)} per session`}
          accent="#378add"
          icon="⏱"
        />
        {/* FIX: normalize avg_occupancy_rate for KPI card */}
        <KpiCard
          label="Avg Occupancy"
          value={fmtPct(ov?.avg_occupancy_rate)}
          sub="% of capacity filled on avg"
          accent="#1d9e75"
          icon="📊"
        />
        <KpiCard label="Table Revenue" value={fmtRs(ov?.total_table_revenue)} accent="#d85a30" icon="💰" />
      </div>

      {/* ── All-time Stats ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">All-time statistics</span>
          <Chip>Global</Chip>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {([
            ["Tables", fmtNum(sc?.total_tables)],
            ["Capacity", fmtNum(sc?.total_capacity)],
            ["Sessions", fmtNum(sc?.total_sessions_all_time)],
            ["Revenue", fmtRs(sc?.total_table_revenue)],
            ["Avg Duration", fmtMin(sc?.avg_session_duration)],
            ["Top Table", sc?.most_used_table != null ? `#${sc.most_used_table}` : "—"],
            ["Top Count", fmtNum(sc?.most_used_table_count)],
            ["Busiest Day", sc?.busiest_day ?? "—"],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} className="bg-muted/30 rounded-xl border border-border/50 p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-semibold font-mono">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      {/* ── Trend Chart ── */}
      {/*
        X-axis: time period label (e.g. "Apr 1", "Week 14", "Mar 2025") depending on trendFilter
        Y-axis: selected metric — revenue (Rs.), session count, or occupancy % (0–100)
        Use the Revenue / Sessions / Occupancy % buttons to switch what the Y-axis shows.
        Use Daily / Weekly / Monthly / Yearly to change the X-axis granularity.
      */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Table trend over time</span>
            <Chip variant="accent">{trendFilter}</Chip>
            {paginationInfo && <Chip>{paginationInfo.total} records</Chip>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border">
              {([
                { key: "total_revenue" as const, label: "Revenue" },
                { key: "total_sessions" as const, label: "Sessions" },
                { key: "avg_occupancy" as const, label: "Occupancy %" },
              ]).map(m => (
                <button key={m.key} onClick={() => setTrendMode(m.key)}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                    trendMode === m.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                <button key={f} onClick={() => { setTrendFilter(f); setQuery(prev => ({ ...prev, page: 0 })); }}
                  className={cn("px-3 h-7 text-[11px] font-medium rounded-lg capitalize transition-all",
                    trendFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Axis description */}
        <p className="text-[10px] text-muted-foreground font-mono mb-4">
          {trendMode === "total_revenue" && "X: date/period · Y: total revenue earned (Rs.)"}
          {trendMode === "total_sessions" && "X: date/period · Y: number of table sessions"}
          {trendMode === "avg_occupancy" && "X: date/period · Y: average table occupancy (0–100%)"}
        </p>
        <div className="h-64">
          {!normalizedTrendData.length ? <Empty label="No trend data for this period" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={normalizedTrendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="trendGradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"
                      stopColor={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                      stopOpacity={0.25} />
                    <stop offset="95%"
                      stopColor={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                      stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false}
                  // FIX: cap occupancy Y-axis at 100
                  domain={trendMode === "avg_occupancy" ? [0, 100] : ["auto", "auto"]}
                  tickFormatter={
                    trendMode === "total_revenue"
                      ? fmtRs
                      : trendMode === "avg_occupancy"
                      ? (v) => `${v}%`
                      : undefined
                  }
                  width={trendMode === "total_revenue" ? 78 : 50}
                />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0]?.value;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-md min-w-[140px]">
                      <p className="text-xs text-muted-foreground mb-1 font-mono">{label}</p>
                      <p className="text-sm font-semibold font-mono" style={{ color: payload[0]?.color }}>
                        {trendMode === "total_revenue"
                          ? fmtRs(val)
                          : trendMode === "avg_occupancy"
                          ? `${(val as number).toFixed(1)}%`
                          : `${fmtNum(val)} sessions`}
                      </p>
                    </div>
                  );
                }} />
                <Area type="monotone" dataKey={trendMode}
                  stroke={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                  strokeWidth={2} fill="url(#trendGradC)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {paginationInfo && paginationInfo.total > query.limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-mono">{trendData.length} of {paginationInfo.total} records</span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#"
                    onClick={e => { e.preventDefault(); if (!isFirstPage) setQuery(p => ({ ...p, page: p.page - 1 })); }}
                    className={cn("rounded-xl text-xs", isFirstPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
                {visiblePages().map(n => (
                  <PaginationItem key={n}>
                    <PaginationLink href="#" onClick={e => { e.preventDefault(); setQuery(p => ({ ...p, page: n })); }}
                      className={cn("rounded-xl text-xs border",
                        currentPage === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                      {n + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#"
                    onClick={e => { e.preventDefault(); if (!isLastPage) setQuery(p => ({ ...p, page: p.page + 1 })); }}
                    className={cn("rounded-xl text-xs", isLastPage && "pointer-events-none opacity-40")} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* ── Peak Hour Heatmap ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Hourly activity &amp; table occupancy</span>
          <Chip variant="accent">When is the restaurant busiest?</Chip>
        </div>
        {!report.peak_hours?.length && !report.occupancy_rate?.length
          ? <Empty />
          : <PeakHourHeatmap peakHours={report.peak_hours ?? []} occupancyRate={report.occupancy_rate ?? []} />
        }
      </div>

      {/* ── Top Tables + Revenue Share ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Top performing tables</span>
            <Chip>{report.top_tables?.length ?? 0}</Chip>
          </div>
          {!report.top_tables?.length ? <Empty /> : (
            <div className="space-y-3">
              {report.top_tables.map((t: NewTopTable, i: number) => {
                const maxRev = Math.max(...report.top_tables.map(x => x.total_revenue ?? 0), 1);
                return (
                  <div key={t.table_number} className="space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium">Table #{t.table_number}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          cap {t.capacity ?? "—"} · {fmtNum(t.total_sessions)} sess · avg {fmtMin(t.avg_session_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* FIX: normalize per-table occupancy_rate */}
                        <span className="text-[10px] text-muted-foreground font-mono">{fmtPct(t.occupancy_rate)}</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>
                          {fmtRs(t.total_revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${maxRev ? ((t.total_revenue ?? 0) / maxRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Revenue share by table</span>
            <Chip>{pieData.length} tables</Chip>
          </div>
          {!pieData.length ? <Empty /> : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={88} innerRadius={50} paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-md">
                          <p className="text-xs text-muted-foreground mb-1 font-mono">Table #{d.name}</p>
                          <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">{fmtRs(d.value)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {(d.payload.usage_percent ?? 0).toFixed(1)}% of time used
                          </p>
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                {pieData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.fill }} />
                    <span className="text-muted-foreground">Table #{d.name}</span>
                    <strong className="font-mono">{(d.usage_percent ?? 0).toFixed(1)}%</strong>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Usage Breakdown Table ── */}
      {(report.table_usage_breakdown?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Table usage breakdown</span>
            <Chip>{report.table_usage_breakdown.length} tables</Chip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Table", "Capacity", "Sessions", "Hours Used", "Revenue", "Usage %", "Rev Share", "Avg Order"].map(h => (
                    <th key={h} className="pb-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.table_usage_breakdown.map((t: NewTableUsageBreakdown, i: number) => (
                  <tr key={t.table_number} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-mono font-medium">#{t.table_number}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-muted-foreground">{fmtNum(t.capacity)}</td>
                    <td className="py-2.5 pr-4 font-mono">{fmtNum(t.total_sessions)}</td>
                    {/* FIX: clamp negative hours to 0 — backend timestamp bug guard */}
                    <td className="py-2.5 pr-4 font-mono">{safeHours(t.total_hours_used).toFixed(1)}h</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-[#d85a30]">{fmtRs(t.total_revenue)}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          {/* FIX: normalize usage_percent */}
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.min(normalizePct(t.usage_percent), 100)}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="font-mono text-xs">{fmtPct(t.usage_percent)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{fmtPct(t.revenue_percent)}</td>
                    <td className="py-2.5 font-mono">{fmtRs(t.avg_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableReportAndAnalysisCustomDateRangeDatePage;