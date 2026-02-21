import { cancelLeaveRequest } from "@/utils/actions/attendance/attendance.put"
import { useMutation } from "@tanstack/react-query"

export const useCancelLeaveRequest = () => {
  return useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => {},
    onError: () => {},
    onSettled: () => {},
    onMutate: () => {},
  })
}