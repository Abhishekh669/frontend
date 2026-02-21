import { deleteAttendanceById } from "@/utils/actions/attendance/attendance.delete";
import { useMutation } from "@tanstack/react-query";
export const useDeleteAttendance = () => {
  return useMutation({
    mutationFn: deleteAttendanceById,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}