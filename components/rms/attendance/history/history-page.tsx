'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  CalendarDays,
  ArrowUpDown,
  RefreshCw,
  LogIn,
  LogOut,
  Timer,
  UserCheck,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetAttendanceHistory } from '@/utils/hooks/tanstack-query/query-hook/attendance/use-get-attendance-history';
import { useGetUsersByName } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-user-by-name';
import { useDebounce } from '@/utils/helper/debounce';
import AttendnaceHistoryCard from './attendance-history-card';
import { format, isSameDay, isAfter, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AttendanceHistoryData, AttendanceStatus } from '@/utils/types/attendance.types';
import { Role, UsersForAttendance } from '@/utils/types/user.types';

const statusColors: Record<AttendanceStatus, {
  bg: string; text: string; dot: string; icon: React.ElementType; label: string;
}> = {
  present:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Present'  },
  absent:   { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       dot: 'bg-rose-500',    icon: XCircle,      label: 'Absent'   },
  leave:    { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500',  icon: CalendarDays, label: 'On Leave' },
  late:     { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500',   icon: AlertCircle,  label: 'Late'     },
  half_day: { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500',  icon: Timer,        label: 'Half Day' },
};

const roleColors: Record<Role, string> = {
  admin:          'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  manager:        'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  cashier:        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  chef:           'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  waiter:         'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  delivery_staff: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  customer:       'bg-muted text-muted-foreground',
};

const PAGE_SIZES = [5, 10, 20, 50, 100];
const TODAY = new Date();

export interface HistoryQueryType {
  limit: number;
  page: number;
  startingDate: string;
  endingDate: string;
  search: string;
}

const calculateWorkDuration = (checkIn: Date, checkOut?: Date) => {
  if (!checkOut) return null;
  const durationMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return {
    hours: Math.floor(durationMs / (1000 * 60 * 60)),
    minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)),
  };
};

function HistoryPage() {
  const [tempFilters, setTempFilters] = useState<{
    limit: number;
    fromDate: Date | undefined;
    toDate: Date | undefined;
    selectedUser: UsersForAttendance | null;
    searchName: string;
    sortOrder: 'asc' | 'desc';
  }>({ limit: 5, fromDate: undefined, toDate: undefined, selectedUser: null, searchName: '', sortOrder: 'desc' });

  const [appliedQuery, setAppliedQuery] = useState<HistoryQueryType>({ limit: 5, page: 0, startingDate: '', endingDate: '', search: '' });
  const [showUserResults, setShowUserResults] = useState(false);
  const [showFilterNotice, setShowFilterNotice] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchName = useDebounce(tempFilters.searchName, 1000);
  const { data: usersData, isLoading: isLoadingUsers, isFetching: isFetchingUsers } = useGetUsersByName(debouncedSearchName);
  const { data: attendanceData, isLoading: isLoadingAttendance, isFetching: isFetchingAttendance, refetch: refetchAttendance } = useGetAttendanceHistory(appliedQuery);

  console.log("this is applied query : ", appliedQuery);
  console.log("this is attendance data : ", attendanceData);

  const attendanceHistory = attendanceData?.attendanceHistory ?? [];
  const attendanceStats = attendanceData?.attendanceStats;
  const total = attendanceData?.total || 0;
  const currentPage = attendanceData?.page || 0;
  const totalPages = total ? Math.ceil(total / appliedQuery.limit) : 1;
  const isFirstPage = currentPage === 0;
  const isLastPage = !attendanceData?.hasMore || currentPage === totalPages - 1;

  const groupedAttendance = React.useMemo(() => {
    const groups: { [key: string]: AttendanceHistoryData[] } = {};
    const sorted = [...attendanceHistory].sort((a, b) => {
      const diff = new Date(a.work_date).getTime() - new Date(b.work_date).getTime();
      return tempFilters.sortOrder === 'desc' ? -diff : diff;
    });
    sorted.forEach(record => {
      const key = new Date(record.work_date).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [attendanceHistory, tempFilters.sortOrder]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowUserResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUserSelect = (user: UsersForAttendance) => { setTempFilters(p => ({ ...p, selectedUser: user, searchName: user.name })); setShowUserResults(false); setShowFilterNotice(true); };
  const handleClearSelectedUser = () => { setTempFilters(p => ({ ...p, selectedUser: null, searchName: '' })); setShowFilterNotice(true); };

  const validateDates = (from?: Date, to?: Date) => {
    if (from && isAfter(from, TODAY)) { toast.error("From date cannot be in the future"); return false; }
    if (to && isAfter(to, TODAY)) { toast.error("To date cannot be in the future"); return false; }
    if (from && to && from > to) { toast.error("From date cannot be after To date"); return false; }
    return true;
  };

  const handleApplyFilters = () => {
    if (!validateDates(tempFilters.fromDate, tempFilters.toDate)) return;
    setAppliedQuery({ limit: tempFilters.limit, page: 0, startingDate: tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : "", endingDate: tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : "", search: tempFilters.selectedUser?.id || '' });
    setShowFilterNotice(false);
  };

  const handleResetFilters = () => { setTempFilters({ limit: 5, fromDate: undefined, toDate: undefined, selectedUser: null, searchName: '', sortOrder: 'desc' }); setAppliedQuery({ limit: 5, page: 0, startingDate: '', endingDate: '', search: '' }); setShowFilterNotice(false); };
  const handlePageChange = (newPage: number) => { if (newPage < 0 || newPage >= totalPages || isFetchingAttendance) return; setAppliedQuery(p => ({ ...p, page: newPage })); };
  const toggleSortOrder = () => { setTempFilters(p => ({ ...p, sortOrder: p.sortOrder === 'desc' ? 'asc' : 'desc' })); setShowFilterNotice(true); };
  const handleRefresh = () => refetchAttendance();
  const handleLimitChange = (value: string) => { setTempFilters(p => ({ ...p, limit: parseInt(value) })); setShowFilterNotice(true); };

  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const tod = new Date(); const yes = new Date(tod); yes.setDate(yes.getDate() - 1);
    if (isSameDay(date, tod)) return 'Today';
    if (isSameDay(date, yes)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getVisiblePages = () => {
    const w = 2;
    let start = Math.max(0, currentPage - w);
    let end = Math.min(totalPages - 1, currentPage + w);
    if (currentPage <= w) end = Math.min(totalPages - 1, 2 * w);
    if (currentPage >= totalPages - 1 - w) start = Math.max(0, totalPages - 1 - 2 * w);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85_/_0.12),transparent_70%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.75_0.12_85_/_0.30)] to-transparent" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">HR Module</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance History</h1>
              <p className="text-sm text-muted-foreground">Track and manage employee attendance records</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isFetchingAttendance} className="h-9 w-9 rounded-xl border-border bg-muted/40 hover:bg-muted/70 transition-colors">
              <RefreshCw className={cn("h-4 w-4", isFetchingAttendance && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        {attendanceStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AttendnaceHistoryCard value={attendanceStats.total_records || 0}   text="Total"    icon={<CalendarDays className="w-4 h-4" />} color="blue"    duration={2.5} isLoading={isFetchingAttendance} />
            <AttendnaceHistoryCard value={attendanceStats.present_count || 0}   text="Present"  icon={<CheckCircle2 className="w-4 h-4" />} color="green"   duration={2}   isLoading={isFetchingAttendance} />
            <AttendnaceHistoryCard value={attendanceStats.absent_count || 0}    text="Absent"   icon={<XCircle className="w-4 h-4" />}      color="red"     duration={2}   isLoading={isFetchingAttendance} />
            <AttendnaceHistoryCard value={attendanceStats.leave_count || 0}     text="Leave"    icon={<CalendarDays className="w-4 h-4" />} color="purple"  duration={2}   isLoading={isFetchingAttendance} />
            <AttendnaceHistoryCard value={attendanceStats.late_count || 0}      text="Late"     icon={<AlertCircle className="w-4 h-4" />}  color="yellow"  duration={2}   isLoading={isFetchingAttendance} />
            <AttendnaceHistoryCard value={attendanceStats.half_day_count || 0}  text="Half Day" icon={<Timer className="w-4 h-4" />}        color="orange"  duration={2}   isLoading={isFetchingAttendance} />
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm space-y-5">
          {/* Filter header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1 h-4 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Filters</span>
            </div>
            {showFilterNotice && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium animate-pulse border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Click Apply to update
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* User Search */}
            <div className="space-y-1.5 relative" ref={searchRef}>
              <Label htmlFor="user-search" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="user-search"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={tempFilters.searchName}
                  onChange={(e) => { setTempFilters(p => ({ ...p, searchName: e.target.value })); setShowUserResults(true); if (tempFilters.selectedUser) setTempFilters(p => ({ ...p, selectedUser: null })); }}
                  onFocus={() => setShowUserResults(true)}
                  className="pl-9 pr-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                  disabled={isFetchingUsers}
                />
                {tempFilters.selectedUser && (
                  <Button variant="ghost" size="icon" className="absolute inset-y-0 right-0 px-3 flex items-center h-full rounded-xl" onClick={handleClearSelectedUser} type="button" disabled={isFetchingAttendance}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>

              {/* Dropdown results */}
              {showUserResults && debouncedSearchName && (
                <div className="absolute z-10 mt-1 w-full bg-popover shadow-xl border border-border rounded-2xl overflow-hidden">
                  {isFetchingUsers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Searching users...</div>
                  ) : usersData?.users && usersData.users.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {usersData.users.map((user: UsersForAttendance, index: number) => (
                        <button
                          key={`${user.email}-${index}`}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
                          onClick={() => handleUserSelect(user)}
                          type="button"
                          disabled={isFetchingAttendance}
                        >
                          <Avatar className="h-9 w-9 rounded-xl ring-1 ring-border">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-xs rounded-xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email} • {user.phone}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected User */}
            {tempFilters.selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                <Avatar className="h-8 w-8 rounded-xl ring-1 ring-border">
                  <AvatarImage src={tempFilters.selectedUser.image} alt={tempFilters.selectedUser.name} />
                  <AvatarFallback className="bg-primary/10 text-xs rounded-xl">{tempFilters.selectedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Selected: {tempFilters.selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{tempFilters.selectedUser.email} • {tempFilters.selectedUser.phone}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border', tempFilters.selectedUser.is_active ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground')}>
                  {tempFilters.selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}

            {/* Date range + controls grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="from-date" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">From Date</Label>
                <Input id="from-date" type="date" value={tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : ""} onChange={(e) => { setTempFilters(p => ({ ...p, fromDate: e.target.value ? new Date(e.target.value) : undefined })); setShowFilterNotice(true); }} max={format(TODAY, "yyyy-MM-dd")} className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border" disabled={isFetchingAttendance} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to-date" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">To Date</Label>
                <Input id="to-date" type="date" value={tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : ""} onChange={(e) => { setTempFilters(p => ({ ...p, toDate: e.target.value ? new Date(e.target.value) : undefined })); setShowFilterNotice(true); }} max={format(TODAY, "yyyy-MM-dd")} className="h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border" disabled={isFetchingAttendance} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="items-per-page" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Items per page</Label>
                <Select value={tempFilters.limit.toString()} onValueChange={handleLimitChange} disabled={isFetchingAttendance}>
                  <SelectTrigger id="items-per-page" className="h-9 rounded-xl border-border bg-muted/40 text-sm">
                    <SelectValue placeholder="Select limit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {PAGE_SIZES.map(s => <SelectItem key={s} value={s.toString()}>{s} / page</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground opacity-0 select-none">Sort</Label>
                <Button variant="outline" onClick={toggleSortOrder} className="w-full h-9 rounded-xl border-border bg-muted/40 text-sm gap-2 hover:bg-muted/70 transition-colors" disabled={isFetchingAttendance}>
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  Sort {tempFilters.sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button onClick={handleApplyFilters} className="rounded-xl h-9 text-sm min-w-[120px]" disabled={isFetchingAttendance}>
                {isFetchingAttendance ? (
                  <><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Applying...</>
                ) : 'Apply Filters'}
              </Button>
              <Button onClick={handleResetFilters} variant="outline" className="rounded-xl h-9 text-sm border-border hover:bg-muted/50 transition-colors" disabled={isFetchingAttendance}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <div className={cn("transition-opacity duration-300", isFetchingAttendance ? "opacity-50 pointer-events-none" : "opacity-100")}>
          {isLoadingAttendance ? (
            <div className="rounded-3xl border border-border bg-card p-12 shadow-sm flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-muted border-t-accent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading attendance records...</p>
            </div>
          ) : attendanceHistory.length > 0 ? (
            <div className="space-y-5">
              {/* Date-grouped cards */}
              {Object.entries(groupedAttendance).map(([date, records]) => (
                <div key={date} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Date header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="w-4 h-4 text-accent" />
                      <h3 className="text-sm font-semibold text-foreground">{formatDate(date)}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted border border-border text-[11px] font-medium text-muted-foreground">
                        {records.length} {records.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>

                  {/* Records */}
                  <div className="divide-y divide-border">
                    {records.map((record) => {
                      const StatusIcon = statusColors[record.status]?.icon || HelpCircle;
                      const statusInfo = statusColors[record.status] || statusColors.absent;
                      const duration = record.check_out_time ? calculateWorkDuration(record.check_in_time, record.check_out_time) : null;

                      return (
                        <div key={record.id} className="flex flex-col p-5 hover:bg-muted/10 transition-colors gap-4">
                          {/* Top row: employee info + status */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11 rounded-xl ring-1 ring-border">
                                <AvatarImage src={record.employee_image} alt={record.employee_name} />
                                <AvatarFallback className="bg-primary/10 text-sm rounded-xl">{record.employee_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground">{record.employee_name}</p>
                                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', roleColors[record.employee_role])}>
                                    {record.employee_role.replace('_', ' ')}
                                  </span>
                                  {record.need_review && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      Review
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                  <span>{record.employee_email}</span>
                                  <span>•</span>
                                  <span>{record.employee_phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', statusInfo.bg)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dot)} />
                              <StatusIcon className={cn('w-3.5 h-3.5', statusInfo.text)} />
                              <span className={statusInfo.text}>{statusInfo.label}</span>
                            </span>
                          </div>

                          {/* Time details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border/50">
                              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10">
                                <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Check In</p>
                                <p className="text-sm font-medium text-foreground">{record.check_in_time ? formatTime(record.check_in_time) : '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border/50">
                              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10">
                                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Check Out</p>
                                <p className="text-sm font-medium text-foreground">{record.check_out_time ? formatTime(record.check_out_time) : '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border/50">
                              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10">
                                <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Duration</p>
                                <p className="text-sm font-medium text-foreground">{duration ? `${duration.hours}h ${duration.minutes}m` : '—'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-end gap-3 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                            <span>Created: {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}</span>
                            {record.updated_at && record.updated_at !== record.created_at && (
                              <><span>•</span><span>Updated: {formatDistanceToNow(new Date(record.updated_at), { addSuffix: true })}</span></>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="rounded-2xl border border-border bg-card px-6 py-3.5 shadow-sm sticky bottom-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground">
                      {isFetchingAttendance ? "Updating..." : `Page ${currentPage + 1} of ${totalPages} · ${total} records`}
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <div className={cn("rounded-xl", (isFirstPage || isFetchingAttendance) && "pointer-events-none opacity-50")}>
                            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (!isFirstPage && !isFetchingAttendance) handlePageChange(currentPage - 1); }} className="rounded-xl" />
                          </div>
                        </PaginationItem>
                        {getVisiblePages().map(pageNum => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => { e.preventDefault(); if (!isFetchingAttendance) handlePageChange(pageNum); }}
                              className={cn("rounded-xl border cursor-pointer", currentPage === pageNum ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted", isFetchingAttendance && "pointer-events-none opacity-50")}
                            >
                              {pageNum + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <div className={cn("rounded-xl", (isLastPage || isFetchingAttendance) && "pointer-events-none opacity-50")}>
                            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (!isLastPage && !isFetchingAttendance) handlePageChange(currentPage + 1); }} className="rounded-xl" />
                          </div>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-3xl border border-border bg-card shadow-sm flex flex-col items-center gap-4 py-20 px-6 text-center max-w-xs mx-auto" style={{maxWidth: '100%'}}>
              <div className="flex flex-col items-center gap-4 max-w-xs">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                    <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 scale-110 rounded-3xl border border-border/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No records found</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Try adjusting your filters or search criteria</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default HistoryPage;