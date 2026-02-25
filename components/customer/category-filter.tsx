"use client"
import { CategoryNode } from "@/utils/helper/cache";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  categories: CategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryFilter: React.FC<Props> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const findAllParentIds = useCallback(
    (categoryId: string, allCategories: CategoryNode[]): string[] => {
      const parents: string[] = [];
      const findParent = (id: string, cats: CategoryNode[]): boolean => {
        for (const cat of cats) {
          if (cat.id === id) return true;
          if (cat.children.length > 0) {
            const found = findParent(id, cat.children);
            if (found) {
              parents.push(cat.id);
              return true;
            }
          }
        }
        return false;
      };
      findParent(categoryId, allCategories);
      return parents;
    },
    []
  );

  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const parentIds = findAllParentIds(selectedCategoryId, categories);
      setExpanded((prev) => {
        const next = { ...prev };
        parentIds.forEach((id) => (next[id] = true));
        return next;
      });
    }
  }, [selectedCategoryId, categories, findAllParentIds]);

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderCategory = useCallback(
    (cat: CategoryNode, depth: number = 0) => {
      const isSelected = selectedCategoryId === cat.id;
      const hasChildren = cat.children.length > 0;
      const isExpanded = expanded[cat.id];

      return (
        <div key={cat.id}>
          <button
            onClick={() => onSelectCategory(cat.id)}
            className={`
              w-full flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
              ${isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              }
            `}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {hasChildren && (
              <span
                onClick={(e) => toggleExpand(cat.id, e)}
                className="flex-shrink-0 p-0.5 rounded hover:bg-foreground/10 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className="truncate">{cat.name}</span>
            {hasChildren && (
              <span className="ml-auto text-xs opacity-50 font-normal">
                {cat.children.length}
              </span>
            )}
          </button>
          {isExpanded && hasChildren && (
            <div className="mt-0.5">
              {cat.children
                .sort((a, b) => a.display_order - b.display_order)
                .map((child) => renderCategory(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [selectedCategoryId, expanded, onSelectCategory, toggleExpand]
  );

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <nav className="space-y-0.5">
      <button
        onClick={() => onSelectCategory(null)}
        className={`
          w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
          ${selectedCategoryId === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground/80 hover:bg-secondary hover:text-foreground"
          }
        `}
      >
        All Categories
      </button>
      {sortedCategories.map((cat) => renderCategory(cat))}
    </nav>
  );
};
