import { create } from "zustand";
import type { Session } from "@/types/sessions";
import type { CreateSessionInput, UpdateSessionInput } from "@/types/sessions";
import type { AddSourcesInput } from "@/types/sources";
import type { Message, ChatInput } from "@/types/chat";
import type { Chunk } from "@/types/chunks";
import type { ApiResponse } from "@/types/api";
import { getData, postData, patchData, deleteData } from "@/lib/services/api-actions";
import { SESSIONS, SOURCES, ANALYSIS, CHAT } from "@/lib/services/API_ENDPOINTS";

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
  analysisData: Record<string, unknown> | null;
  error: string | null;
  steps: ProcessStep[];
  sessions: Session[];
  currentSessionId: string | null;
  isLoadingSessions: boolean;
  chunksCache: Record<string, Chunk[]>;
  chunksFetchingIds: string[];
  chatMessages: Message[];
  isSendingChat: boolean;
  chatError: string | null;
}

interface SessionManagerActions {
  startProcessing: (message?: string) => void;
  setUpdate: (message: string) => void;
  setContent: (content: string, analysisData?: Record<string, unknown> | null) => void;
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
  resetToForm: () => void;
  // API
  fetchSessions: () => Promise<Session[]>;
  createSession: (input: CreateSessionInput) => Promise<Session | null>;
  updateSession: (id: string, input: UpdateSessionInput) => Promise<Session | null>;
  getSession: (id: string) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<boolean>;
  getNextDefaultSessionName: () => string;
  addSources: (sessionId: string, input: AddSourcesInput) => Promise<boolean>;
  listSources: (sessionId: string) => Promise<unknown>;
  listAnalyses: (sessionId: string) => Promise<AnalysisResultData[]>;
  runAnalysis: (sessionId: string) => Promise<{ content?: string; markdown?: string; analysisData?: Record<string, unknown> | null } | null>;
  loadSessionContent: (sessionId: string) => Promise<void>;
  fetchChunks: (sessionId: string) => Promise<Chunk[]>;
  fetchChatHistory: (sessionId: string) => Promise<Message[]>;
  sendChatMessage: (sessionId: string, message: string) => Promise<Message | null>;
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
  analysisData: null,
  error: null,
  steps: defaultSteps,
  sessions: [],
  currentSessionId: null,
  isLoadingSessions: false,
  chunksCache: {},
  chunksFetchingIds: [],
  chatMessages: [],
  isSendingChat: false,
  chatError: null,
};

export const useSessionManagerStore = create<SessionManagerState & SessionManagerActions>()((set, get) => ({
  ...initialState,

  startProcessing(message = "Starting…") {
    set({
      status: "loading",
      message,
      content: "",
      analysisData: null,
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

  setContent(content: string, analysisData?: Record<string, unknown> | null) {
    set({
      status: "ready",
      message: "",
      content,
      analysisData: analysisData ?? null,
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
    set({ currentSessionId: id, chatMessages: [], isSendingChat: false, chatError: null });
  },

  setSessions(sessions: Session[]) {
    set({ sessions });
  },

  reset() {
    set(initialState);
  },

  resetToForm() {
    set({
      status: "idle",
      message: "",
      content: "",
      analysisData: null,
      error: null,
      steps: [],
      chatMessages: [],
      isSendingChat: false,
      chatError: null,
    });
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

  getNextDefaultSessionName() {
    const names = get().sessions.map((s) => s.name);
    const used = new Set<number>();
    for (const n of names) {
      const t = n.trim();
      const match = t.match(/^New Session\s*(\d+)$/i);
      if (match) used.add(parseInt(match[1], 10));
      else if (t.toLowerCase() === "new session") used.add(1);
    }
    let n = 1;
    while (used.has(n)) n++;
    return `New Session ${n}`;
  },

  async createSession(input: CreateSessionInput) {
    try {
      const raw = input.name?.trim() ?? "";
      const useDefault =
        !raw || /^New Session(\s*\d*)?$/i.test(raw) || raw.toLowerCase() === "new session";
      const name = useDefault ? get().getNextDefaultSessionName() : input.name;
      const res = await postData<ApiResponse<Session>, CreateSessionInput>(SESSIONS.create, { name });
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

  async updateSession(id: string, input: UpdateSessionInput) {
    try {
      const res = await patchData<ApiResponse<Session>, UpdateSessionInput>(SESSIONS.one(id), input);
      const session = unwrap<Session>(res);
      if (session) {
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? session : x)),
        }));
        return session;
      }
      return null;
    } catch {
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
        let analysisData: Record<string, unknown> | null = null;
        if (latest.result_json) {
          try { analysisData = JSON.parse(latest.result_json) as Record<string, unknown>; } catch { /* use markdown fallback */ }
        }
        set({
          status: "ready",
          message: "",
          content: content || "# No content",
          analysisData,
          error: null,
          steps,
        });
        void get().fetchChunks(sessionId);
        void get().fetchChatHistory(sessionId);
      } else {
        const sourcesRaw = await get().listSources(sessionId);
        const sourceList = Array.isArray(sourcesRaw) ? sourcesRaw : [];
        if (sourceList.length > 0) {
          set({
            status: "error",
            message: "",
            content: "",
            analysisData: null,
            error: "Analysis not completed. You can retry or start over.",
            steps: PROCESS_STEP_LABELS.map((label, i) => ({
              id: `step-${i}`,
              label,
              status: (i === 0 ? "complete" : i === 1 ? "failed" : "pending") as StepStatus,
            })),
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
      }
    } catch {
      set({ status: "error", error: "Failed to load session" });
    }
  },

  async fetchChunks(sessionId: string) {
    const { chunksFetchingIds } = get();
    if (chunksFetchingIds.includes(sessionId)) {
      return get().chunksCache[sessionId] ?? [];
    }
    set({ chunksFetchingIds: [...chunksFetchingIds, sessionId] });
    try {
      const res = await getData<ApiResponse<Chunk[]>>(SOURCES.chunks(sessionId));
      const body = res.data;
      const chunks = body?.success && Array.isArray(body.data) ? body.data : [];
      set((s) => ({
        chunksCache: { ...s.chunksCache, [sessionId]: chunks },
        chunksFetchingIds: s.chunksFetchingIds.filter((id) => id !== sessionId),
      }));
      return chunks;
    } catch {
      set((s) => ({
        chunksFetchingIds: s.chunksFetchingIds.filter((id) => id !== sessionId),
      }));
      return get().chunksCache[sessionId] ?? [];
    }
  },

  async runAnalysis(sessionId: string) {
    try {
      const res = await postData<ApiResponse<AnalysisResultData>>(ANALYSIS.run(sessionId));
      const data = unwrap<AnalysisResultData>(res);
      let analysisData: Record<string, unknown> | null = null;
      if (data?.result_json) {
        try { analysisData = JSON.parse(data.result_json) as Record<string, unknown>; } catch { /* fallback to markdown */ }
      }
      const content = analysisResultToMarkdown(data);
      return content ? { content, analysisData } : null;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err ? (err as { data?: { message?: string } }).data?.message : null;
      get().setError(msg ?? "Analysis failed");
      return null;
    }
  },

  async fetchChatHistory(sessionId: string) {
    try {
      const res = await getData<ApiResponse<Message[]>>(CHAT.history(sessionId));
      const messages = unwrap<Message[]>(res);
      if (Array.isArray(messages)) {
        set({ chatMessages: messages.filter((m) => m.role !== "system") });
        return messages;
      }
      return [];
    } catch {
      return [];
    }
  },

  async sendChatMessage(sessionId: string, message: string) {
    const userMsg: Message = {
      id: `local-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      chatMessages: [...s.chatMessages, userMsg],
      isSendingChat: true,
      chatError: null,
    }));
    try {
      const res = await postData<ApiResponse<Message>, ChatInput>(CHAT.send(sessionId), { message });
      const aiMsg = unwrap<Message>(res);
      if (aiMsg) {
        set((s) => ({
          chatMessages: [...s.chatMessages, aiMsg],
          isSendingChat: false,
        }));
        return aiMsg;
      }
      set({ isSendingChat: false });
      return null;
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : null;
      set({ isSendingChat: false, chatError: msg ?? "Failed to send message" });
      return null;
    }
  },
}));
