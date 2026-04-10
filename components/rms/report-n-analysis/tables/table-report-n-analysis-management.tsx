"use client";

import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  Calendar, 
  Database, 
  TrendingUp,
  Clock,
  RefreshCw
} from "lucide-react";
import TableReportAndAnalysisDefaultPage from "./table-report-n-analysis-default-page";
import TableReportAndAnalysisCustomDateRangeDatePage from "./table-report-n-analysis-custom-range-date";

function TableReportAndAnalysisManagementPage() {
  const [activeTab, setActiveTab] = useState<"default" | "custom">("default");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-xl">
              <Table className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Table Performance Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Monitor table occupancy, turnover rates, and performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "default" | "custom")} className="w-full">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 mb-6 shadow-sm">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 gap-1">
              <TabsTrigger 
                value="default" 
                className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Database className="w-4 h-4 mr-2" />
                Default (Cached)
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Custom Range
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="mt-2">
            <TabsContent value="default" className="m-0">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <TableReportAndAnalysisDefaultPage />
              </div>
            </TabsContent>

            <TabsContent value="custom" className="m-0">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <TableReportAndAnalysisCustomDateRangeDatePage />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Quick Info Cards (Optional) */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-cyan-50 to-white rounded-lg border border-cyan-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-semibold text-gray-700">Cached Data</h3>
            </div>
            <p className="text-xs text-gray-500">
              Pre-calculated data for instant loading. Updated every hour with latest table metrics.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-700">Custom Range</h3>
            </div>
            <p className="text-xs text-gray-500">
              Select any date range to analyze table performance for specific periods.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-700">Real-time Analytics</h3>
            </div>
            <p className="text-xs text-gray-500">
              Track occupancy rates, average session duration, and table turnover in real-time.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default TableReportAndAnalysisManagementPage;