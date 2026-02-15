"use server"
import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";
import { cookies } from "next/headers";

export interface ActionResponse<T = any> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export const loginAction = async (email: string, password: string): Promise<ActionResponse> => {
    try {
        const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/login-user`, {
            email, password
        })
        const data = response.data;

        const token = data.token;

        if (!token || !data?.success) {
            throw new Error(data?.error || "Login failed");
        }


        const cookieStore = await cookies();
        cookieStore.set("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/"
        })

        return {
            success: true,
            message: data?.message || "login successfull"
        }

    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}