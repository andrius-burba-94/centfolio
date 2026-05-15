# Centfolio

A curated ledger of your financial life.

Centfolio combines bank transactions, AI-parsed receipts, and investment
holdings into a single calm view of where money actually goes. Built for
the Baltic banking landscape, SEB Lithuania first.

## Status

Pre-MVP. Active development on Phase 1 (Foundation).

See [`PROJECT.md`](./PROJECT.md) for vision and scope, [`CONTEXT.md`](./CONTEXT.md)
for domain language, and [`docs/adr/`](./docs/adr/) for architectural
decisions.

## Stack

Next.js 16 · TypeScript · PocketBase · Tailwind CSS 4 · shadcn/ui · Tremor

## Getting started

```bash
npm install
cp .env.example .env.local  # fill in real values
npm run dev
```

PocketBase is a separate process; see [`pocketbase/README.md`](./pocketbase/README.md)
once it exists.

## Working with AI agents

See [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md) for the
rules agents follow in this repo.

## License

Personal project. All rights reserved.
