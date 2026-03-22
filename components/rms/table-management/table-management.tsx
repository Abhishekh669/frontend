"use client";

import { useState } from "react";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSummary } from "./table-summary";
import { TableList } from "./table-list";
import { BulkCreateTables } from "./bulk-create-tables";
import { User } from "@/utils/types/user.types";
import { toast } from "sonner";
import { RefreshCw, Plus, LayoutGrid, AlertCircle } from "lucide-react";

function TableManagementPage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("list");
  const [showBulkCreate, setShowBulkCreate] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useGetTables();

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-destructive/20 scale-110 opacity-30" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Failed to load tables</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 text-center max-w-xs">
            {error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const tables = data?.tables || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        {/* Gold radial glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)] pointer-events-none" />
        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                Restaurant Operations
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Table Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage restaurant tables, monitor status, and configure seating
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 rounded-xl border-border gap-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setShowBulkCreate(true)}
              className="h-9 rounded-xl gap-2 text-xs min-w-[120px]"
            >
              <Plus className="h-3.5 w-3.5" />
              Bulk Create
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? <SummarySkeleton /> : <TableSummary tables={tables} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground shrink-0">
              Filter by Status
            </p>
            <TabsList className="bg-transparent p-0 gap-2 h-auto flex flex-wrap">
              {[
                {
                  value: "list",
                  label: "All Tables",
                  dot: null,
                  activeBg: "data-[state=active]:bg-foreground data-[state=active]:text-background",
                  count: tables.length,
                },
                {
                  value: "empty",
                  label: "Empty",
                  dot: "bg-emerald-500",
                  activeBg: "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30",
                  count: tables.filter((t) => t.status === "empty").length,
                },
                {
                  value: "occupied",
                  label: "Occupied",
                  dot: "bg-amber-500",
                  activeBg: "data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30",
                  count: tables.filter((t) => t.status === "occupied").length,
                },
                {
                  value: "booked",
                  label: "Booked",
                  dot: "bg-blue-500",
                  activeBg: "data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30",
                  count: tables.filter((t) => t.status === "booked").length,
                },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`inline-flex items-center gap-2 px-3.5 h-8 rounded-xl border border-border bg-muted/30 text-muted-foreground text-[11px] font-medium shadow-none transition-all duration-150 hover:text-foreground hover:bg-muted/60 ${tab.activeBg}`}
                >
                  {tab.dot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.dot} shrink-0`} />
                  )}
                  {tab.label}
                  {!isLoading && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-md bg-muted/60 text-[10px] font-semibold tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value="list" className="mt-0">
          {isLoading ? <TableListSkeleton /> : <TableList tables={tables} />}
        </TabsContent>

        <TabsContent value="empty" className="mt-0">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter((t) => t.status === "empty")} />
          )}
        </TabsContent>

        <TabsContent value="occupied" className="mt-0">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter((t) => t.status === "occupied")} />
          )}
        </TabsContent>

        <TabsContent value="booked" className="mt-0">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter((t) => t.status === "booked")} />
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Create Modal */}
      <BulkCreateTables
        open={showBulkCreate}
        onOpenChange={setShowBulkCreate}
        onSuccess={() => {
          refetch();
          toast.success("Tables created successfully");
          setShowBulkCreate(false);
        }}
      />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[88px] rounded-2xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function TableListSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default TableManagementPage;