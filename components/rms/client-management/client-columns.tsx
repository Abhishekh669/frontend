import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "vip"
}

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "vip" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
]
