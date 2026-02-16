import { updateFoodCategory } from "@/utils/actions/food-category/food-category.put";
import { useMutation } from "@tanstack/react-query";
export const useUpdateFoodCategory = () => {
  return useMutation({
    mutationFn: updateFoodCategory,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}