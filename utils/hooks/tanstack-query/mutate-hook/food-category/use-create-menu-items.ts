import { createMenuItems } from "@/utils/actions/food-category/food-category.post";
import { useMutation } from "@tanstack/react-query";
export const useCreateMenuItems = () => {
  return useMutation({
    mutationFn: createMenuItems,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}