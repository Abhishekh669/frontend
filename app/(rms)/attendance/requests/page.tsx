import AttendanceRequestsManagement from '@/components/rms/attendance/requests/attendance-request-management';
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action'
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
    <AttendanceRequestsManagement user={user} />
  )
}

export default page
