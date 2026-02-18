import type { Route } from "./+types/callback";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/spinner";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Signing in… – Hackathon Buddy" }];
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOAuthWithToken, setLastLoginMode } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const authError = searchParams.get("auth_error");

    if (authError) {
      setStatus("error");
      setErrorMessage(authError === "missing_code" ? "Missing authorization code." : "Sign-in failed. Try again.");
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("No token received.");
      return;
    }

    const provider = useAuthStore.getState().lastLoginMode === "github" ? "github" : "google";
    let cancelled = false;
    (async () => {
      const result = await completeOAuthWithToken(token, provider);
      if (cancelled) return;
      if (result.ok) {
        setStatus("ok");
        navigate("/", { replace: true });
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Sign-in failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, completeOAuthWithToken, navigate]);

  if (status === "ok") return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] gap-4">
      {status === "loading" && (
        <>
          <Spinner className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="text-sm text-primary hover:underline"
          >
            Back to log in
          </button>
        </>
      )}
    </div>
  );
}
