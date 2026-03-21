"use client"

import { UserMinus } from "lucide-react";

export function UsersEmpty({ message = "No users found yet." }) {
  return (
    <div className="flex justify-center py-16">
      <div className="flex flex-col items-center text-center max-w-xs">

        {/* Icon container with layered rings */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center border border-border shadow-sm">
            <UserMinus className="w-7 h-7 text-muted-foreground" />
          </div>
          {/* decorative ring */}
          <div className="absolute inset-0 rounded-3xl border border-border/40 scale-110 opacity-40" />
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          No users found
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {message}
          <br />
          Try adjusting your filters or search terms.
        </p>

      </div>
    </div>
  );
}