'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { RawMaterialType, UpdateRawMaterialType } from "@/utils/types/raw-materials.types";
import { z } from "zod";
import { addRawMaterialsSchema } from "@/utils/schema/raw-material.schema";
import { Pencil } from "lucide-react";
import { useUpdateRawMaterials } from "@/utils/hooks/tanstack-query/mutate-hook/raw-materials/use-update-raw-materials";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/helper/get-error-message";

type RawMaterialFormType = z.infer<typeof addRawMaterialsSchema>;

interface EditRawMaterialDialogProps {
    rawMaterial: RawMaterialType;
}

export function EditRawMaterialDialog({ rawMaterial }: EditRawMaterialDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { mutate: updateRawMaterial, isPending } = useUpdateRawMaterials();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RawMaterialFormType>({
        resolver: zodResolver(addRawMaterialsSchema),
        defaultValues: {
            name: rawMaterial.name,
            price: rawMaterial.price,
            quantity: rawMaterial.quantity,
            unit: rawMaterial.unit,
        },
    });

    useEffect(() => {
        reset({
            name: rawMaterial.name,
            price: rawMaterial.price,
            quantity: rawMaterial.quantity,
            unit: rawMaterial.unit,
        });
    }, [rawMaterial, reset]);

    const onSubmit = (data: RawMaterialFormType) => {
        if (isPending) return;
        try {
            const updatedData: UpdateRawMaterialType = {
                id: rawMaterial.id,
                name: data.name,
                price: data.price,
                quantity: data.quantity,
                unit: data.unit,
            };

            updateRawMaterial(updatedData, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] });
                    toast.success("Raw material updated successfully!");
                    setOpen(false);
                },
                onError: (err: any) => {
                    toast.error(err?.message || "Failed to update raw material");
                },
            });
        } catch (error) {
            toast.error(getErrorMessage(error) || "An error occurred");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
                {/* Gold top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

                <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
                    <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                        Edit Raw Material
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Update the details of this raw material.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 py-5 space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-name" className="text-xs font-medium text-foreground">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                placeholder="Material name"
                                className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                                {...register("name")}
                                disabled={isPending}
                            />
                            {errors.name && (
                                <p className="text-[11px] text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-unit" className="text-xs font-medium text-foreground">
                                Unit <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-unit"
                                placeholder="Unit (kg, liter)"
                                className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                                {...register("unit")}
                                disabled={isPending}
                            />
                            {errors.unit && (
                                <p className="text-[11px] text-destructive">{errors.unit.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-price" className="text-xs font-medium text-foreground">
                                    Price <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                                    {...register("price", { valueAsNumber: true })}
                                    disabled={isPending}
                                />
                                {errors.price && (
                                    <p className="text-[11px] text-destructive">{errors.price.message}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-quantity" className="text-xs font-medium text-foreground">
                                    Quantity <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-quantity"
                                    type="number"
                                    className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                                    {...register("quantity", { valueAsNumber: true })}
                                    disabled={isPending}
                                />
                                {errors.quantity && (
                                    <p className="text-[11px] text-destructive">{errors.quantity.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-6 pb-6 pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-xl h-9 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl h-9 text-sm min-w-[110px]"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}