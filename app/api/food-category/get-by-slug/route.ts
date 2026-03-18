import { NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";

export async function GET(req: Request) {

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug") || "";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log("this is request in route ", slug)
    const userToken = await get_cookies("user_token")

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "User not authorized" },
        { status: 401 }
      );
    }

    // ✅ Call backend service
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/get-food-by-slug`,
      {
        params : {
          slug
        },
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;

    console.log("this is the resposne in get all categoreis by slug : ", data)

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch food category " },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: data.success,
      menu_items : data?.menu_items || [],
    }, {status : 200});
  } catch (error: any) {
    console.log("this is error : ",getErrorMessage(error))
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || "Internal server error",
      },
      { status: 500 }
    );
  }
}
