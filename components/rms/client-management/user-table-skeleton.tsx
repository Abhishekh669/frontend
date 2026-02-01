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
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-pulse">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableHead key={i}>
                <div className="h-4 w-20 bg-muted rounded" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 8 }).map((__, j) => (
                <TableCell key={j}>
                  <div className="h-4 w-full bg-muted rounded" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
