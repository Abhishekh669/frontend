"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ModeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { setTheme } = useTheme();

  const buttonContent = (
    <Button
      variant="outline"
      className={cn(
        "flex items-center gap-2",
        isCollapsed ? "h-9 w-9 p-0 justify-center" : "px-3"
      )}
    >
      {/* Icon stack */}
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>

      {/* Text only when expanded */}
      {!isCollapsed && (
        <span className="text-sm font-medium whitespace-nowrap">
          Toggle theme
        </span>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild >
              {buttonContent}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            Toggle theme
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>
          {buttonContent}
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
