import { getErrorMessage } from "@/utils/helper/get-error-message";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const USER_STORAGE_KEY = "user_data";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const verifyUserToken = async () => {
  try {
    const res = await axios.get(`/api/auth/get-user-from-token`);

    const data = res.data;
    if (!data.success) {
      const cached = sessionStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        sessionStorage.removeItem(USER_STORAGE_KEY);
      }
      throw new Error(res.data.message || "Failed to fetch user");
    }

    // store in sessionStorage with timestamp
    sessionStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() })
    );

    return data;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.log("Error verifying user token:", errMsg);
    const cached = sessionStorage.getItem(USER_STORAGE_KEY);
    if (cached) {
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
    throw new Error(errMsg);
  }
};

export const useGetUserFromToken = (forceCall: boolean = false) => {
  return useQuery({
    queryKey: ["get-user-from-token", forceCall],
    queryFn: async () => {
      // Check sessionStorage first
      if (!forceCall) {
        const cached = sessionStorage.getItem(USER_STORAGE_KEY);
        if (cached) {
          const { data, cachedAt } = JSON.parse(cached);
          if (Date.now() - cachedAt < CACHE_DURATION) {
            console.log("Using cached user data");
            return data;
          }
        }
      }
      return verifyUserToken();
    },
    refetchOnWindowFocus: true, // refresh on tab focus
    staleTime: CACHE_DURATION,
    retry: 1, // optional, keeps react-query in "fresh" state
  });
};
