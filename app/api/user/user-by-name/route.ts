import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ Query params with defaults
    const userName = searchParams.get("userName");

    if(!userName){
        return;
    }
 

    // ✅ Read token from cookies
    const userToken = await get_cookies("user_token")

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "User not authorized" },
        { status: 401 }
      );
    }

    // ✅ Call backend API
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-users-by-name?userName=${userName}`,
      {
       
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;
    console.log("this isthe data : ",data)    

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch users" },
        { status: 400 }
      );
    }


    return NextResponse.json({
      success: true,
      users: data?.users ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
