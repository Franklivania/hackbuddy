import { useState, useEffect } from "react";
import type { Chunk } from "@/types/chunks";
import { useSessionManagerStore } from "@/lib/stores/session-manager";
import { Loader2 } from "lucide-react";
import { ChunkCard } from "./chunk-card";
import { ChunkDetailDialog } from "./chunk-detail-dialog";

interface ChunkGridProps {
  sessionId: string;
}

export function ChunkGrid({ sessionId }: ChunkGridProps) {
  const chunks = useSessionManagerStore((s) => s.chunksCache[sessionId]);
  const isFetching = useSessionManagerStore((s) => s.chunksFetchingIds.includes(sessionId));
  const fetchChunks = useSessionManagerStore((s) => s.fetchChunks);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);

  useEffect(() => {
    if (chunks === undefined && !isFetching) {
      fetchChunks(sessionId);
    }
  }, [sessionId, chunks, isFetching, fetchChunks]);

  if (chunks === undefined) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin" /> Loading chunks…
      </p>
    );
  }

  if (chunks.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No chunks for this session.</p>;
  }

  const subjects = chunks.filter((c) => c.source_type === "subject");
  const winners = chunks.filter((c) => c.source_type === "winner");
  const others = chunks.filter((c) => c.source_type !== "subject" && c.source_type !== "winner");

  return (
    <>
      <div className="space-y-4">
        {subjects.length > 0 && (
          <Section label="Subject">
            <CardTiles chunks={subjects} onSelect={setSelectedChunk} />
          </Section>
        )}
        {winners.length > 0 && (
          <Section label={`Winners (${winners.length})`}>
            <CardTiles chunks={winners} onSelect={setSelectedChunk} />
          </Section>
        )}
        {others.length > 0 && (
          <Section label="Other">
            <CardTiles chunks={others} onSelect={setSelectedChunk} />
          </Section>
        )}
      </div>

      <ChunkDetailDialog
        chunk={selectedChunk}
        open={selectedChunk !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedChunk(null);
        }}
      />
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-foreground/80 mb-2">{label}</p>
      {children}
    </div>
  );
}

function CardTiles({
  chunks,
  onSelect,
}: {
  chunks: Chunk[];
  onSelect: (c: Chunk) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {chunks.map((chunk) => (
        <ChunkCard key={chunk.id} chunk={chunk} onClick={() => onSelect(chunk)} />
      ))}
    </div>
  );
}
