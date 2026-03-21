"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, SaveAll, AlertCircle } from "lucide-react";
import { AddRawMaterials, addRawMaterialsSchema } from "@/utils/schema/raw-material.schema";
import { toast } from "sonner";
import { useCreateRawMaterials } from "@/utils/hooks/tanstack-query/mutate-hook/raw-materials/use-create-raw-materials";
import { useQueryClient } from "@tanstack/react-query";

const RawMaterialsForm = () => {
  const [tempMaterials, setTempMaterials] = useState<AddRawMaterials[]>([]);
  const { mutate: create_raw_materials, isPending } = useCreateRawMaterials();
  const queryClient = useQueryClient();

  const form = useForm<AddRawMaterials>({
    resolver: zodResolver(addRawMaterialsSchema),
    defaultValues: { name: "", price: 0, quantity: 0, unit: "pcs" },
    mode: "onChange",
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch,
  } = form;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("price", parseFloat(e.target.value) || 0, { shouldValidate: true });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("quantity", parseFloat(e.target.value) || 0, { shouldValidate: true });
  };

  const onAddTemp = (data: AddRawMaterials) => {
    setTempMaterials((prev) => [...prev, data]);
    reset({ name: "", price: 0, quantity: 0, unit: "pcs" });
  };

  const onDeleteTemp = (index: number) => {
    setTempMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const onEditTemp = (index: number) => {
    const material = tempMaterials[index];
    reset(material);
    onDeleteTemp(index);
  };

  const onSubmitAll = async () => {
    if (tempMaterials.length > 20) {
      toast.error("Maximum 20 materials can be saved at a time");
      return;
    }
    try {
      create_raw_materials(
        { materials: tempMaterials },
        {
          onSuccess: (res) => {
            if (res.message) {
              queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] });
              toast.success(res.message || "Raw materials added successfully");
              setTempMaterials([]);
              reset({ name: "", price: 0, quantity: 0, unit: "pcs" });
            }
          },
          onError: (err) => {
            toast.error(err.message || "Failed to add raw materials");
          },
        }
      );
    } catch (error) {
      console.error("Error saving materials:", error);
    }
  };

  const totalValue = tempMaterials.reduce(
    (sum, mat) => sum + mat.price * mat.quantity,
    0
  );

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="relative px-6 pt-6 pb-5 border-b border-border">
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        {/* Corner glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,var(--color-accent)/10%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 dark:bg-amber-500/15">
              <Package className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-block w-1 h-4 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                  Inventory
                </span>
              </div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Add Raw Materials
              </h2>
            </div>
          </div>

          {tempMaterials.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-medium text-foreground">
                {tempMaterials.length} item{tempMaterials.length !== 1 ? "s" : ""} •{" "}
                <span className="text-amber-500">Rs {totalValue.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-12">
          Add materials to inventory. Materials are saved temporarily until you submit.
        </p>
      </div>

      {/* Form Body */}
      <div className="px-6 py-5 space-y-6">
        <form onSubmit={handleSubmit(onAddTemp)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Material Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g., Flour, Sugar, Oil"
                className={`h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border ${errors.name ? "border-destructive" : ""}`}
                {...form.register("name")}
                value={watch("name") || ""}
                disabled={isPending}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Price per Unit <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  Rs
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className={`h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border pl-8 ${errors.price ? "border-destructive" : ""}`}
                  value={watch("price") || 0}
                  onChange={handlePriceChange}
                  disabled={isPending}
                />
              </div>
              {errors.price && (
                <div className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.price.message}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="1"
                step="0.01"
                min="1"
                className={`h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border ${errors.quantity ? "border-destructive" : ""}`}
                value={watch("quantity") || 0}
                onChange={handleQuantityChange}
                disabled={isPending}
              />
              {errors.quantity && (
                <div className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.quantity.message}
                </div>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g., kg, liters, pcs"
                className={`h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border ${errors.unit ? "border-destructive" : ""}`}
                {...form.register("unit")}
                value={watch("unit")}
                disabled={isPending}
              />
              {errors.unit && (
                <div className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.unit.message}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isValid || isPending}
            className="rounded-xl h-9 text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add to List
          </Button>
        </form>

        {/* Temp Materials Table */}
        {tempMaterials.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Material Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Price
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Quantity
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Unit
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">
                      Total
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tempMaterials.map((mat, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-muted/20 transition-colors border-b border-border last:border-0"
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        {mat.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Rs {mat.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mat.quantity}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted/60 border border-border text-[11px] font-medium text-foreground">
                          {mat.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-foreground">
                        Rs {(mat.price * mat.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEditTemp(idx)}
                            className="h-7 w-7 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDeleteTemp(idx)}
                            className="h-7 w-7 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary + Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-border bg-muted/30">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">
                    Total Items
                  </p>
                  <p className="text-xl font-bold text-foreground">{tempMaterials.length}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">
                    Total Value
                  </p>
                  <p className="text-xl font-bold text-amber-500">
                    Rs {totalValue.toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                onClick={onSubmitAll}
                disabled={isPending}
                className="rounded-xl h-9 text-sm min-w-[160px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <SaveAll className="h-3.5 w-3.5 mr-1.5" />
                    Save All Materials
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RawMaterialsForm;