import axios from "axios";
import { getErrorMessage } from "@/utils/helper/get-error-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RawMaterialStatistic, RawMaterialType } from "@/utils/types/raw-materials.types";
import { RawMaterialQuery } from "@/components/rms/raw-materials/raw-material-management";

export const fetchRawMaterials = async (query: RawMaterialQuery) => {
  try {
    const res = await axios.get(`/api/raw-materials/all?page=${query.page}&limit=${query.limit}&search=${query.search}&oldFirst=${query.oldFirst}&startingPrice=${query.startingPrice}&endingPrice=${query.endingPrice}&fromDate=${query.fromDate}&toDate=${query.toDate}`);
    const data = res.data;
    const raw_materials_stats: RawMaterialStatistic = data?.data?.raw_materials_data;
    return {
      raw_materials: data?.data?.raw_materials as RawMaterialType[] ?? [],
      total: data?.data?.total ?? 0,
      has_more: data?.data?.has_more ?? false,
      next_offset: data?.data?.next_offset ?? 0,
      raw_materials_stats
    };
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const useGetRawMaterials = (query: RawMaterialQuery) => {
  return useQuery({
    queryKey: ["get-all-raw-materials", query],
    queryFn: () => fetchRawMaterials(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}