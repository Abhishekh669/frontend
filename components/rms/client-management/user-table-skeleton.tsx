"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsersTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableHead key={i} className="py-3">
                <div className="h-2.5 w-16 bg-muted rounded-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="border-border/60 hover:bg-transparent">
              {/* Avatar + name cell */}
              <TableCell className="py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-24 bg-muted rounded-full" />
                    <div className="h-2 w-16 bg-muted/60 rounded-full" />
                  </div>
                </div>
              </TableCell>
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j} className="py-3.5">
                  <div className="h-2.5 bg-muted rounded-full" style={{ width: `${55 + Math.random() * 30}%` }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}