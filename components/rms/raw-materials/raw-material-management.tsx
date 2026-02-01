"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import RawMaterialsForm from "./raw-material-form";
import RawMaterialsTable from "./raw-materials-table";
import RawMaterialSummary from "./raw-material-summary";
import { User } from "@/utils/types/user.types";
import { hasPermission } from "@/utils/helper/check-permission";
import { UsersTableSkeleton } from "../client-management/user-table-skeleton";
import { UsersError } from "../client-management/users-error";
import { totalmem } from "os";

/* ---------------- TYPES ---------------- */

export interface RawMaterialQuery {
  limit: number;
  page: number;
  oldFirst: boolean;
  startingPrice: number;
  endingPrice: number;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  search: string;
}

type GroupBy = "day" | "week" | "month";

/* ---------------- CONSTANTS ---------------- */

const PAGE_SIZES = [5, 10, 20, 50];
const MAX_PRICE = 100_000_000;
const TODAY = new Date();

/* ---------------- COMPONENT ---------------- */

export default function RawMaterialManagement({ user }: { user: User }) {
  /* ---------------- QUERY ---------------- */

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

  console.log("this is hte data : ", data)

  /* ---------------- STATES ---------------- */

  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [searchTerm, setSearchTerm] = useState("");

  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  /* ---------------- SEARCH ---------------- */

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((p) => ({
        ...p,
        search: searchTerm,
      }));
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ---------------- VALIDATION ---------------- */

  const minNum = minPrice === "" ? 0 : Number(minPrice);
  const maxNum = maxPrice === "" ? MAX_PRICE : Number(maxPrice);

  const priceError =
    minNum < 0 ||
    maxNum <= 0 ||
    minNum > maxNum ||
    maxNum > MAX_PRICE;

  /* ---------------- APPLY FILTER ---------------- */

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

  /* ---------------- CLEAR FILTER ---------------- */

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

  /* ---------------- PAGINATION ---------------- */

  const totalMaterials = data?.total || 0;
  const totalPages = totalMaterials ? Math.ceil(totalMaterials / query.limit) : 1;
  const currentPage = query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;


  const handlePageChange = (page: number) => {
    if (page < 0 || page > totalPages - 1 || isLoading) return;
    setQuery((p) => ({ ...p, page }));

  };

  /* ---------------- UI ---------------- */

  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const windowSize = 2;

    let startPage = Math.max(0, currentPage - windowSize);
    let endPage = Math.min(totalPages - 1, currentPage + windowSize);

    if (currentPage <= windowSize) {
      endPage = Math.min(totalPages - 1, 2 * windowSize);
    }

    if (currentPage >= totalPages - 1 - windowSize) {
      startPage = Math.max(0, totalPages - 1 - 2 * windowSize);
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
  };

  return (
    <div className="space-y-6">
      <RawMaterialSummary {...data?.raw_materials_stats} />

      {hasPermission(user.role, "create:raw_materials") && (
        <RawMaterialsForm />
      )}

      {/* SEARCH */}
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuery((p) => (
              { ...p, oldFirst: !p.oldFirst, page: 0, }
            ))}
          >
            <ArrowUpDown className="w-4 h-4 mr-1" /> Date {query.oldFirst ? <ArrowUp /> : <ArrowDown />}
          </Button> {/* PAGE SIZE */}

          <Select
            value={String(query.limit)}
            onValueChange={(v) => setQuery((p) => ({ ...p, limit: +v, page: 0, }))}
          >
            <SelectTrigger className="w-28"> <SelectValue /> </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (<SelectItem key={s} value={String(s)}> {s} / page </SelectItem>))}
            </SelectContent>
          </Select>

          {/* GROUP BY */}
          <Select
            value={groupBy}
            onValueChange={(v: GroupBy) => setGroupBy(v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day"> Daily </SelectItem>
              <SelectItem value="week"> Weekly </SelectItem>
              <SelectItem value="month"> Monthly </SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>




      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
        <PriceInput label="Min Price" value={minPrice} onChange={setMinPrice} error={priceError} />
        <PriceInput label="Max Price" value={maxPrice} onChange={setMaxPrice} error={priceError} />
        <DatePicker label="From" date={fromDate} setDate={setFromDate} />
        <DatePicker label="To" date={toDate} setDate={setToDate} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
        <Button size="sm" onClick={applyFilters} disabled={priceError}>Apply</Button>
      </div>

      {/* TABLE */}

      {
        isError ? (
          <UsersError onRetry={() => setQuery((q) => ({ ...q }))} title="raw materials" />
        ) : isLoading ? (
          <UsersTableSkeleton rows={query.limit} />
        ) :
          (
            <RawMaterialsTable
              raw_materials={data?.raw_materials || []}
              user={user}
              groupBy={groupBy}
            />
          )
      }


      {totalPages > 1 && (
        <div className="w-full sticky bottom-0 mt-4 border-t
    bg-background/90 backdrop-blur
    border-border
    py-4"
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

              {/* INFO */}
              <div className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : `Page ${currentPage + 1} of ${totalPages} • ${totalMaterials} raw materials total`}
              </div>

              {/* PAGINATION */}
              <Pagination>
                <PaginationContent>

                  {/* PREVIOUS */}
                  <PaginationItem>
                    <div
                      className={cn(
                        "rounded-md",
                        (isFirstPage || isLoading) &&
                        "pointer-events-none opacity-50"
                      )}
                    >
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage - 1)
                        }}
                      />
                    </div>
                  </PaginationItem>

                  {/* PAGE NUMBERS */}
                  {getVisiblePages().map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(pageNum)
                        }}
                        className={cn(
                          "border",
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* NEXT */}
                  <PaginationItem>
                    <div
                      className={cn(
                        "rounded-md",
                        (isLastPage || isLoading) &&
                        "pointer-events-none opacity-50"
                      )}
                    >
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage + 1)
                        }}
                      />
                    </div>
                  </PaginationItem>

                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function PriceInput({ label, value, onChange, error }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className={cn(error && "border-red-500")}
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
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {date ? format(date, "yyyy-MM-dd") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ after: TODAY }} // 🚫 future dates
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
