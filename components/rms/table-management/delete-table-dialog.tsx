// components/table/delete-table-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableType } from "@/utils/types/table.types";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useDeleteTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-delete-table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables?: TableType[];
  table?: TableType;
  onSuccess?: () => void;
}

const statusDot: Record<string, string> = {
  empty: "bg-emerald-500",
  occupied: "bg-amber-500",
  booked: "bg-blue-500",
};

export function DeleteTableDialog({
  open,
  onOpenChange,
  tables,
  table,
  onSuccess,
}: DeleteTableDialogProps) {
  const deleteTables = useDeleteTable();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const isMultiMode = tables && tables.length > 0;
  const displayTables = isMultiMode ? tables : table ? [table] : [];

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [open]);

  useEffect(() => {
    if (isMultiMode && displayTables.length > 0) {
      setSelectAll(selectedIds.length === displayTables.length);
    }
  }, [selectedIds, displayTables.length, isMultiMode]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? displayTables.map((t) => t.id) : []);
  };

  const handleSelectTable = (tableId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, tableId] : prev.filter((id) => id !== tableId)
    );
  };

  const handleDelete = async () => {
    try {
      const idsToDelete = isMultiMode ? selectedIds : table ? [table.id] : [];
      if (idsToDelete.length === 0) {
        toast.error("No tables selected");
        return;
      }
      await deleteTables.mutateAsync(idsToDelete);
      toast.success(
        isMultiMode
          ? `${idsToDelete.length} table${idsToDelete.length !== 1 ? "s" : ""} deleted`
          : `Table ${table?.table_number} deleted`
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to delete tables:", error);
      toast.error(error?.message || "Failed to delete tables");
    }
  };

  if (displayTables.length === 0) return null;

  const isPending = deleteTables.isPending;
  const selectedCapacity = displayTables
    .filter((t) => selectedIds.includes(t.id))
    .reduce((sum, t) => sum + t.capacity, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        {/* Header */}
        <AlertDialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          <AlertDialogTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </div>
            {isMultiMode ? "Delete Multiple Tables" : "Delete Table"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            {isMultiMode
              ? selectedIds.length === 0
                ? "Select the tables you want to permanently delete."
                : `Deleting ${selectedIds.length} of ${displayTables.length} tables. This cannot be undone.`
              : `Permanently delete Table ${table?.table_number} (${table?.capacity} seats). This cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {isMultiMode && (
            <>
              {/* Select all */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(c) => handleSelectAll(c as boolean)}
                    disabled={isPending}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-xs font-medium text-foreground cursor-pointer"
                  >
                    Select all ({displayTables.length} tables)
                  </label>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                  {selectedIds.length} selected
                </span>
              </div>

              {/* Table list */}
              <ScrollArea className="h-[180px] pr-2">
                <div className="space-y-2">
                  {displayTables.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border transition-colors",
                        selectedIds.includes(t.id)
                          ? "bg-destructive/5 border-destructive/20"
                          : "bg-muted/20 hover:bg-muted/40",
                        isPending && "opacity-50"
                      )}
                    >
                      <Checkbox
                        id={`table-${t.id}`}
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={(c) => handleSelectTable(t.id, c as boolean)}
                        disabled={isPending}
                      />
                      <label
                        htmlFor={`table-${t.id}`}
                        className="flex-1 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            Table {t.table_number}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            · {t.capacity} seats
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusDot[t.status])} />
                          {t.status}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Summary */}
              {selectedIds.length > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-destructive font-medium">
                    {selectedIds.length} table{selectedIds.length !== 1 ? "s" : ""} will be removed
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedCapacity} seats total
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <AlertDialogFooter className="px-6 pb-6 flex justify-end gap-2 pt-4 border-t border-border">
          <AlertDialogCancel
            onClick={() => {
              setSelectedIds([]);
              setSelectAll(false);
            }}
            disabled={isPending}
            className="h-9 rounded-xl text-xs border-border"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={(isMultiMode ? selectedIds.length === 0 : false) || isPending}
            className="h-9 rounded-xl text-xs min-w-[110px] bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </span>
            ) : isMultiMode ? (
              `Delete ${selectedIds.length} Table${selectedIds.length !== 1 ? "s" : ""}`
            ) : (
              "Delete Table"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}