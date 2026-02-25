"use client"
import { CategoryNode } from "@/utils/helper/cache";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const MobileCategorySheet = ({
  open,
  onClose,
  categories,
  selectedId,
  onSelect,
}: Props) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Auto-expand parent categories of selected category
  useEffect(() => {
    if (selectedId && categories.length > 0) {
      const newExpanded = new Set(expandedCategories);
      
      const findAndExpandParents = (cats: CategoryNode[], targetId: string): boolean => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            return true;
          }
          if (cat.children.length > 0) {
            const found = findAndExpandParents(cat.children, targetId);
            if (found) {
              newExpanded.add(cat.id);
              return true;
            }
          }
        }
        return false;
      };
      
      findAndExpandParents(categories, selectedId);
      setExpandedCategories(newExpanded);
    }
  }, [selectedId, categories]);

  const toggleCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
  };

  const renderCategoryItem = (category: CategoryNode, depth: number = 0) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedId === category.id;

    return (
      <div key={category.id} className="w-full">
        <button
          onClick={() => handleCategorySelect(category.id)}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-left
            transition-colors min-h-[52px] touch-manipulation
            ${isSelected 
              ? "bg-primary/10 text-primary font-medium" 
              : "hover:bg-muted active:bg-muted/80"
            }
          `}
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          <span className="flex-1 text-base line-clamp-2">{category.name}</span>
          
          {hasChildren && (
            <button
              onClick={(e) => toggleCategory(category.id, e)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-background/80 active:bg-background/60 ml-2"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-10 h-10" />}
        </button>

        {/* Children dropdown */}
        {hasChildren && isExpanded && (
          <div className="bg-muted/30">
            {category.children
              .sort((a, b) => a.display_order - b.display_order)
              .map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Breadcrumb navigation for mobile
  const renderBreadcrumb = () => {
    if (!selectedId) return null;

    const findCategoryPath = (
      cats: CategoryNode[],
      targetId: string,
      path: CategoryNode[] = []
    ): CategoryNode[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return [...path, cat];
        }
        if (cat.children.length > 0) {
          const result = findCategoryPath(cat.children, targetId, [...path, cat]);
          if (result) return result;
        }
      }
      return null;
    };

    const path = findCategoryPath(categories, selectedId);
    if (!path) return null;

    return (
      <div className="flex items-center gap-1 px-4 py-2 bg-muted/30 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => handleCategorySelect(null)}
          className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-md touch-manipulation"
        >
          All
        </button>
        {path.map((cat, index) => (
          <div key={cat.id} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
            <button
              onClick={() => handleCategorySelect(cat.id)}
              className={`
                px-2 py-1 rounded-md touch-manipulation
                ${index === path.length - 1 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {cat.name}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
          <h2 className="font-semibold text-lg">Categories</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted active:bg-muted/80 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb (visible when category selected) */}
        {selectedId && renderBreadcrumb()}

        {/* Categories List */}
        <div className="overflow-y-auto flex-1 pb-6">
          {/* All Categories option */}
          <button
            onClick={() => handleCategorySelect(null)}
            className={`
              w-full flex items-center px-4 py-3 text-left
              transition-colors min-h-[52px] touch-manipulation
              ${selectedId === null 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted active:bg-muted/80"
              }
            `}
          >
            <span className="text-base">All Categories</span>
          </button>

          {/* Category items */}
          {sortedCategories.map(cat => renderCategoryItem(cat))}
        </div>

        {/* Quick actions footer */}
        <div className="border-t border-border p-4 bg-background sticky bottom-0">
          <div className="flex gap-2">
            {selectedId && (
              <button
                onClick={() => handleCategorySelect(null)}
                className="flex-1 py-3 px-4 rounded-lg border border-border hover:bg-muted active:bg-muted/80 touch-manipulation text-center"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 touch-manipulation text-center font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};