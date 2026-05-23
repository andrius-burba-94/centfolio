import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PocketBase, { type RecordModel } from "pocketbase";

import { createServerClient } from "@/lib/pocketbase/server";

export const SESSION_COOKIE = "pb_auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

type SessionPayload = {
  token: string;
  record: RecordModel;
};

function parseSession(cookieValue: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(cookieValue) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "token" in parsed &&
      "record" in parsed &&
      typeof (parsed as SessionPayload).token === "string"
    ) {
      return parsed as SessionPayload;
    }
  } catch {
    // fall through
  }
  return null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const session = parseSession(cookieValue);
  if (!session) return null;

  return {
    id: String(session.record.id),
    email: String(session.record.email ?? ""),
    name: String(session.record.name ?? ""),
    role: (session.record.role as "user" | "admin") ?? "user",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAuthenticatedPb(): Promise<{
  pb: PocketBase;
  user: SessionUser;
}> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookieValue) redirect("/login");

  const session = parseSession(cookieValue);
  if (!session) redirect("/login");

  const pb = createServerClient();
  pb.authStore.save(session.token, session.record);

  if (!pb.authStore.isValid) redirect("/login");

  const user: SessionUser = {
    id: String(session.record.id),
    email: String(session.record.email ?? ""),
    name: String(session.record.name ?? ""),
    role: (session.record.role as "user" | "admin") ?? "user",
  };

  return { pb, user };
}

export async function persistAuthCookie(pb: PocketBase): Promise<void> {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    token: pb.authStore.token,
    record: (pb.authStore.record ?? pb.authStore.model) as RecordModel,
  };
  cookieStore.set(SESSION_COOKIE, JSON.stringify(payload), {
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
