'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message"
import axios from "axios";


export const refreshCachedData = async () =>{
    try {
          const user_token = await get_cookies("user_token");
        if (!user_token) throw new Error("unauthorized user");
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/report-service/default/refresh`, {

            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true

        })

        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to get order history")
        }

       
        return {
            success  : true,
            message : data?.message || "successfully refreshed data"
        }
    } catch (error) {
        return {
            success : false,
            message : getErrorMessage(error) || "failed to refresh data"
        }
    }
}