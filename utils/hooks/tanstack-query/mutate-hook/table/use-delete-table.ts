// utils/hooks/tanstack-query/mutate-hook/table/use-delete-table.ts
import { deleteTables } from "@/utils/actions/table/table.delete";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableIds: string[]) => {
      const result = await deleteTables(tableIds);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch tables query
      queryClient.invalidateQueries({ queryKey: ["get-tables"] });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
    },
  });
};