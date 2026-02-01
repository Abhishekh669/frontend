import { createUser } from "@/utils/actions/user/user.post.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export const useCreateTempUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
        if(res.success && res.message){
            queryClient.invalidateQueries({ queryKey: ["check-user-from-token"] })
        } 
    },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}