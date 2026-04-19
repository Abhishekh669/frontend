'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";

interface RecommendationBackendResponse {
    success?: boolean;
    menu_item_ids?: unknown;
}

export interface RecommendationMenuItemsResponse {
    success: boolean;
    recommended_menu_item_ids: string[];
    error?: string;
}

export const getRecommenedeMenuItems = async (menu_items : string[]) => {
    try {
        const session_token = await get_cookies("session_token");

        if (!session_token) throw new Error("user not authorized");

        const res = await axios.post(
            `${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-recommendation-menu`,{
                selected_menu_item_ids : menu_items,
                limit : 10,
            },
            {
                headers: {
                    Cookie: `session_token=${session_token}`,
                },
            }
        );
        const data: RecommendationBackendResponse = res.data;
        if(!data?.success){
            throw new Error("user not authorized")
        }

        const recommended_menu_item_ids: string[] = Array.isArray(data?.menu_item_ids)
          ? data.menu_item_ids
              .map((id) => (typeof id === "string" || typeof id === "number" ? String(id).trim() : ""))
              .filter(Boolean)
          : [];
        return {
            success : data?.success as boolean,
            recommended_menu_item_ids,
        } satisfies RecommendationMenuItemsResponse;

    } catch (error) {
        const errMsg = getErrorMessage(error)
       return {
        success : false,
        recommended_menu_item_ids: [],
        error : errMsg 
       } satisfies RecommendationMenuItemsResponse;
    }
}