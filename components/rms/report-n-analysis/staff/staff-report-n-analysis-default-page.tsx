"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Clock, TrendingUp, Calendar, Award, AlertTriangle,
  Star, X, Activity, User, CheckCircle, XCircle, Clock as ClockIcon,
} from "lucide-react";
import { useGetDefaultStaffReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/staff/use-get-report-n-analysis-staff-default";
import type {
  NewDefaultStaffResponse,
  NewStaffTrendPoint,
  NewStaffRoleBreakdown,
  NewEmployeeAttendanceSummary,
  NewMostPresentEmployee,
  NewMostAbsentEmployee,
  NewLongestServiceEmployee,
  NewLeaveAnalysis,
  NewDailyAttendanceSummary,
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
const fmtHrs = (hours: number | null | undefined): string => {
  if (hours == null || isNaN(hours) || hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// ─── Colors ───────────────────────────────────────────────────────────────────
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
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-sm animate-pulse">
      <div className="h-7 w-52 bg-muted rounded-full mb-2" />
      <div className="h-4 w-36 bg-muted rounded-full" />
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
    <div className="grid grid-cols-3 gap-4">
      {Array(3).fill(0).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card h-40 animate-pulse" />)}
    </div>
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${color}15, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={`h-1.5 bg-muted rounded-full overflow-hidden ${className ?? ""}`}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

// ─── Segmented Toggle ────────────────────────────────────────────────────────
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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl min-w-[160px]">
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
export default function StaffReportDefaultPage() {
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("attendance_rate");
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetDefaultStaffReport();
  const report: NewDefaultStaffResponse | undefined = data?.report;

  const trendData = useMemo((): NewStaffTrendPoint[] => {
    if (!report) return [];
    return { daily: report.daily_trend, weekly: report.weekly_trend, monthly: report.monthly_trend, yearly: report.yearly_trend }[trendFilter] ?? [];
  }, [trendFilter, report]);

  const dailySummary   = useMemo(() => report?.daily_summary           ?? [], [report]);
  const roleBreakdown  = useMemo(() => report?.role_breakdown          ?? [], [report]);
  const empAttendance  = useMemo(() => report?.employee_attendance     ?? [], [report]);
  const mostAbsent     = useMemo(() => (report?.most_absent_employees ?? []).filter(e => (e.absent_days ?? 0) > 0), [report]);
  const mostPresent    = useMemo(() => report?.most_present_employees  ?? [], [report]);
  const longestService = useMemo(() => report?.longest_service_employees ?? [], [report]);
  const leaveAnalysis  = useMemo(() => report?.leave_analysis,              [report]);
  const payroll        = useMemo(() => report?.payroll_summary,             [report]);

  const selectedEmpData = selectedEmp ? empAttendance.find(e => e.employee_id === selectedEmp) : null;

  const handleEmployeeClick = (employeeId: string, event: React.MouseEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    setSelectedEmp(selectedEmp === employeeId ? null : employeeId);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedEmp && !(e.target as Element).closest('.employee-modal')) {
        setSelectedEmp(null);
        setModalPosition(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedEmp]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 relative">
          <span className="text-2xl">⚠️</span>
          <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load staff data</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Retry</button>
      </div>
    </div>
  );

  if (!report) return null;

  const ov = report.overview;
  const totalTracked = (ov.total_present_days ?? 0) + (ov.total_absent_days ?? 0) + (ov.total_late_days ?? 0) + (ov.total_half_days ?? 0);

  const metricColor: Record<TrendMetric, string> = {
    present: C.green, absent: C.red, attendance_rate: C.blue, total_work_hours: C.purple,
  };

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
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Attendance</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Staff Attendance Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days · All attendance & performance metrics</p>
          </div>
          {ov.busiest_day && ov.busiest_day !== "Unknown" && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono">
              📅 Busiest: {ov.busiest_day}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={fmtNum(ov.total_employees)} color={C.blue} icon={Users} />
        <StatCard label="Attendance Rate" value={fmtPct(ov.overall_attendance_rate)} color={C.green} icon={Calendar} />
        <StatCard label="Late Arrivals" value={fmtPct(ov.late_rate)} color={C.amber} icon={Clock} />
        <StatCard label="Avg Work Hours" value={fmtHrs(ov.avg_work_hours_per_employee)} color={C.purple} icon={TrendingUp} />
      </div>

      {/* ── Attendance Breakdown ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Attendance Breakdown</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">Last 30 days</span>
        </div>
        <div className="space-y-3">
          {([
            { label: "Present",  value: ov.total_present_days, color: C.green  },
            { label: "Absent",   value: ov.total_absent_days,  color: C.red    },
            { label: "Late",     value: ov.total_late_days,    color: C.amber  },
            { label: "Half Day", value: ov.total_half_days,    color: C.purple },
            { label: "On Leave", value: ov.total_leave_days,   color: C.slate  },
          ] as const).map(({ label, value, color }) => {
            const pct = totalTracked > 0 ? ((value ?? 0) / totalTracked) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color }}>{fmtNum(value)} days</span>
                </div>
                <ProgressBar value={pct} color={color} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs">
          <span className="text-muted-foreground">Total tracked days</span>
          <span className="font-mono text-foreground font-semibold">{fmtNum(totalTracked)}</span>
        </div>
        {/* Payroll strip */}
        {payroll && payroll.total_monthly_salary > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.08em]">Monthly Payroll</p>
              <p className="text-sm font-bold font-mono text-foreground">Rs. {(payroll.total_monthly_salary ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.08em]">Avg Salary</p>
              <p className="text-sm font-bold font-mono text-foreground">Rs. {(payroll.avg_salary ?? 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* NOTE: All-time Statistics section has been removed as requested */}

      {/* ── Trend Chart ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Attendance Trend</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent font-mono capitalize">{trendFilter}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SegmentedToggle
                options={["present", "absent", "attendance_rate", "total_work_hours"]}
                value={trendMetric}
                onChange={(v) => setTrendMetric(v as TrendMetric)}
                labels={{ present: "Present", absent: "Absent", attendance_rate: "Rate", total_work_hours: "Hours" }}
              />
              <SegmentedToggle options={["daily", "weekly", "monthly", "yearly"]} value={trendFilter} onChange={(v) => setTrendFilter(v as any)} />
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="h-64">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricColor[trendMetric]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={metricColor[trendMetric]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<TrendTooltip metric={trendMetric} />} />
                  <Area type="monotone" dataKey={trendMetric} stroke={metricColor[trendMetric]} strokeWidth={2}
                    fill="url(#areaGrad)" dot={{ r: 3, fill: metricColor[trendMetric] }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Performers ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Present */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Most Present</span>
          </div>
          {mostPresent.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No data</p>
          ) : (
            <div className="space-y-3">
              {mostPresent.slice(0, 5).map((emp, i) => (
                <div key={emp.employee_id} className="flex items-center gap-3 hover:bg-muted/20 rounded-xl p-1.5 -mx-1.5 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
                    {emp.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{emp.employee_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500 font-mono">{fmtNum(emp.present_days)}d</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{fmtPct(emp.attendance_rate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Absent */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Needs Attention</span>
          </div>
          {mostAbsent.length === 0 ? (
            <p className="text-sm text-emerald-500 italic">✨ All staff have perfect attendance!</p>
          ) : (
            <div className="space-y-3">
              {mostAbsent.slice(0, 5).map((emp, i) => (
                <div key={emp.employee_id} className="flex items-center gap-3 hover:bg-muted/20 rounded-xl p-1.5 -mx-1.5 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
                    {emp.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{emp.employee_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-500 font-mono">{fmtNum(emp.absent_days)} absent</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{fmtPct(emp.attendance_rate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Hours Worked */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Most Hours Worked</span>
          </div>
          {longestService.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No data</p>
          ) : (
            <div className="space-y-3">
              {longestService.slice(0, 5).map((emp, i) => (
                <div key={emp.employee_id} className="flex items-center gap-3 hover:bg-muted/20 rounded-xl p-1.5 -mx-1.5 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
                    {emp.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{emp.employee_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-500 font-mono">{fmtHrs(emp.total_work_hours)}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">avg {fmtHrs(emp.avg_shift_hours)}/shift</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Summary Cards ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Daily Attendance Summary</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">Last 14 days</span>
        </div>
        <div className="p-5">
          {dailySummary.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {dailySummary.slice(0, 14).map((day: NewDailyAttendanceSummary) => {
                const total = (day.present ?? 0) + (day.absent ?? 0) + (day.on_leave ?? 0) + (day.late ?? 0);
                const presentPct = total > 0 ? ((day.present ?? 0) / total) * 100 : 0;
                const absentPct  = total > 0 ? ((day.absent  ?? 0) / total) * 100 : 0;
                const latePct    = total > 0 ? ((day.late    ?? 0) / total) * 100 : 0;
                const leavePct   = total > 0 ? ((day.on_leave ?? 0) / total) * 100 : 0;
                return (
                  <div key={day.work_date} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{day.work_date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rate:</span>
                        <span className={`text-sm font-bold font-mono ${
                          (day.attendance_rate ?? 0) >= 80 ? 'text-emerald-500' :
                          (day.attendance_rate ?? 0) >= 60 ? 'text-amber-500' : 'text-rose-500'
                        }`}>{fmtPct(day.attendance_rate)}</span>
                      </div>
                    </div>
                    <div className="flex h-6 bg-muted rounded-lg overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${presentPct}%` }}>
                        {presentPct > 15 ? fmtNum(day.present) : ''}
                      </div>
                      <div className="h-full bg-rose-500 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${absentPct}%` }}>
                        {absentPct > 15 ? fmtNum(day.absent) : ''}
                      </div>
                      <div className="h-full bg-amber-400 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${latePct}%` }}>
                        {latePct > 15 ? fmtNum(day.late) : ''}
                      </div>
                      <div className="h-full bg-muted-foreground/30 transition-all" style={{ width: `${leavePct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present: {fmtNum(day.present)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Absent: {fmtNum(day.absent)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Late: {fmtNum(day.late)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> Leave: {fmtNum(day.on_leave)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Role Breakdown + Leave Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Role Breakdown */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Performance by Role</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{roleBreakdown.length} roles</span>
          </div>
          {roleBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No data</p>
          ) : (
            <div className="space-y-4">
              {roleBreakdown.map((role: NewStaffRoleBreakdown, i: number) => (
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

        {/* Leave Analysis */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Leave Analysis</span>
            </div>
            {leaveAnalysis?.pending_count != null && leaveAnalysis.pending_count > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {fmtNum(leaveAnalysis.pending_count)} pending
              </span>
            )}
          </div>
          {!leaveAnalysis || leaveAnalysis.total_requests === 0 ? (
            <p className="text-sm text-emerald-500 italic">✨ No leave requests in this period</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Total Requests", fmtNum(leaveAnalysis.total_requests), C.blue ],
                  ["Approval Rate",  fmtPct(leaveAnalysis.approval_rate),  C.green],
                  ["Approved",       fmtNum(leaveAnalysis.approved_count), C.green],
                  ["Rejected",       fmtNum(leaveAnalysis.rejected_count), C.red  ],
                ] as [string, string, string][]).map(([l, v, c]) => (
                  <div key={l} className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-lg font-bold font-mono" style={{ color: c }}>{v}</p>
                  </div>
                ))}
              </div>
              {leaveAnalysis.top_leave_employees?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wider">Top leave takers</p>
                  <div className="space-y-2">
                    {leaveAnalysis.top_leave_employees.slice(0, 4).map((emp: any) => (
                      <div key={emp.employee_id} className="flex justify-between items-center text-xs hover:bg-muted/20 rounded-lg px-2 py-1 transition-colors">
                        <span className="font-medium text-foreground truncate max-w-[130px]">{emp.employee_name}</span>
                        <span className="text-muted-foreground font-mono capitalize">{emp.role}</span>
                        <span className="font-mono text-amber-500 font-semibold">{emp.total_days} days</span>
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
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">All Employees</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{empAttendance.length} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Employee", "Role", "Present", "Absent", "Late", "Leave", "Work Hours", "Attendance"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empAttendance.map((emp: NewEmployeeAttendanceSummary) => (
                  <tr key={emp.employee_id} className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={(e) => handleEmployeeClick(emp.employee_id, e)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                          {emp.employee_name?.charAt(0) ?? "?"}
                        </div>
                        <span className="text-xs font-medium text-foreground">{emp.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-muted-foreground capitalize">{emp.role}</td>
                    <td className="px-5 py-3 text-xs font-mono font-semibold text-emerald-500">{fmtNum(emp.present_days)}</td>
                    <td className="px-5 py-3 text-xs font-mono font-semibold text-rose-500">{fmtNum(emp.absent_days)}</td>
                    <td className="px-5 py-3 text-xs font-mono font-semibold text-amber-500">{fmtNum(emp.late_days)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{fmtNum(emp.leave_days)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-foreground">{fmtHrs(emp.total_work_hours)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(emp.attendance_rate ?? 0, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono font-semibold text-foreground">{fmtPct(emp.attendance_rate)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Employee Detail Modal ── */}
      {selectedEmpData && modalPosition && (
        <div className="employee-modal fixed z-50"
          style={{ top: modalPosition.top - 20, left: modalPosition.left + 200, transform: 'translateY(-50%)' }}>
          <div className="bg-card border border-border rounded-3xl w-80 shadow-2xl overflow-hidden">
            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground ring-1 ring-border">
                  {selectedEmpData.employee_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{selectedEmpData.employee_name}</h3>
                  <p className="text-[10px] text-muted-foreground capitalize">{selectedEmpData.role}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedEmp(null); setModalPosition(null); }}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Present", fmtNum(selectedEmpData.present_days), "text-emerald-500"],
                  ["Absent",  fmtNum(selectedEmpData.absent_days),  "text-rose-500"  ],
                  ["Late",    fmtNum(selectedEmpData.late_days),    "text-amber-500" ],
                  ["Hours",   fmtHrs(selectedEmpData.total_work_hours), "text-blue-500"],
                ].map(([label, val, cls]) => (
                  <div key={label} className="bg-muted/40 rounded-xl p-2 text-center border border-border/50">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-bold font-mono ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-mono text-emerald-500">{fmtPct(selectedEmpData.attendance_rate)}</span>
                </div>
                <ProgressBar value={selectedEmpData.attendance_rate ?? 0} color={C.green} />
              </div>
              {selectedEmpData.records?.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recent Records</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedEmpData.records.slice(0, 5).map((rec: any) => (
                      <div key={rec.attendance_id} className="flex justify-between items-center text-[10px] p-1.5 bg-muted/40 rounded-lg">
                        <span className="font-mono text-muted-foreground">{rec.work_date}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold ${
                          rec.status === "present" ? "bg-emerald-500/20 text-emerald-500" :
                          rec.status === "absent"  ? "bg-rose-500/20 text-rose-500" :
                          rec.status === "late"    ? "bg-amber-500/20 text-amber-500" :
                          "bg-muted text-muted-foreground"
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