"use client"

import { useCreateApprovalRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-aproval-request";
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables"
import { useEffect, useState } from "react";
export interface SessionCheckDataType {
  phone_number : string;
  table_number : number
}

export interface SessionDataType{
  phone_number : string;
  table_number : string;
  session_id : string;
}


function ApproveUserPage() {
  const {data , isLoading, isError} = useGetTables();
  const [sessionCheckData, setSessionCheckData] = useState<SessionCheckDataType | null>(null)
  const {mutate : create_approval_request, isPending} = useCreateApprovalRequest();
s
  const tables = data?.tables?.filter((t) => t.status === "empty") || [];

  const fetchSessionFromStorage = () =>{
    const sessionCheckString = localStorage.getItem("session-check")
    if(!sessionCheckString)return ;
    const sessionCheckData  : SessionCheckDataType= JSON.parse(sessionCheckString)
    if (!sessionCheckData.phone_number || !sessionCheckData.table_number)return ;
    setSessionCheckData(sessionCheckData)
  }

  useEffect(()=>{
      fetchSessionFromStorage();
  },[])


  

  return (
    <div>
      
    </div>
  )
}

export default ApproveUserPage
