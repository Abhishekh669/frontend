// components/table/table-card.tsx
import { useState } from "react";
import { TableType } from "@/utils/types/table.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Users, MoreHorizontal, QrCode, Trash2, Hash, CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EditTableDialog } from "./edit-table-dialog";
import { DeleteTableDialog } from "./delete-table-dialog";

interface TableCardProps {
  table: TableType;
  selected?: boolean;
  onSelect?: (tableId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

const statusConfig = {
  empty: {
    label: "Available",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    glow: "from-emerald-500/8",
    bar: "bg-emerald-500",
    capacityFill: "bg-emerald-500/20",
  },
  occupied: {
    label: "Occupied",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    glow: "from-amber-500/8",
    bar: "bg-amber-500",
    capacityFill: "bg-amber-500/20",
  },
  booked: {
    label: "Booked",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    glow: "from-blue-500/8",
    bar: "bg-blue-500",
    capacityFill: "bg-blue-500/20",
  },
};

function CapacityDots({ capacity, status }: { capacity: number; status: keyof typeof statusConfig }) {
  const show = Math.min(capacity, 8);
  const { capacityFill } = statusConfig[status];
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: show }).map((_, i) => (
        <span key={i} className={cn("w-2 h-2 rounded-full border border-border", capacityFill)} />
      ))}
      {capacity > 8 && (
        <span className="text-[10px] text-muted-foreground font-medium ml-0.5">+{capacity - 8}</span>
      )}
    </div>
  );
}

export function TableCard({ table, selected, onSelect, selectionMode }: TableCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const status = statusConfig[table.status];
  const addedDate = new Date(table.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div
        className={cn(
          "group relative rounded-2xl border bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-default",
          selected
            ? "border-accent/50 ring-1 ring-accent/30 shadow-md"
            : "border-border hover:border-border/80"
        )}
      >
        {/* Colored top bar */}
        <div className={cn("h-0.5 w-full", status.bar)} />

        {/* Status glow — top right */}
        <div
          className={cn(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br to-transparent opacity-50 pointer-events-none",
            status.glow
          )}
        />

        {/* Main content */}
        <div className="relative px-4 pt-4 pb-3 flex-1">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              {selectionMode && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => onSelect?.(table.id, checked as boolean)}
                  className="mt-0.5 shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-foreground leading-none">
                    {table.table_number}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 ml-[30px]">Table</p>
              </div>
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border",
                status.badge
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
              {status.label}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60 mb-3" />

          {/* Capacity row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-foreground">
                {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
              </span>
            </div>
            <CapacityDots capacity={table.capacity} status={table.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>Added {addedDate}</span>
            <span className="mx-1 opacity-40">·</span>
            <span className="font-mono opacity-60">{table.id.slice(0, 7)}…</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-border/60 bg-muted/20 px-3 py-2 flex items-center justify-between">
          <button className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1.5 rounded-lg transition-colors">
            <QrCode className="h-3 w-3" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          <div className="flex items-center gap-0.5">
            {selectionMode && (
              <button
                onClick={() => setShowDelete(true)}
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-44">
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Table Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEdit(true)} className="rounded-lg text-xs gap-2">
                  <Edit className="h-3.5 w-3.5" />
                  Edit Table
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDelete(true)}
                  className="rounded-lg text-xs gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <EditTableDialog open={showEdit} onOpenChange={setShowEdit} table={table} />
      <DeleteTableDialog open={showDelete} onOpenChange={setShowDelete} table={table} />
    </>
  );
}