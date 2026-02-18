import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchCurrentAttendance = async () => {
  try {
    const res = await axios.get(`/api/attendance/current`)
    const data = res.data;
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetCurrentAttendance = () => {
  return useQuery({
    queryKey: ["get-current-attendance"],
    queryFn: fetchCurrentAttendance,
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