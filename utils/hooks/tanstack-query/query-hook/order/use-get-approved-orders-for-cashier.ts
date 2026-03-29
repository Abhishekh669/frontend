import { getAllApprovedOrdersForCashier, getOrderRequestsFromPhoneNTableNum } from "@/utils/actions/order/order.get";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchApprovedOrderForCashier = async () => {
  const res = await getAllApprovedOrdersForCashier();
  return res;
}

export const useGetApprovedOrdersForCashier = (pooling ?:boolean) => {
  return useQuery({
    queryKey: ["get-approved-orders-for-cashier"],
    queryFn: fetchApprovedOrderForCashier   ,
    placeholderData: keepPreviousData,
    refetchInterval : pooling ? 5000 : false,
    refetchIntervalInBackground: pooling ? true : false, // Continue polling when tab is in background
    gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time (formerly cacheTime)
    refetchOnWindowFocus: !pooling, // Don't refetch on window focus if polling
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
  });
}