// Enums

import { Role } from "./user.types"

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late' | 'half_day'

// Main Types
export interface Attendance {
  id: string
  employee_id: string
  work_date: string // ISO date string
  check_in_time?: string | null // ISO datetime string or null
  check_out_time?: string | null // ISO datetime string or null
  need_review: boolean
  status: AttendanceStatus
  created_at: string // ISO datetime string
  updated_at: string // ISO datetime string
}

export interface CheckInOutAttendanceType {
  employee_id: string
}

export interface CurrentAttendanceStats {
  total_employees: number
  present_employees: number
  absent_employees: number
  leave_employees: number
}

export interface AttendanceData {
  attendance: Attendance | null
  employee_id: string
  employee_name: string
  employee_email: string
  employee_role: Role
  employee_image?: string | null
  employee_phone: string
}

export interface CurrentAttendance {
  stats: CurrentAttendanceStats
  employees: AttendanceData[]
}

