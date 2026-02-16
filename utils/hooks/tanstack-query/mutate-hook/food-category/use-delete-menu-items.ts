import {  DeleteMenuItems } from "@/utils/actions/food-category/food-category.post";
import { useMutation } from "@tanstack/react-query";
export const useDeleteMenuItems = () => {
  return useMutation({
    mutationFn: DeleteMenuItems,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}