"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";
import type {
  NewDefaultCustomerResponse,
  NewCustomerTrendPoint,
  NewTopCustomer,
  NewFrequentCustomer,
  NewRetentionMetrics,
  NewCustomerSegment,
  NewStreakAnalytics,
  NewTokenAnalytics,
  NewTopTokenCustomer,
} from "@/utils/types/report-n-analysis.types";
import { useGetDefaultCustomerReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/customer/use-get-customer-report-n-analysis-for-date-range";
import { Users, Star, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

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
const fmtDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-NP", { month: "short", day: "numeric" });
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556", "#0891b2", "#a21caf"];
const SEGMENT_COLORS: Record<string, string> = {
  "High Spender": "#d85a30", "Regular": "#378add", "Occasional": "#1d9e75", "New": "#534ab7",
};

type TrendType = "daily" | "weekly" | "monthly" | "yearly";

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl min-w-[140px]">
      <p className="text-xs text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name?.toLowerCase().includes("revenue") ? fmtRs(p.value) : fmtNum(p.value)}
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
const Chip = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" | "success" }) => {
  const cls = { default: "bg-muted text-muted-foreground", accent: "bg-accent/15 text-accent", success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }[variant];
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-mono ${cls}`}>{children}</span>;
};

// ─── Retention Gauge ──────────────────────────────────────────────────────────
const RetentionGauge = ({ value, label }: { value: number; label: string }) => {
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--muted)" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${value * 2.26} 226`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold font-mono" style={{ color }}>{fmtPct(value)}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-mono">{label}</p>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerReportAndAnalysisDefaultPage() {
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [chartMode, setChartMode] = useState<"users" | "both">("both");

  const { data, isLoading, isError, error, refetch } = useGetDefaultCustomerReport();
  const report: NewDefaultCustomerResponse | undefined = data?.report;

  const trendData = useMemo((): NewCustomerTrendPoint[] => {
    if (!report) return [];
    const map: Record<TrendType, NewCustomerTrendPoint[]> = {
      daily: report.daily_trend, weekly: report.weekly_trend,
      monthly: report.monthly_trend, yearly: report.yearly_trend,
    };
    return map[trendFilter] ?? [];
  }, [trendFilter, report]);

  const segmentData = useMemo(() => {
    if (!report) return [];
    return report.customer_segments.map(s => ({ name: s.segment, value: s.count, percent: s.percent, revenue: s.total_revenue }));
  }, [report]);

  const streakDistData = useMemo(() => {
    if (!report) return [];
    return report.streak_analytics.streak_distribution.map(s => ({ name: s.streak_range, value: s.count, percent: s.percent }));
  }, [report]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 relative">
          <span className="text-2xl">⚠️</span>
          <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load customer data</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Try Again</button>
      </div>
    </div>
  );

  if (!report) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👥</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No customer data available</h3>
      </div>
    </div>
  );

  const ov = report.overview;
  const sc = report.stats_card;
  const rm = report.retention_metrics;
  const sa = report.streak_analytics;
  const ta = report.token_analytics;

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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Customer Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days · Customer insights & retention</p>
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
        <KpiCard label="Total Customers" value={fmtNum(ov.total_customers)} iconColor="#378add" icon={Users} />
        <KpiCard label="New Customers" value={fmtNum(ov.new_customers)} sub={`Active: ${fmtNum(ov.active_customers)}`} iconColor="#8b5cf6" icon={Star} />
        <KpiCard label="Returning Rate" value={fmtPct((ov.returning_customers / ov.total_customers) * 100)} iconColor="#10b981" icon={RefreshCw} />
        <KpiCard label="Avg Spend / Customer" value={fmtRs(ov.avg_spend_per_customer)} sub={`${fmtNum(ov.avg_orders_per_customer)} orders/cust`} iconColor="#f59e0b" icon={Star} />
      </div>

      {/* ── All-time Stats ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">All-time statistics</span>
          <Chip>Global</Chip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {[
            ["Total Customers",    fmtNum(sc.total_customers)],
            ["Total Orders",       fmtNum(sc.total_orders)],
            ["Total Revenue",      fmtRs(sc.total_revenue)],
            ["Avg Lifetime Value", fmtRs(sc.avg_lifetime_value)],
            ["Tokens Issued",      fmtNum(sc.total_tokens_issued)],
            ["Tokens Redeemed",    fmtNum(sc.total_tokens_redeemed)],
            ["Active Streakers",   fmtNum(sc.active_streak_customers)],
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Customer Growth</span>
              <Chip variant="accent">{trendFilter}</Chip>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SegmentedToggle options={["both", "users"]} value={chartMode} onChange={(v) => setChartMode(v as any)}
                labels={{ both: "All", users: "New Only" }} />
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
                <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="total_users" stroke={COLORS[0]} fill="url(#grad1)" strokeWidth={2} name="Total Users" />
                  <Area type="monotone" dataKey="new_users"   stroke={COLORS[2]} fill="url(#grad2)" strokeWidth={2} name="New Users"   />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="new_users" fill={COLORS[2]} radius={[5, 5, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Retention Metrics ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Retention Metrics</span>
          <Chip variant="success">Health</Chip>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <RetentionGauge value={rm.retention_rate_30_days} label="30-Day Retention" />
          <RetentionGauge value={rm.retention_rate_90_days} label="90-Day Retention" />
          <RetentionGauge value={rm.repeat_purchase_rate}   label="Repeat Purchase"  />
          <div className="col-span-2 space-y-4 flex flex-col justify-center">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground">Churn Rate</span>
                <span className="text-sm font-semibold font-mono" style={{ color: rm.churn_rate > 20 ? "#ef4444" : "#10b981" }}>
                  {fmtPct(rm.churn_rate)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(rm.churn_rate, 100)}%`, background: rm.churn_rate > 20 ? "#ef4444" : "#10b981" }} />
              </div>
            </div>
            <div className="flex justify-between items-center bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
              <span className="text-xs text-muted-foreground">Avg Days Between Orders</span>
              <span className="text-sm font-semibold font-mono text-foreground">{fmtNum(rm.avg_days_between_orders)} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Segments + Streak Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Customer Segments</span>
            <Chip>{segmentData.length} segments</Chip>
          </div>
          <div className="h-52">
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
          <div className="space-y-2 mt-3">
            {report.customer_segments.map((s: NewCustomerSegment, i: number) => (
              <div key={s.segment} className="flex items-center justify-between hover:bg-muted/20 rounded-lg px-2 py-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEGMENT_COLORS[s.segment] || COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-medium text-foreground">{s.segment}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{fmtPct(s.percent)}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{fmtRs(s.avg_spend)} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Streak Distribution</span>
            <Chip variant="accent">🔥 {fmtNum(sa.total_streak_customers)} streakers</Chip>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakDistData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill={COLORS[3]} radius={[0, 5, 5, 0]} name="Customers">
                  {streakDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.08em]">Avg Streak</p>
              <p className="text-lg font-bold font-mono text-foreground">{fmtNum(sa.avg_streak_length)} days</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.08em]">Max Streak</p>
              <p className="text-lg font-bold font-mono" style={{ color: COLORS[0] }}>{fmtNum(sa.max_streak_length)} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Customers ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Top Customers</span>
          <Chip>{report.top_customers?.length ?? 0}</Chip>
        </div>
        {!report.top_customers?.length ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Customer", "Orders", "Total Spent", "AOV", "Last Order"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.top_customers.map((c: NewTopCustomer, i: number) => (
                  <tr key={c.customer_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-muted-foreground text-xs">#{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-foreground">{c.customer_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.phone_number}</p>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{fmtNum(c.total_orders)}</td>
                    <td className="px-5 py-3 text-sm font-mono font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{fmtRs(c.total_spent)}</td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{fmtRs(c.avg_order_value)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{fmtDate(c.last_order_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Frequent Customers + Token Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Frequent Visitors</span>
            <Chip>{report.frequent_customers?.length ?? 0}</Chip>
          </div>
          {!report.frequent_customers?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {report.frequent_customers.map((c: NewFrequentCustomer, i: number) => (
                <div key={c.customer_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm ring-1 ring-border"
                    style={{ background: `${COLORS[i % COLORS.length]}15`, color: COLORS[i % COLORS.length] }}>
                    {c.customer_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{c.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {fmtNum(c.visit_frequency)} visits/week · {c.favorite_category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-semibold text-foreground">{fmtNum(c.total_orders)} orders</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.days_since_last_visit === 0 ? "Today" : `${c.days_since_last_visit}d ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Token Analytics</span>
            <Chip variant="accent">🎫 Tokens</Chip>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ["Total Earned",    fmtNum(ta.total_tokens_earned),   "#378add"],
              ["Total Spent",     fmtNum(ta.total_tokens_spent),    "#d85a30"],
              ["Active Balance",  fmtNum(ta.active_token_balance),  "#1d9e75"],
              ["Redemption Rate", fmtPct(ta.token_redemption_rate), "#ba7517"],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">{label}</p>
                <p className="text-lg font-bold font-mono" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">Top Token Earners</p>
          <div className="space-y-2">
            {ta.top_token_earners.map((t: NewTopTokenCustomer, i: number) => (
              <div key={i} className="flex items-center justify-between hover:bg-muted/20 rounded-xl px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{t.phone_number}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[#378add]">+{fmtNum(t.tokens_earned)}</span>
                  <span className="text-xs font-mono text-[#d85a30]">-{fmtNum(t.tokens_spent)}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{fmtNum(t.token_balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}