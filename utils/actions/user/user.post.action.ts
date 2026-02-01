'use server'

import { getErrorMessage } from "@/utils/helper/get-error-message"
import { ActionResponse } from "../auth/login.action"
import { AddUserFormValues, addUserSchema } from "@/utils/schema/user.schema"
import { get_cookies } from "@/utils/helper/get-cookies"
import axios from "axios"

export const createUser = async (userData: AddUserFormValues): Promise<ActionResponse> => {
    try {
        const result = addUserSchema.safeParse(userData)

        if (!result.success) {
            throw new Error("invalid input")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/create-new-user`,
            userData,
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to create user")
        }

        return {
            success: true,
            message: data?.message || "created user successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}


export const DeleteUsers = async (userIds: string[]): Promise<ActionResponse> => {
    try {
        if (userIds.length < 1) {
            throw new Error("no user selected")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/delete-user`,
            {
                userIds
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
            throw new Error(data?.error || `failed to delete ${userIds.length > 0 ? "users" : "user"}`)
        }

        return {
            success: true,
            message: data?.message || ` deleted ${userIds.length} ${userIds.length > 0 ? "users" : "user"} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)


    }
}