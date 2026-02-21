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

export interface AttendanceUpdate {
  attendance_id: string
  check_in_time?: string | null
  check_out_time?: string | null
  need_review: boolean
  status: AttendanceStatus
}






export interface AttendanceHistoryData {
  id: string
  employee_id: string
  employee_name: string
  employee_email: string
  employee_phone: string
  employee_image?: string
  employee_role: Role
  work_date: Date
  check_in_time: Date
  check_out_time : Date
  need_review: boolean
  status: AttendanceStatus
  created_at: Date
  updated_at: Date
}


export interface AttendanceHistoryStats {
  total_records: number;
  half_day_count: number;
  present_count: number;
  absent_count: number;
  leave_count: number;
  late_count: number;
  needs_review_count: number;
}


export interface AttendanceHistoryResponse {
  data: AttendanceHistoryData[],
  total: number;
  page: number;
  limit: number;
  hasMore: number;
  nextPage: number;
  stats: AttendanceHistoryStats
}


export interface AttendanceApiResponseType {
  success: boolean;
  attendanceHistory: AttendanceHistoryData[],
  attendanceStats: AttendanceHistoryStats,
  total: number,
  page: number,
  limit: number,
  hasMore: boolean,
  nextPage: number

}

export enum LeaveStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Cancelled = "cancelled",
}


export type ISODateString = string

export interface CreateAttendanceLeave {
  employee_id: string            // uuid
  start_date: ISODateString
  end_date: ISODateString
  message: string
}

export interface UpdateAttendanceLeave {
  id: string                     // uuid
  employee_id: string            // uuid
  checked_by?: string             // uuid | undefined
  start_date: ISODateString
  end_date: ISODateString
  message: string
  supervisor_message?: string
  status: LeaveStatus
}