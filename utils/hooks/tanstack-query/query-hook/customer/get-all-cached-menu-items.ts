import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GroupedApiResponse } from "../food-category/use-get-all-menu-item";

export const fetchCachedMenuItems = async () => {
  try {

    const res = await axios.get(`/api/customer/menu-items`)
    const data  : GroupedApiResponse  = res.data;
    console.log("this is data okie  : ", data)
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCachedMenuItems = (pooling ?: boolean) => {
  return useQuery({
    queryKey: ["get-cached-menu-items"],
    queryFn:  fetchCachedMenuItems,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchInterval : pooling ? 30 * 1000 : false,
    retryDelay: 1000,
    meta : {
      persist : true
    }
  });
}