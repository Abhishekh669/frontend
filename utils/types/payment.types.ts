import { User } from "lucide-react";
import { ApprovedOrderLists } from "./order.types";

// Enums (string literal types)
export type PaymentMethod = "cash" | "online";

export type OnlineGateway =
  | "esewa"
  | "khalti"
  | "fonepay"
  | "banking"
  | "other";

// Main Payment type
export interface Payment {
  id: string; // uuid -> string
  order_id: string;

  payment_method: PaymentMethod;

  // nullable field
  online_gateway?: OnlineGateway;

  paid_amount: number;
  discount: number;

  created_at: string; // ISO date string
  updated_at: string;
}

// CreatePayment type
export interface CreatePayment {
  order_id: string;

  payment_method: PaymentMethod;

  // nullable field
  online_gateway?: OnlineGateway;

  paid_amount: number;
  discount: number;
}

// UserToken type
export interface UserToken {
  id: string;

  phone_number: string;
  total_tokens: number;

  created_at: string;
  updated_at: string;
}


export type PaymentDetailsForCashierWithDiscount  = ApprovedOrderLists & {
    token ?: UserToken | null;
}