import "server-only";

import { fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

export async function syncCurrentUser(token?: string) {
  const resolvedToken = token ?? (await getAuthToken());
  if (!resolvedToken) {
    return;
  }

  try {
    await fetchAction(api.users.syncCurrentUser, {}, { token: resolvedToken });
  } catch {
    // Access checks fail closed while Clerk/Convex synchronization recovers.
  }
}
