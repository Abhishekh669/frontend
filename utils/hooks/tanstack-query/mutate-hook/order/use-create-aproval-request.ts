import { CreateCustomerApprovalRequest } from "@/utils/actions/order/order.post";
import { useMutation } from "@tanstack/react-query";
export const useCreateApprovalRequest = () => {
  return useMutation({
    mutationFn: CreateCustomerApprovalRequest,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}