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
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetAttendanceHistory } from '@/utils/hooks/tanstack-query/query-hook/attendance/use-get-attendance-history';
import { useGetUsersByName } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-user-by-name';
import { useDebounce } from '@/utils/helper/debounce';
import AttendnaceHistoryCard from './attendance-history-card';
import { format, isSameDay, isAfter, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {  AttendanceHistoryData, AttendanceStatus } from '@/utils/types/attendance.types';
import { Role, UsersForAttendance } from '@/utils/types/user.types';

// Status colors with icons
const statusColors: Record<AttendanceStatus, { 
  bg: string; 
  text: string; 
  icon: React.ElementType;
  label: string;
}> = {
  present: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2,
    label: 'Present'
  },
  absent: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: XCircle,
    label: 'Absent'
  },
  leave: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: CalendarDays,
    label: 'On Leave'
  },
  late: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: AlertCircle,
    label: 'Late'
  },
  half_day: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: Timer,
    label: 'Half Day'
  },
};

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cashier: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  chef: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  waiter: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  delivery_staff: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  customer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
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

// Calculate work duration
const calculateWorkDuration = (checkIn: Date, checkOut?: Date) => {
  if (!checkOut) return null;
  
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const durationMs = end - start;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

function HistoryPage() {
  // State for temporary filter values (not applied yet)
  const [tempFilters, setTempFilters] = useState<{
    limit: number;
    fromDate: Date | undefined;
    toDate: Date | undefined;
    selectedUser: UsersForAttendance | null;
    searchName: string;
    sortOrder: 'asc' | 'desc';
  }>({
    limit: 5,
    fromDate: undefined,
    toDate: undefined,
    selectedUser: null,
    searchName: '',
    sortOrder: 'desc',
  });

  // State for applied query (used in API call)
  const [appliedQuery, setAppliedQuery] = useState<HistoryQueryType>({
    limit: 5,
    page: 0,
    startingDate: '',
    endingDate: '',
    search: '',
  });

  const [showUserResults, setShowUserResults] = useState(false);
  const [showFilterNotice, setShowFilterNotice] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchName = useDebounce(tempFilters.searchName, 1000);

  const { 
    data: usersData, 
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers 
  } = useGetUsersByName(debouncedSearchName);
  
  const { 
    data: attendanceData, 
    isLoading: isLoadingAttendance,
    isFetching: isFetchingAttendance,
    refetch: refetchAttendance 
  } = useGetAttendanceHistory(appliedQuery);

  console.log("this is applied query : ", appliedQuery)
  console.log("this is attendance data : ", attendanceData)
  
  const attendanceHistory = attendanceData?.attendanceHistory ?? [];
  const attendanceStats = attendanceData?.attendanceStats;
  const total = attendanceData?.total || 0;
  const currentPage = attendanceData?.page || 0;
  const totalPages = total ? Math.ceil(total / appliedQuery.limit) : 1;
  const isFirstPage = currentPage === 0;
  const isLastPage = !attendanceData?.hasMore || currentPage === totalPages - 1;

  // Group attendance by date
  const groupedAttendance = React.useMemo(() => {
    const groups: { [key: string]: AttendanceHistoryData[] } = {};
    
    const sortedHistory = [...attendanceHistory].sort((a, b) => {
      const dateA = new Date(a.work_date).getTime();
      const dateB = new Date(b.work_date).getTime();
      return tempFilters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    sortedHistory.forEach(record => {
      const date = new Date(record.work_date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });

    return groups;
  }, [attendanceHistory, tempFilters.sortOrder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowUserResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (user: UsersForAttendance) => {
    setTempFilters(prev => ({ 
      ...prev, 
      selectedUser: user,
      searchName: user.name 
    }));
    setShowUserResults(false);
    setShowFilterNotice(true);
  };

  const handleClearSelectedUser = () => {
    setTempFilters(prev => ({ 
      ...prev, 
      selectedUser: null,
      searchName: '' 
    }));
    setShowFilterNotice(true);
  };

  const validateDates = (from?: Date, to?: Date) => {
    if (from && isAfter(from, TODAY)) {
      toast.error("From date cannot be in the future");
      return false;
    }
    if (to && isAfter(to, TODAY)) {
      toast.error("To date cannot be in the future");
      return false;
    }
    if (from && to && from > to) {
      toast.error("From date cannot be after To date");
      return false;
    }
    return true;
  };

  const handleApplyFilters = () => {
    if (!validateDates(tempFilters.fromDate, tempFilters.toDate)) return;

    setAppliedQuery({
      limit: tempFilters.limit,
      page: 0,
      startingDate: tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : "",
      endingDate: tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : "",
      search: tempFilters.selectedUser?.id || '',
    });
    setShowFilterNotice(false);
  };

  const handleResetFilters = () => {
    setTempFilters({
      limit: 5,
      fromDate: undefined,
      toDate: undefined,
      selectedUser: null,
      searchName: '',
      sortOrder: 'desc',
    });
    setAppliedQuery({
      limit: 5,
      page: 0,
      startingDate: '',
      endingDate: '',
      search: '',
    });
    setShowFilterNotice(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages || isFetchingAttendance) return;
    setAppliedQuery(prev => ({ ...prev, page: newPage }));
  };

  const toggleSortOrder = () => {
    setTempFilters(prev => ({ 
      ...prev, 
      sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' 
    }));
    setShowFilterNotice(true);
  };

  const handleRefresh = () => {
    refetchAttendance();
  };

  const handleLimitChange = (value: string) => {
    setTempFilters(prev => ({ ...prev, limit: parseInt(value) }));
    setShowFilterNotice(true);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

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

  // Check if filters have been changed but not applied
  const hasUnappliedFilters = () => {
    const filtersChanged = 
      tempFilters.limit !== appliedQuery.limit ||
      tempFilters.fromDate !== (appliedQuery.startingDate ? new Date(appliedQuery.startingDate) : undefined) ||
      tempFilters.toDate !== (appliedQuery.endingDate ? new Date(appliedQuery.endingDate) : undefined) ||
      tempFilters.selectedUser?.id !== appliedQuery.search;
    
    return filtersChanged;
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Stats and Refresh */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Attendance History
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Track and manage employee attendance records
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetchingAttendance}
              className="relative"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingAttendance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {attendanceStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AttendnaceHistoryCard 
              value={attendanceStats.total_records || 0} 
              text="Total"
              icon={<CalendarDays className="w-4 h-4" />}
              color="blue"
              duration={2.5}
              isLoading={isFetchingAttendance}
            />
            <AttendnaceHistoryCard 
              value={attendanceStats.present_count || 0} 
              text="Present"
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="green"
              duration={2}
              isLoading={isFetchingAttendance}
            />
            <AttendnaceHistoryCard 
              value={attendanceStats.absent_count || 0} 
              text="Absent"
              icon={<XCircle className="w-4 h-4" />}
              color="red"
              duration={2}
              isLoading={isFetchingAttendance}
            />
            <AttendnaceHistoryCard 
              value={attendanceStats.leave_count || 0} 
              text="Leave"
              icon={<CalendarDays className="w-4 h-4" />}
              color="purple"
              duration={2}
              isLoading={isFetchingAttendance}
            />
            <AttendnaceHistoryCard 
              value={attendanceStats.late_count || 0} 
              text="Late"
              icon={<AlertCircle className="w-4 h-4" />}
              color="yellow"
              duration={2}
              isLoading={isFetchingAttendance}
            />
            <AttendnaceHistoryCard 
              value={attendanceStats.half_day_count || 0} 
              text="Half Day"
              icon={<Timer className="w-4 h-4" />}
              color="orange"
              duration={2}
              isLoading={isFetchingAttendance}
            />
          </div>
        )}

        {/* Filter Section */}
        <Card className="p-4 md:p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Filters
            </h2>
            {showFilterNotice && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-500 animate-pulse">
                Click Apply Filters to update results
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            {/* User Search with Results */}
            <div className="space-y-2 relative" ref={searchRef}>
              <Label htmlFor="user-search" className="text-sm font-medium">
                Search User
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="user-search"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={tempFilters.searchName}
                  onChange={(e) => {
                    setTempFilters(prev => ({ ...prev, searchName: e.target.value }));
                    setShowUserResults(true);
                    if (tempFilters.selectedUser) {
                      setTempFilters(prev => ({ ...prev, selectedUser: null }));
                    }
                  }}
                  onFocus={() => setShowUserResults(true)}
                  className="pl-10 pr-10"
                  disabled={isFetchingUsers}
                />
                {tempFilters.selectedUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={handleClearSelectedUser}
                    type="button"
                    disabled={isFetchingAttendance}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>

              {/* User Results Dropdown */}
              {showUserResults && debouncedSearchName && (
                <Card className="absolute z-10 mt-1 w-full bg-popover shadow-lg border border-border rounded-md overflow-hidden">
                  {isFetchingUsers ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Searching users...
                    </div>
                  ) : usersData?.users && usersData.users.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                      {usersData.users.map((user: UsersForAttendance, index: number) => (
                        <button
                          key={`${user.email}-${index}`}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                          onClick={() => handleUserSelect(user)}
                          type="button"
                          disabled={isFetchingAttendance}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email} • {user.phone}
                            </p>
                          </div>
                          <Badge 
                            variant={user.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Selected User Display */}
            {tempFilters.selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={tempFilters.selectedUser.image} alt={tempFilters.selectedUser.name} />
                  <AvatarFallback className="bg-primary/10 text-xs">
                    {tempFilters.selectedUser.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Selected: {tempFilters.selectedUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tempFilters.selectedUser.email} • {tempFilters.selectedUser.phone}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tempFilters.selectedUser.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            )}

            {/* Date Range and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* From Date */}
              <div className="space-y-2">
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={tempFilters.fromDate ? format(tempFilters.fromDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    setTempFilters(prev => ({ 
                      ...prev, 
                      fromDate: e.target.value ? new Date(e.target.value) : undefined 
                    }));
                    setShowFilterNotice(true);
                  }}
                  max={format(TODAY, "yyyy-MM-dd")}
                  className="w-full"
                  disabled={isFetchingAttendance}
                />
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={tempFilters.toDate ? format(tempFilters.toDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    setTempFilters(prev => ({ 
                      ...prev, 
                      toDate: e.target.value ? new Date(e.target.value) : undefined 
                    }));
                    setShowFilterNotice(true);
                  }}
                  max={format(TODAY, "yyyy-MM-dd")}
                  className="w-full"
                  disabled={isFetchingAttendance}
                />
              </div>

              {/* Items per page */}
              <div className="space-y-2">
                <Label htmlFor="items-per-page">Items per page</Label>
                <Select
                  value={tempFilters.limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isFetchingAttendance}
                >
                  <SelectTrigger id="items-per-page">
                    <SelectValue placeholder="Select limit" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={toggleSortOrder}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isFetchingAttendance}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Sort {tempFilters.sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleApplyFilters}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
                disabled={isFetchingAttendance}
              >
                {isFetchingAttendance ? 'Applying...' : 'Apply Filters'}
              </Button>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="border border-input flex-1 sm:flex-none"
                disabled={isFetchingAttendance}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        <div className={cn(
          "transition-opacity duration-300",
          isFetchingAttendance ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
          {isLoadingAttendance ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading attendance records...</p>
              </div>
            </Card>
          ) : attendanceHistory.length > 0 ? (
            <div className="space-y-6">
              {/* Grouped Attendance Records */}
              {Object.entries(groupedAttendance).map(([date, records]) => (
                <Card key={date} className="p-4 md:p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {formatDate(date)}
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        {records.length} {records.length === 1 ? 'record' : 'records'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {records.map((record) => {
                      const StatusIcon = statusColors[record.status]?.icon || HelpCircle;
                      const statusInfo = statusColors[record.status] || statusColors.absent;
                      const duration = record.check_out_time ? calculateWorkDuration(record.check_in_time, record.check_out_time) : null;
                      
                      return (
                        <div
                          key={record.id}
                          className="flex flex-col p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors gap-4"
                        >
                          {/* Employee Info Row */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-background">
                              <AvatarImage src={record.employee_image} alt={record.employee_name} />
                              <AvatarFallback className="bg-primary/10">
                                {record.employee_name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-base font-semibold text-foreground">
                                  {record.employee_name}
                                </p>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${roleColors[record.employee_role]}`}
                                >
                                  {record.employee_role.replace('_', ' ')}
                                </Badge>
                                {record.need_review && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                    Needs Review
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{record.employee_email}</span>
                                <span>•</span>
                                <span>{record.employee_phone}</span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bg}`}>
                              <StatusIcon className={`w-4 h-4 ${statusInfo.text}`} />
                              <span className={`text-sm font-medium capitalize ${statusInfo.text}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Time Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                            {/* Check In Time */}
                            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <LogIn className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Check In</p>
                                <p className="text-sm font-medium">
                                  {record.check_in_time ? formatTime(record.check_in_time) : '—'}
                                </p>
                              </div>
                            </div>

                            {/* Check Out Time */}
                            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                              <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Check Out</p>
                                <p className="text-sm font-medium">
                                  {record.check_out_time ? formatTime(record.check_out_time) : '—'}
                                </p>
                              </div>
                            </div>

                            {/* Work Duration */}
                            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="text-sm font-medium">
                                  {duration ? `${duration.hours}h ${duration.minutes}m` : '—'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Row */}
                          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2 mt-1">
                            <span>Created: {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}</span>
                            {record.updated_at && record.updated_at !== record.created_at && (
                              <>
                                <span>•</span>
                                <span>Updated: {formatDistanceToNow(new Date(record.updated_at), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="w-full sticky bottom-0 mt-4 border-t bg-background/90 backdrop-blur border-border py-4">
                  <div className="container mx-auto px-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Info */}
                      <div className="text-sm text-muted-foreground">
                        {isFetchingAttendance
                          ? "Updating..."
                          : `Page ${currentPage + 1} of ${totalPages} • ${total} records total`}
                      </div>

                      {/* Pagination */}
                      <Pagination>
                        <PaginationContent>
                          
                          {/* Previous */}
                          <PaginationItem>
                            <div
                              className={cn(
                                "rounded-md",
                                (isFirstPage || isFetchingAttendance) &&
                                "pointer-events-none opacity-50"
                              )}
                            >
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!isFirstPage && !isFetchingAttendance) {
                                    handlePageChange(currentPage - 1);
                                  }
                                }}
                              />
                            </div>
                          </PaginationItem>

                          {/* Page Numbers */}
                          {getVisiblePages().map((pageNum) => (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!isFetchingAttendance) {
                                    handlePageChange(pageNum);
                                  }
                                }}
                                className={cn(
                                  "border cursor-pointer",
                                  currentPage === pageNum
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:bg-muted",
                                  isFetchingAttendance && "pointer-events-none opacity-50"
                                )}
                              >
                                {pageNum + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          {/* Next */}
                          <PaginationItem>
                            <div
                              className={cn(
                                "rounded-md",
                                (isLastPage || isFetchingAttendance) &&
                                "pointer-events-none opacity-50"
                              )}
                            >
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!isLastPage && !isFetchingAttendance) {
                                    handlePageChange(currentPage + 1);
                                  }
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
          ) : (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <CalendarDays className="w-12 h-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">No attendance records found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

export default HistoryPage;