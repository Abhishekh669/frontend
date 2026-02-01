import { DeleteRawMaterials } from "@/utils/actions/raw-materials/raw-materials.post.action";
import { useMutation, } from "@tanstack/react-query";
export const useDeleteRawMaterials = () => {
  return useMutation({
    mutationFn: DeleteRawMaterials,
    onSuccess: () => {
        
    },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}