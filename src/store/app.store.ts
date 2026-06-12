import { create } from "zustand";

interface AppState {
  /** Currently active attendance session being viewed (admin or student) */
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  reset: () => set({ activeSessionId: null }),
}));
