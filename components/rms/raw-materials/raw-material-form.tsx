"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
    defaultValues: {
      name: "",
      price: 0,
      quantity: 0,
      unit: "pcs",
    },
    mode: "onChange",
  });

  const { handleSubmit, reset, formState: { errors, isValid }, setValue, watch, trigger } = form;

  // Custom onChange handlers for number fields
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setValue("price", value, { shouldValidate: true });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setValue("quantity", value, { shouldValidate: true });
  };

  const onAddTemp = (data: AddRawMaterials) => {
    setTempMaterials((prev) => [...prev, data]);

    // Reset to default values, not the current form values
    reset({
      name: "",
      price: 0,
      quantity: 0,
      unit: "pcs",
    });
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
      toast.error("maximum 20 materials can be saved at a time")
      return;
    }
    try {
      create_raw_materials({
        materials: tempMaterials
      }, {
        onSuccess: (res) => {
          if (res.message && res.message) {
            queryClient.invalidateQueries({queryKey : ["get-all-raw-materials"]})
            toast.success(res.message || "raw materials added successfully")
            setTempMaterials([]);
            // Also reset the form
            reset({
              name: "",
              price: 0,
              quantity: 0,
              unit: "pcs",
            });

          }
        },
        onError: (err) => {
          toast.error(err.message || "failed to add raw materials")
        }
      })

    } catch (error) {
      console.error("Error saving materials:", error);
      alert("Failed to save materials. Please try again.");
    }
  };

  const totalValue = tempMaterials.reduce((sum, mat) => sum + (mat.price * mat.quantity), 0);

  return (
    <div className="space-y-6 p-1">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Add Raw Materials
              </CardTitle>
              <CardDescription>
                Add materials to inventory. Materials are saved temporarily until you submit.
              </CardDescription>
            </div>
            {tempMaterials.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {tempMaterials.length} item{tempMaterials.length !== 1 ? 's' : ''} • Total: Rs{totalValue.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit(onAddTemp)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Name Field */}
              <div className="space-y-2" >
                <Label htmlFor="name" className="flex items-center gap-1">
                  Material Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Flour, Sugar, Oil"
                  className={errors.name ? "border-red-500" : ""}
                  {...form.register("name")}
                  value={watch("name") || ""}
                  disabled={isPending}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </div>
                )}
              </div>

              {/* Price Field */}
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-1">
                  Price per Unit
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                    value={watch("price") || 0}
                    onChange={handlePriceChange}
                     disabled={isPending}
                  />
                </div>
                {errors.price && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.price.message}
                  </div>
                )}
              </div>

              {/* Quantity Field */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center gap-1">
                  Quantity
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  step="0.01"
                  min="1"
                  className={errors.quantity ? "border-red-500" : ""}
                  value={watch("quantity") || 0}
                   disabled={isPending}
                  onChange={handleQuantityChange}
                />
                {errors.quantity && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.quantity.message}
                  </div>
                )}
              </div>

              {/* Unit Field */}
              <div className="space-y-2">
                <Label htmlFor="unit" className="flex items-center gap-1">
                  Unit
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit"
                  type="text"
                  placeholder="e.g., kg, liters, pcs"
                  className={errors.unit ? "border-red-500" : ""}
                  {...form.register("unit")}
                  value={watch("unit")}
                   disabled={isPending}
                />
                {errors.unit && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.unit.message}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto "
              disabled={!isValid || isPending}

            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </form>

          {/* Temp Materials Table */}
          {tempMaterials.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-50">Material Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempMaterials.map((mat, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{mat.name}</TableCell>
                        <TableCell>Rs{mat.price.toFixed(2)}</TableCell>
                        <TableCell>{mat.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{mat.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Rs{(mat.price * mat.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditTemp(idx)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDeleteTemp(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary and Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Materials</p>
                  <p className="text-2xl font-bold">{tempMaterials.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">Rs{totalValue.toFixed(2)}</p>
                </div>
                <Button
                  onClick={onSubmitAll}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveAll className="h-4 w-4 mr-2" />
                      Save All Materials
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
};

export default RawMaterialsForm;