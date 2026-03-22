'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { TableValidationType } from "@/utils/types/table.types";
import axios from "axios";
import { cookies } from "next/headers";

type ReqStatus = "not_found" | "not_approved" | "approved"

export const getTableValidationFromToken = async () => {
    try {
        const session_token = await get_cookies("session_token");
        console.log("this is sesison : ", session_token)

        if (!session_token) throw new Error("user not authorized");

        const res = await axios.get(
            `${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-table-validation-from-token`,
            {
                headers: {
                    Cookie: `session_token=${session_token}`,
                },
            }
        );
        const data = res.data;
        console.log("thisis hte data of table validation :  ", data)
        if(!data?.success){
            throw new Error("user not authorized")
        }

        const table_validation  : TableValidationType = data?.table_validation;
        if(!table_validation.waiter_id){
            throw new Error("order request  not approved")
        }
        return {
            success : data?.success as boolean,
            table_validation ,
        }

    } catch (error) {
        const errMsg = getErrorMessage(error)
       return {
        success : false,
        error : errMsg 
       }
    }
}
export const getApprovalRequestsFromPhoneNTableNum = async (tableNumber: number, phone: string) => {
    try {
        if (!tableNumber || !phone) {
            throw new Error("invalid payload")
        }

        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-table-validation-by-phone-n-number?phone=${phone}&table_number=${tableNumber}`)
        const data = res.data;
        console.log("thisis hte data of thevalidaiotn in tbale in server : ", data)
        const token = data?.token;
        const status: ReqStatus = data?.status;
        if (!data?.success || status === "not_found") {
            throw new Error(data?.error || "failed to get reqeusts")
        }


        if (token && status === "approved") {
            const cookieStore = await cookies();
            cookieStore.set("session_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: "/"
            })
            return {
                success: true,
                status,
                message: data?.message || "request is approved"
            }

        }
        return {
            success: data?.success,
            status: data?.status || "not_approved",
            message: data?.message || "request is not approved"
        }

    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
    }
}