import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultCustomerReport } from "@/utils/actions/report-n-analysis/customer/customer.get";

export const fetchDefaultCustomerReport = async () => {
  try {
   const res = await getDefaultCustomerReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetDefaultCustomerReport = () => {
  return useQuery({
    queryKey: ["get-default-customer-report"],
    queryFn: fetchDefaultCustomerReport,
    placeholderData: keepPreviousData,
  });
}