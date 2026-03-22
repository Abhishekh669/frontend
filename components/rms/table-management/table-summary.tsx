// components/table/table-summary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableType } from "@/utils/types/table.types";
import { Users, LayoutGrid, Clock, Armchair } from "lucide-react";

interface TableSummaryProps {
  tables: TableType[];
}

export function TableSummary({ tables }: TableSummaryProps) {
  const totalTables = tables.length;
  const emptyTables = tables.filter(t => t.status === 'empty').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const bookedTables = tables.filter(t => t.status === 'booked').length;
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
  const averageCapacity = totalTables > 0 ? Math.round(totalCapacity / totalTables) : 0;

  const summaryCards = [
    {
      title: "Total Tables",
      value: totalTables,
      icon: LayoutGrid,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
      description: "All tables in restaurant",
      accent: "from-blue-500/10",
    },
    {
      title: "Available Now",
      value: emptyTables,
      icon: Users,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      description: `${emptyTables} tables ready for service`,
      accent: "from-emerald-500/10",
    },
    {
      title: "Occupied",
      value: occupiedTables,
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
      description: `${occupiedTables} currently in use`,
      accent: "from-amber-500/10",
    },
    {
      title: "Total Capacity",
      value: totalCapacity,
      icon: Armchair,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
      description: `Avg ${averageCapacity} seats per table`,
      accent: "from-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="group relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            {/* Corner radial glow */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.accent} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />
            {/* Top accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-start justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {card.title}
              </p>
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="relative">
              <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}