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
import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
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

function AttendanceCurrentUserListsPage({ user }: { user: User }) {
  // All hooks must be called at the top level, unconditionally
  const { data, isLoading, isError } = useGetCurrentAttendance();
  console.log("Attendance data:", data);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'phone'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { mutate: check_in, isPending: isCheckingIn } = useCheckInEmployee();
  const { mutate: check_out, isPending: isCheckingOut } = useCheckOutEmployee();
  // const { mutate: deleteAttendance, isPending: isDeleting } = useDeleteAttendance();
  // const { mutate: updateStatus, isPending: isUpdating } = useUpdateAttendanceStatus();

  const isAnyProcessing = isCheckingIn || isCheckingOut || processingEmployeeId !== null;

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

  const handleCheckIn = (employeeId: string) => {
    if (!employeeId || isAnyProcessing) return;

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
    if (!employeeId || isAnyProcessing) return;

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
    if (!selectedEmployee?.attendance?.id || isAnyProcessing) return;

    setProcessingEmployeeId(selectedEmployee.employee_id);
    // deleteAttendance(selectedEmployee.attendance.id, {
    //   onSuccess: (res) => {
    //     if (res.success) {
    //       toast.success("Attendance record deleted successfully");
    //       queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
    //       setDeleteDialogOpen(false);
    //       setSelectedEmployee(null);
    //     }
    //     setProcessingEmployeeId(null);
    //   },
    //   onError: (err) => {
    //     toast.error((err as Error).message || "Failed to delete attendance record");
    //     setProcessingEmployeeId(null);
    //   }
    // });
  };

  const handleUpdateStatus = () => {
    if (!selectedEmployee?.attendance?.id || !selectedStatus || isAnyProcessing) return;

    setProcessingEmployeeId(selectedEmployee.employee_id);
    // updateStatus(
    //   { attendanceId: selectedEmployee.attendance.id, status: selectedStatus },
    //   {
    //     onSuccess: (res) => {
    //       if (res.success) {
    //         toast.success("Attendance status updated successfully");
    //         queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] });
    //         setStatusDialogOpen(false);
    //         setSelectedEmployee(null);
    //         setSelectedStatus('');
    //       }
    //       setProcessingEmployeeId(null);
    //     },
    //     onError: (err) => {
    //       toast.error((err as Error).message || "Failed to update attendance status");
    //       setProcessingEmployeeId(null);
    //     }
    //   }
    // );
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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
    // Disable if:
    // 1. Already checked in
    // 2. Any processing is happening
    // 3. This specific employee is being processed
    return emp.attendance?.check_in_time != null ||
      isAnyProcessing ||
      processingEmployeeId === emp.employee_id;
  };

  const isCheckOutDisabled = (emp: AttendanceData) => {
    // Disable if:
    // 1. No attendance record
    // 2. No check-in time
    // 3. Already checked out
    // 4. Any processing is happening
    // 5. This specific employee is being processed
    return !emp.attendance ||
      !emp.attendance.check_in_time ||
      emp.attendance.check_out_time != null ||
      isAnyProcessing ||
      processingEmployeeId === emp.employee_id;
  };

  const isBothCheckedInAndOut = (emp: AttendanceData) => {
    return emp.attendance?.check_in_time != null && emp.attendance?.check_out_time != null;
  };

  const canShowActions = (emp: AttendanceData) => {
    // Only show actions if attendance exists and check-in is done
    return emp.attendance && emp.attendance.check_in_time != null;
  };

  const openDeleteDialog = (emp: AttendanceData) => {
    setSelectedEmployee(emp);
    setDeleteDialogOpen(true);
  };

  const openStatusDialog = (emp: AttendanceData) => {
    setSelectedEmployee(emp);
    setSelectedStatus(emp.attendance?.status || '');
    setStatusDialogOpen(true);
  };

  // Handle loading state - now after all hooks
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state - now after all hooks
  if (isError) {
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">
            <p className="text-lg font-semibold">Error loading attendance data</p>
            <p className="mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Date */}
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
        <h2 className="flex justify-between border-b px-6 py-4 font-semibold"><span>Employee Attendance </span>
          <span>{new Date().toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}</span>
        </h2>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isProcessingThisUser = processingEmployeeId === emp.employee_id;
                const bothDone = isBothCheckedInAndOut(emp);
                const showActions = canShowActions(emp);

                return (
                  <TableRow key={emp.employee_id} className={isProcessingThisUser ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {emp.employee_image ? (
                            <AvatarImage src={emp.employee_image} alt={emp.employee_name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckIn(emp.employee_id)}
                          disabled={isCheckInDisabled(emp)}
                          title={bothDone ? "Already checked in and out" : isCheckInDisabled(emp) ? "Already checked in" : "Check in"}
                        >
                          {isProcessingThisUser && !emp.attendance?.check_in_time ? "Checking In..." : "Check In"}
                        </Button>
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

                        <DropdownMenu >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isProcessingThisUser || !showActions}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openStatusDialog(emp)}
                              disabled={isProcessingThisUser}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(emp)}
                              className="text-destructive focus:text-destructive"
                              disabled={isProcessingThisUser}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Record
                            </DropdownMenuItem>
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
            <AlertDialogCancel disabled={isAnyProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttendance}
              disabled={isAnyProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Attendance Status</DialogTitle>
            <DialogDescription>
              Change the attendance status for {selectedEmployee?.employee_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={isAnyProcessing}
            >
              <SelectTrigger>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isAnyProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || isAnyProcessing || selectedStatus === selectedEmployee?.attendance?.status}
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AttendanceCurrentUserListsPage;