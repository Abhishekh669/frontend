// utils.ts
import { CategoryCache } from "../types/food-category.types";

export interface CategoryNode extends CategoryCache {
  children: CategoryNode[];
}

export function buildCategoryTree(
  categories: CategoryCache[],
  categoryChildren: Record<string, string[]>
): CategoryNode[] {
  // Create a map for quick lookup
  const nodeMap: Record<string, CategoryNode> = {};
  
  // Initialize all nodes
  categories.forEach((cat) => {
    nodeMap[cat.id] = { 
      ...cat, 
      children: [] 
    };
  });

  // Build the tree structure
  const rootNodes: CategoryNode[] = [];
  
  categories.forEach((cat) => {
    const node = nodeMap[cat.id];
    
    if (cat.parent_id && nodeMap[cat.parent_id]) {
      // Add to parent's children
      nodeMap[cat.parent_id].children.push(node);
    } else {
      // This is a root node
      rootNodes.push(node);
    }
  });

  // Sort children recursively
  const sortNodes = (nodes: CategoryNode[]): CategoryNode[] => {
    return nodes
      .sort((a, b) => a.display_order - b.display_order)
      .map(node => ({
        ...node,
        children: sortNodes(node.children)
      }));
  };

  return sortNodes(rootNodes);
}