import type { Route } from "./+types/login";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { GoogleIcon, GithubIcon } from "@/components/auth-provider-icons";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Log in - Hackathon Buddy" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const { user, isLoading, login, setLastLoginMode, startGoogleLogin, startGithubLogin, lastLoginMode } =
    useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setLastLoginMode("email");
    const result = await login({ email, password });
    setSubmitting(false);
    if (result.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  if (user) return null;

  return (
    <>
      <h1 className="h1 mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email and password to access your account.
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
      {verified && (
        <p className="text-sm text-primary bg-primary/10 rounded-md px-3 py-2 mb-4" role="status">
          Email verified. You can log in now.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || submitting}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            {/* <a href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </a> */}
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || submitting}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || submitting}>
          {(isLoading || submitting) && <Spinner className="size-4" />}
          Log in
        </Button>
      </form>

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

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don’t have an account?{" "}
        <Link to="/auth/register" className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
