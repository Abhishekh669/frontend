// components/table/table-card.tsx (updated section)
import { useState } from "react";
import { TableType } from "@/utils/types/table.types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Users, MoreHorizontal, QrCode, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EditTableDialog } from "./edit-table-dialog";
import { DeleteTableDialog } from "./delete-table-dialog";

interface TableCardProps {
  table: TableType;
  selected?: boolean;
  onSelect?: (tableId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

const statusConfig = {
  empty: {
    label: "Empty",
    className: "bg-green-500 hover:bg-green-600 text-white"
  },
  occupied: {
    label: "Occupied",
    className: "bg-orange-500 hover:bg-orange-600 text-white"
  },
  booked: {
    label: "Booked",
    className: "bg-blue-500 hover:bg-blue-600 text-white"
  }
};

export function TableCard({ table, selected, onSelect, selectionMode }: TableCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const status = statusConfig[table.status];

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-lg",
        selected && "ring-2 ring-primary"
      )}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {selectionMode && (
                <Checkbox 
                  checked={selected}
                  onCheckedChange={(checked) => onSelect?.(table.id, checked as boolean)}
                  className="mt-1"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">Table {table.table_number}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Capacity: {table.capacity}
                  </span>
                </div>
              </div>
            </div>
            <Badge className={cn("capitalize", status.className)}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {table.id.slice(0, 8)}...</span>
            <span>•</span>
            <span>Added {new Date(table.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
        
        <CardFooter className="border-t bg-muted/20 px-4 py-2">
          <div className="flex justify-between items-center w-full">
            <Button variant="ghost" size="sm" className="gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </Button>
            
            <div className="flex gap-1">
              {selectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowEdit(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Table
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDelete(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardFooter>
      </Card>

      <EditTableDialog 
        open={showEdit} 
        onOpenChange={setShowEdit} 
        table={table}
      />
      
      <DeleteTableDialog 
        open={showDelete} 
        onOpenChange={setShowDelete} 
        table={table}
      />
    </>
  );
}