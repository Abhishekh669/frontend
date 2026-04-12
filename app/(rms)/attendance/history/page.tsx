import HistoryPage from '@/components/rms/attendance/history/history-page'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';

async function page() {
  const data = await getUserFromTokenAction();
    if (!data.data) {
      return null;
    }
    const user = data.data as User
    if (!hasPermission(user.role, "view:attendance")) {
      return null;
    }
  return (
   <HistoryPage />
  )
}

export default page
