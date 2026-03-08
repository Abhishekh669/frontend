// components/table/bulk-create-tables.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { CreateTable } from "@/utils/types/table.types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCreateTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-create-table";
import { useQueryClient } from "@tanstack/react-query";

// Define a type for form state with string values
type TableFormState = {
  table_number: string;
  capacity: string;
  status: "empty" | "occupied" | "booked";
};

// Schema for a single table with string validation
const tableSchema = z.object({
  table_number: z.string()
    .min(1, "Table number is required")
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Table number must be a valid number",
    })
    .refine((val) => parseInt(val) >= 1, {
      message: "Table number must be at least 1",
    })
    .refine((val) => parseInt(val) <= 999, {
      message: "Table number cannot exceed 999",
    }),
  capacity: z.string()
    .min(1, "Capacity is required")
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Capacity must be a valid number",
    })
    .refine((val) => parseInt(val) >= 1, {
      message: "Capacity must be at least 1",
    })
    .refine((val) => parseInt(val) <= 20, {
      message: "Capacity cannot exceed 20",
    }),
  status: z.enum(["empty", "occupied", "booked"]),
});

// Schema for the entire form
const formSchema = z.object({
  tables: z.array(tableSchema)
    .min(1, "At least one table is required")
    .max(50, "Cannot create more than 50 tables at once")
    .refine(
      (tables) => {
        // Check for duplicate table numbers
        const tableNumbers = tables.map(t => parseInt(t.table_number));
        return new Set(tableNumbers).size === tableNumbers.length;
      },
      {
        message: "Duplicate table numbers are not allowed",
      }
    ),
});

type FormValues = {
  tables: TableFormState[];
};

interface BulkCreateTablesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCreateTables({ open, onOpenChange, onSuccess }: BulkCreateTablesProps) {
  const [tables, setTables] = useState<TableFormState[]>([
    { table_number: "1", capacity: "4", status: "empty" }
  ]);
    const queryClient = useQueryClient();

  const createBulkTables = useCreateTable();

  const addTable = () => {
    // Find the highest table number and convert to number for calculation
    const highestNumber = tables.length > 0 
      ? Math.max(...tables.map(t => parseInt(t.table_number) || 0)) 
      : 0;
    const nextNumber = highestNumber + 1;
    
    setTables([...tables, { 
      table_number: nextNumber.toString(), 
      capacity: "4",
      status: "empty" 
    }]);
  };

  const removeTable = (index: number) => {
    if (tables.length <= 1) return;
    const newTables = tables.filter((_, i) => i !== index);
    setTables(newTables);
  };

  const updateTable = (
    index: number, 
    field: keyof TableFormState, 
    value: string
  ) => {
    const newTables = [...tables];
    newTables[index] = { 
      ...newTables[index], 
      [field]: value 
    };
    setTables(newTables);
  };

  const handleBulkAction = (action: 'fill' | 'clear' | 'increment') => {
    if (action === 'fill') {
      // Reset to sequential numbers starting from 1
      const newTables = tables.map((_, index) => ({
        table_number: (index + 1).toString(),
        capacity: "4",
        status: "empty" as const
      }));
      setTables(newTables);
    } else if (action === 'clear') {
      setTables([{ table_number: "1", capacity: "4", status: "empty" }]);
    } else if (action === 'increment') {
      const newTables = [...tables];
      const lastNumber = Math.max(...tables.map(t => parseInt(t.table_number) || 0));
      for (let i = 1; i <= 5; i++) {
        newTables.push({
          table_number: (lastNumber + i).toString(),
          capacity: "4",
          status: "empty"
        });
      }
      setTables(newTables.slice(0, 50)); // Cap at 50
    }
  };

  const validateAndConvertToCreateTable = (formTables: TableFormState[]): CreateTable[] => {
    return formTables.map(table => ({
      table_number: parseInt(table.table_number),
      capacity: parseInt(table.capacity),
      status: table.status
    }));
  };

  const onSubmit = async () => {
    try {
      // Validate all tables have valid numbers
      const hasInvalidTables = tables.some(
        t => isNaN(parseInt(t.table_number)) || 
             isNaN(parseInt(t.capacity)) ||
             parseInt(t.table_number) < 1 || 
             parseInt(t.capacity) < 1
      );

      if (hasInvalidTables) {
        // You might want to show a toast error here
        console.error("Invalid table data");
        return;
      }

      const createTablesData = validateAndConvertToCreateTable(tables);
      await createBulkTables.mutateAsync(createTablesData);
       queryClient.invalidateQueries({queryKey : ['get-tables']})
      onSuccess?.();
      setTables([{ table_number: "1", capacity: "4", status: "empty" }]); // Reset form
    } catch (error) {
      console.error("Failed to create tables:", error);
    }
  };

  // Check for duplicate table numbers (as numbers for comparison)
  const tableNumbers = tables.map(t => parseInt(t.table_number)).filter(n => !isNaN(n));
  const hasDuplicates = new Set(tableNumbers).size !== tableNumbers.length;
  
  // Get duplicate numbers for display
  const duplicateValues = tableNumbers.filter((num, index) => 
    tableNumbers.indexOf(num) !== index
  );
  const duplicateNumbers = [...new Set(duplicateValues)];

  // Check if any tables have invalid data
  const hasInvalidData = tables.some(
    t => isNaN(parseInt(t.table_number)) || 
         isNaN(parseInt(t.capacity)) ||
         parseInt(t.table_number) < 1 || 
         parseInt(t.capacity) < 1 ||
         parseInt(t.table_number) > 999 ||
         parseInt(t.capacity) > 20
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl">Create Multiple Tables</DialogTitle>
          <DialogDescription>
            Add multiple tables at once. Each table will be created with the specified status.
          </DialogDescription>
        </DialogHeader>

        {/* Fixed Header Section - Bulk Actions */}
        <div className="px-6 py-2 border-b shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium mr-2">Bulk Actions:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleBulkAction('fill')}
            >
              Reset Sequence
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleBulkAction('increment')}
            >
              Add 5 More
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleBulkAction('clear')}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Duplicate Warning */}
        {hasDuplicates && (
          <div className="px-6 py-2 shrink-0">
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Duplicate table numbers found: {duplicateNumbers.join(', ')}. 
                Please ensure all table numbers are unique.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Invalid Data Warning */}
        {hasInvalidData && (
          <div className="px-6 py-2 shrink-0">
            <Alert variant={"default"} className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Some tables have invalid data. Please check table numbers (1-999) and capacity (1-20).
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Scrollable Tables List */}
        <div className="flex-1 min-h-0 px-6 py-4">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-3">
              {tables.map((table, index) => {
                // Validate individual field for styling
                const tableNumberValid = !isNaN(parseInt(table.table_number)) && 
                  parseInt(table.table_number) >= 1 && 
                  parseInt(table.table_number) <= 999;
                const capacityValid = !isNaN(parseInt(table.capacity)) && 
                  parseInt(table.capacity) >= 1 && 
                  parseInt(table.capacity) <= 20;

                return (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Table Number */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Table Number
                        </label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={table.table_number}
                          onChange={(e) => {
                            // Allow only numbers
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updateTable(index, 'table_number', value);
                          }}
                          className={`mt-1 ${!tableNumberValid && table.table_number !== '' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          placeholder="Enter number"
                        />
                        {/* {!tableNumberValid && table.table_number !== '' && (
                          <p className="text-xs text-destructive mt-1">
                            Must be between 1-999
                          </p>
                        )} */}
                      </div>

                      {/* Capacity */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Capacity
                        </label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={table.capacity}
                          onChange={(e) => {
                            // Allow only numbers
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updateTable(index, 'capacity', value);
                          }}
                          className={`mt-1 ${!capacityValid && table.capacity !== '' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          placeholder="Enter capacity"
                        />
                        {!capacityValid && table.capacity !== '' && (
                          <p className="text-xs text-destructive mt-1">
                            Must be between 1-20
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Initial Status
                        </label>
                        <Select
                          value={table.status}
                          onValueChange={(value: "empty" | "occupied" | "booked") => 
                            updateTable(index, 'status', value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="empty">Empty</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Table Index Badge */}
                    <Badge variant="outline" className="mt-6 shrink-0">
                      #{index + 1}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTable(index)}
                      disabled={tables.length <= 1}
                      className="mt-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Bottom Sections */}
        <div className="shrink-0">
          {/* Add More Button */}
          <div className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={addTable}
              className="w-full gap-2"
              disabled={tables.length >= 50}
            >
              <Plus className="h-4 w-4" />
              Add Another Table ({tables.length}/50)
            </Button>
          </div>

          {/* Summary Section */}
          <div className="px-6 py-4 bg-muted/30 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background p-3 rounded-lg">
                <p className="text-xs text-muted-foreground truncate">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <div className="bg-background p-3 rounded-lg">
                <p className="text-xs text-muted-foreground truncate">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {tables.reduce((sum, t) => {
                    const cap = parseInt(t.capacity);
                    return sum + (isNaN(cap) ? 0 : cap);
                  }, 0)}
                </p>
              </div>
              <div className="bg-background p-3 rounded-lg">
                <p className="text-xs text-muted-foreground truncate">Avg Capacity</p>
                <p className="text-2xl font-bold">
                  {Math.round(tables.reduce((sum, t) => {
                    const cap = parseInt(t.capacity);
                    return sum + (isNaN(cap) ? 0 : cap);
                  }, 0) / tables.length) || 0}
                </p>
              </div>
              <div className="bg-background p-3 rounded-lg col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground truncate">Status Summary</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="bg-green-50 text-black text-xs px-2 py-0.5">
                    E:{tables.filter(t => t.status === 'empty').length}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-black text-xs px-2 py-0.5">
                    O:{tables.filter(t => t.status === 'occupied').length}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-black text-xs px-2 py-0.5">
                    B:{tables.filter(t => t.status === 'booked').length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={onSubmit}
              disabled={createBulkTables.isPending || tables.length === 0 || hasDuplicates || hasInvalidData}
              className="min-w-[120px]"
            >
              {createBulkTables.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                `Create ${tables.length} Table${tables.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}