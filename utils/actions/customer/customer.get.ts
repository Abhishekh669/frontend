

'use server'

import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";
import { cookies } from "next/headers";

 type ReqStatus = "not_found" | "not_approved" | "approved"
export const getApprovalRequestsFromPhoneNTableNum = async (tableNumber: number, phone: string) => {
    try {
        if (!tableNumber || !phone) {
            throw new Error("invalid payload")
        }

        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-table-validation-by-phone-n-number?phone=${phone}&table_number=${tableNumber}`)
        const data = res.data;
        console.log("thisis hte data of thevalidaiotn in tbale in server : ", data)
         const token = data?.token;
        const status : ReqStatus = data?.status;
        if (!data?.success || status === "not_found" ) {
            throw new Error(data?.error || "failed to get reqeusts")
        }
       

        if (token && status === "approved"){
            const cookieStore = await cookies();
            cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/"
        })
        return {
            success : true,
            status ,
            message : data?.message || "request is approved"
        }

        }
        return {
            success : data?.success,
            status : data?.status || "not_approved",
            message : data?.message || "request is not approved"
        }
      
    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
    }
}