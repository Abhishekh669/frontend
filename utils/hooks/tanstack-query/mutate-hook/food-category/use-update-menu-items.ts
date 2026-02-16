import { createMenuItems } from "@/utils/actions/food-category/food-category.post";
import { updateMenuItem } from "@/utils/actions/food-category/food-category.put";
import { useMutation } from "@tanstack/react-query";
export const useUpdateMenuItems = () => {
  return useMutation({
    mutationFn: updateMenuItem,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}