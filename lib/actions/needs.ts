"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { ok: boolean; message: string } | null;

// Postgres unique-violation. Signing up twice is the same wish expressed twice, not an
// error worth showing someone who is already having a hard week.
const UNIQUE_VIOLATION = "23505";

// "Tell me when this opens" — the quiet answer on an empty doorway.
//
// Someone who opens "I Need Support" and finds nothing has just told us exactly what
// they need, at the moment they most need it. The only exit used to be "start a circle
// yourself", which is the right ambition and a very large ask of a person who came here
// because life feels heavy. This records the smaller yes.
//
// Works signed-out on purpose: a sign-in wall here filters out precisely the people the
// network exists for.
export async function signUpForNeed(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const needId = formData.get("need_id") as string;
  const needSlug = (formData.get("need_slug") as string) || "";
  const area = (formData.get("area") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase() || null;

  if (!needId) return { ok: false, message: "Something went wrong. Try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // A signed-in person is reachable through their account; a guest has to leave an
  // address or we have no way to keep the promise we're making.
  if (!user && !email) {
    return { ok: false, message: "Add an email so we can let you know." };
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }

  const { error } = await supabase.from("need_signups").insert({
    need_id: needId,
    user_id: user?.id ?? null,
    email: user ? null : email,
    area,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { ok: false, message: "Couldn't save that. Try again." };
  }

  if (needSlug) revalidatePath(`/needs/${needSlug}`);
  return {
    ok: true,
    message: "We'll let you know the moment something opens here.",
  };
}

// What *you* need — the one place the needs taxonomy never reached.
//
// Private by design (see RLS on user_needs): "I need support" is a disclosure, not a
// profile field. Nobody else can read it; it exists so the menu can eventually lead
// with the doorway you actually came for.
export async function updateMyNeeds(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const needIds = (formData.getAll("need_ids") as string[]).filter(Boolean);

  // The form always posts the full set, so replace rather than merge — unchecking has
  // to actually remove.
  await supabase.from("user_needs").delete().eq("user_id", user.id);
  if (needIds.length > 0) {
    const { error } = await supabase
      .from("user_needs")
      .insert(needIds.map((need_id) => ({ user_id: user.id, need_id })));
    if (error) throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/menu");
}
