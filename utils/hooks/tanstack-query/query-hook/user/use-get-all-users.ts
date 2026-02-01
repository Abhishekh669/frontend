import { QueryType } from "@/components/rms/client-management/client-management-page";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchUsers = async (query: QueryType) => {
  try {
    const res = await axios.get(`/api/user/all?page=${query.page}&limit=${query.limit}&search=${query.search}&oldestFirst=${query.oldestFirst}`)
    const data = res.data;
    console.log("this is  data : ", data)
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetAllUsers = (query: QueryType) => {
  return useQuery({
    queryKey: ["get-all-users", query],
    queryFn: () => fetchUsers(query),
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