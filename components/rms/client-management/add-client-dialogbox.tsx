"use client"

import type React from "react"
import { Plus, Upload, Camera } from "lucide-react"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AddUserFormValues, addUserSchema } from "@/utils/schema/user.schema"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { toast } from "sonner"
import { createUser } from "@/utils/actions/user/user.post.action"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export function AddClientDialog() {
  const [open, setOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing("imageUploader")
  const queryClient = useQueryClient()
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
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => setImagePreview(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (values: AddUserFormValues) => {
    setSaving(true)
    let imageUrl: string | null = null
    try {
      const payload: AddUserFormValues = { ...values, image: null }
      if (selectedImageFile) {
        const uploadResults = await startUpload([selectedImageFile])
        if (uploadResults) {
          imageUrl = uploadResults[0].ufsUrl
          payload.image = imageUrl
        } else {
          throw new Error("failed to upload image")
        }
      }
      const res = await createUser(payload)
      if (res.success && res.message) {
        queryClient.invalidateQueries({ queryKey: ["get-all-users"] })
        toast.success(res.message)
        form.reset({ name: "", email: "", phone: "", gender: "male", role: "customer", salary: 0, image: null })
        setSelectedImageFile(null)
        setImagePreview("")
        setOpen(false)
      } else if (res.error) {
        throw new Error(res?.error)
      }
    } catch (error) {
      if (imageUrl !== null && imageUrl.length > 0) await removeMultipleImages([imageUrl])
      toast.error(getErrorMessage(error) as string || "failed to create user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-2 rounded-xl text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">

        {/* Header with subtle gold accent bar */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              Add New User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Create a new user profile with role and access permissions.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Avatar Upload */}
              <div className="flex items-center gap-4 pb-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative w-16 h-16 rounded-2xl border-2 border-dashed border-border bg-muted/40",
                    "flex items-center justify-center cursor-pointer",
                    "hover:border-accent/60 hover:bg-muted/60 transition-all duration-200 group",
                    saving && "pointer-events-none opacity-60"
                  )}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Photo</span>
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
                <div>
                  <p className="text-xs font-medium text-foreground">Profile Photo</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Optional · JPG, PNG, WEBP</p>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImagePreview(""); setSelectedImageFile(null) }}
                      className="text-[11px] text-destructive hover:underline mt-0.5"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={saving}
                        placeholder="e.g. John Doe"
                        {...field}
                        className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        disabled={saving}
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        disabled={saving}
                        placeholder="98XXXXXXXX"
                        {...field}
                        className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Gender + Role */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={saving}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm rounded-xl border-border bg-muted/30">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={saving}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm rounded-xl border-border bg-muted/30">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="chef">Chef</SelectItem>
                          <SelectItem value="waiter">Waiter</SelectItem>
                          <SelectItem value="delivery_staff">Delivery Staff</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
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
                    <FormLabel className="text-xs font-medium text-foreground">Salary</FormLabel>
                    <FormControl>
                      <Input
                        disabled={saving}
                        type="number"
                        placeholder="e.g. 50000"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === "" ? undefined : Number(value))
                        }}
                        className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="h-9 rounded-xl text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-xl text-sm min-w-[100px]"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </div>

      </DialogContent>
    </Dialog>
  )
}









