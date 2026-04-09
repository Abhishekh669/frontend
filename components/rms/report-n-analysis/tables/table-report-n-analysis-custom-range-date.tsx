import { CustomQuery } from '@/utils/actions/report-n-analysis/customer/customer.get';
import { format, startOfDay, subDays } from 'date-fns';
import React, { useState } from 'react'
import { TrendType } from '../revenue/revenue-report-n-analysis-custom-date-range';
import { useGetCustomRangeTableReport } from '@/utils/hooks/tanstack-query/query-hook/report-n-analysis/tables/use-get-report-n-analysis-by-custom-date-range';

function TableReportAndAnalysisCustomDateRangeDatePage() {
      const today = startOfDay(new Date());
      const defaultFrom = subDays(today, 30);
    
      const [query, setQuery] = useState<CustomQuery>({
        start_date: format(defaultFrom, "yyyy-MM-dd"),
        end_date: format(today, "yyyy-MM-dd"),
        limit: 20,
        page: 0,
      });
    
      const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
      const [toDate, setToDate] = useState<Date | undefined>(today);
      const [dateError, setDateError] = useState("");
      const [trendFilter, setTrendFilter] = useState<TrendType>("daily");
      const [chartMode, setChartMode] = useState<"revenue" | "orders" | "both">("revenue");
      const [menuSearch, setMenuSearch] = useState("");
      const [chartVisualization, setChartVisualization] = useState<"horizontal" | "vertical">("horizontal");
      const [activePreset, setActivePreset] = useState<string>("30d");
    
      const { data, isLoading, isError, error, isFetching } = useGetCustomRangeTableReport(query);
  return (
    <div>
      
    </div>
  )
}

export default TableReportAndAnalysisCustomDateRangeDatePage
