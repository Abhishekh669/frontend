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

    // Reset form whenever rawMaterial changes
    useEffect(() => {
        reset({
            name: rawMaterial.name,
            price: rawMaterial.price,
            quantity: rawMaterial.quantity,
            unit: rawMaterial.unit,
        });
    }, [rawMaterial, reset]);

    const onSubmit = (data: RawMaterialFormType) => {
        if(isPending)return;
        try {
            const updatedData: UpdateRawMaterialType = {
                id: rawMaterial.id,
                name: data.name,
                price: data.price,
                quantity: data.quantity,
                unit: data.unit,
            }

            updateRawMaterial(updatedData, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] })
                    toast.success("User updated successfully!");
                    setOpen(false);
                },
                onError: (err: any) => {
                    toast.error(err?.message || "Failed to update user");
                },

            })

        } catch (error) {
            toast.error(getErrorMessage(error) || "an error occured")

        }

    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Raw Material</DialogTitle>
                    <DialogDescription>Update the details of this raw material.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" placeholder="Material name" {...register("name")}  disabled={isPending}/>
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Input  disabled={isPending} id="unit" placeholder="Unit (kg, liter)" {...register("unit")} />
                        {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input  disabled={isPending} id="price" type="number" {...register("price", { valueAsNumber: true })} />
                        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input  disabled={isPending} id="quantity" type="number" {...register("quantity", { valueAsNumber: true })} />
                        {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
                    </div>

                    <DialogFooter className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={ isPending}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
