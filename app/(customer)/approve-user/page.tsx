import ApproveUserPage from "@/components/customer/approve-user/approve-user-page"
import { getTableValidationFromToken } from "@/utils/actions/customer/customer.get"
import { redirect } from "next/navigation";

async function page() {
  const table_res = await getTableValidationFromToken();

  if (table_res?.success && table_res?.table_validation) {
    redirect('/menu-items');
  }



  return <ApproveUserPage />
}

export default page
