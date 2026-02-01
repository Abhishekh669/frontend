import { UpdateUser } from "@/utils/actions/user/user.put.action";
import { useMutation, } from "@tanstack/react-query";
export const useUpdateUser = () => {
  return useMutation({
    mutationFn: UpdateUser,
    onSuccess: () => { },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}