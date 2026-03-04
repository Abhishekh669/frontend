"use client";

import { useState } from "react";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, TableOfContents } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSummary } from "./table-summary";
import { TableList } from "./table-list";
import { BulkCreateTables } from "./bulk-create-tables";
import { User } from "@/utils/types/user.types";
import { toast } from "sonner";

function TableManagementPage({user} : {user : User}) {
  const [activeTab, setActiveTab] = useState("list");
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  const { data, isLoading, error, refetch, isRefetching } = useGetTables();
  
  console.log("Tables data:", data);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          <h3 className="font-semibold">Error loading tables</h3>
          <p className="text-sm mt-1">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const tables = data?.tables || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your restaurant tables, view status, and create new tables
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => setShowBulkCreate(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Bulk Create
          </Button>
        </div>
      </div>

      {/* Table Summary Section */}
      {isLoading ? (
        <SummarySkeleton />
      ) : (
        <TableSummary tables={tables} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Tables</TabsTrigger>
          <TabsTrigger value="empty">Empty Tables</TabsTrigger>
          <TabsTrigger value="occupied">Occupied Tables</TabsTrigger>
          <TabsTrigger value="booked">Booked Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables} />
          )}
        </TabsContent>

        <TabsContent value="empty">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter(t => t.status === 'empty')} />
          )}
        </TabsContent>

        <TabsContent value="occupied">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter(t => t.status === 'occupied')} />
          )}
        </TabsContent>

        <TabsContent value="booked">
          {isLoading ? (
            <TableListSkeleton />
          ) : (
            <TableList tables={tables.filter(t => t.status === 'booked')} />
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Create Modal */}
      <BulkCreateTables 
        open={showBulkCreate} 
        onOpenChange={setShowBulkCreate}
        onSuccess={() => {
          refetch();
          toast.success("successfully created tables")
          setShowBulkCreate(false);
        }}
      />
    </div>
  );
}

// Skeleton Loaders
function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

function TableListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

export default TableManagementPage;