import { getErrorMessage } from "@/utils/helper/get-error-message";
import { GroupedMenuResponse } from "@/utils/types/food-category.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";
export interface GroupedApiResponse {
    success : boolean;
    grouped_menu : GroupedMenuResponse
}

export const fetchFoodCategories = async () => {
  try {
    const res = await axios.get(`/api/food-category/all-grouped`)
    const data = res.data;
    return data as GroupedApiResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetAllMenuItems = (pooling ?: boolean) => {
  return useQuery({
    queryKey: ["get-all-menu-items"],
    queryFn: () => fetchFoodCategories(),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchInterval : pooling ? 5000 : false,
    meta : {
      persist : true
    }
  });
}