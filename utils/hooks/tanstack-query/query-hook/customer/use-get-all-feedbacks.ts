import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getAllFeedbacks } from "@/utils/actions/customer/customer.get";

export const fetchFeedbacks = async () => {
  const res = await getAllFeedbacks();
  return res;
}

export const useGetAllFeedbacks = () => {
  return useQuery({
    queryKey: ["get-all-feedbacks"],
    queryFn: fetchFeedbacks,
    placeholderData: keepPreviousData,
  });
}