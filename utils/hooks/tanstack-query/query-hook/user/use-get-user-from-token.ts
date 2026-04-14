import { getUserFromTokenActionForHook } from "@/utils/actions/user/user.get.action";
import { useQuery } from "@tanstack/react-query";


export const verifyUserToken = async () => {
  const res = await getUserFromTokenActionForHook();
  return res;
};

export const useGetUserFromToken = (forceCall: boolean = false) => {
  return useQuery({
    queryKey: ["get-user-from-token", forceCall],
    queryFn: verifyUserToken,
    retry: false,
    refetchOnWindowFocus: true, // refresh on tab focus
  });
};
