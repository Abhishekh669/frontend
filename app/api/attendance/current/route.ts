import {  NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { CurrentAttendance } from "@/utils/types/attendance.types";

export async function GET() {
  try {
    const userToken = await get_cookies("user_token")

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "User not authorized" },
        { status: 401 }
      );
    }

    // ✅ Call backend service
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/attendance-service/current`,
      {
        
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;

    console.log("this is the response in attendance current : ", data)

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch current attendance" },
        { status: 400 }
      );
    }

    const currentAttendance : CurrentAttendance = data?.data;

    return NextResponse.json({
      success: data.success,
      stats :  currentAttendance.stats,
        employees : currentAttendance.employees
    }, {status : 200});
  } catch (error: any) {
    console.log(getErrorMessage(error))
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || "Internal server error",
      },
      { status: 500 }
    );
  }
}
