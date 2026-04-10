import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery,  } from "@/utils/actions/report-n-analysis/revenue/revenue.get";
import { getCustomDateRangeStaffReport } from "@/utils/actions/report-n-analysis/staff/staff.get";

export const fetchCustomRangeStaffReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeStaffReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export const useGetCustomRangeStaffReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-staff-report", query],
    queryFn: () => fetchCustomRangeStaffReport(query),
    placeholderData: keepPreviousData,
  });
}