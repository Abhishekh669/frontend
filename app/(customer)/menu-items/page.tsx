import NewMenuItemsPage from '@/components/customer/new-menu-items'
import { getTableValidationFromToken } from '@/utils/actions/customer/customer.get';
import { table } from 'console';
import { redirect } from 'next/navigation';

// menu-items/page.tsx
async function page() {
  const table_res = await getTableValidationFromToken();

  // Redirect to approval page if NOT approved
  if (!table_res?.success || !table_res?.table_validation) {
    redirect('/approve-user');
  }

  return <NewMenuItemsPage table_validation={table_res.table_validation} />;
}

export default page
