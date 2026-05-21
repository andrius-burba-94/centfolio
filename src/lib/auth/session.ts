import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type PocketBase from "pocketbase";

import { createServerClient } from "@/lib/pocketbase/server";

export const SESSION_COOKIE = "pb_auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const pb = createServerClient();
  pb.authStore.loadFromCookie(`${SESSION_COOKIE}=${cookieValue}`);

  if (!pb.authStore.isValid || !pb.authStore.record) return null;

  const record = pb.authStore.record;
  return {
    id: String(record.id),
    email: String(record.email),
    name: String(record.name ?? ""),
    role: (record.role as "user" | "admin") ?? "user",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function persistAuthCookie(pb: PocketBase): Promise<void> {
  const cookieStore = await cookies();
  const exported = pb.authStore.exportToCookie(
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax" },
    SESSION_COOKIE,
  );
  const value = exported.split("=", 2)[1]?.split(";", 1)[0] ?? "";
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
