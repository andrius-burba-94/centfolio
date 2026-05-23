import type { SessionUser } from "@/lib/auth/session";

import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function TopBar({ user }: { user: SessionUser }) {
  return (
    <header
      className="flex h-16 items-center justify-between px-8"
      data-testid="top-bar"
    >
      <div className="flex items-center gap-8">
        <span
          className="font-display text-wordmark text-foreground"
          data-testid="wordmark"
        >
          Centfolio
        </span>
        <NavLinks />
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
