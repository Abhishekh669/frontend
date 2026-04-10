import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CustomQuery } from "@/utils/actions/report-n-analysis/revenue/revenue.get";
import { getCustomDateRangeRawMaterialsReport } from "@/utils/actions/report-n-analysis/raw-materials/raw-meterials.get";

export const fetchCustomRangeRawMaterialsReport = async (query : CustomQuery) => {
  try {
   const res = await getCustomDateRangeRawMaterialsReport(query);
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCustomRangeRawMaterialsReport = (query : CustomQuery) => {
  return useQuery({
    queryKey: ["get-custom-range-raw-material-report", query],
    queryFn: () => fetchCustomRangeRawMaterialsReport(query),
    placeholderData: keepPreviousData,
  });
}