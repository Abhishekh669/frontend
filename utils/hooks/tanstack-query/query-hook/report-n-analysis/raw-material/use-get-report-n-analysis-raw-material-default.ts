import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultRawMaterialsReport } from "@/utils/actions/report-n-analysis/raw-materials/raw-meterials.get";

export const fetchDefaultRawMaterialsReport = async () => {
  try {
   const res = await getDefaultRawMaterialsReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetDefaultRawMaterialReport = () => {
  return useQuery({
    queryKey: ["get-default-raw-material-report"],
    queryFn: fetchDefaultRawMaterialsReport,
    placeholderData: keepPreviousData,
  });
}