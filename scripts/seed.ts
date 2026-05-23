/* eslint-disable no-console */
import PocketBase from "pocketbase";

const PB_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD;
const SEED_NAME = process.env.SEED_USER_NAME ?? "Test User";

type CategorySeed = {
  name: string;
  children?: string[];
};

const STARTER_CATEGORIES: CategorySeed[] = [
  { name: "Food", children: ["Groceries", "Restaurant"] },
  { name: "Transport", children: ["Gas", "Public"] },
  { name: "Shopping" },
  { name: "Bills", children: ["Utilities", "Subscriptions"] },
  { name: "Income", children: ["Salary"] },
  { name: "Other" },
];

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function findOrCreateUser(
  pb: PocketBase,
  seedEmail: string,
  seedPassword: string,
): Promise<{ id: string; created: boolean }> {
  try {
    const existing = await pb
      .collection("users")
      .getFirstListItem(`email = "${seedEmail}"`);
    console.log(`Seed user already exists: ${seedEmail} (id=${existing.id})`);
    return { id: String(existing.id), created: false };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 404) throw err;
  }

  const created = await pb.collection("users").create({
    email: seedEmail,
    password: seedPassword,
    passwordConfirm: seedPassword,
    role: "admin",
    name: SEED_NAME,
    emailVisibility: true,
    verified: true,
  });
  console.log(`Seed user created: ${seedEmail} (id=${created.id})`);
  return { id: String(created.id), created: true };
}

async function selfVerify(seedEmail: string, seedPassword: string): Promise<void> {
  const verifyPb = new PocketBase(PB_URL);
  verifyPb.autoCancellation(false);
  try {
    await verifyPb
      .collection("users")
      .authWithPassword(seedEmail, seedPassword);
    console.log("Self-verified: seed user can authenticate with the given password.");
  } catch (err) {
    console.error("Self-verify FAILED. Seed user cannot authenticate:");
    console.error(err);
    process.exit(1);
  }
}

async function findOrCreateCategory(
  pb: PocketBase,
  userId: string,
  name: string,
  parentId: string | null,
): Promise<string> {
  const filter = parentId
    ? `userId='${userId}' && name='${name}' && parentId='${parentId}'`
    : `userId='${userId}' && name='${name}' && parentId=''`;
  try {
    const existing = await pb.collection("categories").getFirstListItem(filter);
    return String(existing.id);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 404) throw err;
  }
  const data: Record<string, unknown> = { name, userId };
  if (parentId) data.parentId = parentId;
  const created = await pb.collection("categories").create(data);
  return String(created.id);
}

async function seedStarterCategories(
  pb: PocketBase,
  userId: string,
): Promise<{ created: number; existed: number }> {
  let created = 0;
  let existed = 0;

  for (const cat of STARTER_CATEGORIES) {
    const beforeCount = created;
    let parentId: string;
    try {
      await pb
        .collection("categories")
        .getFirstListItem(
          `userId="${userId}" && name="${cat.name}" && parentId=""`,
        );
      parentId = await findOrCreateCategory(pb, userId, cat.name, null);
      existed += 1;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status !== 404) throw err;
      parentId = await findOrCreateCategory(pb, userId, cat.name, null);
      created += 1;
    }

    for (const childName of cat.children ?? []) {
      try {
        await pb
          .collection("categories")
          .getFirstListItem(
            `userId='${userId}' && name='${childName}' && parentId='${parentId}'`,
          );
        existed += 1;
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status !== 404) throw err;
        await findOrCreateCategory(pb, userId, childName, parentId);
        created += 1;
      }
    }

    const addedThisRound = created - beforeCount;
    if (addedThisRound > 0) {
      console.log(`Seeded ${addedThisRound} categor${addedThisRound === 1 ? "y" : "ies"} under "${cat.name}"`);
    }
  }

  return { created, existed };
}

async function main() {
  const adminEmail = requireEnv("POCKETBASE_ADMIN_EMAIL", ADMIN_EMAIL);
  const adminPassword = requireEnv("POCKETBASE_ADMIN_PASSWORD", ADMIN_PASSWORD);
  const seedEmail = requireEnv("SEED_USER_EMAIL", SEED_EMAIL);
  const seedPassword = requireEnv("SEED_USER_PASSWORD", SEED_PASSWORD);

  if (seedPassword.length < 12) {
    console.error(
      "SEED_USER_PASSWORD must be at least 12 characters (PB schema requirement).",
    );
    process.exit(1);
  }

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  console.log(`Authenticating as superuser ${adminEmail} against ${PB_URL}...`);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

  const { id: userId, created } = await findOrCreateUser(
    pb,
    seedEmail,
    seedPassword,
  );

  if (created) {
    await selfVerify(seedEmail, seedPassword);
  }

  const result = await seedStarterCategories(pb, userId);
  console.log(
    `Categories: ${result.created} created, ${result.existed} already present.`,
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
