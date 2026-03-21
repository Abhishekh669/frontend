import { Clock, History, CalendarCheck, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

function AttendanceHeader({ formattedDate }: { formattedDate: string }) {
  const router = useRouter()

  return (
    <div className="relative rounded-3xl border border-border bg-card px-8 py-8 shadow-sm overflow-hidden">
      {/* Gold radial glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85_/_0.12),transparent_70%)]" />
      {/* Bottom gold line */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.75_0.12_85_/_0.30)] to-transparent" />

      <div className="relative flex items-center justify-between gap-4">
        {/* Title block */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-1 h-5 rounded-full bg-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
              HR Module
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Attendance Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage employee attendance and check-in / check-out
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Navigate dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 rounded-xl border-border bg-muted/40 text-sm font-medium gap-2 hover:bg-muted/70 transition-colors"
              >
                <span>Navigate</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border shadow-lg">
              <DropdownMenuItem
                onClick={() => router.push('/attendance/history')}
                className="cursor-pointer gap-2 rounded-lg text-sm"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span>History</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/attendance/requests')}
                className="cursor-pointer gap-2 rounded-lg text-sm"
              >
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <span>Requests</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date pill */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 h-9">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm font-medium text-foreground">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceHeader