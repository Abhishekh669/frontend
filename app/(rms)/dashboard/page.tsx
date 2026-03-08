import { getUserFromTokenAction } from "@/utils/actions/user/user.get.action";
export const dynamic = "force-dynamic";

async function page() {
    const res = await getUserFromTokenAction();
    console.log("User data on dashboard:", res);
    if(!res.success || !res.data) {
      return <div>failed to get user data</div>
    };
  return (
    <div>
      this is dashboard
    </div>
  )
}

export default page
