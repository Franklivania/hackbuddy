import { create } from "zustand";
import type { Session } from "@/types/sessions";
import type { CreateSessionInput } from "@/types/sessions";
import type { AddSourcesInput } from "@/types/sources";
import type { ApiResponse } from "@/types/api";
import { getData, postData, deleteData } from "@/lib/services/api-actions";
import { SESSIONS, SOURCES, ANALYSIS } from "@/lib/services/API_ENDPOINTS";

export type SessionStatus = "idle" | "loading" | "processing" | "ready" | "error";

export type StepStatus = "pending" | "in_progress" | "complete" | "failed";

export interface ProcessStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface SessionManagerState {
  status: SessionStatus;
  message: string;
  content: string;
  error: string | null;
  steps: ProcessStep[];
  sessions: Session[];
  currentSessionId: string | null;
  isLoadingSessions: boolean;
}

interface SessionManagerActions {
  startProcessing: (message?: string) => void;
  setUpdate: (message: string) => void;
  setContent: (content: string) => void;
  setError: (message: string) => void;
  setSteps: (steps: ProcessStep[]) => void;
  setStepStatus: (stepId: string, status: StepStatus) => void;
  startSteps: (labels: string[]) => void;
  completeCurrentStep: () => void;
  failCurrentStep: () => void;
  addSession: (session: Session) => void;
  setCurrentSessionId: (id: string | null) => void;
  setSessions: (sessions: Session[]) => void;
  reset: () => void;
  // API
  fetchSessions: () => Promise<Session[]>;
  createSession: (input: CreateSessionInput) => Promise<Session | null>;
  getSession: (id: string) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<boolean>;
  addSources: (sessionId: string, input: AddSourcesInput) => Promise<boolean>;
  listSources: (sessionId: string) => Promise<unknown>;
  listAnalyses: (sessionId: string) => Promise<AnalysisResultData[]>;
  runAnalysis: (sessionId: string) => Promise<{ content?: string; markdown?: string } | null>;
  loadSessionContent: (sessionId: string) => Promise<void>;
}

function unwrap<T>(res: { data: ApiResponse<T> | null }): T | null {
  const body = res.data;
  if (!body?.success || body.data == null) return null;
  return body.data as T;
}

/** API analysis result shape */
interface AnalysisResultData {
  result_json?: string;
  recommendation?: string;
}

/** Convert result_json (stringified JSON) and optional recommendation into markdown for rendering */
function analysisResultToMarkdown(data: AnalysisResultData | null): string {
  if (!data) return "";

  const out: string[] = [];

  if (data.result_json) {
    try {
      const obj = JSON.parse(data.result_json) as Record<string, unknown>;
      for (const [section, value] of Object.entries(obj)) {
        out.push(`## ${section}\n\n`);
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          out.push(formatObject(value as Record<string, unknown>, 0));
        } else if (Array.isArray(value)) {
          out.push(value.map((v) => `- ${String(v)}`).join("\n") + "\n");
        } else {
          out.push(String(value ?? "") + "\n");
        }
        out.push("\n");
      }
    } catch {
      out.push(data.result_json);
    }
  }

  if (data.recommendation?.trim()) {
    out.push("## Recommendation\n\n");
    out.push(data.recommendation.trim());
  }

  return out.join("").trim() || "";
}

function formatObject(obj: Record<string, unknown>, indent: number): string {
  const lines: string[] = [];
  const pad = "  ".repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      lines.push(`${pad}**${k}:**`);
      for (const item of v) {
        const str = typeof item === "object" && item !== null && !Array.isArray(item)
          ? formatObject(item as Record<string, unknown>, indent + 1).trim()
          : String(item);
        lines.push(`${pad}  - ${str}`);
      }
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      lines.push(`${pad}**${k}:**`);
      lines.push(formatObject(v as Record<string, unknown>, indent + 1));
    } else {
      lines.push(`${pad}**${k}:** ${v == null ? "" : String(v)}`);
    }
  }
  return lines.join("\n") + "\n";
}

const defaultSteps: ProcessStep[] = [];
const PROCESS_STEP_LABELS = ["Scraping", "Analysing", "Rendering"];

const initialState: SessionManagerState = {
  status: "idle",
  message: "",
  content: "",
  error: null,
  steps: defaultSteps,
  sessions: [],
  currentSessionId: null,
  isLoadingSessions: false,
};

export const useSessionManagerStore = create<SessionManagerState & SessionManagerActions>()((set, get) => ({
  ...initialState,

  startProcessing(message = "Starting…") {
    set({
      status: "loading",
      message,
      content: "",
      error: null,
    });
  },

  setUpdate(message: string) {
    set((s) => ({
      ...s,
      status: s.status === "ready" ? "ready" : "processing",
      message,
    }));
  },

  setContent(content: string) {
    set({
      status: "ready",
      message: "",
      content,
      error: null,
    });
  },

  setError(message: string) {
    set({
      status: "error",
      message: "",
      error: message,
    });
  },

  setSteps(steps: ProcessStep[]) {
    set({ steps });
  },

  setStepStatus(stepId: string, status: StepStatus) {
    set((s) => ({
      steps: s.steps.map((st) => (st.id === stepId ? { ...st, status } : st)),
    }));
  },

  startSteps(labels: string[]) {
    const steps: ProcessStep[] = labels.map((label, i) => ({
      id: `step-${i}`,
      label,
      status: i === 0 ? "in_progress" : "pending",
    }));
    set({
      status: "processing",
      steps,
      message: "",
      error: null,
    });
  },

  completeCurrentStep() {
    const { steps } = get();
    const idx = steps.findIndex((s) => s.status === "in_progress");
    if (idx < 0) return;
    const next = steps.map((s, i) =>
      i === idx ? { ...s, status: "complete" as StepStatus } : i === idx + 1 ? { ...s, status: "in_progress" as StepStatus } : s
    );
    set({ steps: next });
  },

  failCurrentStep() {
    const { steps } = get();
    const idx = steps.findIndex((s) => s.status === "in_progress");
    if (idx < 0) return;
    const next = steps.map((s, i) => (i === idx ? { ...s, status: "failed" as StepStatus } : s));
    set({ status: "error", steps: next });
  },

  addSession(session: Session) {
    set((s) => ({
      sessions: [session, ...s.sessions.filter((x) => x.id !== session.id)],
      currentSessionId: session.id,
    }));
  },

  setCurrentSessionId(id: string | null) {
    set({ currentSessionId: id });
  },

  setSessions(sessions: Session[]) {
    set({ sessions });
  },

  reset() {
    set(initialState);
  },

  async fetchSessions() {
    set({ isLoadingSessions: true });
    try {
      const res = await getData<ApiResponse<Session[]>>(SESSIONS.list);
      const list = unwrap<Session[]>(res);
      if (Array.isArray(list)) {
        set({ sessions: list });
        return list;
      }
      return get().sessions;
    } catch {
      return get().sessions;
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  async createSession(input: CreateSessionInput) {
    try {
      const res = await postData<ApiResponse<Session>, CreateSessionInput>(SESSIONS.create, input);
      const session = unwrap<Session>(res);
      if (session) {
        get().addSession(session);
        return session;
      }
      return null;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err ? (err as { data?: { message?: string } }).data?.message : null;
      get().setError(msg ?? "Failed to create session");
      return null;
    }
  },

  async getSession(id: string) {
    try {
      const res = await getData<ApiResponse<Session>>(SESSIONS.one(id));
      return unwrap<Session>(res) ?? null;
    } catch {
      return null;
    }
  },

  async deleteSession(id: string) {
    try {
      await deleteData<ApiResponse<unknown>>(SESSIONS.delete(id));
      set((s) => ({
        sessions: s.sessions.filter((x) => x.id !== id),
        currentSessionId: s.currentSessionId === id ? null : s.currentSessionId,
      }));
      return true;
    } catch {
      return false;
    }
  },

  async addSources(sessionId: string, input: AddSourcesInput) {
    try {
      const res = await postData<ApiResponse<unknown>, AddSourcesInput>(SOURCES.add(sessionId), input);
      return res.data?.success === true;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err ? (err as { data?: { message?: string } }).data?.message : null;
      get().setError(msg ?? "Failed to add sources");
      return false;
    }
  },

  async listSources(sessionId: string) {
    try {
      const res = await getData<ApiResponse<unknown>>(SOURCES.list(sessionId));
      return unwrap<unknown>(res) ?? [];
    } catch {
      return [];
    }
  },

  async listAnalyses(sessionId: string) {
    try {
      const res = await getData<ApiResponse<AnalysisResultData[] | { analyses?: AnalysisResultData[] }>>(ANALYSIS.list(sessionId));
      const raw = unwrap<AnalysisResultData[] | { analyses?: AnalysisResultData[] }>(res);
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object" && Array.isArray((raw as { analyses?: AnalysisResultData[] }).analyses)) {
        return (raw as { analyses: AnalysisResultData[] }).analyses;
      }
      return [];
    } catch {
      return [];
    }
  },

  async loadSessionContent(sessionId: string) {
    set({ status: "loading", message: "Loading session…", error: null });
    try {
      const session = await get().getSession(sessionId);
      if (!session) {
        set({ status: "error", error: "Session not found" });
        return;
      }
      set({ currentSessionId: sessionId });
      const { sessions } = get();
      if (!sessions.some((s) => s.id === sessionId)) {
        set((s) => ({ sessions: [session, ...s.sessions.filter((x) => x.id !== sessionId)] }));
      }
      const analyses = await get().listAnalyses(sessionId);
      const steps = PROCESS_STEP_LABELS.map((label, i) => ({
        id: `step-${i}`,
        label,
        status: "complete" as StepStatus,
      }));
      if (analyses.length > 0) {
        const latest = analyses.reduce((a, b) => {
          const aAt = (a as { created_at?: string }).created_at ?? "";
          const bAt = (b as { created_at?: string }).created_at ?? "";
          return bAt > aAt ? b : a;
        });
        const content = analysisResultToMarkdown(latest);
        set({
          status: "ready",
          message: "",
          content: content || "# No content",
          error: null,
          steps,
        });
      } else {
        set({
          status: "idle",
          message: "",
          content: "",
          error: null,
          steps: [],
        });
      }
    } catch {
      set({ status: "error", error: "Failed to load session" });
    }
  },

  async runAnalysis(sessionId: string) {
    try {
      const res = await postData<ApiResponse<AnalysisResultData>>(ANALYSIS.run(sessionId));
      const data = unwrap<AnalysisResultData>(res);
      const content = analysisResultToMarkdown(data);
      return content ? { content } : null;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err ? (err as { data?: { message?: string } }).data?.message : null;
      get().setError(msg ?? "Analysis failed");
      return null;
    }
  },
}));
