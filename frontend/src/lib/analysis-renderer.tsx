import React from "react";
import { parseInlineMarkdown } from "./markdown-renderer";
import { cn } from "./utils";

type AnyRecord = Record<string, unknown>;

const TITLE_KEYS = ["project_name", "name", "title", "label"] as const;

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPrimitive(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function empty(v: unknown): boolean {
  if (v == null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function findTitle(obj: AnyRecord): string | null {
  for (const k of TITLE_KEYS) {
    if (typeof obj[k] === "string" && obj[k]) return obj[k] as string;
  }
  return null;
}

function without(obj: AnyRecord, keys: readonly string[]): AnyRecord {
  const out: AnyRecord = {};
  for (const k in obj) if (!keys.includes(k)) out[k] = obj[k];
  return out;
}

function isCompact(obj: AnyRecord): boolean {
  const entries = Object.entries(obj).filter(([, v]) => !empty(v));
  return entries.length <= 3 && entries.every(([, v]) => isPrimitive(v));
}

// ---- Leaf Renderers ----

function Inline({ text, k }: { text: string; k: string }) {
  return <>{parseInlineMarkdown(text, k)}</>;
}

function Primitive({ value, k }: { value: string | number | boolean; k: string }) {
  return typeof value === "string" ? <Inline text={value} k={k} /> : <>{String(value)}</>;
}

// ---- Structural Renderers ----

function PrimitiveList({ items, kp }: { items: (string | number | boolean)[]; kp: string }) {
  return (
    <ul className="space-y-1 ml-4 list-disc list-outside">
      {items.map((item, i) => (
        <li key={i} className="leading-relaxed">
          <Primitive value={item} k={`${kp}-${i}`} />
        </li>
      ))}
    </ul>
  );
}

function CompactList({ items, kp }: { items: AnyRecord[]; kp: string }) {
  return (
    <ul className="space-y-1 ml-4 list-disc list-outside">
      {items.map((item, i) => {
        const title = findTitle(item);
        const rest = title ? without(item, TITLE_KEYS) : item;
        const vals = Object.entries(rest)
          .filter(([, v]) => !empty(v))
          .map(([, v]) => String(v));
        const text = title
          ? `${title}${vals.length ? ` — ${vals.join(", ")}` : ""}`
          : vals.join(" · ");
        return (
          <li key={i} className="leading-relaxed">
            <Inline text={text} k={`${kp}-${i}`} />
          </li>
        );
      })}
    </ul>
  );
}

function Card({ obj, kp, depth }: { obj: AnyRecord; kp: string; depth: number }) {
  const title = findTitle(obj);
  const body = title ? without(obj, TITLE_KEYS) : obj;
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      {title && <h4 className="font-semibold text-foreground">{title}</h4>}
      <Fields obj={body} kp={kp} depth={depth} />
    </div>
  );
}

function Value({ value, kp, depth }: { value: unknown; kp: string; depth: number }) {
  if (empty(value)) return null;

  if (isPrimitive(value)) {
    return (
      <p className="leading-relaxed text-foreground/90">
        <Primitive value={value} k={kp} />
      </p>
    );
  }

  if (Array.isArray(value)) {
    if (value.every(isPrimitive)) {
      return <PrimitiveList items={value as (string | number | boolean)[]} kp={kp} />;
    }
    const allCompact = value.every(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v) && isCompact(v as AnyRecord)
    );
    if (allCompact) {
      return <CompactList items={value as AnyRecord[]} kp={kp} />;
    }
    return (
      <div className="space-y-3">
        {value.map((item, i) =>
          typeof item === "object" && item !== null ? (
            <Card key={i} obj={item as AnyRecord} kp={`${kp}-${i}`} depth={depth + 1} />
          ) : (
            <p key={i} className="text-foreground/90">{String(item)}</p>
          )
        )}
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    return <Fields obj={value as AnyRecord} kp={kp} depth={depth + 1} />;
  }

  return <>{String(value)}</>;
}

function Fields({ obj, kp, depth }: { obj: AnyRecord; kp: string; depth: number }) {
  const entries = Object.entries(obj).filter(([, v]) => !empty(v));
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const label = humanize(key);
        const childKp = `${kp}-${key}`;

        if (isPrimitive(value)) {
          return (
            <div key={key}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
              <p className="mt-0.5 leading-relaxed text-foreground/90">
                <Primitive value={value} k={childKp} />
              </p>
            </div>
          );
        }

        return (
          <div key={key}>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
            <div className="mt-1">
              <Value value={value} kp={childKp} depth={depth} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Public Component ----

interface AnalysisRendererProps {
  data: AnyRecord;
  className?: string;
}

export function AnalysisRenderer({ data, className }: AnalysisRendererProps) {
  const entries = Object.entries(data).filter(([, v]) => !empty(v));

  return (
    <div className={cn("space-y-8", className)}>
      {entries.map(([key, value]) => (
        <section key={key}>
          <h3 className="text-base font-semibold mb-3 pb-2 border-b border-border/60">
            {humanize(key)}
          </h3>
          <Value value={value} kp={key} depth={0} />
        </section>
      ))}
    </div>
  );
}
