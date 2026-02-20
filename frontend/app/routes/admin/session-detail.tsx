import { useParams } from "react-router";
import { SessionDetailPanel } from "@/components/admin/session-detail-panel";

export default function AdminSessionDetail() {
  const { sessionId } = useParams();
  if (!sessionId) return null;
  return <SessionDetailPanel sessionId={sessionId} />;
}
