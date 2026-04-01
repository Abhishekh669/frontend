import App from "next/app";

export interface CreateCustomerOrderRequest{
    table_number : number;
    customer_name ?: string;
    customer_phone ?: string;
    note ?: string;
    order_menu_items : OrderMenuItem[]
}


export interface OrderMenuItem {
    menu_item_id : string;
    quantity : number;
    price : number;
}



// Using UUID type from a library or as string
type UUID = string;

export type orderStatus = "approved" | "not-approved" | "progress" | "completed" | "cancelled"

export interface OrderItemType {
  id: UUID;
  price: number;
  quantity: number;
  order_id: UUID;
  menu_id: UUID;
  menu_image: string | null;
  status : orderStatus;
  menu_name: string;
  created_at : string;
}

export interface TableSession {
  id: UUID;
  table_number: number;
  open_time: string; // ISO date string (e.g., "2024-01-20T10:30:00Z")
  close_time: string | null;
  status: 'occupied' | 'empty' | 'booked'; // Based on your table_state enum
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface CustomerOrderRequest {
  id : string ;
  status : orderStatus; 
  table_session: TableSession;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  order_items: OrderItemType[];
}



export interface UpdateOrderItemType {
  status : orderStatus
  order_id : string;
  order_item_id : string;
}


export interface AllOrderStatusForCashier{
  order_id : string;
  status : orderStatus;
  table_number : number;
  customer_name : string | null;
  customer_phone : string | null;
  created_at : string;
}

export interface ApprovedOrderLists {
  order_menu_items : OrderItemType[]
  order_id : string;
  status : orderStatus
  table_number : number;
  customer_name : string | null;
  customer_phone : string | null;
  waiter_id : string;
  waiter_name : string;
  waiter_image ?: string | null;
  created_at : string;
}



export interface OrderHistoryResponse {
  orders : ApprovedOrderLists[];
  total : number;
  has_more : boolean;
  next_offset : number;
}