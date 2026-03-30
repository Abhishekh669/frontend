'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { CreatePayment } from "@/utils/types/payment.types"
import axios from "axios"

export const createPayment = async(paymentData : CreatePayment) =>{
    try {
         
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }


        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/payment-service/create`,
           paymentData,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || 'failed to create payment')
        }
        

        return {
            success: true,
            message: data?.message || 'Payment created successfully'
        }
    } catch (error) {
        return {
            success : false,
            error : getErrorMessage(error)
        }
    }
}