import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TestingStore {
  isTestingMode: boolean;
  toggleTestingMode: () => void;
  setTestingMode: (enabled: boolean) => void;
}

export const useTestingStore = create<TestingStore>()(
  persist(
    (set, get) => ({
      isTestingMode: false,
      toggleTestingMode: () => {
        const newState = !get().isTestingMode;
        set({ isTestingMode: newState });

        // Broadcast change to other tabs
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("testing-mode-changed", {
              detail: { isTestingMode: newState },
            })
          );
        }
      },
      setTestingMode: (enabled: boolean) => {
        set({ isTestingMode: enabled });

        // Broadcast change to other tabs
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("testing-mode-changed", {
              detail: { isTestingMode: enabled },
            })
          );
        }
      },
    }),
    {
      name: "testing-mode-storage",
      // Enable cross-tab synchronization
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          // Listen for custom events from other tabs
          window.addEventListener("testing-mode-changed", (event: any) => {
            if (
              event.detail &&
              event.detail.isTestingMode !== state.isTestingMode
            ) {
              state.setTestingMode(event.detail.isTestingMode);
            }
          });
        }
      },
    }
  )
);
