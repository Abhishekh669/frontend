import { AttendanceManagementAction, CashierManagementAction, EditDialogBoxAction, TableAction } from "../rbac/role-n-permissiona";

export type Role = "admin" | "manager" | "cashier" | "chef" | "waiter" | "delivery_staff" | "customer";
export type Gender = "male" | "other" | "female"

export interface User {
  id: string
  email: string,
  gender: Gender,
  image: string,
  is_active: boolean,
  role: Role,
  name: string,
  phone: string,
  salary: number,
  created_at: Date,
  updated_at: Date
}

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  chef: "Chef",
  waiter: "Waiter",
  delivery_staff: "Delivery Staff",
  customer: "Customer",
};

export const genderLabels: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export interface UpdateUserType {
  id: string
  name: string
  email: string;
  phone: string;
  gender: Gender;
  role: Role;
  salary: number;
  image: string | null,
  is_active: boolean;
}



export interface DashboardCounts {
  // Overall counts
  total_users: number;
  active_users: number;
  male_count: number;
  female_count: number;
  other_count: number;
  recent_users_weekly: number;

  // Role-wise counts
  admin_count: number;
  chef_count: number;
  waiter_count: number;
  cashier_count: number;
  delivery_staff_count: number;
  manager_count: number;
  customer_count: number;
}


export interface UsersForAttendance {
  id : string
  name : string;
  email : string;
  phone : string;
  is_active : boolean;
  image ?: string;
}






export type Permission =



  typeof EditDialogBoxAction.EDIT_PHONE
  | typeof EditDialogBoxAction.EDIT_ROLE_DELIVERY_STAFF
  | typeof EditDialogBoxAction.EDIT_ROLE_CASHIER
  | typeof EditDialogBoxAction.EDIT_ROLE_CHEF
  | typeof EditDialogBoxAction.EDIT_ROLE_WAITER
  | typeof EditDialogBoxAction.EDIT_ROLE_CUSTOMER

  | typeof TableAction.CREATE_TABLES
  | typeof TableAction.VIEW_TABLES
  | typeof TableAction.DELETE_TABLES
  | typeof TableAction.UPDATE_TABLES


  | typeof AttendanceManagementAction.VIEW_ATTENDANCE
  | typeof AttendanceManagementAction.CHECKIN_ATTENDANCE
  | typeof AttendanceManagementAction.CHECKOUT_ATTENDANCE
  | typeof AttendanceManagementAction.DELETE_ATTENDANCE
  | typeof AttendanceManagementAction.UPDATE_ATTENDANCE

  | typeof CashierManagementAction.VIEW_CASHIER
  | typeof CashierManagementAction.CREATE_CASHIER
  | typeof CashierManagementAction.UPDATE_CASHIER
  | typeof CashierManagementAction.DELETE_CASHIER

  // Dashboard
  | "view:dashboard"

  //attendance 
  | "view:attendance"
  | "check-in:attendance"
  | "check-out:attendance"
  | "delete:attendance"
  | "update:attendance"

  // Reports
  | "view:reports"
  | "export:reports"
  | "view:analysis"

  // Clients
  | "view:clients"
  | "create:clients"
  | "update:clients"
  | "delete:clients"

  // Orders
  | "view:orders"
  | "create:orders"
  | "update:orders"
  | "delete:orders"

  // Tables
  | "view:tables"
  | "create:tables"
  | "update:tables"
  | "delete:tables"

  // Menu / Food Categories
  | "view:menu"
  | "create:menu"
  | "update:menu"
  | "delete:menu"
  | "view:category"
  | "create:category"
  | "update:category"
  | "delete:category"

  // Raw Materials
  | "view:raw_materials"
  | "create:raw_materials"
  | "update:raw_materials"
  | "delete:raw_materials"

  // Settings
  | "view:settings"

  // Wildcard
  | "*";

