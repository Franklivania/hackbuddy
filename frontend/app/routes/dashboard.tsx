import type { Route } from "./+types/dashboard";
import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard – Hackathon Buddy" }];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isHydrated, fetchProfile, logout } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user && useAuthStore.getState().token) {
      void fetchProfile();
    } else if (!user && !useAuthStore.getState().token) {
      navigate("/auth", { replace: true });
    }
  }, [isHydrated, user, navigate, fetchProfile]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!isHydrated || (!user && useAuthStore.getState().token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex items-center justify-between max-w-4xl mx-auto mb-8">
        <Link to="/" className="text-lg font-medium text-foreground hover:underline">
          Hackathon Buddy
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <h1 className="h1 mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.full_name}. Your sessions and strategy tools will appear here.
        </p>
      </main>
    </div>
  );
}
