import { getTableValidationFromToken } from '@/utils/actions/customer/customer.get'
import { redirect } from 'next/navigation'
import React from 'react'

async function CustomerWrapperLayout({ children }: { children: React.ReactNode }) {
  const table_res = await getTableValidationFromToken();

  if (table_res?.success && table_res?.table_validation) {
    redirect('/menu-items');
  }

  return <>{children}</>;
}

export default CustomerWrapperLayout;