import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/auth-context";
import {
  updateMyProfile,
  type ProfileUpdateData,
} from "../services/profile.service";

export function useUpdateMyProfile() {
  const { profile, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (updates: ProfileUpdateData) => {
      if (!profile?.id) throw new Error("Not authenticated");
      return updateMyProfile(profile.id, updates);
    },
    onSuccess: () => {
      refreshProfile();
    },
  });
}
