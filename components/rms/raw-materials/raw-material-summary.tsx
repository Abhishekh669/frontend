"use client";

import React from "react";
import CountUp from "react-countup";
import { Package, Layers, DollarSign, TrendingUp } from "lucide-react";

interface RawMaterialSummaryProps {
  total_materials?: number;
  total_quantity?: number;
  total_price?: number;
  recent_price?: number;
}

const statConfig = [
  {
    title: "Total Materials",
    key: "total_materials" as const,
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    prefix: "",
  },
  {
    title: "Total Quantity",
    key: "total_quantity" as const,
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    prefix: "",
  },
  {
    title: "Total Value",
    key: "total_price" as const,
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    prefix: "Rs ",
  },
  {
    title: "Recent Price",
    key: "recent_price" as const,
    icon: TrendingUp,
    color: "text-violet-500",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    prefix: "Rs ",
  },
];

const RawMaterialSummary: React.FC<RawMaterialSummaryProps> = ({
  total_materials = 0,
  total_quantity = 0,
  total_price = 0,
  recent_price = 0,
}) => {
  const values = { total_materials, total_quantity, total_price, recent_price };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className="relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
          >
            {/* Corner radial glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[radial-gradient(circle,var(--color-accent)/8%,transparent_70%)] pointer-events-none" />
            {/* Top accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
              {stat.title}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {stat.prefix}
              <CountUp
                end={values[stat.key]}
                duration={1.5}
                separator=","
                decimals={stat.prefix ? 2 : 0}
                enableScrollSpy
                scrollSpyOnce
              />
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default RawMaterialSummary;