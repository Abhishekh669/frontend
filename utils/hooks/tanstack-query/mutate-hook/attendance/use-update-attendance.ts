import { updateAttendance } from "@/utils/actions/attendance/attendance.put";
import { useMutation } from "@tanstack/react-query";
export const useUpdateAttendance= () => {
  return useMutation({
    mutationFn: updateAttendance ,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}