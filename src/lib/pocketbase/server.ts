import "server-only";
import PocketBase from "pocketbase";

const POCKETBASE_URL =
  process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";

export function createServerClient(): PocketBase {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  return pb;
}
