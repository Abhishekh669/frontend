'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trash2, Phone, Mail, Calendar, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { roleLabels, User } from "@/utils/types/user.types";
import { EditUserDialog } from "./edit-client-dialogbox";
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images";

interface UsersGridProps {
  users: User[];
  onUpdate: (user: User) => void;
  onDelete: (userIds: string[]) => void;
  user : User;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
  return colors[name.charCodeAt(0) % colors.length];
};

export function UsersGrid({ users, onUpdate, onDelete, user }: UsersGridProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([])


  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedUserIds([]);
    else{
       setSelectedUserIds(users.map((u) => u.id));
       setImagesToDelete(users.filter(u => u.image && u.image.length > 0).map(u => u.image));
    }
  };

  const handleDelete = async () => {
    if (selectedUserIds.length === 0) return;
    onDelete(selectedUserIds);
    if(imagesToDelete.length > 0){
     const res =   await removeMultipleImages(imagesToDelete)
     if(res.success){
       setImagesToDelete([])
     }
    }
    setSelectedUserIds([]);
  };

  return (
    <>
      {/* Bulk Delete */}
      {selectedUserIds.length > 0 && (
        <div className="flex justify-end gap-2 mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                Delete {selectedUserIds.length} selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Users</AlertDialogTitle>
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
                          {user.image ? <AvatarImage src={user.image} /> : <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
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
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete {selectedUserIds.length} user(s)
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="flex  mb-2">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={toggleSelectAll}
          className=""
          />
          <span className="font-bold relative left-2 bottom-1">  Select All</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((user) => {
          const isSelected = selectedUserIds.includes(user.id);
          return (
            <Card key={user.id} className={cn("overflow-hidden hover:shadow-md transition-shadow relative", isSelected && "ring-2 ring-primary")}>
              <CardContent className="p-4">
                {/* Large checkbox overlay */}
                <div className="absolute top-2 right-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectUser(user.id)}
                    className="scale-150 border-2 border-primary bg-white shadow-md"
                  />
                </div>

                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="w-16 h-16 mb-3">
                    {user.image ? <AvatarImage src={user.image} /> : <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(user.name))}>{getInitials(user.name)}</AvatarFallback>}
                  </Avatar>
                  <h3 className="font-semibold text-foreground truncate w-full">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", `role-${user.role}`)}>
                      {roleLabels[user.role]}
                    </span>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", user.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300")}>
                      <span className={cn("w-2 h-2 rounded-full", user.is_active ? "bg-emerald-500" : "bg-red-500")} />
                      {user.is_active ? "Active" : "Inactive"}
                    </div>
                    <span className={`capitalize gender-${user.gender} px-2  rounded-md text-sm`}>{user.gender || "others"}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{user.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{format(user.created_at, "MMM d, yyyy")}</span>
                  </div>
                </div>

                {user.salary > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Salary: </span>
                    <span className="text-sm font-semibold text-foreground">
                      Rs {user.salary.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
                  <EditUserDialog user={user}  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 bg-transparent"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
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
                        <AlertDialogAction onClick={() => onDelete([user.id])} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
