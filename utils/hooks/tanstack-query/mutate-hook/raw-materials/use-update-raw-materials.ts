import { UpdateRawMaterials } from "@/utils/actions/raw-materials/raw-materials.put.action";
import { useMutation, } from "@tanstack/react-query";
export const useUpdateRawMaterials = () => {
  return useMutation({
    mutationFn: UpdateRawMaterials,
    onSuccess: () => { },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}