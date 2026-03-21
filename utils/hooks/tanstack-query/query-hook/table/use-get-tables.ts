import axios from "axios";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TableType } from "@/utils/types/table.types";

export const fetchTables = async () => {
  try {
    const res = await axios.get(`/api/table/all`);
    const data = res.data;
    return {
      success : data.success as boolean,
      tables : data?.tables as TableType[] || [] as TableType[]
    }
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetTables = (pooling ?: boolean) => {
  return useQuery({
    queryKey: ["get-tables"],
    queryFn:  fetchTables,
    placeholderData: keepPreviousData,
    refetchInterval : pooling ? 5000 : false,
    refetchIntervalInBackground: pooling ? true : false, // Continue polling when tab is in background
    gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: !pooling, // Don't refetch on window focus if polling
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
  });
}