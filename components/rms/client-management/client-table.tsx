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
} from '@/components/ui/tooltip'
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

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name: string) => {
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

// Skeleton loader for table rows
const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell><div className="h-4 w-4 bg-gray-200 rounded"></div></TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </TableCell>
        <TableCell><div className="h-6 w-20 bg-gray-200 rounded-md"></div></TableCell>
        <TableCell><div className="h-6 w-16 bg-gray-200 rounded-md"></div></TableCell>
        <TableCell><div className="h-6 w-16 bg-gray-200 rounded-md"></div></TableCell>
        <TableCell><div className="h-4 w-24 bg-gray-200 rounded"></div></TableCell>
        <TableCell><div className="h-4 w-20 bg-gray-200 rounded"></div></TableCell>
        <TableCell><div className="h-4 w-24 bg-gray-200 rounded"></div></TableCell>
        <TableCell><div className="flex gap-1"><div className="h-8 w-8 bg-gray-200 rounded"></div><div className="h-8 w-8 bg-gray-200 rounded"></div></div></TableCell>
      </TableRow>
    ))}
  </>
);

export function UsersTable({ 
  users, 
  onDelete, 
  user: u, 
  refetch, 
  isRefetching,
  isLoading = false 
}: UsersTableProps) {
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
    if (allSelected) {
      setSelectedUserIds([]);
      setImagesToDelete([]);
    } else {
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

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10"><div className="h-4 w-4 bg-gray-200 rounded"></div></TableHead>
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
            <TableSkeleton />
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      {/* Bulk Delete Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Users Table View</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  className="h-8 w-8"
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRefetching ? 'Refreshing...' : 'Reload'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isRefetching && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Updating...
            </span>
          )}
        </div>

        {selectedUserIds.length > 0 && hasPermission(u.role, "delete:clients") && (
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
                      <div className="flex items-center gap-2">
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
        )}
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected || indeterminate}
                  onCheckedChange={toggleSelectAll}
                  disabled={isRefetching || users.length === 0}
                  className={cn(
                    indeterminate && "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                      "hover:bg-muted/30",
                      isRefetching && "opacity-60 pointer-events-none"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        disabled={isRefetching}
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
                    <TableCell>
                      <span className={`capitalize gender-${user.gender} px-2 py-1 rounded-md`}>
                        {user.gender || "others"}
                      </span>
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>{user.salary > 0 ? `Rs ${user.salary.toLocaleString()}` : "-"}</TableCell>
                    <TableCell>{format(user.created_at, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {hasPermission(u.role, "update:clients") && (
                          <EditUserDialog user={user} />
                        )}
                        {hasPermission(u.role, "delete:clients") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive" 
                                disabled={isRefetching}
                              >
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