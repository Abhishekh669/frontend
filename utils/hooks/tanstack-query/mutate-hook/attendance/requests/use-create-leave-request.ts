import { createLeaveReqeust } from "@/utils/actions/attendance/attendance.post"
import { useMutation } from "@tanstack/react-query"

export const useCreateLeaveRequest = () => {
  return useMutation({
    mutationFn: createLeaveReqeust,
    onSuccess: () => {},
    onError: () => {},
    onSettled: () => {},
    onMutate: () => {},
  })
}