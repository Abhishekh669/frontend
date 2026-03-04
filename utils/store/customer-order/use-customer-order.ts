import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderItemInStore {
  menu_id: string;
  menu_image?: string;
  menu_name: string;
  menu_price: number;
  quantity: number;
  table_number: number;
}

interface OrderStore {
  orders: OrderItemInStore[];

  addOrder: (item: OrderItemInStore) => boolean;
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
          const existingItem = state.orders.find(
            (order) => order.menu_id === item.menu_id
          );

          if (existingItem) {
            return {
              orders: state.orders.map((order) =>
                order.menu_id === item.menu_id
                  ? { ...order, quantity: order.quantity + item.quantity }
                  : order
              ),
            };
          }

          return { orders: [...state.orders, item] };
        });

        return true;
      },

      updateQuantity: (menu_id, quantity) => {
        if (quantity <= 0) return false;

        const exists = get().orders.some(
          (order) => order.menu_id === menu_id
        );

        if (!exists) return false;

        set((state) => ({
          orders: state.orders.map((order) =>
            order.menu_id === menu_id
              ? { ...order, quantity }
              : order
          ),
        }));

        return true;
      },

      removeOrder: (menu_id) => {
        const exists = get().orders.some(
          (order) => order.menu_id === menu_id
        );

        if (!exists) return false;

        set((state) => ({
          orders: state.orders.filter(
            (order) => order.menu_id !== menu_id
          ),
        }));

        return true;
      },

      clearOrders: () => {
        if (get().orders.length === 0) return false;

        set({ orders: [] });
        return true;
      },

      getTotalPrice: () =>
        get().orders.reduce(
          (total, item) => total + item.menu_price * item.quantity,
          0
        ),
    }),
    {
      name: "order-storage",
      version: 1,
    }
  )
);