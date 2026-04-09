import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery,  } from "@/utils/actions/report-n-analysis/revenue/revenue.get";
import { getCustomDateRangeCustomerReport } from "@/utils/actions/report-n-analysis/customer/customer.get";

export const fetchCustomRangeCustomerReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeCustomerReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCustomRangeCustomerReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-customer-report", query],
    queryFn: () => fetchCustomRangeCustomerReport(query),
    placeholderData: keepPreviousData,
  });
}