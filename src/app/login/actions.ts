"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { persistAuthCookie } from "@/lib/auth/session";
import { createServerClient } from "@/lib/pocketbase/server";
import { logError } from "@/lib/log/logError";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginActionState = { error: string | null };

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error:
        "Enter a valid email and a password of at least 8 characters.",
    };
  }

  const pb = createServerClient();
  try {
    await pb
      .collection("users")
      .authWithPassword(parsed.data.email, parsed.data.password);
    await persistAuthCookie(pb);
  } catch (err) {
    logError(err, { action: "login", email: parsed.data.email });
    return { error: "We don't recognize that email or password." };
  }

  redirect("/dashboard");
}
