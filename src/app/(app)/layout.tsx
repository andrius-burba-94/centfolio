import { requireUser } from "@/lib/auth/session";
import { TopBar } from "@/components/feature/top-bar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar user={user} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
