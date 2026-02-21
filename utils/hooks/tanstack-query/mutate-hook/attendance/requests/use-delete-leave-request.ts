import { deleteLeaveRequest } from "@/utils/actions/attendance/attendance.delete"
import { useMutation } from "@tanstack/react-query"

export const useDeleteLeaveRequest = () => {
  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => {},
    onError: () => {},
    onSettled: () => {},
    onMutate: () => {},
  })
}