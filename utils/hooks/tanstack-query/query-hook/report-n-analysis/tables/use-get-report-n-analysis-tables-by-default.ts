import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDefaultTablesReport } from "@/utils/actions/report-n-analysis/table/table.get";

export const fetchDefaultTableReport = async () => {
  try {
   const res = await getDefaultTablesReport();
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export const useGetDefaultTableReport = () => {
  return useQuery({
    queryKey: ["get-default-table-report"],
    queryFn: fetchDefaultTableReport,
    placeholderData: keepPreviousData,
  });
}