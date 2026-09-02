"use client";
import { useState, useEffect, useRef } from "react";
import type { PdfPage } from "./types";

// Module-level cache — persists across re-renders, cleared on page reload
const _cache = new Map<string, PdfPage | null>();

/**
 * Loads a document page on demand. Caches results so repeated citation clicks
 * on the same document are instant.
 *
 * TODO: Replace mockLoader with real fetch when backend is ready:
 *   fetch(`/api/submissions/${submissionId}/documents/${encodeURIComponent(doc)}/pages/${page}`)
 *     .then(r => r.json())
 *     .then(data => { _cache.set(key, data); setResult(data); setIsLoading(false); })
 */
export function useDocumentPage(
  submissionId: string | undefined,
  doc: string | null,
  mockLoader: (() => Record<string, PdfPage>) | null,
) {
  const key = `${submissionId ?? ""}:${doc ?? ""}`;
  const [result, setResult] = useState<PdfPage | null>(() => _cache.get(key) ?? null);
  const [isLoading, setIsLoading] = useState(!!doc && !_cache.has(key));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!doc || !submissionId) { setResult(null); setIsLoading(false); return; }
    if (_cache.has(key)) { setResult(_cache.get(key)!); setIsLoading(false); return; }

    setIsLoading(true);
    // Simulate 120ms network latency for mock; replace with real fetch above
    timerRef.current = setTimeout(() => {
      const pages = mockLoader?.() ?? {};
      const p = pages[doc] ?? null;
      _cache.set(key, p);
      setResult(p);
      setIsLoading(false);
    }, 120);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, doc, submissionId]); // mockLoader intentionally excluded — changes every render

  return { docPage: result, docLoading: isLoading };
}
