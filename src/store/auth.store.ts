import { create } from "zustand";

/**
 * Lightweight store for auth-adjacent UI state.
 * The canonical auth state lives in AuthContext (for Supabase integration).
 * This store handles transient UI concerns like onboarding or notification gates.
 */
interface AuthUIState {
  hasCompletedOnboarding: boolean;
  hasGrantedNotificationPermission: boolean;
  hasCompletedProfile: boolean;
  setOnboardingComplete: () => void;
  setNotificationPermissionGranted: (granted: boolean) => void;
  setProfileCompleted: (completed: boolean) => void;
  reset: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  hasCompletedOnboarding: false,
  hasGrantedNotificationPermission: false,
  hasCompletedProfile: false,
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
  setNotificationPermissionGranted: (granted) =>
    set({ hasGrantedNotificationPermission: granted }),
  setProfileCompleted: (completed) =>
    set({ hasCompletedProfile: completed }),
  reset: () =>
    set({
      hasCompletedOnboarding: false,
      hasGrantedNotificationPermission: false,
      hasCompletedProfile: false,
    }),
}));
