// ─────────────────────────────────────────────────────────────────────────────
// sales-report-n-analysis-management.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import SalesAndReportAndAnalysisDefaultReportPage from "./sales-report-n-analysis-default-report";
import SalesReportAndAnalysisCustomDateRange from "./sales-report-n-analysis-custom-date-range";
import { Database, Calendar } from "lucide-react";

function SalesReportAndAnalysisManagementPage() {
  const [activeTab, setActiveTab] = useState<"default" | "custom">("default");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "default" | "custom")} className="w-full">
        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5 w-fit">
          <button
            onClick={() => setActiveTab("default")}
            className={`flex items-center gap-1.5 px-4 h-8 text-[11px] font-medium rounded-lg transition-all ${
              activeTab === "default" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Default (Cached)
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-1.5 px-4 h-8 text-[11px] font-medium rounded-lg transition-all ${
              activeTab === "custom" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Custom Range
          </button>
        </div>

        <TabsContent value="default" className="mt-0">
          <SalesAndReportAndAnalysisDefaultReportPage />
        </TabsContent>
        <TabsContent value="custom" className="mt-0">
          <SalesReportAndAnalysisCustomDateRange />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SalesReportAndAnalysisManagementPage;