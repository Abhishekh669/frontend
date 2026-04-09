import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery,  } from "@/utils/actions/report-n-analysis/revenue/revenue.get";
import { getCustomDateRangeSalesReport } from "@/utils/actions/report-n-analysis/sales/sales.get";

export const fetchCustomRangeSalesReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeSalesReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCustomRangeSalesReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-sales-report", query],
    queryFn: () => fetchCustomRangeSalesReport(query),
    placeholderData: keepPreviousData,
  });
}