import { Edit, Table } from "lucide-react";
import { Role } from "../types/user.types";


export const DashboardAction = {
  VIEW_DASHBOARD: "view:dashboard" as const,
}

export const TableAction = {
  VIEW_TABLES: "view:tables" as const,
  CREATE_TABLES: "create:tables" as const,
  UPDATE_TABLES: "update:tables" as const,
  DELETE_TABLES: "delete:tables" as const,
};

export const EditDialogBoxAction = {
  EDIT_EMAIL: "edit:email" as const,
  EDIT_PHONE: "edit:phone" as const,
  EDIT_ROLE_ADMIN: "edit:role_admin",
  EDIT_ROLE_MANAGER: "edit:role_manager" as const,
  EDIT_ROLE_CASHIER: "edit:role_cashier" as const,
  EDIT_ROLE_CHEF: "edit:role_chef" as const,
  EDIT_ROLE_WAITER: "edit:role_waiter" as const,
  EDIT_ROLE_DELIVERY_STAFF: "edit:role_delivery_staff" as const,
  EDIT_ROLE_CUSTOMER: "edit:role_customer" as const,
}

export const ClientManagementAction = {
  VIEW_CLIENTS: "view:clients" as const,
  CREATE_CLIENTS: "create:clients" as const,
  UPDATE_CLIENTS: "update:clients" as const,
  DELETE_CLIENTS: "delete:clients" as const,
}



export const AttendanceManagementAction = {
  VIEW_ATTENDANCE: "view:attendance" as const,
  CREATE_ATTENDANCE: "create:attendance" as const,
  UPDATE_ATTENDANCE: "update:attendance" as const,
  DELETE_ATTENDANCE: "delete:attendance" as const,

  CHECKIN_ATTENDANCE: "checkin:attendance" as const,
  CHECKOUT_ATTENDANCE: "checkout:attendance" as const,

} as const



export const OrderManagementAction = {
  VIEW_ORDERS: "view:orders" as const,
  CREATE_ORDERS: "create:orders" as const,
  UPDATE_ORDERS: "update:orders" as const,
  DELETE_ORDERS: "delete:orders" as const,
}

export const TableManagementAction = {
  VIEW_TABLES: "view:tables" as const,
  CREATE_TABLES: "create:tables" as const,
  UPDATE_TABLES: "update:tables" as const,
  DELETE_TABLES: "delete:tables" as const,
}

export const FoodCategoryManagementAction = {
  VIEW_MENU: "view:menu" as const,
  UPDATE_MENU: "update:menu" as const,
  DELETE_MENU: "delete:menu" as const,
  CREATE_MENU: "create:menu" as const,
  VIEW_CATEGORY: "view:category" as const,
  UPDATE_CATEGORY: "update:category" as const,
  DELETE_CATEGORY: "delete:category" as const,
  CREATE_CATEGORY: "create:category" as const,
}

export const RawMaterialManagementAction = {
  VIEW_RAW_MATERIALS: "view:raw_materials" as const,
  CREATE_RAW_MATERIALS: "create:raw_materials" as const,
  UPDATE_RAW_MATERIALS: "update:raw_materials" as const,
  DELETE_RAW_MATERIALS: "delete:raw_materials" as const,
}

export const ReportManagementAction = {
  VIEW_REPORTS: "view:reports" as const,
  EXPORT_REPORTS: "export:reports" as const,
  VIEW_ANALYSIS: "view:analysis" as const,
}


export const AvailableRoutes = {
  DASHBOARD: "/dashboard",
  REPORTS: "/report-and-analysis ",
  CLIENT_MANAGEMENT: "/client-management",
  ORDER_MANAGEMENT: "/orders-management",
  TABLE_MANAGEMENT: "/tables-management",
  FOOD_CATEGORY: "/food-category",
  RAW_MATERIALS: "/raw-materials-management",
  CASHIER_ROUTE: "/cashier",
  CHEF_ROUTE: "/chef",
  SETTINGS: "/settings",
  ATTENDANCE: "/attendance",
}

export type Route = typeof AvailableRoutes[keyof typeof AvailableRoutes];



export const routePermissions: Record<Role, Route[]> = {
  admin: ["*"],
  manager: [
    AvailableRoutes.DASHBOARD,
    AvailableRoutes.REPORTS,
    AvailableRoutes.CLIENT_MANAGEMENT,
    AvailableRoutes.ORDER_MANAGEMENT,
    AvailableRoutes.TABLE_MANAGEMENT,
    AvailableRoutes.FOOD_CATEGORY,
    AvailableRoutes.ATTENDANCE,
    AvailableRoutes.RAW_MATERIALS,
    AvailableRoutes.SETTINGS,


  ],
  cashier: [
    AvailableRoutes.DASHBOARD,
    AvailableRoutes.ORDER_MANAGEMENT,
    AvailableRoutes.TABLE_MANAGEMENT,
    AvailableRoutes.FOOD_CATEGORY,
  ],
  waiter: [
    AvailableRoutes.DASHBOARD,
    AvailableRoutes.ORDER_MANAGEMENT,
    AvailableRoutes.TABLE_MANAGEMENT,
    AvailableRoutes.FOOD_CATEGORY,
  ],
  chef: [
    AvailableRoutes.ORDER_MANAGEMENT,
    AvailableRoutes.RAW_MATERIALS,
  ],
  delivery_staff: [
    AvailableRoutes.ORDER_MANAGEMENT,
  ],
  customer: [
  ],
}

export const rolePermissions: Record<Role, string[]> = {
  admin: ["*"],

  manager: [

    TableAction.CREATE_TABLES,
    TableAction.VIEW_TABLES,
    TableAction.DELETE_TABLES,
    TableAction.UPDATE_TABLES,

    EditDialogBoxAction.EDIT_PHONE,
    EditDialogBoxAction.EDIT_ROLE_DELIVERY_STAFF,
    EditDialogBoxAction.EDIT_ROLE_CASHIER,
    EditDialogBoxAction.EDIT_ROLE_CHEF,
    EditDialogBoxAction.EDIT_ROLE_WAITER,
    EditDialogBoxAction.EDIT_ROLE_CUSTOMER,

    //attendance 
    AttendanceManagementAction.VIEW_ATTENDANCE,
    AttendanceManagementAction.CHECKIN_ATTENDANCE,
    AttendanceManagementAction.CHECKOUT_ATTENDANCE,
    AttendanceManagementAction.DELETE_ATTENDANCE,
    AttendanceManagementAction.UPDATE_ATTENDANCE,

    // Dashboard
    DashboardAction.VIEW_DASHBOARD,

    // Reports
    ReportManagementAction.VIEW_REPORTS,
    ReportManagementAction.EXPORT_REPORTS,
    ReportManagementAction.VIEW_ANALYSIS,

    // Clients
    ClientManagementAction.VIEW_CLIENTS,
    ClientManagementAction.CREATE_CLIENTS,
    ClientManagementAction.UPDATE_CLIENTS,
    ClientManagementAction.DELETE_CLIENTS, // optional if manager can delete

    // Orders
    OrderManagementAction.VIEW_ORDERS,
    OrderManagementAction.UPDATE_ORDERS,

    // Tables
    TableManagementAction.VIEW_TABLES,
    TableManagementAction.CREATE_TABLES,
    TableManagementAction.UPDATE_TABLES,

    // Menu / Food Categories
    FoodCategoryManagementAction.VIEW_MENU,
    FoodCategoryManagementAction.UPDATE_MENU,
    FoodCategoryManagementAction.CREATE_MENU,
    // optionally category actions if manager manages categories
    FoodCategoryManagementAction.VIEW_CATEGORY,
    FoodCategoryManagementAction.CREATE_CATEGORY,
    FoodCategoryManagementAction.UPDATE_CATEGORY,
    FoodCategoryManagementAction.DELETE_CATEGORY,

    // Raw Materials
    RawMaterialManagementAction.VIEW_RAW_MATERIALS,
    RawMaterialManagementAction.CREATE_RAW_MATERIALS,
    RawMaterialManagementAction.UPDATE_RAW_MATERIALS,
    RawMaterialManagementAction.DELETE_RAW_MATERIALS,

    // Settings (still as string if no constant)
    "view:settings",
  ],

  cashier: [
    DashboardAction.VIEW_DASHBOARD,
    OrderManagementAction.VIEW_ORDERS,
    OrderManagementAction.UPDATE_ORDERS,
    OrderManagementAction.DELETE_ORDERS,
    TableManagementAction.VIEW_TABLES,
    FoodCategoryManagementAction.VIEW_MENU,

    AttendanceManagementAction.VIEW_ATTENDANCE,
    TableAction.VIEW_TABLES,
    TableAction.UPDATE_TABLES,

  ],

  waiter: [
    DashboardAction.VIEW_DASHBOARD,
    OrderManagementAction.VIEW_ORDERS,
    OrderManagementAction.CREATE_ORDERS,
    OrderManagementAction.UPDATE_ORDERS,
    OrderManagementAction.DELETE_ORDERS,
    TableManagementAction.VIEW_TABLES,
    TableManagementAction.UPDATE_TABLES,
    FoodCategoryManagementAction.VIEW_MENU,
    AttendanceManagementAction.VIEW_ATTENDANCE,
    TableAction.CREATE_TABLES,
    TableAction.VIEW_TABLES,
    TableAction.UPDATE_TABLES,


  ],

  chef: [
    OrderManagementAction.VIEW_ORDERS,
    OrderManagementAction.UPDATE_ORDERS,
    RawMaterialManagementAction.VIEW_RAW_MATERIALS,

    AttendanceManagementAction.VIEW_ATTENDANCE,
    TableAction.VIEW_TABLES,


  ],

  delivery_staff: [
    OrderManagementAction.VIEW_ORDERS,
    OrderManagementAction.UPDATE_ORDERS,


    AttendanceManagementAction.VIEW_ATTENDANCE,
  ],

  customer: [
    TableAction.VIEW_TABLES,

    FoodCategoryManagementAction.VIEW_MENU,
    OrderManagementAction.CREATE_ORDERS,
    OrderManagementAction.VIEW_ORDERS,
  ],
};