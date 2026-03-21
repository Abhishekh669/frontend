"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  SaveAll,
  AlertCircle,
  Package,
  PackagePlus,
} from "lucide-react";
import { AddRawMaterials, addRawMaterialsSchema } from "@/utils/schema/raw-material.schema";
import { toast } from "sonner";
import { useCreateRawMaterials } from "@/utils/hooks/tanstack-query/mutate-hook/raw-materials/use-create-raw-materials";
import { useQueryClient } from "@tanstack/react-query";

/* ---------- Unit options ---------- */
const UNIT_OPTIONS = [
  { value: "kg",     label: "kg",     desc: "Kilogram" },
  { value: "g",      label: "g",      desc: "Gram" },
  { value: "litre",  label: "litre",  desc: "Litre" },
  { value: "ml",     label: "ml",     desc: "Millilitre" },
  { value: "pcs",    label: "pcs",    desc: "Pieces" },
  { value: "packet", label: "packet", desc: "Packet" },
  { value: "box",    label: "box",    desc: "Box" },
  { value: "dozen",  label: "dozen",  desc: "Dozen (12)" },
  { value: "bag",    label: "bag",    desc: "Bag" },
  { value: "bottle", label: "bottle", desc: "Bottle" },
  { value: "can",    label: "can",    desc: "Can / Tin" },
  { value: "roll",   label: "roll",   desc: "Roll" },
  { value: "sheet",  label: "sheet",  desc: "Sheet" },
  { value: "m",      label: "m",      desc: "Metre" },
  { value: "cm",     label: "cm",     desc: "Centimetre" },
];

interface AddRawMaterialDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const AddRawMaterialDialog: React.FC<AddRawMaterialDialogProps> = ({
  open,
  onOpenChange,
}) => {
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
    register,
    formState: { errors, isValid },
    setValue,
    watch,
  } = form;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue("price", parseFloat(e.target.value) || 0, { shouldValidate: true });

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue("quantity", parseFloat(e.target.value) || 0, { shouldValidate: true });

  const onAddTemp = (data: AddRawMaterials) => {
    setTempMaterials((prev) => [...prev, data]);
    reset({ name: "", price: 0, quantity: 0, unit: "pcs" });
  };

  const onDeleteTemp = (index: number) =>
    setTempMaterials((prev) => prev.filter((_, i) => i !== index));

  const onEditTemp = (index: number) => {
    reset(tempMaterials[index]);
    onDeleteTemp(index);
  };

  const resetAll = () => {
    setTempMaterials([]);
    reset({ name: "", price: 0, quantity: 0, unit: "pcs" });
  };

  const handleClose = (v: boolean) => {
    if (!v) resetAll();
    onOpenChange(v);
  };

  const onSubmitAll = () => {
    if (tempMaterials.length === 0) {
      toast.error("Add at least one material before saving");
      return;
    }
    if (tempMaterials.length > 20) {
      toast.error("Maximum 20 materials can be saved at a time");
      return;
    }
    create_raw_materials(
      { materials: tempMaterials },
      {
        onSuccess: (res) => {
          if (res.message) {
            queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] });
            toast.success(res.message || "Raw materials added successfully");
            resetAll();
            onOpenChange(false);
          }
        },
        onError: (err) => toast.error(err.message || "Failed to add raw materials"),
      }
    );
  };

  const totalValue = tempMaterials.reduce((s, m) => s + m.price * m.quantity, 0);
  const selectedUnit = watch("unit");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        {/* Header */}
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,var(--color-accent)/8%,transparent_70%)] pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 dark:bg-amber-500/15 shrink-0">
              <PackagePlus className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Add Raw Materials
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Build a list of materials, then save them all at once. Max 20 per batch.
              </DialogDescription>
            </div>
          </div>

          {/* Batch counter */}
          {tempMaterials.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-[11px] font-medium text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {tempMaterials.length} item{tempMaterials.length !== 1 ? "s" : ""} queued
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-[11px] font-medium text-foreground">
                Total:{" "}
                <span className="text-amber-500 font-semibold">
                  Rs {totalValue.toFixed(2)}
                </span>
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Input form */}
          <form onSubmit={handleSubmit(onAddTemp)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Material Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., Wheat Flour, Sunflower Oil…"
                  className={`h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border ${errors.name ? "border-destructive" : ""}`}
                  {...register("name")}
                  value={watch("name") || ""}
                  disabled={isPending}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="w-3 h-3" /> {errors.name.message}
                  </p>
                )}
              </div>

              {/* Unit — dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Unit <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(v) => setValue("unit", v, { shouldValidate: true })}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-9 rounded-xl border-border bg-muted/30 text-sm">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        <span className="font-medium">{u.label}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {u.desc}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="w-3 h-3" /> {errors.unit.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Price per Unit <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium select-none">
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
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="w-3 h-3" /> {errors.price.message}
                  </p>
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
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="w-3 h-3" /> {errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isPending}
              className="rounded-xl h-9 text-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add to List
            </Button>
          </form>

          {/* Queued materials table */}
          {tempMaterials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-3.5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Queued Materials
                </span>
              </div>

              <div className="rounded-2xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      {["Material", "Unit", "Price", "Qty", "Total", ""].map((h) => (
                        <TableHead
                          key={h}
                          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempMaterials.map((mat, idx) => (
                      <TableRow
                        key={idx}
                        className="hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0"
                      >
                        <TableCell className="font-medium text-sm text-foreground">
                          {mat.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted/60 border border-border text-[11px] font-medium text-foreground">
                            {mat.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Rs {mat.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mat.quantity}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">
                          Rs {(mat.price * mat.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDeleteTemp(idx)}
                              className="h-7 w-7 rounded-lg hover:bg-destructive/10 transition-colors group"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary row */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-muted/30">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Items
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {tempMaterials.length}
                    </p>
                  </div>
                  <div className="w-px h-7 bg-border" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Batch Value
                    </p>
                    <p className="text-lg font-bold text-amber-500">
                      Rs {totalValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="rounded-xl h-9 text-sm"
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmitAll}
            disabled={isPending || tempMaterials.length === 0}
            className="rounded-xl h-9 text-sm min-w-[160px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <>
                <SaveAll className="w-3.5 h-3.5 mr-1.5" />
                Save {tempMaterials.length > 0 ? `${tempMaterials.length} ` : ""}Material{tempMaterials.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRawMaterialDialog;