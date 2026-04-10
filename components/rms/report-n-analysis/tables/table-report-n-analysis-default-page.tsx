"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { useGetDefaultTableReport } from "@/utils/hooks/tanstack-query/query-hook/report-n-analysis/tables/use-get-report-n-analysis-tables-by-default";
import type {
  NewDefaultTableResponse,
  NewTableTrendPoint,
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
 * Values > 100 are treated as the 0–1 decimal range (× 100).
 * Negative values are clamped to 0.
 */
const normalizePct = (n: number | null | undefined): number => {
  if (n == null || isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return Math.min(n * 100, 100); // was a 0-1 decimal sent × 100 again → clamp
  // if between 0 and 1 treat as decimal fraction
  if (n <= 1) return n * 100;
  return n; // already 0–100
};

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
  const absN = Math.abs(n); // guard against negative duration from backend
  const h = Math.floor(absN / 60);
  const m = Math.round(absN % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/** Convert 0–23 hour number → readable AM/PM string */
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

/** Clamp hours to a non-negative value (backend may send negative due to tz bugs) */
const safeHours = (n: number | null | undefined): number =>
  Math.max(0, n ?? 0);

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = ["#d85a30", "#378add", "#1d9e75", "#534ab7", "#ba7517", "#993556", "#2d8a8a", "#b55e26"];

/** Heat gradient: slate (empty) → blue → amber → red (peak) */
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
  <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
);
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-5">
    <div className="space-y-2"><Sk className="h-7 w-52" /><Sk className="h-3.5 w-36" /></div>
    <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <Sk key={i} className="h-24" />)}</div>
    <Sk className="h-72 w-full" />
    <Sk className="h-64 w-full" />
    <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <Sk key={i} className="h-56" />)}</div>
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: string; icon?: string;
}) => (
  <div className="bg-secondary/60 rounded-xl p-4 space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {icon && <span className="text-base opacity-60">{icon}</span>}
    </div>
    <div className="text-[22px] font-semibold font-mono leading-none" style={{ color: accent }}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
  </div>
);

const Chip = ({ children, variant = "default" }: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success";
}) => {
  const cls = {
    default: "bg-secondary text-muted-foreground",
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  }[variant];
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-mono ${cls}`}>{children}</span>;
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
  peakOccupancyHour,
  peakOccupancyRate,
}: {
  peakHours: NewTablePeakHour[];
  occupancyRate: NewOccupancyRate[];
  peakOccupancyHour?: number;
  peakOccupancyRate?: number;
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [peakMetric, setPeakMetric] = useState<"revenue" | "occupancy">("revenue");

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
        map[o.hour].occupancyRate = normalizePct(o.rate);
        map[o.hour].occupiedCount = o.occupied_count ?? 0;
        map[o.hour].totalCapacity = o.total_capacity ?? 0;
      }
    });
    return map;
  }, [peakHours, occupancyRate]);

  const maxRevenue = Math.max(...Object.values(hourMap).map(h => h.revenue), 1);
  const maxOccupancy = Math.max(...Object.values(hourMap).map(h => h.occupancyRate), 1);

  // Find peak by revenue
  const peakRevenueEntry = Object.entries(hourMap).reduce<{ hour: number; revenue: number }>(
    (best, [h, d]) => d.revenue > best.revenue ? { hour: Number(h), revenue: d.revenue } : best,
    { hour: -1, revenue: 0 }
  );

  // Find peak by occupancy
  const peakOccupancyEntry = Object.entries(hourMap).reduce<{ hour: number; occupancy: number }>(
    (best, [h, d]) => d.occupancyRate > best.occupancy ? { hour: Number(h), occupancy: d.occupancyRate } : best,
    { hour: -1, occupancy: 0 }
  );

  const hoveredData = hoveredHour != null ? hourMap[hoveredHour] : null;
  const activeHours = Object.entries(hourMap).filter(([, d]) => d.revenue > 0 || d.occupancyRate > 0);

  // Determine which peak to show in the callout
  const currentPeakHour = peakMetric === "revenue" 
    ? peakRevenueEntry.hour 
    : (peakOccupancyHour ?? peakOccupancyEntry.hour);
  const currentPeakValue = peakMetric === "revenue"
    ? peakRevenueEntry.revenue
    : (peakOccupancyRate ?? peakOccupancyEntry.occupancy);
  const currentPeakMetricLabel = peakMetric === "revenue" ? "Revenue" : "Occupancy";

  return (
    <div className="space-y-5">

      {/* ── Peak metric selector and callout ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Show peak by:
            </span>
            <div className="flex gap-0.5 bg-secondary p-0.5 rounded-lg">
              <button
                onClick={() => setPeakMetric("revenue")}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                  peakMetric === "revenue" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💰 Revenue
              </button>
              <button
                onClick={() => setPeakMetric("occupancy")}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                  peakMetric === "occupancy" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📊 Occupancy
              </button>
            </div>
          </div>
          {peakOccupancyHour != null && peakOccupancyHour >= 0 && peakMetric === "occupancy" && (
            <Chip variant="accent">Peak occupancy hour from overview</Chip>
          )}
        </div>

        {currentPeakHour >= 0 && currentPeakValue > 0 && (
          <div className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border ${
            peakMetric === "revenue" 
              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
              : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          }`}>
            <span className="text-3xl">{peakMetric === "revenue" ? "💰" : "📊"}</span>
            <div>
              <p className="text-sm font-semibold">
                {peakMetric === "revenue" ? "Highest revenue time" : "Peak occupancy time"}:{" "}
                <span className={peakMetric === "revenue" ? "text-[#d85a30]" : "text-[#1d9e75] "} >
                  {fmtHour(currentPeakHour)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {peakMetric === "revenue" 
                  ? `${fmtRs(currentPeakValue)} revenue · ${fmtNum(hourMap[currentPeakHour].activeTables)} tables active · ${fmtNum(hourMap[currentPeakHour].sessions)} sessions`
                  : `${fmtPct(currentPeakValue)} capacity used · ${hourMap[currentPeakHour].occupiedCount}/${hourMap[currentPeakHour].totalCapacity} tables occupied · ${fmtRs(hourMap[currentPeakHour].revenue)} revenue`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          24-hour activity heatmap — hover a cell to see details
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

      {/* ── 24-hour heatmap grid ── */}
      <div className="space-y-1">
        {/* AM row: hours 0–11 */}
        <div className="flex gap-1 items-end">
          <span className="text-[9px] text-muted-foreground font-mono w-6 shrink-0 text-right">AM</span>
          <div className="grid grid-cols-12 gap-1 flex-1">
            {Array.from({ length: 12 }, (_, h) => {
              const d = hourMap[h];
              const intensity = d.revenue / maxRevenue;
              const isPeakRevenue = h === peakRevenueEntry.hour;
              const isPeakOccupancy = h === (peakOccupancyHour ?? peakOccupancyEntry.hour);
              const isHighlighted = (peakMetric === "revenue" && isPeakRevenue) || (peakMetric === "occupancy" && isPeakOccupancy);
              return (
                <div
                  key={h}
                  className={`rounded-lg cursor-pointer transition-all duration-150 select-none
                    ${isHighlighted ? `ring-2 ring-offset-1 ${peakMetric === "revenue" ? "ring-[#d85a30]" : "ring-[#1d9e75]"}` : ""}
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
            })}
          </div>
        </div>
        {/* PM row: hours 12–23 */}
        <div className="flex gap-1 items-end">
          <span className="text-[9px] text-muted-foreground font-mono w-6 shrink-0 text-right">PM</span>
          <div className="grid grid-cols-12 gap-1 flex-1">
            {Array.from({ length: 12 }, (_, i) => {
              const h = i + 12;
              const d = hourMap[h];
              const intensity = d.revenue / maxRevenue;
              const isPeakRevenue = h === peakRevenueEntry.hour;
              const isPeakOccupancy = h === (peakOccupancyHour ?? peakOccupancyEntry.hour);
              const isHighlighted = (peakMetric === "revenue" && isPeakRevenue) || (peakMetric === "occupancy" && isPeakOccupancy);
              return (
                <div
                  key={h}
                  className={`rounded-lg cursor-pointer transition-all duration-150 select-none
                    ${isHighlighted ? `ring-2 ring-offset-1 ${peakMetric === "revenue" ? "ring-[#d85a30]" : "ring-[#1d9e75]"}` : ""}
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
            })}
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

      {/* ── Hover detail card ── */}
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

      {/* ── Revenue bar chart ── */}
      <div>
        <div className="mb-1">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Revenue per hour
          </p>
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
              <XAxis
                dataKey="hour"
                tickFormatter={fmtHourShort}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtRs}
                width={72}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const h = label as number;
                  const d = hourMap[h];
                  return (
                    <div className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[200px]">
                      <p className="text-xs font-semibold mb-2 font-mono">
                        {fmtHour(h)} – {fmtHour((h + 1) % 24)}
                      </p>
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
                  <Cell
                    key={h}
                    fill={heatColor(hourMap[h].revenue / maxRevenue)}
                    opacity={hoveredHour == null || hoveredHour === h ? 1 : 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Occupancy % per hour — horizontal bar list ── */}
      <div>
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Table occupancy per hour
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Bar width = % of total table capacity that was occupied during that hour
          </p>
        </div>
        <div className="space-y-1.5">
          {activeHours.map(([hStr, d]) => {
            const h = Number(hStr);
            const pct = Math.min(d.occupancyRate, 100);
            const intensity = d.revenue / maxRevenue;
            const isPeakRevenue = h === peakRevenueEntry.hour;
            const isPeakOccupancy = h === (peakOccupancyHour ?? peakOccupancyEntry.hour);
            return (
              <div
                key={h}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 transition-colors
                  ${isPeakRevenue && isPeakOccupancy 
                    ? "bg-amber-50 dark:bg-amber-950/20" 
                    : isPeakRevenue 
                      ? "bg-orange-50 dark:bg-orange-950/20" 
                      : isPeakOccupancy 
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "hover:bg-secondary/40"}`}
              >
                <span className="w-14 text-right text-[11px] font-mono text-muted-foreground shrink-0">
                  {fmtHour(h)}
                </span>
                <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md flex items-center transition-all duration-500"
                    style={{ width: `${pct}%`, background: heatColor(intensity) }}
                  >
                    {pct > 18 && (
                      <span
                        className="text-[9px] font-bold ml-2 font-mono"
                        style={{ color: intensity > 0.55 ? "#fff" : "#1e293b" }}
                      >
                        {fmtPct(pct)} occupied
                      </span>
                    )}
                  </div>
                  {pct <= 18 && pct > 0 && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground"
                      style={{ left: `${pct + 1}%` }}
                    >
                      {fmtPct(pct)}
                    </span>
                  )}
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {d.occupiedCount}/{d.totalCapacity} tbls
                  </span>
                  {isPeakRevenue && isPeakOccupancy && <span className="ml-1 text-[9px] text-amber-600 font-bold">⭐ peak both</span>}
                  {isPeakRevenue && !isPeakOccupancy && <span className="ml-1 text-[9px] text-[#d85a30] font-bold">🔥 rev peak</span>}
                  {isPeakOccupancy && !isPeakRevenue && <span className="ml-1 text-[9px] text-[#1d9e75] font-bold">📊 occ peak</span>}
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
export default function TableReportAndAnalysisDefaultPage() {
  const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
  const [trendMode, setTrendMode] = useState<"total_revenue" | "total_sessions" | "avg_occupancy">("total_revenue");

  const { data, isLoading, isError, error, refetch } = useGetDefaultTableReport();
  const report: NewDefaultTableResponse | undefined = data?.report;

  const trendData = useMemo((): NewTableTrendPoint[] => {
    if (!report) return [];
    const map: Record<TrendType, NewTableTrendPoint[]> = {
      daily: report.daily_trend ?? [],
      weekly: report.weekly_trend ?? [],
      monthly: report.monthly_trend ?? [],
      yearly: report.yearly_trend ?? [],
    };
    return map[trendFilter] ?? [];
  }, [trendFilter, report]);

  /**
   * Normalize trend occupancy values so the area chart Y-axis always shows 0–100%.
   * The backend may send avg_occupancy as 0–1 decimal or 0–100; we unify here.
   */
  const normalizedTrendData = useMemo(
    () =>
      trendData.map(pt => ({
        ...pt,
        avg_occupancy: normalizePct(pt.avg_occupancy),
      })),
    [trendData]
  );

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex gap-4">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-medium text-destructive mb-1">Failed to load table data</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message ?? "Unknown error"}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (!report) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-muted rounded-xl p-6 text-center">
        <p className="font-medium mb-2">No table data available</p>
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
      usage_percent: normalizePct(t.usage_percent),
      fill: COLORS[i % COLORS.length],
    }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Table analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Last 30 days · Nepalese Rupee (NPR)</p>
        </div>
        <div className="flex gap-2">
          {ov?.peak_occupancy_hour != null && ov.peak_occupancy_hour >= 0 && (
            <div className="text-xs font-semibold font-mono px-3 py-1.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800">
              📊 Peak occupancy: {fmtHour(ov.peak_occupancy_hour)} — {fmtPct(ov.peak_occupancy_rate)}
            </div>
          )}
          {(() => {
            // Calculate peak revenue hour from data
            const peakRevenueHour = [...(report.peak_hours ?? [])].reduce(
              (best, h) => (h.total_revenue ?? 0) > best.revenue ? { hour: h.hour, revenue: h.total_revenue ?? 0 } : best,
              { hour: -1, revenue: 0 }
            );
            if (peakRevenueHour.hour >= 0 && peakRevenueHour.revenue > 0) {
              return (
                <div className="text-xs font-semibold font-mono px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  💰 Peak revenue: {fmtHour(peakRevenueHour.hour)} — {fmtRs(peakRevenueHour.revenue)}
                </div>
              );
            }
            return null;
          })()}
        </div>
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
      <div className="bg-background border border-border rounded-xl p-5">
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
            <div key={l} className="bg-secondary/60 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-semibold font-mono">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      {/* ── Trend Chart ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Table trend over time</span>
            <Chip variant="accent">{trendFilter}</Chip>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {([
                { key: "total_revenue" as const, label: "Revenue" },
                { key: "total_sessions" as const, label: "Sessions" },
                { key: "avg_occupancy" as const, label: "Occupancy %" },
              ]).map(m => (
                <button key={m.key} onClick={() => setTrendMode(m.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${trendMode === m.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(f => (
                <button key={f} onClick={() => setTrendFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${trendFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
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
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"
                      stopColor={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                      stopOpacity={0.25} />
                    <stop offset="95%"
                      stopColor={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                      stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
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
                <Area
                  type="monotone"
                  dataKey={trendMode}
                  stroke={trendMode === "total_revenue" ? COLORS[0] : trendMode === "total_sessions" ? COLORS[1] : COLORS[2]}
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Peak Hour Heatmap ── */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Hourly activity &amp; table occupancy
          </span>
          <Chip variant="accent">When is the restaurant busiest?</Chip>
        </div>
        {!report.peak_hours?.length && !report.occupancy_rate?.length
          ? <Empty />
          : <PeakHourHeatmap 
              peakHours={report.peak_hours ?? []} 
              occupancyRate={report.occupancy_rate ?? []}
              peakOccupancyHour={ov?.peak_occupancy_hour}
              peakOccupancyRate={ov?.peak_occupancy_rate}
            />
        }
      </div>

      {/* ── Top Tables + Revenue Share ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-background border border-border rounded-xl p-5">
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
                          cap {t.capacity ?? "—"} · {fmtNum(t.total_sessions)} sessions · avg {fmtMin(t.avg_session_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono">{fmtPct(t.occupancy_rate)}</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: COLORS[i % COLORS.length] }}>
                          {fmtRs(t.total_revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${maxRev ? ((t.total_revenue ?? 0) / maxRev) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
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
        <div className="bg-background border border-border rounded-xl p-5">
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
                  <tr key={t.table_number} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-mono font-medium">#{t.table_number}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-muted-foreground">{fmtNum(t.capacity)}</td>
                    <td className="py-2.5 pr-4 font-mono">{fmtNum(t.total_sessions)}</td>
                    <td className="py-2.5 pr-4 font-mono">{safeHours(t.total_hours_used).toFixed(1)}h</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-[#d85a30]">{fmtRs(t.total_revenue)}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
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