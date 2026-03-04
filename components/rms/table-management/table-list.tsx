// components/table/table-list.tsx (updated with selection)
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table, Trash2 } from "lucide-react";
import { TableType } from "@/utils/types/table.types";
import { Button } from "@/components/ui/button";
import { TableCard } from "./table-card";
import { DeleteTableDialog } from "./delete-table-dialog";
import { Badge } from "@/components/ui/badge";

interface TableListProps {
  tables: TableType[];
}

export function TableList({ tables }: TableListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "capacity">("number");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredTables = tables.filter(table => 
    table.table_number.toString().includes(searchTerm) ||
    table.capacity.toString().includes(searchTerm)
  );

  const sortedTables = [...filteredTables].sort((a, b) => {
    if (sortBy === "number") {
      return a.table_number - b.table_number;
    } else {
      return a.capacity - b.capacity;
    }
  });

  const handleSelectTable = (tableId: string, selected: boolean) => {
    if (selected) {
      setSelectedTables(prev => [...prev, tableId]);
    } else {
      setSelectedTables(prev => prev.filter(id => id !== tableId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map(t => t.id));
    }
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedTables([]);
  };

  const selectedTablesData = tables.filter(t => selectedTables.includes(t.id));

  if (tables.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <Table className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg">No tables found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Get started by creating your first table
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Selection Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table number or capacity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {!selectionMode ? (
          <div className="flex gap-2">
            <Button
              variant={sortBy === "number" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("number")}
            >
              Sort by Number
            </Button>
            <Button
              variant={sortBy === "capacity" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("capacity")}
            >
              Sort by Capacity
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode(true)}
            >
              Select Multiple
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTables.length === filteredTables.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedTables.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedTables.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitSelectionMode}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectionMode && selectedTables.length > 0 && (
        <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">
            {selectedTables.length} of {filteredTables.length} tables selected
          </span>
          <Badge variant="outline">
            Total Capacity: {selectedTablesData.reduce((sum, t) => sum + t.capacity, 0)} seats
          </Badge>
        </div>
      )}

      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            selected={selectedTables.includes(table.id)}
            onSelect={handleSelectTable}
            selectionMode={selectionMode}
          />
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        Showing {sortedTables.length} of {tables.length} tables
      </div>

      {/* Delete Dialog for Multiple Tables */}
      {selectedTablesData.length > 0 && (
        <DeleteTableDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          tables={selectedTablesData}
          onSuccess={() => {
            setSelectionMode(false);
            setSelectedTables([]);
          }}
        />
      )}
    </div>
  );
}