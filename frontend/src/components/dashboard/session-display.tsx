import { useState, useCallback } from "react";
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
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import SessionRenderedContent from "./session-rendered-content";

const MAX_SOURCE_LINKS = 5;
const PROCESS_STEP_LABELS = ["Scraping", "Analysing", "Rendering"];

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
    addSources,
    runAnalysis,
  } = useSessionManagerStore();

  const hasExistingSession = Boolean(currentSessionId && sessions.some((s) => s.id === currentSessionId));

  const [sourceLinks, setSourceLinks] = useState<string[]>(["", "", "", "", ""]);
  const [subjectLink, setSubjectLink] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [pendingFilled, setPendingFilled] = useState<string[]>([]);
  const [pendingSubject, setPendingSubject] = useState("");

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
      const text = analysis?.content ?? analysis?.markdown ?? "";
      setContent(text || "# Session result\n\nAnalysis complete. No content returned.");
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
    const text = analysis?.content ?? analysis?.markdown ?? "";
    setContent(text || "# Session result\n\nAnalysis complete. No content returned.");
  }, [
    sourceLinks,
    subjectLink,
    currentSessionId,
    startSteps,
    setContent,
    completeCurrentStep,
    failCurrentStep,
    addSources,
    runAnalysis,
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

  const setSourceAt = (index: number, value: string) => {
    setSourceLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const isNewState = status === "idle" || (status === "loading" && steps.length === 0);
  const isProcessing = status === "processing" || (status === "loading" && steps.length > 0);
  const isReady = status === "ready";
  const isFailed = status === "error";

  const stepsBlock =
    steps.length > 0 ? (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isReady ? "Completed" : "Processing…"}
        </p>
        <div className="space-y-0 rounded-lg border border-border bg-card overflow-hidden">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0",
                step.status === "in_progress" && "bg-muted/50"
              )}
            >
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
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      {isNewState && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create session</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add up to {MAX_SOURCE_LINKS} source links and one subject link (optional), then start.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Subject link (1)</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={subjectLink}
              onChange={(e) => setSubjectLink(e.target.value)}
              className={!subjectOk ? "border-destructive" : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label>Source links (up to {MAX_SOURCE_LINKS})</Label>
            {sourceLinks.map((value, i) => (
              <Input
                key={i}
                type="url"
                placeholder={`Source ${i + 1} (optional)`}
                value={value}
                onChange={(e) => setSourceAt(i, e.target.value)}
              />
            ))}
          </div>

          {(formError || isFailed) && (
            <p className="text-sm text-destructive">{formError ?? error}</p>
          )}

          <Button onClick={handleOpenTitleDialog} disabled={!canSubmit}>
            Start session
          </Button>
        </div>
      )}

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
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Result</p>
          <SessionRenderedContent content={content} />
        </div>
      )}

      {isFailed && steps.length > 0 && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
