"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  CalendarDays,
  LayoutList,
  Plus,
} from "lucide-react";
import { format, isAfter } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useGetRawMaterials } from "@/utils/hooks/tanstack-query/query-hook/raw-materials/use-get-raw-materials";
import RawMaterialsTable from "./raw-materials-table";
import RawMaterialSummary from "./raw-material-summary";
import { User } from "@/utils/types/user.types";
import { hasPermission } from "@/utils/helper/check-permission";
import { UsersTableSkeleton } from "../client-management/user-table-skeleton";
import { UsersError } from "../client-management/users-error";
import AddRawMaterialDialog from "./add-raw-material-dialog";

export interface RawMaterialQuery {
  limit: number;
  page: number;
  oldFirst: boolean;
  startingPrice: number;
  endingPrice: number;
  fromDate: string;
  toDate: string;
  search: string;
}

type GroupBy = "day" | "week" | "month";

const PAGE_SIZES = [5, 10, 20, 50];
const MAX_PRICE = 100_000_000;
const TODAY = new Date();

export default function RawMaterialManagement({ user }: { user: User }) {
  const [query, setQuery] = useState<RawMaterialQuery>({
    limit: 5,
    page: 0,
    oldFirst: false,
    startingPrice: 0,
    endingPrice: MAX_PRICE,
    fromDate: "",
    toDate: "",
    search: "",
  });

  const { data, isLoading, isError } = useGetRawMaterials(query);

  const [addOpen, setAddOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((p) => ({ ...p, search: searchTerm }));
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const minNum = minPrice === "" ? 0 : Number(minPrice);
  const maxNum = maxPrice === "" ? MAX_PRICE : Number(maxPrice);
  const priceError =
    minNum < 0 || maxNum <= 0 || minNum > maxNum || maxNum > MAX_PRICE;

  const applyFilters = () => {
    if (fromDate && isAfter(fromDate, TODAY)) {
      toast.error("From date cannot be in the future");
      return;
    }
    if (toDate && isAfter(toDate, TODAY)) {
      toast.error("To date cannot be in the future");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    if (priceError) {
      toast.error("Invalid price range");
      return;
    }
    setQuery((p) => ({
      ...p,
      fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
      toDate: toDate ? format(toDate, "yyyy-MM-dd") : "",
      startingPrice: minNum,
      endingPrice: maxNum,
      page: 0,
    }));
  };

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setMinPrice("");
    setMaxPrice("");
    setQuery((p) => ({
      ...p,
      startingPrice: 0,
      endingPrice: MAX_PRICE,
      fromDate: "",
      toDate: "",
      page: 0,
    }));
  };

  const totalMaterials = data?.total || 0;
  const totalPages = totalMaterials ? Math.ceil(totalMaterials / query.limit) : 1;
  const currentPage = query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  const handlePageChange = (page: number) => {
    if (page < 0 || page > totalPages - 1 || isLoading) return;
    setQuery((p) => ({ ...p, page }));
  };

  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const windowSize = 2;
    let startPage = Math.max(0, currentPage - windowSize);
    let endPage = Math.min(totalPages - 1, currentPage + windowSize);
    if (currentPage <= windowSize) endPage = Math.min(totalPages - 1, 2 * windowSize);
    if (currentPage >= totalPages - 1 - windowSize)
      startPage = Math.max(0, totalPages - 1 - 2 * windowSize);
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);
    return visiblePages;
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                Inventory
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Raw Materials
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your raw material inventory, track quantities and pricing.
            </p>
          </div>

          {hasPermission(user.role, "create:raw_materials") && (
            <Button
              onClick={() => setAddOpen(true)}
              className="rounded-xl h-9 text-sm shrink-0 gap-1.5 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Material
            </Button>
          )}
        </div>
      </div>

      {/* ADD DIALOG */}
      <AddRawMaterialDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* KPI SUMMARY */}
      <RawMaterialSummary {...data?.raw_materials_stats} />

      {/* TOOLBAR */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setQuery((p) => ({ ...p, oldFirst: !p.oldFirst, page: 0 }))
            }
            className="h-9 rounded-xl border-border text-sm gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Date
            {query.oldFirst ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
          </Button>

          <Select
            value={String(query.limit)}
            onValueChange={(v) =>
              setQuery((p) => ({ ...p, limit: +v, page: 0 }))
            }
          >
            <SelectTrigger className="w-28 h-9 rounded-xl border-border bg-muted/40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={groupBy}
            onValueChange={(v: GroupBy) => setGroupBy(v)}
          >
            <SelectTrigger className="w-32 h-9 rounded-xl border-border bg-muted/40 text-sm">
              <LayoutList className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters row */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-3">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Filters
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <PriceInput
              label="Min Price"
              value={minPrice}
              onChange={setMinPrice}
              error={priceError}
            />
            <PriceInput
              label="Max Price"
              value={maxPrice}
              onChange={setMaxPrice}
              error={priceError}
            />
            <DatePicker label="From Date" date={fromDate} setDate={setFromDate} />
            <DatePicker label="To Date" date={toDate} setDate={setToDate} />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 rounded-xl text-xs border-border"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={applyFilters}
              disabled={priceError}
              className="h-8 rounded-xl text-xs min-w-[80px]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {isError ? (
        <UsersError
          onRetry={() => setQuery((q) => ({ ...q }))}
          title="raw materials"
        />
      ) : isLoading ? (
        <UsersTableSkeleton rows={query.limit} />
      ) : (
        <RawMaterialsTable
          raw_materials={data?.raw_materials || []}
          user={user}
          groupBy={groupBy}
        />
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="animate-pulse">Loading…</span>
              ) : (
                <>
                  Page{" "}
                  <span className="font-semibold text-foreground">
                    {currentPage + 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {totalPages}
                  </span>{" "}
                  •{" "}
                  <span className="font-semibold text-foreground">
                    {totalMaterials}
                  </span>{" "}
                  materials total
                </>
              )}
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <div
                    className={cn(
                      "rounded-xl",
                      (isFirstPage || isLoading) && "pointer-events-none opacity-40"
                    )}
                  >
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </PaginationItem>

                {getVisiblePages().map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      className={cn(
                        "rounded-xl text-xs border",
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <div
                    className={cn(
                      "rounded-xl",
                      (isLastPage || isLoading) && "pointer-events-none opacity-40"
                    )}
                  >
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function PriceInput({ label, value, onChange, error }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className={cn(
          "h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border",
          error && "border-destructive"
        )}
      />
    </div>
  );
}

function DatePicker({
  label,
  date,
  setDate,
}: {
  label: string;
  date?: Date;
  setDate: (d?: Date) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 justify-start rounded-xl border-border bg-muted/30 text-sm font-normal"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            {date ? (
              <span className="text-foreground">{format(date, "yyyy-MM-dd")}</span>
            ) : (
              <span className="text-muted-foreground">Select date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 rounded-2xl border border-border shadow-xl">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ after: TODAY }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}