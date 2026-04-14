import GenerateBillsManagementPage from '@/components/rms/cashier/generate-bills/generate-bill-management'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';
import { redirect } from 'next/navigation';
export const dynamic = "force-dynamic";
async function GenerateBillPage() {
 
    const data = await getUserFromTokenAction();
    if(!data?.success || !data?.data){
      redirect("/login")
    }
      const user = data.data as   User
      if (!hasPermission(user.role, "view:cashier")) {
        return redirect("/");
      }
  return <GenerateBillsManagementPage  user={user}/>
}

export default GenerateBillPage
