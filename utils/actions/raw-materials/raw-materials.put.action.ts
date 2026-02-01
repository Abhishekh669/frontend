'use server'

import { UpdateRawMaterialType } from "@/utils/types/raw-materials.types"
import { ActionResponse } from "../auth/login.action"
import { get_cookies } from "@/utils/helper/get-cookies"
import axios from "axios"
import { getErrorMessage } from "@/utils/helper/get-error-message"



export const UpdateRawMaterials  = async(rawData : UpdateRawMaterialType) : Promise<ActionResponse> =>{
    try {

        if(rawData.id == "" || rawData.name === ""  || rawData.price < 0 || rawData.quantity < 0) throw new  Error("all the fields are necessary")  
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("unauthorized user")
        }
        
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/raw-material-service/update-raw-material`,
            rawData,
            {
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        }
        )
        const data =res.data;
        console.log("thisis htedata of update user : ",data)
        if(!data?.success){
            throw new Error(data?.error || "failed to update user")
        }

        return {
            success : true,
            message : data?.message ||  " user successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}
