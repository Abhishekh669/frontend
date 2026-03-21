This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Here in this code i want the flow in the following ways 
when the customer request for  approval with the table number and phone number and after successfull submission store those phone number and table number in the local storage  and show the waitign state  ui of beign approved and keep there a state usign usestate whchil will decide which ui to show . 
in the code there is get table by phoen nad number whichi is in pooing state every 5 second which will eqeury the db and 
if the error occur then make the state false which was in watingi state show hte ui of error and if there the success istrue but hte status is not-approved then still make the ste true showing hte ui ste waiting and when the status becomes apporved then sotp the ste ti false and redirect it and suppose if user comes after clong the app again then if there is ddata in lcoal storag of table and phoen numebr then fetch and automaticaly start fetchign data and start the ui to show accoiengl yif there is such dat aeh current ui where user  can create new order reqeurst or equer y their last detials and while if hte user query the last details and if tthere is no locall storgage as amse as the while qeury then update hte local storage too  



'use server'


import { getErrorMessage } from "@/utils/helper/get-error-message";
import axios from "axios";
import { cookies } from "next/headers";


 type ReqStatus = "not_found" | "not_approved" | "approved"
export const getApprovalRequestsFromPhoneNTableNum = async (tableNumber: number, phone: string) => {
    try {
        if (!tableNumber || !phone) {
            throw new Error("invalid payload")
        }


        const res = await axios.get(`${process.env.NEXT_BACKEND_URL}/api/v1/order-service/get-table-validation-by-phone-n-number?phone=${phone}&table_number=${tableNumber}`)
        const data = res.data;
         const token = data?.token;
        const status : ReqStatus = data?.status;
        if (!data?.success || status === "not_found" ) {
            throw new Error(data?.error || "failed to get reqeusts")
        }
       


        if (token && status === "approved"){
            const cookieStore = await cookies();
            cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/"
        })
        return {
            success : true,
            status ,
            message : data?.message || "request is approved"
        }


        }
        return {
            success : data?.success,
            status : data?.status || "not_approved",
            message : data?.message || "request is not approved"
        }
      
    } catch (error) {
        const errMsg = getErrorMessage(error)
        throw new Error(errMsg)
    }
} thisis hte code of the get_table vladiaotn  