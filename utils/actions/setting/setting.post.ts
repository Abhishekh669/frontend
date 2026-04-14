'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { CreateRestaurantSettings } from "@/utils/types/setting.types"
import axios from "axios"

export const createRestaurantInformation = async (info: CreateRestaurantSettings) => {
    try {
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/setting-service/restaurant-information`, info, 
            
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            

        })
        const data = res.data
        if (!data?.success) {
            throw new Error(data?.error || "failed to created request")
        }
        return {
            success: data.success,
            message: data?.message || "successfully requested "
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        console.error("error in creating cusotmer order : ", errMsg)
        throw new Error(errMsg)
    }
}
