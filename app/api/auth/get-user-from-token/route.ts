'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";
import { NextResponse } from "next/server"

export async function GET(req: Request) {
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
        return NextResponse.json({ ...data }, { status: 200 })
    } catch (error) {
        error = getErrorMessage(error)
        return NextResponse.json({ error, success: false }, { status: 400 })
    }
}