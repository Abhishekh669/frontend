"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    format,
    startOfWeek,
    startOfMonth,
    getWeek,
} from "date-fns"
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"

import { RawMaterialType } from "@/utils/types/raw-materials.types"
import { User } from "@/utils/types/user.types"
import { hasPermission } from "@/utils/helper/check-permission"
import { EditRawMaterialDialog } from "./edit-raw-material"
import { useDeleteRawMaterials } from "@/utils/hooks/tanstack-query/mutate-hook/raw-materials/use-delete-raw-materials"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export type GroupBy = "day" | "week" | "month"

interface RawMaterialsTableProps {
    user: User
    raw_materials: RawMaterialType[]
    groupBy: GroupBy
}

export default function RawMaterialsTable({
    user,
    raw_materials,
    groupBy,
}: RawMaterialsTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    const queryClient = useQueryClient()
    const { mutate: delete_raw_materials, isPending } = useDeleteRawMaterials()

    const allIds = raw_materials.map((m) => m.id)
    const allSelected = allIds.length > 0 && selectedIds.length === allIds.length
    const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length

    useEffect(() => {
        setIndeterminate(someSelected)
    }, [someSelected])

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([])
        else setSelectedIds(allIds)
    }

    const toggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const groupedData = useMemo(() => {
        return raw_materials.reduce<Record<string, RawMaterialType[]>>((acc, item) => {
            const date = new Date(item.created_at)
            let key = ""
            if (groupBy === "day") key = format(date, "yyyy-MM-dd")
            else if (groupBy === "week") key = format(startOfWeek(date), "yyyy-MM-dd")
            else key = format(startOfMonth(date), "yyyy-MM")
            acc[key] = acc[key] || []
            acc[key].push(item)
            return acc
        }, {})
    }, [raw_materials, groupBy])

    const groupKeys = Object.keys(groupedData)

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return
        delete_raw_materials(selectedIds, {
            onSuccess: (res) => {
                if (res.success && res.message) {
                    queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] })
                    toast.success(res.message)
                    setSelectedIds([])
                } else if (res.error) {
                    toast.error(res.error)
                }
            },
            onError: (err) => {
                toast.error(err?.message || "Something went wrong")
            },
        })
    }

    return (
        <>
            {/* BULK DELETE BAR */}
            {selectedIds.length > 0 && hasPermission(user.role, "delete:raw_materials") && (
                <div className="flex items-center justify-between mb-3 px-4 py-3 rounded-2xl border border-destructive/20 bg-destructive/5">
                    <span className="text-xs font-medium text-foreground">
                        <span className="text-destructive font-semibold">{selectedIds.length}</span> item{selectedIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-xl h-8 text-xs gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete {selectedIds.length} selected
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
                            <AlertDialogHeader className="px-6 pt-6 pb-5 border-b border-border">
                                <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">
                                    Delete Raw Materials
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground">
                                    Are you sure you want to delete the selected raw materials? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="px-6 py-4 max-h-60 overflow-y-auto space-y-1.5">
                                {selectedIds.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                        No raw materials selected
                                    </p>
                                ) : (
                                    raw_materials
                                        .filter((m) => selectedIds.includes(m.id))
                                        .map((m) => (
                                            <div
                                                key={m.id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                                                <span className="text-xs font-medium text-foreground">{m.name}</span>
                                                <span className="text-[11px] text-muted-foreground ml-auto">
                                                    {m.quantity} {m.unit}
                                                </span>
                                            </div>
                                        ))
                                )}
                            </div>
                            <AlertDialogFooter className="flex justify-end gap-2 px-6 pb-6 pt-4 border-t border-border">
                                <AlertDialogCancel className="rounded-xl h-9 text-sm">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleBulkDelete}
                                    disabled={isPending}
                                    className="rounded-xl h-9 text-sm min-w-[100px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isPending ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3.5 h-3.5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                                            Deleting...
                                        </span>
                                    ) : (
                                        "Delete All"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {/* TABLE */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                            {hasPermission(user.role, "delete:raw_materials") && (
                                <TableHead className="w-10 pl-5">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleSelectAll}
                                        ref={(el) => {
                                            if (el) (el as any).indeterminate = indeterminate
                                        }}
                                    />
                                </TableHead>
                            )}
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Material
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Unit
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Quantity
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Price
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Total Value
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Updated
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Created
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right pr-5">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {groupKeys.map((groupKey) => {
                            const groupDate = new Date(groupKey)
                            const weekNumber = getWeek(groupDate)

                            return (
                                <Fragment key={`group-${groupKey}`}>
                                    {/* GROUP HEADER */}
                                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-y border-border/60">
                                        <TableCell
                                            colSpan={9}
                                            className="py-2 pl-5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-3.5 rounded-full bg-accent" />
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                                                    {groupBy === "day" && format(groupDate, "PPP")}
                                                    {groupBy === "week" &&
                                                        `Week ${weekNumber} · ${format(groupDate, "PPP")}`}
                                                    {groupBy === "month" &&
                                                        format(new Date(groupKey + "-01"), "MMMM yyyy")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                    {groupedData[groupKey].length} item{groupedData[groupKey].length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {/* ROWS */}
                                    {groupedData[groupKey].map((material) => {
                                        const isSelected = selectedIds.includes(material.id)
                                        return (
                                            <TableRow
                                                key={material.id}
                                                className={cn(
                                                    "hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0",
                                                    isSelected && "bg-accent/5"
                                                )}
                                            >
                                                {hasPermission(user.role, "delete:raw_materials") && (
                                                    <TableCell className="pl-5">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelectOne(material.id)}
                                                        />
                                                    </TableCell>
                                                )}

                                                <TableCell className="font-medium text-sm text-foreground">
                                                    {material.name}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted/60 border border-border text-[11px] font-medium text-foreground">
                                                        {material.unit}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold",
                                                            material.quantity > 0
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                                                : "bg-destructive/10 text-destructive"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "w-1 h-1 rounded-full",
                                                            material.quantity > 0 ? "bg-emerald-500" : "bg-destructive"
                                                        )} />
                                                        {material.quantity}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-sm text-foreground">
                                                    Rs {material.price.toLocaleString()}
                                                </TableCell>

                                                <TableCell className="text-sm font-semibold text-foreground">
                                                    Rs {(material.price * material.quantity).toLocaleString()}
                                                </TableCell>

                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(material.updated_at), "MMM d, yyyy")}
                                                </TableCell>

                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(material.created_at), "MMM d, yyyy")}
                                                </TableCell>

                                                <TableCell className="pr-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {hasPermission(user.role, "update:raw_materials") && (
                                                            <EditRawMaterialDialog rawMaterial={material} />
                                                        )}
                                                        {hasPermission(user.role, "delete:raw_materials") && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
                                                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
                                                                    <AlertDialogHeader className="px-6 pt-6 pb-5 border-b border-border">
                                                                        <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">
                                                                            Delete Material
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-xs text-muted-foreground">
                                                                            Are you sure you want to delete{" "}
                                                                            <span className="font-semibold text-foreground">
                                                                                {material.name}
                                                                            </span>
                                                                            ? This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="flex justify-end gap-2 px-6 pb-6 pt-4 border-t border-border">
                                                                        <AlertDialogCancel className="rounded-xl h-9 text-sm">
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => { }}
                                                                            className="rounded-xl h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </Fragment>
                            )
                        })}

                        {raw_materials.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="py-16">
                                    <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                                                <Package className="w-7 h-7 text-muted-foreground/50" />
                                            </div>
                                            <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-semibold text-foreground">
                                                No raw materials found
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Try adjusting your filters or add new materials above.
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}