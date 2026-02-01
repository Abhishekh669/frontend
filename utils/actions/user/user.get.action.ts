'use server'

import { getErrorMessage } from "@/utils/helper/get-error-message"
import { ActionResponse } from "../auth/login.action";
import { get_cookies } from "@/utils/helper/get-cookies";
import axios from "axios";
import { QueryType } from "@/components/rms/client-management/client-management-page";
import { DashboardCounts, User } from "@/utils/types/user.types";

export const getAllUsers = async(options : QueryType) =>{
    console.log("thisis hte optosn s : ",options)
    const {page = 0, limit = 20, search = "", oldestFirst = false}  = options
    try {
         const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("user not authorized")
        }
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-all-users`, {
            params: {
          offset  : page,
          limit,
          search,
          oldestFirst,
        },
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true

        })

        const data = res.data;

        console.log("thisis hte log data for the users : ",data?.data)
        if(!data?.success){
            throw new Error(data?.error)
        }

        var user_stats  : DashboardCounts = data?.data?.user_data;

        return {
            success : true,
            users : data?.data?.users as User[]|| [],
            total : data?.data?.total || 0,
            has_more : data?.data?.has_more || false,
            next_offset : data?.data?.next_offset || 0,
            user_stats 
        }


    } catch (error) {
        error = getErrorMessage(error)
        throw new Error(error as string)
        
    }
}

export const getUserFromTokenAction = async ()  : Promise<ActionResponse>=>{
    try {
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("user not authorized")
        }
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-user-from-token`, {

            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true

        })
        const data = res.data;

        if (!data.success) {
            throw new Error(data.error)
        }


        return {
            success: true,
            data: data.user,
        }

    } catch (error) {
        error = getErrorMessage(error);
       throw new Error(error as string)
    }
}