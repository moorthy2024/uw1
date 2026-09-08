"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import { type ReactNode, useState, useRef, useEffect, useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import {
  FileText, X, Mail, ChevronRight, ChevronLeft, ChevronDown,
  AlertTriangle, Download, FileSearch, Info, Search,
  RefreshCw, Paperclip, Check, ExternalLink, Camera,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  StepShell, StepSummaryBand, PaneTitle,
  type StepStatus,
} from "../step-detail-layout";
import { ActionBtn, hazardBand, parseTIV, parsePaidK, fmtPaid, BAND_STYLE, parsePC } from "../SubmissionHelpers";
import { useStepActions, type ActionItem } from "../SubmissionTypes";
import { type SovLocation, type LossLocation } from "../SubmissionTypes";
import {
  type SubmissionMeta, type SubmissionExtras, type ClaimRecord,
} from "../SubmissionTypes";
import { type SubmissionIndexEntry } from "../CustomerTable";
import { type CatalogField, type CatalogDocRef, type FieldKind, type DocType, type PdfPage, CRITICALITY_STYLE } from "./types";
import { EXPECTED_DOCS, DOMAIN_ORDER, FIELD_CATALOG } from "./mock-data";
import { useIngestionFields } from "./useSubmission";
import { useDocumentPage } from "./useDocumentPage";
import { useFieldStream } from "./useFieldStream";

/* ── Step 1: Ingestion ── */
/* ⓘ icon that opens a light-background tooltip showing the field's expected format.
   Content comes from f.detail in ingestion-field-catalog.ts — single source of truth. */
function FieldInfoTooltip({ detail }: { detail: string }) {
  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#C9C7C1] text-[#9B9B98] hover:border-[#0076BC] hover:text-[#0076BC] transition-colors flex-shrink-0"
          style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}
          aria-label="Expected format"
        >
          i
        </button>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top" align="start" sideOffset={6}
          className="z-50 max-w-[260px] px-3 py-2 rounded-lg text-[11px] leading-snug"
          style={{
            backgroundColor: "#fff",
            color: "#374151",
            fontWeight: 500,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
          }}
        >
          {detail}
          <TooltipPrimitive.Arrow style={{ fill: "#E5E7EB" }} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* Synthetic PDF page content per document */
function makePdfPages(meta: SubmissionMeta, idx: SubmissionIndexEntry, extras: SubmissionExtras): Record<string, PdfPage> {
  const broker = meta.broker;
  const ins    = meta.namedInsured;
  const tiv    = meta.tivFull;
  const naics  = meta.naics;
  const inc    = meta.inceptionDate;
  const pages: Record<string, PdfPage> = {
    "Application": {
      title: "Commercial Property Application",
      pageCount: 6,
      content: (hl) => (
        <div className="space-y-3 text-[11px] text-[#2D2D2D] leading-relaxed">
          <div className="border-b border-[#E8E6E1] pb-2 mb-2">
            <div className="text-[13px]" style={{ fontWeight: 700 }}>COMMERCIAL PROPERTY APPLICATION</div>
            <div className="text-[10px] text-[#6B7280]">Submission to QBE Insurance Group — North America</div>
          </div>
          <Row label="Named Insured"      val={ins}             hl={hl} match="Named Insured" />
          <Row label="Mailing Address"    val={`${idx.homeOffice}`} hl={hl} match="Home Office" />
          <Row label="NAICS Code"         val={naics}           hl={hl} match="NAICS Code" />
          <Row label="Business Type"      val="LLC"             hl={hl} match="" />
          <Row label="Years in Business"  val="22 years"        hl={hl} match="" />
          <div className="mt-3 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Coverage Request</div>
          <Row label="Submission Type"    val={meta.type}       hl={hl} match="Submission Type" />
          <Row label="Coverage Type"      val={meta.coverageType} hl={hl} match="Coverage Type" />
          <Row label="Effective Date"     val={inc}             hl={hl} match="Inception Date" />
          <Row label="Submission Date"    val={meta.submissionDate} hl={hl} match="Submission Date" />
          <div className="mt-3 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Broker Information</div>
          <Row label="Broker Name"        val={broker}          hl={hl} match="Broker Contact" />
          <Row label="Brokerage"          val={meta.brokerageHouse} hl={hl} match="Brokerage House" />
          <Row label="Broker License"     val="CA-1928374"      hl={hl} match="" />
        </div>
      ),
    },
    "Coverage Request": {
      title: "Coverage Request Letter",
      pageCount: 3,
      content: (hl) => (
        <div className="space-y-3 text-[11px] text-[#2D2D2D] leading-relaxed">
          <div className="border-b border-[#E8E6E1] pb-2">
            <div className="text-[10px] text-[#9B9B98]">{meta.submissionDate}</div>
            <div className="text-[13px]" style={{ fontWeight: 700 }}>COVERAGE REQUEST — {ins.toUpperCase()}</div>
            <div className="text-[10px] text-[#6B7280]">Prepared by: {broker} · {meta.brokerageHouse}</div>
          </div>
          <p className="text-[#4B5563]">On behalf of our client {ins}, we respectfully submit the following coverage request to QBE Insurance Group for the policy period commencing {inc}.</p>
          <div className="mt-2 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Coverage Details</div>
          <Row label="Requested Perils"   val={extras.request.perils.join(", ")} hl={hl} match="Requested Perils" />
          <Row label="Limits Sought"      val={extras.request.limitsSought}      hl={hl} match="Limits Sought" />
          <Row label="QBE Layer"          val={extras.request.qbeLayer}          hl={hl} match="QBE Layer" />
          <Row label="Valuation Basis"    val={extras.request.valuationMethod}   hl={hl} match="Valuation Method" />
          <Row label="Total Insured Value" val={tiv}                             hl={hl} match="Total Insured Value" />
          <p className="text-[#4B5563] text-[10px] italic mt-2">Please refer to the attached Statement of Values for location-level detail. Risk Engineering report available upon request.</p>
        </div>
      ),
    },
    "Statement of Values": {
      title: "Statement of Values (SOV)",
      pageCount: 8,
      content: (hl) => (
        <div className="space-y-2 text-[11px] text-[#2D2D2D]">
          <div className="border-b border-[#E8E6E1] pb-2">
            <div className="text-[13px]" style={{ fontWeight: 700 }}>STATEMENT OF VALUES</div>
            <div className="text-[10px] text-[#6B7280]">{ins} · Policy Year {inc.split(" ").pop()}</div>
          </div>
          <Row label="Legal Entity Type"   val="Corporation"      hl={hl} match="Legal Entity Type" />
          <Row label="Total Insured Value" val={tiv}             hl={hl} match="Total Insured Value" />
          <Row label="Territory"           val={meta.territory}  hl={hl} match="Territory" />
          <Row label="Location Count"      val={meta.locations}  hl={hl} match="Location Count" />
          <div className="mt-2 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Location Summary</div>
          <table className="w-full text-[10px] mt-1">
            <thead><tr className="border-b border-[#E8E6E1]">
              <th className="text-left py-1 text-[#6B7280]">Loc</th>
              <th className="text-left py-1 text-[#6B7280]">State</th>
              <th className="text-left py-1 text-[#6B7280]">Construction</th>
              <th className="text-right py-1 text-[#6B7280]">TIV</th>
            </tr></thead>
            <tbody>
              {(extras.sov.locations ?? []).slice(0, 6).map((loc, i) => (
                <tr key={i} className="border-b border-[#F5F4F1]">
                  <td className="py-1">{loc.loc}</td>
                  <td className="py-1">{loc.state}</td>
                  <td className="py-1">{loc.construction}</td>
                  <td className="py-1 text-right">{loc.tiv}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Row label="Top Construction Class" val={`${idx.topConstructionClass} (${idx.constructionClassPct}% of TIV)`} hl={hl} match="Top Construction Class" />
        </div>
      ),
    },
    "Loss History": {
      title: "5-Year Loss Run Report",
      pageCount: 4,
      content: (hl) => (
        <div className="space-y-2 text-[11px] text-[#2D2D2D]">
          <div className="border-b border-[#E8E6E1] pb-2">
            <div className="text-[13px]" style={{ fontWeight: 700 }}>LOSS RUN REPORT — 5 YEAR</div>
            <div className="text-[10px] text-[#6B7280]">{ins} · Prepared {meta.submissionDate}</div>
          </div>
          <Row label="5-Yr Loss Ratio"   val={extras.lossHistory.lossRatio} hl={hl} match="Hazard Score" />
          <p className="text-[#4B5563]">{extras.lossHistory.summary}</p>
          <div className="mt-2 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Claims by Location</div>
          <table className="w-full text-[10px] mt-1">
            <thead><tr className="border-b border-[#E8E6E1]">
              <th className="text-left py-1 text-[#6B7280]">Location</th>
              <th className="text-right py-1 text-[#6B7280]">Paid</th>
              <th className="text-right py-1 text-[#6B7280]">IBNR</th>
              <th className="text-right py-1 text-[#6B7280]">Count</th>
            </tr></thead>
            <tbody>
              {extras.lossHistory.topLocations.map((l, i) => (
                <tr key={i} className="border-b border-[#F5F4F1]">
                  <td className="py-1">{l.loc}</td>
                  <td className="py-1 text-right">{l.paid}</td>
                  <td className="py-1 text-right">{l.reportedNotPaid}</td>
                  <td className="py-1 text-right">{l.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    "Risk Engineering Report": {
      title: "Risk Engineering Assessment",
      pageCount: 12,
      content: (hl) => (
        <div className="space-y-2 text-[11px] text-[#2D2D2D]">
          <div className="border-b border-[#E8E6E1] pb-2">
            <div className="text-[13px]" style={{ fontWeight: 700 }}>RISK ENGINEERING REPORT</div>
            <div className="text-[10px] text-[#6B7280]">{ins} · Survey Date: 14 Feb 2026</div>
          </div>
          <Row label="Named Insured"        val={ins}                            hl={hl} match="Named Insured" />
          <Row label="Overall Hazard Score" val={`${idx.hazardScore}/100`}       hl={hl} match="Hazard Score" />
          <Row label="Success Propensity"   val={`${idx.successPropensity}%`}    hl={hl} match="Success Propensity" />
          <p className="text-[#4B5563]">{extras.sov.dataCleansingNote}</p>
          <div className="mt-2 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Protection Summary</div>
          {(extras.sov.locations ?? []).slice(0, 4).map((loc, i) => (
            <div key={i} className="flex justify-between text-[10px] py-0.5">
              <span>{loc.loc} · {loc.state}</span>
              <span className="text-[#4B5563]">PC {loc.protectionCode} · Hazard {loc.hazard}/100</span>
            </div>
          ))}
          <div className="mt-2 text-[10px] text-amber-700 italic border border-amber-200 bg-amber-50 rounded p-2">{extras.documents.find(d => d.name === "Risk Engineering Report")?.reviewReason ?? "No review flag."}</div>
        </div>
      ),
    },
    "Site Photos": {
      title: "Site Photographs — Survey Feb 2026",
      pageCount: 4,
      content: (hl) => {
        const photos = [
          { id: "P1", label: "Main Office Building — Ext.", desc: "3-story brick, Sprinklered",   bg: "#B0C4DE" },
          { id: "P2", label: "Manufacturing Bay A",          desc: "Steel frame, open floor plan",  bg: "#C8D8B0" },
          { id: "P3", label: "Storage Warehouse #1",         desc: "Sprinklered, 40,000 sq ft",     bg: "#D8C8B0" },
          { id: "P4", label: "Aerial — Campus Overview",     desc: "Primary facility, ~80 acres",   bg: "#C0B8D8" },
        ];
        return (
          <div className="space-y-2">
            <div className="text-[10px] text-[#6B7280] mb-2">Survey photos · Heartland Industrial Holdings · 14 Feb 2026</div>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => {
                const isCited = !!hl && i === 0;
                return (
                  <div key={photo.id} className={`rounded overflow-hidden ${isCited ? "ring-2 ring-amber-400 ring-offset-1 shadow-lg" : "border border-[#E8E6E1]"}`}>
                    <div className="relative" style={{ height: 72, backgroundColor: photo.bg }}>
                      <svg width="100%" height="72" viewBox="0 0 120 72" preserveAspectRatio="none">
                        <rect width="120" height="72" fill={photo.bg} />
                        <rect x="8" y="12" width="104" height="48" rx="2" fill="white" fillOpacity="0.12" />
                        <rect x="18" y="20" width="36" height="28" rx="1" fill="white" fillOpacity="0.22" />
                        <rect x="66" y="20" width="36" height="28" rx="1" fill="white" fillOpacity="0.22" />
                        <rect x="18" y="52" width="84" height="4" rx="1" fill="white" fillOpacity="0.10" />
                      </svg>
                      {isCited && (
                        <>
                          <div className="absolute inset-0 bg-amber-400 opacity-20 pointer-events-none" />
                          <div className="absolute top-1 right-1 bg-amber-400 text-white text-[8px] px-1.5 py-0.5 rounded font-bold leading-none shadow">CITED</div>
                        </>
                      )}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-[7px] px-1 py-0.5 rounded leading-none">{photo.id}</div>
                    </div>
                    <div className={`px-1.5 py-1 ${isCited ? "bg-amber-50" : "bg-white"}`}>
                      <div className={`text-[9px] font-semibold truncate ${isCited ? "text-amber-900" : "text-[#2D2D2D]"}`}>{photo.label}</div>
                      <div className="text-[8px] text-[#9B9B98]">{photo.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hl && (
              <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-800">
                <span className="font-semibold">Citation:</span> {hl} — photo P1 confirms Industrial / Manufacturing occupancy classification
              </div>
            )}
          </div>
        );
      },
    },
    "Primary Policy": {
      title: "Primary / Expiring Policy",
      pageCount: 18,
      content: (_hl) => (
        <div className="space-y-2 text-[11px] text-[#2D2D2D]">
          <div className="border-b border-[#E8E6E1] pb-2">
            <div className="text-[13px]" style={{ fontWeight: 700 }}>COMMERCIAL PROPERTY POLICY</div>
            <div className="text-[10px] text-[#6B7280]">Expiring Policy — {ins}</div>
          </div>
          <Row label="Policy Number"     val="CPP-2025-00483"    hl="" match="" />
          <Row label="Insurer"           val="QBE Insurance"     hl="" match="" />
          <Row label="Policy Period"     val="01 Jul 2025 – 01 Jul 2026" hl="" match="" />
          <Row label="Coverage Form"     val={meta.coverageType} hl="" match="" />
          <Row label="Limits"            val={extras.request.limitsSought} hl="" match="" />
          <div className="mt-2 pt-2 border-t border-[#F0EFEC] text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Endorsements</div>
          <div className="text-[10px] text-[#4B5563] space-y-0.5">
            <div>· Named Windstorm — 5% per occurrence deductible</div>
            <div>· Flood — $5M sub-limit</div>
            <div>· Business Income — 12-month period of indemnity</div>
            <div>· Agreed Value — flagship properties</div>
          </div>
        </div>
      ),
    },
  };

  return pages;
}

function Row({ label, val, hl, match }: { label: string; val: string; hl: string; match: string }) {
  const isMatch = hl && match && hl === match;
  return (
    <div className="flex gap-2">
      <span className="text-[#9B9B98] w-36 flex-shrink-0">{label}:</span>
      <span className={`flex-1 min-w-0 break-words ${isMatch ? "bg-amber-200 px-1 rounded text-[#2D2D2D]" : "text-[#2D2D2D]"}`} style={{ fontWeight: isMatch ? 700 : 400, overflowWrap: "break-word", wordBreak: "break-word" }}>{val}</span>
    </div>
  );
}

/* Canvas-based document viewer with polygon bbox highlight */
function DocCanvasViewer({ page, bbox, highlightLabel, searchText, docType, pageNum = 1, sheet }: {
  page: PdfPage;
  bbox?: { x1: number; y1: number; x2: number; y2: number } | null;
  highlightLabel: string;
  searchText?: string;
  docType: DocType;
  pageNum?: number;
  sheet?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PW = page.pageWidth ?? 595;
  const PH = page.pageHeight ?? 842;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page.renderCanvas) return;
    // Skip render if pageNum is out of range for this document — this can happen
    // for one render cycle when citation states update but the page object is stale.
    if (pageNum < 1 || pageNum > page.pageCount) return;
    canvas.width = PW;
    canvas.height = PH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, PW, PH);

    let cancelled = false;

    const drawBboxRect = (b: { x1: number; y1: number; x2: number; y2: number }) => {
      // After pdfjs renders it may resize the canvas for a different page —
      // normalize from expected document space to actual canvas pixels.
      const cw = ctx.canvas.width;
      const ch = ctx.canvas.height;
      const sx = cw / PW, sy = ch / PH;
      const sx1 = b.x1 * sx, sy1 = b.y1 * sy;
      const sx2 = b.x2 * sx, sy2 = b.y2 * sy;
      ctx.save();
      ctx.fillStyle = "rgba(251, 191, 36, 0.28)";
      ctx.fillRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
      ctx.strokeStyle = "rgba(217, 119, 6, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
      ctx.fillStyle = "rgba(217, 119, 6, 0.95)";
      [[sx1, sy1], [sx2 - 6, sy1], [sx1, sy2 - 6], [sx2 - 6, sy2 - 6]].forEach(([px, py]) => {
        ctx.fillRect(px, py, 6, 6);
      });
      ctx.restore();
    };

    // After the page renders, locate and draw the bbox highlight.
    // Search priority for PDF/canvas docs:
    //   1. searchText (field value — verbatim extracted text, most specific)
    //   2. highlightLabel (field display label, e.g. "Named Insured")
    //   3. hardcoded bbox (image type, or if both text searches miss)
    const afterRender = async () => {
      if (cancelled) return;
      let effectiveBbox: { x1: number; y1: number; x2: number; y2: number } | null = null;

      console.log("[DocCanvasViewer] afterRender — searchText:", searchText, "highlightLabel:", highlightLabel, "hasFindTextBbox:", !!page.findTextBbox);

      if (page.findTextBbox) {
        if (searchText) {
          effectiveBbox = await page.findTextBbox(searchText, pageNum);
          console.log("[DocCanvasViewer] searchText result:", effectiveBbox);
        }
        if (!effectiveBbox && highlightLabel) {
          effectiveBbox = await page.findTextBbox(highlightLabel, pageNum);
          console.log("[DocCanvasViewer] highlightLabel result:", effectiveBbox);
        }
      }
      if (!effectiveBbox) effectiveBbox = bbox ?? null;

      console.log("[DocCanvasViewer] effectiveBbox:", effectiveBbox, "cancelled:", cancelled, "canvas:", ctx.canvas.width, "x", ctx.canvas.height);
      if (!cancelled && effectiveBbox) drawBboxRect(effectiveBbox);
    };

    const result = page.renderCanvas(ctx, PW, PH, pageNum, sheet);
    if (result instanceof Promise) {
      result.then(() => afterRender());
    } else {
      afterRender();
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, bbox, PW, PH, pageNum, sheet, highlightLabel, searchText]);

  const viewerBg =
    docType === "xlsx" || docType === "csv" ? "#2D5016" :
    docType === "docx" ? "#2B3A5C" :
    docType === "image" ? "#1C1C1C" : "#525252";

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-auto flex justify-center items-start p-3 min-h-0" style={{ background: viewerBg }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: PW, height: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
        />
      </div>
      {bbox && highlightLabel && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-[10px] text-amber-800">
          <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="rgba(251,191,36,0.35)" stroke="rgb(217,119,6)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontWeight: 600 }}>Polygon citation:</span>
          <span>{highlightLabel}</span>
          <span className="ml-auto font-mono text-[9px] text-amber-600">
            ({bbox.x1},{bbox.y1}) → ({bbox.x2},{bbox.y2})
          </span>
        </div>
      )}
    </div>
  );
}

/* HTML-based viewer for XLSX, DOCX, and CSV real documents */
function DocHtmlViewer({ page, docType, highlightLabel, searchText, sheet, pageNum }: {
  page: PdfPage & Record<string, unknown>;
  docType: DocType;
  highlightLabel: string;
  searchText?: string;
  sheet?: string;
  pageNum?: number;
}) {
  const sheetHtml  = page.sheetHtml  as Record<string, string> | undefined;
  const sheetNames = page.sheetNames as string[]              | undefined;
  const docHtml    = page.docHtml    as string                | undefined;
  const csvRows    = page.csvRows    as string[][]            | undefined;
  const csvFields  = page.csvFields  as string[]              | undefined;

  const xlsxRef = useRef<HTMLDivElement>(null);
  const docxRef = useRef<HTMLDivElement>(null);

  // XLSX: after HTML renders, highlight cells whose text matches highlightLabel
  const activeHtml = sheetHtml && sheetNames
    ? (sheetHtml[sheet ?? sheetNames[0]] ?? sheetHtml[sheetNames[0]])
    : undefined;

  // XLSX: try field value first (verbatim in spreadsheet), then field label as fallback
  useEffect(() => {
    const el = xlsxRef.current;
    if (!el) return;
    const table = el.querySelector("table");
    if (!table) return;
    el.querySelectorAll("[data-hl]").forEach(node => {
      (node as HTMLElement).style.removeProperty("background");
      (node as HTMLElement).style.removeProperty("outline");
      node.removeAttribute("data-hl");
    });
    const terms = [searchText, highlightLabel].filter(Boolean) as string[];
    const cellCount = table.querySelectorAll("td, th").length;
    console.log("[DocHtmlViewer:xlsx] renderer: SheetJS → DOM | cells:", cellCount, "| search terms:", terms);
    let first: HTMLElement | null = null;
    for (const term of terms) {
      table.querySelectorAll("td, th").forEach(cell => {
        if (first) return;
        if (cell.textContent?.toLowerCase().includes(term.toLowerCase())) {
          const c = cell as HTMLElement;
          c.style.background = "rgba(251,191,36,0.45)";
          c.style.outline    = "2px solid rgb(217,119,6)";
          c.setAttribute("data-hl", "1");
          first = c;
          console.log("[DocHtmlViewer:xlsx] match found — term:", `"${term}"`, "| cell text:", `"${c.textContent?.trim()}"`);
        }
      });
      if (first) break;
    }
    if (!first) console.warn("[DocHtmlViewer:xlsx] no cell matched any of:", terms);
    if (first) (first as HTMLElement).scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeHtml, highlightLabel, searchText]);

  // DOCX: scroll into view the first highlighted mark after render
  useEffect(() => {
    const el = docxRef.current;
    if (!el) return;
    const marks = el.querySelectorAll("mark");
    const resolvedTerm = marks.length > 0
      ? (el.querySelector("mark")?.textContent ?? "")
      : "(no match)";
    console.log(
      "[DocHtmlViewer:docx] renderer: mammoth.js → HTML",
      "| searchText:", `"${searchText ?? ""}"`,
      "| highlightLabel:", `"${highlightLabel}"`,
      "| matched term →", `"${resolvedTerm}"`,
      "| <mark> hits:", marks.length,
      "| doc length:", docHtml?.length ?? 0, "chars"
    );
    if (marks.length === 0) {
      console.warn("[DocHtmlViewer:docx] no <mark> found — neither searchText nor highlightLabel appear verbatim");
    }
    const mark = marks[0];
    if (mark) mark.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [docHtml, highlightLabel, searchText]);

  // XLSX ─────────────────────────────────────────────────────────────────
  if (docType === "xlsx" && sheetHtml && sheetNames) {
    const activeName = sheet ?? sheetNames[0];
    const html = sheetHtml[activeName] ?? sheetHtml[sheetNames[0]];
    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
        {/* Sheet tab bar */}
        <div className="flex-shrink-0 flex gap-0 border-b border-[#C8C8C8] bg-[#F2F2F2] px-2 pt-1">
          {sheetNames.map(name => (
            <div key={name} className={`px-3 py-1 text-[10px] cursor-default border border-b-0 rounded-t ${name === activeName ? "bg-white border-[#C8C8C8] text-[#217346] font-bold" : "border-transparent text-[#4B5563]"}`}>
              {name}
            </div>
          ))}
        </div>
        {/* Sheet content — ref lets useEffect traverse the DOM after render */}
        <div
          ref={xlsxRef}
          className="flex-1 overflow-auto p-2 text-[11px]"
          dangerouslySetInnerHTML={{ __html: `<style>table{border-collapse:collapse;font-family:Calibri,sans-serif;font-size:11px}td,th{border:1px solid #D0D0D0;padding:2px 6px;white-space:nowrap}tr:nth-child(even){background:#FAFAFA}th{background:#217346;color:#fff;font-weight:600}</style>${html}` }}
        />
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[10px] text-amber-800 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="rgba(251,191,36,0.35)" stroke="rgb(217,119,6)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontWeight: 600 }}>Sheet:</span><span>{activeName}</span>
          {highlightLabel && <><span className="ml-2" style={{ fontWeight: 600 }}>Citation:</span><span>{highlightLabel}</span></>}
        </div>
      </div>
    );
  }

  // DOCX ─────────────────────────────────────────────────────────────────
  if (docType === "docx" && docHtml) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#E8EDF2]">
        {/* ref on scroll container so scrollIntoView works correctly */}
        <div ref={docxRef} className="flex-1 overflow-auto p-6 flex justify-center min-h-0">
          <div
            className="bg-white w-full max-w-[816px] min-h-[1056px] p-12 shadow-lg text-[12px] leading-relaxed"
            style={{ fontFamily: "Calibri, sans-serif" }}
            dangerouslySetInnerHTML={{
              __html: (() => {
                const style = `<style>p{margin:0 0 8px}h1,h2,h3{margin:12px 0 4px;font-weight:700}table{border-collapse:collapse;width:100%}td,th{border:1px solid #D0D0D0;padding:4px 8px}mark{background:rgba(251,191,36,0.45);padding:1px 3px;border-radius:2px;border:1px solid rgba(217,119,6,0.6)}</style>`;
                // Try terms in priority order: field value (verbatim extracted text),
                // then highlight label. Stop at the first term that actually appears
                // in the document — avoids injecting <mark> for a non-matching string.
                const tryMark = (term: string) => {
                  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  const out = docHtml.replace(new RegExp(`(${esc})`, "gi"), "<mark>$1</mark>");
                  return out !== docHtml ? out : null;
                };
                const terms = [searchText, highlightLabel].filter(Boolean) as string[];
                let marked = docHtml;
                for (const term of terms) {
                  const result = tryMark(term);
                  if (result) { marked = result; break; }
                }
                return style + marked;
              })()
            }}
          />
        </div>
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[10px] text-amber-800 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="rgba(251,191,36,0.35)" stroke="rgb(217,119,6)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontWeight: 600 }}>Page:</span><span>{pageNum ?? 1}</span>
          {highlightLabel && <><span className="ml-2" style={{ fontWeight: 600 }}>Citation:</span><span>{highlightLabel}</span></>}
        </div>
      </div>
    );
  }

  // CSV ──────────────────────────────────────────────────────────────────
  if (docType === "csv" && csvRows) {
    const headers = csvFields ?? (csvRows[0] as string[]);
    const rows = csvFields ? csvRows : csvRows.slice(1);
    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#1E1E2E]">
        <div className="flex-1 overflow-auto p-3 min-h-0">
          <table className="w-full border-collapse text-[10px] font-mono">
            <thead>
              <tr>{headers.map((h, i) => <th key={i} className="bg-[#3D3D5C] text-[#A0A0C0] text-left px-2 py-1 border border-[#4D4D70] font-bold whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-[#22223A]" : "bg-[#1E1E30]"}>
                  {(row as string[]).map((cell, ci) => (
                    <td key={ci} className="text-[#D0D0D0] px-2 py-1 border border-[#2D2D48] whitespace-nowrap">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[10px] text-amber-800 flex items-center gap-2">
          <span style={{ fontWeight: 600 }}>CSV</span>
          {highlightLabel && <><span className="ml-2" style={{ fontWeight: 600 }}>Citation:</span><span>{highlightLabel}</span></>}
          <span className="ml-auto text-amber-600">{rows.length} rows</span>
        </div>
      </div>
    );
  }

  return <div className="flex-1 flex items-center justify-center text-[#9B9B98] text-[12px]">Loading document…</div>;
}

/* Fetches and renders an HTML email from blob storage with citation highlight */
function HtmlEmailViewer({ docUrl, excerpt, highlightLabel }: {
  docUrl?: string;
  excerpt?: string;
  highlightLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [emailHtml, setEmailHtml] = useState<string | null>(null);

  // Step 1 — fetch the HTML and store it in state
  useEffect(() => {
    if (!docUrl) return;
    setLoading(true);
    setFetchError(false);
    setEmailHtml(null);

    console.group("[HtmlEmailViewer] Fetching email HTML");
    console.log("Proxy URL:", `/api/doc-proxy?url=${docUrl.slice(0, 80)}…`);
    console.log("Citation text:", excerpt);
    console.log("Field label:", highlightLabel);

    fetch(`/api/doc-proxy?url=${encodeURIComponent(docUrl)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        console.log("[HtmlEmailViewer] HTML loaded, length:", html.length, "chars");
        setEmailHtml(html);
        setLoading(false);
        console.groupEnd();
      })
      .catch(err => {
        console.error("[HtmlEmailViewer] Fetch error:", err.message);
        console.groupEnd();
        setFetchError(true);
        setLoading(false);
      });
  }, [docUrl]);

  // Step 2 — once loading=false the container div is in the DOM; inject HTML and highlight
  useEffect(() => {
    if (!emailHtml || !containerRef.current) return;
    containerRef.current.innerHTML = emailHtml;

    const terms = [excerpt, highlightLabel].filter((t): t is string => Boolean(t));
    let highlighted = false;
    for (const term of terms) {
      if (highlighted) break;
      const walk = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          const idx = text.toLowerCase().indexOf(term.toLowerCase());
          if (idx === -1) return false;
          const mark = document.createElement("mark");
          mark.style.cssText = "background:rgba(251,191,36,0.45);border:1px solid rgb(217,119,6);border-radius:2px;padding:1px 3px";
          mark.textContent = text.slice(idx, idx + term.length);
          const after = document.createTextNode(text.slice(idx + term.length));
          node.textContent = text.slice(0, idx);
          node.parentNode?.insertBefore(mark, node.nextSibling);
          node.parentNode?.insertBefore(after, mark.nextSibling);
          mark.scrollIntoView({ behavior: "smooth", block: "center" });
          console.log(`[HtmlEmailViewer] Citation highlighted — term: "${term.slice(0, 60)}"`);
          return true;
        }
        for (const child of Array.from(node.childNodes)) {
          if (walk(child)) return true;
        }
        return false;
      };
      highlighted = walk(containerRef.current);
    }
    if (terms.length > 0 && !highlighted)
      console.warn("[HtmlEmailViewer] Citation text not found in email:", terms);
  }, [emailHtml, excerpt, highlightLabel]);

  if (!docUrl) return <div className="flex-1 flex items-center justify-center text-[#9B9B98] text-[12px]">No document URL</div>;
  if (loading) return <div className="flex-1 flex items-center justify-center text-[#9B9B98] text-[12px]">Loading email…</div>;
  if (fetchError) return <div className="flex-1 flex items-center justify-center text-[#9B9B98] text-[12px]">Could not load email document</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 bg-white text-[12px] leading-relaxed"
        style={{ fontFamily: "Arial, sans-serif" }}
      />
      <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[10px] text-amber-800 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
          <rect x="1" y="1" width="10" height="10" rx="1" fill="rgba(251,191,36,0.35)" stroke="rgb(217,119,6)" strokeWidth="1.5"/>
        </svg>
        <span style={{ fontWeight: 600 }}>Email</span>
        {highlightLabel && <><span className="ml-2" style={{ fontWeight: 600 }}>Citation:</span><span>{highlightLabel}</span></>}
      </div>
    </div>
  );
}

/* Field labels repeat across documents — key on the full hierarchy path */
function fieldKey(f: CatalogField) {
  return `${f.doc}|${f.domain}|${f.subEntity}|${f.label}`;
}

/* ── Citation modal — full document preview with download ── */
function CitationModal({ docRef, citNum, pdfPages, meta, onClose }: {
  docRef: CatalogDocRef;
  citNum: number;
  pdfPages: Record<string, PdfPage>;
  meta: { id: string; namedInsured: string; submissionDate: string };
  onClose: () => void;
}) {
  const [page, setPage] = useState(docRef.page);
  const WORD_DOCS  = new Set(["Application", "Coverage Request", "Primary Policy"]);
  const EXCEL_DOCS = new Set(["Statement of Values", "Loss History"]);
  const IMAGE_DOCS = new Set(["Site Photos"]);
  const docData = pdfPages[docRef.doc];
  const pageCount = docData?.pageCount ?? 1;

  const docTypeCfg = IMAGE_DOCS.has(docRef.doc)
    ? { label: "IMG",  bg: "#374151", ext: ".jpg" }
    : EXCEL_DOCS.has(docRef.doc)
    ? { label: "XLSX", bg: "#217346", ext: ".xlsx" }
    : WORD_DOCS.has(docRef.doc)
    ? { label: "DOCX", bg: "#2B579A", ext: ".docx" }
    : { label: "PDF",  bg: "#D93025", ext: ".pdf" };

  const handleDownload = () => {
    toast.success(`Downloading ${docRef.doc}${docTypeCfg.ext}`, {
      description: `Citation ${citNum} · page ${docRef.page}`,
    });
  };

  const renderViewer = () => {
    if (docData?.renderCanvas) {
      const resolvedDocType: DocType = IMAGE_DOCS.has(docRef.doc) ? "image"
        : EXCEL_DOCS.has(docRef.doc) ? "xlsx"
        : WORD_DOCS.has(docRef.doc) ? "docx"
        : docRef.doc.endsWith(".csv") ? "csv"
        : "pdf";
      return (
        <DocCanvasViewer
          page={docData}
          bbox={docRef.bbox}
          highlightLabel={docRef.highlightLabel}
          docType={resolvedDocType}
          pageNum={page}
          sheet={docRef.sheet}
        />
      );
    }
    // HTML email from extraction API — render via proxy + citation highlight
    if (docRef.docType === "html" && docRef.docUrl) {
      console.log("[CitationModal] Opening HTML email preview", {
        doc:      docRef.doc,
        url:      docRef.docUrl?.slice(0, 80) + "…",
        citation: docRef.excerpt?.slice(0, 60),
        field:    docRef.highlightLabel,
      });
      return (
        <HtmlEmailViewer
          docUrl={docRef.docUrl}
          excerpt={docRef.excerpt}
          highlightLabel={docRef.highlightLabel}
        />
      );
    }

    if (!docData) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
          <div className="text-center text-[#9B9B98] text-[12px]">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Document not yet received
          </div>
        </div>
      );
    }
    if (IMAGE_DOCS.has(docRef.doc)) {
      return (
        <div className="flex-1 flex flex-col bg-[#1C1C1C] overflow-hidden">
          <div className="flex-shrink-0 px-3 py-1 bg-[#111] flex items-center gap-2">
            <span className="text-[9px] text-white opacity-50">4 of 4 photos · Survey 14 Feb 2026</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {!docData ? (
              <div className="text-center py-12">
                <Camera className="w-8 h-8 mx-auto mb-2 text-white opacity-20" />
                <div className="text-[11px] text-[#9B9B98]">Photos not yet received</div>
              </div>
            ) : docData.content(docRef.highlightLabel)}
          </div>
        </div>
      );
    }
    if (EXCEL_DOCS.has(docRef.doc)) {
      const sheetTabs: Record<string, string[]> = {
        "Statement of Values": ["Locations", "Summary", "Hazard"],
        "Loss History":        ["Claims", "Annual Summary", "Index"],
      };
      const tabs = sheetTabs[docRef.doc] ?? ["Sheet1"];
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#E8F0EB]">
          <div className="flex-shrink-0 px-3 py-1 bg-white border-b border-[#C8C8C8] flex items-center gap-2">
            <div className="px-2 py-0.5 border border-[#C8C8C8] rounded text-[10px] text-[#5D5D5D] w-14 text-center tabular-nums">A1</div>
            <div className="w-px h-4 bg-[#C8C8C8]" />
            <span className="text-[11px] text-[#2D2D2D] flex-1">{docRef.highlightLabel}</span>
          </div>
          <div className="flex-1 overflow-auto bg-white p-4" style={{ fontFamily: "Calibri, sans-serif" }}>
            {docData.content(docRef.highlightLabel)}
          </div>
          <div className="flex-shrink-0 flex items-end gap-0 px-2 pt-1 border-t border-[#C8C8C8] bg-[#F2F2F2]">
            {tabs.map((tab, i) => (
              <div key={tab} className={`px-3 py-1 text-[10px] border-l border-r border-t rounded-t cursor-pointer select-none ${i === 0 ? "bg-white border-[#C8C8C8] text-[#217346]" : "bg-[#D8E8DC] border-[#B8D0BC] text-[#5D5D5D] hover:bg-[#E8F0EB]"}`} style={{ fontWeight: i === 0 ? 700 : 400 }}>
                {tab}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (WORD_DOCS.has(docRef.doc)) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#E8EDF2]">
          <div className="flex-shrink-0 h-4 bg-[#F2F2F2] border-b border-[#C8C8C8] flex items-center px-8">
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n} className="flex-1 border-l border-[#C8C8C8] h-2 relative">
                <span className="absolute -top-0.5 left-0.5 text-[7px] text-[#9B9B98]">{n}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-auto py-4 px-8">
            <div className="bg-white shadow-md mx-auto pb-10 relative" style={{ maxWidth: 560, fontFamily: "Calibri, 'Segoe UI', sans-serif", padding: "32px 40px" }}>
              {docData.content(docRef.highlightLabel)}
              <div className="absolute bottom-4 left-10 right-10 border-t border-[#E8E6E1] pt-1.5 flex justify-between">
                <span className="text-[7px] text-[#C9C7C1]">{meta.namedInsured} · {meta.id}</span>
                <span className="text-[7px] text-[#C9C7C1]">Page {page} of {pageCount}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 py-0.5 flex items-center gap-4" style={{ background: "#2B579A" }}>
            <span className="text-[9px] text-white opacity-70">Page {page} of {pageCount}</span>
            <span className="ml-auto text-[9px] text-white opacity-70">100%</span>
          </div>
        </div>
      );
    }
    /* PDF */
    return (
      <div className="flex-1 bg-[#6B7280] p-4 overflow-auto">
        <div className="bg-white rounded shadow-xl mx-auto p-6 pb-12 relative" style={{ maxWidth: 480, fontFamily: "Georgia, serif" }}>
          <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-[#2D2D2D]">
            <div>
              <div className="text-[8px] uppercase tracking-[0.15em] text-[#6B7280]" style={{ fontFamily: "sans-serif" }}>QBE INSURANCE GROUP</div>
              <div className="text-[9px] text-[#6B7280] mt-0.5" style={{ fontFamily: "sans-serif" }}>Commercial Property Underwriting</div>
            </div>
            <div className="text-right">
              <div className="text-[7px] text-[#9B9B98]" style={{ fontFamily: "sans-serif" }}>CONFIDENTIAL</div>
              <div className="text-[7px] text-[#9B9B98]" style={{ fontFamily: "sans-serif" }}>Page {page}</div>
            </div>
          </div>
          <div style={{ fontFamily: "sans-serif" }}>{docData.content(docRef.highlightLabel)}</div>
          <div className="absolute bottom-4 left-6 right-6 border-t border-[#E8E6E1] pt-2 flex justify-between">
            <span className="text-[7px] text-[#C9C7C1]" style={{ fontFamily: "sans-serif" }}>{meta.submissionDate} · {meta.id}</span>
            <span className="text-[7px] text-[#C9C7C1]" style={{ fontFamily: "sans-serif" }}>Page {page} of {pageCount}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="flex flex-col rounded-xl overflow-hidden shadow-2xl w-full max-w-2xl" style={{ maxHeight: "85vh", background: "#fff" }} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#E8E6E1]" style={{ background: docTypeCfg.bg }}>
          <span className="px-1.5 py-0.5 rounded bg-white text-[9px]" style={{ color: docTypeCfg.bg, fontWeight: 800 }}>{docTypeCfg.label}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] truncate" style={{ fontWeight: 700 }}>{docData?.title ?? docRef.doc}</p>
            <p className="text-white text-[10px] opacity-70">Citation {citNum} · page {docRef.page}</p>
          </div>
          {/* Pagination */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setPage(p => Math.max(1, p - 1))}
              className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 text-white">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-white tabular-nums w-16 text-center opacity-90">{page} / {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 text-white">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Download */}
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] flex-shrink-0 transition-colors"
            style={{ fontWeight: 600 }}>
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white flex-shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation highlight banner */}
        {docRef.highlightLabel && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-[11px] text-amber-800" style={{ fontWeight: 600 }}>Highlighted: {docRef.highlightLabel}</span>
            <span className="text-[10px] text-amber-600 ml-auto">{docRef.excerpt}</span>
          </div>
        )}

        {/* Document body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
}

/* ── Loss History Ingestion View ── */
const LH_TILES: { label: string; catalogLabel?: string; computed?: true }[] = [
  { label: "No. of Claims",     catalogLabel: "Number of claims in period" },
  { label: "Largest Loss",      catalogLabel: "Largest single loss ($)" },
  { label: "Loss Run Period",   catalogLabel: "Loss run years provided" },
];

function LossHistoryIngestionView({
  lossHistory,
  fields,
  values,
  verified,
  setVerified,
  fieldKey,
}: {
  lossHistory: SubmissionExtras["lossHistory"];
  fields: CatalogField[];
  values: Record<string, string>;
  verified: Set<string>;
  setVerified: Dispatch<SetStateAction<Set<string>>>;
  fieldKey: (f: CatalogField) => string;
}) {
  const [editedYears, setEditedYears] = useState<Record<number, { paid?: string; pierced?: boolean }>>({});
  const [editedLocs,  setEditedLocs]  = useState<Record<string, { loc?: string; paid?: string; ibnr?: string; count?: number }>>({});
  const [verifiedYears,  setVerifiedYears]  = useState<Set<number>>(new Set());
  const [verifiedLocs,   setVerifiedLocs]   = useState<Set<string>>(new Set());
  const [verifiedClaims, setVerifiedClaims] = useState<Set<string>>(new Set());
  const [claimSearchQ, setClaimSearchQ] = useState("");

  const years = [...(lossHistory.yearlyBreakdown ?? [])].sort((a, b) => b.year - a.year);
  const locations = lossHistory.topLocations;
  const piercingSet = new Set((lossHistory.layerPenetration?.piercingEvents ?? []).map(e => e.year));

  /* Compute total paid (in $K) from edited or original values */
  const totalPaidK = years.reduce((sum, y) => {
    const raw = editedYears[y.year]?.paid ?? y.paid;
    return sum + parsePaidK(raw);
  }, 0);

  /* Helpers — tile key and value */
  function catalogTileKey(catalogLabel: string): string {
    const f = fields.find(cf => cf.label === catalogLabel && cf.doc === "Loss History");
    return f ? fieldKey(f) : `lh::${catalogLabel}`;
  }
  function catalogTileVal(catalogLabel: string): string {
    const f = fields.find(cf => cf.label === catalogLabel && cf.doc === "Loss History");
    if (!f) return "—";
    return values[fieldKey(f)] ?? f.value ?? "—";
  }
  function tileKeyFor(tile: typeof LH_TILES[0]): string {
    if (tile.catalogLabel) return catalogTileKey(tile.catalogLabel);
    return `lh::${tile.label}`;
  }
  function tileValFor(tile: typeof LH_TILES[0]): string {
    if (tile.catalogLabel) return catalogTileVal(tile.catalogLabel);
    return "—";
  }

  const verifiedTilesCount = LH_TILES.filter(t => verified.has(tileKeyFor(t))).length;

  /* Narrative — backed by catalog field "Claims History" */
  const narrativeField = fields.find(f => f.label === "Claims History" && f.doc === "Loss History");
  const narrativeKey   = narrativeField ? fieldKey(narrativeField) : "";
  const narrativeVal   = narrativeField ? (values[narrativeKey] ?? narrativeField.value ?? lossHistory.summary) : lossHistory.summary;

  /* Share % for annual table — recomputed live from edited values */
  function yearPaidK(y: { year: number; paid: string }): number {
    return parsePaidK(editedYears[y.year]?.paid ?? y.paid);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-auto">

        {/* Annual Loss Breakdown */}
        <div className="border-b border-[#E8E6E1]">
          <div className="px-3 py-1.5 bg-[#FAFAF9] border-b border-[#F0EFEC] flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>Annual Loss Breakdown</span>
            <span className="text-[10px] text-[#9B9B98] tabular-nums">{verifiedYears.size}/{years.length} verified</span>
          </div>
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F5F4F1]">
              <tr>
                <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Year</th>
                <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Paid ($)</th>
                <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Share %</th>
                <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Layer</th>
                <th className="text-center px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>✓</th>
              </tr>
            </thead>
            <tbody>
              {years.map(y => {
                const edits    = editedYears[y.year] ?? {};
                const isEdited = Object.keys(edits).length > 0;
                const isV      = verifiedYears.has(y.year);
                const paidRaw  = edits.paid ?? y.paid;
                const isPierced = edits.pierced !== undefined ? edits.pierced : piercingSet.has(y.year);
                const sharePct = totalPaidK > 0 ? Math.round((yearPaidK(y) / totalPaidK) * 100) : 0;
                return (
                  <tr key={y.year}
                    className={`border-b border-[#F0EFEC] last:border-b-0 transition-colors ${
                      isV ? "bg-emerald-50/30" : isEdited ? "bg-amber-50/40" : "hover:bg-[#FAFAF9]"
                    }`}>
                    <td className="px-3 py-1.5 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums" style={{ fontWeight: 600 }}>{y.year}</span>
                        {isEdited && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200" style={{ fontWeight: 700 }}>edited</span>}
                      </div>
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <SovEditCell type="currency" value={paidRaw.replace(/^\$/, "")}
                        onChange={v => setEditedYears(prev => ({ ...prev, [y.year]: { ...prev[y.year], paid: v ? `$${v}` : y.paid } }))} />
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap align-middle">
                      <span className="tabular-nums text-[#5D5D5D]">{sharePct}%</span>
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <SovEditCell type="select" options={["—", "Pierced"]}
                        value={isPierced ? "Pierced" : "—"}
                        onChange={v => setEditedYears(prev => ({ ...prev, [y.year]: { ...prev[y.year], pierced: v === "Pierced" } }))} />
                    </td>
                    <td className="px-3 py-1.5 align-middle text-center">
                      <button
                        onClick={() => setVerifiedYears(prev => { const n = new Set(prev); n.has(y.year) ? n.delete(y.year) : n.add(y.year); return n; })}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                          isV ? "bg-emerald-500 border-emerald-600 text-white" : "border-[#C9C7C1] text-transparent hover:border-[#0076BC]"
                        }`}
                        title={isV ? "Mark unverified" : "Verify year"}>
                        <Check className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#F5F4F1] border-t border-[#E0DDD7]">
                <td className="px-3 py-1.5 text-[10px] text-[#4B5563]" style={{ fontWeight: 700 }}>{lossHistory.claimsYears}-yr Total</td>
                <td className="px-3 py-1.5 text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 700 }} colSpan={4}>{fmtPaid(totalPaidK)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Location Claims Table */}
        {locations.length > 0 && (
          <div className="border-b border-[#E8E6E1]">
            <div className="px-3 py-1.5 bg-[#FAFAF9] border-b border-[#F0EFEC] flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>Loss by Location</span>
              <span className="text-[10px] text-[#9B9B98] tabular-nums">{verifiedLocs.size}/{locations.length} verified</span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F5F4F1]">
                <tr>
                  <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Location</th>
                  <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Paid ($)</th>
                  <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>IBNR ($)</th>
                  <th className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>Claims (#)</th>
                  <th className="text-center px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>✓</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(origL => {
                  const edits    = editedLocs[origL.loc] ?? {};
                  const isEdited = Object.keys(edits).length > 0;
                  const isV      = verifiedLocs.has(origL.loc);
                  const locVal   = edits.loc  ?? origL.loc;
                  const paidVal  = edits.paid ?? origL.paid;
                  const ibnrVal  = edits.ibnr ?? origL.reportedNotPaid;
                  const countVal = edits.count ?? origL.count;
                  const setEdits = (patch: typeof edits) =>
                    setEditedLocs(prev => ({ ...prev, [origL.loc]: { ...(prev[origL.loc] ?? {}), ...patch } }));
                  return (
                    <tr key={origL.loc}
                      className={`border-b border-[#F0EFEC] last:border-b-0 transition-colors ${
                        isV ? "bg-emerald-50/30" : isEdited ? "bg-amber-50/40" : "hover:bg-[#FAFAF9]"
                      }`}>
                      <td className="px-2 py-1 align-middle min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <SovEditCell type="text" value={locVal} onChange={v => setEdits({ loc: v })} />
                          {isEdited && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0" style={{ fontWeight: 700 }}>edited</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <SovEditCell type="currency" value={paidVal.replace(/^\$/, "")}
                          onChange={v => setEdits({ paid: v ? `$${v}` : origL.paid })} />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <SovEditCell type="currency" value={ibnrVal.replace(/^\$/, "")}
                          onChange={v => setEdits({ ibnr: v ? `$${v}` : origL.reportedNotPaid })} />
                      </td>
                      <td className="px-2 py-1 align-middle">
                        <SovEditCell type="numeric" min={0} value={countVal}
                          onChange={v => setEdits({ count: v ? Number(v) : origL.count })} />
                      </td>
                      <td className="px-3 py-1.5 align-middle text-center">
                        <button
                          onClick={() => setVerifiedLocs(prev => { const n = new Set(prev); n.has(origL.loc) ? n.delete(origL.loc) : n.add(origL.loc); return n; })}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                            isV ? "bg-emerald-500 border-emerald-600 text-white" : "border-[#C9C7C1] text-transparent hover:border-[#0076BC]"
                          }`}
                          title={isV ? "Mark unverified" : "Verify location"}>
                          <Check className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Claim Register — individual claim rows */}
        {lossHistory.claims && lossHistory.claims.length > 0 && (() => {
          const claims = lossHistory.claims as ClaimRecord[];
          const filteredClaims = claimSearchQ
            ? claims.filter(c => {
                const q = claimSearchQ.toLowerCase();
                return [c.claimId, c.location, c.peril, c.status].some(v => String(v ?? "").toLowerCase().includes(q));
              })
            : claims;
          return (
            <div className="border-b border-[#E8E6E1]">
              {/* Search bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF9] border-b border-[#F0EFEC] flex-shrink-0">
                <Search className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
                <input
                  type="text"
                  value={claimSearchQ}
                  onChange={e => setClaimSearchQ(e.target.value)}
                  placeholder="Search claim ID, location, peril, status…"
                  className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#C4C2BE]"
                  style={{ color: "#2D2D2D" }}
                />
                {claimSearchQ && (
                  <button onClick={() => setClaimSearchQ("")} className="text-[#9B9B98] hover:text-[#5D5D5D]">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="px-3 py-1.5 bg-[#FAFAF9] border-b border-[#F0EFEC] flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>Claim Register</span>
                <span className="text-[10px] text-[#9B9B98] tabular-nums">{verifiedClaims.size}/{claims.length} verified</span>
              </div>
              <div className="overflow-x-auto">
                <table className="text-[11px] border-collapse" style={{ minWidth: 760, width: "100%" }}>
                  <thead className="sticky top-0 z-10 bg-[#F5F4F1]">
                    <tr>
                      {["Claim ID", "Location", "Loss Date", "Peril", "Status", "Paid", "Reserve", "Complexity", "✓"].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap ${i === 8 ? "text-center" : "text-left"}`} style={{ fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map(c => {
                      const isV = verifiedClaims.has(c.claimId);
                      const paidFmt = c.paid >= 1_000_000 ? `$${(c.paid / 1_000_000).toFixed(1)}M`
                        : c.paid >= 1_000 ? `$${Math.round(c.paid / 1_000)}K`
                        : `$${c.paid.toLocaleString()}`;
                      const resFmt = c.caseReserve > 0
                        ? (c.caseReserve >= 1_000 ? `$${Math.round(c.caseReserve / 1_000)}K` : `$${c.caseReserve}`)
                        : "—";
                      const statusCls = c.status === "Open"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-[#F5F4F1] text-[#5D5D5D] border-[#E8E6E1]";
                      const complexCls = c.complexity === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : c.complexity === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-[#F5F4F1] text-[#5D5D5D] border-[#E8E6E1]";
                      return (
                        <tr key={c.claimId} className={`border-b border-[#F0EFEC] last:border-b-0 transition-colors ${isV ? "bg-emerald-50/30" : "hover:bg-[#FAFAF9]"}`}>
                          <td className="px-3 py-1.5 whitespace-nowrap align-middle font-mono text-[10px] text-[#5D5D5D]">{c.claimId}</td>
                          <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                            <span className="font-mono text-[10px] text-[#9B9B98]">{c.locId}</span>
                            <span className="mx-1 text-[#C9C7C1]">—</span>
                            <span>{c.location}</span>
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap align-middle tabular-nums text-[#5D5D5D]">{c.lossDate}</td>
                          <td className="px-3 py-1.5 align-middle">{c.peril}</td>
                          <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${statusCls}`} style={{ fontWeight: 600 }}>{c.status}</span>
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap align-middle tabular-nums" style={{ fontWeight: 600 }}>{paidFmt}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap align-middle tabular-nums text-[#5D5D5D]">{resFmt}</td>
                          <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${complexCls}`} style={{ fontWeight: 600 }}>{c.complexity}</span>
                          </td>
                          <td className="px-3 py-1.5 align-middle text-center">
                            <button
                              onClick={() => setVerifiedClaims(prev => { const n = new Set(prev); n.has(c.claimId) ? n.delete(c.claimId) : n.add(c.claimId); return n; })}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${isV ? "bg-emerald-500 border-emerald-600 text-white" : "border-[#C9C7C1] text-transparent hover:border-[#0076BC]"}`}
                              title={isV ? "Mark unverified" : "Verify claim"}>
                              <Check className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Claims Narrative */}
        <div className="px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#4B5563] mb-1.5" style={{ fontWeight: 700 }}>Claims Narrative</p>
          <textarea
            rows={3}
            value={narrativeVal}
            onChange={() => {}}
            className="w-full text-[11px] text-[#2D2D2D] border border-[#E8E6E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0076BC] resize-y bg-[#FAFAF9] leading-relaxed text-[#5D5D5D]"
            readOnly
          />
          <p className="text-[10px] text-[#9B9B98] mt-1">
            From catalog field &ldquo;Claims History&rdquo;. Edit via the full field list or request a re-extraction.
          </p>
        </div>

        <p className="px-3 py-2 text-[10px] text-[#9B9B98] border-t border-[#E8E6E1]">
          Loss data extracted from broker-provided loss run. Edited cells highlighted amber. Verify each row before proceeding.
        </p>
      </div>
    </div>
  );
}

/* ── SOV Ingestion View helpers ── */
const SOV_CAT_MODEL_CFG: Record<SovLocation["catModel"], { label: string; bg: string; text: string; border: string }> = {
  Modelled: { label: "Modelled", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Pending:  { label: "Pending",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  Required: { label: "Required", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
};
const SOV_HEALTH_CHECK_CFG: Record<SovLocation["healthCheck"], { label: string; bg: string; text: string; border: string }> = {
  Pass:   { label: "Pass",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Flag:   { label: "Flag",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  Review: { label: "Review", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
};
const SOV_HAZARD_GRADE_CFG = {
  A: { label: "A", bg: "bg-[#EEF6FF]", text: "text-[#0076BC]", border: "border-[#C2DFF4]" },
  B: { label: "B", bg: "bg-[#F0FDF4]", text: "text-[#15803D]", border: "border-[#BBF7D0]" },
  C: { label: "C", bg: "bg-[#FFF7ED]", text: "text-[#C2410C]", border: "border-[#FED7AA]" },
  D: { label: "D", bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", border: "border-[#FECACA]" },
} as const;
function sovHazardGrade(score: number): keyof typeof SOV_HAZARD_GRADE_CFG {
  if (score <= 50) return "A";
  if (score <= 65) return "B";
  if (score <= 75) return "C";
  return "D";
}
const sovNaCell = <span className="text-[#C4C2BE] text-[11px]">— N/A</span>;
function sovTxt(v: string | number | undefined | null) {
  if (v === undefined || v === null || String(v).trim() === "") return sovNaCell;
  return <span className="text-[#5D5D5D]">{v}</span>;
}
function sovHazardCell(l: SovLocation) {
  const band = BAND_STYLE[hazardBand(l.hazard)];
  const g = SOV_HAZARD_GRADE_CFG[sovHazardGrade(l.hazard)];
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-extrabold ${g.bg} ${g.text} ${g.border}`}>{sovHazardGrade(l.hazard)}</span>
      <span className={`text-[11px] tabular-nums ${band.text}`} style={{ fontWeight: 600 }}>{l.hazard}</span>
    </div>
  );
}
function sovBadgeCell(cfg: { label: string; bg: string; text: string; border: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 600 }}>{cfg.label}</span>;
}

type SovSortKey = "tiv" | "hazard";
type SovUpdate = (patch: Partial<SovLocation>) => void;
interface SovIngestionField {
  label: string;
  sortKey?: SovSortKey;
  /* summary=true fields are always read-only (collapsed group view) */
  summary?: true;
  render: (l: SovLocation, update: SovUpdate, origL: SovLocation) => ReactNode;
}
interface SovIngestionCategory {
  key: string;
  label: string;
  summary: SovIngestionField;
  fields: SovIngestionField[];
}

/* Inline cell editor for the SOV roster table */
function SovEditCell({ type, value, onChange, options, min, max, placeholder }: {
  type: "text" | "numeric" | "year" | "currency" | "select";
  value: string | number | undefined;
  onChange: (v: string) => void;
  options?: string[];
  min?: number; max?: number;
  placeholder?: string;
}) {
  const strVal = value !== undefined && value !== null ? String(value) : "";
  const base = "block text-[11px] text-[#2D2D2D] bg-transparent focus:outline-none border border-transparent rounded px-1 py-0.5 transition-colors hover:border-[#C9C7C1] focus:border-[#0076BC] focus:bg-white focus:ring-1 focus:ring-[#0076BC]/30 min-w-[56px] w-full";
  if (type === "select" && options) {
    return (
      <select value={strVal} onChange={e => onChange(e.target.value)}
        className={base + " cursor-pointer pr-4 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%228%22 height=%225%22><path d=%22M0 0l4 5 4-5%22 fill=%22%239B9B98%22/></svg>')] bg-no-repeat bg-[right_4px_center]"}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "currency") {
    return (
      <div className="inline-flex items-center gap-0.5 w-full">
        <span className="text-[10px] text-[#9B9B98] flex-shrink-0">$</span>
        <input type="text" value={strVal.replace(/^\$/, "")} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          className={base + " tabular-nums flex-1"} />
      </div>
    );
  }
  return (
    <input
      type={type === "year" || type === "numeric" ? "number" : "text"}
      value={strVal} onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      min={min} max={max}
      className={base + " tabular-nums"} />
  );
}

const SOV_TOTALS_TILES: { label: string; catalogLabel: string }[] = [
  { label: "Total TIV",       catalogLabel: "Total insured value (TIV)" },
  { label: "Building Value",  catalogLabel: "Building value (total)" },
  { label: "Contents Value",  catalogLabel: "Contents value (total)" },
  { label: "BI Value",        catalogLabel: "Business interruption (BI) value" },
  { label: "Mach. & Equip",  catalogLabel: "Machinery & equipment value" },
  { label: "Locations",       catalogLabel: "Number of locations" },
  { label: "Buildings",       catalogLabel: "Number of buildings" },
  { label: "Floor Area (sqft)", catalogLabel: "Total floor area (sq ft)" },
  { label: "Valuation Basis", catalogLabel: "Valuation Basis (RC / ACV / AV)" },
  { label: "Coinsurance",     catalogLabel: "Coinsurance" },
  { label: "BI Indemnity",    catalogLabel: "BI Indemnity Period" },
  { label: "BI Waiting",      catalogLabel: "BI Waiting Period" },
];

function SovIngestionView({
  sov,
  lossHistory,
  fields,
  values,
  verified,
  setVerified,
  fieldKey,
}: {
  sov: SubmissionExtras["sov"];
  lossHistory: SubmissionExtras["lossHistory"];
  fields: CatalogField[];
  values: Record<string, string>;
  verified: Set<string>;
  setVerified: Dispatch<SetStateAction<Set<string>>>;
  fieldKey: (f: CatalogField) => string;
}) {
  const [sortCol, setSortCol] = useState<SovSortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["construction"]));
  const [verifiedRows, setVerifiedRows] = useState<Set<string>>(new Set());
  const [editedLocs, setEditedLocs] = useState<Record<string, Partial<SovLocation>>>({});
  const [searchQ, setSearchQ] = useState("");

  const [sovLocations, setSovLocations] = useState<SovLocation[]>(sov.locations ?? []);
  const [sovLoading, setSovLoading] = useState(!!(sov.locationsLoader && !(sov.locations?.length)));
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sov.locationsLoader && !(sov.locations?.length)) {
      sov.locationsLoader().then(locs => { setSovLocations(locs); setSovLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setVisibleCount(20); }, [sortCol, sortDir, searchQ]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 50); },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sovLocations.length]);

  function toggleSort(col: SovSortKey) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }
  function toggleCat(key: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function toggleRow(loc: string) {
    setVerifiedRows(prev => {
      const next = new Set(prev);
      next.has(loc) ? next.delete(loc) : next.add(loc);
      return next;
    });
  }
  function makeUpdater(locName: string): SovUpdate {
    return (patch) => setEditedLocs(prev => ({
      ...prev,
      [locName]: { ...(prev[locName] ?? {}), ...patch },
    }));
  }

  const lossLocMap = new Map<string, LossLocation>();
  lossHistory.topLocations.forEach(l => lossLocMap.set(l.loc, l));

  const rows = sovLocations;
  const sorted = [...rows]
    .filter(l => {
      if (!searchQ) return true;
      const q = searchQ.toLowerCase();
      return [l.loc, l.state, l.construction, l.occupancy].some(v => String(v ?? "").toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const ea = { ...a, ...(editedLocs[a.loc] ?? {}) };
      const eb = { ...b, ...(editedLocs[b.loc] ?? {}) };
      const va = sortCol === "tiv" ? parseTIV(ea.tiv) : ea.hazard;
      const vb = sortCol === "tiv" ? parseTIV(eb.tiv) : eb.hazard;
      return sortDir === "desc" ? vb - va : va - vb;
    });

  /* ── Cell helpers — show amber tint when value differs from original ── */
  function cellCls(edited: boolean) {
    return `px-1.5 py-1.5 align-top whitespace-nowrap${edited ? " bg-amber-50/60" : ""}`;
  }

  /* ── Category definitions with typed editable renders ── */
  const CONSTRUCTION_OPTS = ["Frame", "Joisted Masonry", "Light Noncombustible", "Masonry Noncombustible", "Modified Fire Resistive", "Fire Resistive"];
  const ISO_CLASS_OPTS = ["Class 1 — Frame", "Class 2 — Joisted Masonry", "Class 3 — Light Noncombustible", "Class 4 — Masonry NC", "Class 5 — Modified Fire Resistive", "Class 6 — Fire Resistive"];
  const ROOF_TYPE_OPTS = ["Built-up (BUR)", "Metal Standing Seam", "EPDM Membrane", "TPO Membrane", "Modified Bitumen", "Tile", "Shingle — Asphalt", "Other"];
  const SPRINKLER_TYPE_OPTS = ["ESFR", "Wet Pipe", "Dry Pipe", "Pre-Action", "None"];
  const FLOOD_ZONE_OPTS = ["X", "AE", "AH", "AO", "VE", "A", "X500", "D"];
  const HEALTH_CHECK_OPTS: SovLocation["healthCheck"][] = ["Pass", "Flag", "Review"];
  const CAT_MODEL_OPTS: SovLocation["catModel"][] = ["Modelled", "Pending", "Required"];
  const OCCUPANCY_OPTS = ["Light Manufacturing", "Heavy Manufacturing", "Warehouse / Distribution", "Office", "Retail", "Laboratory / R&D", "Data Center", "Hospitality", "Healthcare", "Education", "Mixed Use", "Other"];

  const categories: SovIngestionCategory[] = [
    {
      key: "construction", label: "Construction & Structure",
      summary: { label: "Construction", summary: true,
        render: (l) => <span className="text-[#5D5D5D] text-[11px]">{l.construction}</span> },
      fields: [
        { label: "Construction",
          render: (l, upd, orig) => <SovEditCell type="select" options={CONSTRUCTION_OPTS} value={l.construction}
            onChange={v => upd({ construction: v })} /> },
        { label: "ISO Class",
          render: (l, upd, orig) => <SovEditCell type="select" options={ISO_CLASS_OPTS} value={l.constructionClass ?? ""}
            onChange={v => upd({ constructionClass: v || undefined })} /> },
        { label: "Year Built",
          render: (l, upd, orig) => <SovEditCell type="year" min={1800} max={2026} value={l.yearBuilt}
            onChange={v => upd({ yearBuilt: v ? Number(v) : undefined })} /> },
        { label: "Roof Age (yrs)",
          render: (l, upd, orig) => <SovEditCell type="numeric" min={0} max={100} value={l.roofAge}
            onChange={v => upd({ roofAge: v ? Number(v) : undefined })} /> },
        { label: "Roof Type",
          render: (l, upd, orig) => <SovEditCell type="select" options={ROOF_TYPE_OPTS} value={l.roofType ?? ""}
            onChange={v => upd({ roofType: v || undefined })} /> },
        { label: "Stories",
          render: (l, upd, orig) => <SovEditCell type="numeric" min={1} max={200} value={l.stories}
            onChange={v => upd({ stories: v ? Number(v) : undefined })} /> },
        { label: "Sq Ft",
          render: (l, upd, orig) => <SovEditCell type="numeric" min={0} value={l.sqFt}
            onChange={v => upd({ sqFt: v ? Number(v) : undefined })} /> },
      ],
    },
    {
      key: "protection", label: "Protection",
      summary: { label: "Sprinkler", summary: true,
        render: (l) => <span className="text-[#5D5D5D] text-[11px]">{parsePC(l.protectionCode) <= 3 ? "Sprinklered" : "Non-Sprinklered"}</span> },
      fields: [
        { label: "Spk Type",
          render: (l, upd, orig) => <SovEditCell type="select" options={SPRINKLER_TYPE_OPTS} value={l.sprinklerType ?? ""}
            onChange={v => upd({ sprinklerType: v || undefined })} /> },
        { label: "Prot. Class",
          render: (l, upd, orig) => <SovEditCell type="text" value={l.protectionCode}
            onChange={v => upd({ protectionCode: v })} /> },
        { label: "Health Check",
          render: (l, upd, orig) => <SovEditCell type="select" options={HEALTH_CHECK_OPTS as string[]} value={l.healthCheck}
            onChange={v => upd({ healthCheck: v as SovLocation["healthCheck"] })} /> },
      ],
    },
    {
      key: "valuation", label: "Occupancy & Valuation",
      summary: { label: "TIV", sortKey: "tiv", summary: true,
        render: (l) => <span className="text-[#2D2D2D] tabular-nums text-[11px]" style={{ fontWeight: 600 }}>{l.tiv}</span> },
      fields: [
        { label: "Occupancy",
          render: (l, upd, orig) => <SovEditCell type="select" options={OCCUPANCY_OPTS} value={l.occupancy}
            onChange={v => upd({ occupancy: v })} /> },
        { label: "Building ($)",
          render: (l, upd, orig) => <SovEditCell type="currency" value={l.buildingValue ?? ""}
            onChange={v => upd({ buildingValue: v ? `$${v}` : undefined })} /> },
        { label: "Contents ($)",
          render: (l, upd, orig) => <SovEditCell type="currency" value={l.contentsValue ?? ""}
            onChange={v => upd({ contentsValue: v ? `$${v}` : undefined })} /> },
        { label: "BI ($)",
          render: (l, upd, orig) => <SovEditCell type="currency" value={l.biValue ?? ""}
            onChange={v => upd({ biValue: v ? `$${v}` : undefined })} /> },
        { label: "TIV ($)", sortKey: "tiv",
          render: (l, upd, orig) => <SovEditCell type="currency" value={l.tiv}
            onChange={v => upd({ tiv: v ? `$${v}` : l.tiv })} /> },
      ],
    },
    {
      key: "cat", label: "CAT & Modeling",
      summary: { label: "Hazard", sortKey: "hazard", summary: true,
        render: (l) => sovHazardCell(l) },
      fields: [
        { label: "Flood Zone",
          render: (l, upd, orig) => <SovEditCell type="select" options={FLOOD_ZONE_OPTS} value={l.floodZone ?? ""}
            onChange={v => upd({ floodZone: v || undefined })} /> },
        { label: "Dist. Coast",
          render: (l, upd, orig) => <SovEditCell type="text" value={l.distanceToCoast ?? ""}
            onChange={v => upd({ distanceToCoast: v || undefined })} /> },
        { label: "CAT Model",
          render: (l, upd, orig) => <SovEditCell type="select" options={CAT_MODEL_OPTS as string[]} value={l.catModel}
            onChange={v => upd({ catModel: v as SovLocation["catModel"] })} /> },
        { label: "Hazard Score", sortKey: "hazard",
          render: (l, upd, orig) => <SovEditCell type="numeric" min={0} max={100} value={l.hazard}
            onChange={v => upd({ hazard: v ? Number(v) : l.hazard })} /> },
      ],
    },
    {
      key: "loss", label: "Loss",
      summary: { label: "5yr Paid Loss", summary: true,
        render: l => {
          const rec = lossLocMap.get(l.loc);
          return rec
            ? <span className="inline-flex items-center gap-1 tabular-nums text-[11px]"><span className="text-amber-700" style={{ fontWeight: 600 }}>{rec.paid}</span><span className="text-[10px] text-[#9B9B98]">{rec.count}×</span></span>
            : <span className="text-[#C4C2BE] text-[11px]">—</span>;
        },
      },
      fields: [
        { label: "5yr Paid Loss",
          render: l => {
            const rec = lossLocMap.get(l.loc);
            return rec
              ? <span className="inline-flex items-center gap-1 tabular-nums text-[11px]"><span className="text-amber-700" style={{ fontWeight: 600 }}>{rec.paid}</span><span className="text-[10px] text-[#9B9B98]">{rec.count}×</span></span>
              : <span className="text-[#C4C2BE] text-[11px]">—</span>;
          },
        },
      ],
    },
  ];

  const visible = categories.map(c => ({
    cat: c,
    expanded: expandedCats.has(c.key),
    fields: expandedCats.has(c.key) ? c.fields : [c.summary],
  }));

  const renderFieldTh = (f: SovIngestionField, key: string) => {
    const isSortable = !!f.sortKey;
    const isActive = f.sortKey && sortCol === f.sortKey;
    return (
      <th key={key}
        onClick={isSortable ? () => toggleSort(f.sortKey!) : undefined}
        className={`text-left px-2 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap select-none ${isSortable ? "cursor-pointer hover:bg-[#EAE9E6]" : ""} ${isActive ? "text-[#0076BC]" : ""}`}
        style={{ fontWeight: 700 }}>
        {f.label}{isActive ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
      </th>
    );
  };

  function tileValue(catalogLabel: string): string {
    const f = fields.find(cf => cf.label === catalogLabel && cf.doc === "Statement of Values");
    if (!f) return "—";
    const key = fieldKey(f);
    return values[key] ?? f.value ?? "—";
  }
  function tileKey(catalogLabel: string): string {
    const f = fields.find(cf => cf.label === catalogLabel && cf.doc === "Statement of Values");
    return f ? fieldKey(f) : catalogLabel;
  }

  const verifiedTilesCount = SOV_TOTALS_TILES.filter(t => verified.has(tileKey(t.catalogLabel))).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Loading skeleton while lazy SOV data fetches */}
      {sovLoading && (
        <div className="flex flex-col gap-2 p-4 flex-1">
          <div className="text-[11px] text-[#6B7280] font-medium mb-1">
            Loading {sov.stats.locationCount.toLocaleString()} locations…
          </div>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="h-7 rounded bg-[#F0EFEC] animate-pulse" style={{ opacity: 1 - i * 0.055 }} />
          ))}
        </div>
      )}
      {/* SOV Search bar */}
      {!sovLoading && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF9] border-b border-[#E8E6E1] flex-shrink-0">
          <Search className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search location, state, construction, occupancy…"
            className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#C4C2BE]"
            style={{ color: "#2D2D2D" }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="text-[#9B9B98] hover:text-[#5D5D5D]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      {/* Building roster table */}
      {!sovLoading && <div className="flex-1 overflow-auto">
        <table className="text-[11px] border-collapse" style={{ minWidth: "100%" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#EDEBE7]">
              <th rowSpan={2}
                className="sticky left-0 z-30 bg-[#EDEBE7] text-left px-3 py-2 text-[10px] uppercase tracking-wide text-[#4B5563] border-b border-r border-[#E0DDD7] whitespace-nowrap align-bottom"
                style={{ fontWeight: 700 }}>
                Location
              </th>
              {visible.map(({ cat, expanded, fields: vf }) => (
                <th key={cat.key} colSpan={vf.length}
                  className="text-left px-2 py-1.5 border-b border-l border-[#E0DDD7] bg-[#EDEBE7]">
                  <button onClick={() => toggleCat(cat.key)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#334155] hover:text-[#0076BC] transition-colors select-none"
                    style={{ fontWeight: 700 }}>
                    <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                    {cat.label}
                  </button>
                </th>
              ))}
              <th rowSpan={2}
                className="sticky right-0 z-30 bg-[#EDEBE7] text-center px-3 py-2 text-[10px] uppercase tracking-wide text-[#4B5563] border-b border-l border-[#E0DDD7] whitespace-nowrap align-bottom"
                style={{ fontWeight: 700 }}>
                <span className="block">{verifiedRows.size}/{rows.length}</span>
                <span className="text-[8px] text-[#9B9B98]" style={{ fontWeight: 500 }}>verified</span>
              </th>
            </tr>
            <tr className="bg-[#F5F4F1]">
              {visible.map(({ cat, fields: vf }) =>
                vf.map((f, i) => renderFieldTh(f, `${cat.key}-${i}`)),
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, visibleCount).map(origL => {
              const edits = editedLocs[origL.loc] ?? {};
              const l = { ...origL, ...edits };
              const update = makeUpdater(origL.loc);
              const hasEdits = Object.keys(edits).length > 0;
              const isRowV = verifiedRows.has(origL.loc);
              return (
                <tr key={origL.loc}
                  className={`border-b border-[#F0EFEC] last:border-b-0 transition-colors group ${isRowV ? "bg-emerald-50/30" : "hover:bg-[#FAFAF9]"}`}>
                  {/* Sticky location column */}
                  <td className={`sticky left-0 z-20 px-3 py-2 align-middle whitespace-nowrap border-r border-[#EFEEE9] ${isRowV ? "bg-emerald-50/60" : "bg-white group-hover:bg-[#FAFAF9]"}`}
                    style={{ fontWeight: 500 }}>
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div className="text-[#2D2D2D] leading-tight text-[11px]">{l.loc}</div>
                        <div className="text-[10px] text-[#9B9B98]">{l.state}</div>
                      </div>
                      {hasEdits && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0" style={{ fontWeight: 700 }}>
                          edited
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Data cells */}
                  {visible.map(({ cat, fields: vf }) =>
                    vf.map((f, i) => {
                      const isEdited = !f.summary && Object.keys(edits).length > 0;
                      return (
                        <td key={`${cat.key}-${i}`}
                          className={cellCls(isEdited && !f.summary)}>
                          {f.render(l, update, origL)}
                        </td>
                      );
                    }),
                  )}
                  {/* Verify button */}
                  <td className={`sticky right-0 z-20 px-3 py-2 align-middle text-center border-l border-[#EFEEE9] ${isRowV ? "bg-emerald-50/60" : "bg-white group-hover:bg-[#FAFAF9]"}`}>
                    <button
                      onClick={() => toggleRow(origL.loc)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                        isRowV ? "bg-emerald-500 border-emerald-600 text-white" : "border-[#C9C7C1] text-transparent hover:border-[#0076BC]"
                      }`}
                      title={isRowV ? "Mark unverified" : "Verify row"}>
                      <Check className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {visibleCount < sorted.length && (
          <div className="px-3 py-2 text-[10px] text-[#9B9B98] border-t border-[#E8E6E1] bg-[#FAFAF9]">
            Showing {Math.min(visibleCount, sorted.length).toLocaleString()} of {sorted.length.toLocaleString()} locations — scroll to load more
          </div>
        )}
        {visibleCount >= sorted.length && (
          <p className="px-3 py-2 text-[10px] text-[#9B9B98] border-t border-[#E8E6E1]">
            Table extracted from broker-provided SOV. Edited cells are highlighted amber. Verify each row against the source Excel before proceeding.
          </p>
        )}
      </div>}
    </div>
  );
}

/* Repeatable table editor for NWS/EQ deductibles and sublimits */
function RepeatableTable({ schema, value, onChange }: {
  schema: NonNullable<CatalogField["schema"]>;
  value: string;
  onChange: (v: string) => void;
}) {
  type Row = Record<string, string>;
  let rows: Row[] = [];
  try { rows = JSON.parse(value); } catch { rows = [{}]; }

  const blankRow = (): Row => Object.fromEntries(schema.map(s => [s.col, ""]));

  const setRow = (i: number, col: string, val: string) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [col]: val } : r);
    onChange(JSON.stringify(next));
  };
  const addRow = () => onChange(JSON.stringify([...rows, blankRow()]));
  const removeRow = (i: number) => onChange(JSON.stringify(rows.filter((_, idx) => idx !== i)));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-[#F5F4F1]">
            {schema.map(s => (
              <th key={s.col} className="border border-[#E8E6E1] px-1.5 py-1 text-left text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>{s.col}</th>
            ))}
            <th className="border border-[#E8E6E1] w-6" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-[#FAFAF9]">
              {schema.map(s => (
                <td key={s.col} className="border border-[#E8E6E1] px-1 py-0.5">
                  {s.kind === "select" && s.options ? (
                    <select value={row[s.col] ?? ""} onChange={e => setRow(i, s.col, e.target.value)}
                      className="w-full text-[10px] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0076BC] rounded px-0.5">
                      <option value="">—</option>
                      {s.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={row[s.col] ?? ""} onChange={e => setRow(i, s.col, e.target.value)}
                      className="w-full text-[10px] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0076BC] rounded px-0.5 min-w-[48px]" />
                  )}
                </td>
              ))}
              <td className="border border-[#E8E6E1] text-center">
                {rows.length > 1 && (
                  <button onClick={() => removeRow(i)} className="text-[#94A3B8] hover:text-red-500 px-1">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow}
        className="mt-1 flex items-center gap-1 text-[10px] text-[#0076BC] hover:text-[#00205B] transition-colors"
        style={{ fontWeight: 600 }}>
        <span className="text-[14px] leading-none">+</span> Add Row
      </button>
    </div>
  );
}

/* ── Custom document selector dropdown ── */
interface DocOption { doc: string; received: boolean; verified: number; total: number; }

function DocDropdown({ options, value, onChange }: {
  options: DocOption[]; value: string; onChange: (doc: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find(o => o.doc === value) ?? options[0];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-md border text-[11px] transition-colors bg-white ${open ? "border-[#0076BC] shadow-sm" : "border-[#E8E6E1] hover:border-[#C0BFBB]"}`}
        style={{ fontWeight: 500, color: "#2D2D2D", minWidth: 0, maxWidth: "220px" }}
      >
        <FileText className="w-3 h-3 flex-shrink-0 text-[#0076BC]" />
        <span className="truncate">{selected?.doc ?? "—"}</span>
        {selected && !selected.received && (
          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
        )}
        <span className="text-[10px] text-[#9B9B98] tabular-nums flex-shrink-0">
          {selected?.verified}/{selected?.total}
        </span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 text-[#9B9B98] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white border border-[#E8E6E1] rounded-lg shadow-lg py-1 min-w-[220px]"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
          {options.map(opt => {
            const isActive = opt.doc === value;
            const allDone = opt.total > 0 && opt.verified === opt.total;
            return (
              <button
                key={opt.doc}
                onClick={() => { onChange(opt.doc); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${isActive ? "bg-[#0076BC] text-white" : "hover:bg-[#F5F4F1] text-[#2D2D2D]"}`}
              >
                <FileText className={`w-3 h-3 flex-shrink-0 ${isActive ? "text-white" : allDone ? "text-emerald-500" : opt.received ? "text-[#9B9B98]" : "text-[#C9C7C1]"}`} />
                <span className="flex-1 text-[11px] truncate" style={{ fontWeight: isActive ? 600 : 400 }}>{opt.doc}</span>
                {!opt.received && (
                  <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`} style={{ fontWeight: 600 }}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Missing
                  </span>
                )}
                <span className={`text-[10px] tabular-nums flex-shrink-0 ${isActive ? "text-white/80" : allDone ? "text-emerald-600" : "text-[#9B9B98]"}`} style={{ fontWeight: 600 }}>
                  {opt.verified}/{opt.total}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function IngestionStep({ onProceed }: { onProceed: () => void }) {
  const { meta, idx, extras } = useSubmissionCtx();
  const { fields: rawFields, isLoading: fieldsLoading, defaultPreview } = useIngestionFields(meta.id);
  const fields = rawFields ?? [];

  /* Four-level hierarchy: expected document → domain → entity/sub-entity → field */
  const isMockSubmission = fields.some(f => f.doc === "Statement of Values" || f.doc === "Site Photos");
  const docsInOrder = EXPECTED_DOCS.filter(d => fields.some(f => f.doc === d));
  const domainsFor = (doc: string) => {
    const inOrder = DOMAIN_ORDER.filter(dom => fields.some(f => f.doc === doc && f.domain === dom));
    if (inOrder.length > 0) return inOrder;
    // Real API submissions use FIELD_CATALOG ordering — preserve insertion order
    const seen = new Set<string>();
    return fields.filter(f => f.doc === doc).map(f => f.domain).filter(d => {
      if (seen.has(d)) return false; seen.add(d); return true;
    });
  };
  const subEntitiesFor = (doc: string, domain: string) =>
    [...new Set(fields.filter(f => f.doc === doc && f.domain === domain).map(f => f.subEntity))];
  const fieldsFor = (doc: string, domain: string, subEntity: string) =>
    fields.filter(f => f.doc === doc && f.domain === domain && f.subEntity === subEntity);

  // Editable values — initialised from extracted fields, freely editable
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map(f => [fieldKey(f), f.value]))
  );
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [selectedField, setSelectedField] = useState<CatalogField | null>(fields[0] ?? null);
  const [activeDoc, setActiveDoc] = useState<string>(() => docsInOrder[0] ?? "");

  // Sync values/selection when extraction fields load asynchronously (real API submissions)
  useEffect(() => {
    if (!rawFields || rawFields.length === 0) return;
    console.log("[IngestionStep] Extraction fields loaded — syncing values:", rawFields.filter(f => f.value).length, "with values");
    setValues(Object.fromEntries(rawFields.map(f => [fieldKey(f), f.value])));
    const firstDoc = EXPECTED_DOCS.find(d => rawFields.some(f => f.doc === d)) ?? "";
    if (firstDoc) setActiveDoc(firstDoc);
    if (!selectedField) setSelectedField(rawFields[0] ?? null);
  }, [rawFields]);

  // Option B — set right-panel preview from first extraction document (document-level, not field-level)
  useEffect(() => {
    if (!defaultPreview) return;
    console.log("[IngestionStep] Setting default preview from extraction doc:", defaultPreview.docName, defaultPreview.docType);
    setPreviewDoc(defaultPreview.docName);
    setActiveDocType(defaultPreview.docType as DocType);
    setPreviewDocUrl(defaultPreview.docUrl);
  }, [defaultPreview]);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<string>("Application");
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewHighlight, setPreviewHighlight] = useState<string>("");
  const [previewSearchText, setPreviewSearchText] = useState<string | undefined>(undefined);
  const [previewBbox, setPreviewBbox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [previewSheet, setPreviewSheet] = useState<string | undefined>(undefined);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | undefined>(undefined);
  const [citationModal, setCitationModal] = useState<{ ref: CatalogDocRef; citNum: number } | null>(null);
  const [attachmentClassify, setAttachmentClassify] = useState<Record<string, string>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const handleOpenFollowUp = useCallback(() => setShowFollowUp(true), []);

  // Lazy-initialize pdfPages — computed once per submission, cached in ref
  const pdfPagesRef = useRef<Record<string, PdfPage> | null>(null);
  if (!pdfPagesRef.current) pdfPagesRef.current = makePdfPages(meta, idx, extras);
  const getPdfPages = () => pdfPagesRef.current!;

  // Active document type — set when a citation is opened
  const [activeDocType, setActiveDocType] = useState<DocType | null>(null);

  const openCitation = useCallback((ref: CatalogDocRef, fieldValue?: string) => {
    setPreviewDoc(ref.doc);
    setPreviewPage(ref.page);
    setPreviewHighlight(ref.highlightLabel);
    setPreviewSearchText(fieldValue || undefined);
    if (ref.docType) setActiveDocType(ref.docType);
    setPreviewBbox(ref.bbox ?? null);
    setPreviewSheet(ref.sheet);
    setPreviewDocUrl(ref.docUrl);

    const rendererMap: Record<string, string> = {
      pdf:   "pdfjs-dist (canvas render + getTextContent text search)",
      xlsx:  "SheetJS (sheet_to_html → DOM cell highlight)",
      docx:  "mammoth.js (convertToHtml → <mark> injection)",
      image: "HTMLImageElement → Canvas drawImage (bbox overlay)",
      csv:   "PapaParse (table render → DOM cell highlight)",
    };
    const docType = ref.docType ?? "pdf";
    console.groupCollapsed(
      `%c[Citation] %c${ref.doc}%c — ${docType.toUpperCase()} p.${ref.page}${ref.sheet ? ` / sheet: ${ref.sheet}` : ""}`,
      "color:#0076BC;font-weight:bold",
      "color:#1d4ed8;font-weight:bold;text-decoration:underline",
      "color:#6b7280",
    );
    console.log("Document type :", docType);
    console.log("Renderer      :", rendererMap[docType] ?? docType);
    console.log("Doc URL       :", ref.docUrl ?? "(mock — no URL)");
    console.log("Page / Sheet  :", ref.page, ref.sheet ? `| sheet: ${ref.sheet}` : "");
    console.log("Field value   :", fieldValue ?? "(none)");
    console.log("Highlight label:", ref.highlightLabel);
    console.log("Excerpt       :", ref.excerpt);
    if (ref.bbox) console.log("Hard bbox     :", ref.bbox);
    console.groupEnd();
  }, []);

  // On-demand document page — loads lazily, cached per doc
  const { docPage, docLoading } = useDocumentPage(meta.id, previewDoc, getPdfPages, previewDocUrl, activeDocType ?? undefined);

  // Field streaming hook — ready for SSE; currently mirrors full field list
  const { isStreaming } = useFieldStream(meta.id, fields);

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setEdited(prev => { const n = new Set(prev); n.add(key); return n; });
    // editing a field un-verifies it
    setVerified(prev => { const n = new Set(prev); n.delete(key); return n; });
  };

  const validateField = (kind: FieldKind, raw: string): string => {
    const v = raw.trim();
    if (v === "") return "This field cannot be empty";
    switch (kind) {
      case "numeric": {
        const n = Number(v.replace(/,/g, ""));
        return isNaN(n) ? "Must be a valid number" : "";
      }
      case "currency": {
        const n = Number(v.replace(/,/g, ""));
        return isNaN(n) || n < 0 ? "Must be a positive amount (e.g. 1,000,000)" : "";
      }
      case "percent": {
        const n = parseFloat(v);
        if (isNaN(n)) return "Must be a number";
        return n < 0 || n > 100 ? "Must be between 0 and 100" : "";
      }
      case "date":
        return !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v) && !/^\d{1,2} [A-Za-z]+ \d{4}$/.test(v)
          ? "Expected MM/DD/YYYY or DD Mon YYYY" : "";
      default:
        return "";
    }
  };

  const handleBlur = (key: string, kind: FieldKind, raw: string) => {
    setValidationErrors(prev => ({ ...prev, [key]: validateField(kind, raw) }));
  };

  const toggle = (set: Set<string>, key: string, setFn: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  };

  /* Bulk verify every field beneath a node in the hierarchy */
  const verifyGroup = (predicate: (f: CatalogField) => boolean) => {
    const next = new Set(verified);
    fields.filter(predicate).forEach(f => next.add(fieldKey(f)));
    setVerified(next);
  };

  const totalVerified = fields.filter(f => verified.has(fieldKey(f))).length;
  const pct = Math.round((totalVerified / fields.length) * 100);
  const allVerified = totalVerified === fields.length;

  const docsReceived = EXPECTED_DOCS.filter(d => extras.documents.find(x => x.name === d)?.received).length;

  const receivedDocNames = new Set(extras.documents.filter(d => d.received).map(d => d.name));
  // For real API: extracted = fields returned by API (fields.length), total = full catalog (60)
  // For mock: extracted = fields from received docs, total = all fields
  const extractedFields = isMockSubmission
    ? fields.filter(f => receivedDocNames.has(f.doc))
    : fields;
  const catalogTotal = isMockSubmission ? fields.length : FIELD_CATALOG.length;
  const totalCritical = fields.filter(f => f.critical === "Yes").length;
  const extractedCritical = extractedFields.filter(f => f.critical === "Yes").length;
  const missingDocNames = EXPECTED_DOCS.filter(d => !extras.documents.find(x => x.name === d)?.received);

  /* Highest-priority focus: the lowest-confidence field still awaiting verification. */
  const focusField = [...fields]
    .filter(f => !verified.has(fieldKey(f)))
    .sort((a, b) => a.confidence - b.confidence)[0] ?? null;
  const focusOnLowestConfidence = () => {
    if (!focusField) return;
    setSelectedField(focusField);
    setActiveDoc(focusField.doc);
    if (focusField.docRef) openCitation(focusField.docRef, focusField.value);
  };

  const summary = (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="bg-white border border-[#E8E6E1] rounded-md">
        <div className="grid grid-cols-3 divide-x divide-[#E8E6E1]">
          {[
            {
              label: "Fields Extracted",
              value: `${extractedFields.length} / ${catalogTotal}`,
              status: extractedFields.length === catalogTotal ? "good" : extractedFields.length >= catalogTotal * 0.8 ? "watch" : "alert",
            },
            {
              label: "Verified",
              value: `${totalVerified} (${pct}%)`,
              status: totalVerified === fields.length ? "good" : totalVerified > 0 ? "watch" : "alert",
            },
          ].map(stat => {
            const valueColor = stat.status === "good" ? "#059669" : stat.status === "watch" ? "#D97706" : "#DC2626";
            return (
              <div key={stat.label} className="px-3 py-1.5">
                <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: valueColor }}>{stat.value}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Expected documents — select to preview */}
      <div className="bg-white border border-[#E8E6E1] rounded-md p-3 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Documents Received — select to preview</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#9B9B98]">
              <span style={{ fontWeight: 700 }}>{extras.emailBatches.length}</span> email{extras.emailBatches.length !== 1 ? "s" : ""} ·{" "}
              <span style={{ fontWeight: 700 }}>{extras.emailBatches.reduce((s, b) => s + b.attachments.length, 0)}</span> attachments
            </span>
          </div>
        </div>

        {/* Expected doc status cards — 6 across, status on second line */}
        <div className="grid grid-cols-6 gap-1.5">
          {EXPECTED_DOCS.map(docName => {
            const received = extras.documents.find(d => d.name === docName)?.received ?? false;
            const needsReview = extras.documents.find(d => d.name === docName)?.needsReview ?? false;
            const isActive = previewDoc === docName;
            return (
              <button key={docName} onClick={() => { setPreviewDoc(docName); setPreviewPage(1); setPreviewHighlight(""); }}
                className={`flex flex-col gap-0 px-2 py-1.5 rounded-lg border transition-all text-left ${
                  isActive ? "border-[#0076BC] bg-[#EEF6FF]" :
                  received ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300" :
                  "border-[#E8E6E1] bg-[#FAFAF9] hover:border-[#C9C7C1]"
                }`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${received ? "bg-emerald-100" : "bg-[#F0EFEC]"}`}>
                    <FileText className={`w-2.5 h-2.5 ${received ? "text-emerald-600" : "text-[#C9C7C1]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] leading-tight" style={{ fontWeight: 600, color: received ? "#0076BC" : "#9B9B98" }}>{docName}</div>
                    {needsReview && <AlertTriangle className="w-2.5 h-2.5 text-amber-500 mt-0.5" />}
                  </div>
                </div>
                <div>
                  {received
                    ? <span className="text-[8px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>Received</span>
                    : <span className="text-[8px] text-[#9B9B98] bg-[#F0EFEC] px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>Missing</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Email batches */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Submission Emails</div>
          {extras.emailBatches.map(batch => {
            const unclassified = batch.attachments.filter(a => a.classifiedAs === null);
            return (
              <div key={batch.id} className="border border-[#E8E6E1] rounded-lg overflow-hidden">
                {/* Email header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF9]">
                  <Mail className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
                  <span className="text-[10px] text-[#0076BC] flex-shrink-0" style={{ fontWeight: 600 }}>{batch.from}</span>
                  <span className="text-[10px] text-[#4B5563] flex-1 truncate">— {batch.subject}</span>
                  <span className="text-[9px] text-[#9B9B98] flex-shrink-0">{batch.receivedAt}</span>
                  <span className="text-[9px] text-[#9B9B98] flex-shrink-0">
                    <Paperclip className="w-2.5 h-2.5 inline mr-0.5" />{batch.attachments.length}
                  </span>
                </div>
                {/* Attachments */}
                <div className="flex flex-wrap gap-1.5 px-3 py-2">
                  {batch.attachments.map((att, ai) => {
                    const classifyKey = `${batch.id}-${ai}`;
                    const chosen = attachmentClassify[classifyKey] ?? "";
                    const isUnclassified = att.classifiedAs === null;
                    return (
                      <div key={ai} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] ${isUnclassified ? "border-amber-300 bg-amber-50" : "border-[#E8E6E1] bg-white"}`}>
                        <FileText className={`w-3 h-3 flex-shrink-0 ${isUnclassified ? "text-amber-500" : "text-[#0076BC]"}`} />
                        <span className="text-[#4B5563]" style={{ fontWeight: 500 }}>{att.filename}</span>
                        <span className="text-[#9B9B98]">· {att.pageCount}p</span>
                        {att.classifiedAs
                          ? <span className="text-emerald-700 bg-emerald-100 px-1 rounded" style={{ fontWeight: 600 }}>→ {att.classifiedAs}</span>
                          : (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                              <select
                                value={chosen}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setAttachmentClassify(prev => ({ ...prev, [classifyKey]: e.target.value }))}
                                className="text-[9px] border border-amber-300 rounded px-1 py-0.5 bg-white text-[#4B5563] focus:outline-none focus:border-[#0076BC]"
                                style={{ fontWeight: 600 }}>
                                <option value="">Classify…</option>
                                {EXPECTED_DOCS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              {chosen && (
                                <button
                                  onClick={e => { e.stopPropagation(); }}
                                  title="Re-process ingestion with this classification (pending team workflow)"
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0076BC] text-white text-[9px] hover:bg-[#005a8e] transition-colors"
                                  style={{ fontWeight: 600 }}>
                                  <RefreshCw className="w-2.5 h-2.5" /> Re-process
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );

  const hasIngestionFilter = false;

  // ── Virtual scroll: flatten domain→subEntity→field hierarchy for active doc ──
  type FlatItem =
    | { kind: "domain";    domain: string }
    | { kind: "subentity"; domain: string; subEntity: string }
    | { kind: "field";     field: CatalogField; domain: string; subEntity: string };

  const flatItems = useMemo<FlatItem[]>(() => {
    // Only trigger the special SOV/LossHistory views for mock submissions
    const isMockFields = fields.some(f => f.doc === "Statement of Values" || f.doc === "Site Photos");
    if (isMockFields && (activeDoc === "Statement of Values" || activeDoc === "Loss History")) return [];
    const items: FlatItem[] = [];
    for (const domain of domainsFor(activeDoc)) {
      items.push({ kind: "domain", domain });
      for (const subEntity of subEntitiesFor(activeDoc, domain)) {
        // Skip empty subEntity headers (real API submissions have no 3rd-level grouping)
        if (subEntity) items.push({ kind: "subentity", domain, subEntity });
        for (const f of fieldsFor(activeDoc, domain, subEntity)) {
          items.push({ kind: "field", field: f, domain, subEntity });
        }
      }
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDoc, fields]);

  const fieldListRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => fieldListRef.current,
    estimateSize: (i) => {
      const item = flatItems[i];
      if (!item || item.kind === "domain")    return 34;
      if (item.kind === "subentity")          return 30;
      const f = item.field;
      if (f.kind === "textarea")              return 140;
      if (f.kind === "multi-select")          return 100;
      if (f.kind === "repeatable-table")      return 180;
      return 82;
    },
    overscan: 5,
  });

  /* Left pane — domain/subEntity/field hierarchy within */
  const left = (
    <div className="flex flex-col">


      {/* Active tab content — domain → subEntity → field rows */}
      <div ref={fieldListRef} className="flex flex-col">
        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border-b border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-700" style={{ fontWeight: 600 }}>Extracting fields…</span>
          </div>
        )}
        {(fields.some(f => f.doc === "Statement of Values") && activeDoc === "Statement of Values") ? (
          <SovIngestionView
            sov={extras.sov}
            lossHistory={extras.lossHistory}
            fields={fields}
            values={values}
            verified={verified}
            setVerified={setVerified}
            fieldKey={fieldKey}
          />
        ) : (fields.some(f => f.doc === "Statement of Values") && activeDoc === "Loss History") ? (
          <LossHistoryIngestionView
            lossHistory={extras.lossHistory}
            fields={fields}
            values={values}
            verified={verified}
            setVerified={setVerified}
            fieldKey={fieldKey}
          />
        ) : (
          /* Virtual scroll — only renders visible field rows */
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(vRow => {
              const item = flatItems[vRow.index];
              if (!item) return null;
              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${vRow.start}px)` }}
                >
                  {item.kind === "domain" && (() => {
                    const domFields = fields.filter(f => f.doc === activeDoc && f.domain === item.domain);
                    const domVerified = domFields.filter(f => verified.has(fieldKey(f))).length;
                    return (
                      <div className="border-b border-[#E8E6E1]">
                        <div className="px-3 py-1.5 bg-[#FAFAF9] border-b border-[#F0EFEC] flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>{item.domain}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#9B9B98] tabular-nums">{domVerified}/{domFields.length}</span>
                            {domVerified < domFields.length && (
                              <button onClick={() => verifyGroup(f => f.doc === activeDoc && f.domain === item.domain)}
                                className="text-[10px] text-[#0076BC] hover:underline" style={{ fontWeight: 600 }}>
                                Verify all
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {item.kind === "subentity" && (() => {
                    const subFields = fieldsFor(activeDoc, item.domain, item.subEntity);
                    const subVerified = subFields.filter(f => verified.has(fieldKey(f))).length;
                    return (
                      <div className="pl-6 pr-3 py-1 bg-white border-b border-[#F0EFEC] flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-[#6B7280]" style={{ fontWeight: 600 }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0076BC]" />
                          {item.subEntity}
                        </span>
                        <span className="text-[10px] text-[#C9C7C1] tabular-nums">{subVerified}/{subFields.length}</span>
                      </div>
                    );
                  })()}
                  {item.kind === "field" && (() => {
                    const f = item.field;
                    if (f.conditional) {
                      const [condLabel, condValue] = f.conditional.split("=");
                      const condField = fields.find(cf => cf.label === condLabel && cf.doc === f.doc);
                      if (condField) {
                        const condKey = fieldKey(condField);
                        const condCurrent = values[condKey] ?? condField.value;
                        const allowed = condValue.split("|");
                        if (!allowed.includes(condCurrent as string)) return null;
                      }
                    }
                    const key = fieldKey(f);
                    const isV = verified.has(key);
                    const isE = edited.has(key);
                    const isSel = selectedField ? fieldKey(selectedField) === key : false;
                    const currentVal = values[key] ?? f.value;
                    const errMsg = validationErrors[key] ?? "";
                    return (
                      <div key={key}
                        onClick={() => setSelectedField(f)}
                        className={`pl-6 pr-3 py-2.5 transition-colors border-b border-[#F0EFEC] ${isSel ? "bg-[#EEF6FF]" : "hover:bg-[#FAFAF9]"}`}>
                        {/* Label row */}
                        <p className="text-[11px] text-[#4B5563] leading-snug mb-1" style={{ fontWeight: 600 }}>
                          {f.label}
                          <span className="inline-flex items-center align-middle ml-1"><FieldInfoTooltip detail={f.detail} /></span>
                          {isE && !isV && (
                            <span className="inline-flex items-center align-middle gap-0.5 ml-1 px-1 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200" style={{ fontWeight: 700 }}>Edited</span>
                          )}
                        </p>

                        {/* Input + controls row */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Editable extracted value */}
                            {(() => {
                              const hasErr = errMsg.length > 0;
                              const borderCls = hasErr
                                ? "border-red-400 focus:border-red-400"
                                : isV
                                ? "border-emerald-200 focus:border-emerald-400"
                                : "border-[#E8E6E1] focus:border-[#0076BC]";
                              const bgCls = hasErr ? "bg-red-50 text-[#2D2D2D]" : isV ? "bg-emerald-50 text-emerald-800" : "bg-white text-[#2D2D2D]";
                              const cls = `w-full text-[12px] px-2 py-1 rounded border focus:outline-none transition-colors ${borderCls} ${bgCls}`;
                              if (f.kind === "display") return (
                                <div className="w-full text-[12px] px-2 py-1 rounded border border-[#E8E6E1] bg-[#F8F7F4] text-[#6B7280] select-none">
                                  {currentVal}
                                </div>
                              );
                              if (f.kind === "textarea") return (
                                <textarea rows={4} value={currentVal} onClick={e => e.stopPropagation()} onChange={e => updateValue(key, e.target.value)} onBlur={e => handleBlur(key, f.kind, e.target.value)} className={`${cls} resize-y min-h-[72px] max-h-[200px] leading-relaxed`} />
                              );
                              if (f.kind === "repeatable-table" && f.schema) return (
                                <div onClick={e => e.stopPropagation()}>
                                  <RepeatableTable schema={f.schema} value={currentVal} onChange={v => updateValue(key, v)} />
                                </div>
                              );
                              if (f.kind === "multi-select" && f.options) {
                                const selected: string[] = currentVal ? currentVal.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                                const toggleOpt = (opt: string) => {
                                  const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
                                  updateValue(key, next.join(", "));
                                };
                                return (
                                  <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                                    {f.options.map((opt: string) => {
                                      const active = selected.includes(opt);
                                      return (
                                        <button key={opt} type="button" onClick={() => toggleOpt(opt)}
                                          className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${active ? "bg-[#0076BC] border-[#0076BC] text-white" : "bg-white border-[#C8C6C1] text-[#5A5955] hover:border-[#0076BC] hover:text-[#0076BC]"}`}
                                          style={{ fontWeight: active ? 700 : 400 }}>
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              if (f.kind === "select" && f.options) return (
                                <select value={currentVal} onClick={e => e.stopPropagation()} onChange={e => updateValue(key, e.target.value)} onBlur={e => handleBlur(key, f.kind, e.target.value)} className={cls}>
                                  {(f.options.includes(currentVal) ? f.options : [currentVal, ...f.options]).map(o => <option key={o}>{o}</option>)}
                                </select>
                              );
                              if (f.kind === "currency") return (
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9B9B98]">$</span>
                                  <input type="text" value={currentVal.replace(/^\$/, "")} onClick={e => e.stopPropagation()} onChange={e => updateValue(key, e.target.value)} onBlur={e => handleBlur(key, f.kind, e.target.value)} className={`${cls} pl-5 pr-2`} />
                                </div>
                              );
                              if (f.kind === "percent") return (
                                <div className="relative">
                                  <input type="text" value={currentVal.replace(/%$/, "")} onClick={e => e.stopPropagation()} onChange={e => updateValue(key, e.target.value)} onBlur={e => handleBlur(key, f.kind, e.target.value)} className={`${cls} pr-6`} />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9B9B98]">%</span>
                                </div>
                              );
                              return (
                                <input type="text" inputMode={f.kind === "numeric" ? "numeric" : undefined} value={currentVal} onClick={e => e.stopPropagation()} onChange={e => updateValue(key, e.target.value)} onBlur={e => handleBlur(key, f.kind, e.target.value)} className={cls} />
                              );
                            })()}
                            {errMsg && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                                <span className="text-[10px] text-red-600" style={{ fontWeight: 500 }}>{errMsg}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-[#C9C7C1]">Source: {f.doc}</span>
                            </div>
                          </div>

                          {/* Controls: citation + flag + verify */}
                          <div className="flex items-center gap-1 flex-shrink-0 self-start">
                            {f.docRef && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openCitation(f.docRef!, f.value); }}
                                className={`h-6 px-1.5 rounded border flex items-center gap-0.5 text-[9px] transition-colors ${previewDoc === f.docRef.doc && previewHighlight === f.docRef.highlightLabel ? "bg-[#0076BC] border-[#0076BC] text-white" : "border-[#C2DFF4] bg-[#EEF6FF] text-[#0076BC] hover:bg-[#C2DFF4]"}`}
                                title={`View in ${f.docRef.doc}, page ${f.docRef.page}`}
                                style={{ fontWeight: 700 }}>
                                <FileText className="w-2.5 h-2.5" />
                                p{f.docRef.page}
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); if (!errMsg) toggle(verified, key, setVerified); }}
                              disabled={!!errMsg}
                              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${errMsg ? "opacity-30 cursor-not-allowed border-[#E8E6E1]" : isV ? "bg-emerald-100 border-emerald-300" : "border-[#E8E6E1] hover:bg-emerald-50"}`}
                              title={errMsg ? "Fix validation errors before verifying" : "Mark as verified"}>
                              <Check className={`w-3 h-3 ${!errMsg && isV ? "text-emerald-600" : "text-[#C9C7C1]"}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* Right pane — source document / citation preview */
  const right = (
    <div className="flex flex-col h-full">
      {/* Citation banner */}
      {previewHighlight && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-amber-800 flex-1" style={{ fontWeight: 600 }}>
            Source for: {previewHighlight}
          </span>
          <button onClick={() => setPreviewHighlight("")} className="text-amber-500 hover:text-amber-700">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Document viewer — PDF / Word / Excel / Image chrome */}
      {(() => {
        // Determine viewer type — prefer explicit docType from citation, fallback to name-based
        const WORD_DOCS  = new Set(["Application", "Coverage Request", "Primary Policy"]);
        const EXCEL_DOCS = new Set(["Statement of Values", "Loss History"]);
        const IMAGE_DOCS = new Set(["Site Photos"]);
        const resolvedType: DocType = activeDocType
          ?? (IMAGE_DOCS.has(previewDoc) ? "image" : EXCEL_DOCS.has(previewDoc) ? "xlsx" : WORD_DOCS.has(previewDoc) ? "docx" : "pdf");
        const page = docPage;
        const notReceived = !page;

        // Option D — show spinner while extraction fields are loading (before defaultPreview is known)
        if (fieldsLoading) {
          return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0076BC] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <div className="text-[11px] text-[#9B9B98]">Loading documents…</div>
              </div>
            </div>
          );
        }

        if (docLoading) {
          return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0076BC] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <div className="text-[11px] text-[#9B9B98]">Loading document…</div>
              </div>
            </div>
          );
        }
        if (docPage?.renderCanvas) {
          return (
            <DocCanvasViewer
              page={docPage}
              bbox={previewBbox}
              highlightLabel={previewHighlight}
              searchText={previewSearchText}
              docType={resolvedType}
              pageNum={previewPage}
              sheet={previewSheet}
            />
          );
        }
        // Real XLSX / DOCX / CSV documents loaded from blob/local URL
        const hasHtmlContent = (docPage as Record<string,unknown> | null)?.sheetHtml
          || (docPage as Record<string,unknown> | null)?.docHtml
          || (docPage as Record<string,unknown> | null)?.csvRows;
        if (hasHtmlContent && docPage) {
          return (
            <DocHtmlViewer
              page={docPage as PdfPage & Record<string, unknown>}
              docType={resolvedType}
              highlightLabel={previewHighlight}
              searchText={previewSearchText}
              sheet={previewSheet}
              pageNum={previewPage}
            />
          );
        }
        if (resolvedType === "image") {
          return (
            <div className="flex-1 flex flex-col bg-[#1C1C1C] overflow-hidden">
              <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2" style={{ background: "#2D2D2D" }}>
                <Camera className="w-4 h-4 text-white opacity-70" />
                <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>{page?.title ?? previewDoc}</span>
                <span className="ml-auto text-[10px] text-white opacity-40">4 photos</span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                {notReceived ? (
                  <div className="text-center py-12">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-white opacity-20" />
                    <div className="text-[11px] text-[#9B9B98]">Photos not yet received</div>
                  </div>
                ) : page.content(previewHighlight)}
              </div>
            </div>
          );
        }
        if (resolvedType === "xlsx") {
          const sheetTabs: Record<string, string[]> = {
            "Statement of Values": ["Locations", "Summary", "Hazard"],
            "Loss History":        ["Claims", "Annual Summary", "Index"],
          };
          const tabs = sheetTabs[previewDoc] ?? ["Sheet1"];
          return (
            <div className="flex-1 flex flex-col bg-[#E8F0EB] overflow-hidden">
              <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2" style={{ background: "#217346" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center bg-white" style={{ color: "#217346" }}>
                  <span className="text-[9px]" style={{ fontWeight: 800 }}>X</span>
                </div>
                <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>{page?.title ?? previewDoc}</span>
                <span className="ml-auto text-[10px] text-white opacity-60">.xlsx</span>
              </div>
              <div className="flex-shrink-0 px-2 py-1 bg-white border-b border-[#C8C8C8] flex items-center gap-2">
                <div className="px-2 py-0.5 border border-[#C8C8C8] rounded text-[10px] text-[#5D5D5D] w-14 text-center tabular-nums">A1</div>
                <div className="w-px h-4 bg-[#C8C8C8]" />
                <span className="text-[11px] text-[#2D2D2D] flex-1">{previewHighlight || ""}</span>
              </div>
              <div className="flex-1 overflow-auto bg-white p-3" style={{ fontFamily: "Calibri, sans-serif" }}>
                {notReceived ? (
                  <div className="text-center py-12 text-[#9B9B98] text-[11px]"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />Document not yet received</div>
                ) : page.content(previewHighlight)}
              </div>
              <div className="flex-shrink-0 flex items-end gap-0 px-2 pt-1 border-t border-[#C8C8C8] bg-[#F2F2F2]">
                {tabs.map((tab, i) => (
                  <div key={tab} className={`px-3 py-1 text-[10px] border-l border-r border-t rounded-t select-none cursor-pointer ${i === 0 ? "bg-white border-[#C8C8C8] text-[#217346]" : "bg-[#D8E8DC] border-[#B8D0BC] text-[#5D5D5D] hover:bg-[#E8F0EB]"}`} style={{ fontWeight: i === 0 ? 700 : 400 }}>{tab}</div>
                ))}
              </div>
            </div>
          );
        } else if (resolvedType === "docx") {
          return (
            <div className="flex-1 flex flex-col bg-[#E8EDF2] overflow-hidden">
              <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2" style={{ background: "#2B579A" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center bg-white" style={{ color: "#2B579A" }}>
                  <span className="text-[9px]" style={{ fontWeight: 800 }}>W</span>
                </div>
                <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>{page?.title ?? previewDoc}</span>
                <span className="ml-auto text-[10px] text-white opacity-60">.docx</span>
              </div>
              <div className="flex-shrink-0 h-4 bg-[#F2F2F2] border-b border-[#C8C8C8] flex items-center px-8">
                {[1,2,3,4,5,6,7].map(n => (
                  <div key={n} className="flex-1 border-l border-[#C8C8C8] h-2 relative">
                    <span className="absolute -top-0.5 left-0.5 text-[7px] text-[#9B9B98]">{n}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-auto py-4 px-6">
                <div className="bg-white shadow-md mx-auto pb-10 relative" style={{ maxWidth: 340, fontFamily: "Calibri, 'Segoe UI', sans-serif", padding: "28px 32px" }}>
                  {notReceived ? (
                    <div className="text-center py-16 text-[#9B9B98] text-[11px]"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />Document not yet received</div>
                  ) : page.content(previewHighlight)}
                  <div className="absolute bottom-4 left-8 right-8 border-t border-[#E8E6E1] pt-1.5 flex justify-between">
                    <span className="text-[7px] text-[#C9C7C1]">{meta.namedInsured} · {meta.id}</span>
                    <span className="text-[7px] text-[#C9C7C1]">Page {previewPage} of {page?.pageCount ?? 1}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 px-3 py-0.5 flex items-center gap-4" style={{ background: "#2B579A" }}>
                <span className="text-[9px] text-white opacity-70">Page {previewPage} of {page?.pageCount ?? 1}</span>
                <span className="ml-auto text-[9px] text-white opacity-70">100%</span>
              </div>
            </div>
          );
        } else if (resolvedType === "html") {
          console.log("[IngestionStep] Rendering HTML email preview panel", { previewDocUrl, previewSearchText, previewHighlight });
          if (!previewDocUrl) {
            return (
              <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
                <div className="text-center text-[11px] text-[#9B9B98]">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No document URL available
                </div>
              </div>
            );
          }
          return (
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F3F4F6" }}>
              <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2" style={{ background: "#374151" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center bg-white">
                  <span className="text-[9px] font-bold" style={{ color: "#374151" }}>@</span>
                </div>
                <span className="text-white text-[11px] font-semibold">{previewDoc}</span>
                <span className="ml-auto text-[10px] text-white opacity-60">.html</span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <HtmlEmailViewer
                  docUrl={previewDocUrl}
                  excerpt={previewSearchText}
                  highlightLabel={previewHighlight}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex-1 bg-[#6B7280] p-3 overflow-auto">
              <div className="bg-white rounded shadow-xl mx-auto min-h-[500px] p-6 relative" style={{ maxWidth: 360, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                <div className="flex items-start justify-between mb-5 pb-3 border-b-2 border-[#2D2D2D]">
                  <div>
                    <div className="text-[8px] uppercase tracking-[0.15em] text-[#6B7280]" style={{ fontFamily: "sans-serif" }}>QBE INSURANCE GROUP</div>
                    <div className="text-[9px] text-[#6B7280] mt-0.5" style={{ fontFamily: "sans-serif" }}>Commercial Property Underwriting</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] text-[#9B9B98]" style={{ fontFamily: "sans-serif" }}>CONFIDENTIAL</div>
                    <div className="text-[7px] text-[#9B9B98]" style={{ fontFamily: "sans-serif" }}>Page {previewPage}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "sans-serif" }}>
                  {notReceived ? (
                    <div className="text-center py-12 text-[#9B9B98] text-[11px]"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />Document not yet received</div>
                  ) : page.content(previewHighlight)}
                </div>
                <div className="absolute bottom-4 left-6 right-6 border-t border-[#E8E6E1] pt-2 flex justify-between">
                  <span className="text-[7px] text-[#C9C7C1]" style={{ fontFamily: "sans-serif" }}>{meta.submissionDate} · {meta.id}</span>
                  <span className="text-[7px] text-[#C9C7C1]" style={{ fontFamily: "sans-serif" }}>Page {previewPage} of {page?.pageCount ?? 1}</span>
                </div>
              </div>
            </div>
          );
        }
      })()}
    </div>
  );

  return (
    <>
      {/* Citation modal */}
      {citationModal && (
        <CitationModal
          docRef={citationModal.ref}
          citNum={citationModal.citNum}
          pdfPages={getPdfPages()}
          meta={{ id: meta.id, namedInsured: meta.namedInsured, submissionDate: meta.submissionDate }}
          onClose={() => setCitationModal(null)}
        />
      )}
      {/* Follow Up modal */}
      {showFollowUp && createPortal(
        <FollowUpModal
          broker={meta.broker}
          brokerageHouse={meta.brokerageHouse}
          accountName={meta.accountName}
          submissionId={meta.id}
          missingDocs={missingDocNames}
          onClose={() => setShowFollowUp(false)}
        />,
        document.body
      )}
      {/* Actions registered to top bar */}
      <IngestionActions
        allVerified={allVerified} missingDocCount={missingDocNames.length}
        onProceed={onProceed} onFollowUp={handleOpenFollowUp}
      />
      <StepShell
        summary={summary}
        leftWidth="56%"
        scrollToSourceOn={selectedField ? fieldKey(selectedField) : null}
        leftHeader={
          <div className="flex items-center justify-between w-full min-w-0 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-[#2D2D2D] flex-shrink-0" style={{ fontWeight: 600 }}>Extracted Fields</span>
              <span className="text-[10px] text-[#9B9B98] truncate min-w-0 hidden sm:block">· click a citation number to preview the source</span>
            </div>
            <DocDropdown
              value={activeDoc}
              onChange={setActiveDoc}
              options={docsInOrder.map(doc => {
                const allDocFields = fields.filter(f => f.doc === doc);
                return {
                  doc,
                  received: extras.documents.find(d => d.name === doc)?.received ?? false,
                  verified: allDocFields.filter(f => verified.has(fieldKey(f))).length,
                  total: allDocFields.length,
                };
              })}
            />
          </div>
        }
        left={left}
        rightHeader={(() => {
          const WORD_DOCS  = new Set(["Application", "Coverage Request", "Primary Policy"]);
          const EXCEL_DOCS = new Set(["Statement of Values", "Loss History"]);
          const IMAGE_DOCS = new Set(["Site Photos"]);
          const resolvedType: DocType = activeDocType
            ?? (IMAGE_DOCS.has(previewDoc) ? "image" : EXCEL_DOCS.has(previewDoc) ? "xlsx" : WORD_DOCS.has(previewDoc) ? "docx" : "pdf");
          const docTypeCfg =
            resolvedType === "xlsx"  ? { label: "XLSX", bg: "#217346", fg: "white" } :
            resolvedType === "docx"  ? { label: "DOCX", bg: "#2B579A", fg: "white" } :
            resolvedType === "image" ? { label: "IMG",  bg: "#374151", fg: "white" } :
            resolvedType === "html"  ? { label: "HTML", bg: "#374151", fg: "white" } :
                                       { label: "PDF",  bg: "#D93025", fg: "white" };
          return (
            <>
              <span className="px-1.5 py-0.5 rounded text-[9px] flex-shrink-0" style={{ background: docTypeCfg.bg, color: docTypeCfg.fg, fontWeight: 700 }}>{docTypeCfg.label}</span>
              <PaneTitle title={docPage?.title ?? previewDoc} />
              <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                <button onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#4B5563]">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-[#6B7280] tabular-nums w-14 text-center">
                  {previewPage} / {docPage?.pageCount ?? 1}
                </span>
                <button onClick={() => setPreviewPage(p => Math.min(docPage?.pageCount ?? 1, p + 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#F0EFEC] hover:bg-[#E8E6E1] text-[#4B5563]">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </>
          );
        })()}
        right={right}
      />
    </>
  );
}

function IngestionActions({ allVerified, missingDocCount, onProceed, onFollowUp }: {
  allVerified: boolean; missingDocCount: number;
  onProceed: () => void; onFollowUp: () => void;
}) {
  useStepActions([
    ...(missingDocCount > 0 ? [{ icon: Mail, label: "Request Missing Information", variant: "secondary" as const, onClick: onFollowUp }] : []),
    { icon: ChevronRight, label: "Proceed to Triage", variant: "secondary" as const, onClick: onProceed },
  ], [allVerified, missingDocCount, onFollowUp]);
  return null;
}

type FollowUpTab = "document" | "information";

function FollowUpModal({ broker, brokerageHouse, accountName, submissionId, missingDocs, onClose }: {
  broker: string; brokerageHouse: string; accountName: string; submissionId: string;
  missingDocs: string[]; onClose: () => void;
}) {
  const brokerEmail = `${broker.toLowerCase().replace(/\s+/g, ".")}@${brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;
  const disclaimer = `\n\n---\nPlease do not modify the submission reference (${submissionId}) when replying to this email. It is used to track correspondence against this account.`;

  const subjects: Record<FollowUpTab, string> = {
    document:    `[Action Required] Outstanding Documents — ${accountName} (${submissionId})`,
    information: `[Action Required] Additional Information Required — ${accountName} (${submissionId})`,
  };

  const defaultBodies: Record<FollowUpTab, string> = {
    document: [
      `Hi ${broker},`,
      ``,
      `Thank you for submitting ${accountName} for our review. To complete our underwriting assessment, we require the following outstanding document${missingDocs.length !== 1 ? "s" : ""}:`,
      ``,
      `Submission Reference: ${submissionId}`,
      ``,
      ...missingDocs.map(d => `  • ${d} — not yet received`),
      ``,
      `Please arrange for the above to be provided at your earliest convenience. Our ability to proceed to rating is contingent on receipt of these items.`,
      ``,
      `Kind regards,`,
      `QBE Underwriting`,
    ].join("\n") + disclaimer,
    information: [
      `Hi ${broker},`,
      ``,
      `We are progressing our review of the ${accountName} submission and have identified items that require clarification or additional detail:`,
      ``,
      `Submission Reference: ${submissionId}`,
      ``,
      `  • Please confirm the accuracy of the values submitted for key exposure fields.`,
      `  • Provide any supporting commentary for items marked as requiring review.`,
      ``,
      `Your prompt response will help us avoid any delay in our assessment.`,
      ``,
      `Kind regards,`,
      `QBE Underwriting`,
    ].join("\n") + disclaimer,
  };

  const [bodies, setBodies] = useState<Record<FollowUpTab, string>>({ ...defaultBodies });

  const handleOpenDraft = () => {
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(brokerEmail)}&subject=${encodeURIComponent(subjects["document"])}&body=${encodeURIComponent(bodies["document"])}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Draft opened — ${broker}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <Mail className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>Request Missing Information</div>
              <div className="text-[10px] text-[#9B9B98]">{broker} · {brokerageHouse}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>


        {/* Recipient + Subject */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#F0EFEC] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>To</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate" style={{ fontWeight: 600 }}>
              {broker} &lt;{brokerEmail}&gt;
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0 mt-1" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563]">{subjects["document"]}</span>
          </div>
        </div>

        {/* Editable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            value={bodies["document"]}
            onChange={e => setBodies(prev => ({ ...prev, document: e.target.value }))}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            rows={14}
            spellCheck
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">Cancel</button>
          <button onClick={handleOpenDraft}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
            style={{ fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" />
            Open Draft Email
          </button>
        </div>
      </div>
    </div>
  );
}


