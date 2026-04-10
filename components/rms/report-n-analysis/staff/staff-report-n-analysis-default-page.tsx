"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, AreaChart, Area, Cell,
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
  NewStaffPeakHour,
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
const fmtHour = (h: number): string => {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
};
const fmtHourShort = (h: number): string => {
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
  <div
    style={{ width: w ?? "100%", height: h ?? "1rem" }}
    className="animate-pulse rounded-lg bg-zinc-800"
  />
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-white font-mono leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, icon }: { title: string; badge?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-zinc-500">{icon}</span>}
      <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">{title}</h2>
      {badge && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={`h-1.5 bg-zinc-800 rounded-full overflow-hidden ${className ?? ""}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl min-w-[160px]">
      <p className="text-[11px] text-zinc-400 mb-2 font-mono">{label}</p>
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
  const [trendFilter, setTrendFilter]   = useState<TrendType>("daily");
  const [trendMetric, setTrendMetric]   = useState<TrendMetric>("attendance_rate");
  const [selectedEmp, setSelectedEmp]   = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const { data, isLoading, isError, error, refetch } = useGetDefaultStaffReport();
  const report: NewDefaultStaffResponse | undefined = data?.report;

  // ─── Derived data ─────────────────────────────────────────────────────────
  const trendData = useMemo((): NewStaffTrendPoint[] => {
    if (!report) return [];
    return { daily: report.daily_trend, weekly: report.weekly_trend, monthly: report.monthly_trend, yearly: report.yearly_trend }[trendFilter] ?? [];
  }, [trendFilter, report]);

  const dailySummary    = useMemo(() => report?.daily_summary           ?? [], [report]);
  const peakHours       = useMemo(() => report?.peak_hours              ?? [], [report]);
  const roleBreakdown   = useMemo(() => report?.role_breakdown          ?? [], [report]);
  const empAttendance   = useMemo(() => report?.employee_attendance     ?? [], [report]);
  // Filter most absent to only show employees with actual absent days
  const mostAbsent      = useMemo(() => (report?.most_absent_employees ?? []).filter(e => (e.absent_days ?? 0) > 0), [report]);
  const mostPresent     = useMemo(() => report?.most_present_employees  ?? [], [report]);
  const longestService  = useMemo(() => report?.longest_service_employees ?? [], [report]);
  const leaveAnalysis   = useMemo(() => report?.leave_analysis,               [report]);
  const payroll         = useMemo(() => report?.payroll_summary,               [report]);

  const maxPeak = peakHours.length ? Math.max(...peakHours.map(h => h.active_staff ?? 0), 1) : 1;
  const selectedEmpData = selectedEmp ? empAttendance.find(e => e.employee_id === selectedEmp) : null;

  // Handle employee row click with positioning
  const handleEmployeeClick = (employeeId: string, event: React.MouseEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setSelectedEmp(selectedEmp === employeeId ? null : employeeId);
  };

  // Close modal when clicking outside
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

  // ─── States ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-5">
        <div className="max-w-7xl mx-auto space-y-5">
          <Sk h="2.5rem" w="16rem" />
          <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} h="5rem" />)}</div>
          <Sk h="18rem" />
          <div className="grid grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <Sk key={i} h="10rem" />)}</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-semibold">Failed to load staff data</p>
          <p className="text-zinc-500 text-sm">{(error as Error)?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const ov = report.overview;
  const sc = report.stats_card;

  // attendance breakdown for summary ring
  const totalTracked = (ov.total_present_days ?? 0) + (ov.total_absent_days ?? 0) + (ov.total_late_days ?? 0) + (ov.total_half_days ?? 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff Attendance Report</h1>
            <p className="text-sm text-zinc-400 mt-1">Last 30 days · All attendance & performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            {ov.busiest_day && ov.busiest_day !== "Unknown" && (
              <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                📅 Busiest: {ov.busiest_day}
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Total Employees" value={`${fmtNum(ov.total_employees)}`}
            color={C.blue} icon={<Users className="w-5 h-5" />} />
          <StatPill label="Attendance Rate" value={fmtPct(ov.overall_attendance_rate)}
            color={C.green} icon={<Calendar className="w-5 h-5" />} />
          <StatPill label="Late Arrivals" value={fmtPct(ov.late_rate)}
            color={C.amber} icon={<Clock className="w-5 h-5" />} />
          <StatPill label="Avg Work Hours" value={fmtHrs(ov.avg_work_hours_per_employee)}
            color={C.purple} icon={<TrendingUp className="w-5 h-5" />} />
        </div>

        {/* ── Attendance Breakdown + All-time Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Attendance composition */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHeader title="Attendance Breakdown" badge="Last 30 days" icon={<Activity className="w-3.5 h-3.5" />} />
            <div className="space-y-3">
              {([
                { label: "✅ Present", value: ov.total_present_days, color: C.green, icon: <CheckCircle className="w-3 h-3" /> },
                { label: "❌ Absent",  value: ov.total_absent_days,  color: C.red,   icon: <XCircle className="w-3 h-3" /> },
                { label: "⏰ Late",    value: ov.total_late_days,    color: C.amber, icon: <ClockIcon className="w-3 h-3" /> },
                { label: "📝 Half Day",value: ov.total_half_days,    color: C.purple, icon: null },
                { label: "🏖️ On Leave",value: ov.total_leave_days,   color: C.slate, icon: null },
              ] as const).map(({ label, value, color, icon }) => {
                const pct = totalTracked > 0 ? ((value ?? 0) / totalTracked) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">{icon}{label}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color }}>{fmtNum(value)} days</span>
                    </div>
                    <ProgressBar value={pct} color={color} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total tracked days</span>
                <span className="font-mono text-white">{fmtNum(totalTracked)}</span>
              </div>
            </div>
          </div>

          {/* All-time stats */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHeader title="All-time Statistics" badge="Global" icon={<TrendingUp className="w-3.5 h-3.5" />} />
            <div className="grid grid-cols-3 gap-3">
              {([
                ["Total Staff",       fmtNum(sc?.total_employees),          C.blue   ],
                ["Active Staff",      fmtNum(sc?.active_employees),         C.green  ],
                ["Attendance Records",fmtNum(sc?.total_attendance_records), C.purple ],
                ["All-time Hours",    fmtHrs(sc?.all_time_work_hours),      C.amber  ],
                ["Avg Session",       fmtHrs(sc?.avg_session_hours),        C.slate  ],
                ["Pending Leaves",    fmtNum(sc?.total_pending_leaves),     C.red    ],
              ] as [string, string, string][]).map(([l, v, c]) => (
                <div key={l} className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{l}</p>
                  <p className="text-base font-bold font-mono" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Payroll strip */}
            {payroll && payroll.total_monthly_salary > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-4">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Monthly Payroll</p>
                  <p className="text-sm font-bold font-mono text-white">
                    Rs. {(payroll.total_monthly_salary ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Salary</p>
                  <p className="text-sm font-bold font-mono text-white">
                    Rs. {(payroll.avg_salary ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Top Performers ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Present */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Award className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">🏆 Most Present</span>
            </div>
            {mostPresent.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">No data</p>
            ) : (
              <div className="space-y-3">
                {mostPresent.slice(0, 5).map((emp, i) => (
                  <div key={emp.employee_id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-600 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0">
                      {emp.employee_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{emp.employee_name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{emp.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-green-400 font-mono">{fmtNum(emp.present_days)} days</p>
                      <p className="text-[9px] text-zinc-500 font-mono">{fmtPct(emp.attendance_rate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Absent - Only shows employees with actual absences */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">⚠️ Needs Attention</span>
            </div>
            {mostAbsent.length === 0 ? (
              <p className="text-sm text-green-400 italic">✨ All staff have perfect attendance!</p>
            ) : (
              <div className="space-y-3">
                {mostAbsent.slice(0, 5).map((emp, i) => (
                  <div key={emp.employee_id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-600 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0">
                      {emp.employee_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{emp.employee_name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{emp.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-400 font-mono">{fmtNum(emp.absent_days)} absent</p>
                      <p className="text-[9px] text-zinc-500 font-mono">{fmtPct(emp.attendance_rate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Longest Service */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">⭐ Most Hours Worked</span>
            </div>
            {longestService.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">No data</p>
            ) : (
              <div className="space-y-3">
                {longestService.slice(0, 5).map((emp, i) => (
                  <div key={emp.employee_id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-600 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0">
                      {emp.employee_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{emp.employee_name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{emp.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-400 font-mono">{fmtHrs(emp.total_work_hours)}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">avg {fmtHrs(emp.avg_shift_hours)}/shift</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Summary Cards (Easier to understand) ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <SectionHeader title="Daily Attendance Summary" badge="Last 14 days" icon={<Calendar className="w-3.5 h-3.5" />} />
          <p className="text-[10px] text-zinc-500 mb-4">Each bar shows: 🟢 Present | 🔴 Absent | 🟡 Late | ⚪ Leave</p>
          {dailySummary.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">No data</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {dailySummary.slice(0, 14).map(day => {
                const total = (day.present ?? 0) + (day.absent ?? 0) + (day.on_leave ?? 0) + (day.late ?? 0);
                const presentPct = total > 0 ? ((day.present ?? 0) / total) * 100 : 0;
                const absentPct = total > 0 ? ((day.absent ?? 0) / total) * 100 : 0;
                const latePct = total > 0 ? ((day.late ?? 0) / total) * 100 : 0;
                const leavePct = total > 0 ? ((day.on_leave ?? 0) / total) * 100 : 0;
                
                return (
                  <div key={day.work_date} className="bg-zinc-800/40 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-zinc-200">{day.work_date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">Attendance Rate:</span>
                        <span className={`text-sm font-bold font-mono ${(day.attendance_rate ?? 0) >= 80 ? 'text-green-400' : (day.attendance_rate ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {fmtPct(day.attendance_rate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-8 bg-zinc-700 rounded-lg overflow-hidden mb-2">
                      <div className="h-full bg-green-500 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${presentPct}%` }}>
                        {presentPct > 15 ? `${fmtNum(day.present)}` : ''}
                      </div>
                      <div className="h-full bg-red-500 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${absentPct}%` }}>
                        {absentPct > 15 ? `${fmtNum(day.absent)}` : ''}
                      </div>
                      <div className="h-full bg-amber-400 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${latePct}%` }}>
                        {latePct > 15 ? `${fmtNum(day.late)}` : ''}
                      </div>
                      <div className="h-full bg-zinc-500 transition-all flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${leavePct}%` }}>
                        {leavePct > 15 ? `${fmtNum(day.on_leave)}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/> Present: {fmtNum(day.present)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/> Absent: {fmtNum(day.absent)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> Late: {fmtNum(day.late)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500"/> Leave: {fmtNum(day.on_leave)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"/> Half Day: {fmtNum(day.half_day)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Role Breakdown + Leave Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Role Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHeader title="Performance by Role" badge={`${roleBreakdown.length} roles`} icon={<Users className="w-3.5 h-3.5" />} />
            {roleBreakdown.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">No data</p>
            ) : (
              <div className="space-y-4">
                {roleBreakdown.map((role, i) => (
                  <div key={role.role}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                        <span className="text-sm font-medium text-zinc-200 capitalize">{role.role}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{fmtNum(role.employee_count)} staff</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-mono">{fmtHrs(role.total_work_hours)}</span>
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Leave Analysis" icon={<Calendar className="w-3.5 h-3.5" />} />
              {leaveAnalysis?.pending_count != null && leaveAnalysis.pending_count > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {fmtNum(leaveAnalysis.pending_count)} pending
                </span>
              )}
            </div>
            {!leaveAnalysis || leaveAnalysis.total_requests === 0 ? (
              <p className="text-sm text-green-400 italic">✨ No leave requests in this period</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Total Requests", fmtNum(leaveAnalysis.total_requests),  C.blue   ],
                    ["Approval Rate",  fmtPct(leaveAnalysis.approval_rate),   C.green  ],
                    ["Approved",       fmtNum(leaveAnalysis.approved_count),  C.green  ],
                    ["Rejected",       fmtNum(leaveAnalysis.rejected_count),  C.red    ],
                  ] as [string, string, string][]).map(([l, v, c]) => (
                    <div key={l} className="bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">{l}</p>
                      <p className="text-lg font-bold font-mono" style={{ color: c }}>{v}</p>
                    </div>
                  ))}
                </div>

                {leaveAnalysis.top_leave_employees?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 font-mono mb-2 uppercase tracking-wider">Top leave takers</p>
                    <div className="space-y-2">
                      {leaveAnalysis.top_leave_employees.slice(0, 4).map(emp => (
                        <div key={emp.employee_id} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-zinc-300 truncate max-w-[130px]">{emp.employee_name}</span>
                          <span className="text-zinc-500 font-mono capitalize">{emp.role}</span>
                          <span className="font-mono text-amber-400 font-semibold">{emp.total_days} days</span>
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHeader title="All Employees" badge={`${empAttendance.length} employees`} icon={<User className="w-3.5 h-3.5" />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["Employee", "Role", "Present", "Absent", "Late", "Leave", "Work Hours", "Attendance"].map(h => (
                      <th key={h} className="pb-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider pr-4 last:pr-0 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {empAttendance.map(emp => (
                    <tr
                      key={emp.employee_id}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      onClick={(e) => handleEmployeeClick(emp.employee_id, e)}
                    >
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                            {emp.employee_name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-xs font-medium text-zinc-200">{emp.employee_name}</span>
                        </div>
                       </td>
                      <td className="py-2.5 pr-4 text-[11px] text-zinc-500 capitalize">{emp.role}</td>
                      <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-green-400">{fmtNum(emp.present_days)}</td>
                      <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-red-400">{fmtNum(emp.absent_days)}</td>
                      <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-amber-400">{fmtNum(emp.late_days)}</td>
                      <td className="py-2.5 pr-4 text-xs font-mono text-zinc-500">{fmtNum(emp.leave_days)}</td>
                      <td className="py-2.5 pr-4 text-xs font-mono text-zinc-300">{fmtHrs(emp.total_work_hours)}</td>
                      <td className="py-2.5 pr-0">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(emp.attendance_rate ?? 0, 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono font-semibold text-zinc-200">{fmtPct(emp.attendance_rate)}</span>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Employee Detail Modal (Positioned near clicked row) ── */}
      {selectedEmpData && modalPosition && (
        <div
          className="employee-modal fixed z-50"
          style={{
            top: modalPosition.top - 20,
            left: modalPosition.left + 200,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-80 shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-200">
                  {selectedEmpData.employee_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{selectedEmpData.employee_name}</h3>
                  <p className="text-[10px] text-zinc-400 capitalize">{selectedEmpData.role}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedEmp(null); setModalPosition(null); }} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-800 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase">Present</p>
                  <p className="text-sm font-bold text-green-400">{fmtNum(selectedEmpData.present_days)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase">Absent</p>
                  <p className="text-sm font-bold text-red-400">{fmtNum(selectedEmpData.absent_days)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase">Late</p>
                  <p className="text-sm font-bold text-amber-400">{fmtNum(selectedEmpData.late_days)}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase">Hours</p>
                  <p className="text-sm font-bold text-blue-400">{fmtHrs(selectedEmpData.total_work_hours)}</p>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Attendance Rate</span>
                  <span className="font-mono text-green-400">{fmtPct(selectedEmpData.attendance_rate)}</span>
                </div>
                <ProgressBar value={selectedEmpData.attendance_rate ?? 0} color={C.green} />
              </div>

              {selectedEmpData.records?.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-zinc-400 mb-1">Recent</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedEmpData.records.slice(0, 5).map(rec => (
                      <div key={rec.attendance_id} className="flex justify-between items-center text-[10px] p-1.5 bg-zinc-800/50 rounded">
                        <span className="font-mono text-zinc-400">{rec.work_date}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                          rec.status === "present" ? "bg-green-500/20 text-green-400" :
                          rec.status === "absent"  ? "bg-red-500/20 text-red-400" :
                          rec.status === "late"    ? "bg-amber-500/20 text-amber-400" :
                          "bg-zinc-700 text-zinc-400"
                        }`}>{rec.status}</span>
                        <span className="font-mono text-zinc-300">{fmtHrs(rec.work_hours)}</span>
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