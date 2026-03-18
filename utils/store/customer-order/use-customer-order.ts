import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderItemInStore {
  menu_id: string;
  menu_image?: string;
  menu_name: string;
  menu_price: number;
  quantity: number;
  // table_number lives on the order *request*, not on individual cart items,
  // so it is optional here and only populated when the customer picks a table.
  table_number?: number;
}

interface OrderStore {
  orders: OrderItemInStore[];

  addOrder: (item: Omit<OrderItemInStore, "table_number">) => boolean;
  updateQuantity: (menu_id: string, quantity: number) => boolean;
  removeOrder: (menu_id: string) => boolean;
  clearOrders: () => boolean;
  getTotalPrice: () => number;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (item) => {
        if (!item.menu_id || item.quantity <= 0) return false;

        set((state) => {
          const existing = state.orders.find((o) => o.menu_id === item.menu_id);

          if (existing) {
            return {
              orders: state.orders.map((o) =>
                o.menu_id === item.menu_id
                  ? { ...o, quantity: o.quantity + item.quantity }
                  : o
              ),
            };
          }

          return { orders: [...state.orders, item] };
        });

        return true;
      },

      updateQuantity: (menu_id, quantity) => {
        if (quantity <= 0) return false;

        const exists = get().orders.some((o) => o.menu_id === menu_id);
        if (!exists) return false;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.menu_id === menu_id ? { ...o, quantity } : o
          ),
        }));

        return true;
      },

      removeOrder: (menu_id) => {
        const exists = get().orders.some((o) => o.menu_id === menu_id);
        if (!exists) return false;

        set((state) => ({
          orders: state.orders.filter((o) => o.menu_id !== menu_id),
        }));

        return true;
      },

      clearOrders: () => {
        if (get().orders.length === 0) return false;
        set({ orders: [] });
        return true;
      },

      getTotalPrice: () =>
        get().orders.reduce((total, item) => total + item.menu_price * item.quantity, 0),
    }),
    {
      name: "order-storage",
      version: 1,
    }
  )
);