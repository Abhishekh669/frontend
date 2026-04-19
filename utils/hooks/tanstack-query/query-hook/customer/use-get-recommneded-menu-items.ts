import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getRecommenedeMenuItems,
  RecommendationMenuItemsResponse,
} from "@/utils/actions/algo/algo.get";

export const fetchRecommendedItems = async (menu_items : string[]) => {
  const res = await getRecommenedeMenuItems(menu_items);
  return res as RecommendationMenuItemsResponse;
}

export const useGetRecommendationMenuItems = (menu_items : string[]) => {
  return useQuery({
    queryKey: ["get-recommended-menu-items", menu_items],
    queryFn: () => fetchRecommendedItems(menu_items),
    placeholderData: keepPreviousData,
  });
}