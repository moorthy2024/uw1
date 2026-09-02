"use client";
import { useState, useEffect } from "react";
import type { CatalogField } from "./types";

/**
 * Streams extraction fields progressively. In production, connects to an SSE endpoint
 * so the UI populates as the AI extracts each field — no waiting for all 100+ fields.
 *
 * TODO: Replace mock interval with real SSE when backend is ready:
 *   const source = new EventSource(`/api/submissions/${submissionId}/fields/stream`);
 *   source.onmessage = (e) => setStreamedFields(prev => [...prev, JSON.parse(e.data)]);
 *   source.addEventListener("done", () => { setIsStreaming(false); source.close(); });
 *   return () => source.close();
 */
export function useFieldStream(
  submissionId: string | undefined,
  mockFields: CatalogField[] | null,
) {
  const [streamedFields, setStreamedFields] = useState<CatalogField[]>(mockFields ?? []);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!submissionId || !mockFields?.length) return;

    setStreamedFields([]);
    setIsStreaming(true);

    // Mock: emit 15 fields every 60ms to simulate AI streaming extraction
    const BATCH = 15;
    let i = 0;
    const id = setInterval(() => {
      const batch = mockFields.slice(i, i + BATCH);
      setStreamedFields(prev => [...prev, ...batch]);
      i += BATCH;
      if (i >= mockFields.length) { clearInterval(id); setIsStreaming(false); }
    }, 60);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]); // mockFields intentionally excluded — re-stream on submission change only

  return { streamedFields, isStreaming };
}
