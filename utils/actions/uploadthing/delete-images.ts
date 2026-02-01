"use server"
import { UTApi } from "uploadthing/server";
import { getUserFromTokenAction } from "../user/user.get.action";
import { UploadPermissions } from "@/app/api/uploadthing/core";


const utapi = new UTApi();


export const removeMultipleImages = async (imageUrls: string[]) => {
    try {
        const data = await getUserFromTokenAction();
        if (!data || !data.success) {
            throw Error("Unauthorized");
        }

        const user = data.data;
        if (!user) {
            throw new Error("unauthorized")
        }
        if (!UploadPermissions.includes(user.role)) {
            throw new Error("unauthorized")
        }
        const keys = imageUrls.map(url => {
            const parts = url.split('/');
            return parts[parts.length - 1];
        });

        const deleteResult = await utapi.deleteFiles(keys);
        if (!deleteResult) {
            throw new Error("Failed to delete images")
        }

        console.log("imags deleted succssuflly")
        return {
            message: "Images deleted successfully",
            success: true
        }
    } catch (error) {
        console.log("error in deleting image : ", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Something went wrong",
        }

    }
}