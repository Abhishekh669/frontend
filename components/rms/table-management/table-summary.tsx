// components/table/table-summary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableType } from "@/utils/types/table.types";
import { Users, Table, Clock, AlertCircle } from "lucide-react";

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
      icon: Table,
      color: "bg-blue-500",
      description: "All tables in restaurant"
    },
    {
      title: "Available Now",
      value: emptyTables,
      icon: Users,
      color: "bg-green-500",
      description: `${emptyTables} tables ready for service`
    },
    {
      title: "Occupied",
      value: occupiedTables,
      icon: Clock,
      color: "bg-orange-500",
      description: `${occupiedTables} tables currently in use`
    },
    {
      title: "Total Capacity",
      value: totalCapacity,
      icon: Users,
      color: "bg-purple-500",
      description: `Avg ${averageCapacity} seats per table`
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.color} p-2 rounded-lg text-white`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}