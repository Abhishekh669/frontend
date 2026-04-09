import { useGetDefaultTableReport } from '@/utils/hooks/tanstack-query/query-hook/report-n-analysis/tables/use-get-report-n-analysis-tables-by-default'

export default function TableReportAndAnalysisDefaultPage() {
    const {data, isLoading, isError} = useGetDefaultTableReport();
  return (
    <div>
      
    </div>
  )
}
