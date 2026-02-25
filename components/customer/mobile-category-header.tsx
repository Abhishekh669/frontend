"use client";

import { CategoryNode } from "@/utils/helper/cache";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

interface Props {
  categories: CategoryNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenFilter: () => void;
}

export const MobileCategoryHeader: React.FC<Props> = ({
  categories,
  selectedId,
  onSelect,
  onOpenFilter,
}) => {
  const isParentActive = (cat: CategoryNode) =>
    selectedId === cat.id || cat.children.some((c) => c.id === selectedId);

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2 px-4 py-3">

        {/* Scrollable categories */}
        <div className="flex-1 overflow-x-auto scrollbar-hide touch-pan-x">
          <div className="flex gap-2 min-w-max">

            {/* All */}
            <button
              onClick={() => onSelect(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                ${selectedId === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground/70"}
              `}
            >
              All
            </button>

            {categories.map((cat) =>
              cat.children.length === 0 ? (
                /* NO CHILDREN */
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    ${selectedId === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground/70"}
                  `}
                >
                  {cat.name}
                </button>
              ) : (
                /* WITH CHILDREN (SHADCN DROPDOWN) */
                <DropdownMenu key={cat.id}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1
                        ${isParentActive(cat)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground/70"}
                      `}
                    >
                      {cat.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-64 max-h-72 overflow-y-auto"
                  >
                    <DropdownMenuItem
                      onSelect={() => onSelect(cat.id)}
                      className="font-medium"
                    >
                      All {cat.name}
                    </DropdownMenuItem>

                    {cat.children.map((child) => (
                      <DropdownMenuItem
                        key={child.id}
                        onSelect={() => onSelect(child.id)}
                        className={
                          selectedId === child.id
                            ? "text-primary font-medium"
                            : ""
                        }
                      >
                        {child.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        </div>

        {/* Filter button */}
       
      </div>
    </div>
  );
};