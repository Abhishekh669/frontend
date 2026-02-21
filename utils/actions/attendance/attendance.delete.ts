'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import axios from "axios"

export const deleteLeaveRequest = async (leave_id: string) => {
  try {
    if (!leave_id) {
      throw new Error("leave id is required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.delete(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave/${leave_id}`,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data
    if (!data?.success) {
      throw new Error(data?.error || "failed to delete leave request")
    }

    return {
      success: data.success,
      message: data?.message || "leave request deleted successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    throw new Error(error as string)
  }
}

export const deleteAttendanceById = async (attendance_id : string) => {
    try {
        if(!attendance_id) {
            throw new Error("attendance id is required")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }       
        const res = await axios.delete(`${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/delete/${attendance_id}`,
            {
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || `failed to delete attendance with id ${attendance_id}`)
        }

        return {
            success: data.success,
            message: data?.message || ` deleted attendance with id ${attendance_id} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }       
}