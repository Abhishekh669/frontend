"use client"

// Import all report components
import CustomerReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/customer/customer-report-n-analysis-management'
import RawMaterialReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/raw-material/raw-material-report-n-anlaysis-management'
import RevenueReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/revenue/revenue-report-n-analysis-management'
import SalesReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/sales/sales-report-n-analysis-management'
import StaffReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/staff/staff-report-n-analysis-management-page'
import TableReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/tables/table-report-n-analysis-management'
import React, { use, useState } from 'react'
import { RefreshCw, TrendingUp, ShoppingCart, Users, Package, UserCog, Table as TableIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRefreshCachedData } from '@/utils/hooks/tanstack-query/query-hook/report-n-analysis/use-get-refresh-cache-data'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@/utils/types/user.types'

const tabs = [
  { id: 'revenue',      label: 'Revenue',      icon: TrendingUp, component: RevenueReportAndAnalysisManagementPage      },
  { id: 'sales',        label: 'Sales',        icon: ShoppingCart, component: SalesReportAndAnalysisManagementPage      },
  { id: 'customers',    label: 'Customers',    icon: Users,        component: CustomerReportAndAnalysisManagementPage    },
  { id: 'staff',        label: 'Staff',        icon: UserCog,      component: StaffReportAndAnalysisManagementPage       },
  { id: 'tables',       label: 'Tables',       icon: TableIcon,    component: TableReportAndAnalysisManagementPage       },
  { id: 'raw-material', label: 'Raw Material', icon: Package,      component: RawMaterialReportAndAnalysisManagementPage },
]

function ReportAndAnalysisManagementPage({user}  : {user : User}) {
  if(!user)return null;
  const [activeTab, setActiveTab] = useState('revenue')
  const { isLoading, isRefetching, refetch } = useRefreshCachedData()

  const isRefreshing = isLoading || isRefetching
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || tabs[0].component
  const queryClient = useQueryClient();
  const handleRefresh = async () => {
    const result = await refetch()
    if (result.data?.success) {
      toast.success(result.data.message)

      queryClient.invalidateQueries({ queryKey: ["get-default-customer-report", "get-default-revenue-report", "get-default-sales-report", "get-default-staff-report", "get-default-table-report", "get-default-raw-material-report"] })
    } else {
      toast.error(result.data?.message || 'Failed to refresh data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">

            {/* Tab buttons — disabled while refreshing */}
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={isRefreshing}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                    ${isActive
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}

            {/* Refresh button — stays enabled always */}
            <div className="ml-auto pl-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  transition-all border border-orange-200 text-orange-600
                  hover:bg-orange-50 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                `}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Tab content — dimmed + blocked while refreshing ── */}
      <div className="relative">
        {/* Scoped overlay — only covers the content area */}
        {isRefreshing && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] cursor-not-allowed" />
        )}

        <div
          className={`px-4 sm:px-6 lg:px-8 py-6 transition-opacity duration-200 ${
            isRefreshing ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          <ActiveComponent />
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

export default ReportAndAnalysisManagementPage