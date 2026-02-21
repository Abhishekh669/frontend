import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { AttendanceData, AttendanceHistoryData, AttendanceHistoryResponse, AttendanceHistoryStats, CurrentAttendance } from "@/utils/types/attendance.types";

export async function GET(req: NextRequest) {
  try {
    const userToken = await get_cookies("user_token");

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "User not authorized" },
        { status: 401 }
      );
    }

    // ✅ Get query params from request
    const { searchParams } = new URL(req.url);

    console.log("this is search pages ", searchParams)

    const limit = searchParams.get("limit") || "5";
    const page = searchParams.get("page") || "0";
    const startingDate = searchParams.get("startingDate") || "";
    const endingDate = searchParams.get("endingDate") || "";
    const employee_id = searchParams.get("employee_id") || ""

    console.log("this is params : ",   {
          limit,
          page,
          startingDate,
          endingDate,
        },)

    // ✅ Forward query params to backend
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/history`,
      {
        params: {
          limit,
          page,
          startingDate,
          endingDate,
          employee_id
        },
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data  = res.data;
    const attendanceHistoryResponse : AttendanceHistoryResponse = data?.history || {}
    const attendanceHistory : AttendanceHistoryData[] = attendanceHistoryResponse ? attendanceHistoryResponse.data  : [];
    const attendanceStats : AttendanceHistoryStats = attendanceHistoryResponse?.stats || {}

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch attendance history" },
        { status: 400 }
      );
    }


    return NextResponse.json(
      {
        success: true,
        attendanceHistory : attendanceHistory,
        attendanceStats : attendanceStats,
        total : attendanceHistoryResponse.total || 0,
        page : attendanceHistoryResponse.page || 0,
        limit : attendanceHistoryResponse.limit || 0,
        hasMore : attendanceHistoryResponse.hasMore || false,
        nextPage : attendanceHistoryResponse.nextPage || 0
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || "Internal server error",
      },
      { status: 500 }
    );
  }
}