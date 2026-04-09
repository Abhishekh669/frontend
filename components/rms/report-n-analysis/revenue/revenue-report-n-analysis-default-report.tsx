import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  NewDefaultRevenueResponse,
  NewTrendPoint,
  NewPaymentMethodBreakdown,
  NewGatewayBreakdown,
  NewPeakDayPoint,
} from "@/utils/types/report-n-analysis.types";
import { useGetDefaultRevenueReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/revenue/use-get-default-revenue-report";

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
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "FonePay",
  banking: "Banking",
  other: "Other",
  cash: "Cash",
  online: "Online",
};

const getLabel = (key: string | undefined): string => {
  if (!key) return "—";
  return GATEWAY_LABELS[key.toLowerCase()] ?? key;
};

const COLORS = ["#e8490f", "#2563eb", "#16a34a", "#7c3aed", "#d97706", "#ec4899"];

// ─── Custom Tooltips ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg min-w-[130px]">
      <p className="text-xs text-gray-400 mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name === "revenue" ? fmtRs(p.value) : `${fmtNum(p.value)} orders`}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
      <p className="text-xs text-gray-400 mb-1 font-mono">{getLabel(d.name)}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-semibold font-mono">
        {fmtRs(d.value)}
      </p>
      <p className="text-xs text-gray-400 mt-1 font-mono">
        {(d.payload.percent ?? 0).toFixed(1)}%
      </p>
    </div>
  );
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto p-8">
    <div className="flex justify-between items-start mb-7">
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
    
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-56 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Stat Card Component ─────────────────────────────────────────────────────
const StatCard = ({ 
  label, 
  value, 
  sub, 
  accent, 
  icon 
}: { 
  label: string; 
  value: string; 
  sub?: string; 
  accent?: string; 
  icon?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: accent }}>
      {value}
    </div>
    {sub && <div className="text-xs text-gray-400 mt-1.5 font-mono">{sub}</div>}
  </div>
);

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function RevenueDashboard() {
  const [trendFilter, setTrendFilter] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [chartMode, setChartMode] = useState<"revenue" | "orders" | "both">("revenue");

  const { data, isLoading, error, refetch } = useGetDefaultRevenueReport();
  console.log("thisis hte data of revenue : ", data)
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

  // Loading State
  if (isLoading) return <DashboardSkeleton />;

  // Error State
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-1">
                Failed to load revenue data
              </h3>
              <p className="text-sm text-red-700 mb-4">
                {error.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No Data State
  if (!report) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex gap-4">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-1">
                No Data Available
              </h3>
              <p className="text-sm text-yellow-700">
                The revenue report could not be loaded.
              </p>
            </div>
          </div>
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
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Revenue Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            Current period · Nepalese Rupee (NPR)
          </p>
        </div>
        {ov.growth_percent != null && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-2">
            <span className="text-sm font-bold font-mono">
              ↑ {ov.growth_percent.toFixed(1)}% growth
            </span>
          </div>
        )}
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Gross Revenue" 
          value={fmtRs(ov.gross_revenue)} 
          accent="#e8490f" 
          icon="💰" 
        />
        <StatCard 
          label="Net Revenue" 
          value={fmtRs(ov.net_revenue)} 
          accent="#16a34a" 
          icon="✅" 
        />
        <StatCard 
          label="Total Orders" 
          value={fmtNum(ov.total_orders)}
          sub={`AOV ${fmtRs(ov.average_order_value)}`} 
          icon="🛒" 
        />
        <StatCard 
          label="Total Discounts" 
          value={fmtRs(ov.total_discounts)} 
          accent="#d97706" 
          icon="🏷️" 
        />
      </div>

      {/* All-time Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            All-Time Statistics
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
            Global
          </span>
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
            <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className="text-lg font-bold font-mono text-gray-900">
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Revenue Trend
            </h3>
            <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-mono rounded-full capitalize">
              {trendFilter}
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {["revenue", "orders", "both"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode as any)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize
                    ${chartMode === mode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {["daily", "weekly", "monthly", "yearly"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTrendFilter(filter as any)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize
                    ${trendFilter === filter 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-72">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              No trend data for this period
            </div>
          ) : chartMode === "both" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: "#6b7280", fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="rev" 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={fmtRs} 
                  width={75} 
                />
                <YAxis 
                  yAxisId="ord" 
                  orientation="right" 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={40} 
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line 
                  yAxisId="rev" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS[0]} 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  name="Revenue" 
                />
                <Line 
                  yAxisId="ord" 
                  type="monotone" 
                  dataKey="orders" 
                  stroke={COLORS[2]} 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  name="Orders" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={trendData} 
                margin={{ top: 5, right: 10, bottom: 5, left: 0 }} 
                barCategoryGap={trendData.length === 1 ? "60%" : "20%"}
                barGap={trendData.length === 1 ? 0 : 4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: "#6b7280", fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={chartMode === "revenue" ? fmtRs : undefined}
                  width={chartMode === "revenue" ? 75 : 40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey={chartMode}
                  fill={chartMode === "revenue" ? COLORS[0] : COLORS[2]}
                  radius={[6, 6, 0, 0]}
                  name={chartMode === "revenue" ? "Revenue" : "Orders"}
                  maxBarSize={trendData.length === 1 ? 80 : undefined}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Payment Methods + Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Payment Methods
            </h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
              {report.payment_methods?.length ?? 0} types
            </span>
          </div>
          
          {!report.payment_methods?.length ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No payment method data
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.payment_methods}
                      dataKey="revenue"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ method, percent }) => 
                        `${getLabel(method)} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                    >
                      {report.payment_methods.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {report.payment_methods.map((m: NewPaymentMethodBreakdown, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                    />
                    <span className="text-gray-600">{getLabel(m.method)}</span>
                    <span className="font-bold font-mono text-gray-900">
                      {(m.percent ?? 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Online Gateways */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Online Gateways
            </h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
              {report.gateways?.length ?? 0}
            </span>
          </div>
          
          {!report.gateways?.length ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No gateway data
            </div>
          ) : (
            <div className="space-y-4">
              {report.gateways.map((g: NewGatewayBreakdown, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">
                      {getLabel(g.gateway)}
                    </span>
                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-gray-400 font-mono">
                        {fmtNum(g.orders)} orders
                      </span>
                      <span 
                        className="text-sm font-bold font-mono"
                        style={{ color: COLORS[i % COLORS.length] }}
                      >
                        {fmtRs(g.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${g.percent ?? 0}%`, 
                        backgroundColor: COLORS[i % COLORS.length] 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Peak Hours + Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Peak Hours
          </h3>
          
          {!report.peak_hours?.length ? (
            <div className="h-52 flex items-center justify-center text-gray-400">
              No peak hour data
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={report.peak_hours}
                  barCategoryGap={report.peak_hours.length === 1 ? "60%" : "20%"}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(h) => `${h}h`} 
                    tick={{ fill: "#6b7280", fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={fmtRs} 
                    width={70} 
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill={COLORS[3]} 
                    radius={[6, 6, 0, 0]} 
                    name="Revenue"
                    maxBarSize={report.peak_hours.length === 1 ? 60 : undefined}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peak Days */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Peak Days
          </h3>
          
          {!report.peak_days?.length ? (
            <div className="h-52 flex items-center justify-center text-gray-400">
              No peak day data
            </div>
          ) : (
            <div className="space-y-3">
              {report.peak_days.map((d: NewPeakDayPoint, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold text-gray-500 font-mono uppercase">
                    {d.day_of_week?.slice(0, 3)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${maxPeakRev ? (d.revenue / maxPeakRev) * 100 : 0}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-bold font-mono text-gray-900">
                    {fmtRs(d.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discount Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Discount Analysis
          </h3>
          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-mono rounded-full">
            {(disc.discount_rate_percent ?? 0).toFixed(1)}% rate
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Discounts Given", fmtRs(disc.total_discounts_given), "#d97706"],
            ["Gross Revenue", fmtRs(disc.gross_revenue), "#e8490f"],
            ["Net Revenue", fmtRs(disc.net_revenue), "#16a34a"],
            ["Discount Rate", `${(disc.discount_rate_percent ?? 0).toFixed(1)}%`, "#dc2626"],
            ["Orders w/ Discount", fmtNum(disc.orders_with_discount), "#2563eb"],
            ["Total Orders", fmtNum(disc.total_orders), "#1c1a17"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className="text-lg font-bold font-mono" style={{ color }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

