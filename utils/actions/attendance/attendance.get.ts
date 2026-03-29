'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { AttendanceLeaveByUserResponse, AttendanceLeaveResponse } from "@/utils/types/attendance.types";
import axios from "axios";

export const getAllAttendanceLeaveRequestHistory = async () => {
  try {


    const user_token = await get_cookies("user_token")
    if (!user_token) {
      throw new Error("unauthorized user")
    }

    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/get-attendance-leave-history`,
      {
        headers: {
          Authorization: `Bearer ${user_token}`,
        },
        withCredentials: true,
      }
    )

    const data = res.data;

    if (!data?.success) {
      throw new Error(data?.error || "error occurred");
    }

    // Transform backend response to match frontend types
    const attendance_leaves = data?.attendance_leaves;

    if (!attendance_leaves) throw new Error("No data received");

    return {
      success: true,
      attendance_leave_data: {
        requests: attendance_leaves.requests || [],
        total: attendance_leaves.total || 0,
        has_more: attendance_leaves.has_more || false,
        next_offset: attendance_leaves.next_offset || 0,
        stats: attendance_leaves.stats || {
          total_requests: 0,
          pending_requests: 0,
          approved_requests: 0,
          rejected_requests: 0,
        }
      } as AttendanceLeaveByUserResponse
    };
  } catch (error) {
    const errMsg = getErrorMessage(error)
    throw new Error(errMsg)

  }
}


export const getAllAttendanceLeaveRequest = async () => {
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
    const attendance_leave: AttendanceLeaveResponse[] = data?.attendance_leave || []

    return {
      success: data.success as boolean,
      attendance_leave
    }
  } catch (error) {
    const errMsg = getErrorMessage(error)
    throw new Error(errMsg)

  }
}