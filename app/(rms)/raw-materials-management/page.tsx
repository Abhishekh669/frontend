import RawMaterialManagement from '@/components/rms/raw-materials/raw-material-management'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';
import { redirect } from 'next/navigation';
export const dynamic = "force-dynamic";
async function page() {
    const data = await getUserFromTokenAction();
   if(!data?.success || !data?.data){
       redirect("/login")
    }
    const user = data.data as User
    if(!hasPermission(user.role, "view:raw_materials" )){
      return null;
    }
  return (
    <RawMaterialManagement  user={user}/>
  )
}

export default page
