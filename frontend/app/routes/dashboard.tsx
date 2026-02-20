import type { Route } from "./+types/dashboard";
import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/layout/app-layout/header";
import AppSidebar from "@/components/layout/app-layout/sidebar";
import { Spinner } from "@/components/ui/spinner";
import DashboardDisplay from "@/components/dashboard";
import { SessionChat } from "@/components/dashboard/session-chat";
import { useSessionManagerStore } from "@/lib/stores/session-manager";

function ContentArea() {
  const currentSessionId = useSessionManagerStore((s) => s.currentSessionId);
  const isReady = useSessionManagerStore((s) => s.status === "ready");

  return (
    <div style={{ gridArea: "content" }} className="relative flex h-full min-w-0 flex-col overflow-hidden">
      <div className="min-w-0 h-full flex-1 overflow-x-hidden overflow-y-auto p-4">
        <DashboardDisplay />
      </div>
      {currentSessionId && (
        <SessionChat sessionId={currentSessionId} enabled={isReady} />
      )}
    </div>
  );
}

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Dashboard - Hackathon Buddy" }];
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
        <p className="text-muted-foreground flex items-center gap-3"> <Spinner /> Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="h-screen bg-background overflow-hidden grid"
      style={{
        gridArea: "content",
        gridTemplateAreas: `
          "sidebar header"
          "sidebar content"
        `,
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div style={{ gridArea: "sidebar" }} className="h-full">
        <AppSidebar />
      </div>
      <div style={{ gridArea: "header" }}>
        <AppHeader />
      </div>
      <ContentArea />
    </main>
  );
}
