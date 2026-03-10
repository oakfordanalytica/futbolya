import "server-only";

import { fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

export async function syncCurrentUser() {
  const token = await getAuthToken();
  if (!token) {
    return;
  }

  try {
    await fetchAction(api.users.syncCurrentUser, {}, { token });
  } catch {
    // Access checks still have fallback paths; avoid turning sync delays into hard failures.
  }
}
