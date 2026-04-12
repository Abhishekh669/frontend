import OrderManagementPage from '@/components/rms/orders/order-management'
import { getUserFromTokenAction } from '@/utils/actions/user/user.get.action';
import { hasPermission } from '@/utils/helper/check-permission';
import { FoodCategoryManagementAction } from '@/utils/rbac/role-n-permissiona';
import { User } from '@/utils/types/user.types';
import React from 'react'

async function page() {
   const data = await getUserFromTokenAction();
        if(!data.data) {
          return null;
        }
        const user = data.data as User
        if(!hasPermission(user.role, "view:orders" )){
          return null;
        }
  return <OrderManagementPage user={user} />
}

export default page
