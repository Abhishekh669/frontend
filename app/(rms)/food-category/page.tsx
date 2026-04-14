import FoodManagementPage from '@/components/rms/food-category/food-category-management';
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action'
import { hasPermission } from '@/utils/helper/check-permission';
import { FoodCategoryManagementAction } from '@/utils/rbac/role-n-permissiona';
import { User } from '@/utils/types/user.types';
import { redirect } from 'next/navigation';
export const dynamic = "force-dynamic";
async function page() {
  
    const data = await getUserFromTokenAction();
 if(!data?.success || !data?.data){
      redirect("/login")
    }
  const user = data.data as User
  if(!hasPermission(user.role, FoodCategoryManagementAction.VIEW_CATEGORY )){
    return null;
  }
  return (
   <FoodManagementPage  user={user}/>
  )
 
}

export default page
