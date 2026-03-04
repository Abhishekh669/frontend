// components/table/edit-table-dialog.tsx
import { useState, useEffect } from "react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { TableType } from "@/utils/types/table.types";
import { useUpdateTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-update-table";

// Schema for form with string values
const formSchema = z.object({
  table_number: z.string()
    .min(1, "Table number is required")
    .refine((val) => /^\d+$/.test(val), {
      message: "Table number must contain only numbers",
    })
    .refine((val) => {
      const num = parseInt(val);
      return num >= 1 && num <= 999;
    }, {
      message: "Table number must be between 1 and 999",
    }),
  capacity: z.string()
    .min(1, "Capacity is required")
    .refine((val) => /^\d+$/.test(val), {
      message: "Capacity must contain only numbers",
    })
    .refine((val) => {
      const num = parseInt(val);
      return num >= 1 && num <= 20;
    }, {
      message: "Capacity must be between 1 and 20",
    }),
  status: z.enum(["empty", "occupied", "booked"]),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableType;
}

export function EditTableDialog({ open, onOpenChange, table }: EditTableDialogProps) {
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const updateTable = useUpdateTable();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      table_number: table.table_number.toString(),
      capacity: table.capacity.toString(),
      status: table.status,
    },
  });

  // Reset form when dialog opens/closes or table changes
  useEffect(() => {
    if (open) {
      form.reset({
        table_number: table.table_number.toString(),
        capacity: table.capacity.toString(),
        status: table.status,
      });
      setDuplicateError(null);
    }
  }, [open, table, form]);

  // Watch for changes to clear duplicate error
  useEffect(() => {
    const subscription = form.watch(() => {
      if (duplicateError) setDuplicateError(null);
    });
    return () => subscription.unsubscribe();
  }, [form, duplicateError]);

  const onSubmit = async (values: FormValues) => {
    try {
      setDuplicateError(null);
      
      // Convert string values to numbers for API
      const updateData = {
        id: table.id,
        table_number: parseInt(values.table_number),
        capacity: parseInt(values.capacity),
        status: values.status,
      };

      await updateTable.mutateAsync(updateData);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update table:", error);
      
      // Handle duplicate table number error
      if (error?.message?.includes("already exists") || 
          error?.response?.data?.error?.includes("already exists")) {
        setDuplicateError(`Table number ${values.table_number} already exists for another table`);
      } else {
        // Show general error
        setDuplicateError(error?.message || "Failed to update table");
      }
    }
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    onChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent entering 'e', 'E', '+', '-', etc.
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Table {table.table_number}</DialogTitle>
          <DialogDescription>
            Update table details and status
          </DialogDescription>
        </DialogHeader>

        {duplicateError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{duplicateError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="table_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter table number"
                      {...field}
                      onChange={(e) => handleNumberInput(e, field.onChange)}
                      onKeyDown={handleKeyDown}
                      className={form.formState.errors.table_number ? "border-destructive" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {!form.formState.errors.table_number && field.value && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Will be converted to: {parseInt(field.value) || 0}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter capacity"
                      {...field}
                      onChange={(e) => handleNumberInput(e, field.onChange)}
                      onKeyDown={handleKeyDown}
                      className={form.formState.errors.capacity ? "border-destructive" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {!form.formState.errors.capacity && field.value && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {parseInt(field.value)} {parseInt(field.value) === 1 ? 'person' : 'people'}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="empty">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Empty
                        </div>
                      </SelectItem>
                      <SelectItem value="occupied">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Occupied
                        </div>
                      </SelectItem>
                      <SelectItem value="booked">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Booked
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview of changes */}
            {form.formState.isDirty && !form.formState.errors && (
              <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Changes to be saved:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {form.watch('table_number') !== table.table_number.toString() && (
                    <li className="flex gap-2">
                      <span className="w-20">Table #:</span>
                      <span className="font-medium">{table.table_number} → {form.watch('table_number')}</span>
                    </li>
                  )}
                  {form.watch('capacity') !== table.capacity.toString() && (
                    <li className="flex gap-2">
                      <span className="w-20">Capacity:</span>
                      <span className="font-medium">{table.capacity} → {form.watch('capacity')}</span>
                    </li>
                  )}
                  {form.watch('status') !== table.status && (
                    <li className="flex gap-2">
                      <span className="w-20">Status:</span>
                      <span className="font-medium capitalize">{table.status} → {form.watch('status')}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateTable.isPending || !form.formState.isDirty}
              >
                {updateTable.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Updating...
                  </>
                ) : (
                  "Update Table"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}