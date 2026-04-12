"use client"

import { useState } from 'react'
import { useGetAllAttendanceLeaveRequests } from '@/utils/hooks/tanstack-query/query-hook/attendance/leave/use-get-all-attendance-leave-request'
import { AttendanceLeaveResponse, LeaveStatus } from '@/utils/types/attendance.types'
import { User } from '@/utils/types/user.types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarRange,
  Mail,
  MessageSquare,
  Users,
  AlertTriangle,
  ChevronRight,
  Inbox,
  Building2,
  TrendingUp,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { acceptAttendanceLeaveRequestByAdmin, cancelLeaveRequestByAdmin } from '@/utils/actions/attendance/attendance.put'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { hasPermission } from '@/utils/helper/check-permission'


// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const getDayCount = (start: string, end: string) =>
  Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()


// ─── Skeleton Card ────────────────────────────────────────────────────────────
function LeaveCardSkeleton() {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      <div className="h-0.5 w-full bg-zinc-800" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-full bg-zinc-800" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-32 bg-zinc-800" />
            <Skeleton className="h-3 w-44 bg-zinc-800" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-12 w-full rounded-xl bg-zinc-800" />
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg bg-zinc-800" />
        <Skeleton className="h-9 flex-1 rounded-lg bg-zinc-800" />
      </CardFooter>
    </Card>
  )
}


// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  action: 'approve' | 'reject' | null
  employeeName: string
  days: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function ConfirmDialog({ open, action, employeeName, days, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const isApprove = action === 'approve'
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="bg-zinc-900 border-zinc-700/60 text-zinc-100 max-w-sm shadow-2xl shadow-black/60">
        <DialogHeader className="gap-3">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            isApprove
              ? "bg-emerald-500/10 border border-emerald-700/30"
              : "bg-red-500/10 border border-red-700/30"
          )}>
            {isApprove
              ? <CheckCircle2 className="text-emerald-400" size={26} />
              : <XCircle className="text-red-400" size={26} />
            }
          </div>
          <div>
            <DialogTitle className="text-zinc-100 text-lg font-bold tracking-tight">
              {isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-1 leading-relaxed">
              {isApprove
                ? `Grant ${days} day${days > 1 ? 's' : ''} of leave to ${employeeName}? They will be notified by email.`
                : `Decline the leave request from ${employeeName}? They will be notified by email. This cannot be undone.`
              }
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className={cn(
          "rounded-xl px-4 py-3 text-xs mt-1",
          isApprove
            ? "bg-emerald-950/40 border border-emerald-800/30 text-emerald-400"
            : "bg-red-950/30 border border-red-800/30 text-red-400"
        )}>
          {isApprove
            ? "✓ An approval email will be sent to the employee automatically."
            : "✕ A rejection email will be sent to the employee automatically."
          }
        </div>

        <DialogFooter className="gap-2 mt-1">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 font-bold tracking-wide",
              isApprove
                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/40"
                : "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-900/40"
            )}
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isApprove ? 'Approving…' : 'Rejecting…'}
                </span>
              : isApprove ? 'Yes, Approve' : 'Yes, Reject'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ─── Leave Card ───────────────────────────────────────────────────────────────
function LeaveCard({ leave, index, user }: { user : User,leave: AttendanceLeaveResponse; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const queryClient = useQueryClient()

  const days = getDayCount(leave.start_date, leave.end_date)

  // ── Approve handler ──
  const handleApprove = async () => {
    setPendingAction(null)
    setLoadingAction('approve')
    try {
      const res = await acceptAttendanceLeaveRequestByAdmin(leave.id)
      if (res.success && res.message) {
        queryClient.invalidateQueries({ queryKey: ['get-all-attendance-leave'] })
        toast.success(res.message)
        setDone('approved')
      } else {
        toast.error((res?.error as string) || 'Failed to approve leave request')
        // card stays interactive — no setDone on failure
      }
    } finally {
      setLoadingAction(null)
    }
  }

  // ── Reject handler ──
  const handleReject = async () => {
    setPendingAction(null)
    setLoadingAction('reject')
    try {
      const res = await cancelLeaveRequestByAdmin(leave.id)
      if (res.success && res.message) {
        queryClient.invalidateQueries({ queryKey: ['get-all-attendance-leave'] })
        toast.success(res.message)
        setDone('rejected')
      } else {
        toast.error((res?.error as string) || 'Failed to reject leave request')
        // card stays interactive — no setDone on failure
      }
    } finally {
      setLoadingAction(null)
    }
  }

  // ── Done state ──
  if (done) {
    return (
      <Card className={cn(
        "border overflow-hidden transition-all duration-500",
        done === 'approved'
          ? "border-emerald-800/40 bg-emerald-950/20"
          : "border-red-900/40 bg-red-950/10"
      )}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            done === 'approved'
              ? "bg-emerald-500/10 border border-emerald-700/30"
              : "bg-red-500/10 border border-red-700/30"
          )}>
            {done === 'approved'
              ? <CheckCircle2 className="text-emerald-400" size={28} />
              : <XCircle className="text-red-400" size={28} />
            }
          </div>
          <div className="text-center">
            <p className={cn(
              "text-sm font-bold",
              done === 'approved' ? "text-emerald-400" : "text-red-400"
            )}>
              {done === 'approved' ? 'Leave Approved' : 'Leave Rejected'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{leave.employee_name}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Email notification sent</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className="group border-zinc-800/50 bg-zinc-900/60 backdrop-blur-sm overflow-hidden hover:border-zinc-600/50 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Accent strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/80 via-orange-400/60 to-rose-500/80" />

        {/* Header */}
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-11 h-11 shrink-0 ring-2 ring-zinc-700/80 ring-offset-1 ring-offset-zinc-900">
                <AvatarImage src={leave.employee_image ?? undefined} alt={leave.employee_name} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-300 text-xs font-bold border border-amber-800/30">
                  {getInitials(leave.employee_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-zinc-100 text-sm leading-tight truncate tracking-tight">
                  {leave.employee_name}
                </p>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={9} className="shrink-0 text-zinc-600" />
                  {leave.employee_email}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="shrink-0 border-amber-700/40 bg-amber-500/8 text-amber-400 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 tracking-wide uppercase"
            >
              <Clock3 size={8} />
              Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pb-4 px-5">
          {/* Date range */}
          <div className="flex items-center gap-3 bg-zinc-800/40 rounded-xl px-3.5 py-2.5 border border-zinc-700/30 group-hover:border-zinc-600/30 transition-colors">
            <CalendarRange size={13} className="text-zinc-500 shrink-0" />
            <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
              <span className="font-semibold text-zinc-200">{fmt(leave.start_date)}</span>
              <ChevronRight size={9} className="text-zinc-600 shrink-0" />
              <span className="font-semibold text-zinc-200">{fmt(leave.end_date)}</span>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-zinc-400 bg-zinc-700/60 px-2 py-0.5 rounded-md">
              {days}d
            </span>
          </div>

          {/* Message */}
          <div
            className="flex gap-2.5 bg-zinc-800/25 rounded-xl px-3.5 py-2.5 border border-zinc-700/20 cursor-pointer hover:bg-zinc-800/40 hover:border-zinc-600/30 transition-all"
            onClick={() => setExpanded(v => !v)}
          >
            <MessageSquare size={12} className="text-zinc-600 shrink-0 mt-0.5" />
            <p className={cn(
              "text-[11px] text-zinc-400 leading-relaxed flex-1",
              !expanded && "line-clamp-2"
            )}>
              {leave.message}
            </p>
          </div>

          {/* Supervisor message if present */}
          {leave.supervisor_message && (
            <div className="flex gap-2.5 bg-blue-950/20 rounded-xl px-3.5 py-2.5 border border-blue-800/20">
              <Building2 size={12} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-400/80 leading-relaxed flex-1 line-clamp-2">
                {leave.supervisor_message}
              </p>
            </div>
          )}
        </CardContent>

        <Separator className="bg-zinc-800/50 mx-5 w-auto" />

        <CardFooter className="pt-3.5 pb-4 px-5 gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingAction('reject')}
                  disabled={loadingAction !== null || !hasPermission(user.role, "update:attendance")}
                  className="flex-1 border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-700/50 transition-all duration-200 font-semibold text-xs h-9"
                >
                  {loadingAction === 'reject'
                    ? <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        Rejecting…
                      </span>
                    : <><XCircle size={13} className="mr-1.5" />Reject</>
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
                Decline this leave request
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setPendingAction('approve')}
                  disabled={loadingAction !== null || !hasPermission(user.role, "update:attendance")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-lg shadow-emerald-900/30 transition-all duration-200 tracking-wide"
                >
                  {loadingAction === 'approve'
                    ? <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Approving…
                      </span>
                    : <><CheckCircle2 size={13} className="mr-1.5" />Approve</>
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
                Approve this leave request
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={!!pendingAction}
        action={pendingAction}
        employeeName={leave.employee_name}
        days={days}
        onConfirm={pendingAction === 'approve' ? handleApprove : handleReject}
        onCancel={() => setPendingAction(null)}
        loading={loadingAction !== null}
      />
    </>
  )
}


// ─── Main Page ────────────────────────────────────────────────────────────────
function AttendanceRequestsManagement({ user }: { user: User }) {
  if(!user)return null;
  const { data, isLoading, isError, refetch } = useGetAllAttendanceLeaveRequests()
  const leaves = data?.attendance_leave ?? []

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Top bar ── */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 size={15} className="text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">HR Dashboard</span>
            <ChevronRight size={12} className="text-zinc-700" />
            <span className="text-xs text-zinc-300 font-semibold">Leave Requests</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">

        {/* ── Hero Header ── */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                <span className="text-[11px] font-bold tracking-[0.15em] text-amber-500 uppercase">
                  Pending Review
                </span>
              </div>
              <h1 className="text-4xl font-black text-zinc-50 tracking-tight leading-none">
                Leave Requests
              </h1>
              <p className="text-sm text-zinc-500 mt-2.5 max-w-md leading-relaxed">
                Review and action pending employee leave applications. Employees are notified by email upon decision.
              </p>
            </div>

            {!isLoading && !isError && leaves.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-3xl font-black text-amber-400 leading-none">{leaves.length}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">awaiting action</p>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-700/30 rounded-xl px-4 py-2.5">
                  <TrendingUp size={13} className="text-amber-500" />
                  <span className="text-xs text-amber-400 font-semibold">Pending</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <LeaveCardSkeleton key={i} />)}
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-950/40 border border-red-800/30 flex items-center justify-center mb-5">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <p className="text-zinc-200 font-bold text-xl tracking-tight">Failed to load requests</p>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed">
              Something went wrong fetching leave data. Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 hover:border-zinc-600 px-5 py-2.5 rounded-xl transition-all hover:bg-zinc-800/50"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && leaves.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center mb-5">
              <Inbox size={32} className="text-emerald-400" />
            </div>
            <p className="text-zinc-200 font-bold text-xl tracking-tight">All caught up!</p>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed">
              No pending leave requests right now. Check back later or refresh the page.
            </p>
          </div>
        )}

        {/* ── Grid ── */}
        {!isLoading && !isError && leaves.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {leaves.map((leave, i) => (
              <LeaveCard key={leave.id} leave={leave} index={i} user={user} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default AttendanceRequestsManagement