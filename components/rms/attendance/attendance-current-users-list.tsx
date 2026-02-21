"use client"
import { useGetCurrentAttendance } from '@/utils/hooks/tanstack-query/query-hook/attendance/use-get-current-attendance'
import { AttendanceData, CurrentAttendanceStats } from '@/utils/types/attendance.types';
import { User } from '@/utils/types/user.types'
import React, { useMemo, useState } from 'react'
import AttendanceCard from './attendance-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCheckInEmployee } from '@/utils/hooks/tanstack-query/mutate-hook/attendance/use-check-in-user';
import { useCheckOutEmployee } from '@/utils/hooks/tanstack-query/mutate-hook/attendance/use-check-out-user';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Clock, XCircle, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getAvatarColor } from '../client-management/client-table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDeleteAttendance } from '@/utils/hooks/tanstack-query/mutate-hook/attendance/use-delete-attendance';
import { useUpdateAttendance } from '@/utils/hooks/tanstack-query/mutate-hook/attendance/use-update-attendance';
import { AttendanceStatus } from '@/utils/types/attendance.types';
import AttendanceHeader from './attendance-header';
import { hasPermission } from '@/utils/helper/check-permission';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define the AttendanceUpdate type matching the expected export
interface AttendanceUpdate {
  attendance_id: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  need_review: boolean;
  status: AttendanceStatus;
}

// Validation error interface
interface ValidationErrors {
  checkInTime?: string;
  checkOutTime?: string;
  timeOrder?: string;
  invalidCombination?: string;
}

// Table Skeleton Component
const TableSkeleton = () => (
  <div className="rounded-lg border bg-card overflow-hidden">
    <div className="border-b px-6 py-4">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="p-8">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

function AttendanceCurrentUserListsPage({ user }: { user: User }) {
  // All hooks must be called at the top level, unconditionally
  const { data, isLoading, isError, refetch, isRefetching } = useGetCurrentAttendance();
  console.log("Attendance data:", data);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'phone'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | ''>('');
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [needReview, setNeedReview] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('status');
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const queryClient = useQueryClient();
  const { mutate: check_in, isPending: isCheckingIn } = useCheckInEmployee();
  const { mutate: check_out, isPending: isCheckingOut } = useCheckOutEmployee();
  const { mutate: deleteAttendance, isPending: isDeleting } = useDeleteAttendance();
  const { mutate: updateAttendance, isPending: isUpdating } = useUpdateAttendance();

  const isAnyProcessing = isCheckingIn || isCheckingOut || isDeleting || isUpdating || processingEmployeeId !== null;

  // Get today's date
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM do, yyyy');

  // Safe access with default values - moved before conditional returns
  const stats: CurrentAttendanceStats = data?.stats || {
    total_employees: 0,
    present_employees: 0,
    absent_employees: 0,
    leave_employees: 0
  };

  const employees: AttendanceData[] = data?.employees || [];

  // Filter employees based on search term and filter type
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const lowerSearch = searchTerm.toLowerCase();

    return employees.filter((emp) => {
      if (filterType === 'all') {
        return (
          emp.employee_name.toLowerCase().includes(lowerSearch) ||
          emp.employee_email.toLowerCase().includes(lowerSearch) ||
          emp.employee_phone.toLowerCase().includes(lowerSearch)
        );
      } else if (filterType === 'name') {
        return emp.employee_name.toLowerCase().includes(lowerSearch);
      } else if (filterType === 'email') {
        return emp.employee_email.toLowerCase().includes(lowerSearch);
      } else if (filterType === 'phone') {
        return emp.employee_phone.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  }, [employees, searchTerm, filterType]);

  // Validate time inputs
  const validateTimes = (checkIn: string, checkOut: string): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Case 1: Check-out exists but check-in is empty (invalid)
    if (checkOut && !checkIn) {
      errors.invalidCombination = "Check-out time cannot be set without check-in time";
      return errors;
    }

    // Case 2: Both times are present - validate order
    if (checkIn && checkOut) {
      const [checkInHours, checkInMinutes] = checkIn.split(':').map(Number);
      const [checkOutHours, checkOutMinutes] = checkOut.split(':').map(Number);

      // Handle overnight shifts (check-out next day)
      if (checkOutHours < checkInHours || (checkOutHours === checkInHours && checkOutMinutes < checkInMinutes)) {
        errors.timeOrder = "Check-out time is earlier than check-in time. This will be treated as next day.";
      }
    }

    // Validate individual time formats
    if (checkIn && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(checkIn)) {
      errors.checkInTime = "Invalid check-in time format";
    }

    if (checkOut && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(checkOut)) {
      errors.checkOutTime = "Invalid check-out time format";
    }

    return errors;
  };

  // Handle check-in time change with validation
  const handleCheckInTimeChange = (value: string) => {
    setCheckInTime(value);
    // If check-in is cleared and check-out exists, show validation error
    if (!value && checkOutTime) {
      setValidationErrors({
        invalidCombination: "Check-out time cannot be set without check-in time"
      });
    } else {
      const errors = validateTimes(value, checkOutTime);
      setValidationErrors(errors);
    }
  };

  // Handle check-out time change with validation
  const handleCheckOutTimeChange = (value: string) => {
    setCheckOutTime(value);
    const errors = validateTimes(checkInTime, value);
    setValidationErrors(errors);
  };

  // Clear check-in time
  const clearCheckInTime = () => {
    setCheckInTime('');
    // If check-out exists, show validation error
    if (checkOutTime) {
      setValidationErrors({
        invalidCombination: "Check-out time cannot be set without check-in time"
      });
    } else {
      setValidationErrors({});
    }
  };

  // Clear check-out time
  const clearCheckOutTime = () => {
    setCheckOutTime('');
    // Re-validate with just check-in
    const errors = validateTimes(checkInTime, '');
    setValidationErrors(errors);
  };

  // Clear both times
  const clearBothTimes = () => {
    setCheckInTime('');
    setCheckOutTime('');
    setValidationErrors({});
  };

  const handleCheckIn = (employeeId: string) => {
    if (!employeeId || isAnyProcessing || isRefetching) return;

    setProcessingEmployeeId(employeeId);
    check_in(employeeId, {
      onSuccess: (res) => {
        if (res.success && res.message) {
          toast.success(res.message || "User checked in successfully");
          queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
        }
        setProcessingEmployeeId(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || "Failed to check in user");
        setProcessingEmployeeId(null);
      }
    });
  };

  const handleCheckOut = (employeeId: string) => {
    if (!employeeId || isAnyProcessing || isRefetching) return;

    setProcessingEmployeeId(employeeId);
    check_out(employeeId, {
      onSuccess: (res) => {
        if (res.success && res.message) {
          toast.success(res.message || "User checked out successfully");
          queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
        }
        setProcessingEmployeeId(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || "Failed to check out user");
        setProcessingEmployeeId(null);
      }
    });
  };

  const handleDeleteAttendance = () => {
    if (!selectedEmployee?.attendance?.id || isAnyProcessing || isRefetching) return;

    setProcessingEmployeeId(selectedEmployee.employee_id);
    deleteAttendance(selectedEmployee.attendance.id, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("Attendance record deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
          // Only close dialog and reset after successful deletion
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
        }
        setProcessingEmployeeId(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || "Failed to delete attendance record");
        setProcessingEmployeeId(null);
      }
    });
  };

  const handleUpdateAttendance = () => {
    if (!selectedEmployee?.attendance?.id || !selectedEmployee?.employee_id || isAnyProcessing || isRefetching) return;

    // Validate times before submitting
    const errors = validateTimes(checkInTime, checkOutTime);
    if (Object.keys(errors).length > 0) {
      // Show validation errors
      if (errors.invalidCombination) {
        toast.error(errors.invalidCombination);
        return;
      }
      if (errors.timeOrder) {
        toast.warning(errors.timeOrder);
      } else {
        toast.error("Please fix validation errors before saving");
        return;
      }
    }

    // Ensure we have a valid status
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    setProcessingEmployeeId(selectedEmployee.employee_id);

    // Get the work date from existing attendance
    const workDate = selectedEmployee.attendance.work_date
      ? new Date(selectedEmployee.attendance.work_date)
      : new Date();

    // Prepare update data matching the AttendanceUpdate interface
    const updateData: AttendanceUpdate = {
      attendance_id: selectedEmployee.attendance.id,
      status: selectedStatus as AttendanceStatus,
      need_review: needReview,
    };

    // Handle check_in_time - can be null or a specific time
    if (checkInTime) {
      const [hours, minutes] = checkInTime.split(':');
      const checkInDate = new Date(workDate);
      checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      updateData.check_in_time = checkInDate.toISOString();
    } else {
      // If check-in time is cleared, set to null to remove it
      updateData.check_in_time = null;
    }

    // Handle check_out_time - only include if check-in exists
    if (checkOutTime && checkInTime) {
      const [hours, minutes] = checkOutTime.split(':');
      let checkOutDate = new Date(workDate);
      checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // If check-out time is earlier than check-in time, assume it's next day
      if (checkInTime) {
        const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
        if (parseInt(hours) < checkInHours || (parseInt(hours) === checkInHours && parseInt(minutes) < checkInMinutes)) {
          // Add one day for overnight shifts
          checkOutDate.setDate(checkOutDate.getDate() + 1);
        }
      }

      updateData.check_out_time = checkOutDate.toISOString();
    } else {
      // If check-out time is cleared or check-in doesn't exist, set to null
      updateData.check_out_time = null;
    }

    console.log("Updating attendance with:", updateData);

    updateAttendance(updateData, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("Attendance record updated successfully");
          queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
          resetUpdateDialog();
        }
        setProcessingEmployeeId(null);
      },
      onError: (err) => {
        toast.error((err as Error).message || "Failed to update attendance record");
        setProcessingEmployeeId(null);
      }
    });
  };

  const resetUpdateDialog = () => {
    setStatusDialogOpen(false);
    setSelectedEmployee(null);
    setSelectedStatus('');
    setCheckInTime('');
    setCheckOutTime('');
    setNeedReview(false);
    setActiveTab('status');
    setValidationErrors({});
  };

  const openStatusDialog = (emp: AttendanceData) => {
    setSelectedEmployee(emp);
    setSelectedStatus(emp.attendance?.status || '');
    setNeedReview(emp.attendance?.need_review || false);

    // Format existing times for the time inputs
    if (emp.attendance?.check_in_time) {
      const checkInDate = new Date(emp.attendance.check_in_time);
      const hours = checkInDate.getHours().toString().padStart(2, '0');
      const minutes = checkInDate.getMinutes().toString().padStart(2, '0');
      setCheckInTime(`${hours}:${minutes}`);
    } else {
      setCheckInTime('');
    }

    if (emp.attendance?.check_out_time) {
      const checkOutDate = new Date(emp.attendance.check_out_time);
      const hours = checkOutDate.getHours().toString().padStart(2, '0');
      const minutes = checkOutDate.getMinutes().toString().padStart(2, '0');
      setCheckOutTime(`${hours}:${minutes}`);
    } else {
      setCheckOutTime('');
    }

    // Clear any previous validation errors
    setValidationErrors({});
    setStatusDialogOpen(true);
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'half_day':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (emp: AttendanceData) => {
    if (!emp.attendance) return 'NOT ASSIGNED';
    return emp.attendance.status.replace('_', ' ').toUpperCase();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCheckInDisabled = (emp: AttendanceData) => {
    return emp.attendance?.check_in_time != null ||
      isAnyProcessing ||
      isRefetching ||
      processingEmployeeId === emp.employee_id;
  };

  const isCheckOutDisabled = (emp: AttendanceData) => {
    return !emp.attendance ||
      !emp.attendance.check_in_time ||
      emp.attendance.check_out_time != null ||
      isAnyProcessing ||
      isRefetching ||
      processingEmployeeId === emp.employee_id;
  };

  const isBothCheckedInAndOut = (emp: AttendanceData) => {
    return emp.attendance?.check_in_time != null && emp.attendance?.check_out_time != null;
  };

  const canShowActions = (emp: AttendanceData) => {
    // Show actions if employee has an attendance record with check-in
    return emp.attendance && emp.attendance.check_in_time != null;
  };

  const openDeleteDialog = (emp: AttendanceData) => {
    setSelectedEmployee(emp);
    setDeleteDialogOpen(true);
  };

  const hasChanges = () => {
    if (!selectedEmployee?.attendance) return false;

    const statusChanged = selectedStatus && selectedStatus !== selectedEmployee.attendance.status;
    const reviewChanged = needReview !== selectedEmployee.attendance.need_review;

    let checkInChanged = false;
    if (checkInTime && selectedEmployee.attendance.check_in_time) {
      const currentCheckIn = new Date(selectedEmployee.attendance.check_in_time);
      const [hours, minutes] = checkInTime.split(':');
      checkInChanged = currentCheckIn.getHours() !== parseInt(hours) ||
        currentCheckIn.getMinutes() !== parseInt(minutes);
    } else if (checkInTime && !selectedEmployee.attendance.check_in_time) {
      checkInChanged = true; // Adding check-in time where none existed
    } else if (!checkInTime && selectedEmployee.attendance.check_in_time) {
      checkInChanged = true; // Removing check-in time
    }

    let checkOutChanged = false;
    if (checkOutTime && selectedEmployee.attendance.check_out_time) {
      const currentCheckOut = new Date(selectedEmployee.attendance.check_out_time);
      const [hours, minutes] = checkOutTime.split(':');
      checkOutChanged = currentCheckOut.getHours() !== parseInt(hours) ||
        currentCheckOut.getMinutes() !== parseInt(minutes);
    } else if (checkOutTime && !selectedEmployee.attendance.check_out_time) {
      checkOutChanged = true; // Adding check-out time where none existed
    } else if (!checkOutTime && selectedEmployee.attendance.check_out_time) {
      checkOutChanged = true; // Removing check-out time
    }

    return statusChanged || reviewChanged || checkInChanged || checkOutChanged;
  };

  const isTimeValid = () => {
    // Check-out cannot exist without check-in
    if (checkOutTime && !checkInTime) return false;
    return Object.keys(validateTimes(checkInTime, checkOutTime)).length === 0;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">Manage employee attendance and check-in/check-out</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <AttendanceHeader formattedDate={formattedDate}  />
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">
            <p className="text-lg font-semibold">Error loading attendance data</p>
            <p className="mt-2">Please try refreshing the page</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="mt-4"
              disabled={isRefetching}
            >
              {isRefetching ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Date */}
      <AttendanceHeader formattedDate={formattedDate}  />

      {/* Statistics Card */}
      <AttendanceCard stats={stats} />

      {/* Filter Section */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Filter & Search</h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="text-sm font-medium">Search Term</label>
            <Input
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
              disabled={isRefetching}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Filter By</label>
            <div className="mt-1 flex gap-2">
              {(['all', 'name', 'email', 'phone'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                  disabled={isRefetching}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      {/* Employees Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div className='flex items-center gap-2'>
            <span className="font-semibold">Employee Attendance</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    className="h-8 w-8"
                    disabled={isRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRefetching ? 'Refreshing...' : 'Reload'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isRefetching && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Updating...
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {employees.length === 0 ? 'No employees found' : 'No employees match your search'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Work Date</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isProcessingThisUser = processingEmployeeId === emp.employee_id;
                const bothDone = isBothCheckedInAndOut(emp);
                const showActions = canShowActions(emp);

                return (
                  <TableRow 
                    key={emp.employee_id} 
                    className={cn(
                      isProcessingThisUser && 'opacity-50',
                      isRefetching && 'opacity-60'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {emp.employee_image ? (
                            <AvatarImage src={emp.employee_image} alt={emp.employee_name} />
                          ) : (
                            <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(emp.employee_name))}>
                              {getInitials(emp.employee_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-medium">{emp.employee_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.employee_email}</TableCell>
                    <TableCell className="text-sm">{emp.employee_phone}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
                          emp.attendance?.status
                        )}`}
                      >
                        {getStatusDisplay(emp)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTime(emp.attendance?.check_in_time)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTime(emp.attendance?.check_out_time)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(emp.attendance?.work_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.attendance?.need_review ? (
                        <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                          Needs Review
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Check In Button - Always visible, disabled if checked in or processing */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckIn(emp.employee_id)}
                          disabled={isCheckInDisabled(emp)}
                          title={
                            bothDone 
                              ? "Already checked in and out" 
                              : emp.attendance?.check_in_time 
                                ? "Already checked in" 
                                : "Check in"
                          }
                        >
                          {isProcessingThisUser && !emp.attendance?.check_in_time ? "Checking In..." : "Check In"}
                        </Button>

                        {/* Check Out Button - Visible, disabled if no check-in or already checked out */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(emp.employee_id)}
                          disabled={isCheckOutDisabled(emp)}
                          title={
                            bothDone
                              ? "Already checked in and out"
                              : !emp.attendance
                                ? "No attendance record"
                                : !emp.attendance.check_in_time
                                  ? "Must check in first"
                                  : emp.attendance.check_out_time
                                    ? "Already checked out"
                                    : "Check out"
                          }
                        >
                          {isProcessingThisUser && emp.attendance?.check_in_time && !emp.attendance?.check_out_time
                            ? "Checking Out..."
                            : "Check Out"}
                        </Button>

                        {/* Actions Dropdown - Only show if check-in is done */}
                       
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={isProcessingThisUser || isRefetching}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {hasPermission(user.role, "update:attendance") && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(emp)}
                                  disabled={isProcessingThisUser || isRefetching}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Attendance
                                </DropdownMenuItem>
                              )}
                              {hasPermission(user.role, "delete:attendance") && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(emp)}
                                  className="text-destructive focus:text-destructive"
                                  disabled={isProcessingThisUser || isRefetching}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Record
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attendance record for {selectedEmployee?.employee_name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAnyProcessing || isRefetching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttendance}
              disabled={isAnyProcessing || isRefetching}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Attendance Dialog with Tabs */}
      <Dialog open={statusDialogOpen} onOpenChange={(open) => {
        if (!open) resetUpdateDialog();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Make changes to attendance for {selectedEmployee?.employee_name}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Attendance Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as AttendanceStatus)}
                  disabled={isAnyProcessing || isRefetching}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployee?.attendance?.work_date && (
                <div className="rounded-md bg-muted p-3 mt-4">
                  <p className="text-sm font-medium">Work Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedEmployee.attendance.work_date)}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="time" className="space-y-4 py-4">
              <div className="space-y-4">
                {/* Check-in Time with Clear Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkInTime">Check-in Time</Label>
                    {checkInTime && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCheckInTime}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                        disabled={isAnyProcessing || isRefetching}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="checkInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => handleCheckInTimeChange(e.target.value)}
                      disabled={isAnyProcessing || isRefetching}
                      className={cn("flex-1", validationErrors.checkInTime && "border-destructive")}
                    />
                  </div>
                  {validationErrors.checkInTime && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.checkInTime}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Current: {formatTime(selectedEmployee?.attendance?.check_in_time)}
                  </p>
                </div>

                {/* Check-out Time with Clear Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkOutTime">Check-out Time</Label>
                    {checkOutTime && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCheckOutTime}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                        disabled={isAnyProcessing || isRefetching}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => handleCheckOutTimeChange(e.target.value)}
                      disabled={isAnyProcessing || isRefetching || !checkInTime}
                      className={cn("flex-1", validationErrors.checkOutTime && "border-destructive")}
                    />
                  </div>
                  {validationErrors.checkOutTime && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.checkOutTime}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Current: {formatTime(selectedEmployee?.attendance?.check_out_time)}
                  </p>
                </div>

                {/* Clear Both Times Button */}
                {(checkInTime || checkOutTime) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearBothTimes}
                    className="w-full text-xs"
                    disabled={isAnyProcessing || isRefetching}
                  >
                    <XCircle className="h-3 w-3 mr-2" />
                    Clear Both Times
                  </Button>
                )}

                {/* Validation Messages */}
                {validationErrors.invalidCombination && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validationErrors.invalidCombination}
                    </AlertDescription>
                  </Alert>
                )}

                {validationErrors.timeOrder && !validationErrors.invalidCombination && (
                  <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 text-xs">
                      {validationErrors.timeOrder}
                    </AlertDescription>
                  </Alert>
                )}

                {checkInTime && checkOutTime && !validationErrors.timeOrder && !validationErrors.invalidCombination && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm font-medium">Work Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateDuration(checkInTime, checkOutTime)}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needReview"
                  checked={needReview}
                  onCheckedChange={(checked) => setNeedReview(checked as boolean)}
                  disabled={isAnyProcessing || isRefetching}
                />
                <Label
                  htmlFor="needReview"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mark for Review
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When checked, this attendance record will be flagged for manager review.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={resetUpdateDialog}
              disabled={isAnyProcessing || isRefetching}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAttendance}
              disabled={!hasChanges() || !isTimeValid() || !selectedStatus || isAnyProcessing || isRefetching}
              className="sm:order-2"
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to calculate duration between two times
function calculateDuration(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours if end time is next day
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export default AttendanceCurrentUserListsPage;