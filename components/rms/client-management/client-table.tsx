'use client';

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RefreshCw, Trash2, X } from "lucide-react";
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
import { format } from "date-fns";
import { roleLabels, User } from "@/utils/types/user.types";
import { EditUserDialog } from "./edit-client-dialogbox";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";
import { hasPermission } from "@/utils/helper/check-permission";

interface UsersTableProps {
  users: User[];
  onDelete: (userIds: string[]) => void;
  user: User;
  refetch: () => void;
  isRefetching: boolean;
  isLoading?: boolean;
}

export const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
];
export const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

const COL_HEADERS = ["User", "Role", "Status", "Gender", "Phone", "Salary", "Created", "Actions"];

export function UsersTable({
  users,
  onDelete,
  user: u,
  refetch,
  isRefetching,
  isLoading = false,
}: UsersTableProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  useEffect(() => setIndeterminate(someSelected), [someSelected]);

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
      setImagesToDelete(users.filter((u) => u?.image?.length > 0).map((u) => u.image));
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
      {/* ── Table Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refetch}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
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

          {isRefetching && (
            <span className="text-[11px] text-muted-foreground animate-pulse">Updating…</span>
          )}

          {selectedUserIds.length > 0 && (
            <span className="text-xs font-medium text-foreground">
              {selectedUserIds.length} selected
            </span>
          )}
        </div>

        {/* Bulk Delete */}
        {selectedUserIds.length > 0 && hasPermission(u.role, "delete:clients") && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 rounded-xl text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete {selectedUserIds.length}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm font-semibold">Delete User(s)</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently delete the selected users. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                {selectedUserIds.map((id) => {
                  const user = users.find((u) => u.id === id);
                  if (!user) return null;
                  return (
                    <div key={id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          {user.image
                            ? <AvatarImage src={user.image} />
                            : <AvatarFallback className={cn("text-white text-[10px]", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
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
      </div>

      {/* ── Table ── */}
      <div className={cn("overflow-x-auto", isRefetching && "opacity-60 pointer-events-none transition-opacity")}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-border">
              <TableHead className="w-10 pl-5">
                <Checkbox
                  checked={allSelected || indeterminate}
                  onCheckedChange={toggleSelectAll}
                  disabled={isRefetching || users.length === 0}
                  className="rounded-md"
                />
              </TableHead>
              {COL_HEADERS.map((h) => (
                <TableHead
                  key={h}
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground py-3"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <TableRow
                    key={user.id}
                    className={cn(
                      "border-border/60 hover:bg-muted/20 transition-colors",
                      isSelected && "bg-accent/5"
                    )}
                  >
                    {/* Checkbox */}
                    <TableCell className="pl-5 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        disabled={isRefetching}
                        className="rounded-md"
                      />
                    </TableCell>

                    {/* User */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 rounded-xl ring-1 ring-border">
                          {user.image
                            ? <AvatarImage src={user.image} className="rounded-xl" />
                            : <AvatarFallback className={cn("text-white text-xs font-semibold rounded-xl", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3">
                      <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold", `role-${user.role}`)}>
                        {roleLabels[user.role]}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
                        user.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-muted-foreground")} />
                        {user.is_active ? "Active" : "Inactive"}
                      </div>
                    </TableCell>

                    {/* Gender */}
                    <TableCell className="py-3">
                      <span className={cn("capitalize px-2.5 py-1 rounded-lg text-[11px] font-medium", `gender-${user.gender}`)}>
                        {user.gender || "Other"}
                      </span>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {user.phone || "—"}
                    </TableCell>

                    {/* Salary */}
                    <TableCell className="py-3 text-sm font-medium text-foreground">
                      {user.salary > 0 ? `Rs ${user.salary.toLocaleString()}` : "—"}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(user.created_at, "MMM d, yyyy")}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-0.5">
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
                                  Are you sure you want to delete{" "}
                                  <span className="font-medium text-foreground">{user.name}</span>?
                                  This cannot be undone.
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}



