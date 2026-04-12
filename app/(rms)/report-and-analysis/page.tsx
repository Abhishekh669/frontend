import ReportAndAnalysisManagementPage from '@/components/rms/report-n-analysis/report-n-analysis-management-page'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';
export const dynamic = "force-dynamic";
async function page() {
  const data = await getUserFromTokenAction();
        if(!data.data) {
          return null;
        }
        const user = data.data as User
        if(!hasPermission(user.role, "view:reports" )){
          return null;
        }
  return <ReportAndAnalysisManagementPage  user={user}/>
}

export default page
