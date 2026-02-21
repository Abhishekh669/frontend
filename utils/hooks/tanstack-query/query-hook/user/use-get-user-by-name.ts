import { getErrorMessage } from "@/utils/helper/get-error-message";
import { UsersForAttendance } from "@/utils/types/user.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";
interface FetchUserByNameType {
    success : boolean;
    users : UsersForAttendance[]
}

export const fetchUsersByName= async (userName : string) => {
  try {
    
   const res = await axios.get(`/api/user/user-by-name?userName=${userName}`)
    const data = res.data;

    return data as FetchUserByNameType;
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetUsersByName = (userName : string) => {
  return useQuery({
    queryKey: ["get-users-by-name", userName],
    queryFn: () => fetchUsersByName(userName),
    placeholderData: keepPreviousData,
    enabled : userName.trim().length > 0,
    staleTime: 100 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    meta : {
      persist : true
    }
  });
}