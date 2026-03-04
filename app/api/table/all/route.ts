import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const res = await axios.get(
      `${process.env.NEXT_BACKEND_URL}/api/v1/table-service/get-tables`);

    const data = res.data;
    console.log("this isthe data in table management  : ",data)    

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to fetch users" },
        { status: 400 }
      );
    }


    return NextResponse.json({
      success: true,
      tables : data?.tables ?? [],
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
