'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { UpdateTable } from "@/utils/types/table.types"
import axios from "axios"

export const updateTable = async(table  : UpdateTable ) =>{
    try {
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/table-service/update-table`,
           table,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || `failed to update table `)
        }
        return {
            success: true,
            message: data?.message || "table updated  successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}