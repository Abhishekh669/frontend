import { getForgetPasswordSession } from "@/utils/actions/auth/login.action";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const fetchForgetPasswordSession= async (email : string, token : string) => {
    const res = await getForgetPasswordSession(email, token);
    return res;
   
}

export const useGetForgetPasswordSession = (email : string, token : string) => {
  return useQuery({
    queryKey: ["get-forget-password-session", email, token],
    queryFn: () => fetchForgetPasswordSession(email, token),
    placeholderData: keepPreviousData,
    enabled : !!(email && token),
  });
}