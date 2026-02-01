"use client"

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, ArrowUpDown, List, LayoutGrid, ArrowUp, ArrowDown } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role, roleLabels, User } from "@/utils/types/user.types";
import { AddClientDialog } from "./add-client-dialogbox";
import { UsersTable } from "./client-table";
import { UsersGrid } from "./client-grid";
import { useGetAllUsers } from "@/utils/hooks/tanstack-query/query-hook/user/use-get-all-users";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { UsersError } from "./users-error";
import { UsersTableSkeleton } from "./user-table-skeleton";
import { UsersGridSkeleton } from "./user-grid-skelton";
import { UsersEmpty } from "./empty-users";
import { useDeleteUsers } from "@/utils/hooks/tanstack-query/mutate-hook/user/use-delete-user";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSummary from "./user-dashboard-summary";
import { hasPermission } from "@/utils/helper/check-permission";

type SortField = "name" | "email" | "role" | "salary" | "created_at";
type SortDirection = "asc" | "desc";

const sortOptions: { field: SortField; label: string }[] = [
  { field: "name", label: "Name" },
  { field: "email", label: "Email" },
  { field: "role", label: "Role" },
  { field: "salary", label: "Salary" },
  { field: "created_at", label: "Date Created" },
];

export type QueryType = {
  page: number
  limit: number
  search: string
  oldestFirst: boolean
}

export const itemsPerPage = 15;

export default function ClientsManagement({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [userStatus, setUserStatus] = useState<"all" | "is_active" | "is_inactive">("all")

  const queryClient = useQueryClient();

  const [query, setQuery] = useState<QueryType>({
    page: 0,
    limit: itemsPerPage,
    search: "",
    oldestFirst: false,
  });

  const { data, isLoading, isError } = useGetAllUsers(query);
  const { mutate: delete_users, isPending } = useDeleteUsers();
  const isDisabled = isLoading || isError || isPending;

  const totalUsers = data?.total || 0;
  const totalPages = totalUsers ? Math.ceil(totalUsers / query.limit) : 1;

  const currentPage = query.page;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  // 🔍 Debounced Search → backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        search: searchQuery,
        page: 0,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 📥 Sync API users
  useEffect(() => {
    if (!isLoading && data?.users) {
      setUsers(data.users);
    }
  }, [isLoading, data?.users]);
  console.log("this is users : ",data)

  // 🧠 Client-side filter + sort (except created_at)
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        (userStatus === "all") || 
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
          comparison = 0; // already sorted by DB
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, userStatus, roleFilter, sortField, sortDirection]);

  // 🔁 Hybrid Sort Handler
  const handleSort = (field: SortField) => {
    if (field === "created_at") {
      setQuery((prev) => ({
        ...prev,
        oldestFirst: !prev.oldestFirst,
        page: 0,
      }));
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

  // 📄 Pagination
  const handlePageChange = (page: number) => {
    if (page < 0 || page > totalPages - 1 || isLoading) return;

    setQuery((prev) => ({
      ...prev,
      page,
    }));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📏 Limit Selector (≤ itemsPerPage)
  const handleLimitChange = (value: string) => {
    const limit = Math.min(Number(value), itemsPerPage);

    setQuery((prev) => ({
      ...prev,
      limit,
      page: 0,
    }));
  };



  // 🧮 Pagination window
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

  const handleUpdateUser = (updatedUser: User) => {
    console.log("updated user : ", updatedUser)

  };
  const handleDeleteUser = (userIds: string[]) => {


    delete_users(userIds, {
      onSuccess: (res) => {
        console.log("this is response : ", res)
        if (res.success && res.message) {
          queryClient.invalidateQueries({ queryKey: ["get-all-users"] });

          toast.success(res.message)

        } else if (res.error) {
          toast.error(res.error);
        }
      },
      onError: (err) => {
        console.log("this is err : ", err)
        toast.error(err?.message || 'something went wrong')
      }
    })


  };




  const getContentForUserStatus = (status: string) => {
    switch (status) {
      case "all":
        return "All"
      case "is_active":
        return "Active"
      case "is_inactive":
        return "Inactive"
      default:
        return "all"
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className=" bg-background p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage staff members, roles, and permissions
            </p>
          </div>

        </div>

        <DashboardSummary data={data?.user_stats} />
        {/* Toolbar */}
        {
          hasPermission(user.role, "view:clients") && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | "all")}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort: {sortOptions.find(o => o.field === sortField)?.label}
                      {sortField === "created_at" ? (
                        query.oldestFirst ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : sortDirection === "asc" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start">
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.field}
                        onClick={() => handleSort(option.field)}
                        className="flex items-center justify-between"
                      >
                        {option.label}
                        {sortField === option.field && (
                          option.field === "created_at" ? (
                            query.oldestFirst ? (
                              <ArrowUp className="w-3 h-3 ml-2" />
                            ) : (
                              <ArrowDown className="w-3 h-3 ml-2" />
                            )
                          ) : sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 ml-2" />
                          ) : (
                            <ArrowDown className="w-3 h-3 ml-2" />
                          )
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Page Size */}
                <Select value={String(query.limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>


                {/* active and inactive user  */}
                <Select value={userStatus} onValueChange={(value) => setUserStatus(value as "all" | "is_active" | "is_inactive")}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All /User Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["all", "is_active", "is_inactive"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {getContentForUserStatus(status)} - User Status
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>




              </div>

              {/* Search + View */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 w-70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
                <AddClientDialog />
              </div>
            </div>
          )
        }

      </div>

      {/* Table / Grid */}
      {isError ? (
        <UsersError onRetry={() => setQuery((q) => ({ ...q }))} title="users" />
      ) : isLoading ? (
        viewMode === "list" ? (
          <UsersTableSkeleton rows={query.limit} />
        ) : (
          <UsersGridSkeleton count={query.limit} />
        )
      ) : filteredAndSortedUsers.length === 0 ? (
        <UsersEmpty message="No users found for your filters." />
      ) : viewMode === "list" ? (
        <UsersTable
          users={filteredAndSortedUsers}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
          user={user}
        />
      ) : (
        <UsersGrid
          users={filteredAndSortedUsers}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
          user={user}
        />
      )}



      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 py-4 mt-4 sticky bottom-0">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {isLoading
                  ? "Loading..."
                  : `Page ${currentPage + 1} of ${totalPages} • ${totalUsers} users total`}
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <div className={isFirstPage || isDisabled ? "pointer-events-none opacity-50" : ""}>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
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
                        className={
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-200 hover:bg-slate-100"
                        }
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <div className={isLastPage || isLoading ? "pointer-events-none opacity-50" : ""}>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
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
