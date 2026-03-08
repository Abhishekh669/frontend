import { createCustomerOrder } from "@/utils/actions/order/order.post";
import { useMutation } from "@tanstack/react-query";
export const useCreateOrderRequest = () => {
  return useMutation({
    mutationFn: createCustomerOrder,
    onSuccess: ()=>{},
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}