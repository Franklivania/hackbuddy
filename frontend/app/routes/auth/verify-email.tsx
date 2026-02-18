import type { Route } from "./+types/verify-email";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Verify email – Hackathon Buddy" }];
}

const CODE_LENGTH = 6;
const VERIFY_EMAIL_STORAGE_KEY = "hackbuddy_verify_email";

function getStoredEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(VERIFY_EMAIL_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email] = useState(() => {
    const stored = getStoredEmail();
    if (stored) return stored;
    return searchParams.get("email") ?? "";
  });
  const { isLoading, verifyEmail, resendOtp } = useAuthStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email missing. Please start from the register page.");
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await verifyEmail({ email, code });
    setSubmitting(false);
    if (result.ok) {
      try {
        window.localStorage.removeItem(VERIFY_EMAIL_STORAGE_KEY);
      } catch {
        // ignore
      }
      navigate("/auth?verified=1", { replace: true });
    } else {
      setError(result.error ?? "Verification failed");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError("");
    const result = await resendOtp({ email });
    if (result.ok) {
      setResendCooldown(60);
    } else {
      setError(result.error ?? "Resend failed");
    }
  };

  if (!email) {
    return (
      <>
        <h1 className="h1 mb-1">Verify your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          No email found. Please complete registration first.
        </p>
        <Link to="/auth/register" className="text-primary text-sm font-medium hover:underline">
          Go to Register
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="h1 mb-1">Verify your email</h1>
      <p className="text-sm text-muted-foreground mb-2">
        We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
      </p>
      <p className="text-sm text-muted-foreground mb-8">Enter it below.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          <Label className="sr-only">Verification code</Label>
          <InputOTP
            maxLength={CODE_LENGTH}
            value={code}
            onChange={setCode}
            disabled={isLoading || submitting}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="justify-center gap-3">
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-14 w-14 text-xl font-semibold rounded-lg first:rounded-l-lg last:rounded-r-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || submitting || code.length !== CODE_LENGTH}>
          {(isLoading || submitting) && <Spinner className="size-4" />}
          Verify
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn’t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/auth" className="text-primary font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
