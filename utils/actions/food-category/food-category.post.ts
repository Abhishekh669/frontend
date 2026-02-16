'use server'

import { get_cookies } from "@/utils/helper/get-cookies"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import { CreateMenuItems, } from "@/utils/types/food-category.types"
import axios from "axios"
export interface NewCatType {
    category_name: string
    slug_path: string[]
}

export const DeleteMenuItems = async (menuItemIds: string[]) => {
    try {
        console.log("this is menu item ids to delete : ", menuItemIds)
        if (menuItemIds.length < 1) {
            console.log("no menu items selected. lol")
            throw new Error("no menu items selected")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        console.log("this is menu ids s : ", menuItemIds)

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/delete-menu-items`,
            {
                menu_items_ids: menuItemIds
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
            throw new Error(data?.error || `failed to delete ${menuItemIds.length > 0 ? "menu items" : "menu item"}`)
        }

        return {
            success: true,
            message: data?.message || ` deleted ${menuItemIds.length} ${menuItemIds.length > 0 ? "menu items" : "menu item"} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)
    }
}






export const DeleteCategories = async (categoriesIds: string[]) => {
    try {
        if (categoriesIds.length < 1) {
            throw new Error("no categories selected")
        }
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("unauthorized user")
        }

        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/delete-categories`,
            {
                category_ids: categoriesIds
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
            throw new Error(data?.error || `failed to delete ${categoriesIds.length > 0 ? "categories" : "category"}`)
        }

        return {
            success: true,
            message: data?.message || ` deleted ${categoriesIds.length} ${categoriesIds.length > 0 ? "categories" : "category"} successfully`
        }
    } catch (error) {
        error = getErrorMessage(error);
        throw new Error(error as string)


    }
}



export const createMenuItems = async (catData: CreateMenuItems) => {
    try {
        if (catData.menu_items.length < 1) throw new Error("no menu item to create")
        const token = await get_cookies("user_token")
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/create-menu-items`, catData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        })

        const data = res.data;
        console.log("this is data after adding menu items: ", data)
        if (!data.success) throw new Error(data?.error || "failed to create menu items")
        return {
            success: data.success,
            message: data?.message || "created menu items successfully"
        }
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const createFoodCategory = async (newCat: NewCatType) => {
    try {
        console.log("this is the new food cateogyr : ", newCat)
        const token = await get_cookies("user_token")
        const res = await axios.post(`${process.env.NEXT_BACKEND_URL}/api/v1/food-category-service/create-category`, newCat, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        })

        const data = res.data;
        console.log("this is data : ", data)
        if (!data.success) throw new Error(data?.error || "failed to create category")
        return {
            success: data.success,
            message: data?.message || "created category successfully"
        }
    } catch (error) {

        throw new Error(getErrorMessage(error))
    }

}
