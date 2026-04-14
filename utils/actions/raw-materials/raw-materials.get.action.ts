'use server'

import axios from "axios"
import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { RawMaterialStatistic, RawMaterialType } from "@/utils/types/raw-materials.types"
import { RawMaterialQuery } from "@/components/rms/raw-materials/raw-material-management"

export const getRawMaterials = async(query : RawMaterialQuery) =>{
    const {page = 0, limit = 20, search = "", oldFirst = false, startingPrice = 0, endingPrice = 100_000_000, fromDate  , toDate}  = query
    try {
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("user not authorized")
        }
        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/raw-material-service/get-raw-materials`,{
            params : {
                offset : page,
                limit,
                search,
                oldFirst,
                startingPrice,
                endingPrice,
                fromDate,
                toDate
            },
              headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        })

        const data = res.data;
        if(!data?.success){
            throw new Error(data?.error)
        }

        var raw_materials_stats  : RawMaterialStatistic = data?.data.raw_materials_stats;

        return {
            success : true,
            raw_materials : data?.data?.raw_materials as RawMaterialType[] || [],
            total : data?.data?.total || 0,
            has_more : data?.data?.has_more || false,
            next_offset : data?.data?.next_offset || 0,
            raw_materials_stats,
        }

    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}