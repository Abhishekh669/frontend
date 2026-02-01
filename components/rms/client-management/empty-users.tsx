"use client"

import { UserMinus } from "lucide-react";

export function UsersEmpty({ message = "No users found yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <UserMinus className="w-10 h-10 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold">{message}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Try changing your filters or search to see data.
      </p>
    </div>
  );
}
