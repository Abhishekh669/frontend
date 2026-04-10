import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultStaffReport } from "@/utils/actions/report-n-analysis/staff/staff.get";

export const fetchDefaultStaffReport = async () => {
  try {
   const res = await getDefaultStaffReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export const useGetDefaultStaffReport = () => {
  return useQuery({
    queryKey: ["get-default-staff-report"],
    queryFn: fetchDefaultStaffReport,
    placeholderData: keepPreviousData,
  });
}