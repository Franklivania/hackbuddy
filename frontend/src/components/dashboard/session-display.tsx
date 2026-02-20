import React, { useState, useCallback, useEffect } from "react";
import { useSessionManagerStore } from "@/lib/stores/session-manager";
import { isValidURL } from "@/lib/security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, Plus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import SessionRenderedContent from "./session-rendered-content";
import { ChunkGrid } from "./chunks/chunk-grid";

const MAX_SOURCE_LINKS = 5;
const PROCESS_STEP_LABELS = ["Scraping", "Analysing", "Rendering"];

/** Source item from GET /sessions/:id/sources */
interface SourceItem {
  id: string;
  session_id: string;
  url: string;
  type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SESSION_NAME_REG = /^New Session(\s*\d+)?$/i;
function isDefaultSessionName(name: string): boolean {
  const t = name?.trim() ?? "";
  return !t || t.toLowerCase() === "new session" || DEFAULT_SESSION_NAME_REG.test(t);
}

/** Derive a short session title from analysis markdown content (e.g. first ## heading or Event Name). */
function deriveTitleFromContent(content: string): string {
  if (!content?.trim()) return "";
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const eventNameMatch = line.match(/\*\*Event Name\*\*:\s*(.+)/i);
    if (eventNameMatch) return eventNameMatch[1].trim().slice(0, 60);
    const headingMatch = line.match(/^#+\s+(.+)$/);
    if (headingMatch) return headingMatch[1].trim().slice(0, 60);
  }
  const first = lines[0]?.replace(/^#+\s*/, "").trim();
  return first ? first.slice(0, 60) : "";
}

export default function SessionDisplay() {
  const {
    status,
    steps,
    content,
    error,
    currentSessionId,
    sessions,
    startSteps,
    setContent,
    completeCurrentStep,
    failCurrentStep,
    createSession,
    updateSession,
    addSources,
    runAnalysis,
    listSources,
    resetToForm,
  } = useSessionManagerStore();

  const hasExistingSession = Boolean(currentSessionId && sessions.some((s) => s.id === currentSessionId));

  const [sourceLinks, setSourceLinks] = useState<string[]>([""]);
  const [subjectLink, setSubjectLink] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [pendingFilled, setPendingFilled] = useState<string[]>([]);
  const [pendingSubject, setPendingSubject] = useState("");
  const [openSteps, setOpenSteps] = useState<string[]>([]);
  const [sourcesCache, setSourcesCache] = useState<SourceItem[] | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const sourceCount = sourceLinks.filter((v) => v.trim() !== "").length;
  const subjectOk = subjectLink.trim() === "" || isValidURL(subjectLink.trim());
  const canSubmit = subjectOk && sourceCount > 0 && sourceCount <= MAX_SOURCE_LINKS;

  const runWithName = useCallback(
    async (sessionName: string) => {
      const filled = pendingFilled.length ? pendingFilled : sourceLinks.map((s) => s.trim()).filter(Boolean);
      const subject = pendingSubject !== undefined ? pendingSubject : subjectLink.trim();
      startSteps(PROCESS_STEP_LABELS);

      const session = await createSession({ name: sessionName });
      if (!session) return;

      completeCurrentStep();
      const added = await addSources(session.id, {
        links: filled,
        ...(subject ? { subject_link: subject } : {}),
      });
      if (!added) {
        failCurrentStep();
        return;
      }
      completeCurrentStep();

      const analysis = await runAnalysis(session.id);
      completeCurrentStep();
      if (!analysis) {
        failCurrentStep();
        return;
      }
      const text = analysis.content ?? analysis.markdown ?? "";
      setContent(
        text || "# Session result\n\nAnalysis complete. No content returned.",
        analysis.analysisData,
      );
      if (session && isDefaultSessionName(session.name)) {
        const suggested = deriveTitleFromContent(text);
        if (suggested) void updateSession(session.id, { name: suggested });
      }
    },
    [
      pendingFilled,
      pendingSubject,
      sourceLinks,
      subjectLink,
      startSteps,
      setContent,
      completeCurrentStep,
      failCurrentStep,
      createSession,
      updateSession,
      addSources,
      runAnalysis,
    ]
  );

  const runWithExistingSession = useCallback(async () => {
    const filled = sourceLinks.map((s) => s.trim()).filter(Boolean);
    const subject = subjectLink.trim();
    if (!currentSessionId) return;
    startSteps(PROCESS_STEP_LABELS);
    completeCurrentStep();
    const added = await addSources(currentSessionId, {
      links: filled,
      ...(subject ? { subject_link: subject } : {}),
    });
    if (!added) {
      failCurrentStep();
      return;
    }
    completeCurrentStep();
    const analysis = await runAnalysis(currentSessionId);
    completeCurrentStep();
    if (!analysis) {
      failCurrentStep();
      return;
    }
    const text = analysis.content ?? analysis.markdown ?? "";
    setContent(
      text || "# Session result\n\nAnalysis complete. No content returned.",
      analysis.analysisData,
    );
    const session = sessions.find((s) => s.id === currentSessionId);
    if (session && isDefaultSessionName(session.name)) {
      const suggested = deriveTitleFromContent(text);
      if (suggested) void updateSession(currentSessionId, { name: suggested });
    }
  }, [
    sourceLinks,
    subjectLink,
    currentSessionId,
    sessions,
    startSteps,
    setContent,
    completeCurrentStep,
    failCurrentStep,
    addSources,
    runAnalysis,
    updateSession,
  ]);

  const handleOpenTitleDialog = useCallback(() => {
    setFormError(null);
    const filled = sourceLinks.map((s) => s.trim()).filter(Boolean);
    const subject = subjectLink.trim();
    if (filled.length === 0) {
      setFormError("Add at least one source link.");
      return;
    }
    if (filled.length > MAX_SOURCE_LINKS) {
      setFormError(`Maximum ${MAX_SOURCE_LINKS} source links.`);
      return;
    }
    if (subject && !isValidURL(subject)) {
      setFormError("Subject link must be a valid URL.");
      return;
    }
    if (filled.some((u) => !isValidURL(u))) {
      setFormError("All source links must be valid URLs.");
      return;
    }
    if (hasExistingSession && currentSessionId) {
      runWithExistingSession();
      return;
    }
    setPendingFilled(filled);
    setPendingSubject(subject);
    setSessionTitleInput("");
    setTitleDialogOpen(true);
  }, [sourceLinks, subjectLink, hasExistingSession, currentSessionId, runWithExistingSession]);

  const systemName = pendingSubject
    ? `Session: ${new URL(pendingSubject).hostname}`
    : "New session";

  const handleUseTitle = useCallback(() => {
    setTitleDialogOpen(false);
    const name = sessionTitleInput.trim() || systemName;
    runWithName(name);
  }, [sessionTitleInput, systemName, runWithName]);

  const handleSystemDecide = useCallback(() => {
    setTitleDialogOpen(false);
    runWithName(systemName);
  }, [systemName, runWithName]);

  const handleRetry = useCallback(async () => {
    if (!currentSessionId) return;
    startSteps(PROCESS_STEP_LABELS);
    completeCurrentStep();

    const analysis = await runAnalysis(currentSessionId);
    if (!analysis) {
      failCurrentStep();
      return;
    }
    completeCurrentStep();

    const text = analysis.content ?? analysis.markdown ?? "";
    setContent(
      text || "# Session result\n\nAnalysis complete. No content returned.",
      analysis.analysisData,
    );
    completeCurrentStep();
    const session = sessions.find((s) => s.id === currentSessionId);
    if (session && isDefaultSessionName(session.name)) {
      const suggested = deriveTitleFromContent(text);
      if (suggested) void updateSession(currentSessionId, { name: suggested });
    }
  }, [
    currentSessionId,
    sessions,
    startSteps,
    completeCurrentStep,
    failCurrentStep,
    runAnalysis,
    setContent,
    updateSession,
  ]);

  const handleStartOver = useCallback(() => {
    resetToForm();
  }, [resetToForm]);

  const setSourceAt = (index: number, value: string) => {
    setSourceLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const isNewState = status === "idle" || (status === "loading" && steps.length === 0);
  // const isProcessing = status === "processing" || (status === "loading" && steps.length > 0);
  const isReady = status === "ready";
  const isFailed = status === "error";

  const analysingStepId = steps.find((s) => s.label === "Analysing")?.id ?? "";

  useEffect(() => {
    setSourcesCache(null);
    setOpenSteps([]);
  }, [currentSessionId]);

  useEffect(() => {
    if (!currentSessionId) return;
    if (openSteps.includes(analysingStepId) && sourcesCache === null && !sourcesLoading) {
      setSourcesLoading(true);
      listSources(currentSessionId).then((data) => {
        setSourcesCache(Array.isArray(data) ? (data as SourceItem[]) : []);
        setSourcesLoading(false);
      });
    }
  }, [currentSessionId, openSteps, analysingStepId, sourcesCache, sourcesLoading, listSources]);

  const stepsBlock =
    steps.length > 0 ? (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isReady ? "Completed" : "Processing…"}
        </p>
        <Accordion
          type="multiple"
          value={openSteps}
          onValueChange={setOpenSteps}
          className="rounded-lg border border-border bg-muted/40 dark:bg-muted/20 overflow-hidden"
        >
          {steps.map((step) => (
            <AccordionItem key={step.id} value={step.id} className="border-b border-border/80 last:border-b-0">
              <AccordionTrigger
                className={cn(
                  "px-4 py-3 hover:no-underline bg-transparent data-[state=open]:bg-muted/50 dark:data-[state=open]:bg-muted/30",
                  step.status === "in_progress" && "bg-muted/60 dark:bg-muted/40"
                )}
              >
                <span className="flex items-center gap-3 flex-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.status === "complete" && "text-teal-600 dark:text-teal-400",
                      step.status === "in_progress" && "text-amber-600 dark:text-amber-400",
                      step.status === "failed" && "text-destructive",
                      step.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.status === "in_progress" ? `${step.label}…` : step.label}
                    {step.status === "complete" ? " complete" : ""}
                    {step.status === "failed" ? " failed" : ""}
                  </span>
                  {step.status === "in_progress" && (
                    <Loader2 className="size-5 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                  )}
                  {step.status === "complete" && (
                    <CheckCircle className="size-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  )}
                  {step.status === "failed" && (
                    <XCircle className="size-5 shrink-0 text-destructive" />
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                {step.label === "Scraping" && (
                  <p className="text-sm text-muted-foreground">Sources added to the session.</p>
                )}
                {step.label === "Analysing" && (
                  <div className="space-y-3">
                    {sourcesLoading && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Loading links…
                      </p>
                    )}
                    {!sourcesLoading && sourcesCache !== null && (
                      <>
                        {sourcesCache.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No sources for this session.</p>
                        ) : (
                          <>
                            {(() => {
                              const subjectSources = sourcesCache.filter((s) => s.type === "subject");
                              const winningSources = sourcesCache.filter((s) => s.type === "winner");
                              const otherSources = sourcesCache.filter(
                                (s) => s.type !== "subject" && s.type !== "winner"
                              );
                              const linkEl = (src: SourceItem) => (
                                <a
                                  key={src.id}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80 break-all text-sm"
                                >
                                  {src.url}
                                </a>
                              );
                              return (
                                <div className="space-y-3 text-muted-foreground">
                                  {subjectSources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-1.5">Subject link</p>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {subjectSources.map((src) => (
                                          <li key={src.id}>{linkEl(src)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {winningSources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-1.5">Winning links</p>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {winningSources.map((src) => (
                                          <li key={src.id}>{linkEl(src)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {otherSources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground/80 mb-1.5">Other sources</p>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {otherSources.map((src) => (
                                          <li key={src.id}>{linkEl(src)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
                {step.label === "Rendering" && currentSessionId && (
                  <ChunkGrid sessionId={currentSessionId} />
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    ) : null;

  return (
    <div className="min-w-0 w-full space-y-6">
      <div className="w-full flex">
        {isNewState && (
          <div className="w-full max-w-4xl flex flex-col space-y-4 mx-auto">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create session</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add up to {MAX_SOURCE_LINKS} source links and one subject link (optional), then start.
              </p>
            </div>

            <section className="w-full flex items-start flex-col md:flex-row gap-4">
              <div className="w-full space-y-2">
                <Label>Subject link (1)</Label>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={subjectLink}
                  onChange={(e) => setSubjectLink(e.target.value)}
                  className={!subjectOk ? "border-destructive" : undefined}
                />
              </div>

              <div className="w-full space-y-2">
                <Label>Source links (up to {MAX_SOURCE_LINKS})</Label>
                <div className="space-y-2">
                  {sourceLinks.map((value, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="url"
                        placeholder={`Source ${i + 1}`}
                        value={value}
                        onChange={(e) => setSourceAt(i, e.target.value)}
                        className="flex-1"
                      />
                      {i === sourceLinks.length - 1 && sourceLinks.length < MAX_SOURCE_LINKS && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSourceLinks((s) => [...s, ""])}
                          aria-label="Add source link"
                        >
                          <Plus className="size-4" />
                        </Button>
                      )}
                      {sourceLinks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSourceLinks((s) => s.filter((_, j) => j !== i))}
                          aria-label="Remove source link"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(formError || isFailed) && (
                <p className="text-sm text-destructive">{formError ?? error}</p>
              )}
            </section>

            <Button onClick={handleOpenTitleDialog} disabled={!canSubmit} className="w-max self-end">
              Start session
            </Button>
          </div>
        )}
      </div>

      <Dialog open={titleDialogOpen} onOpenChange={setTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name your session</DialogTitle>
            <DialogDescription>
              Give your session a title, or let the system choose one for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="session-title">Session title (optional)</Label>
            <Input
              id="session-title"
              placeholder={systemName}
              value={sessionTitleInput}
              onChange={(e) => setSessionTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUseTitle()}
            />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={handleSystemDecide}>
              Let system decide
            </Button>
            <Button onClick={handleUseTitle}>
              Use this title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {stepsBlock}

      {isReady && content && (
        <div className="min-w-0 w-full space-y-2">
          <p className="text-sm font-medium text-foreground">Result</p>
          <SessionRenderedContent content={content} />
        </div>
      )}

      {isFailed && steps.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex gap-2 shrink-0">
            {currentSessionId &&
              steps.some(
                (s) => s.label === "Scraping" && s.status === "complete"
              ) && (
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Retry
                </Button>
              )}
            <Button variant="ghost" size="sm" onClick={handleStartOver}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {currentSessionId && <div className="h-16" aria-hidden />}
    </div>
  );
}
