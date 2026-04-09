import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery,  } from "@/utils/actions/report-n-analysis/revenue/revenue.get";
import { getCustomDateRangeTablesReport } from "@/utils/actions/report-n-analysis/table/table.get";

export const fetchCustomRangeTableReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeTablesReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export const useGetCustomRangeTableReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-table-report", query],
    queryFn: () => fetchCustomRangeTableReport(query),
    placeholderData: keepPreviousData,
  });
}