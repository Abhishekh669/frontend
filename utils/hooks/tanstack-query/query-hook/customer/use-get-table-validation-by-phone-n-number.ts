import { getErrorMessage } from "@/utils/helper/get-error-message";
import { useQuery } from "@tanstack/react-query";
import { getApprovalRequestsFromPhoneNTableNum } from "@/utils/actions/customer/customer.get";

export const fetchTableValidationFromPhoneNTable = async (phone: string, table: number) => {
  try {
    const res = await getApprovalRequestsFromPhoneNTableNum(table, phone)
    return res;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetTableValidationFromPhoneNTable = (phone: string, table: number, polling?: boolean) => {

  // All three must be true before a single fetch fires:
  //   1. polling flag is explicitly enabled by the caller
  //   2. phone is a non-empty string
  //   3. table is a positive number
  // This prevents any SSR/dehydration fetch with default empty values.
  const shouldFetch = !!polling && !!phone.trim() && table > 0

  return useQuery({
    queryKey: ["get-table-validation-from-phone-n-table", `${table}-${phone}`],
    queryFn: () => fetchTableValidationFromPhoneNTable(phone, table),

    enabled: shouldFetch,

    // Poll every 5s while active — only when shouldFetch is true
    refetchInterval: shouldFetch ? 5000 : false,

    // Stop polling when the tab is hidden to save requests
    refetchIntervalInBackground: false,

    // Never serve stale data — always refetch on each interval tick
    staleTime: 0,

    // Keep cache for 5 min after polling stops (so re-enabling is instant)
    gcTime: 5 * 60 * 1000,

    // CRITICAL: do NOT retry on errors.
    // not_found throws an error — retrying just hammers the server 2 more
    // times with the same data and delays showing the error UI to the user.
    retry: false,

    // REMOVED: placeholderData: keepPreviousData
    // This was causing TanStack to keep a stale dehydrated pending query
    // alive across renders, triggering the "dehydrated as pending ended up
    // rejecting" console error. Not needed for a polling use case.

    // REMOVED: meta: { persist: true }
    // The persister was trying to serialise this query to storage while it
    // was still in a pending/erroring state, which is the exact source of
    // the "persistQueryClientSave" entries in the stack trace. Approval
    // polling should never be persisted — localStorage handles resumption.
  })
}