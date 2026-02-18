import { checkInEmployee } from "@/utils/actions/attendance/attendance.post";
import { useMutation } from "@tanstack/react-query";
export const useCheckInEmployee = () => {
  return useMutation({
    mutationFn: checkInEmployee ,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}