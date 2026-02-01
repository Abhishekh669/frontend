import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { get_cookies } from "@/utils/helper/get-cookies";
import { DashboardCounts } from "@/utils/types/user.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ Query params with defaults
    const page = Number(searchParams.get("page") ?? 0);
    const limit = Number(searchParams.get("limit") ?? 20);
    const search = searchParams.get("search") ?? "";
    const oldestFirst = searchParams.get("oldestFirst") === "true";

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
      `${process.env.NEXT_BACKEND_URL}/api/v1/user-service/get-all-users`,
      {
        params: {
          offset: page,
          limit,
          search,
          oldestFirst,
        },
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;

    console.log("this is data in server in api : ", data)

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch users" },
        { status: 400 }
      );
    }

    let user_stats : DashboardCounts = data?.data?.user_data;

    return NextResponse.json({
      success: true,
      users: data?.data?.users ?? [],
      total: data?.data?.total ?? 0,
      has_more: data?.data?.has_more ?? false,
      next_offset: data?.data?.next_offset ?? 0,
      user_stats
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
