"use client"

import { useState, useMemo, useEffect } from "react";
import { Search, List, LayoutGrid, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, roleLabels, User } from "@/utils/types/user.types";
import { AddClientDialog } from "./add-client-dialogbox";
import { UsersTable } from "./client-table";
import { UsersGrid } from "./client-grid";
import { useGetAllUsers } from "@/utils/hooks/tanstack-query/query-hook/user/use-get-all-users";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { UsersError } from "./users-error";
import { UsersTableSkeleton } from "./user-table-skeleton";
import { UsersGridSkeleton } from "./user-grid-skelton";
import { UsersEmpty } from "./empty-users";
import { useDeleteUsers } from "@/utils/hooks/tanstack-query/mutate-hook/user/use-delete-user";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSummary from "./user-dashboard-summary";
import { cn } from "@/lib/utils";

type SortField = "name" | "email" | "role" | "salary" | "created_at";
type SortDirection = "asc" | "desc";

export type QueryType = {
  page: number;
  limit: number;
  search: string;
  oldestFirst: boolean;
};

export const itemsPerPage = 15;

export default function ClientsManagement({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [userStatus, setUserStatus] = useState<"all" | "is_active" | "is_inactive">("all");

  const queryClient = useQueryClient();

  const [query, setQuery] = useState<QueryType>({
    page: 0,
    limit: itemsPerPage,
    search: "",
    oldestFirst: false,
  });

  const { data, isLoading, isError, refetch, isRefetching } = useGetAllUsers(query);
  const { mutate: delete_users, isPending } = useDeleteUsers();
  const isDisabled = isLoading || isError || isPending;

  const totalUsers = data?.total || 0;
  const totalPages = totalUsers ? Math.ceil(totalUsers / query.limit) : 1;
  const currentPage = query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchQuery, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isLoading && data?.users) {
      setUsers(data.users);
    }
  }, [isLoading, data?.users]);

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        userStatus === "all" ||
        (userStatus === "is_active" && user.is_active) ||
        (userStatus === "is_inactive" && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
        case "email":
        case "role":
          comparison = a[sortField].localeCompare(b[sortField]);
          break;
        case "salary":
          comparison = a.salary - b.salary;
          break;
        case "created_at":
          comparison = 0;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, userStatus, roleFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === "created_at") {
      setQuery((prev) => ({ ...prev, oldestFirst: !prev.oldestFirst, page: 0 }));
      setSortField("created_at");
      return;
    }
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page > totalPages - 1 || isLoading) return;
    setQuery((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (value: string) => {
    const limit = Math.min(Number(value), itemsPerPage);
    setQuery((prev) => ({ ...prev, limit, page: 0 }));
  };

  const getVisiblePages = () => {
    const visiblePages: number[] = [];
    const windowSize = 2;
    let startPage = Math.max(0, currentPage - windowSize);
    let endPage = Math.min(totalPages - 1, currentPage + windowSize);
    if (currentPage <= windowSize) endPage = Math.min(totalPages - 1, 2 * windowSize);
    if (currentPage >= totalPages - 1 - windowSize) startPage = Math.max(0, totalPages - 1 - 2 * windowSize);
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);
    return visiblePages;
  };

  const handleDeleteUser = (userIds: string[]) => {
    delete_users(userIds, {
      onSuccess: (res) => {
        if (res.success && res.message) {
          queryClient.invalidateQueries({ queryKey: ["get-all-users"] });
          toast.success(res.message);
        } 
      },
      onError: (err) => {
        toast.error(err?.message || "something went wrong");
      },
    });
  };

  return (
    <div className="min-h-screen space-y-8 px-1">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
        {/* Subtle gold radial glow top-right */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,var(--color-accent)/12%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                User Management
              </p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Team & Staff Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Manage staff members, roles and permissions across your organization.
            </p>
          </div>
          <AddClientDialog />
        </div>
      </div>

      {/* ── Dashboard Summary ── */}
      <DashboardSummary data={data?.user_stats} />

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          {/* Left – Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </div>

            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | "all")}>
              <SelectTrigger className="h-8 text-xs w-[140px] rounded-xl border-border bg-muted/40 hover:bg-muted transition-colors">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userStatus} onValueChange={(value) => setUserStatus(value as any)}>
              <SelectTrigger className="h-8 text-xs w-[120px] rounded-xl border-border bg-muted/40 hover:bg-muted transition-colors">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="is_active">Active</SelectItem>
                <SelectItem value="is_inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(query.limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="h-8 text-xs w-[105px] rounded-xl border-border bg-muted/40 hover:bg-muted transition-colors">
                <SelectValue placeholder="15 / Page" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[5, 10, 15, 20].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right – Search + View Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="h-8 pl-9 pr-3 text-xs w-[210px] rounded-xl border-border bg-muted/40 hover:bg-muted focus:bg-background transition-colors placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 rounded-lg p-0 transition-all",
                  viewMode === "list"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 rounded-lg p-0 transition-all",
                  viewMode === "grid"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {isError ? (
          <div className="p-8">
            <UsersError onRetry={() => setQuery((q) => ({ ...q }))} title="users" />
          </div>
        ) : isLoading ? (
          <div className="p-6">
            {viewMode === "list" ? (
              <UsersTableSkeleton rows={query.limit} />
            ) : (
              <UsersGridSkeleton count={query.limit} />
            )}
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="p-8">
            <UsersEmpty message="No users found for your filters." />
          </div>
        ) : viewMode === "list" ? (
          <UsersTable
            users={filteredAndSortedUsers}
            onDelete={handleDeleteUser}
            user={user}
            refetch={refetch}
            isRefetching={isRefetching}
          />
        ) : (
          <div className="p-6">
            <UsersGrid
              users={filteredAndSortedUsers}
              onDelete={handleDeleteUser}
              user={user}
              refetch={refetch}
              isRefetching={isRefetching}
            />
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="rounded-2xl border border-border bg-card px-6 py-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Showing page ${currentPage + 1} of ${totalPages} · ${totalUsers} total users`}
            </p>

            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <div className={cn(isFirstPage || isDisabled ? "pointer-events-none opacity-35" : "")}>
                    <PaginationPrevious
                      href="#"
                      className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    />
                  </div>
                </PaginationItem>

                {getVisiblePages().map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      className={cn(
                        "h-8 w-8 rounded-xl text-xs font-medium transition-all",
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "border-border hover:bg-muted text-muted-foreground"
                      )}
                      onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <div className={cn(isLastPage || isLoading ? "pointer-events-none opacity-35" : "")}>
                    <PaginationNext
                      href="#"
                      className="h-8 rounded-xl text-xs border-border hover:bg-muted"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
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




