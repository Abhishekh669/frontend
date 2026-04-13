"use client"

// Import all report components
import CustomerReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/customer/customer-report-n-analysis-management'
import RawMaterialReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/raw-material/raw-material-report-n-anlaysis-management'
import RevenueReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/revenue/revenue-report-n-analysis-management'
import SalesReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/sales/sales-report-n-analysis-management'
import StaffReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/staff/staff-report-n-analysis-management-page'
import TableReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/tables/table-report-n-analysis-management'
import React, { useState } from 'react'
import { RefreshCw, TrendingUp, ShoppingCart, Users, Package, UserCog, Table as TableIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRefreshCachedData } from '@/utils/hooks/tanstack-query/query-hook/report-n-analysis/use-get-refresh-cache-data'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@/utils/types/user.types'

const tabs = [
  { id: 'revenue',      label: 'Revenue',      icon: TrendingUp,   component: RevenueReportAndAnalysisManagementPage      },
  { id: 'sales',        label: 'Sales',        icon: ShoppingCart, component: SalesReportAndAnalysisManagementPage        },
  { id: 'customers',    label: 'Customers',    icon: Users,        component: CustomerReportAndAnalysisManagementPage     },
  { id: 'staff',        label: 'Staff',        icon: UserCog,      component: StaffReportAndAnalysisManagementPage        },
  { id: 'tables',       label: 'Tables',       icon: TableIcon,    component: TableReportAndAnalysisManagementPage        },
  { id: 'raw-material', label: 'Raw Material', icon: Package,      component: RawMaterialReportAndAnalysisManagementPage  },
]

function ReportAndAnalysisManagementPage({ user }: { user: User }) {
  if (!user) return null;
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
    <div className="min-h-screen bg-background">
      {/* ── Premium Tab Bar ── */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">

            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={isRefreshing}
                  className={`
                    relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all whitespace-nowrap
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                    ${isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-accent' : ''}`} />
                  {tab.label}
                  {/* Gold underline indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
                  )}
                </button>
              )
            })}

            {/* Refresh button */}
            <div className="ml-auto pl-4 py-2.5">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
                  transition-all border border-border bg-muted/40
                  hover:bg-muted/80 hover:border-accent/40 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Cache'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="relative">
        {isRefreshing && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] cursor-not-allowed" />
        )}
        <div
          className={`px-4 sm:px-6 lg:px-8 py-6 transition-opacity duration-200 ${
            isRefreshing ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}

export default ReportAndAnalysisManagementPage