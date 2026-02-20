import { useState, useRef } from "react";
import Image from "@/components/ui/image";
import { Link, useLocation, useNavigate } from "react-router";
import { useSessionManagerStore } from "@/lib/stores/session-manager";
import type { Session } from "@/types/sessions";
import { cn } from "@/lib/utils";
import { Check, LayoutList, Plus, Trash2, X } from "lucide-react";
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

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionIdFromUrl = new URLSearchParams(location.search ?? "").get("session");
  const { sessions, currentSessionId, setCurrentSessionId, deleteSession, createSession, updateSession } =
    useSessionManagerStore();
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });

  const handleSessionRowClick = (session: Session) => {
    const now = Date.now();
    const isDouble = lastClickRef.current.id === session.id && now - lastClickRef.current.time < 400;
    if (isDouble) {
      lastClickRef.current = { id: "", time: 0 };
      setEditingSessionId(session.id);
      setEditingName(session.name);
      return;
    }
    lastClickRef.current = { id: session.id, time: now };
    setCurrentSessionId(session.id);
    navigate(`/dashboard?session=${session.id}`);
  };

  return (
    <aside className="hidden w-64 h-full shrink-0 border-r border-border bg-muted/30 md:flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 h-14">
        <Link to="/" className="font-semibold text-foreground hover:underline flex items-center gap-2 flex-1 min-w-0">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Image src="/android-chrome-512x512.png" alt="HackBuddy" width={0} height={0} className="w-full h-full" />
          </div>
          HackBuddy
        </Link>
      </div>
      <div className="p-2 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
          onClick={() => {
            setNewSessionTitle("");
            setCreateDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New session
        </Button>
      </div>
      {sessions.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sessions
          </p>
          <nav className="space-y-0.5">
            {sessions.map((session) => {
              const href = `/dashboard?session=${session.id}`;
              const isActive =
                currentSessionId === session.id || (sessionIdFromUrl === session.id && !currentSessionId);
              const isEditing = editingSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md text-sm transition-colors",
                    isActive && !isEditing
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1.5">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (editingName.trim() && !isSavingName) {
                              setIsSavingName(true);
                              updateSession(session.id, { name: editingName.trim() }).then(() => {
                                setIsSavingName(false);
                                setEditingSessionId(null);
                                setEditingName("");
                              });
                            }
                          }
                          if (e.key === "Escape") {
                            setEditingSessionId(null);
                            setEditingName("");
                          }
                        }}
                        className="h-8 text-sm flex-1 min-w-0"
                        autoFocus
                        disabled={isSavingName}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Save name"
                        disabled={isSavingName || !editingName.trim()}
                        onClick={() => {
                          if (!editingName.trim() || isSavingName) return;
                          setIsSavingName(true);
                          updateSession(session.id, { name: editingName.trim() }).then(() => {
                            setIsSavingName(false);
                            setEditingSessionId(null);
                            setEditingName("");
                          });
                        }}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Cancel edit"
                        disabled={isSavingName}
                        onClick={() => {
                          setEditingSessionId(null);
                          setEditingName("");
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSessionRowClick(session)}
                        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left w-full bg-transparent border-none cursor-pointer rounded-md"
                      >
                        <LayoutList className="size-4 shrink-0" />
                        <span className="truncate">{session.name}</span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 opacity-0 group-hover:opacity-100 mr-1"
                        aria-label={`Delete ${session.name}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name your session</DialogTitle>
            <DialogDescription>
              Give your session a title, or let the system choose one for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sidebar-session-title">Session title (optional)</Label>
            <Input
              id="sidebar-session-title"
              placeholder="New session"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const name = newSessionTitle.trim() || "New session";
                  if (!isCreating) {
                    setIsCreating(true);
                    createSession({ name }).then((session) => {
                      setIsCreating(false);
                      setCreateDialogOpen(false);
                      if (session) navigate(`/dashboard?session=${session.id}`);
                    });
                  }
                }
              }}
            />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => {
                if (isCreating) return;
                setIsCreating(true);
                createSession({ name: "New session" }).then((session) => {
                  setIsCreating(false);
                  setCreateDialogOpen(false);
                  if (session) navigate(`/dashboard?session=${session.id}`);
                });
              }}
              disabled={isCreating}
            >
              Let system decide
            </Button>
            <Button
              disabled={isCreating}
              onClick={() => {
                if (isCreating) return;
                const name = newSessionTitle.trim() || "New session";
                setIsCreating(true);
                createSession({ name }).then((session) => {
                  setIsCreating(false);
                  setCreateDialogOpen(false);
                  if (session) navigate(`/dashboard?session=${session.id}`);
                });
              }}
            >
              {isCreating ? "Creating…" : "Use this title"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {sessionToDelete && (
            <p className="text-sm text-foreground font-medium truncate">{sessionToDelete.name}</p>
          )}
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!sessionToDelete) return;
                setIsDeleting(true);
                const deleted = await deleteSession(sessionToDelete.id);
                setIsDeleting(false);
                setSessionToDelete(null);
                if (deleted && (currentSessionId === sessionToDelete.id || sessionIdFromUrl === sessionToDelete.id)) {
                  navigate("/dashboard", { replace: true });
                }
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
