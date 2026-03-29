'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { CustomerOrderRequest } from "@/utils/types/order.types";
import axios from "axios";


export const getOrdersStatus = async () => {
    try {
         const user_token = await get_cookies("user_token");
        if (!user_token) throw new Error("unauthorized user")
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-orders-status`, {

                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true

            })
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to get reqeusts")
        }
        const order_requests: CustomerOrderRequest[] = data?.order_requests || [];
        return {
            success: true,
            order_requests
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
    }
}



export const getOrderRequestsFromPhoneNTableNum = async (tableNumber: number, phone: string) => {
    try {
        if (!tableNumber || !phone) {
            throw new Error("invalid payload")
        }

        const session_token = await get_cookies("session_token");

        if (!session_token) throw new Error("first get approval")

        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-request-by-table-num-n-phone?phone=${phone}&table_number=${tableNumber}`,
            {
                headers: {
                    Cookie: `session_token=${session_token}`,
                },
            }
        )
        const data = res.data;
        console.log("this is the roder tracking : ", data)
        if (!data?.success) {
            throw new Error(data?.error || "failed to get reqeusts")
        }
        const order_request: CustomerOrderRequest = data?.order_request;
        return {
            success: true,
            order_request
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
    }
}