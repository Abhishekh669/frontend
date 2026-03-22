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
import { AlertCircle, ArrowRight } from "lucide-react";
import { TableType } from "@/utils/types/table.types";
import { useUpdateTable } from "@/utils/hooks/tanstack-query/mutate-hook/table/use-update-table";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  table_number: z
    .string()
    .min(1, "Table number is required")
    .refine((val) => /^\d+$/.test(val), { message: "Numbers only" })
    .refine((val) => parseInt(val) >= 1 && parseInt(val) <= 999, {
      message: "Must be between 1–999",
    }),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((val) => /^\d+$/.test(val), { message: "Numbers only" })
    .refine((val) => parseInt(val) >= 1 && parseInt(val) <= 20, {
      message: "Must be between 1–20",
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
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      table_number: table.table_number.toString(),
      capacity: table.capacity.toString(),
      status: table.status,
    },
  });

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

  useEffect(() => {
    const subscription = form.watch(() => {
      if (duplicateError) setDuplicateError(null);
    });
    return () => subscription.unsubscribe();
  }, [form, duplicateError]);

  const onSubmit = async (values: FormValues) => {
    try {
      setDuplicateError(null);
      await updateTable.mutateAsync({
        id: table.id,
        table_number: parseInt(values.table_number),
        capacity: parseInt(values.capacity),
        status: values.status,
      });
      queryClient.invalidateQueries({ queryKey: ["get-tables"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update table:", error);
      if (
        error?.message?.includes("already exists") ||
        error?.response?.data?.error?.includes("already exists")
      ) {
        setDuplicateError(
          `Table number ${values.table_number} already exists for another table`
        );
      } else {
        setDuplicateError(error?.message || "Failed to update table");
      }
    }
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    onChange(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  };

  const hasChanges = form.formState.isDirty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        {/* Dialog Header */}
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          {/* Gold top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
            Edit Table {table.table_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update table details and availability status
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Error */}
          {duplicateError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-snug">{duplicateError}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="table_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Table Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 12"
                        {...field}
                        onChange={(e) => handleNumberInput(e, field.onChange)}
                        onKeyDown={handleKeyDown}
                        className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Seating Capacity
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 4"
                        {...field}
                        onChange={(e) => handleNumberInput(e, field.onChange)}
                        onKeyDown={handleKeyDown}
                        className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    {!form.formState.errors.capacity && field.value && (
                      <p className="text-xs text-muted-foreground">
                        {parseInt(field.value)} {parseInt(field.value) === 1 ? "person" : "people"}
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
                    <FormLabel className="text-xs font-medium text-foreground">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 rounded-xl border-border bg-muted/40 text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="empty" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Empty
                          </div>
                        </SelectItem>
                        <SelectItem value="occupied" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Occupied
                          </div>
                        </SelectItem>
                        <SelectItem value="booked" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Booked
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Changes preview */}
              {hasChanges && (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Changes to be saved
                  </p>
                  <div className="space-y-1.5">
                    {form.watch("table_number") !== table.table_number.toString() && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-20">Table #</span>
                        <span className="font-medium">{table.table_number}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-accent">{form.watch("table_number")}</span>
                      </div>
                    )}
                    {form.watch("capacity") !== table.capacity.toString() && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-20">Capacity</span>
                        <span className="font-medium">{table.capacity}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-accent">{form.watch("capacity")}</span>
                      </div>
                    )}
                    {form.watch("status") !== table.status && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-20">Status</span>
                        <span className="font-medium capitalize">{table.status}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium capitalize text-accent">{form.watch("status")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer inside form */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-9 rounded-xl text-xs border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTable.isPending || !hasChanges}
                  className="h-9 rounded-xl text-xs min-w-[110px]"
                >
                  {updateTable.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Updating…
                    </span>
                  ) : (
                    "Update Table"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}