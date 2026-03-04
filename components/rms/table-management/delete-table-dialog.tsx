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
import { Badge } from "@/components/ui/badge";
import { TableType } from "@/utils/types/table.types";
import { useState, useEffect } from "react";
import { Table, Loader2 } from "lucide-react";
import { useDeleteTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-delete-table";
import { toast } from "sonner";

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables?: TableType[]; // Make optional for backward compatibility
  table?: TableType; // Keep for single table deletion
  onSuccess?: () => void;
}

export function DeleteTableDialog({ 
  open, 
  onOpenChange, 
  tables, 
  table,
  onSuccess 
}: DeleteTableDialogProps) {
  const deleteTables = useDeleteTable();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Determine if we're in multi-select mode
  const isMultiMode = tables && tables.length > 0;
  
  // Get the tables to display
  const displayTables = isMultiMode ? tables : (table ? [table] : []);
  
  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [open]);

  // Update selectAll when selectedIds changes
  useEffect(() => {
    if (isMultiMode && displayTables.length > 0) {
      setSelectAll(selectedIds.length === displayTables.length);
    }
  }, [selectedIds, displayTables.length, isMultiMode]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayTables.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectTable = (tableId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, tableId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== tableId));
    }
  };

  const handleDelete = async () => {
    try {
      const idsToDelete = isMultiMode ? selectedIds : (table ? [table.id] : []);
      
      if (idsToDelete.length === 0) {
        toast.error("No tables selected");
        return;
      }

      await deleteTables.mutateAsync(idsToDelete);
      
      toast.success(
        isMultiMode 
          ? `${idsToDelete.length} table${idsToDelete.length !== 1 ? 's' : ''} deleted successfully`
          : `Table ${table?.table_number} deleted successfully`
      );
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to delete tables:", error);
      toast.error(error?.message || "Failed to delete tables");
    }
  };

  // If no tables to display
  if (displayTables.length === 0) {
    return null;
  }

  const isPending = deleteTables.isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {isMultiMode ? 'Delete Multiple Tables' : 'Delete Table'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isMultiMode ? (
              selectedIds.length === 0 ? (
                "Select the tables you want to delete. This action cannot be undone."
              ) : (
                `You are about to delete ${selectedIds.length} out of ${displayTables.length} tables. This action cannot be undone.`
              )
            ) : (
              <>
                This will permanently delete Table {table?.table_number} with capacity of {table?.capacity} seats.
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isMultiMode && (
          <div className="py-4">
            {/* Select All Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  disabled={isPending}
                />
                <label 
                  htmlFor="select-all" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All ({displayTables.length} tables)
                </label>
              </div>
              <Badge variant={selectedIds.length > 0 ? "default" : "outline"}>
                {selectedIds.length} selected
              </Badge>
            </div>

            {/* Tables List */}
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {displayTables.map((t) => (
                  <div 
                    key={t.id} 
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      isPending ? 'opacity-50' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox 
                      id={`table-${t.id}`}
                      checked={selectedIds.includes(t.id)}
                      onCheckedChange={(checked) => handleSelectTable(t.id, checked as boolean)}
                      disabled={isPending}
                    />
                    <label 
                      htmlFor={`table-${t.id}`}
                      className="flex-1 flex items-center justify-between text-sm cursor-pointer"
                    >
                      <div>
                        <span className="font-medium">Table {t.table_number}</span>
                        <span className="text-muted-foreground ml-2">
                          (Capacity: {t.capacity})
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {t.status}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Summary */}
            {selectedIds.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Summary:</span> Deleting {selectedIds.length} table(s) with total capacity of{' '}
                  {displayTables
                    .filter(t => selectedIds.includes(t.id))
                    .reduce((sum, t) => sum + t.capacity, 0)} seats
                </p>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setSelectedIds([]);
              setSelectAll(false);
            }}
            disabled={isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={
              (isMultiMode ? selectedIds.length === 0 : false) || 
              isPending
            }
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              isMultiMode 
                ? `Delete ${selectedIds.length} Table${selectedIds.length !== 1 ? 's' : ''}`
                : "Delete Table"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}