// components/table/bulk-create-tables.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, LayoutGrid } from "lucide-react";
import { CreateTable } from "@/utils/types/table.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-create-table";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type TableFormState = {
  table_number: string;
  capacity: string;
  status: "empty" | "occupied" | "booked";
};

interface BulkCreateTablesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCreateTables({ open, onOpenChange, onSuccess }: BulkCreateTablesProps) {
  const [tables, setTables] = useState<TableFormState[]>([
    { table_number: "1", capacity: "4", status: "empty" },
  ]);
  const queryClient = useQueryClient();
  const createBulkTables = useCreateTable();

  const addTable = () => {
    const highestNumber =
      tables.length > 0
        ? Math.max(...tables.map((t) => parseInt(t.table_number) || 0))
        : 0;
    setTables([
      ...tables,
      { table_number: (highestNumber + 1).toString(), capacity: "4", status: "empty" },
    ]);
  };

  const removeTable = (index: number) => {
    if (tables.length <= 1) return;
    setTables(tables.filter((_, i) => i !== index));
  };

  const updateTable = (index: number, field: keyof TableFormState, value: string) => {
    const newTables = [...tables];
    newTables[index] = { ...newTables[index], [field]: value };
    setTables(newTables);
  };

  const handleBulkAction = (action: "fill" | "clear" | "increment") => {
    if (action === "fill") {
      setTables(
        tables.map((_, i) => ({
          table_number: (i + 1).toString(),
          capacity: "4",
          status: "empty" as const,
        }))
      );
    } else if (action === "clear") {
      setTables([{ table_number: "1", capacity: "4", status: "empty" }]);
    } else if (action === "increment") {
      const lastNumber = Math.max(...tables.map((t) => parseInt(t.table_number) || 0));
      const extras = Array.from({ length: 5 }, (_, i) => ({
        table_number: (lastNumber + i + 1).toString(),
        capacity: "4",
        status: "empty" as const,
      }));
      setTables([...tables, ...extras].slice(0, 50));
    }
  };

  const tableNumbers = tables.map((t) => parseInt(t.table_number)).filter((n) => !isNaN(n));
  const hasDuplicates = new Set(tableNumbers).size !== tableNumbers.length;
  const duplicateNumbers = [
    ...new Set(tableNumbers.filter((num, i) => tableNumbers.indexOf(num) !== i)),
  ];

  const hasInvalidData = tables.some(
    (t) =>
      isNaN(parseInt(t.table_number)) ||
      isNaN(parseInt(t.capacity)) ||
      parseInt(t.table_number) < 1 ||
      parseInt(t.capacity) < 1 ||
      parseInt(t.table_number) > 999 ||
      parseInt(t.capacity) > 20
  );

  const onSubmit = async () => {
    try {
      if (hasInvalidData) return;
      const createTablesData: CreateTable[] = tables.map((t) => ({
        table_number: parseInt(t.table_number),
        capacity: parseInt(t.capacity),
        status: t.status,
      }));
      await createBulkTables.mutateAsync(createTablesData);
      queryClient.invalidateQueries({ queryKey: ["get-tables"] });
      onSuccess?.();
      setTables([{ table_number: "1", capacity: "4", status: "empty" }]);
    } catch (error) {
      console.error("Failed to create tables:", error);
    }
  };

  const totalCapacity = tables.reduce((sum, t) => {
    const cap = parseInt(t.capacity);
    return sum + (isNaN(cap) ? 0 : cap);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border shrink-0">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <LayoutGrid className="h-3.5 w-3.5 text-accent" />
                </div>
                Bulk Create Tables
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Create up to 50 tables at once. Each table requires a unique number.
              </DialogDescription>
            </div>
            {/* Quick action buttons */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
              {[
                { action: "fill" as const, label: "Reset" },
                { action: "increment" as const, label: "+5" },
                { action: "clear" as const, label: "Clear" },
              ].map(({ action, label }) => (
                <button
                  key={action}
                  onClick={() => handleBulkAction(action)}
                  className="px-3 h-7 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Alerts */}
        {hasDuplicates && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">
                Duplicate table numbers: {duplicateNumbers.join(", ")}. Each table must have a unique number.
              </p>
            </div>
          </div>
        )}

        {hasInvalidData && !hasDuplicates && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Some entries are invalid. Table numbers must be 1–999, capacity must be 1–20.
              </p>
            </div>
          </div>
        )}

        {/* Table rows */}
        <div className="flex-1 min-h-0 px-6 py-4">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-3 mb-2 px-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-7">#</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Table No.</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Capacity</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</span>
            <span className="w-7" />
          </div>

          <ScrollArea className="h-full pr-3">
            <div className="space-y-2">
              {tables.map((table, index) => {
                const tableNumberValid =
                  !isNaN(parseInt(table.table_number)) &&
                  parseInt(table.table_number) >= 1 &&
                  parseInt(table.table_number) <= 999;
                const capacityValid =
                  !isNaN(parseInt(table.capacity)) &&
                  parseInt(table.capacity) >= 1 &&
                  parseInt(table.capacity) <= 20;
                const isDuplicate =
                  tableNumbers.filter((n) => n === parseInt(table.table_number)).length > 1;

                return (
                  <div
                    key={index}
                    className={cn(
                      "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 rounded-xl border transition-colors",
                      isDuplicate
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    {/* Index */}
                    <span className="w-7 text-[11px] font-semibold text-muted-foreground text-center">
                      {index + 1}
                    </span>

                    {/* Table number */}
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={table.table_number}
                      onChange={(e) =>
                        updateTable(index, "table_number", e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="No."
                      className={cn(
                        "h-9 text-sm bg-background/80 rounded-xl border-border focus:bg-background transition-colors",
                        (!tableNumberValid && table.table_number !== "") || isDuplicate
                          ? "border-destructive"
                          : ""
                      )}
                    />

                    {/* Capacity */}
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={table.capacity}
                      onChange={(e) =>
                        updateTable(index, "capacity", e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="Seats"
                      className={cn(
                        "h-9 text-sm bg-background/80 rounded-xl border-border focus:bg-background transition-colors",
                        !capacityValid && table.capacity !== "" ? "border-destructive" : ""
                      )}
                    />

                    {/* Status */}
                    <Select
                      value={table.status}
                      onValueChange={(val: "empty" | "occupied" | "booked") =>
                        updateTable(index, "status", val)
                      }
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border bg-background/80 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="empty" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Empty
                          </div>
                        </SelectItem>
                        <SelectItem value="occupied" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Occupied
                          </div>
                        </SelectItem>
                        <SelectItem value="booked" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Booked
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Remove */}
                    <button
                      onClick={() => removeTable(index)}
                      disabled={tables.length <= 1}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Add row button */}
        <div className="px-6 py-3 border-t border-border shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={addTable}
            className="w-full h-9 rounded-xl text-xs border-dashed border-border gap-2 text-muted-foreground hover:text-foreground"
            disabled={tables.length >= 50}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Another Table ({tables.length}/50)
          </Button>
        </div>

        {/* Summary strip */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border shrink-0">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Tables", value: tables.length },
              { label: "Total Capacity", value: totalCapacity },
              {
                label: "Avg Capacity",
                value: Math.round(totalCapacity / tables.length) || 0,
              },
              { label: "Status Mix", value: null },
            ].map((stat, i) =>
              stat.value !== null ? (
                <div key={i} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl font-bold tracking-tight mt-0.5">{stat.value}</p>
                </div>
              ) : (
                <div key={i} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground truncate">Status Mix</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {tables.filter((t) => t.status === "empty").length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {tables.filter((t) => t.status === "occupied").length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {tables.filter((t) => t.status === "booked").length}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2 pt-4 border-t border-border shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl text-xs border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              createBulkTables.isPending ||
              tables.length === 0 ||
              hasDuplicates ||
              hasInvalidData
            }
            className="h-9 rounded-xl text-xs min-w-[130px]"
          >
            {createBulkTables.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              `Create ${tables.length} Table${tables.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}