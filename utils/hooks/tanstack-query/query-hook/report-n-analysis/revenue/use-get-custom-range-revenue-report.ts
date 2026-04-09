import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery, getCustomDateRangeRevenuReport } from "@/utils/actions/report-n-analysis/revenue/revenue.get";

export const fetchCustomRangeRevenueReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeRevenuReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCustomRangeRevenueReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-revenue-report", query],
    queryFn: () => fetchCustomRangeRevenueReport(query),
    placeholderData: keepPreviousData,
  });
}