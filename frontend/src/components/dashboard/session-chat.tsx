import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSessionManagerStore } from "@/lib/stores/session-manager";
import { parseMarkdown } from "@/lib/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 dark:bg-muted/40",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {parseMarkdown(message.content).map((node, i) =>
              node != null ? (
                <React.Fragment key={i}>{node}</React.Fragment>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionChatProps {
  sessionId: string;
  enabled: boolean;
}

export function SessionChat({ sessionId, enabled }: SessionChatProps) {
  const chatMessages = useSessionManagerStore((s) => s.chatMessages ?? []);
  const isSendingChat = useSessionManagerStore((s) => s.isSendingChat ?? false);
  const chatError = useSessionManagerStore((s) => s.chatError ?? null);
  const sendChatMessage = useSessionManagerStore((s) => s.sendChatMessage);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Only open when user clicks the button; close when session changes or chat becomes disabled
  useEffect(() => {
    setIsOpen(false);
  }, [sessionId]);

  useEffect(() => {
    if (!enabled) setIsOpen(false);
  }, [enabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, isSendingChat]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSendingChat) return;
    setInput("");
    await sendChatMessage(sessionId, trimmed);
  }, [input, isSendingChat, sessionId, sendChatMessage]);

  return (
    <>
      {/* FAB trigger — bottom-right of the content area */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={!enabled}
        aria-label={enabled ? "Open strategy chat" : "Strategy chat available after initial review"}
        className={cn(
          "fixed bottom-32 left-1/2 translate-x-[30em] z-50",
          "w-6 h-6 size-12 rounded-full shadow-lg flex items-center justify-center",
          "bg-primary text-primary-foreground",
          "transition-all duration-200",
          isOpen && "pointer-events-none scale-0 opacity-0",
          !isOpen && "scale-100 opacity-100",
          !enabled && "opacity-40 cursor-not-allowed",
        )}
      >
        <MessageSquare className="size-5" />
      </button>

      {/* Panel only in DOM when open — prevents layout shift when closed */}
      {isOpen && (
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20",
          "h-[65%] max-h-[600px]",
          "border-t border-border rounded-t-xl",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.08)] bg-background flex flex-col overflow-hidden",
          "animate-in slide-in-from-bottom-4 duration-300 ease-out",
        )}
        aria-hidden={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              Strategy Chat
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Flesh out ideas and refine your strategy
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 size-8"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {chatMessages.length === 0 && !isSendingChat && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Ask anything to flesh out your hackathon strategy.
              </p>
            )}
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isSendingChat && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Error */}
        {chatError && (
          <p className="px-4 md:px-6 pb-2 text-xs text-destructive max-w-3xl mx-auto w-full">
            {chatError}
          </p>
        )}

        {/* Input */}
        <div className="border-t border-border px-4 md:px-6 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your strategy…"
              disabled={isSendingChat}
              rows={1}
              className="min-h-10 max-h-28 resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSendingChat}
              size="icon"
              className="shrink-0"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
