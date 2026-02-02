import FoodManagementPage from '@/components/rms/food-category/food-category-management';
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action'
import { hasPermission } from '@/utils/helper/check-permission';
import { FoodCategoryManagementAction } from '@/utils/rbac/role-n-permissiona';
import { User } from '@/utils/types/user.types';

async function page() {
  const data = await getUserFromTokenAction();
  if(!data.data) {
    return null;
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
