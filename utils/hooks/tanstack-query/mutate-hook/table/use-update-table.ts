import { updateTable } from "@/utils/actions/table/table.put";
import { useMutation } from "@tanstack/react-query";
export const useUpdateTable = () => {
  return useMutation({
    mutationFn: updateTable,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}