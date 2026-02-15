import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchFoodCategoriesBySlug = async (slug : string) => {
  try {
    const res = await axios.get(`/api/food-category/get-by-slug?slug=${slug}`)
    const data = res.data;
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetFoodCategoriesBySlug = (slug : string) => {
  return useQuery({
    queryKey: ["get-all-by-slug", slug],
    queryFn: () => fetchFoodCategoriesBySlug(slug),
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