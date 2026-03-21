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
import { MoreHorizontal, Pencil, Trash2, Clock, XCircle, RefreshCw, AlertCircle, Search } from 'lucide-react';
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

interface AttendanceUpdate {
  attendance_id: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  need_review: boolean;
  status: AttendanceStatus;
}

interface ValidationErrors {
  checkInTime?: string;
  checkOutTime?: string;
  timeOrder?: string;
  invalidCombination?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
    <div className="border-b border-border px-6 py-4">
      <div className="h-4 w-48 bg-muted rounded-full animate-pulse" />
    </div>
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-9 w-9 bg-muted rounded-xl" />
          <div className="flex-1 h-3 bg-muted rounded-full" />
          <div className="flex-1 h-3 bg-muted rounded-full" />
          <div className="flex-1 h-3 bg-muted rounded-full" />
          <div className="h-6 w-20 bg-muted rounded-xl" />
          <div className="h-6 w-20 bg-muted rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// ── Status helpers ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  present:  { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Present' },
  absent:   { dot: 'bg-rose-500',    bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       label: 'Absent'  },
  leave:    { dot: 'bg-amber-500',   bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     label: 'Leave'   },
  late:     { dot: 'bg-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',   label: 'Late'    },
  half_day: { dot: 'bg-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',       label: 'Half Day'},
};

const getStatusConfig = (status?: string) =>
  statusConfig[status ?? ''] ?? { dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground', label: 'N/A' };

// ── Main component ─────────────────────────────────────────────────────────────
function AttendanceCurrentUserListsPage({ user }: { user: User }) {
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

  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM do, yyyy');

  const stats: CurrentAttendanceStats = data?.stats || {
    total_employees: 0,
    present_employees: 0,
    absent_employees: 0,
    leave_employees: 0
  };

  const employees: AttendanceData[] = data?.employees || [];

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
      } else if (filterType === 'name') return emp.employee_name.toLowerCase().includes(lowerSearch);
      else if (filterType === 'email') return emp.employee_email.toLowerCase().includes(lowerSearch);
      else if (filterType === 'phone') return emp.employee_phone.toLowerCase().includes(lowerSearch);
      return true;
    });
  }, [employees, searchTerm, filterType]);

  const validateTimes = (checkIn: string, checkOut: string): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (checkOut && !checkIn) {
      errors.invalidCombination = "Check-out time cannot be set without check-in time";
      return errors;
    }
    if (checkIn && checkOut) {
      const [checkInHours, checkInMinutes] = checkIn.split(':').map(Number);
      const [checkOutHours, checkOutMinutes] = checkOut.split(':').map(Number);
      if (checkOutHours < checkInHours || (checkOutHours === checkInHours && checkOutMinutes < checkInMinutes)) {
        errors.timeOrder = "Check-out time is earlier than check-in time. This will be treated as next day.";
      }
    }
    if (checkIn && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(checkIn)) errors.checkInTime = "Invalid check-in time format";
    if (checkOut && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(checkOut)) errors.checkOutTime = "Invalid check-out time format";
    return errors;
  };

  const handleCheckInTimeChange = (value: string) => {
    setCheckInTime(value);
    if (!value && checkOutTime) setValidationErrors({ invalidCombination: "Check-out time cannot be set without check-in time" });
    else setValidationErrors(validateTimes(value, checkOutTime));
  };
  const handleCheckOutTimeChange = (value: string) => { setCheckOutTime(value); setValidationErrors(validateTimes(checkInTime, value)); };
  const clearCheckInTime = () => { setCheckInTime(''); if (checkOutTime) setValidationErrors({ invalidCombination: "Check-out time cannot be set without check-in time" }); else setValidationErrors({}); };
  const clearCheckOutTime = () => { setCheckOutTime(''); setValidationErrors(validateTimes(checkInTime, '')); };
  const clearBothTimes = () => { setCheckInTime(''); setCheckOutTime(''); setValidationErrors({}); };

  const handleCheckIn = (employeeId: string) => {
    if (!employeeId || isAnyProcessing || isRefetching) return;
    setProcessingEmployeeId(employeeId);
    check_in(employeeId, {
      onSuccess: (res) => { if (res.success && res.message) { toast.success(res.message || "User checked in successfully"); queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] }); } setProcessingEmployeeId(null); },
      onError: (err) => { toast.error((err as Error).message || "Failed to check in user"); setProcessingEmployeeId(null); }
    });
  };

  const handleCheckOut = (employeeId: string) => {
    if (!employeeId || isAnyProcessing || isRefetching) return;
    setProcessingEmployeeId(employeeId);
    check_out(employeeId, {
      onSuccess: (res) => { if (res.success && res.message) { toast.success(res.message || "User checked out successfully"); queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] }); } setProcessingEmployeeId(null); },
      onError: (err) => { toast.error((err as Error).message || "Failed to check out user"); setProcessingEmployeeId(null); }
    });
  };

  const handleDeleteAttendance = () => {
    if (!selectedEmployee?.attendance?.id || isAnyProcessing || isRefetching) return;
    setProcessingEmployeeId(selectedEmployee.employee_id);
    deleteAttendance(selectedEmployee.attendance.id, {
      onSuccess: (res) => { if (res.success) { toast.success("Attendance record deleted successfully"); queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] }); setDeleteDialogOpen(false); setSelectedEmployee(null); } setProcessingEmployeeId(null); },
      onError: (err) => { toast.error((err as Error).message || "Failed to delete attendance record"); setProcessingEmployeeId(null); }
    });
  };

  const handleUpdateAttendance = () => {
    if (!selectedEmployee?.attendance?.id || !selectedEmployee?.employee_id || isAnyProcessing || isRefetching) return;
    const errors = validateTimes(checkInTime, checkOutTime);
    if (Object.keys(errors).length > 0) {
      if (errors.invalidCombination) { toast.error(errors.invalidCombination); return; }
      if (errors.timeOrder) toast.warning(errors.timeOrder);
      else { toast.error("Please fix validation errors before saving"); return; }
    }
    if (!selectedStatus) { toast.error("Please select a status"); return; }
    setProcessingEmployeeId(selectedEmployee.employee_id);
    const workDate = selectedEmployee.attendance.work_date ? new Date(selectedEmployee.attendance.work_date) : new Date();
    const updateData: AttendanceUpdate = { attendance_id: selectedEmployee.attendance.id, status: selectedStatus as AttendanceStatus, need_review: needReview };
    if (checkInTime) { const [hours, minutes] = checkInTime.split(':'); const d = new Date(workDate); d.setHours(parseInt(hours), parseInt(minutes), 0, 0); updateData.check_in_time = d.toISOString(); } else { updateData.check_in_time = null; }
    if (checkOutTime && checkInTime) {
      const [hours, minutes] = checkOutTime.split(':'); let d = new Date(workDate); d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (checkInTime) { const [ci, cm] = checkInTime.split(':').map(Number); if (parseInt(hours) < ci || (parseInt(hours) === ci && parseInt(minutes) < cm)) d.setDate(d.getDate() + 1); }
      updateData.check_out_time = d.toISOString();
    } else { updateData.check_out_time = null; }
    console.log("Updating attendance with:", updateData);
    updateAttendance(updateData, {
      onSuccess: (res) => { if (res.success) { toast.success("Attendance record updated successfully"); queryClient.invalidateQueries({ queryKey: ["get-current-attendance"] }); resetUpdateDialog(); } setProcessingEmployeeId(null); },
      onError: (err) => { toast.error((err as Error).message || "Failed to update attendance record"); setProcessingEmployeeId(null); }
    });
  };

  const resetUpdateDialog = () => { setStatusDialogOpen(false); setSelectedEmployee(null); setSelectedStatus(''); setCheckInTime(''); setCheckOutTime(''); setNeedReview(false); setActiveTab('status'); setValidationErrors({}); };

  const openStatusDialog = (emp: AttendanceData) => {
    setSelectedEmployee(emp); setSelectedStatus(emp.attendance?.status || ''); setNeedReview(emp.attendance?.need_review || false);
    if (emp.attendance?.check_in_time) { const d = new Date(emp.attendance.check_in_time); setCheckInTime(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`); } else setCheckInTime('');
    if (emp.attendance?.check_out_time) { const d = new Date(emp.attendance.check_out_time); setCheckOutTime(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`); } else setCheckOutTime('');
    setValidationErrors({}); setStatusDialogOpen(true);
  };

  const formatTime = (dateString?: string | null) => { if (!dateString) return '—'; return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); };
  const formatDate = (dateString?: string | null) => { if (!dateString) return '—'; return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
  const getStatusDisplay = (emp: AttendanceData) => { if (!emp.attendance) return 'Not Assigned'; return emp.attendance.status.replace('_', ' '); };
  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isCheckInDisabled = (emp: AttendanceData) => emp.attendance?.check_in_time != null || isAnyProcessing || isRefetching || processingEmployeeId === emp.employee_id;
  const isCheckOutDisabled = (emp: AttendanceData) => !emp.attendance || !emp.attendance.check_in_time || emp.attendance.check_out_time != null || isAnyProcessing || isRefetching || processingEmployeeId === emp.employee_id;
  const isBothCheckedInAndOut = (emp: AttendanceData) => emp.attendance?.check_in_time != null && emp.attendance?.check_out_time != null;
  const canShowActions = (emp: AttendanceData) => emp.attendance && emp.attendance.check_in_time != null;
  const openDeleteDialog = (emp: AttendanceData) => { setSelectedEmployee(emp); setDeleteDialogOpen(true); };

  const hasChanges = () => {
    if (!selectedEmployee?.attendance) return false;
    const statusChanged = selectedStatus && selectedStatus !== selectedEmployee.attendance.status;
    const reviewChanged = needReview !== selectedEmployee.attendance.need_review;
    let checkInChanged = false;
    if (checkInTime && selectedEmployee.attendance.check_in_time) { const d = new Date(selectedEmployee.attendance.check_in_time); const [h, m] = checkInTime.split(':'); checkInChanged = d.getHours() !== parseInt(h) || d.getMinutes() !== parseInt(m); } else if (checkInTime && !selectedEmployee.attendance.check_in_time) checkInChanged = true; else if (!checkInTime && selectedEmployee.attendance.check_in_time) checkInChanged = true;
    let checkOutChanged = false;
    if (checkOutTime && selectedEmployee.attendance.check_out_time) { const d = new Date(selectedEmployee.attendance.check_out_time); const [h, m] = checkOutTime.split(':'); checkOutChanged = d.getHours() !== parseInt(h) || d.getMinutes() !== parseInt(m); } else if (checkOutTime && !selectedEmployee.attendance.check_out_time) checkOutChanged = true; else if (!checkOutTime && selectedEmployee.attendance.check_out_time) checkOutChanged = true;
    return statusChanged || reviewChanged || checkInChanged || checkOutChanged;
  };

  const isTimeValid = () => { if (checkOutTime && !checkInTime) return false; return Object.keys(validateTimes(checkInTime, checkOutTime)).length === 0; };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-2.5 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-64 bg-muted rounded-full animate-pulse" />
              <div className="h-3 w-48 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-28 bg-muted rounded-xl animate-pulse" />
              <div className="h-9 w-48 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        {/* KPI skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2"><div className="h-2.5 w-20 bg-muted rounded-full" /><div className="h-8 w-14 bg-muted rounded-xl" /></div>
                <div className="h-10 w-10 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="space-y-8">
        <AttendanceHeader formattedDate={formattedDate} />
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div className="absolute inset-0 scale-110 rounded-3xl border border-destructive/10" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Error loading data</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Unable to fetch attendance data. Please try again.</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl h-9 text-sm" disabled={isRefetching}>
              {isRefetching ? <><span className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />Refreshing...</> : <><RefreshCw className="mr-2 h-3.5 w-3.5" />Try Again</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <AttendanceHeader formattedDate={formattedDate} />

      {/* KPI Cards */}
      <AttendanceCard stats={stats} />

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Search */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background transition-colors rounded-xl border-border"
                disabled={isRefetching}
              />
            </div>
          </div>

          {/* Filter type segmented toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Filter By
            </label>
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
              {(['all', 'name', 'email', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  disabled={isRefetching}
                  className={cn(
                    'px-3 h-7 text-[11px] font-medium rounded-lg capitalize transition-colors',
                    filterType === type
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Showing <span className="font-medium text-foreground">{filteredEmployees.length}</span> of <span className="font-medium text-foreground">{employees.length}</span> employees
        </p>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex justify-between items-center border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-foreground">Employee Attendance</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetch()}
                    className="h-7 w-7 rounded-lg hover:bg-muted transition-colors"
                    disabled={isRefetching}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isRefetching ? 'Refreshing...' : 'Reload'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isRefetching && <span className="text-[11px] text-muted-foreground animate-pulse">Updating...</span>}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 px-6 text-center max-w-xs mx-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 scale-110 rounded-3xl border border-border/50" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {employees.length === 0 ? 'No employees found' : 'No matches found'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {employees.length === 0 ? 'No employee attendance data for today.' : 'Try adjusting your search or filter.'}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Employee</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Phone</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Check-in</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Check-out</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Work Date</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Review</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isProcessingThisUser = processingEmployeeId === emp.employee_id;
                const bothDone = isBothCheckedInAndOut(emp);
                const sc = getStatusConfig(emp.attendance?.status);

                return (
                  <TableRow
                    key={emp.employee_id}
                    className={cn(
                      'hover:bg-muted/20 transition-colors border-border',
                      isProcessingThisUser && 'opacity-50',
                      isRefetching && 'opacity-60'
                    )}
                  >
                    {/* Employee */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-xl ring-1 ring-border">
                          {emp.employee_image ? (
                            <AvatarImage src={emp.employee_image} alt={emp.employee_name} />
                          ) : (
                            <AvatarFallback className={cn("text-white text-xs font-medium rounded-xl", getAvatarColor(emp.employee_name))}>
                              {getInitials(emp.employee_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{emp.employee_name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{emp.employee_email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.employee_phone}</TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                        sc.bg, sc.text
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                        {getStatusDisplay(emp)}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{formatTime(emp.attendance?.check_in_time)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatTime(emp.attendance?.check_out_time)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(emp.attendance?.work_date)}</TableCell>

                    {/* Review badge */}
                    <TableCell>
                      {emp.attendance?.need_review ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Review
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckIn(emp.employee_id)}
                          disabled={isCheckInDisabled(emp)}
                          className="h-7 rounded-lg text-xs border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                          title={bothDone ? "Already checked in and out" : emp.attendance?.check_in_time ? "Already checked in" : "Check in"}
                        >
                          {isProcessingThisUser && !emp.attendance?.check_in_time ? (
                            <><span className="w-3 h-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-1" />In...</>
                          ) : "Check In"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(emp.employee_id)}
                          disabled={isCheckOutDisabled(emp)}
                          className="h-7 rounded-lg text-xs border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                          title={bothDone ? "Already checked in and out" : !emp.attendance ? "No attendance record" : !emp.attendance.check_in_time ? "Must check in first" : emp.attendance.check_out_time ? "Already checked out" : "Check out"}
                        >
                          {isProcessingThisUser && emp.attendance?.check_in_time && !emp.attendance?.check_out_time ? (
                            <><span className="w-3 h-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-1" />Out...</>
                          ) : "Check Out"}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-muted transition-colors"
                              disabled={isProcessingThisUser || isRefetching}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-border shadow-lg w-44">
                            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {hasPermission(user.role, "update:attendance") && (
                              <DropdownMenuItem onClick={() => openStatusDialog(emp)} disabled={isProcessingThisUser || isRefetching} className="rounded-lg text-sm gap-2 cursor-pointer">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Attendance
                              </DropdownMenuItem>
                            )}
                            {hasPermission(user.role, "delete:attendance") && (
                              <DropdownMenuItem onClick={() => openDeleteDialog(emp)} className="text-destructive focus:text-destructive rounded-lg text-sm gap-2 cursor-pointer hover:bg-destructive/10" disabled={isProcessingThisUser || isRefetching}>
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
          {/* Gold top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <AlertDialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
            <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              This will permanently delete the attendance record for <span className="font-medium text-foreground">{selectedEmployee?.employee_name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <AlertDialogCancel disabled={isAnyProcessing || isRefetching} className="rounded-xl h-9 text-sm border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttendance}
              disabled={isAnyProcessing || isRefetching}
              className="rounded-xl h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[80px]"
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? (
                <><span className="w-3.5 h-3.5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin mr-2" />Deleting...</>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Attendance Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={(open) => { if (!open) resetUpdateDialog(); }}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
          {/* Gold top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">Edit Attendance Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Make changes to attendance for <span className="font-medium text-foreground">{selectedEmployee?.employee_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/40 border border-border p-0.5 h-auto">
                <TabsTrigger value="status" className="rounded-lg text-xs font-medium h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">Status</TabsTrigger>
                <TabsTrigger value="time"   className="rounded-lg text-xs font-medium h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">Time</TabsTrigger>
                <TabsTrigger value="review" className="rounded-lg text-xs font-medium h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance Status</Label>
                  <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AttendanceStatus)} disabled={isAnyProcessing || isRefetching}>
                    <SelectTrigger id="status" className="h-9 rounded-xl border-border bg-muted/40 text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedEmployee?.attendance?.work_date && (
                  <div className="rounded-xl bg-muted/40 border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work Date</p>
                    <p className="text-sm text-foreground mt-0.5">{formatDate(selectedEmployee.attendance.work_date)}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="time" className="space-y-4 py-4">
                {/* Check-in */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkInTime" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check-in Time</Label>
                    {checkInTime && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearCheckInTime} disabled={isAnyProcessing || isRefetching} className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                        <XCircle className="h-3 w-3 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                  <Input id="checkInTime" type="time" value={checkInTime} onChange={(e) => handleCheckInTimeChange(e.target.value)} disabled={isAnyProcessing || isRefetching} className={cn("h-9 rounded-xl bg-muted/30 focus:bg-background transition-colors text-sm border-border", validationErrors.checkInTime && "border-destructive")} />
                  {validationErrors.checkInTime && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.checkInTime}</p>}
                  <p className="text-xs text-muted-foreground">Current: {formatTime(selectedEmployee?.attendance?.check_in_time)}</p>
                </div>

                {/* Check-out */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkOutTime" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check-out Time</Label>
                    {checkOutTime && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearCheckOutTime} disabled={isAnyProcessing || isRefetching} className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                        <XCircle className="h-3 w-3 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                  <Input id="checkOutTime" type="time" value={checkOutTime} onChange={(e) => handleCheckOutTimeChange(e.target.value)} disabled={isAnyProcessing || isRefetching || !checkInTime} className={cn("h-9 rounded-xl bg-muted/30 focus:bg-background transition-colors text-sm border-border", validationErrors.checkOutTime && "border-destructive")} />
                  {validationErrors.checkOutTime && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.checkOutTime}</p>}
                  <p className="text-xs text-muted-foreground">Current: {formatTime(selectedEmployee?.attendance?.check_out_time)}</p>
                </div>

                {(checkInTime || checkOutTime) && (
                  <Button type="button" variant="outline" size="sm" onClick={clearBothTimes} className="w-full text-xs rounded-xl border-border" disabled={isAnyProcessing || isRefetching}>
                    <XCircle className="h-3 w-3 mr-2" />Clear Both Times
                  </Button>
                )}

                {validationErrors.invalidCombination && (
                  <Alert variant="destructive" className="rounded-xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{validationErrors.invalidCombination}</AlertDescription></Alert>
                )}
                {validationErrors.timeOrder && !validationErrors.invalidCombination && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 rounded-xl"><AlertCircle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">{validationErrors.timeOrder}</AlertDescription></Alert>
                )}
                {checkInTime && checkOutTime && !validationErrors.timeOrder && !validationErrors.invalidCombination && (
                  <div className="rounded-xl bg-muted/40 border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work Duration</p>
                    <p className="text-sm text-foreground mt-0.5">{calculateDuration(checkInTime, checkOutTime)}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-4 py-4">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <Checkbox id="needReview" checked={needReview} onCheckedChange={(checked) => setNeedReview(checked as boolean)} disabled={isAnyProcessing || isRefetching} className="rounded" />
                  <Label htmlFor="needReview" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Mark for Review
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When checked, this attendance record will be flagged for manager review.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={resetUpdateDialog} disabled={isAnyProcessing || isRefetching} className="rounded-xl h-9 text-sm border-border">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAttendance}
              disabled={!hasChanges() || !isTimeValid() || !selectedStatus || isAnyProcessing || isRefetching}
              className="rounded-xl h-9 text-sm min-w-[110px]"
            >
              {processingEmployeeId === selectedEmployee?.employee_id ? (
                <><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Saving...</>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function calculateDuration(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export default AttendanceCurrentUserListsPage;