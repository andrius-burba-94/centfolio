/* eslint-disable no-console */
import PocketBase from "pocketbase";

const PB_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD;
const SEED_NAME = process.env.SEED_USER_NAME ?? "Test User";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const adminEmail = requireEnv("POCKETBASE_ADMIN_EMAIL", ADMIN_EMAIL);
  const adminPassword = requireEnv("POCKETBASE_ADMIN_PASSWORD", ADMIN_PASSWORD);
  const seedEmail = requireEnv("SEED_USER_EMAIL", SEED_EMAIL);
  const seedPassword = requireEnv("SEED_USER_PASSWORD", SEED_PASSWORD);

  if (seedPassword.length < 12) {
    console.error("SEED_USER_PASSWORD must be at least 12 characters (PB schema requirement).");
    process.exit(1);
  }

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  console.log(`Authenticating as superuser ${adminEmail} against ${PB_URL}...`);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

  // Ensure the users collection allows password auth for non-superusers.
  // The committed schema ships with authRule="" (closed in PB terms),
  // which blocks all non-superuser login. SDK update with null doesn't
  // consistently round-trip; using a known-permissive expression instead.
  const usersCollection = await pb.collections.getOne("users");
  const permissiveRule = 'id != ""';
  if (usersCollection.authRule !== permissiveRule) {
    await pb.collections.update("users", { authRule: permissiveRule });
    console.log(`Patched users.authRule -> ${permissiveRule}`);
  }

  try {
    const existing = await pb
      .collection("users")
      .getFirstListItem(`email = "${seedEmail}"`);
    console.log(`Seed user already exists: ${seedEmail} (id=${existing.id})`);
    return;
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

  // Self-verify: a fresh PB client (no superuser auth) must be able to log in
  // as the just-created user. If this fails, the issue is the user's record
  // or the collection auth config; not the Next.js side.
  const verifyPb = new PocketBase(PB_URL);
  verifyPb.autoCancellation(false);
  try {
    await verifyPb.collection("users").authWithPassword(seedEmail, seedPassword);
    console.log("Self-verified: seed user can authenticate with the given password.");
  } catch (err) {
    console.error("Self-verify FAILED. Seed user cannot authenticate:");
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
