import FeedBackManagementPage from '@/components/customer/FeedBackManagementPage'
import { getTableValidationFromToken } from '@/utils/actions/customer/customer.get'

async function page() {
    const table_validation = await getTableValidationFromToken();
    const table = table_validation?.table_validation
  return <FeedBackManagementPage table={table}/>
}

export default page
