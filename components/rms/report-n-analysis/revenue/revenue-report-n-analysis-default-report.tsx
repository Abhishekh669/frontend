import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type {
  NewDefaultRevenueResponse,
  NewTrendPoint,
  NewPaymentMethodBreakdown,
  NewGatewayBreakdown,
  NewPeakDayPoint,
} from "@/utils/types/report-n-analysis.types";
import { useGetDefaultRevenueReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/revenue/use-get-default-revenue-report";
import { TrendingUp, DollarSign, ShoppingCart, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ─── Currency Formatters ──────────────────────────────────────────────────────
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

// ─── Labels & Colors ─────────────────────────────────────────────────────────
const GATEWAY_LABELS: Record<string, string> = {
  esewa: "eSewa", khalti: "Khalti", fonepay: "FonePay",
  banking: "Banking", other: "Other", cash: "Cash", online: "Online",
};
const getLabel = (key: string | undefined): string => {
  if (!key) return "—";
  return GATEWAY_LABELS[key.toLowerCase()] ?? key;
};
const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "#ec4899"];

// ─── Custom Tooltips ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl min-w-[140px]">
      <p className="text-[11px] text-muted-foreground mb-1.5 font-mono">{label}</p>
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
      <p className="text-[11px] text-muted-foreground mb-1 font-mono">{getLabel(d.name)}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">{fmtRs(d.value)}</p>
      <p className="text-[11px] text-muted-foreground mt-1 font-mono">{(d.payload.percent ?? 0).toFixed(1)}%</p>
    </div>
  );
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
      <div className="h-7 w-52 bg-muted rounded-full animate-pulse mb-2" />
      <div className="h-4 w-36 bg-muted rounded-full animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="h-3.5 w-24 bg-muted rounded-full animate-pulse mb-4" />
          <div className="h-7 w-32 bg-muted rounded-full animate-pulse" />
        </div>
      ))}
    </div>
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="h-72 bg-muted rounded-xl animate-pulse" />
    </div>
  </div>
);

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, iconColor, icon: Icon }: {
  label: string; value: string; sub?: string;
  iconColor: string; icon: React.ElementType;
}) => (
  <div className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
    {/* Corner glow */}
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `radial-gradient(circle, ${iconColor}18, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
    {/* Top accent line on hover */}
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

// ─── Segmented Toggle ────────────────────────────────────────────────────────
const SegmentedToggle = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)}
        className={`px-3 h-7 text-[11px] font-medium rounded-lg capitalize transition-all ${
          value === opt ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}>
        {opt}
      </button>
    ))}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function RevenueDashboard() {
  const [trendFilter, setTrendFilter] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [chartMode, setChartMode] = useState<"revenue" | "orders" | "both">("revenue");

  const { data, isLoading, error, refetch } = useGetDefaultRevenueReport();
  const report = data?.report;

  const trendData = useMemo((): NewTrendPoint[] => {
    if (!report) return [];
    const map: Record<typeof trendFilter, NewTrendPoint[]> = {
      daily: report.daily_trend,
      weekly: report.weekly_trend,
      monthly: report.monthly_trend,
      yearly: report.yearly_trend,
    };
    return map[trendFilter] ?? [];
  }, [trendFilter, report]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 relative">
            <span className="text-2xl">⚠️</span>
            <div className="absolute inset-0 rounded-3xl border border-destructive/10 scale-110" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load revenue data</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{error.message || "An unexpected error occurred"}</p>
          <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center mx-auto mb-4 relative">
            <span className="text-2xl">📊</span>
            <div className="absolute inset-0 rounded-3xl border border-border scale-110" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No Data Available</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">The revenue report could not be loaded.</p>
        </div>
      </div>
    );
  }

  const ov = report.overview;
  const sc = report.stats_card;
  const disc = report.discounts;

  const maxPeakRev = report.peak_days?.length
    ? Math.max(...report.peak_days.map((d: NewPeakDayPoint) => d.revenue))
    : 1;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        {/* Gold radial glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.12 85 / 12%), transparent 70%)" }} />
        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex items-start justify-between gap-4 flex-wrap relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Revenue Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Current period · Nepalese Rupee (NPR)</p>
          </div>
          {ov.growth_percent != null && (
            <div className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold font-mono border ${
              ov.growth_percent >= 0
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
            }`}>
              {ov.growth_percent >= 0
                ? <ArrowUpRight className="w-4 h-4" />
                : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(ov.growth_percent).toFixed(1)}% growth
            </div>
          )}
        </div>
      </div>

      {/* ── Overview KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Gross Revenue" value={fmtRs(ov.gross_revenue)} iconColor="#f59e0b" icon={DollarSign} />
        <StatCard label="Net Revenue" value={fmtRs(ov.net_revenue)} iconColor="#10b981" icon={TrendingUp} />
        <StatCard label="Total Orders" value={fmtNum(ov.total_orders)} sub={`AOV ${fmtRs(ov.average_order_value)}`} iconColor="#3b82f6" icon={ShoppingCart} />
        <StatCard label="Total Discounts" value={fmtRs(ov.total_discounts)} iconColor="#f59e0b" icon={Tag} />
      </div>

      {/* ── All-time Stats ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">All-Time Statistics</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">Global</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ["Gross Rev", fmtRs(sc.total_gross_revenue)],
            ["Net Rev", fmtRs(sc.total_net_revenue)],
            ["Orders", fmtNum(sc.total_orders)],
            ["Discounts", fmtRs(sc.total_discounts)],
            ["AOV", fmtRs(sc.average_order_value)],
            ["Customers", fmtNum(sc.total_customers)],
            ["Discount %", `${sc.discount_rate_percent?.toFixed(1) ?? 0}%`],
          ].map(([label, val]) => (
            <div key={label} className="bg-muted/30 rounded-xl p-3 border border-border/50">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">{label}</div>
              <div className="text-base font-bold font-mono text-foreground">{val}</div>
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Revenue Trend</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent font-mono capitalize">{trendFilter}</span>
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
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No trend data for this period</div>
            ) : chartMode === "both" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtRs} width={75} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} name="Revenue" />
                  <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={{ r: 4 }} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  barCategoryGap={trendData.length === 1 ? "60%" : "20%"}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={chartMode === "revenue" ? fmtRs : undefined}
                    width={chartMode === "revenue" ? 75 : 40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey={chartMode} fill={chartMode === "revenue" ? CHART_COLORS[0] : CHART_COLORS[2]}
                    radius={[6, 6, 0, 0]} name={chartMode === "revenue" ? "Revenue" : "Orders"}
                    maxBarSize={trendData.length === 1 ? 80 : undefined} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Methods + Gateways ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Methods */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Payment Methods</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
              {report.payment_methods?.length ?? 0} types
            </span>
          </div>
          {!report.payment_methods?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No payment method data</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.payment_methods} dataKey="revenue" nameKey="method"
                      cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}
                      label={({ method, percent }) => `${getLabel(method)} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}>
                      {report.payment_methods.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {report.payment_methods.map((m: NewPaymentMethodBreakdown, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{getLabel(m.method)}</span>
                    <span className="font-bold font-mono text-foreground">{(m.percent ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Online Gateways */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Online Gateways</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
              {report.gateways?.length ?? 0}
            </span>
          </div>
          {!report.gateways?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No gateway data</div>
          ) : (
            <div className="space-y-4">
              {report.gateways.map((g: NewGatewayBreakdown, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-foreground">{getLabel(g.gateway)}</span>
                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-muted-foreground font-mono">{fmtNum(g.orders)} orders</span>
                      <span className="text-sm font-bold font-mono" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                        {fmtRs(g.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${g.percent ?? 0}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Peak Hours REMOVED as requested ── */}
      {/* Peak Hours section has been commented out */}

      {/* ── Peak Days ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Peak Days</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
            {report.peak_days?.length ?? 0} days
          </span>
        </div>
        {!report.peak_days?.length ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No peak day data</div>
        ) : (
          <div className="space-y-3">
            {report.peak_days.map((d: NewPeakDayPoint, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 text-[11px] font-semibold text-muted-foreground font-mono uppercase">
                  {d.day_of_week?.slice(0, 3)}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${maxPeakRev ? (d.revenue / maxPeakRev) * 100 : 0}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <span className="w-20 text-right text-xs font-bold font-mono text-foreground">{fmtRs(d.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Discount Analysis ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Discount Analysis</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
            {(disc.discount_rate_percent ?? 0).toFixed(1)}% rate
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Discounts Given", fmtRs(disc.total_discounts_given), "text-amber-600 dark:text-amber-400"],
            ["Gross Revenue", fmtRs(disc.gross_revenue), "text-foreground"],
            ["Net Revenue", fmtRs(disc.net_revenue), "text-emerald-600 dark:text-emerald-400"],
            ["Discount Rate", `${(disc.discount_rate_percent ?? 0).toFixed(1)}%`, "text-rose-600 dark:text-rose-400"],
            ["Orders w/ Discount", fmtNum(disc.orders_with_discount), "text-blue-600 dark:text-blue-400"],
            ["Total Orders", fmtNum(disc.total_orders), "text-foreground"],
          ].map(([label, val, colorClass]) => (
            <div key={label} className="bg-muted/30 rounded-xl p-3 border border-border/50">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">{label}</div>
              <div className={`text-base font-bold font-mono ${colorClass}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}