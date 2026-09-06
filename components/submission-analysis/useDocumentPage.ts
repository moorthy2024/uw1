"use client";
import { useState, useEffect, useRef } from "react";
import type { PdfPage, DocType } from "./types";

// Module-level cache — persists across re-renders, cleared on page reload
const _cache = new Map<string, PdfPage | null>();

// Local /public paths are served by Next.js directly — no proxy needed.
// External blob-storage URLs go through /api/doc to avoid CORS.
function proxyUrl(raw: string) {
  if (raw.startsWith("/") || raw.startsWith("./")) return raw;
  return `/api/doc?url=${encodeURIComponent(raw)}`;
}

// ─── PDF via pdfjs-dist ────────────────────────────────────────────────────
async function buildPdfPage(url: string): Promise<PdfPage> {
  // Dynamic import keeps pdfjs out of the server bundle
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ url: proxyUrl(url) }).promise;
  const firstPage = await pdf.getPage(1);
  const baseVp = firstPage.getViewport({ scale: 1 });

  // Shared across all renderCanvas calls for this PDF document.
  // pdfjs throws if render() is called while a previous render is still active
  // on the same canvas (happens in React StrictMode and on rapid prop changes).
  let pendingRenderTask: { cancel(): void; promise: Promise<void> } | null = null;

  return {
    title: "",
    pageCount: pdf.numPages,
    pageWidth: baseVp.width,
    pageHeight: baseVp.height,
    content: () => null,

    renderCanvas: async (ctx, w, _h, pageNum = 1) => {
      // Clamp to valid range — guards against stale pageNum from a previous citation
      const safePageNum = Math.max(1, Math.min(pageNum, pdf.numPages));
      const p = await pdf.getPage(safePageNum);
      const vp = p.getViewport({ scale: w / baseVp.width });

      // Cancel any in-flight render before starting a new one.
      // Must happen AFTER getPage() (both calls resolve via microtask queue)
      // but BEFORE p.render() so pdfjs never sees two concurrent operations
      // on the same canvas element.
      if (pendingRenderTask) {
        const prev = pendingRenderTask;
        pendingRenderTask = null;
        try { prev.cancel(); } catch {}
        await prev.promise.catch(() => {}); // wait for pdfjs to fully stop
      }

      ctx.canvas.width  = vp.width;
      ctx.canvas.height = vp.height;

      // pdfjs v4+ requires canvas element reference
      const task = p.render({ canvasContext: ctx, viewport: vp, canvas: ctx.canvas });
      pendingRenderTask = task;

      try {
        await task.promise;
      } catch {
        // RenderingCancelledException — expected when a newer render supersedes this one
      } finally {
        if (pendingRenderTask === task) pendingRenderTask = null;
      }
    },

    // Locate text in the real PDF page and return canvas-space coordinates.
    // Handles multi-line / multi-run text splits (very common in real PDFs).
    findTextBbox: async (searchText: string, pageNum = 1) => {
      try {
        const safePageNum = Math.max(1, Math.min(pageNum, pdf.numPages));
        const p = await pdf.getPage(safePageNum);
        const vp = p.getViewport({ scale: 1 });
        const content = await p.getTextContent();

        // Normalise search: collapse whitespace, trim, lowercase.
        const search = searchText.replace(/\s+/g, " ").trim().toLowerCase();
        if (!search) return null;

        type TItem = { str: string; transform: number[]; width: number; height: number };
        const allItems = content.items.filter(item => "str" in item) as TItem[];
        // Keep only items with non-whitespace content after trim.
        const items = allItems.filter(it => it.str.trim().length > 0);

        console.log("[findTextBbox] page", pageNum, "items:", items.length, "search:", search);

        // Pass 1 — single item already contains the full search string.
        for (const item of items) {
          if (item.str.replace(/\s+/g, " ").trim().toLowerCase().includes(search)) {
            const b = itemToBbox(item, vp);
            console.log("[findTextBbox] pass1 match:", item.str, "bbox:", b);
            return b;
          }
        }

        // Pass 2 — text is split across consecutive items.
        // IMPORTANT: normalise each item string BEFORE building concat so that
        // parts.start/end positions map directly to the normalised concat string.
        // (Raw items may have trailing/leading spaces causing position drift.)
        type Part = { start: number; end: number; item: TItem };
        const parts: Part[] = [];
        let concat = "";
        for (const item of items) {
          const normStr = item.str.replace(/\s+/g, " ").trim();
          if (!normStr) continue;
          const sep   = concat.length > 0 ? " " : "";
          const start = concat.length + sep.length;
          concat += sep + normStr;
          parts.push({ start, end: concat.length, item });
        }

        // concat is already normalised (single spaces, trimmed tokens); just lowercase.
        const normConcat = concat.toLowerCase();
        const matchStart = normConcat.indexOf(search);

        console.log("[findTextBbox] pass2 concat (first 200):", normConcat.slice(0, 200));
        console.log("[findTextBbox] pass2 matchStart:", matchStart);

        if (matchStart !== -1) {
          const matchEnd = matchStart + search.length;
          const spanning = parts.filter(pt => pt.end > matchStart && pt.start < matchEnd);
          if (spanning.length > 0) {
            let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
            for (const { item } of spanning) {
              const b = itemToBbox(item, vp);
              if (b.x1 < x1) x1 = b.x1;
              if (b.y1 < y1) y1 = b.y1;
              if (b.x2 > x2) x2 = b.x2;
              if (b.y2 > y2) y2 = b.y2;
            }
            const result = { x1, y1, x2, y2 };
            console.log("[findTextBbox] pass2 match spanning", spanning.length, "items, bbox:", result);
            return result;
          }
        }

        // Pass 3 — keyword anchor fallback for very short or fragmented values.
        const keywords = search.split(/\s+/).filter(w => w.length >= 2);
        if (keywords.length === 0) return null;

        let bestScore = 0;
        let anchorIdx = -1;
        for (let i = 0; i < items.length; i++) {
          const t = items[i].str.toLowerCase();
          const score = keywords.reduce((n, kw) => n + (t.includes(kw) ? 1 : 0), 0);
          if (score > bestScore) { bestScore = score; anchorIdx = i; }
        }
        console.log("[findTextBbox] pass3 anchor:", anchorIdx, "score:", bestScore);
        if (anchorIdx === -1 || bestScore === 0) return null;

        const win = items.slice(Math.max(0, anchorIdx - 1), anchorIdx + 4);
        const matched = win.filter(it =>
          keywords.some(kw => it.str.toLowerCase().includes(kw))
        );
        if (matched.length === 0) return null;

        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const item of matched) {
          const b = itemToBbox(item, vp);
          if (b.x1 < x1) x1 = b.x1;
          if (b.y1 < y1) y1 = b.y1;
          if (b.x2 > x2) x2 = b.x2;
          if (b.y2 > y2) y2 = b.y2;
        }
        const result = { x1, y1, x2, y2 };
        console.log("[findTextBbox] pass3 match", matched.length, "items, bbox:", result);
        return result;

      } catch (err) {
        console.error("[findTextBbox] error:", err);
        return null;
      }
    },
  };
}

// Convert a pdfjs TextItem (PDF coordinate space) to canvas bbox (screen/viewport space).
// convertToViewportPoint is typed as number[] in pdfjs-dist, so we index explicitly.
function itemToBbox(
  item: { transform: number[]; width: number; height: number },
  vp: { convertToViewportPoint: (x: number, y: number) => number[] },
) {
  const [, , , , pdfX, pdfY] = item.transform;
  const h = item.height || 12; // fallback if height is 0
  // pdfjs convertToViewportPoint handles the PDF→screen Y-flip
  const p1 = vp.convertToViewportPoint(pdfX, pdfY);
  const p2 = vp.convertToViewportPoint(pdfX + item.width, pdfY + h);
  const vx1 = p1[0], vy1 = p1[1];
  const vx2 = p2[0], vy2 = p2[1];
  return {
    x1: Math.min(vx1, vx2) - 4,
    y1: Math.min(vy1, vy2) - 4,
    x2: Math.max(vx1, vx2) + 4,
    y2: Math.max(vy1, vy2) + 4,
  };
}

// ─── Image (JPG / PNG / WEBP) ─────────────────────────────────────────────
function buildImagePage(url: string): Promise<PdfPage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () =>
      resolve({
        title: "",
        pageCount: 1,
        pageWidth: img.naturalWidth,
        pageHeight: img.naturalHeight,
        content: () => null,
        renderCanvas: (ctx, w, h) => {
          ctx.canvas.width  = w;
          ctx.canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
        },
      });
    img.onerror = reject;
    img.src = proxyUrl(url);
  });
}

// ─── Excel (XLSX) via SheetJS ─────────────────────────────────────────────
async function buildXlsxPage(url: string): Promise<PdfPage> {
  const XLSX = await import("xlsx");
  const res  = await fetch(proxyUrl(url));
  const buf  = await res.arrayBuffer();
  const wb   = XLSX.read(buf, { type: "array" });

  // Pre-build HTML per sheet — keyed by sheet name
  const sheetHtml: Record<string, string> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    sheetHtml[name] = XLSX.utils.sheet_to_html(ws, { header: "", footer: "" });
  }

  return {
    title: "",
    pageCount: wb.SheetNames.length,
    pageWidth: 900,
    pageHeight: 600,
    content: () => null,
    // renderCanvas is intentionally omitted — DocHtmlViewer handles XLSX
    sheetHtml,          // custom field for XLS HTML
    sheetNames: wb.SheetNames,
  } as PdfPage & { sheetHtml: Record<string, string>; sheetNames: string[] };
}

// ─── Word (DOCX) via mammoth ──────────────────────────────────────────────
async function buildDocxPage(url: string): Promise<PdfPage> {
  const mammoth = await import("mammoth");
  const res = await fetch(proxyUrl(url));
  const buf = await res.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });

  return {
    title: "",
    pageCount: 1,
    pageWidth: 816,
    pageHeight: 1056,
    content: () => null,
    docHtml: html,      // custom field for DOCX HTML
  } as PdfPage & { docHtml: string };
}

// ─── CSV via PapaParse ─────────────────────────────────────────────────────
async function buildCsvPage(url: string): Promise<PdfPage> {
  const Papa = await import("papaparse");
  const res  = await fetch(proxyUrl(url));
  const text = await res.text();
  const result = Papa.default.parse<string[]>(text, { skipEmptyLines: true });
  const { data, meta } = result;

  return {
    title: "",
    pageCount: 1,
    pageWidth: 900,
    pageHeight: 600,
    content: () => null,
    csvRows: data,
    csvFields: meta.fields ?? (data[0] as string[]),
  } as PdfPage & { csvRows: string[][]; csvFields: string[] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useDocumentPage(
  submissionId: string | undefined,
  doc: string | null,
  mockLoader: (() => Record<string, PdfPage>) | null,
  // Real-document fields — supplied when backend provides URLs
  docUrl?: string,
  docType?: DocType,
) {
  const key = docUrl
    ? `real:${docUrl}`
    : `${submissionId ?? ""}:${doc ?? ""}`;

  const [result, setResult]     = useState<PdfPage | null>(() => _cache.get(key) ?? null);
  const [isLoading, setLoading] = useState(!!doc && !_cache.has(key));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!doc && !docUrl) { setResult(null); setLoading(false); return; }
    if (_cache.has(key)) { setResult(_cache.get(key)!); setLoading(false); return; }
    // Key changed and not yet cached — clear the stale previous result immediately
    // so DocCanvasViewer never renders with a mismatched page object + pageNum.
    setResult(null);

    setLoading(true);

    // ── Real blob-URL path ──────────────────────────────────────────────
    if (docUrl && docType) {
      const loaders: Record<DocType, (u: string) => Promise<PdfPage>> = {
        pdf:   buildPdfPage,
        image: buildImagePage,
        xlsx:  buildXlsxPage,
        docx:  buildDocxPage,
        csv:   buildCsvPage,
      };
      loaders[docType](docUrl)
        .then((page) => { _cache.set(key, page); setResult(page); setLoading(false); })
        .catch((err) => { console.error("[useDocumentPage] load error", err); setLoading(false); });
      return;
    }

    // ── Mock / dev path (120 ms simulated latency) ─────────────────────
    timerRef.current = setTimeout(() => {
      const pages = mockLoader?.() ?? {};
      const p = pages[doc!] ?? null;
      _cache.set(key, p);
      setResult(p);
      setLoading(false);
    }, 120);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, doc, submissionId, docUrl, docType]);

  return { docPage: result, docLoading: isLoading };
}
