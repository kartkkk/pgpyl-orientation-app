import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export interface ProfileUpdateData {
  phone_number?: string;
  about_me?: string;
}

export async function updateMyProfile(
  userId: string,
  updates: ProfileUpdateData,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*, section:sections(*)")
    .single();

  if (error) throw error;
  return data as Profile;
}
