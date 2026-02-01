'use server'

import { UpdateUserType } from "@/utils/types/user.types"
import { ActionResponse } from "../auth/login.action"
import { get_cookies } from "@/utils/helper/get-cookies"
import axios from "axios"
import { getErrorMessage } from "@/utils/helper/get-error-message"


export const UpdateUser  = async(userData : UpdateUserType) : Promise<ActionResponse> =>{
    try {

        if(userData.id == "" || userData.email === ""  || userData.name === "" || userData.phone === "") throw new  Error("all the fields are necessary")  
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("unauthorized user")
        }
        const updatedData : UpdateUserType = {
            id : userData.id,
            name : userData.name,
            email : userData.email,
            phone : userData.phone,
            gender : userData.gender,
            role : userData.role,
            salary : userData.salary,
            image : userData.image || null,
            is_active : userData.is_active || false,
        }
      
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/user-service/update-user`,
            updatedData,
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
