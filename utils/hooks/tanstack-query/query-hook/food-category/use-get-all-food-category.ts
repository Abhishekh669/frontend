import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchFoodCategories = async () => {
  try {
    const res = await axios.get(`/api/food-category/all`)
    const data = res.data;
    console.log("this is  data : ", data)
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetFoodCategories = () => {
  return useQuery({
    queryKey: ["get-all-categories"],
    queryFn: () => fetchFoodCategories(),
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