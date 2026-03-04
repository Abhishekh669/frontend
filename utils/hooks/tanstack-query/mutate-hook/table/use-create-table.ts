import { createTable } from "@/utils/actions/table/table.post";
import { useMutation } from "@tanstack/react-query";
export const useCreateTable = () => {
  return useMutation({
    mutationFn: createTable,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}