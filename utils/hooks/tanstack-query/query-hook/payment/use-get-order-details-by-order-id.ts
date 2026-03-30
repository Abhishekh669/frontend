import { GetOrderDetailsForCashierByOrderId } from "@/utils/actions/order/order.get";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchOrderDetailsForCashierByOrderId = async (id : string) => {
  const res = await GetOrderDetailsForCashierByOrderId(id);
  return res;
}

export const useGetOrderDetailsForCashierById = (id : string) => {
  return useQuery({
    queryKey: ["get-orders-details-for-cashier-by-order-id", id],
    queryFn: ()=>   fetchOrderDetailsForCashierByOrderId(id),
    placeholderData: keepPreviousData,
    enabled : !!id,
  });
}