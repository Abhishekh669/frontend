import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { refreshCachedData } from "@/utils/actions/report-n-analysis/rna-get";

export const fetchRefreshCacheData = async () => {
  try {
   const res = await refreshCachedData();
   return res;
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error) || "failed to refresh data"
    };
  }
}


export const useRefreshCachedData = () => {
  return useQuery({
    queryKey: ["refresh-cached-data"],
    queryFn: fetchRefreshCacheData,
    placeholderData: keepPreviousData,
    enabled : false,
  });
}