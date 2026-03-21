'use client';

import { useState, useRef, useEffect } from "react";
import { Pencil, Camera, X } from "lucide-react";
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
import {
  Gender,
  genderLabels,
  Role,
  roleLabels,
  UpdateUserType,
  User,
} from "@/utils/types/user.types";
import { toast } from "sonner";
import { useUpdateUser } from "@/utils/hooks/tanstack-query/mutate-hook/user/use-update-user";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface EditUserDialogProps {
  user: User;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [updating, setUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
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
    setDeleteImage(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setDeleteImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let updatedImage: string | null = formData.image;
      if (deleteImage && formData.image) {
        await removeMultipleImages([formData.image]);
        updatedImage = null;
      }
      if (imageFile) {
        const uploadResults = await startUpload([imageFile]);
        if (uploadResults && uploadResults[0]) {
          updatedImage = uploadResults[0].ufsUrl;
          if (formData.image && formData.image !== updatedImage)
            await removeMultipleImages([formData.image]);
        } else {
          throw new Error("Failed to upload image");
        }
      }
      const updatedUser: UpdateUserType = { ...formData, image: updatedImage };
      updateUser(updatedUser, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["get-all-users"] });
          toast.success("User updated successfully!");
          setOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update user");
        },
      });
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Update profile details, role, and access settings.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-16 h-16 rounded-2xl border-2 border-dashed border-border bg-muted/40",
                  "flex items-center justify-center cursor-pointer",
                  "hover:border-accent/60 hover:bg-muted/60 transition-all duration-200 group",
                  isPending && "pointer-events-none opacity-60"
                )}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/80 transition-colors"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </>
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
                  disabled={isPending}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Profile Photo</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Click to change · JPG, PNG</p>
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground" htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground" htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground" htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="Enter phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-xl border-border bg-muted/30">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role + Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Role) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-xl border-border bg-muted/30">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground" htmlFor="edit-salary">Salary</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  placeholder="Enter salary"
                  value={formData.salary || ""}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-foreground">Active Status</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">User can access the system</p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-9 rounded-xl text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 rounded-xl text-sm min-w-[110px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}




