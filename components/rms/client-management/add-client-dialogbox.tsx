"use client"

import type React from "react"
import { Plus, Upload } from "lucide-react"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type AddUserFormValues, addUserSchema } from "@/utils/schema/user.schema"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { toast } from "sonner"
import { createUser } from "@/utils/actions/user/user.post.action"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useQueryClient } from "@tanstack/react-query"


export function AddClientDialog() {
    const [open, setOpen] = useState(false)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { startUpload } = useUploadThing("imageUploader")
    const queryClient = useQueryClient();

    const [saving, setSaving] = useState(false)


    const form = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            gender: "male",
            role: "customer",
            salary: 0,
            image: null,
        },
    })

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    const onSubmit = async (values: AddUserFormValues) => {

        setSaving(true)
        let imageUrl: string | null = null;
        try {
            const payload: AddUserFormValues = {
                ...values,
                image: null, 
            }
            if (selectedImageFile) {
                const uploadResults = await startUpload([selectedImageFile])
                if (uploadResults) {
                    imageUrl = uploadResults[0].ufsUrl;
                    payload.image = imageUrl
                } else {
                    throw new Error("failed to upload image")
                }
            }
            console.log("thisis hte values : ", values)
            const res = await createUser(payload);
            if (res.success && res.message) {
                queryClient.invalidateQueries({ queryKey: ["get-all-users"] });
                toast.success(res.message)
                form.reset({
                    name: "",
                    email: "",
                    phone: "",
                    gender: "male",
                    role: "customer",
                    salary: 0,
                    image: null,
                })
                setSelectedImageFile(null)
                setImagePreview("")
                setOpen(false)
            } else if (res.error) {
                throw new Error(res?.error)
            }
        } catch (error) {
            if (imageUrl !== null && imageUrl.length > 0) {
                await removeMultipleImages([imageUrl])
            }
            error = getErrorMessage(error);
            toast.error(error as string || "failed to create user")
        } finally {
            setSaving(false)
        }

    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex justify-center">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-32 h-32 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors group"
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview || "/placeholder.svg"}
                                        alt="Preview"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="w-6 h-6" />
                                        <span className="text-xs font-medium">Upload Image</span>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    aria-label="Upload user image"
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={saving} placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input disabled={saving} type="email" placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input disabled={saving} placeholder="98XXXXXXXX" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={saving}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={saving}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="cashier">Cashier</SelectItem>
                                                <SelectItem value="chef">Chef</SelectItem>
                                                <SelectItem value="waiter">Waiter</SelectItem>
                                                <SelectItem value="delivery_staff">Delivery Staff</SelectItem>
                                                <SelectItem value="customer">Customer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Salary */}
                        <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Salary</FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={saving}
                                            type="number"
                                            placeholder="50000"
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value === "" ? undefined : Number(value));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>{saving ? "saving user...." : "Add user"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
