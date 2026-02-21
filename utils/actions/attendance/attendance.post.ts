"use server"

import axios from "axios"
import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { CreateAttendanceLeave } from "@/utils/types/attendance.types"


export const createLeaveReqeust = async (
  req: CreateAttendanceLeave
) => {
  try {
    if (!req?.start_date || !req?.end_date) {
      throw new Error("start_date and end_date are required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.post(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave`,
      {
        employee_id : req.employee_id,
        start_date: req.start_date,
        end_date: req.end_date,
        message: req.message,
      },
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

    return {
      success: data.success,
      message: data?.message || "leave request created successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    throw new Error(error as string)
  }
}


export const checkOutEmployee = async (employee_id : string) => {
    try {
        if(!employee_id) {
            throw new Error("employee id is required")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/check-out`,
            {
                employee_id
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
            throw new Error(data?.error || `failed to check out employee with id ${employee_id}`)
        }

        return {
            success: data.success,
            message: data?.message || ` checked out employee with id ${employee_id} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}




export const checkInEmployee = async (employee_id : string) => {
    try {
        if(!employee_id) {
            throw new Error("employee id is required")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/check-in`,
            {
                employee_id
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
            throw new Error(data?.error || `failed to check in employee with id ${employee_id}`)
        }

        return {
            success: data.success,
            message: data?.message || ` checked in employee with id ${employee_id} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}