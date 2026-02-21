import { HistoryQueryType } from "@/components/rms/attendance/history/history-page";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { AttendanceApiResponseType } from "@/utils/types/attendance.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

export const fetchAttendanceHistory = async (query : HistoryQueryType) => {
  try {
    console.log("this is query in tansktack ", query)
    const res = await axios.get(`/api/attendance/history?limit=${query.limit}&page=${query.page}&startingDate=${query.startingDate}&endingDate=${query.endingDate}&employee_id=${query.search}`)

    const data = res.data;
    return data as AttendanceApiResponseType;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetAttendanceHistory = (query : HistoryQueryType ) => {
  return useQuery({
    queryKey: ["get-attendance-history", query],
    queryFn: ()=> fetchAttendanceHistory(query),
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