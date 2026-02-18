import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Runs once on app load: hydrate auth from cookie and fetch profile if token exists.
 * Mount in root so auth state is ready before any route uses it.
 */
export function AuthInit() {
  useEffect(() => {
    const { hydrateFromCookie, token, user, fetchProfile } = useAuthStore.getState();
    hydrateFromCookie();
    const state = useAuthStore.getState();
    if (state.token && !state.user) {
      void fetchProfile();
    }
  }, []);
  return null;
}
