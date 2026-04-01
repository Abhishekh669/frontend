// ---------------- Enums ----------------
export enum PaymentMethod {
  Cash = "cash",
  Online = "online",
}

export enum OnlineGateway {
  Esewa = "esewa",
  Khalti = "khalti",
  Fonepay = "fonepay",
  Banking = "banking",
  Other = "other",
}

export enum TokenTransactionType {
  EARN = "EARN",
  SPEND = "SPEND",
  STREAK = "STREAK",
}

export enum OrderStatus {
  NotApproved = "not-approved",
  Approved = "approved",
  Progress = "progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

// ---------------- Payment Interfaces ----------------
export interface Payment {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  online_gateway?: OnlineGateway | null;
  paid_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePayment {
  order_id: string;
  payment_method: PaymentMethod;
  online_gateway?: OnlineGateway | null;
  paid_amount: number;
}

// ---------------- User Token & Customer Streak ----------------
export interface UserToken {
  id: string;
  phone_number: string;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerStreak {
  phone_number: string;
  current_streak: number;
  last_visit?: string | null;
  monthly_days: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  phone_number: string;
  amount: number;
  type: TokenTransactionType;
  source?: string | null;
  reference_id?: string | null;
  created_at: string;
}

export interface TokenDetailsOfCustomer {
  token_details?: UserToken | null;
  current_streak: number;
  last_visit?: string | null;
  monthly_days: number;
  discount : number;
}

// ---------------- Order Item Type (from previous Go models) ----------------
export interface OrderItemType {
  id: string;
  order_id: string;
  menu_id: string;
  menu_name: string;
  menu_image?: string | null;
  quantity: number;
  price: number;
  status: OrderStatus;
  created_at: string;
}

// ---------------- Payment Details for Cashier ----------------
export interface PaymentDetailsForCashierWithDiscount {
  token_details?: TokenDetailsOfCustomer | null;
  order_menu_items: OrderItemType[];
  order_id: string;
  status: OrderStatus;
  table_number: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  waiter_id: string;
  waiter_name: string;
  waiter_image?: string | null;
}