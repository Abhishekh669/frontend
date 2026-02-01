import { createRawMaterials } from "@/utils/actions/raw-materials/raw-materials.post.action";
import { useMutation } from "@tanstack/react-query";
export const useCreateRawMaterials = () => {
  return useMutation({
    mutationFn: createRawMaterials,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}