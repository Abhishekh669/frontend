'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import axios from "axios"

export const createFoodCategory = async(name : string)=>{
    const token = await get_cookies("user_token")
    const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/create-category`,{
        category_name : name
    },{
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            })

            const data = res.data;
            return data;
}