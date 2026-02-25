import {  NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";

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
      `${process.env.NEXT_BACKEND_URL}/get-menu-n-categories`);

    const data = res.data;

    console.log("this is the resposne in menu cache : ", data)

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch food category" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: data.success,
      categories  : data?.categories,
      category_children : data?.category_children,
      menu_items : data?.menu_items,
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
