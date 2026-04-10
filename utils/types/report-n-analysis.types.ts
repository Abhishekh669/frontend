



// ─── Trend Points ───────────────────────────────────────────────────────────────

export interface NewSalesTrendPoint {
  period: string;
  orders: number;
  revenue: number;
  discount: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────



export interface NewSalesPaginatedTrendPoints {
  data: NewSalesTrendPoint[];
  pagination: NewPaginationInfo;
}

// ─── Default Sales Report Response ───────────────────────────────────────────


export interface NewMenuItemOrderStat {
  item_id: string;
  item_name: string;
  category_name: string;
  image_url: string;
  price: number;
  total_orders: number;
  total_quantity: number;
  total_revenue: number;
}


export interface NewDefaultSalesResponse {
  overview: NewSalesOverviewCard;               // Last 30 days
  stats_card: NewSalesStatsCard;                // All time
  daily_trend: NewSalesTrendPoint[];            // Last 7 days
  weekly_trend: NewSalesTrendPoint[];           // Last 7 weeks
  monthly_trend: NewSalesTrendPoint[];          // Last 7 months
  yearly_trend: NewSalesTrendPoint[];           // Last 7 years
  top_selling_items: NewTopSellingItem[];       // Last 30 days
  top_categories: NewTopCategory[];             // Last 30 days
  order_status_breakdown: NewOrderStatusBreakdown[]; // Last 30 days
  table_performance: NewTablePerformance[];     // Last 30 days
  staff_performance: NewStaffPerformance[];     // Last 30 days
  hourly_sales: NewHourlySalesPoint[];          // Last 30 days
  daily_sales: NewDailySalesPoint[];            // Last 30 days
  menu_items_order_stats: NewMenuItemOrderStat[]; // Last 30 days
}

// ─── Custom Range Sales Report Response ──────────────────────────────────────

export interface NewCustomRangeSalesResponse {
  overview: NewSalesOverviewCard;                     // For the date range
  stats_card: NewSalesStatsCard;                      // All time
  daily_trend: NewSalesPaginatedTrendPoints | null;   // Paginated daily data
  weekly_trend: NewSalesPaginatedTrendPoints | null;  // Paginated weekly data
  monthly_trend: NewSalesPaginatedTrendPoints | null; // Paginated monthly data
  yearly_trend: NewSalesPaginatedTrendPoints | null;  // Paginated yearly data
  top_selling_items: NewTopSellingItem[];             // For the date range
  top_categories: NewTopCategory[];                   // For the date range
  order_status_breakdown: NewOrderStatusBreakdown[];  // For the date range
  table_performance: NewTablePerformance[];           // For the date range
  staff_performance: NewStaffPerformance[];           // For the date range
  hourly_sales: NewHourlySalesPoint[];                // For the date range
  daily_sales: NewDailySalesPoint[];                  // For the date range
  menu_items_order_stats: NewMenuItemOrderStat[];     // For the date range
}


interface NewDailySalesPoint {
  day_of_week: string;
  orders: number;
  revenue: number;
}
// ─── Sales Overview Card ─────────────────────────────────────────────────────

export interface NewSalesOverviewCard {
  total_orders: number;
  total_revenue: number;
  total_discounts: number;
  average_order_value: number;
  items_per_order: number;
  completion_rate: number;
  growth_percent: number;
}

// ─── Sales Stats Card (All Time) ─────────────────────────────────────────────

export interface NewSalesStatsCard {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_discounts: number;
  average_order_value: number;
  unique_customers: number;
  completion_rate_percent: number;
}

// ─── Top Selling Items ───────────────────────────────────────────────────────

export interface NewTopSellingItem {
  item_id: string;
  item_name: string;
  category_name: string;
  quantity: number;
  revenue: number;
  order_count: number;
}

// ─── Top Categories ──────────────────────────────────────────────────────────

export interface NewTopCategory {
  category_id: string;
  category_name: string;
  orders: number;
  revenue: number;
  items_count: number;
}

// ─── Order Status Breakdown ──────────────────────────────────────────────────

export interface NewOrderStatusBreakdown {
  status: string;
  count: number;
  revenue: number;
  percent: number;
}

// ─── Table Performance ───────────────────────────────────────────────────────

export interface NewTablePerformance {
  table_number: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  total_customers: number;
}

// ─── Staff Performance ───────────────────────────────────────────────────────

export interface NewStaffPerformance {
  staff_id: string;
  staff_name: string;
  role: string;
  orders_served: number;
  total_revenue: number;
  average_order_value: number;
}

// ─── Hourly Sales ────────────────────────────────────────────────────────────

export interface NewHourlySalesPoint {
  hour: number;
  orders: number;
  revenue: number;
}

// Shared Types
export interface NewTrendPoint {
  period: string;
  revenue: number;
  orders: number;
}

// Pagination
export interface NewPaginationInfo {
  total: number;
  has_more: boolean;
  next_page: number;
  limit: number;
  page: number;
}

export interface NewPaginatedTrendPoints {
  data: NewTrendPoint[];
  pagination: NewPaginationInfo;
}

// Default Report Response (7 periods each)
export interface NewDefaultRevenueResponse {
  overview: NewRevenueOverviewCard;
  stats_card: NewRevenueStatsCard;
  daily_trend: NewTrendPoint[];     // Last 7 days
  weekly_trend: NewTrendPoint[];    // Last 7 weeks
  monthly_trend: NewTrendPoint[];   // Last 7 months
  yearly_trend: NewTrendPoint[];    // Last 7 years
  payment_methods: NewPaymentMethodBreakdown[];
  gateways: NewGatewayBreakdown[];
  discounts: NewDiscountAnalysis;
  peak_hours: NewPeakHourPoint[];
  peak_days: NewPeakDayPoint[];
}

// Custom Range Report Response (with pagination)
export interface NewCustomRangeRevenueResponse {
  overview: NewRevenueOverviewCard;
  stats_card: NewRevenueStatsCard;
  daily_trend: NewPaginatedTrendPoints;
  weekly_trend: NewPaginatedTrendPoints;
  monthly_trend: NewPaginatedTrendPoints;
  yearly_trend: NewPaginatedTrendPoints;
  payment_methods: NewPaymentMethodBreakdown[];
  gateways: NewGatewayBreakdown[];
  discounts: NewDiscountAnalysis;
  peak_hours: NewPeakHourPoint[];
  peak_days: NewPeakDayPoint[];
}

// Revenue Overview Card
export interface NewRevenueOverviewCard {
  gross_revenue: number;
  net_revenue: number;
  total_discounts: number;
  total_orders: number;
  average_order_value: number;
  growth_percent: number;
}

// Breakdown Types
export interface NewPaymentMethodBreakdown {
  method: string;
  revenue: number;
  orders: number;
  percent: number;
}

export interface NewGatewayBreakdown {
  gateway: string;
  revenue: number;
  orders: number;
  percent: number;
}

export interface NewDiscountAnalysis {
  total_discounts_given: number;
  gross_revenue: number;
  net_revenue: number;
  discount_rate_percent: number;
  orders_with_discount: number;
  total_orders: number;
}

export interface NewPeakHourPoint {
  hour: number;
  revenue: number;
  orders: number;
}

export interface NewPeakDayPoint {
  day_of_week: string;
  revenue: number;
  orders: number;
}

// Stats Card (All Time)
export interface NewRevenueStatsCard {
  total_gross_revenue: number;
  total_net_revenue: number;
  total_orders: number;
  total_discounts: number;
  average_order_value: number;
  total_customers: number;
  discount_rate_percent: number;
}

// Request Types
export interface NewDefaultReportRequest {
  // No parameters needed for default report
}

export interface NewCustomRangeReportRequest {
  from: string; // ISO date string (YYYY-MM-DD)
  to: string;   // ISO date string (YYYY-MM-DD)
  page?: number;  // For paginated trends (default 0)
  limit?: number; // For paginated trends (default 10, max 50)
}

// API Response Wrapper (if you use one)
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Cache Status Response
export interface CacheStatusResponse {
  is_ready: boolean;
  is_refreshing: boolean;
  last_updated: string; // ISO datetime string
}

// Error Response
export interface ErrorResponse {
  error: string;
}


// ─── Shared Customer Trend Point ─────────────────────────────────────────────

interface NewCustomerTrendPoint {
  period: string;
  new_users: number;
  total_users: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────



interface NewCustomerPaginatedTrendPoints {
  data: NewCustomerTrendPoint[];
  pagination: NewPaginationInfo;
}

// ─── Default Customer Report Response ─────────────────────────────────────────

interface NewDefaultCustomerResponse {
  overview: NewCustomerOverviewCard;
  stats_card: NewCustomerStatsCard;
  daily_trend: NewCustomerTrendPoint[];
  weekly_trend: NewCustomerTrendPoint[];
  monthly_trend: NewCustomerTrendPoint[];
  yearly_trend: NewCustomerTrendPoint[];
  top_customers: NewTopCustomer[];
  frequent_customers: NewFrequentCustomer[];
  retention_metrics: NewRetentionMetrics;
  customer_segments: NewCustomerSegment[];
  streak_analytics: NewStreakAnalytics;
  token_analytics: NewTokenAnalytics;
}

// ─── Custom Range Customer Report Response ───────────────────────────────────

interface NewCustomRangeCustomerResponse {
  overview: NewCustomerOverviewCard;
  stats_card: NewCustomerStatsCard;
  daily_trend: NewCustomerPaginatedTrendPoints;
  weekly_trend: NewCustomerPaginatedTrendPoints;
  monthly_trend: NewCustomerPaginatedTrendPoints;
  yearly_trend: NewCustomerPaginatedTrendPoints;
  top_customers: NewTopCustomer[];
  frequent_customers: NewFrequentCustomer[];
  retention_metrics: NewRetentionMetrics;
  customer_segments: NewCustomerSegment[];
  streak_analytics: NewStreakAnalytics;
  token_analytics: NewTokenAnalytics;
}

// ─── Customer Overview Card ──────────────────────────────────────────────────

interface NewCustomerOverviewCard {
  total_customers: number;
  new_customers: number;
  active_customers: number;
  returning_customers: number;
  avg_orders_per_customer: number;
  avg_spend_per_customer: number;
  growth_percent: number;
}

// ─── Customer Stats Card (All Time) ──────────────────────────────────────────

interface NewCustomerStatsCard {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  avg_lifetime_value: number;
  total_tokens_issued: number;
  total_tokens_redeemed: number;
  active_streak_customers: number;
}

// ─── Top Customers ───────────────────────────────────────────────────────────

interface NewTopCustomer {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string;
}

// ─── Frequent Customers ──────────────────────────────────────────────────────

interface NewFrequentCustomer {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  visit_frequency: number;
  days_since_last_visit: number;
  total_orders: number;
  favorite_category: string;
}

// ─── Retention Metrics ───────────────────────────────────────────────────────

interface NewRetentionMetrics {
  retention_rate_30_days: number;
  retention_rate_90_days: number;
  churn_rate: number;
  repeat_purchase_rate: number;
  avg_days_between_orders: number;
}

// ─── Customer Segment ────────────────────────────────────────────────────────

interface NewCustomerSegment {
  segment: string; // "High Spender", "Regular", "Occasional", "New"
  count: number;
  percent: number;
  avg_spend: number;
  min_spend: number;
  max_spend: number;
  total_revenue: number;
}

// ─── Streak Analytics ────────────────────────────────────────────────────────

interface NewStreakAnalytics {
  total_streak_customers: number;
  avg_streak_length: number;
  max_streak_length: number;
  streak_distribution: NewStreakDistribution[];
  monthly_active_streakers: number;
}

interface NewStreakDistribution {
  streak_range: string; // "1-3 days", "4-7 days", "8-14 days", "15+ days"
  count: number;
  percent: number;
}

// ─── Token Analytics ─────────────────────────────────────────────────────────

interface NewTokenAnalytics {
  total_tokens_earned: number;
  total_tokens_spent: number;
  active_token_balance: number;
  avg_tokens_per_customer: number;
  token_redemption_rate: number;
  top_token_earners: NewTopTokenCustomer[];
}

interface NewTopTokenCustomer {
  customer_name: string;
  phone_number: string;
  tokens_earned: number;
  tokens_spent: number;
  token_balance: number;
}

// ─── Request Types ───────────────────────────────────────────────────────────

interface NewCustomerDefaultReportRequest {
  // No parameters needed
}

interface NewCustomerCustomRangeReportRequest {
  from: string; // ISO date string
  to: string;   // ISO date string
  page: number;
  limit: number;
}


// ─── Shared Table Trend Point ────────────────────────────────────────────────

interface NewTableTrendPoint {
  period: string;
  total_sessions: number;
  avg_occupancy: number;
  total_revenue: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface NewTablePaginatedTrendPoints {
  data: NewTableTrendPoint[];
  pagination: NewPaginationInfo;
}

// ─── Default Table Report Response ───────────────────────────────────────────

interface NewDefaultTableResponse {
  overview: NewTableOverviewCard;
  stats_card: NewTableStatsCard;
  daily_trend: NewTableTrendPoint[];
  weekly_trend: NewTableTrendPoint[];
  monthly_trend: NewTableTrendPoint[];
  yearly_trend: NewTableTrendPoint[];
  top_tables: NewTopTable[];
  table_usage_breakdown: NewTableUsageBreakdown[];
  peak_hours: NewTablePeakHour[];
  occupancy_rate: NewOccupancyRate[];
  avg_session_duration: number;
}

// ─── Custom Range Table Report Response ──────────────────────────────────────

interface NewCustomRangeTableResponse {
  overview: NewTableOverviewCard;
  stats_card: NewTableStatsCard;
  daily_trend: NewTablePaginatedTrendPoints;
  weekly_trend: NewTablePaginatedTrendPoints;
  monthly_trend: NewTablePaginatedTrendPoints;
  yearly_trend: NewTablePaginatedTrendPoints;
  top_tables: NewTopTable[];
  table_usage_breakdown: NewTableUsageBreakdown[];
  peak_hours: NewTablePeakHour[];
  occupancy_rate: NewOccupancyRate[];
  avg_session_duration: number;
}

// ─── Table Overview Card ─────────────────────────────────────────────────────

interface NewTableOverviewCard {
  total_tables: number;
  active_tables: number;
  total_sessions: number;
  avg_occupancy_rate: number;
  total_table_revenue: number;
  avg_session_duration: number;
  peak_occupancy_hour: number;
  peak_occupancy_rate: number;
}

// ─── Table Stats Card (All Time) ─────────────────────────────────────────────

interface NewTableStatsCard {
  total_tables: number;
  total_capacity: number;
  total_sessions_all_time: number;
  total_table_revenue: number;
  avg_session_duration: number;
  most_used_table: number;
  most_used_table_count: number;
  busiest_day: string;
}

// ─── Top Tables ──────────────────────────────────────────────────────────────

interface NewTopTable {
  table_number: number;
  capacity: number;
  total_sessions: number;
  total_revenue: number;
  avg_session_time: number;
  occupancy_rate: number;
  total_customers: number;
}

// ─── Table Usage Breakdown ───────────────────────────────────────────────────

interface NewTableUsageBreakdown {
  table_number: number;
  capacity: number;
  total_sessions: number;
  total_hours_used: number;
  total_revenue: number;
  usage_percent: number;
  revenue_percent: number;
  avg_order_value: number;
}

// ─── Table Peak Hour ─────────────────────────────────────────────────────────

interface NewTablePeakHour {
  hour: number;
  active_tables: number;
  occupancy_rate: number;
  total_revenue: number;
  sessions_count: number;
}

// ─── Occupancy Rate ──────────────────────────────────────────────────────────

interface NewOccupancyRate {
  hour: number;
  occupied_count: number;
  total_capacity: number;
  rate: number;
}

// ─── Request Types ───────────────────────────────────────────────────────────

interface NewTableDefaultReportRequest {
  // No parameters needed
}

interface NewTableCustomRangeReportRequest {
  from: string; // ISO date string
  to: string;   // ISO date string
  page: number;
  limit: number;
}

// ─── Shared Pagination Info ──────────────────────────────────────────────────


// ─── Export all types ────────────────────────────────────────────────────────

export type {
  NewTableTrendPoint,
  NewTablePaginatedTrendPoints,
  NewDefaultTableResponse,
  NewCustomRangeTableResponse,
  NewTableOverviewCard,
  NewTableStatsCard,
  NewTopTable,
  NewTableUsageBreakdown,
  NewTablePeakHour,
  NewOccupancyRate,
  NewTableDefaultReportRequest,
  NewTableCustomRangeReportRequest,
};








// ─── Export all types ────────────────────────────────────────────────────────

export type {
  NewCustomerTrendPoint,
  NewCustomerPaginatedTrendPoints,
  NewDefaultCustomerResponse,
  NewCustomRangeCustomerResponse,
  NewCustomerOverviewCard,
  NewCustomerStatsCard,
  NewTopCustomer,
  NewFrequentCustomer,
  NewRetentionMetrics,
  NewCustomerSegment,
  NewStreakAnalytics,
  NewStreakDistribution,
  NewTokenAnalytics,
  NewTopTokenCustomer,
  NewCustomerDefaultReportRequest,
  NewCustomerCustomRangeReportRequest,
};





// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export interface NewStaffPaginatedTrendPoints {
  data: NewStaffTrendPoint[]
  pagination: NewPaginationInfo
}

// ─────────────────────────────────────────────────────────────
// Overview Card
// ─────────────────────────────────────────────────────────────

export interface NewStaffOverviewCard {
  total_employees: number
  active_employees: number

  total_present_days: number
  total_absent_days: number
  total_late_days: number
  total_half_days: number
  total_leave_days: number

  overall_attendance_rate: number
  late_rate: number
  leave_approval_rate: number

  total_work_hours: number
  avg_work_hours_per_employee: number

  busiest_day: string
  peak_attend_hour: number
}

// ─────────────────────────────────────────────────────────────
// Stats Card
// ─────────────────────────────────────────────────────────────

export interface NewStaffStatsCard {
  total_employees: number
  active_employees: number
  total_attendance_records: number
  all_time_work_hours: number
  avg_session_hours: number

  most_present_employee_id: string
  most_present_employee_name: string
  most_present_days: number

  most_absent_employee_id: string
  most_absent_employee_name: string
  most_absent_days: number

  longest_avg_service_hours: number
  longest_service_employee_id: string
  longest_service_employee_name: string

  total_pending_leaves: number
  total_approved_leaves: number
}

// ─────────────────────────────────────────────────────────────
// Trend Point
// ─────────────────────────────────────────────────────────────

export interface NewStaffTrendPoint {
  period: string
  present: number
  absent: number
  late: number
  half_day: number
  on_leave: number
  total_work_hours: number
  attendance_rate: number
}

// ─────────────────────────────────────────────────────────────
// Attendance Record
// ─────────────────────────────────────────────────────────────

export interface NewEmployeeAttendanceRecord {
  attendance_id: string
  work_date: string
  status: string
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours: number
  need_review: boolean

  employee_id: string
  employee_name: string
  email: string
  phone: string
  image?: string | null
  role: string
  gender: string
}

// ─────────────────────────────────────────────────────────────
// Employee Attendance Summary
// ─────────────────────────────────────────────────────────────

export interface NewEmployeeAttendanceSummary {
  employee_id: string
  employee_name: string
  email: string
  phone: string
  image?: string | null
  role: string
  gender: string

  present_days: number
  absent_days: number
  late_days: number
  half_days: number
  leave_days: number
  total_work_hours: number
  avg_work_hours: number
  attendance_rate: number
  need_review_count: number

  records: NewEmployeeAttendanceRecord[]
}

// ─────────────────────────────────────────────────────────────
// Most Present
// ─────────────────────────────────────────────────────────────

export interface NewMostPresentEmployee {
  employee_id: string
  employee_name: string
  email: string
  phone: string
  image?: string | null
  role: string
  gender: string
  present_days: number
  total_work_hours: number
  attendance_rate: number
}

// ─────────────────────────────────────────────────────────────
// Most Absent
// ─────────────────────────────────────────────────────────────

export interface NewMostAbsentEmployee {
  employee_id: string
  employee_name: string
  email: string
  phone: string
  image?: string | null
  role: string
  gender: string
  absent_days: number
  total_work_hours: number
  attendance_rate: number
}

// ─────────────────────────────────────────────────────────────
// Longest Service
// ─────────────────────────────────────────────────────────────

export interface NewLongestServiceEmployee {
  employee_id: string
  employee_name: string
  email: string
  phone: string
  image?: string | null
  role: string
  gender: string
  total_work_hours: number
  avg_shift_hours: number
  present_days: number
  attendance_rate: number
}

// ─────────────────────────────────────────────────────────────
// Role Breakdown
// ─────────────────────────────────────────────────────────────

export interface NewStaffRoleBreakdown {
  role: string
  employee_count: number
  total_work_hours: number
  avg_work_hours: number
  attendance_rate: number
  total_salary: number
  avg_salary: number
  percent: number
}

// ─────────────────────────────────────────────────────────────
// Leave Analysis
// ─────────────────────────────────────────────────────────────

export interface NewLeaveAnalysis {
  total_requests: number
  pending_count: number
  approved_count: number
  rejected_count: number
  approval_rate: number
  avg_leave_days: number
  top_leave_employees: NewTopLeaveEmployee[]
}

export interface NewTopLeaveEmployee {
  employee_id: string
  employee_name: string
  role: string
  leave_count: number
  total_days: number
}

// ─────────────────────────────────────────────────────────────
// Daily Summary
// ─────────────────────────────────────────────────────────────

export interface NewDailyAttendanceSummary {
  work_date: string
  present: number
  absent: number
  late: number
  half_day: number
  on_leave: number
  total_work_hours: number
  attendance_rate: number
}

// ─────────────────────────────────────────────────────────────
// Peak Hours
// ─────────────────────────────────────────────────────────────

export interface NewStaffPeakHour {
  hour: number
  check_ins: number
  check_outs: number
  active_staff: number
  avg_work_hours: number
}

// ─────────────────────────────────────────────────────────────
// Payroll Summary
// ─────────────────────────────────────────────────────────────

export interface NewPayrollSummary {
  total_monthly_salary: number
  total_employees: number
  avg_salary: number
  by_role: NewStaffRoleBreakdown[]
}

// ─────────────────────────────────────────────────────────────
// Default Response
// ─────────────────────────────────────────────────────────────

export interface NewDefaultStaffResponse {
  overview: NewStaffOverviewCard
  stats_card: NewStaffStatsCard
  daily_trend: NewStaffTrendPoint[]
  weekly_trend: NewStaffTrendPoint[]
  monthly_trend: NewStaffTrendPoint[]
  yearly_trend: NewStaffTrendPoint[]
  daily_summary: NewDailyAttendanceSummary[]
  employee_attendance: NewEmployeeAttendanceSummary[]
  most_present_employees: NewMostPresentEmployee[]
  most_absent_employees: NewMostAbsentEmployee[]
  longest_service_employees: NewLongestServiceEmployee[]
  role_breakdown: NewStaffRoleBreakdown[]
  leave_analysis: NewLeaveAnalysis
  peak_hours: NewStaffPeakHour[]
  payroll_summary: NewPayrollSummary
}

// ─────────────────────────────────────────────────────────────
// Custom Range Response
// ─────────────────────────────────────────────────────────────

export interface NewCustomRangeStaffResponse {
  overview: NewStaffOverviewCard
  stats_card: NewStaffStatsCard
  daily_trend?: NewStaffPaginatedTrendPoints
  weekly_trend?: NewStaffPaginatedTrendPoints
  monthly_trend?: NewStaffPaginatedTrendPoints
  yearly_trend?: NewStaffPaginatedTrendPoints
  daily_summary: NewDailyAttendanceSummary[]
  employee_attendance: NewEmployeeAttendanceSummary[]
  most_present_employees: NewMostPresentEmployee[]
  most_absent_employees: NewMostAbsentEmployee[]
  longest_service_employees: NewLongestServiceEmployee[]
  role_breakdown: NewStaffRoleBreakdown[]
  leave_analysis: NewLeaveAnalysis
  peak_hours: NewStaffPeakHour[]
  payroll_summary: NewPayrollSummary
}

// ─────────────────────────────────────────────────────────────
// Request
// ─────────────────────────────────────────────────────────────

export interface NewStaffCustomRangeReportRequest {
  from: string
  to: string
  limit: number
  page: number
}


// types/rawMaterialReport.ts

export interface NewPaginationInfo {
  total: number;
  has_more: boolean;
  next_page: number;
  limit: number;
  page: number;
}

// ─── Raw Material Overview Card ───────────────────────────────────────────────

export interface NewRawMaterialOverviewCard {
  total_material_used: number;
  total_investment: number;
  total_orders: number;
  highest_cost_material_value: number;
  highest_cost_material_name: string;
  most_used_material_quantity: number;
  most_used_material_name: string;
}

// ─── Raw Material Stats Card (All Time) ──────────────────────────────────────

export interface NewRawMaterialStatsCard {
  total_materials: number;
  total_current_stock: number;
  total_inventory_value: number;
  total_material_used_all_time: number;
  total_investment_all_time: number;
  max_used_quantity: number;
  most_used_material_name: string;
  most_used_material_quantity: number;
  most_expensive_unit_cost: number;
  most_expensive_material_name: string;
  avg_material_value: number;
}

// ─── Trend Point ─────────────────────────────────────────────────────────────

export interface NewRawMaterialTrendPoint {
  period: string;
  material_used: number;
  total_cost: number;
  orders_count: number;
}

// ─── Paginated Trend ─────────────────────────────────────────────────────────

export interface NewRawMaterialPaginatedTrendPoints {
  data: NewRawMaterialTrendPoint[];
  pagination: NewPaginationInfo;
}

// ─── Top Used Raw Material ───────────────────────────────────────────────────

export interface NewTopUsedRawMaterial {
  material_id: string;
  material_name: string;
  unit: string;
  unit_cost: number;
  total_quantity_used: number;
  total_cost: number;
  affected_orders: number;
}

// ─── Usage Breakdown ─────────────────────────────────────────────────────────

export interface NewRawMaterialUsageBreakdown {
  material_id: string;
  material_name: string;
  unit: string;
  unit_cost: number;
  current_stock: number;
  period_usage: number;
  period_cost: number;
  usage_percent: number;
  orders_count: number;
}

// ─── Peak Hour ───────────────────────────────────────────────────────────────

export interface NewRawMaterialPeakHour {
  hour: number;
  total_material_used: number;
  total_cost: number;
  orders_count: number;
  unique_items_used: number;
}

// ─── Daily Usage Summary ─────────────────────────────────────────────────────

export interface NewDailyRawMaterialUsage {
  usage_date: string;
  total_material_used: number;
  total_cost: number;
  orders_count: number;
  unique_materials_used: number;
}

// ─── Default Response ────────────────────────────────────────────────────────

export interface NewDefaultRawMaterialResponse {
  overview: NewRawMaterialOverviewCard;
  stats_card: NewRawMaterialStatsCard;
  daily_trend: NewRawMaterialTrendPoint[];
  weekly_trend: NewRawMaterialTrendPoint[];
  monthly_trend: NewRawMaterialTrendPoint[];
  yearly_trend: NewRawMaterialTrendPoint[];
  top_used_materials: NewTopUsedRawMaterial[];
  material_usage_breakdown: NewRawMaterialUsageBreakdown[];
  peak_usage_hours: NewRawMaterialPeakHour[];
  daily_usage_summary: NewDailyRawMaterialUsage[];
}

// ─── Custom Range Response ───────────────────────────────────────────────────

export interface NewCustomRangeRawMaterialResponse {
  overview: NewRawMaterialOverviewCard;
  stats_card: NewRawMaterialStatsCard;
  daily_trend: NewRawMaterialPaginatedTrendPoints | null;
  weekly_trend: NewRawMaterialPaginatedTrendPoints | null;
  monthly_trend: NewRawMaterialPaginatedTrendPoints | null;
  yearly_trend: NewRawMaterialPaginatedTrendPoints | null;
  top_used_materials: NewTopUsedRawMaterial[];
  material_usage_breakdown: NewRawMaterialUsageBreakdown[];
  peak_usage_hours: NewRawMaterialPeakHour[];
  daily_usage_summary: NewDailyRawMaterialUsage[];
}

// ─── Request ─────────────────────────────────────────────────────────────────

export interface NewRawMaterialCustomRangeReportRequest {
  from: string; // ISO date string
  to: string;   // ISO date string
  limit: number;
  page: number;
}

// ─── API Response Wrapper (if you use one) ───────────────────────────────────

