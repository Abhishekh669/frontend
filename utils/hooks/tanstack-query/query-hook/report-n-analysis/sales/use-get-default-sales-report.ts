import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultSalesReport } from "@/utils/actions/report-n-analysis/sales/sales.get";

export const fetchDefaultSalesReport = async () => {
  try {
   const res = await getDefaultSalesReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetDefaultSalesReport = () => {
  return useQuery({
    queryKey: ["get-default-sales-report"],
    queryFn: fetchDefaultSalesReport,
    placeholderData: keepPreviousData,
  });
}