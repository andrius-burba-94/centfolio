"use server";

import { redirect } from "next/navigation";

import { clearAuthCookie } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}
