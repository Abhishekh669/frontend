'use server'

import { get_cookies } from "@/utils/helper/get-cookies";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { AddRawMaterialsList, addRawMaterialsListSchema } from "@/utils/schema/raw-material.schema";
import axios from "axios";
import { ActionResponse } from "../auth/login.action";






export const DeleteRawMaterials = async (userIds: string[]): Promise<ActionResponse> => {
    try {
        if (userIds.length < 1) {
            throw new Error("no raw materials selected")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/raw-material-service/delete-raw-materials`,
            {
                raw_materials_ids : userIds
            },
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || `failed to delete ${userIds.length > 0 ? "raw materials" : "raw material"}`)
        }

        return {
            success: true,
            message: data?.message || ` deleted ${userIds.length} ${userIds.length > 0 ? "raw  materials" : "raw material"} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)


    }
}



export const createRawMaterials = async (rawData: AddRawMaterialsList) => {
    console.log("this is data : ", rawData)
    try {
        const result = addRawMaterialsListSchema.safeParse(rawData)

        if (!result.success) {
            throw new Error("invalid input")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/raw-material-service/create-raw-materials`,
            {
                raw_materials: rawData.materials
            },
            {
                headers: {
                    Authorization: `Bearer ${user_token}`,
                },
                withCredentials: true
            }
        )
        const data = res.data;
        if (!data?.success) {
            throw new Error(data?.error || "failed to create user")
        }

        return {
            success: true,
            message: data?.message || "created user successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)

    }
}