"use client"
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useGetDefaultRawMaterialReport } from '@/utils/hooks/tanstack-query/query-hook/report-n-analysis/raw-material/use-get-report-n-analysis-raw-material-default'
import type {
  NewDefaultRawMaterialResponse,
  NewRawMaterialTrendPoint,
  NewTopUsedRawMaterial,
  NewRawMaterialUsageBreakdown,
} from '@/utils/types/report-n-analysis.types'

// ─── Currency & Number Formatters ────────────────────────────────────────────
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
  return `${n.toLocaleString("en-NP")}`;
};

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = ["#e8490f", "#2563eb", "#16a34a", "#7c3aed", "#d97706", "#ec4899", "#06b6d4", "#8b5cf6"];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg min-w-[150px]">
      <p className="text-xs text-gray-400 mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold font-mono">
          {p.name === "total_cost" || p.name === "Cost" 
            ? fmtRs(p.value) 
            : p.name === "material_used" || p.name === "Quantity"
            ? `${fmtNum(p.value)} units`
            : fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto p-8">
    <div className="flex justify-between items-start mb-7">
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
    
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
    
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="h-48 bg-gray-200 rounded animate-pulse" />
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

// ─── Main Component ──────────────────────────────────────────────────────────
function RawMaterialReportAndAnalysisDefaultPage() {
  const [trendFilter, setTrendFilter] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [chartMode, setChartMode] = useState<"total_cost" | "material_used" | "both">("total_cost");

  const { data, isLoading, isError, error, refetch } = useGetDefaultRawMaterialReport();
  
  const report = data?.report;

  const trendData = useMemo((): NewRawMaterialTrendPoint[] => {
    if (!report) return [];
    const map: Record<typeof trendFilter, NewRawMaterialTrendPoint[]> = {
      daily: report.daily_trend || [],
      weekly: report.weekly_trend || [],
      monthly: report.monthly_trend || [],
      yearly: report.yearly_trend || [],
    };
    return map[trendFilter] ?? [];
  }, [trendFilter, report]);

  // Loading State
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error State
  if (isError || error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load raw material report";
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-1">
                Failed to load raw material data
              </h3>
              <p className="text-sm text-red-700 mb-4">
                {errorMessage}
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
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-1">
                No Data Available
              </h3>
              <p className="text-sm text-yellow-700">
                No raw material usage data found for the selected period.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overview = report.overview || {
    total_material_used: 0,
    total_investment: 0,
    total_orders: 0,
    highest_cost_material_value: 0,
    highest_cost_material_name: "",
    most_used_material_quantity: 0,
    most_used_material_name: "",
  };
  
  const statsCard = report.stats_card || {
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

  const topUsedMaterials = report.top_used_materials || [];
  const materialUsageBreakdown = report.material_usage_breakdown || [];

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Raw Material Usage Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            Track material consumption & investment trends
          </p>
        </div>
        {statsCard.total_materials > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-2">
            <span className="text-sm font-bold font-mono">
              📊 {statsCard.total_materials} materials tracked
            </span>
          </div>
        )}
      </div>

      {/* Overview KPIs - Focus on USAGE and INVESTMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Total Material Used" 
          value={`${fmtNum(overview.total_material_used)} units`}
          sub="Current period"
          accent="#e8490f" 
          icon="📦" 
        />
        <StatCard 
          label="Total Investment" 
          value={fmtRs(overview.total_investment)} 
          sub="Cost of materials used"
          accent="#16a34a" 
          icon="💰" 
        />
        <StatCard 
          label="Orders Processed" 
          value={fmtNum(overview.total_orders)}
          sub="Using these materials"
          icon="🛒" 
        />
        <StatCard 
          label="Most Used Material" 
          value={overview.most_used_material_name || "—"}
          sub={`${fmtNum(overview.most_used_material_quantity)} units consumed`}
          accent="#d97706" 
          icon="🏆" 
        />
      </div>

      {/* All-time Investment Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Lifetime Investment Analysis
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
            All time
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Total Materials Used", `${fmtNum(statsCard.total_material_used_all_time)} units`],
            ["Total Investment", fmtRs(statsCard.total_investment_all_time)],
            ["Unique Materials", fmtNum(statsCard.total_materials)],
            ["Avg Material Cost", fmtRs(statsCard.avg_material_value)],
            ["Highest Unit Cost", fmtRs(statsCard.most_expensive_unit_cost)],
            ["Most Expensive Material", statsCard.most_expensive_material_name || "—"],
          ].map(([label, val]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className="text-md font-bold font-mono text-gray-900 break-words">
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Usage Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Material Consumption Trend
            </h3>
            <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-mono rounded-full capitalize">
              {trendFilter}
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {["total_cost", "material_used", "both"].map((mode) => (
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
                  {mode === "total_cost" ? "Investment" : mode === "material_used" ? "Quantity" : "Both"}
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

        <div className="h-80">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              No consumption data available for this period
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
                  yAxisId="cost" 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={fmtRs} 
                  width={75} 
                  label={{ value: 'Investment (Rs)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="quantity" 
                  orientation="right" 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={50}
                  label={{ value: 'Quantity (units)', angle: 90, position: 'insideRight', fontSize: 10 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line 
                  yAxisId="cost" 
                  type="monotone" 
                  dataKey="total_cost" 
                  stroke={COLORS[0]} 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  name="Investment (Rs)" 
                />
                <Line 
                  yAxisId="quantity" 
                  type="monotone" 
                  dataKey="material_used" 
                  stroke={COLORS[2]} 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  name="Quantity Used (units)" 
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
                  tickFormatter={chartMode === "total_cost" ? fmtRs : undefined}
                  width={chartMode === "total_cost" ? 75 : 50}
                  label={chartMode === "total_cost" 
                    ? { value: 'Investment (Rs)', angle: -90, position: 'insideLeft', fontSize: 10 }
                    : { value: 'Quantity (units)', angle: -90, position: 'insideLeft', fontSize: 10 }
                  }
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey={chartMode}
                  fill={chartMode === "total_cost" ? COLORS[0] : COLORS[2]}
                  radius={[6, 6, 0, 0]}
                  name={chartMode === "total_cost" ? "Investment (Rs)" : "Quantity Used (units)"}
                  maxBarSize={trendData.length === 1 ? 80 : undefined}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Used Materials - Most Consumed */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Most Consumed Materials
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
            By quantity used
          </span>
        </div>
        
        {topUsedMaterials.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No consumption data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity Consumed</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Investment</th>
                  <th className="text-right py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Affected Orders</th>
                </tr>
              </thead>
              <tbody>
                {topUsedMaterials.map((material: NewTopUsedRawMaterial, i: number) => (
                  <tr key={material.material_id || i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900">{material.material_name}</td>
                    <td className="py-3 px-2 text-right text-gray-600">{material.unit || "—"}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-gray-900">{fmtNum(material.total_quantity_used)}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium" style={{ color: COLORS[0] }}>{fmtRs(material.total_cost)}</td>
                    <td className="py-3 px-2 text-right font-mono text-gray-600">{fmtNum(material.affected_orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material-wise Investment Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Investment Breakdown by Material
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full">
            Cost distribution
          </span>
        </div>
        
        {materialUsageBreakdown.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No investment data available
          </div>
        ) : (
          <div className="space-y-4">
            {materialUsageBreakdown.map((material: NewRawMaterialUsageBreakdown, i: number) => (
              <div key={material.material_id || i}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-700">
                      {material.material_name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {material.unit_cost ? `@ ${fmtRs(material.unit_cost)}/unit` : ''}
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-xs text-gray-400 font-mono">
                      {fmtNum(material.period_usage)} {material.unit}
                    </span>
                    <span 
                      className="text-sm font-bold font-mono"
                      style={{ color: COLORS[i % COLORS.length] }}
                    >
                      {fmtRs(material.period_cost)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${Math.min(material.usage_percent ?? 0, 100)}%`, 
                        backgroundColor: COLORS[i % COLORS.length] 
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 min-w-[45px] text-right">
                    {material.usage_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Consumed: {fmtNum(material.period_usage)} units</span>
                  <span>Orders: {fmtNum(material.orders_count)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RawMaterialReportAndAnalysisDefaultPage;