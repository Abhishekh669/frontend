import SettingManagementPage from '@/components/rms/setting/setting-management-page';
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { User } from '@/utils/types/user.types';
import { redirect } from 'next/navigation';

async function Page() {
  
    const data = await getUserFromTokenAction();
    if(!data?.success || !data?.data){
      redirect("/login")
    }
    const user = data.data as User;

    return <SettingManagementPage user={user} />;
    
  
}

export default Page;