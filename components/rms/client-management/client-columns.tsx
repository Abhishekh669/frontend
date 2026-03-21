import { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "vip"
}

const statusConfig: Record<
  Client["status"],
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  vip: {
    label: "VIP",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
}

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Name
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-foreground">
        {row.getValue("name")}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Email
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.getValue("email")}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Phone
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.getValue("phone")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Status
      </span>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Client["status"]
      const config = statusConfig[status] ?? statusConfig.inactive

      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
            config.className
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
          {config.label}
        </div>
      )
    },
  },
]