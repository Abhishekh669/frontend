import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultRevenueReport } from "@/utils/actions/report-n-analysis/revenue/revenue.get";

export const fetchDefaultRevenueReport = async () => {
  try {
   const res = await getDefaultRevenueReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetDefaultRevenueReport = () => {
  return useQuery({
    queryKey: ["get-default-revenue-report"],
    queryFn: fetchDefaultRevenueReport,
    placeholderData: keepPreviousData,
  });
}