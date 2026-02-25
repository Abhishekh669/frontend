import { getErrorMessage } from "@/utils/helper/get-error-message";
import { MenuApiResponse } from "@/utils/types/food-category.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchCachedMenuItems = async () => {
  try {
    const res = await axios.get(`/api/customer/menu-items`)
    const data  : MenuApiResponse = res.data;
    
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCachedMenuItems = () => {
  return useQuery({
    queryKey: ["get-cached-menu-items"],
    queryFn:  fetchCachedMenuItems,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    meta : {
      persist : true
    }
  });
}