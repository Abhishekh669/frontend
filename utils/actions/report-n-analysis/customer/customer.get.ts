'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { NewCustomRangeCustomerResponse, NewCustomRangeRevenueResponse, NewDefaultCustomerResponse, NewDefaultRevenueResponse } from "@/utils/types/report-n-analysis.types";
import axios from "axios";

export interface CustomQuery {
    limit : number;
    page : number;
    start_date : string;
    end_date : string;
}


export const getCustomDateRangeCustomerReport  = async (query : CustomQuery) => {
    try {
        const user_token = await get_cookies("user_token");
        if (!user_token) throw new Error("unauthorized user");
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/report-service/customer-custom?limit=${query.limit}&page=${query.page}&from=${query.start_date}&to=${query.end_date}`, {

            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true

        })

        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to get order history")
        }

        const report  : NewCustomRangeCustomerResponse = data?.report;
        return {
            success  : true,
            report,
        }
    } catch (error) {
        throw new Error(getErrorMessage(error) || "Failed to fetch default revenue report")
    }
}

export const getDefaultCustomerReport = async () => {
    try {
        const user_token = await get_cookies("user_token");
        if (!user_token) throw new Error("unauthorized user");
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/report-service/customer-default`, {

            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true

        })

        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to get order history")
        }

        const report : NewDefaultCustomerResponse = data?.report;
        return {
            success  : true,
            report,
        }
    } catch (error) {
        throw new Error(getErrorMessage(error) || "Failed to fetch default revenue report")
    }
}