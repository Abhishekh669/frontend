'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trash2, Phone, Mail, Calendar, X, RefreshCw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { roleLabels, User } from "@/utils/types/user.types";
import { EditUserDialog } from "./edit-client-dialogbox";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";
import { hasPermission } from "@/utils/helper/check-permission";

interface UsersGridProps {
  users: User[];
  onDelete: (userIds: string[]) => void;
  user: User;
  refetch: () => void;
  isRefetching: boolean;
  isLoading?: boolean;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
];
const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

export function UsersGrid({
  users,
  onDelete,
  user: u,
  refetch,
  isRefetching,
  isLoading = false,
}: UsersGridProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  const toggleSelectUser = (userId: string) =>
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUserIds([]);
      setImagesToDelete([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
      setImagesToDelete(users.filter((u) => u.image?.length > 0).map((u) => u.image));
    }
  };

  const handleDelete = async () => {
    if (selectedUserIds.length === 0) return;
    onDelete(selectedUserIds);
    if (imagesToDelete.length > 0) {
      const res = await removeMultipleImages(imagesToDelete);
      if (res.success) setImagesToDelete([]);
    }
    setSelectedUserIds([]);
  };

  return (
    <>
      {/* ── Grid Toolbar ── */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
              disabled={isRefetching || users.length === 0}
              className="rounded-md"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {selectedUserIds.length > 0
                ? `${selectedUserIds.length} selected`
                : "Select all"}
            </span>
          </div>

          {isRefetching && (
            <span className="text-[11px] text-muted-foreground animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Updating…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Delete */}
          {selectedUserIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 rounded-xl text-xs gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete {selectedUserIds.length}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-semibold">Delete Users</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will permanently delete the selected users. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                  {selectedUserIds.map((id) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-card border border-border/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            {user.image
                              ? <AvatarImage src={user.image} />
                              : <AvatarFallback className={cn("text-white text-[10px] font-medium", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
                          </Avatar>
                          <span className="text-xs font-medium text-foreground">{user.name}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", `role-${user.role}`)}>{user.role}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setSelectedUserIds((prev) => prev.filter((uid) => uid !== id))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-sm h-9">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="rounded-xl text-sm h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete {selectedUserIds.length} user(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Refresh */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refetch}
                  className="h-8 w-8 rounded-xl border-border"
                  disabled={isRefetching}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">
                {isRefetching ? "Refreshing…" : "Reload"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Grid ── */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
          isRefetching && "opacity-60 transition-opacity pointer-events-none"
        )}
      >
        {users.map((user) => {
          const isSelected = selectedUserIds.includes(user.id);
          return (
            <div
              key={user.id}
              className={cn(
                "relative rounded-2xl border bg-card overflow-hidden transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5",
                isSelected
                  ? "border-accent/60 ring-1 ring-accent/40 shadow-sm"
                  : "border-border"
              )}
            >
              {/* Gold accent top line on hover */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-200",
                isSelected
                  ? "bg-gradient-to-r from-transparent via-accent to-transparent opacity-100"
                  : "bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100"
              )} />

              {/* Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelectUser(user.id)}
                  className="rounded-md bg-card/80 backdrop-blur-sm"
                />
              </div>

              <div className="p-5">
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="w-14 h-14 mb-3 ring-2 ring-border ring-offset-2 ring-offset-card">
                    {user.image
                      ? <AvatarImage src={user.image} />
                      : <AvatarFallback className={cn("text-white text-sm font-semibold", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
                  </Avatar>
                  <h3 className="text-sm font-semibold text-foreground truncate w-full">{user.name}</h3>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", `role-${user.role}`)}>
                      {roleLabels[user.role]}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                      user.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-muted-foreground")} />
                      {user.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                {/* Info lines */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{user.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{format(user.created_at, "MMM d, yyyy")}</span>
                  </div>
                  {user.salary > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-3.5 h-3.5 shrink-0 text-accent" />
                      <span className="font-semibold text-foreground">Rs {user.salary.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-border/60">
                  {hasPermission(u.role, "update:clients") && (
                    <EditUserDialog user={user} />
                  )}
                  {hasPermission(u.role, "delete:clients") && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          disabled={isRefetching}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm font-semibold">Delete User</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            Are you sure you want to delete <span className="font-medium text-foreground">{user.name}</span>? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl text-sm h-9">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete([user.id])}
                            className="rounded-xl text-sm h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}


