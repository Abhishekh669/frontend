import {  DeleteUsers } from "@/utils/actions/user/user.post.action";
import { useMutation, } from "@tanstack/react-query";
export const useDeleteUsers = () => {
  return useMutation({
    mutationFn: DeleteUsers,
    onSuccess: () => {
        
    },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}