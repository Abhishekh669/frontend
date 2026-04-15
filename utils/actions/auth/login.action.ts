"use server"
import { delete_cookie, get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";
import { cookies } from "next/headers";
import { success } from "zod";

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
        return {
            success: false,
            error: String(error)
        }
    }
}




export const updatePasswordAction = async (oldPassword : string, newPassword : string) => {
    try {
             const user_token = await get_cookies("user_token")
                if (!user_token) {
                    throw new Error("unauthorized user")
                }
        
        const response = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/update-user-password`, {
            new_password : newPassword,
            old_password : oldPassword
        }, {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            })
        const data = response.data;

        if (!data?.success) {
            throw new Error(data?.error || "Failed to update password");
        }
        const status = delete_cookie("user_token")
        if(!status){
            console.error("Failed to delete user token cookie after password update");
        }

        return {
            success: true,
            message: data?.message || "Password updated successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            return {
                success: false,
                error: String(error)
            }
    }
}

export const createForgetPassword = async (email : string) =>{
    try {
        const response = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/create-forget-password-session`, {
            email
        })
        const data = response.data;

        const token = data?.token;
        if (!data?.success || !token) {
            throw new Error(data?.error || "Failed to create forget password session");
        }

        return {
            success: true,
            token,
            message: data?.message || "Forget password session created successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            return {
                success: false,
                error: String(error)
            }
    }
}


export const getForgetPasswordSession = async(email : string, token : string) => {
    try {
         const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-forget-password-session?email=${email}&token=${token}`)
            const data = res.data;
            console.log("thisish te data in getforget password sesison : ", data)
            const session = data?.session;
        if (!data?.success || !session) {
            throw new Error(data?.error || "Failed to create forget password session");
        }

        return {
            success: true,
            message: data?.message || "Forget password session created successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            console.log("Error in getForgetPasswordSession: ", error);
            throw new Error(error as string)
    }
}


export interface CheckForgetPasswrodType {
    
    email: string;
    pin : string;
    token : string;
    new_password : string;
}
export const checkForgetPasswordPin = async (checkindata : CheckForgetPasswrodType) => {
    try {
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/check-forget-password-pin`, {
            email: checkindata.email,
            token: checkindata.token,
            pin: checkindata.pin,
            new_password: checkindata.new_password
        })
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "Failed to verify pin");
        }

        return {
            success: true,
            message: data?.message || "Pin verified successfully"
        }
    } catch (error) {
            error = getErrorMessage(error);
            throw new Error(error as string)
    }
}