import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import DashboardEmpty from "./dash-empty";
import SessionDisplay from "./session-display";
import { useSessionManagerStore } from "@/lib/stores/session-manager";

export default function DashboardDisplay() {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");
  const { sessions, setCurrentSessionId, fetchSessions, loadSessionContent } = useSessionManagerStore();
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const wantNew = searchParams.get("new") === "1";
    if (wantNew) {
      setShowNewSession(true);
      setCurrentSessionId(null);
      return;
    }
    if (sessionIdFromUrl) {
      setCurrentSessionId(sessionIdFromUrl);
      setShowNewSession(true);
      void loadSessionContent(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl, searchParams, setCurrentSessionId, loadSessionContent]);

  if (showNewSession) {
    return <SessionDisplay />;
  }

  return (
    <DashboardEmpty onCreateSession={() => setShowNewSession(true)} />
  );
}
