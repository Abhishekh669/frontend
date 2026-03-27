'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message"
import {  AttendanceLeaveResponse } from "@/utils/types/attendance.types";
import axios from "axios";

export const getAllAttendanceLeaveRequest = async () =>{
    try {
       

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/get-all-attendance-leave-requests`,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data

    if (!data?.success) {
      throw new Error(data?.error || "failed to create leave request")
    }
    const attendance_leave : AttendanceLeaveResponse[] = data?.attendance_leave || []

    return {
      success: data.success as boolean,
      attendance_leave 
    }
    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
        
    }
}