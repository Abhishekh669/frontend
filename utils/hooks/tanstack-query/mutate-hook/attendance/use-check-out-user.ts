import {  checkOutEmployee } from "@/utils/actions/attendance/attendance.post";
import { useMutation } from "@tanstack/react-query";
export const useCheckOutEmployee = () => {
  return useMutation({
    mutationFn: checkOutEmployee ,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}