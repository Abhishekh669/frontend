import GenerateBillsManagementPage from '@/components/rms/cashier/generate-bills/generate-bill-management'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';
import { redirect } from 'next/navigation';

async function GenerateBillPage() {
  const data = await getUserFromTokenAction();
      if (!data.data) {
        return null;
      }
      const user = data.data as   User
      if (!hasPermission(user.role, "view:cashier")) {
        return redirect("/");
      }
  return <GenerateBillsManagementPage  user={user}/>
}

export default GenerateBillPage
