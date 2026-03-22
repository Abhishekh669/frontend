// components/table/table-list.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Trash2 } from "lucide-react";
import { TableType } from "@/utils/types/table.types";
import { Button } from "@/components/ui/button";
import { TableCard } from "./table-card";
import { DeleteTableDialog } from "./delete-table-dialog";

interface TableListProps {
  tables: TableType[];
}

export function TableList({ tables }: TableListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "capacity">("number");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredTables = tables.filter(
    (table) =>
      table.table_number.toString().includes(searchTerm) ||
      table.capacity.toString().includes(searchTerm)
  );

  const sortedTables = [...filteredTables].sort((a, b) =>
    sortBy === "number"
      ? a.table_number - b.table_number
      : a.capacity - b.capacity
  );

  const handleSelectTable = (tableId: string, selected: boolean) => {
    setSelectedTables((prev) =>
      selected ? [...prev, tableId] : prev.filter((id) => id !== tableId)
    );
  };

  const handleSelectAll = () => {
    setSelectedTables(
      selectedTables.length === filteredTables.length
        ? []
        : filteredTables.map((t) => t.id)
    );
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedTables([]);
  };

  const selectedTablesData = tables.filter((t) => selectedTables.includes(t.id));

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
            <LayoutGrid className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="absolute inset-0 rounded-3xl border border-border scale-110 opacity-30" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No tables found</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1 text-center max-w-xs">
          Get started by creating your first table using the Bulk Create option above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by table number or capacity…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
          />
        </div>

        {/* Controls */}
        {!selectionMode ? (
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort toggle */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
              <button
                onClick={() => setSortBy("number")}
                className={`px-3 h-7 text-[11px] font-medium rounded-lg transition-colors ${
                  sortBy === "number"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Number
              </button>
              <button
                onClick={() => setSortBy("capacity")}
                className={`px-3 h-7 text-[11px] font-medium rounded-lg transition-colors ${
                  sortBy === "capacity"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Capacity
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode(true)}
              className="h-9 rounded-xl text-xs border-border"
            >
              Select Multiple
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-9 rounded-xl text-xs border-border"
            >
              {selectedTables.length === filteredTables.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedTables.length === 0}
              className="h-9 rounded-xl text-xs bg-destructive hover:bg-destructive/90 text-white min-w-[100px]"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete ({selectedTables.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitSelectionMode}
              className="h-9 rounded-xl text-xs border-border"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Selection info bar */}
      {selectionMode && selectedTables.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 flex justify-between items-center">
          <span className="text-xs font-medium text-foreground">
            {selectedTables.length} of {filteredTables.length} tables selected
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            Total Capacity: {selectedTablesData.reduce((sum, t) => sum + t.capacity, 0)} seats
          </span>
        </div>
      )}

      {/* Grid */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Grid header bar */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {sortedTables.length} {sortedTables.length === 1 ? "Table" : "Tables"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {tables.length > 0 && `${Math.round((sortedTables.length / tables.length) * 100)}% shown`}
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {sortedTables.length === 0 && searchTerm && (
            <div className="flex flex-col items-center justify-center py-14 px-4">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 rounded-3xl border border-border scale-110 opacity-30" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No results found</h3>
              <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
                No tables match "<span className="font-medium">{searchTerm}</span>". Try a different number or capacity.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground px-1">
        Showing {sortedTables.length} of {tables.length} tables
      </p>

      {/* Delete dialog */}
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