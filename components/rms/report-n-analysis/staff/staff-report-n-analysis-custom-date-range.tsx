"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CalendarDays, RefreshCw, Users, Clock, TrendingUp,
  Calendar, Award, AlertTriangle, Star, X, Activity, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  format, subDays, subMonths, subYears, isAfter, startOfDay, parseISO,
} from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetCustomRangeStaffReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/staff/use-get-report-n-analysis-staff-by-custom-date-range";
import type { CustomQuery } from "@/utils/actions/report-n-analysis/customer/customer.get";
import type {
  NewCustomRangeStaffResponse,
  NewStaffTrendPoint,
  NewStaffPaginatedTrendPoints,
} from "@/utils/types/report-n-analysis.types";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtNum = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};
const fmtPct = (n: number | null | undefined): string =>
  n == null || isNaN(n) ? "0.0%" : `${n.toFixed(1)}%`;
const fmtHour = (h: number | null | undefined): string => {
  if (h == null || isNaN(h) || h < 0 || h > 23) return "--";
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
};
const fmtHourShort = (h: number | null | undefined): string => {
  if (h == null || isNaN(h)) return "--";
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
};
const fmtHrs = (hours: number | null | undefined): string => {
  if (hours == null || isNaN(hours) || hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};
const safeDate = (s: string) => { try { return parseISO(s); } catch { return new Date(); } };

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green:  "#22c55e",
  red:    "#ef4444",
  amber:  "#f59e0b",
  blue:   "#3b82f6",
  purple: "#8b5cf6",
  slate:  "#64748b",
};
const ROLE_COLORS = ["#6366f1","#f43f5e","#f59e0b","#10b981","#3b82f6","#a855f7","#14b8a6","#ec4899"];

type TrendType   = "daily" | "weekly" | "monthly" | "yearly";
type TrendMetric = "present" | "absent" | "attendance_rate" | "total_work_hours";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ w, h }: { w?: string; h?: string }) => (
  <div style={{ width: w ?? "100%", height: h ?? "1rem" }} className="animate-pulse rounded-lg bg-muted" />
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-white font-mono leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground font-mono">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      {badge && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-zinc-700">
          {badge}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function TrendTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl min-w-[160px]">
      <p className="text-[11px] text-muted-foreground mb-2 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold font-mono" style={{ color: p.color }}>
          {p.name}: {metric === "total_work_hours" ? fmtHrs(p.value) : fmtNum(p.value)}{metric === "attendance_rate" ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffReportCustomRangePage() {
  const today       = startOfDay(new Date());
  const defaultFrom = subDays(today, 30);

  const [query, setQuery] = useState<CustomQuery>({
    start_date: format(defaultFrom, "yyyy-MM-dd"),
    end_date:   format(today, "yyyy-MM-dd"),
    limit: 20,
    page: 0,
  });
  const [fromDate,     setFromDate]     = useState<Date | undefined>(defaultFrom);
  const [toDate,       setToDate]       = useState<Date | undefined>(today);
  const [dateError,    setDateError]    = useState("");
  const [trendFilter,  setTrendFilter]  = useState<TrendType>("daily");
  const [trendMetric,  setTrendMetric]  = useState<TrendMetric>("attendance_rate");
  const [selectedEmp,  setSelectedEmp]  = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState("30d");

  const { data, isLoading, isError, error, isFetching, refetch } = useGetCustomRangeStaffReport(query);

  const validate = useCallback((from?: Date, to?: Date): boolean => {
    if (!from || !to)           { setDateError("Both dates are required"); return false; }
    if (isAfter(from, today))   { setDateError("From date cannot be in the future"); return false; }
    if (isAfter(to,   today))   { setDateError("To date cannot be in the future"); return false; }
    if (isAfter(from, to))      { setDateError("From must be before To"); return false; }
    setDateError("");
    return true;
  }, [today]);

  useEffect(() => { validate(fromDate, toDate); }, [fromDate, toDate, validate]);

  const applyFilters = (from?: Date, to?: Date, preset?: string) => {
    const f = from ?? fromDate;
    const t = to   ?? toDate;
    if (!validate(f, t) || !f || !t) { toast.error(dateError || "Invalid dates"); return; }
    setQuery(prev => ({ ...prev, start_date: format(f, "yyyy-MM-dd"), end_date: format(t, "yyyy-MM-dd"), page: 0 }));
    if (preset) setActivePreset(preset);
  };

  const presets = [
    { label: "7d",   key: "7d",  from: subDays(today, 7),       to: today },
    { label: "30d",  key: "30d", from: subDays(today, 30),      to: today },
    { label: "3mo",  key: "3m",  from: subMonths(today, 3),     to: today },
    { label: "1yr",  key: "1y",  from: subYears(today, 1),      to: today },
  ];

  const handleClear = () => {
    setFromDate(defaultFrom); setToDate(today);
    setTrendFilter("daily"); setTrendMetric("attendance_rate");
    setSelectedEmp(null); setActivePreset("30d");
    setQuery({ start_date: format(defaultFrom, "yyyy-MM-dd"), end_date: format(today, "yyyy-MM-dd"), limit: 20, page: 0 });
  };

  const report: NewCustomRangeStaffResponse | undefined = data?.report;
  const loading = isLoading || isFetching;

  // ─── Trend data ───────────────────────────────────────────────────────────
  const trendData = useMemo((): NewStaffTrendPoint[] => {
    if (!report) return [];
    const map: Record<TrendType, NewStaffPaginatedTrendPoints | null | undefined> = {
      daily:   report.daily_trend,
      weekly:  report.weekly_trend,
      monthly: report.monthly_trend,
      yearly:  report.yearly_trend,
    };
    return map[trendFilter]?.data ?? [];
  }, [trendFilter, report]);

  const paginationInfo = useMemo(() => {
    if (!report) return null;
    const map: Record<TrendType, NewStaffPaginatedTrendPoints | null | undefined> = {
      daily:   report.daily_trend,
      weekly:  report.weekly_trend,
      monthly: report.monthly_trend,
      yearly:  report.yearly_trend,
    };
    return map[trendFilter]?.pagination ?? null;
  }, [trendFilter, report]);

  const totalPages  = paginationInfo ? Math.max(1, Math.ceil(paginationInfo.total / query.limit)) : 1;
  const currentPage = paginationInfo?.page ?? query.page;

  const dailySummary   = useMemo(() => report?.daily_summary          ?? [], [report]);
  const peakHours      = useMemo(() => report?.peak_hours             ?? [], [report]);
  const roleBreakdown  = useMemo(() => report?.role_breakdown         ?? [], [report]);
  const empAttendance  = useMemo(() => report?.employee_attendance    ?? [], [report]);
  const mostPresent    = useMemo(() => report?.most_present_employees ?? [], [report]);
  const mostAbsent     = useMemo(() => report?.most_absent_employees  ?? [], [report]);
  const longestService = useMemo(() => report?.longest_service_employees ?? [], [report]);
  const leaveAnalysis  = useMemo(() => report?.leave_analysis,                [report]);
  const payroll        = useMemo(() => report?.payroll_summary,               [report]);

  const maxPeak = peakHours.length ? Math.max(...peakHours.map(h => h.active_staff ?? 0), 1) : 1;
  const selectedEmpData = selectedEmp ? empAttendance.find(e => e.employee_id === selectedEmp) : null;

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <Sk h="2.5rem" w="20rem" />
          <Sk h="9rem" />
          <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} h="5rem" />)}</div>
          <Sk h="18rem" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-semibold">Failed to load data</p>
          <p className="text-muted-foreground text-sm">{(error as Error)?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-muted rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const ov = report?.overview;
  const sc = report?.stats_card;
  const totalTracked = ov ? (ov.total_present_days ?? 0) + (ov.total_absent_days ?? 0) + (ov.total_late_days ?? 0) + (ov.total_leave_days ?? 0) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff Attendance Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Custom date range · Detailed attendance & performance</p>
          </div>
          <div className="flex items-center gap-2">
            {ov?.peak_attend_hour != null && ov.peak_attend_hour >= 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                <Activity className="w-3.5 h-3.5" />
                Peak: {fmtHour(ov.peak_attend_hour)}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          {/* Preset pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Quick range:</span>
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => { setFromDate(p.from); setToDate(p.to); applyFilters(p.from, p.to, p.key); }}
                disabled={loading}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all border",
                  activePreset === p.key
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                    : "bg-muted border-zinc-700 text-muted-foreground hover:border-zinc-600 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={loading}
                    className={cn("w-full h-9 justify-start rounded-xl text-sm font-normal bg-muted border-zinc-700 text-foreground hover:bg-zinc-700", !fromDate && "text-muted-foreground")}>
                    <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    {fromDate ? format(fromDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xl border border-zinc-700 bg-zinc-900">
                  <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} disabled={{ after: today }} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={loading}
                    className={cn("w-full h-9 justify-start rounded-xl text-sm font-normal bg-muted border-zinc-700 text-foreground hover:bg-zinc-700", !toDate && "text-muted-foreground")}>
                    <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    {toDate ? format(toDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xl border border-zinc-700 bg-zinc-900">
                  <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} disabled={{ after: today }} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Per page</Label>
              <Select value={String(query.limit)} disabled={loading}
                onValueChange={v => setQuery(prev => ({ ...prev, limit: Number(v), page: 0 }))}>
                <SelectTrigger className="h-9 rounded-xl text-sm bg-muted border-zinc-700 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-zinc-900 border-zinc-700">
                  {[10, 20, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-foreground">{n} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => applyFilters()}
                disabled={!!dateError || !fromDate || !toDate || loading}
                className="h-9 rounded-xl flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Loading…" : "Apply"}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={loading}
                className="h-9 rounded-xl px-3 bg-muted border-zinc-700 text-foreground hover:bg-zinc-700">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {dateError && <p className="text-xs text-red-400">{dateError}</p>}
          {!dateError && query.start_date && query.end_date && (
            <p className="text-xs text-muted-foreground font-mono">
              Showing: {format(safeDate(query.start_date), "MMM d, yyyy")} → {format(safeDate(query.end_date), "MMM d, yyyy")}
            </p>
          )}
        </div>

        {/* No data guard */}
        {!report && !loading && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No data for this date range. Try adjusting the filters.</p>
            <button onClick={handleClear} className="mt-3 px-4 py-2 bg-muted rounded-xl text-xs text-foreground hover:bg-zinc-700 transition-colors">
              Reset
            </button>
          </div>
        )}

        {report && (
          <>
            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatPill label="Total Employees" value={fmtNum(ov?.total_employees)} sub={`${fmtNum(ov?.active_employees)} active`}
                color={C.blue}   icon={<Users className="w-5 h-5" />} />
              <StatPill label="Attendance Rate" value={fmtPct(ov?.overall_attendance_rate)} sub="Present+late+half"
                color={C.green}  icon={<Calendar className="w-5 h-5" />} />
              <StatPill label="Late Rate"       value={fmtPct(ov?.late_rate)} sub="Of those present"
                color={C.amber}  icon={<Clock className="w-5 h-5" />} />
              <StatPill label="Avg Work Hours"  value={fmtHrs(ov?.avg_work_hours_per_employee)} sub={`Total: ${fmtHrs(ov?.total_work_hours)}`}
                color={C.purple} icon={<TrendingUp className="w-5 h-5" />} />
            </div>

            {/* ── Breakdown + All-time ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <SectionHeader title="Period Breakdown" />
                <div className="space-y-3">
                  {([
                    { label: "Present",  value: ov?.total_present_days, color: C.green  },
                    { label: "Absent",   value: ov?.total_absent_days,  color: C.red    },
                    { label: "Late",     value: ov?.total_late_days,    color: C.amber  },
                    { label: "Half Day", value: ov?.total_half_days,    color: C.purple },
                    { label: "On Leave", value: ov?.total_leave_days,   color: C.slate  },
                  ] as const).map(({ label, value, color }) => {
                    const pct = totalTracked > 0 ? ((value ?? 0) / totalTracked) * 100 : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className="text-xs font-mono font-semibold" style={{ color }}>{fmtNum(value)}</span>
                        </div>
                        <ProgressBar value={pct} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                <SectionHeader title="All-time Statistics" badge="Global" />
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Total Staff",        fmtNum(sc?.total_employees),          C.blue   ],
                    ["Active Staff",       fmtNum(sc?.active_employees),         C.green  ],
                    ["All Records",        fmtNum(sc?.total_attendance_records), C.purple ],
                    ["All-time Hours",     fmtHrs(sc?.all_time_work_hours),      C.amber  ],
                    ["Avg Session",        fmtHrs(sc?.avg_session_hours),        C.slate  ],
                    ["Pending Leaves",     fmtNum(sc?.total_pending_leaves),     C.red    ],
                  ] as [string, string, string][]).map(([l, v, c]) => (
                    <div key={l} className="bg-muted/60 rounded-xl p-3 border border-zinc-700/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                      <p className="text-base font-bold font-mono" style={{ color: c }}>{v}</p>
                    </div>
                  ))}
                </div>
                {payroll && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Payroll</p>
                      <p className="text-sm font-bold font-mono text-white">{payroll.total_monthly_salary?.toLocaleString() ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Salary</p>
                      <p className="text-sm font-bold font-mono text-white">{payroll.avg_salary?.toLocaleString() ?? "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Top Performers ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Award className="w-4 h-4 text-green-400" />,
                  bg: "bg-green-500/15",
                  label: "Most Present",
                  items: mostPresent.slice(0, 5),
                  getValue: (e: any) => `${fmtNum(e.present_days)}d`,
                  getSub: (e: any) => fmtPct(e.attendance_rate),
                  valueColor: C.green,
                },
                {
                  icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
                  bg: "bg-red-500/15",
                  label: "Needs Attention",
                  items: mostAbsent.slice(0, 5),
                  getValue: (e: any) => `${fmtNum(e.absent_days)} absent`,
                  getSub: (e: any) => fmtPct(e.attendance_rate),
                  valueColor: C.red,
                },
                {
                  icon: <Star className="w-4 h-4 text-amber-400" />,
                  bg: "bg-amber-500/15",
                  label: "Top Hours",
                  items: longestService.slice(0, 5),
                  getValue: (e: any) => fmtHrs(e.total_work_hours),
                  getSub: (e: any) => `avg ${fmtHrs(e.avg_shift_hours)}/shift`,
                  valueColor: C.amber,
                },
              ].map(({ icon, bg, label, items, getValue, getSub, valueColor }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-600 italic">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((emp: any, i: number) => (
                        <div key={emp.employee_id} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-zinc-600 w-4">{i + 1}</span>
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
                            {emp.employee_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{emp.employee_name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{emp.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold font-mono" style={{ color: valueColor }}>{getValue(emp)}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{getSub(emp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Trend Chart ── */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <SectionHeader title="Attendance Trend" badge={trendFilter} />
                  {paginationInfo && (
                    <span className="text-[10px] font-mono text-muted-foreground">{paginationInfo.total} records</span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                    {([
                      { key: "attendance_rate" as const,  label: "Rate %" },
                      { key: "present"          as const, label: "Present" },
                      { key: "absent"           as const, label: "Absent" },
                      { key: "total_work_hours" as const, label: "Hours" },
                    ] as const).map(m => (
                      <button key={m.key} onClick={() => setTrendMetric(m.key)}
                        className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                          trendMetric === m.key ? "bg-zinc-700 text-white shadow" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                    {(["daily","weekly","monthly","yearly"] as const).map(f => (
                      <button key={f} onClick={() => { setTrendFilter(f); setQuery(prev => ({ ...prev, page: 0 })); }}
                        className={`px-3 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
                          trendFilter === f ? "bg-zinc-700 text-white shadow" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-64">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No trend data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <defs>
                        <linearGradient id="trendGcr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={trendMetric === "attendance_rate" ? C.green : C.blue} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={trendMetric === "attendance_rate" ? C.green : C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}
                        domain={trendMetric === "attendance_rate" ? [0, 100] : ["auto","auto"]}
                        tickFormatter={trendMetric === "attendance_rate" ? v => `${v}%` : undefined}
                        width={trendMetric === "attendance_rate" ? 40 : 60}
                      />
                      <Tooltip content={(p) => <TrendTooltip {...p} metric={trendMetric} />} />
                      <Area
                        type="monotone" dataKey={trendMetric}
                        stroke={trendMetric === "attendance_rate" ? C.green : trendMetric === "absent" ? C.red : C.blue}
                        strokeWidth={2} fill="url(#trendGcr)"
                        dot={{ r: 3 }}
                        name={trendMetric === "attendance_rate" ? "Rate" : trendMetric}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pagination */}
              {paginationInfo && paginationInfo.total > query.limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground font-mono">
                    {trendData.length} of {paginationInfo.total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuery(p => ({ ...p, page: Math.max(0, p.page - 1) }))}
                      disabled={currentPage === 0}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const win = 2;
                      const start = Math.max(0, Math.min(currentPage - win, totalPages - 5));
                      const n = start + i;
                      return (
                        <button
                          key={n}
                          onClick={() => setQuery(p => ({ ...p, page: n }))}
                          className={cn(
                            "w-7 h-7 rounded-xl text-xs font-mono transition-colors",
                            currentPage === n ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-zinc-700"
                          )}
                        >
                          {n + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setQuery(p => ({ ...p, page: Math.min(totalPages - 1, p.page + 1) }))}
                      disabled={currentPage >= totalPages - 1}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Daily Summary ── */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader title="Daily Attendance" badge={`${dailySummary.length} days`} />
              {dailySummary.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-zinc-600 text-sm">No data</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div className="min-w-[560px] space-y-2">
                      {dailySummary.slice(0, 14).map(day => {
                        const total = (day.present ?? 0) + (day.absent ?? 0) + (day.on_leave ?? 0) + (day.late ?? 0);
                        return (
                          <div key={day.work_date} className="flex items-center gap-3">
                            <span className="w-24 text-[10px] font-mono text-muted-foreground flex-shrink-0">{day.work_date}</span>
                            <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden flex">
                              <div className="h-full bg-green-500" style={{ width: `${total > 0 ? ((day.present ?? 0)/total)*100 : 0}%` }} />
                              <div className="h-full bg-red-500"   style={{ width: `${total > 0 ? ((day.absent  ?? 0)/total)*100 : 0}%` }} />
                              <div className="h-full bg-amber-400" style={{ width: `${total > 0 ? ((day.late    ?? 0)/total)*100 : 0}%` }} />
                              <div className="h-full bg-zinc-500"  style={{ width: `${total > 0 ? ((day.on_leave?? 0)/total)*100 : 0}%` }} />
                            </div>
                            <span className="w-14 text-right text-[10px] font-mono text-muted-foreground flex-shrink-0">{fmtPct(day.attendance_rate)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
                    {([["Present", C.green], ["Absent", C.red], ["Late", C.amber], ["On Leave", C.slate]] as [string, string][]).map(([l, c]) => (
                      <span key={l} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Peak Hours ── */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <SectionHeader title="Peak Activity Hours" badge="Staff check-in distribution" />
              {peakHours.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">No data</div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="hour" tickFormatter={fmtHourShort} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl">
                            <p className="text-xs font-semibold text-white mb-2 font-mono">{fmtHour(label)}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Active Staff</span><span className="font-mono text-blue-400 font-semibold">{fmtNum(d?.active_staff)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Check-ins</span><span className="font-mono text-white">{fmtNum(d?.check_ins)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Check-outs</span><span className="font-mono text-white">{fmtNum(d?.check_outs)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Avg hrs</span><span className="font-mono text-white">{fmtHrs(d?.avg_work_hours)}</span></div>
                            </div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="active_staff" radius={[3, 3, 0, 0]} name="Active Staff">
                        {peakHours.map((e, i) => (
                          <Cell key={i} fill={e.active_staff === maxPeak ? C.amber : C.blue} opacity={e.active_staff === maxPeak ? 1 : 0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Role Breakdown + Leave ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <SectionHeader title="By Role" badge={`${roleBreakdown.length} roles`} />
                {roleBreakdown.length === 0 ? (
                  <p className="text-sm text-zinc-600 italic">No data</p>
                ) : (
                  <div className="space-y-4">
                    {roleBreakdown.map((role, i) => (
                      <div key={role.role}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                            <span className="text-sm font-medium text-foreground capitalize">{role.role}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{fmtNum(role.employee_count)} staff</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground font-mono">{fmtHrs(role.total_work_hours)}</span>
                            <span className="text-sm font-bold font-mono" style={{ color: ROLE_COLORS[i % ROLE_COLORS.length] }}>
                              {fmtPct(role.attendance_rate)}
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={role.attendance_rate ?? 0} color={ROLE_COLORS[i % ROLE_COLORS.length]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader title="Leave Analysis" />
                  {leaveAnalysis?.pending_count != null && leaveAnalysis.pending_count > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      {fmtNum(leaveAnalysis.pending_count)} pending
                    </span>
                  )}
                </div>
                {!leaveAnalysis ? (
                  <p className="text-sm text-zinc-600 italic">No data</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ["Total",       fmtNum(leaveAnalysis.total_requests),  C.blue  ],
                        ["Approval %",  fmtPct(leaveAnalysis.approval_rate),   C.green ],
                        ["Approved",    fmtNum(leaveAnalysis.approved_count),  C.green ],
                        ["Rejected",    fmtNum(leaveAnalysis.rejected_count),  C.red   ],
                      ] as [string, string, string][]).map(([l, v, c]) => (
                        <div key={l} className="bg-muted rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                          <p className="text-lg font-bold font-mono" style={{ color: c }}>{v}</p>
                        </div>
                      ))}
                    </div>
                    {leaveAnalysis.top_leave_employees?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wider">Top leave takers</p>
                        <div className="space-y-2">
                          {leaveAnalysis.top_leave_employees.slice(0, 4).map(emp => (
                            <div key={emp.employee_id} className="flex justify-between items-center text-xs">
                              <span className="font-medium text-foreground truncate max-w-[130px]">{emp.employee_name}</span>
                              <span className="text-muted-foreground font-mono capitalize">{emp.role}</span>
                              <span className="font-mono text-amber-400 font-semibold">{emp.total_days}d</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Employee Table ── */}
            {empAttendance.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <SectionHeader title="Employee Breakdown" badge={`${empAttendance.length} employees`} />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Employee", "Role", "Present", "Absent", "Late", "Leave", "Work Hours", "Attendance"].map(h => (
                          <th key={h} className="pb-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pr-4 last:pr-0 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {empAttendance.slice(0, 10).map(emp => (
                        <tr
                          key={emp.employee_id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmp(selectedEmp === emp.employee_id ? null : emp.employee_id)}
                        >
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                                {emp.employee_name?.charAt(0) ?? "?"}
                              </div>
                              <span className="text-xs font-medium text-foreground">{emp.employee_name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-[11px] text-muted-foreground capitalize">{emp.role}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-green-400">{fmtNum(emp.present_days)}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-red-400">{fmtNum(emp.absent_days)}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-amber-400">{fmtNum(emp.late_days)}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono text-muted-foreground">{fmtNum(emp.leave_days)}</td>
                          <td className="py-2.5 pr-4 text-xs font-mono text-foreground">{fmtHrs(emp.total_work_hours)}</td>
                          <td className="py-2.5 pr-0">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(emp.attendance_rate ?? 0, 100)}%` }} />
                              </div>
                              <span className="text-xs font-mono font-semibold text-foreground">{fmtPct(emp.attendance_rate)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {empAttendance.length > 10 && (
                    <p className="text-center text-[10px] text-zinc-600 mt-3 pt-2 border-t border-border">
                      Showing 10 of {empAttendance.length} employees
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Employee Detail Modal ── */}
      {selectedEmpData && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEmp(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-xl w-full max-h-[80vh] overflow-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-900 border-b border-border p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground">
                  {selectedEmpData.employee_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedEmpData.employee_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{selectedEmpData.role} · {selectedEmpData.gender}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  ["Present",    fmtNum(selectedEmpData.present_days),     C.green ],
                  ["Absent",     fmtNum(selectedEmpData.absent_days),      C.red   ],
                  ["Late",       fmtNum(selectedEmpData.late_days),        C.amber ],
                  ["Work Hours", fmtHrs(selectedEmpData.total_work_hours), C.blue  ],
                ] as [string, string, string][]).map(([l, v, c]) => (
                  <div key={l} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-lg font-bold font-mono" style={{ color: c }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Attendance Rate</span>
                <span className="text-sm font-bold font-mono text-green-400">{fmtPct(selectedEmpData.attendance_rate)}</span>
              </div>
              {selectedEmpData.records?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Recent Records</p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {selectedEmpData.records.slice(0, 10).map(rec => (
                      <div key={rec.attendance_id} className="flex justify-between items-center text-xs p-2.5 bg-muted/60 rounded-lg">
                        <span className="font-mono text-muted-foreground">{rec.work_date}</span>
                        <span className={`font-mono px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.status === "present" ? "bg-green-500/15 text-green-400" :
                          rec.status === "absent"  ? "bg-red-500/15 text-red-400" :
                          rec.status === "late"    ? "bg-amber-500/15 text-amber-400" :
                          "bg-zinc-700 text-muted-foreground"
                        }`}>{rec.status}</span>
                        <span className="font-mono text-foreground">{fmtHrs(rec.work_hours)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}