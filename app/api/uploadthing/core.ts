import { getUserFromTokenAction } from "@/utils/actions/user/user.get.action";
import { Upload } from "lucide-react";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

export const UploadPermissions = ["admin", "manager"]

const f = createUploadthing();
export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount : 5,
    },
  })
    .middleware(async () => {
      const data = await getUserFromTokenAction();
      if (!data || !data.success) {
        throw new UploadThingError("Unauthorized");
      }

      const user = data.data;
      if(!user){
        throw new UploadThingError("unauthorized")
      }
      if(!UploadPermissions.includes(user.role)){
        throw new UploadThingError("unauthorized")
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;