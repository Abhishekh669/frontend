import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { get_cookies } from "@/utils/helper/get-cookies";
import { RawMaterialStatistic } from "@/utils/types/raw-materials.types";
import { getErrorMessage } from "@/utils/helper/get-error-message";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ Query params with defaults
    const page = Number(searchParams.get("page") ?? 0);
    const limit = Number(searchParams.get("limit") ?? 20);
    const search = searchParams.get("search") ?? "";
    const oldFirst = searchParams.get("oldFirst") === "true";
    const startingPrice = Number(searchParams.get("startingPrice") ?? 0);
    const endingPrice = Number(searchParams.get("endingPrice") ?? 100_000_000);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");


    // ✅ Get auth token from cookies
    const userToken = await get_cookies("user_token")

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "User not authorized" },
        { status: 401 }
      );
    }

    // ✅ Call backend service
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/raw-material-service/get-raw-materials`,
      {
        params: {
         page,
          limit,
          search,
          oldFirst,
          startingPrice,
          endingPrice,
          fromDate,
          toDate,
        },
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        withCredentials: true,
      }
    );

    const data = res.data;

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch raw materials" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data  : data?.data
    });
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
