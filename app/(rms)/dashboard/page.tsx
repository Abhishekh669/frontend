import { getUserFromTokenAction } from "@/utils/actions/user/user.get.action";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

async function page() {
    const res = await getUserFromTokenAction();
    console.log("User data on dashboard:", res);
    if(!res.success || !res.data) {
      redirect("/login")
    };
  return (
    <div>
      this is dashboard
    </div>
  )
}

export default page
