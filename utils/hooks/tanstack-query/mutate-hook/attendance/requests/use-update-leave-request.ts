import { updateLeaveRequest } from "@/utils/actions/attendance/attendance.put"
import { useMutation } from "@tanstack/react-query"

export const useUpdateLeaveRequest = () => {
  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: () => {},
    onError: () => {},
    onSettled: () => {},
    onMutate: () => {},
  })
}