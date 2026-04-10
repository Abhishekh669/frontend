"use client"

import React, { useState } from 'react'
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  UserCog, 
  Table as TableIcon
} from 'lucide-react'

// Import all report components
import CustomerReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/customer/customer-report-n-analysis-management'
import RawMaterialReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/raw-material/raw-material-report-n-anlaysis-management'
import RevenueReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/revenue/revenue-report-n-analysis-management'
import SalesReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/sales/sales-report-n-analysis-management'
import StaffReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/staff/staff-report-n-analysis-management-page'
import TableReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/tables/table-report-n-analysis-management'

const tabs = [
  { id: 'revenue', label: 'Revenue', icon: TrendingUp, component: RevenueReportAndAnalysisManagementPage },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, component: SalesReportAndAnalysisManagementPage },
  { id: 'customers', label: 'Customers', icon: Users, component: CustomerReportAndAnalysisManagementPage },
  { id: 'staff', label: 'Staff', icon: UserCog, component: StaffReportAndAnalysisManagementPage },
  { id: 'tables', label: 'Tables', icon: TableIcon, component: TableReportAndAnalysisManagementPage },
  { id: 'raw-material', label: 'Raw Material', icon: Package, component: RawMaterialReportAndAnalysisManagementPage },
]

function ReportAndAnalysisManagementPage() {
  const [activeTab, setActiveTab] = useState('revenue')
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || tabs[0].component

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap
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
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ActiveComponent />
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default ReportAndAnalysisManagementPage