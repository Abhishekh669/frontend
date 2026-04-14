'use server'

import axios from "axios"
import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { RestaurantSettings } from "@/utils/types/setting.types"

export const getRestaurantInformation = async() =>{
    try {
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("user not authorized")
        }
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/setting-service/restaurant-information`,{
            
              headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        })

        const data = res.data;
        if(!data?.success){
            throw new Error(data?.error)
        }

        var info  : RestaurantSettings = data?.info;

        return {
            success : true,
          info
        }

    } catch (error) {
        console.log("error in fetching restaurant information : ", getErrorMessage(error))
        throw new Error(getErrorMessage(error))
    }
}