'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { UpdateCategoryType, UpdateMenuItemType } from "@/utils/types/food-category.types"
import axios from "axios"

export const updateFoodCategory = async(category : UpdateCategoryType) =>{
    try {

        if(category.id == "" || category.name === "") throw new  Error("all the fields are necessary")  
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("unauthorized user")
        }

        console.log("thisish te update food cateogyr : ", category)
       
      
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/update-category`,
            category,
            {
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        }
        )
        const data =res.data;
        console.log("thisis htedata of update category : ",data)
        if(!data?.success){
            throw new Error(data?.error || "failed to update category")
        }

        return {
            success : true,
            message : data?.message ||  " category updated successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}


export const updateMenuItem = async(menuItem : UpdateMenuItemType) =>{
    try {

        if(menuItem.id == "" || menuItem.name === "") throw new  Error("all the fields are necessary")  
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("unauthorized user")
        }
      
      
        const res = await axios.put(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/update-menu-item`,
            menuItem,
            {
            headers: {
                Authorization: `Bearer ${user_token}`,
            },
            withCredentials: true
        }
        )
        const data =res.data;
        console.log("thisis htedata of update menu item  : ",data)
        if(!data?.success){
            throw new Error(data?.error || "failed to update menu item")
        }

        return {
            success : true,
            message : data?.message ||  "menu item updated successfully"
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}