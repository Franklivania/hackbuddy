import type { Route } from "./+types/layout";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/spinner";
import { AdminLayout } from "@/components/admin/admin-layout";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin - Hackathon Buddy" }];
}

export default function AdminRoot() {
  const navigate = useNavigate();
  const { user, isHydrated, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user && useAuthStore.getState().token) {
      void fetchProfile();
      return;
    }
    if (!user || !useAuthStore.getState().token) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [isHydrated, user, navigate, fetchProfile]);

  if (!isHydrated || (!user && useAuthStore.getState().token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground flex items-center gap-3">
          <Spinner /> Loading...
        </p>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return <AdminLayout />;
}
