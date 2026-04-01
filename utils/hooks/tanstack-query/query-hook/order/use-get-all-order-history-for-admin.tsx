import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GetAllOrderHistoryForAdmin, GetAllOrderHistoryQuery } from "@/utils/actions/order/order.get";

export const fetchAllOrderHistory = async (query: GetAllOrderHistoryQuery) => {
  try {
   const res = await GetAllOrderHistoryForAdmin(query)
   return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetAllOrderHistory = (query: GetAllOrderHistoryQuery) => {
  return useQuery({
    queryKey: ["get-all-order-history-for-admin", query],
    queryFn: () => fetchAllOrderHistory(query),
    placeholderData: keepPreviousData,
  });
}