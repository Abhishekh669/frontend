'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import axios from "axios"

export const deleteTables = async (tableIds : string[]) =>{
    try {
        if (tableIds.length < 1) {
            throw new Error("no raw materials selected")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/table-service/delete-tables`,
            {
                table_ids  : tableIds
            },
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || `failed to delete ${tableIds.length > 0 ? "raw materials" : "raw material"}`)
        }

        return {
            success: true,
            message: data?.message || ` deleted ${tableIds.length} ${tableIds.length > 0 ? "raw  materials" : "raw material"} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)


    }
}
