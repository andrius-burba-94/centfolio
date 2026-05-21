import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1
          className="font-display text-display text-foreground text-center mb-10"
          data-testid="login-wordmark"
        >
          Centfolio
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
