import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<User | null> {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );
    if (user) return user;

    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

export async function upsertPasswordUser({
  supabase,
  email,
  password,
  fullName,
}: {
  supabase: SupabaseClient;
  email: string;
  password: string;
  fullName: string;
}): Promise<User> {
  const existingUser = await findAuthUserByEmail(supabase, email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        user_metadata: { full_name: fullName },
      },
    );

    if (error) throw error;
    if (!data.user) throw new Error("Supabase did not return an updated user.");
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a created user.");
  return data.user;
}
