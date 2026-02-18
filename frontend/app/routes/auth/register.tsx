import type { Route } from "./+types/register";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { GoogleIcon, GithubIcon } from "@/components/auth-provider-icons";

const VERIFY_EMAIL_STORAGE_KEY = "hackbuddy_verify_email";
const REDIRECT_DELAY_MS = 2500;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Register – Hackathon Buddy" }];
}

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, register: doRegister, setLastLoginMode, startGoogleLogin, startGithubLogin, lastLoginMode } =
    useAuthStore();
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setLastLoginMode("email");
    const result = await doRegister({ email, full_name, password });
    setSubmitting(false);
    if (result.ok) {
      setShowSuccessPopup(true);
    } else {
      setError(result.error ?? "Registration failed");
    }
  };

  useEffect(() => {
    if (!showSuccessPopup) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(VERIFY_EMAIL_STORAGE_KEY, email);
      } catch {
        // ignore
      }
      navigate("/auth/verify-email", { replace: true });
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [showSuccessPopup, email, navigate]);

  if (user) return null;

  return (
    <>
      <h1 className="h1 mb-1">Create an account</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your details to get started. We’ll send a verification code to your email.
      </p>
      {lastLoginMode && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground mb-4" role="status">
          <span>Last sign-in:</span>
          {lastLoginMode === "google" && (
            <span className="inline-flex items-center gap-1.5">
              <GoogleIcon className="size-3.5" />
              Google
            </span>
          )}
          {lastLoginMode === "github" && (
            <span className="inline-flex items-center gap-1.5">
              <GithubIcon className="size-3.5" />
              GitHub
            </span>
          )}
          {lastLoginMode === "email" && (
            <span>Email</span>
          )}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="register-name">Full name</Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading || submitting || showSuccessPopup}
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || submitting || showSuccessPopup}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading || submitting || showSuccessPopup}
            placeholder="At least 6 characters"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <PasswordInput
            id="register-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading || submitting || showSuccessPopup}
            placeholder="Re-enter your password"
          />
        </div>
        {showSuccessPopup ? (
          <div
            className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-foreground">
              User registered successfully. Please verify your email.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Redirecting you to verify your email…
            </p>
          </div>
        ) : (
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || submitting || password !== confirmPassword}
          >
            {(isLoading || submitting) && <Spinner className="size-4" />}
            Register
          </Button>
        )}
      </form>

      {!showSuccessPopup && (
        <>
      <p className="mt-6 text-center text-sm text-muted-foreground">Or continue with</p>
      <div className="mt-3 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isLoading || submitting}
          onClick={() => {
            setLastLoginMode("google");
            startGoogleLogin();
          }}
        >
          <GoogleIcon />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isLoading || submitting}
          onClick={() => {
            setLastLoginMode("github");
            startGithubLogin();
          }}
        >
          <GithubIcon />
          GitHub
        </Button>
      </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth" className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
