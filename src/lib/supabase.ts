// Re-export a singleton browser client for use in service files and hooks.
// All copied service files import { supabase } from "@/lib/supabase".

import { createClient } from "@/lib/supabase/client";

export const supabase = createClient();
