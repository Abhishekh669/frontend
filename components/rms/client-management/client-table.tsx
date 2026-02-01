'use client';

import { useEffect, useRef, useState } from "react";
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
import { Trash2, X } from "lucide-react";
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
import { format } from "date-fns";
import { roleLabels, User } from "@/utils/types/user.types";
import { EditUserDialog } from "./edit-client-dialogbox";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";
import { hasPermission } from "@/utils/helper/check-permission";

interface UsersTableProps {
  users: User[];
  onUpdate: (user: User) => void;
  onDelete: (userIds: string[]) => void; // Single or multiple
  user: User
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-primary",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export function UsersTable({ users, onUpdate, onDelete, user: u }: UsersTableProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])


  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  useEffect(() => {
    setIndeterminate(someSelected);
  }, [someSelected]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedUserIds([]);
    else {
      setSelectedUserIds(users.map((u) => u.id));
      setImagesToDelete(users.filter(u => u?.image && u.image.length > 0).map(u => u.image));

    }
  };

  const handleDelete = async () => {
    if (selectedUserIds.length === 0) return;
    onDelete(selectedUserIds);
    if (imagesToDelete.length > 0) {
      const res = await removeMultipleImages(imagesToDelete)
      if (res.success) {
        setImagesToDelete([])
      }
    }
    setSelectedUserIds([]);
  };

  return (
    <>
      <div>
        {selectedUserIds.length > 0 && (
          <div className="p-3  flex justify-end gap-2">
            {
              hasPermission(u.role, "delete:clients") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedUserIds.length} selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User(s)</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the following users? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {/* Selected users list */}
                    <div className="p-3 max-h-60 overflow-y-auto">
                      {selectedUserIds.map((id) => {
                        const user = users.find((u) => u.id === id);
                        if (!user) return null;
                        return (
                          <div key={id} className="flex items-center justify-between gap-2 py-1 px-2 border rounded-md mb-1">
                            <div className="flex items-center justify-between gap-2">
                              <Avatar className="w-6 h-6">
                                {user.image ? (
                                  <AvatarImage src={user.image} />
                                ) : (
                                  <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(user.name))}>
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="text-sm font-medium">{user.name}</span>
                              <span className={`role-${user.role} rounded-md px-2`}>{user.role}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:bg-red-100"
                              onClick={() =>
                                setSelectedUserIds((prev) => prev.filter((uid) => uid !== id))
                              }
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete {selectedUserIds.length} user(s)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            }
          </div>
        )}

      </div>


      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {/* Bulk Delete Button */}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected || indeterminate}
                  onCheckedChange={toggleSelectAll}
                  className={cn(
                    indeterminate && "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    indeterminate && "before:content-[''] before:block before:w-2.5 before:h-0.5 before:bg-primary-foreground before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
                  )}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Created</TableHead>

              <TableHead>Actions</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        {user.image ? (
                          <AvatarImage src={user.image} />
                        ) : (
                          <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(user.name))}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-1 rounded-md text-xs font-semibold", `role-${user.role}`)}>
                      {roleLabels[user.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold w-fit", user.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-red-500")} />
                      {user.is_active ? "Active" : "Inactive"}
                    </div>
                  </TableCell>
                  <TableCell className={` capitalize`}><span className={`gender-${user.gender} px-2 py-1 rounded-md`}>{user.gender || "others"}</span></TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.salary > 0 ? `Rs ${user.salary.toLocaleString()}` : "-"}</TableCell>
                  <TableCell>{format(user.created_at, "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {
                        hasPermission(u.role, "update:clients") && (
                          <EditUserDialog user={user} />
                        )
                      }
                      {
                        hasPermission(u.role, "delete:clients") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete([user.id])}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )
                      }
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}