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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage employee attendance and check-in/check-out
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Navigation Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <span>Navigate</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => router.push('/attendance/history')}
              className="cursor-pointer gap-2"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push('/attendance/requests')}
              className="cursor-pointer gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Requests</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Display */}
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}

export default AttendanceHeader