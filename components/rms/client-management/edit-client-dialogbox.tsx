'use client';

import { useState, useRef, useEffect } from "react";
import { Pencil, Upload, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Gender, genderLabels, Role, roleLabels, UpdateUserType, User } from "@/utils/types/user.types";
import { toast } from "sonner";
import { useUpdateUser } from "@/utils/hooks/tanstack-query/mutate-hook/user/use-update-user";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client";
import { useQueryClient } from "@tanstack/react-query";
import { hasPermission } from "@/utils/helper/check-permission";

interface EditUserDialogProps {
  user: User;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [updating, setUpdating] = useState(false)
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending : isUpdating } = useUpdateUser();
  const isPending = isUpdating || updating;
  const { startUpload } = useUploadThing("imageUploader");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(user);
    setImagePreview(user.image || null);
    setImageFile(null);
    setDeleteImage(false);
  }, [user, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setDeleteImage(false); // user selected a new image
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setDeleteImage(true); // mark existing image for deletion
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let updatedImage: string | null = formData.image;

      // 1. Delete image if user removed it
      if (deleteImage && formData.image) {
        await removeMultipleImages([formData.image]);
        updatedImage = null;
      }

      // 2. Upload new image if user selected one
      if (imageFile) {
        const uploadResults = await startUpload([imageFile]);
        if (uploadResults && uploadResults[0]) {
          updatedImage = uploadResults[0].ufsUrl;
          // Delete old image if exists
          if (formData.image && formData.image !== updatedImage) {
            await removeMultipleImages([formData.image]);
          }
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // 3. Prepare updated user data
      const updatedUser: UpdateUserType = {
        ...formData,
        image: updatedImage,
      };

      // 4. Call update mutation
      updateUser(updatedUser, {
        onSuccess: () => {
          queryClient.invalidateQueries({queryKey : ["get-all-users"]})
          toast.success("User updated successfully!");
          setOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update user");
        },
      });
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    }finally{
      setUpdating(false)
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="flex justify-center mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors group"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 text-red-500 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
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
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 py-4">
            {/* Name and Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="Enter phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Gender) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role and Salary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Role) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value , label]  ) => (
                      <SelectItem key={value} value={value} >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-salary">Salary ($)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  placeholder="Enter salary"
                  value={formData.salary || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-is_active" className="font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  User can access the system
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={ isPending}>
              { isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
