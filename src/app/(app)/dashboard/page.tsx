export default function DashboardPage() {
  return (
    <section
      className="flex flex-1 flex-col items-center justify-center px-6"
      data-testid="dashboard-empty-state"
    >
      <div className="text-center">
        <h1 className="font-display text-display text-foreground">
          Your money, considered.
        </h1>
        <p className="mt-4 mx-auto max-w-[42ch] text-body text-muted-foreground">
          Centfolio is empty until you connect an account. Account-connection
          arrives in a later phase. Settle in.
        </p>
      </div>
    </section>
  );
}
