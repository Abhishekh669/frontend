import RawMaterialManagement from '@/components/rms/raw-materials/raw-material-management'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { User } from '@/utils/types/user.types';

async function page() {
   const data = await getUserFromTokenAction();
    if(!data.data) {
      return null;
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
