import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/lib/types";

// Helper function to get minimum registration period for TLD
const getMinRegistrationPeriod = (domainName: string): number => {
  const tld = domainName.split(".").pop()?.toLowerCase();

  // TLD-specific minimum registration periods
  const minPeriods: { [key: string]: number } = {
    ai: 2, // .ai domains require minimum 2 years
    co: 2, // .co domains require minimum 2 years
    io: 1, // .io domains allow 1 year
    com: 1, // .com domains allow 1 year
    net: 1, // .net domains allow 1 year
    org: 1, // .org domains allow 1 year
    // Add more TLDs as needed
  };

  return minPeriods[tld || ""] || 1; // Default to 1 year if TLD not specified
};

// Helper function to validate and correct cart items
const validateAndCorrectCartItems = (items: CartItem[]): CartItem[] => {
  return items.map((item) => {
    const minPeriod = getMinRegistrationPeriod(item.domainName);
    if (item.registrationPeriod < minPeriod) {
      return { ...item, registrationPeriod: minPeriod };
    }
    return item;
  });
};

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
          // Validate and correct the new item
          const minPeriod = getMinRegistrationPeriod(item.domainName);
          const validatedItem = {
            ...item,
            registrationPeriod: Math.max(item.registrationPeriod, minPeriod),
          };

          const existingItem = state.items.find(
            (i) => i.domainName === validatedItem.domainName
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.domainName === validatedItem.domainName
                  ? { ...i, ...validatedItem }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, validatedItem],
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

          // Validate all items one final time before marking as initialized
          const finalItems = get().items;
          const validatedFinalItems = validateAndCorrectCartItems(finalItems);
          set({ items: validatedFinalItems, isInitialized: true });
        } catch (error: any) {
          // Only log non-abort errors to reduce noise in development
          if (error.code !== "ECONNRESET" && error.name !== "AbortError") {
            console.error("Failed to sync cart with server:", error);
          }
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
            const validatedItems = validateAndCorrectCartItems(data.cart || []);
            set({ items: validatedItems });
          }
        } catch (error: any) {
          // Only log non-abort errors to reduce noise in development
          if (error.code !== "ECONNRESET" && error.name !== "AbortError") {
            console.error("Failed to load cart from server:", error);
          }
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
        } catch (error: any) {
          // Only log non-abort errors to reduce noise in development
          if (error.code !== "ECONNRESET" && error.name !== "AbortError") {
            console.error("Failed to save cart to server:", error);
          }
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

            // Validate and correct all merged items
            const validatedItems = validateAndCorrectCartItems(mergedItems);
            set({ items: validatedItems });

            // Save merged cart to server
            await get().saveToServer();
          }
        } catch (error: any) {
          // Only log non-abort errors to reduce noise in development
          if (error.code !== "ECONNRESET" && error.name !== "AbortError") {
            console.error("Failed to merge cart with server:", error);
          }
        }
      },
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate and correct all items when store is rehydrated from localStorage
          const validatedItems = validateAndCorrectCartItems(state.items);
          if (JSON.stringify(validatedItems) !== JSON.stringify(state.items)) {
            state.items = validatedItems;
            // Save corrected items back to localStorage
            setTimeout(() => {
              const token = localStorage.getItem("token");
              if (token) {
                get().saveToServer();
              }
            }, 100);
          }
        }
      },
    }
  )
);
