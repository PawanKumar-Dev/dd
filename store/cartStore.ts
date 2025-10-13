import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isInitialized: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (domainName: string) => void;
  updateItem: (domainName: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getSubtotalPrice: () => number;
  getItemCount: () => number;
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
  mergeWithServerCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isInitialized: false,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.domainName === item.domainName
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.domainName === item.domainName ? { ...i, ...item } : i
              ),
            };
          }

          return {
            items: [...state.items, item],
          };
        });

        // Save to server after adding item (only if user is logged in)
        const token = localStorage.getItem("token");
        if (token) {
          get().saveToServer();
        }
      },

      removeItem: (domainName) => {
        set((state) => ({
          items: state.items.filter((item) => item.domainName !== domainName),
        }));

        // Save to server after removing item (only if user is logged in)
        const token = localStorage.getItem("token");
        if (token) {
          get().saveToServer();
        }
      },

      updateItem: (domainName, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.domainName === domainName ? { ...item, ...updates } : item
          ),
        }));

        // Save to server after updating item (only if user is logged in)
        const token = localStorage.getItem("token");
        if (token) {
          get().saveToServer();
        }
      },

      clearCart: () => {
        set({ items: [] });

        // Save to server after clearing cart (only if user is logged in)
        const token = localStorage.getItem("token");
        if (token) {
          get().saveToServer();
        }
      },

      getSubtotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.registrationPeriod,
          0
        );
      },

      getTotalPrice: () => {
        const subtotal = get().getSubtotalPrice();
        return Math.round(subtotal * 100) / 100; // Round to 2 decimal places
      },

      getItemCount: () => {
        return get().items.length;
      },

      syncWithServer: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        set({ isLoading: true });
        try {
          // Check if we have local cart items before loading from server
          const localItems = get().items;
          const hasLocalItems = localItems.length > 0;

          await get().loadFromServer();

          // If we had local items and server cart is empty, merge them
          if (hasLocalItems) {
            const serverItems = get().items;
            if (serverItems.length === 0) {
              // Server cart is empty, keep local items and save to server
              set({ items: localItems });
              await get().saveToServer();
            } else {
              // Server has items, merge with local items (avoid duplicates)
              const mergedItems = [...serverItems];
              localItems.forEach((localItem) => {
                const exists = mergedItems.find(
                  (item) => item.domainName === localItem.domainName
                );
                if (!exists) {
                  mergedItems.push(localItem);
                }
              });
              set({ items: mergedItems });
              await get().saveToServer();
            }
          }

          set({ isInitialized: true });
        } catch (error) {
          console.error("Failed to sync cart with server:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadFromServer: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await fetch("/api/cart", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({ items: data.cart || [] });
          }
        } catch (error) {
          console.error("Failed to load cart from server:", error);
        }
      },

      saveToServer: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const { items } = get();

          const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cart: items }),
          });

          if (response.ok) {
            // Cart saved successfully
          }
        } catch (error) {
          console.error("Failed to save cart to server:", error);
        }
      },

      mergeWithServerCart: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const localItems = get().items;
          if (localItems.length === 0) return;

          // Load server cart
          const response = await fetch("/api/cart", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const serverItems = data.cart || [];

            // Merge local items with server items (avoid duplicates)
            const mergedItems = [...serverItems];
            localItems.forEach((localItem) => {
              const exists = mergedItems.find(
                (item) => item.domainName === localItem.domainName
              );
              if (!exists) {
                mergedItems.push(localItem);
              }
            });

            // Update local cart with merged items
            set({ items: mergedItems });

            // Save merged cart to server
            await get().saveToServer();
          }
        } catch (error) {
          console.error("Failed to merge cart with server:", error);
        }
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
