'use server'

import { SessionCheckDataType } from "@/components/customer/approve-user/approve-user-page"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { CreateCustomerOrderRequest } from "@/utils/types/order.types"
import axios from "axios"


export const CreateCustomerApprovalRequest = async(sessionData : SessionCheckDataType) =>{
    try {
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/table-approval`, {
            phone : sessionData.phone_number,
            table_number : sessionData.table_number,
        })
        const data = res.data
        if(!data?.success){
            throw new Error(data?.error || "failed to created request")
        }
        return {
            success : data.success,
            message : data?.message || "successfully requested "
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        console.error("error in creating cusotmer order : ", errMsg)
        throw new Error(errMsg)
    }
}


export const createCustomerOrder = async(orderRequest : CreateCustomerOrderRequest) =>{
    try {
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/create-order`, orderRequest)
        const data = res.data
        if(!data?.success){
            throw new Error(data?.error || "failed to create order request")
        }
        return {
            success : data.success,
            message : data?.message || "successfully requested orders"
        }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        console.error("error in creating cusotmer order : ", errMsg)
        throw new Error(errMsg)
    }
}