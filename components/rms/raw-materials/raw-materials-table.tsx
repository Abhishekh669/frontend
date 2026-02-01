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
import { Trash2, X } from "lucide-react"
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
import { EditUserDialog } from "../client-management/edit-client-dialogbox"
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
    /* ---------------- SELECTION ---------------- */

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    const queryClient = useQueryClient();

    const { mutate: delete_raw_materials, isPending } = useDeleteRawMaterials()

    const allIds = raw_materials.map((m) => m.id)
    const allSelected =
        allIds.length > 0 && selectedIds.length === allIds.length
    const someSelected =
        selectedIds.length > 0 && selectedIds.length < allIds.length

    useEffect(() => {
        setIndeterminate(someSelected)
    }, [someSelected])

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([])
        else setSelectedIds(allIds)
    }

    const toggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        )
    }

    /* ---------------- GROUPING ---------------- */

    const groupedData = useMemo(() => {
        return raw_materials.reduce<Record<string, RawMaterialType[]>>(
            (acc, item) => {
                const date = new Date(item.created_at)
                let key = ""

                if (groupBy === "day") {
                    key = format(date, "yyyy-MM-dd")
                } else if (groupBy === "week") {
                    key = format(startOfWeek(date), "yyyy-MM-dd")
                } else {
                    key = format(startOfMonth(date), "yyyy-MM")
                }

                acc[key] = acc[key] || []
                acc[key].push(item)
                return acc
            },
            {}
        )
    }, [raw_materials, groupBy])

    const groupKeys = Object.keys(groupedData)

    /* ---------------- DELETE ---------------- */

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return
        delete_raw_materials(selectedIds, {
            onSuccess: (res) => {
                if (res.success && res.message) {
                    queryClient.invalidateQueries({ queryKey: ["get-all-raw-materials"] });
                    toast.success(res.message)
                    setSelectedIds([])
                } else if (res.error) {
                    toast.error(res.error);
                }
            },
            onError: (err) => {
                console.log("this is err : ", err)
                toast.error(err?.message || 'something went wrong')
            }
        })
    }

    return (
        <>
            {/* BULK DELETE */}
            {selectedIds.length > 0 &&
                hasPermission(user.role, "delete:raw_materials") && (
                    <div className="flex justify-end mb-3">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete {selectedIds.length} selected
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Delete Raw Materials
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete the selected raw
                                        materials? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="p-3 max-h-60 overflow-y-auto space-y-2">
                                    {selectedIds.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No raw materials selected
                                        </p>
                                    )}

                                    {selectedIds.map((id) => {
                                        const raw_mat = raw_materials.find((u) => u.id === id)
                                        if (!raw_mat) return null

                                        return (
                                            <div
                                                key={id}
                                                className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 hover:bg-muted/50 transition"
                                            >
                                                {/* LEFT */}
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold leading-none">
                                                        {raw_mat.name}
                                                    </span>

                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="px-2 py-0.5 rounded-md bg-secondary">
                                                            Qty: {raw_mat.quantity}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md bg-secondary">
                                                            Rs {raw_mat.price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* RIGHT */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold">
                                                        Rs {(raw_mat.quantity * raw_mat.price).toLocaleString()}
                                                    </span>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            setSelectedIds((prev) => prev.filter((uid) => uid !== id))
                                                        }
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleBulkDelete}
                                        className="bg-destructive text-destructive-foreground"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}

            {/* TABLE */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={allSelected || indeterminate}
                                    onCheckedChange={toggleSelectAll}
                                    className={cn(
                                        indeterminate &&
                                        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                                        indeterminate &&
                                        "before:content-[''] before:block before:w-2.5 before:h-0.5 before:bg-primary-foreground before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
                                    )}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {groupKeys.map((groupKey) => {
                            const groupDate = new Date(groupKey)
                            const weekNumber = getWeek(groupDate)

                            return (
                                <Fragment key={`group-${groupKey}`}>
                                    {/* GROUP HEADER */}
                                    <TableRow
                                        key={groupKey}
                                        className="bg-muted/40"
                                    >
                                        <TableCell
                                            colSpan={8}
                                            className="font-semibold text-sm"
                                        >
                                            {groupBy === "day" &&
                                                format(groupDate, "PPP")}

                                            {groupBy === "week" &&
                                                `Week ${weekNumber} • ${format(
                                                    groupDate,
                                                    "PPP"
                                                )}`}

                                            {groupBy === "month" &&
                                                format(
                                                    new Date(groupKey + "-01"),
                                                    "MMMM yyyy"
                                                )}
                                        </TableCell>
                                    </TableRow>

                                    {/* ROWS */}
                                    {groupedData[groupKey].map((material) => {
                                        const isSelected =
                                            selectedIds.includes(material.id)

                                        return (
                                            <TableRow
                                                key={material.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() =>
                                                            toggleSelectOne(material.id)
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell className="font-medium">
                                                    {material.name}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-secondary">
                                                        {material.unit}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            "px-2 py-1 rounded-md text-xs font-semibold",
                                                            material.quantity > 0
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                        )}
                                                    >
                                                        {material.quantity}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    Rs {material.price.toLocaleString()}
                                                </TableCell>

                                                <TableCell>
                                                    Rs{" "}
                                                    {(
                                                        material.price * material.quantity
                                                    ).toLocaleString()}
                                                </TableCell>

                                                <TableCell>
                                                    {format(
                                                        new Date(material.updated_at),
                                                        "MMM d, yyyy"
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {format(
                                                        new Date(material.created_at),
                                                        "MMM d, yyyy"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {
                                                            hasPermission(user.role, "update:raw_materials") && (
                                                                <EditRawMaterialDialog rawMaterial={material} />
                                                            )
                                                        }
                                                        {
                                                            hasPermission(user.role, "delete:raw_materials") && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete {user.name}? This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => { }}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )
                                                        }
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
                                <TableCell
                                    colSpan={8}
                                    className="text-center text-muted-foreground py-6"
                                >
                                    No raw materials found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
