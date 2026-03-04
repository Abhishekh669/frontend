"use client";

import React, { useMemo, useState } from "react";
import { Plus, ImageOff } from "lucide-react";
import { toast } from "sonner";

import { MenuItemCache } from "@/utils/types/food-category.types";
import {
  OrderItemInStore,
  useOrderStore,
} from "@/utils/store/customer-order/use-customer-order";

interface MenuItemWithPath extends MenuItemCache {
  categoryPath: string[];
}

interface Props {
  items: MenuItemWithPath[];
}

export const MenuItems: React.FC<Props> = ({ items }) => {
  const { addOrder } = useOrderStore();

  // quantity per menu item (id -> quantity)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (id: string) => quantities[id] ?? 1;

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItemWithPath[]> = {};
    items.forEach((item) => {
      const key = item.categoryPath.join(" › ");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items]);

  const addOrderInCart = (menuItem: MenuItemCache) => {
    if (!menuItem.id) return;

    const quantity = getQuantity(menuItem.id);

    const order: OrderItemInStore = {
      menu_id: menuItem.id,
      menu_name: menuItem.name,
      menu_image: menuItem.image_url || "",
      menu_price: menuItem.price,
      quantity,
      table_number: 1,
    };

    const status = addOrder(order);

    if (!status) {
      toast.error("Failed to add item",{
        duration : 500
      });
    }
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ImageOff className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-display text-lg">No items found</p>
        <p className="text-sm mt-1">Try a different category</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([categoryPath, categoryItems]) => (
        <section key={categoryPath}>
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            {categoryPath}
          </h3>

          <div className="space-y-3">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`
                  group bg-card rounded-xl shadow-card hover:shadow-card-hover
                  transition-all duration-300 overflow-hidden
                  flex flex-row
                  ${!item.is_available ? "opacity-60" : ""}
                `}
              >
                {/* Content */}
                <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="font-body font-semibold text-card-foreground text-[15px] leading-tight truncate">
                        {item.name}
                      </h4>
                      {!item.is_available && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider bg-badge-unavailable text-primary-foreground px-1.5 py-0.5 rounded">
                          Sold out
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price + Quantity + Button */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-price font-bold text-base">
                      ₹{item.price.toFixed(0)}
                    </span>

                    {item.is_available && (
                      <div className="flex items-center gap-2">
                        {/* Quantity Input */}
                        <input
                          type="number"
                          min={1}
                          step={0.5}
                          value={getQuantity(item.id)}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.max(
                                1,
                                Number(e.target.value)
                              ),
                            }))
                          }
                          className="w-16 text-center text-sm border rounded-md px-2 py-1
                            focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        {/* Add Button */}
                        <button
                          onClick={() => addOrderInCart(item)}
                          className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold
                            px-3 py-2 rounded-lg hover:opacity-90 active:scale-95
                            transition-all duration-200 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ADD
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 self-center m-3 rounded-xl overflow-hidden bg-muted">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};