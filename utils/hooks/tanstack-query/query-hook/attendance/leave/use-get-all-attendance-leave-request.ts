import { getAllAttendanceLeaveRequest } from "@/utils/actions/attendance/attendance.get";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const  fetchAllAttendanceLeaveRequests= async () => {
  try {
    const res  = await getAllAttendanceLeaveRequest();
    return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetAllAttendanceLeaveRequests = ( ) => {
  return useQuery({
    queryKey: ["get-all-attendance-leave"],
    queryFn: fetchAllAttendanceLeaveRequests,
    placeholderData: keepPreviousData,
  });
}