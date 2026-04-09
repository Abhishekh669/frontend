"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table } from "lucide-react";
import TableReportAndAnalysisDefaultPage from "./table-report-n-analysis-default-page";
import TableReportAndAnalysisCustomDateRangeDatePage from "./table-report-n-analysis-custom-range-date";


function ReportAndAnalysisManagementPage() {
   const [activeTab, setActiveTab] = useState<"default" | "custom">("default");

  return (
    <div className="space-y-5">
      {/* Tabs Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "default" | "custom")} className="w-full">
            <TabsList className="grid w-full max-w-[300px] grid-cols-2 mt-4">
              <TabsTrigger value="default" className="text-sm">
                Default (Cached)
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-sm">
                Custom Range
              </TabsTrigger>
            </TabsList>

            <TabsContent value="default" className="mt-5">
              <TableReportAndAnalysisDefaultPage />
            </TabsContent>

            <TabsContent value="custom" className="mt-5">
              <TableReportAndAnalysisCustomDateRangeDatePage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ReportAndAnalysisManagementPage
