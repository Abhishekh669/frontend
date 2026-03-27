'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { AttendanceUpdate, UpdateAttendanceLeave } from "@/utils/types/attendance.types"
import axios from "axios"


export const acceptAttendanceLeaveRequestByAdmin = async(leave_id : string) =>{
    try {
    if (!leave_id) {
      throw new Error("leave id is required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.patch(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave/accept-by-admin/${leave_id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data
    if (!data?.success) {
      throw new Error(data?.error || "failed to cancel leave request")
    }

    return {
      success: data.success,
      message: data?.message || "leave request cancelled successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    return {
      success : false,
      error ,
    }
  }
 
}


export const cancelLeaveRequestByAdmin = async(leave_id : string) =>{
    try {
    if (!leave_id) {
      throw new Error("leave id is required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.patch(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave/reject-by-admin/${leave_id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data
    if (!data?.success) {
      throw new Error(data?.error || "failed to cancel leave request")
    }

    return {
      success: data.success,
      message: data?.message || "leave request cancelled successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    return {
      success : false,
      error 
    }
  }
 
}

export const cancelLeaveRequest = async (leave_id: string) => {
  try {
    if (!leave_id) {
      throw new Error("leave id is required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.patch(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave/${leave_id}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data
    if (!data?.success) {
      throw new Error(data?.error || "failed to cancel leave request")
    }

    return {
      success: data.success,
      message: data?.message || "leave request cancelled successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    throw new Error(error as string)
  }
}

export const updateLeaveRequest = async (
  req: UpdateAttendanceLeave
) => {
  try {
    if (!req?.id) {
      throw new Error("leave id is required")
    }

    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.put(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/leave`,
      req,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data
    if (!data?.success) {
      throw new Error(data?.error || "failed to update leave request")
    }

    return {
      success: data.success,
      message: data?.message || "leave request updated successfully",
    }
  } catch (error) {
    error = getErrorMessage(error)
    throw new Error(error as string)
  }
}


export const updateAttendance = async(attendance : AttendanceUpdate)=>{

    try {

       
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("unauthorized user")
        }
       
      
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/update`,
            attendance,
            {
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        }
        )
        const data =res.data;
        console.log("thisis htedata of update attendance : ",data)
        if(!data?.success){
            throw new Error(data?.error || "failed to update attendance ")
        }

        return {
            success : true,
            message : data?.message ||  " attendance updated successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }

}