import {  NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";

export async function GET() {
  try {
   

    // ✅ Call backend service
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/get-all-menu-items`,
    );

    const data = res.data;

    console.log("this is the resposne in get all emnu by gorupded: ", data)

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch food category" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: data.success,
      grouped_menu  : data?.data 
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
