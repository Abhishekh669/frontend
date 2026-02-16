import {  DeleteCategories } from "@/utils/actions/food-category/food-category.post";
import { useMutation } from "@tanstack/react-query";
export const useDeleteFoodCategory = () => {
  return useMutation({
    mutationFn: DeleteCategories,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}