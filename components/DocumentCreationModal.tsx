"use client";
import { useState } from "react";
import {
  X, FileText, Mail, Send, Download, Edit3,
  AlertTriangle, ChevronRight, Shield, Building2, FileCheck,
  Gavel, ClipboardList, FileSpreadsheet, FileType2, Eye,
} from "lucide-react";
import type { SubmissionIndexEntry } from "./CustomerTable";

/* ── Types ── */
interface SubmissionMeta {
  id: string; accountName: string; namedInsured: string;
  broker: string; brokerageHouse: string; type: string; coverageType: string;
  tiv: string; tivFull: string; territory: string; locations: string;
  inceptionDate: string; submissionDate: string; naics: string; industry: string;
  summary: string;
}
interface SubmissionExtras {
  focusNote: string;
  request: { perils: string[]; limitsSought: string; qbeLayer: string; valuationMethod: string };
  documents: { name: string; received: boolean; reviewReason?: string }[];
  sov: { stats: { topState: string; avgHazard: number }; completenessPct: number };
  lossHistory: { lossRatio: string; lossRatioBand: string };
  hazardByConstruction?: string;
  hazardByOccupancy?: string;
}

interface DocTemplate {
  id: string;
  label: string;
  tag: "Broker" | "Internal" | "Regulatory" | "Policy";
  icon: typeof Mail;
  description: string;
  sources: string[];
}

interface StageConfig {
  stageKey: number;
  stageLabel: string;
  sectionTitle: string;
  docs: DocTemplate[];
}

/* ── Source document type classification ── */
const EXCEL_SOURCES = new Set(["SOV Data", "Rating Engine"]);
const WORD_SOURCES  = new Set(["AI Draft — v1.0", "UW Analysis", "T&C", "Signed Proposal"]);
const INTERNAL_SOURCES = new Set(["Clearance System", "OFAC Screen", "Rating Engine"]);

function sourceType(name: string): "excel" | "word" | "pdf" | "internal" {
  if (INTERNAL_SOURCES.has(name)) return "internal";
  if (EXCEL_SOURCES.has(name))    return "excel";
  if (WORD_SOURCES.has(name))     return "word";
  return "pdf";
}

function sourceExt(name: string): string {
  const t = sourceType(name);
  if (t === "excel")    return ".xlsx";
  if (t === "word")     return ".docx";
  if (t === "internal") return "internal";
  return ".pdf";
}

/* ── Stage document definitions ── */
function buildStageConfigs(
  meta: SubmissionMeta,
  idx: SubmissionIndexEntry,
  extras: SubmissionExtras,
): StageConfig[] {
  const missingDocs = extras.documents.filter((d) => !d.received).map((d) => d.name);
  const flaggedDocs = extras.documents.filter((d) => d.received && d.reviewReason);

  return [
    {
      stageKey: 2, stageLabel: "Triage", sectionTitle: "TRIAGE DOCUMENTS",
      docs: [
        {
          id: "tri-ofac", label: "OFAC / Clearance Notice", tag: "Internal",
          icon: Shield, description: "Internal operations notice confirming OFAC and clearance status.",
          sources: ["AI Draft — v1.0", "Clearance System", "OFAC Screen"],
        },
      ],
    },
    {
      stageKey: 3, stageLabel: "UW Analysis", sectionTitle: "UW ANALYSIS DOCUMENTS",
      docs: [
        {
          id: "uwa-quote", label: "Commercial Property Proposal", tag: "Broker",
          icon: FileText, description: "Auto-populated quote proposal for review before issuing to broker.",
          sources: ["AI Draft — v1.0", "SOV Data", "Rating Engine", "Guidelines"],
        },
      ],
    },
    {
      stageKey: 5, stageLabel: "Customer Decision", sectionTitle: "POLICY DOCUMENTS",
      docs: [
        {
          id: "dec-binder", label: "Binder", tag: "Policy",
          icon: FileCheck, description: "Interim insurance contract binding coverage pending full policy issuance.",
          sources: ["AI Draft — v1.0", "Clause Library", "T&C", "Signed Proposal"],
        },
        {
          id: "dec-policy", label: "Policy Schedule", tag: "Policy",
          icon: Gavel, description: "Full policy schedule with all endorsements and declarations.",
          sources: ["AI Draft — v1.0", "Clause Library", "Guidelines"],
        },
        {
          id: "dec-forms", label: "Forms & Endorsements", tag: "Policy",
          icon: ClipboardList, description: "Manuscript endorsements and standard forms applicable to this risk.",
          sources: ["AI Draft — v1.0", "Clause Library", "Guidelines"],
        },
      ],
    },
  ];
}

/* ── Document content generators ── */
function generateContent(
  docId: string,
  meta: SubmissionMeta,
  idx: SubmissionIndexEntry,
  extras: SubmissionExtras,
): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const missing = extras.documents.filter((d) => !d.received).map((d) => `• ${d.name} — not yet received`).join("\n");
  const flagged = extras.documents.filter((d) => d.received && d.reviewReason).map((d) => `• ${d.name}: ${d.reviewReason}`).join("\n");

  switch (docId) {
    case "tri-ofac":
      return `TO: Operations / Compliance
FROM: ${idx.assignedUW || "Mike Farrell"} — Commercial Property UW
DATE: ${today}
RE: OFAC & Clearance Confirmation — ${meta.id}

Please confirm OFAC and clearance screening for the following:

Named Insured:  ${meta.namedInsured}
Ref:            ${meta.id}
NAICS:          ${meta.naics}
Territory:      ${meta.territory}
Broker:         ${meta.broker}, ${meta.brokerageHouse}

Clearance Status:  ${idx.clearance === "complete" ? "COMPLETE" : "IN PROGRESS — action required"}
OFAC Status:       CLEAR (automated screen — ${today})

Please confirm final sign-off and update the system accordingly.`;

    case "uwa-quote":
      return `COMMERCIAL PROPERTY PROPOSAL

Date: ${today}

Broker:
${meta.broker}
${meta.brokerageHouse}
${idx.homeOffice}

Name of Insured:        ${meta.namedInsured}
Policy Number:          TBD — QBE Specialty Insurance Company
Company Rating:         "AA-" by Standard & Poors and "A" Excellent by AM Best
Non-Admitted:           Please be advised this insurance will be issued by a surplus lines insurer.

Period of Insurance:    From: ${meta.inceptionDate}   To: [12 months]
                        Beginning and ending at 12:01am, local standard time.

Territory:              ${meta.territory} — all insured locations within specified states.

Coverages:
  Covered Property:     Buildings, Contents, Business Interruption and Extra Expense
  Cause of Loss:        ${extras.request.perils.join("; ")}
  Valuation:            ${extras.request.valuationMethod}

Insurable Values as received from broker (${meta.submissionDate}):
  Property Values:      ${meta.tivFull}
  Business Income:      [TBD]
  Total TIV:            ${meta.tivFull}

Capacity:               ${extras.request.qbeLayer}
Limits Sought:          ${extras.request.limitsSought}

Loss History (5-Yr):    Loss Ratio ${extras.lossHistory.lossRatio}

SUBJECT TO: Standard QBE commercial property terms, conditions, exclusions, and
any manuscript endorsements noted in the attached T&C schedule.`;

    case "dec-binder":
      return `CERTIFICATE OF INSURANCE / BINDER

Insured:        ${meta.namedInsured}
Ref:            ${meta.id}
Binder Date:    ${today}
Policy Period:  ${meta.inceptionDate} to [12 months] 12:01am LST

Insurer:        QBE Specialty Insurance Company (Non-Admitted)
Rating:         AA- / A Excellent

Coverage:       Commercial Property — All Risk
TIV:            ${meta.tivFull}
Layer:          ${extras.request.qbeLayer}
Perils:         ${extras.request.perils.join(", ")}
Territory:      ${meta.territory}

This binder provides interim coverage pending issuance of the full policy. Coverage is subject to all terms, conditions, and exclusions of the final policy form.

⚠ THIS IS A MACHINE-GENERATED DRAFT — REVIEW ALL HIGHLIGHTED FIELDS BEFORE ISSUING.

Authorised Signatory: _______________________
${idx.assignedUW || "Mike Farrell"} — QBE NA
Date: ${today}`;

    case "dec-policy":
      return `POLICY SCHEDULE

Policy No:      [TBD — SYSTEM GENERATED]
Named Insured:  ${meta.namedInsured}
Broker:         ${meta.broker}, ${meta.brokerageHouse}

Policy Period:  ${meta.inceptionDate} — [12 months] at 12:01am LST
Territory:      ${meta.territory}
TIV:            ${meta.tivFull}
Layer:          ${extras.request.qbeLayer}

DECLARATIONS
Form:           QBE Commercial Property — All Risk
Valuation:      ${extras.request.valuationMethod}
Perils:         ${extras.request.perils.join(", ")}

ENDORSEMENTS ATTACHED
• NMA 2914 Manuscript Carve-out
• Sprinkler Leakage — ESFR
• Equipment Breakdown Sublimit

Premium:        $[TBD]
Surplus Lines Tax: $[TBD]
Total:          $[TBD]

Issued by: ${idx.assignedUW || "Mike Farrell"} — ${today}`;

    case "dec-forms":
      return `FORMS & ENDORSEMENTS INDEX

Policy:         ${meta.id} — ${meta.namedInsured}
Effective:      ${meta.inceptionDate}

STANDARD FORMS
  CP 00 10    Building and Personal Property Coverage Form
  CP 00 30    Business Income Coverage Form
  CP 10 30    Causes of Loss — Special Form
  IL 00 17    Common Policy Conditions

MANUSCRIPT ENDORSEMENTS ⚠ LEGAL REVIEW REQUIRED
  NMA 2914    Cyber / Non-Physical Damage Exclusion (Manuscript)
              — Differs from expiring wording; confirm with legal before binding

  QBE-CP-001  ESFR Sprinkler Warranty
              — Applies to all locations; breach voids coverage at that location

  QBE-CP-002  Equipment Breakdown Sublimit — $[TBD] per occurrence

OPTIONAL / REQUESTED NOT QUOTED
  Flood:      Sub-limited — pricing subject to FEMA zone confirmation
  Earthquake: Excluded — CA locations require separate EQ quote

Prepared by: ${idx.assignedUW || "Mike Farrell"} — ${today}`;

    default:
      return "Document content not available.";
  }
}

/* ── Source attachment preview content ── */
function SourcePreviewContent({
  source, meta, idx, extras,
}: {
  source: string;
  meta: SubmissionMeta;
  idx: SubmissionIndexEntry;
  extras: SubmissionExtras;
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (source === "Application") {
    return (
      <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold text-[#1A1A1A] mb-3 pb-2 border-b border-[#E8E6E1]">Commercial Property Insurance Application</div>
        <div className="space-y-2 text-[10px] text-[#2D2D2D]">
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Named Insured</span><div className="font-semibold">{meta.namedInsured}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Broker</span><div>{meta.broker} · {meta.brokerageHouse}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Coverage Type</span><div>{meta.coverageType}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">NAICS Code</span><div>{meta.naics} — {meta.industry}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Territory</span><div>{meta.territory}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Total Insured Value</span><div className="font-semibold">{meta.tivFull}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Inception Date</span><div>{meta.inceptionDate}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Locations</span><div>{meta.locations}</div></div>
          <div className="pt-1 border-t border-[#E8E6E1]">
            <span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Perils Requested</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {extras.request.perils.map((p) => (
                <span key={p} className="px-1.5 py-px rounded bg-[#EEF1F8] text-[#00205B] text-[9px] font-semibold border border-[#C5CEDF]">{p}</span>
              ))}
            </div>
          </div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Valuation Method</span><div>{extras.request.valuationMethod}</div></div>
          <div><span className="text-[#6B7280] uppercase text-[9px] tracking-wide font-bold">Limits Sought</span><div>{extras.request.limitsSought}</div></div>
        </div>
      </div>
    );
  }

  if (source === "SOV Data") {
    return (
      <div style={{ fontFamily: "Calibri, sans-serif" }}>
        <div className="text-[10px] font-bold text-[#217346] mb-1">{meta.namedInsured} — Statement of Values</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="bg-[#217346] text-white">
                {["#", "Location", "State", "Construction", "TIV", "Hazard"].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-left font-bold border border-[#1a5c38]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "HQ — Main St", "FL", "Frame", "$4.2M", "72"],
                ["2", "Warehouse A", "FL", "Masonry", "$6.8M", "68"],
                ["3", "Office Tower", "TX", "Steel", "$12.1M", "45"],
                ["4", "Dist. Center", "OH", "Tilt-up", "$8.4M", "38"],
                ["5", "Retail — 5th", "CA", "Wood", "$3.2M", "61"],
                ["6", "Cold Storage", "IL", "Masonry", "$5.7M", "42"],
                ["7", "Plant B", "TX", "Steel", "$9.1M", "55"],
                ["8", "Admin Block", "GA", "Frame", "$2.9M", "49"],
              ].map(([n, loc, st, cons, tiv, haz], i) => (
                <tr key={n} className={i % 2 === 0 ? "bg-white" : "bg-[#EEF5F0]"}>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8] text-[#6B7280]">{n}</td>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8] font-medium">{loc}</td>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8]">{st}</td>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8]">{cons}</td>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8] font-semibold text-right">{tiv}</td>
                  <td className="px-1.5 py-0.5 border border-[#C8D8C8] text-center">
                    <span className={`px-1 rounded text-[8px] font-bold ${Number(haz) >= 65 ? "bg-red-100 text-red-700" : Number(haz) >= 50 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{haz}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#D8EAE0] font-bold">
                <td colSpan={4} className="px-1.5 py-1 border border-[#C8D8C8] text-right text-[9px]">TOTAL TIV</td>
                <td className="px-1.5 py-1 border border-[#C8D8C8] text-right text-[9px]">{meta.tivFull}</td>
                <td className="px-1.5 py-1 border border-[#C8D8C8]" />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-1.5 text-[9px] text-[#6B7280]">Showing 8 of {meta.locations} locations · SOV Completeness {extras.sov.completenessPct}%</div>
      </div>
    );
  }

  if (source === "Appetite Guidelines") {
    return (
      <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold text-[#1A1A1A] mb-2 pb-2 border-b border-[#E8E6E1]">QBE Commercial Property Appetite Guidelines</div>
        <div className="space-y-2 text-[10px]">
          <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
            <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Preferred Classes</div>
            <div className="text-[10px] text-emerald-900">Light manufacturing · Retail (non-food) · Office · Mixed-use commercial · Logistics & warehousing</div>
          </div>
          <div className="p-2 rounded bg-amber-50 border border-amber-200">
            <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wide mb-1">Refer to Senior UW</div>
            <div className="text-[10px] text-amber-900">TIV {">"} $50M · CAT-exposed territories · Hazard score {">"} 75 · Loss ratio {">"} 80% (3-yr avg)</div>
          </div>
          <div className="p-2 rounded bg-red-50 border border-red-200">
            <div className="text-[9px] font-bold text-red-700 uppercase tracking-wide mb-1">Excluded Classes</div>
            <div className="text-[10px] text-red-900">Chemical processing · Mining · Offshore · Vacant properties ({">"} 60 days) · OFAC-sanctioned entities</div>
          </div>
          <div className="text-[10px] text-[#4B5563]">
            <span className="font-semibold">Max line:</span> $25M per risk · <span className="font-semibold">Min premium:</span> $25,000
          </div>
        </div>
      </div>
    );
  }

  if (source === "Clearance Report") {
    return (
      <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">Clearance & OFAC Report</div>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex items-center justify-between py-1 border-b border-[#F3F3F1]">
            <span className="text-[#6B7280]">Named Insured</span>
            <span className="font-semibold">{meta.namedInsured}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F3F3F1]">
            <span className="text-[#6B7280]">Clearance Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">{idx.clearance === "complete" ? "CLEAR" : "PENDING"}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F3F3F1]">
            <span className="text-[#6B7280]">OFAC Screen</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">CLEAR</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F3F3F1]">
            <span className="text-[#6B7280]">Broker</span>
            <span className="font-medium">{meta.brokerageHouse}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F3F3F1]">
            <span className="text-[#6B7280]">Screen Date</span>
            <span>{today}</span>
          </div>
        </div>
      </div>
    );
  }

  if (source === "Territory Map") {
    return (
      <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">Territory & CAT Exposure Map</div>
        <div className="rounded bg-[#E8EDF5] border border-[#C5CEDF] p-3 mb-2 relative" style={{ minHeight: 100 }}>
          <div className="text-center text-[#6B7280] text-[10px] py-4">
            <Building2 className="w-8 h-8 mx-auto mb-1 opacity-30" />
            <div>Territory concentration map</div>
            <div className="text-[9px] mt-0.5">{meta.territory}</div>
          </div>
          <div className="absolute bottom-2 right-2 space-y-0.5">
            {[["High CAT", "bg-red-400"], ["Med CAT", "bg-amber-400"], ["Low CAT", "bg-emerald-400"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1 text-[8px] text-[#4B5563]">
                <div className={`w-2 h-2 rounded-sm ${c}`} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] space-y-1 text-[#4B5563]">
          <div><span className="font-semibold">Top state:</span> {extras.sov.stats.topState}</div>
          <div><span className="font-semibold">Avg hazard score:</span> {extras.sov.stats.avgHazard}/100</div>
          <div><span className="font-semibold">Perils:</span> {extras.request.perils.join(", ")}</div>
        </div>
      </div>
    );
  }

  if (source === "Guidelines" || source === "Clause Library") {
    return (
      <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">{source}</div>
        <div className="space-y-1.5">
          {[
            { code: "CP 00 10", title: "Building & Personal Property Coverage Form", status: "Standard" },
            { code: "CP 00 30", title: "Business Income Coverage Form", status: "Standard" },
            { code: "CP 10 30", title: "Causes of Loss — Special Form", status: "Standard" },
            { code: "NMA 2914", title: "Cyber Exclusion (Manuscript)", status: "Review" },
            { code: "QBE-CP-001", title: "ESFR Sprinkler Warranty", status: "Standard" },
            { code: "QBE-CP-002", title: "Equipment Breakdown Sublimit", status: "Optional" },
          ].map(({ code, title, status }) => (
            <div key={code} className="flex items-start gap-2 py-1 border-b border-[#F3F3F1]">
              <span className="text-[9px] font-bold text-[#00205B] w-20 flex-shrink-0">{code}</span>
              <span className="text-[10px] text-[#2D2D2D] flex-1">{title}</span>
              <span className={`text-[8px] font-bold px-1.5 py-px rounded border flex-shrink-0 ${status === "Review" ? "bg-amber-50 text-amber-700 border-amber-200" : status === "Optional" ? "bg-[#EEF1F8] text-[#00205B] border-[#C5CEDF]" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (source === "Submission Log") {
    return (
      <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">Submission Log — {meta.id}</div>
        <div className="space-y-1.5 text-[10px]">
          {[
            { date: meta.submissionDate, event: "Submission received from broker", user: meta.broker },
            { date: meta.submissionDate, event: "Auto-ingestion initiated", user: "QBE AI Agent" },
            { date: meta.submissionDate, event: "Documents catalogued (4 of 6 received)", user: "QBE AI Agent" },
            { date: today, event: "Triage analysis complete", user: idx.assignedUW ?? "Mike Farrell" },
            { date: today, event: "Assigned to UW desk", user: "System" },
          ].map(({ date, event, user }, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-px bg-[#C5CEDF] self-stretch ml-1.5 flex-shrink-0 relative">
                <div className="w-2 h-2 rounded-full bg-[#00205B] absolute -left-0.5 top-0.5" />
              </div>
              <div className="pb-1.5 pl-1 flex-1">
                <div className="text-[#2D2D2D] font-medium">{event}</div>
                <div className="text-[9px] text-[#6B7280]">{date} · {user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (source === "UW Analysis") {
    return (
      <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">UW Analysis — {meta.id}</div>
        <div className="space-y-2 text-[10px] text-[#2D2D2D]">
          <div className="p-2 rounded bg-[#EEF1F8] border border-[#C5CEDF]">
            <div className="text-[9px] font-bold text-[#00205B] uppercase tracking-wide mb-1">Risk Assessment</div>
            <div>{extras.focusNote}</div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              ["TIV", meta.tivFull], ["Layer", extras.request.qbeLayer],
              ["Loss Ratio", extras.lossHistory.lossRatio], ["Hazard Avg", `${extras.sov.stats.avgHazard}/100`],
            ].map(([k, v]) => (
              <div key={k} className="p-1.5 rounded border border-[#E8E6E1] bg-white">
                <div className="text-[9px] text-[#6B7280]">{k}</div>
                <div className="font-semibold text-[10px]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (source === "T&C" || source === "Signed Proposal") {
    return (
      <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 10 }}>
        <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">{source} — {meta.namedInsured}</div>
        <div className="space-y-1 text-[10px] text-[#2D2D2D]">
          <div className="flex justify-between py-0.5 border-b border-[#F3F3F1]"><span className="text-[#6B7280]">Ref</span><span>{meta.id}</span></div>
          <div className="flex justify-between py-0.5 border-b border-[#F3F3F1]"><span className="text-[#6B7280]">TIV</span><span className="font-semibold">{meta.tivFull}</span></div>
          <div className="flex justify-between py-0.5 border-b border-[#F3F3F1]"><span className="text-[#6B7280]">Layer</span><span>{extras.request.qbeLayer}</span></div>
          <div className="flex justify-between py-0.5 border-b border-[#F3F3F1]"><span className="text-[#6B7280]">Inception</span><span>{meta.inceptionDate}</span></div>
          <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[9px] text-amber-800">
            ⚠ Manuscript endorsement NMA 2914 requires legal review before binding
          </div>
          {source === "Signed Proposal" && (
            <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-800">
              ✓ Broker signature confirmed — {today}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* AI Draft / internal / fallback */
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: 10 }}>
      <div className="text-[11px] font-bold mb-2 pb-2 border-b border-[#E8E6E1]">{source}</div>
      <div className="text-[10px] text-[#9B9B98] py-6 text-center">
        <FileText className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
        <div>Internal record — no document preview</div>
      </div>
    </div>
  );
}

/* ── Attachment preview panel ── */
function AttachmentPreview({
  sources, meta, idx, extras,
}: {
  sources: string[];
  meta: SubmissionMeta;
  idx: SubmissionIndexEntry;
  extras: SubmissionExtras;
}) {
  const viewableSources = sources.filter((s) => s !== "AI Draft — v1.0");
  const [selected, setSelected] = useState(viewableSources[0] ?? sources[0]);
  const currentSource = viewableSources.includes(selected) ? selected : (viewableSources[0] ?? selected);
  const type = sourceType(currentSource);

  const TYPE_CFG = {
    excel:    { label: "XLSX", Icon: FileSpreadsheet, bar: "#217346", badge: "bg-emerald-100 text-emerald-700", activeBadge: "bg-emerald-700 text-white" },
    word:     { label: "DOCX", Icon: FileType2,       bar: "#2B579A", badge: "bg-blue-100 text-blue-700",       activeBadge: "bg-blue-700 text-white" },
    pdf:      { label: "PDF",  Icon: FileText,         bar: "#C0392B", badge: "bg-red-100 text-red-600",         activeBadge: "bg-red-600 text-white" },
    internal: { label: "INT",  Icon: Eye,              bar: "#00205B", badge: "bg-slate-100 text-slate-600",     activeBadge: "bg-slate-700 text-white" },
  } as const;

  const cfg = TYPE_CFG[type as keyof typeof TYPE_CFG] ?? TYPE_CFG.pdf;

  const renderContent = () => (
    <div className="flex-1 overflow-auto p-4 bg-[#F4F4F2]">
      <div className="bg-white rounded-lg border border-[#E8E6E1] shadow-sm overflow-hidden">
        {/* Doc header strip */}
        <div className="px-4 py-2.5 border-b border-[#E8E6E1] flex items-center justify-between"
          style={{ background: `${cfg.bar}12` }}>
          <div className="flex items-center gap-2">
            <cfg.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.bar }} />
            <span className="text-[10px] font-semibold truncate max-w-[160px]" style={{ color: cfg.bar }}>
              {currentSource}
            </span>
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${cfg.bar}20`, color: cfg.bar }}>
            {cfg.label}
          </span>
        </div>
        {/* Content */}
        <div className="p-4" style={{ fontFamily: type === "excel" ? "monospace" : "inherit" }}>
          <SourcePreviewContent source={currentSource} meta={meta} idx={idx} extras={extras} />
        </div>
        {/* Footer */}
        <div className="px-4 py-1.5 border-t border-[#E8E6E1] flex items-center justify-between bg-[#FAFAF9]">
          <span className="text-[9px]" style={{ color: "#9B9B98" }}>{meta.id}</span>
          <span className="text-[9px]" style={{ color: "#9B9B98" }}>Page 1 of 2</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 flex-shrink-0 border-l border-[#E8E6E1] flex flex-col overflow-hidden bg-[#FAFAF9]">

      {/* Panel header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-[#E8E6E1] bg-white">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Eye className="w-3 h-3 flex-shrink-0" style={{ color: "#0076BC" }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00205B" }}>Source Attachments</span>
        </div>
        {/* File tabs — inline row */}
        <div className="flex flex-wrap gap-1.5">
          {viewableSources.map((src) => {
            const t = sourceType(src);
            const tcfg = TYPE_CFG[t as keyof typeof TYPE_CFG] ?? TYPE_CFG.pdf;
            const isActive = src === currentSource;
            return (
              <button
                key={src}
                onClick={() => setSelected(src)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition-all ${
                  isActive
                    ? "border-[#C2DFF4] bg-[#EEF6FF]"
                    : "border-[#E8E6E1] bg-white hover:bg-[#F3F4F6] hover:border-[#C2DFF4]"
                }`}
              >
                <span className={`text-[7px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${isActive ? tcfg.activeBadge : tcfg.badge}`}>
                  {tcfg.label}
                </span>
                <span className="text-[10px] whitespace-nowrap" style={{ fontWeight: isActive ? 600 : 400, color: isActive ? "#00205B" : "#4B5563" }}>
                  {src}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document preview */}
      {renderContent()}
    </div>
  );
}

/* ── Download HTML ── */
function downloadHtml(docId: string, content: string, meta: SubmissionMeta) {
  const isProposal = docId === "uwa-quote";
  const title = isProposal ? "Commercial Property Proposal" : "Document";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title} — ${meta.id}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 32px; color: #111; font-size: 13px; line-height: 1.7; }
  h1 { text-align: center; font-size: 18px; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 24px; }
  .warning { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 4px; padding: 10px 14px; font-size: 11px; color: #92400e; margin-bottom: 20px; font-family: sans-serif; }
  pre { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.8; }
  .highlight { background: #fef3c7; padding: 0 2px; }
  footer { margin-top: 48px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 11px; color: #6b7280; font-family: sans-serif; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="warning">⚠ Machine-generated draft · Review all highlighted fields before sending or filing · QBE Internal Use</div>
<pre>${content.replace(/\[TBD[^\]]*\]/g, (m) => `<span class="highlight">${m}</span>`)}</pre>
<footer>Generated by QBE AI UW Agent · ${meta.id} · ${new Date().toLocaleString()} · Draft — not for external distribution</footer>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meta.id}-${docId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Tag colours ── */
const TAG_STYLE: Record<string, string> = {
  Broker:     "bg-[#EEF1F8] text-[#00205B] border-[#C5CEDF]",
  Internal:   "bg-violet-50 text-violet-800 border-violet-200",
  Regulatory: "bg-amber-50 text-amber-800 border-amber-200",
  Policy:     "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const STAGE_STEPS = ["Ingestion", "Triage", "UW Analysis", "UW Review", "Customer Decision"];

/* ── Main modal component ── */
export function DocumentCreationModal({
  meta, idx, extras, activeStepIndex, onClose,
}: {
  meta: SubmissionMeta;
  idx: SubmissionIndexEntry;
  extras: SubmissionExtras;
  activeStepIndex: number;
  onClose: () => void;
}) {
  const stageConfigs = buildStageConfigs(meta, idx, extras);
  const [currentStage, setCurrentStage] = useState(
    Math.max(0, Math.min(activeStepIndex - 1, stageConfigs.length - 1)),
  );
  const [selectedDocId, setSelectedDocId] = useState(stageConfigs[currentStage]?.docs[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  const config = stageConfigs[currentStage];
  const selectedDoc = config?.docs.find((d) => d.id === selectedDocId) ?? config?.docs[0];

  const rawContent = generateContent(selectedDoc?.id ?? "", meta, idx, extras);
  const content = editedContent[selectedDoc?.id ?? ""] ?? rawContent;

  const handleStageChange = (i: number) => {
    setCurrentStage(i);
    setSelectedDocId(stageConfigs[i]?.docs[0]?.id ?? "");
    setEditing(false);
  };

  const handleDocSelect = (id: string) => {
    setSelectedDocId(id);
    setEditing(false);
  };

  const handleDownload = () => {
    if (selectedDoc) downloadHtml(selectedDoc.id, content, meta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ width: "min(1340px, 97vw)", height: "min(840px, 94vh)" }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-[#00205B] px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] text-white" style={{ fontWeight: 700 }}>Document Creation</div>
            <div className="text-[11px] text-white/60">{meta.accountName} · {meta.id}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors ml-auto">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* ── Stage tracker ── */}
        <div className="flex-shrink-0 bg-[#F7F8FA] border-b border-[#E8E6E1] px-6 py-2.5 flex items-center gap-2">
          {STAGE_STEPS.map((label, i) => {
            const active = i === currentStage;
            const done = i < currentStage;
            return (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => handleStageChange(i)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    active ? "bg-[#00205B] text-white" : done ? "text-emerald-700 hover:text-emerald-900" : "text-[#9B9B98] hover:text-[#6B7280]"
                  }`}
                  style={{ fontWeight: active ? 700 : 500 }}
                >
                  {label}
                </button>
                {i < STAGE_STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-[#C9C7C1] flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── Body: doc list | draft | attachment preview ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar — doc list */}
          <div className="w-56 flex-shrink-0 bg-[#F9F9F8] border-r border-[#E8E6E1] flex flex-col">
            <div className="px-3 py-2.5 border-b border-[#E8E6E1]">
              <span className="text-[9px] uppercase tracking-wider text-[#9B9B98]" style={{ fontWeight: 700 }}>
                {config?.sectionTitle}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {config?.docs.map((doc) => {
                const Icon = doc.icon;
                const active = doc.id === selectedDoc?.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSelect(doc.id)}
                    className={`w-full text-left rounded-lg p-2.5 transition-colors border ${
                      active
                        ? "bg-[#00205B] border-[#00205B]"
                        : "bg-white border-[#E8E6E1] hover:border-[#00205B]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${active ? "text-white/70" : "text-[#6B7280]"}`} />
                      <div className="min-w-0">
                        <div className={`text-[11px] leading-tight ${active ? "text-white" : "text-[#2D2D2D]"}`} style={{ fontWeight: 600 }}>
                          {doc.label}
                        </div>
                        <span className={`inline-block mt-1 text-[9px] px-1.5 py-px rounded border ${active ? "bg-white/10 border-white/20 text-white/70" : TAG_STYLE[doc.tag]}`} style={{ fontWeight: 700 }}>
                          {doc.tag}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center — draft preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Doc header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-[#E8E6E1] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[14px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{selectedDoc?.label}</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">{selectedDoc?.description}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedDoc?.sources.map((src) => (
                    <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#E8E6E1] bg-[#F9F9F8] text-[9px] text-[#4B5563]" style={{ fontWeight: 600 }}>
                      <FileText className="w-2.5 h-2.5" />{src}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI warning banner */}
            <div className="flex-shrink-0 mx-5 mt-3 mb-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] text-amber-700" style={{ fontWeight: 600 }}>
                Machine-generated draft · Review all highlighted fields before sending or filing
              </span>
            </div>

            {/* Document body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {editing ? (
                <textarea
                  className="w-full h-full min-h-[400px] font-mono text-[11px] leading-relaxed text-[#2D2D2D] bg-white border border-[#00205B] rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#00205B]/20"
                  value={content}
                  onChange={(e) => setEditedContent((prev) => ({ ...prev, [selectedDoc?.id ?? ""]: e.target.value }))}
                />
              ) : (
                <div className="font-mono text-[11px] leading-relaxed text-[#2D2D2D] bg-[#FAFAF9] rounded-lg border border-[#E8E6E1] p-4 whitespace-pre-wrap min-h-[400px]">
                  {content.split(/(\[TBD[^\]]*\])/g).map((part, i) =>
                    /^\[TBD/.test(part)
                      ? <mark key={i} className="bg-amber-100 text-amber-800 rounded px-0.5">{part}</mark>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex-shrink-0 border-t border-[#E8E6E1] px-5 py-3 flex items-center gap-2">
              <button
                onClick={() => setEditing((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] transition-colors ${editing ? "bg-[#00205B] text-white border-transparent" : "border-[#E8E6E1] bg-white hover:bg-[#F3F3F1] text-[#2D2D2D]"}`}
                style={{ fontWeight: 600 }}
              >
                <Edit3 className="w-3 h-3" /> {editing ? "Done Editing" : "Edit Draft"}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E8E6E1] bg-white hover:bg-[#F3F3F1] text-[11px] text-[#2D2D2D] transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Download className="w-3 h-3" /> Download
              </button>
              <button
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#00205B] hover:bg-[#001544] text-white text-[11px] transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Send className="w-3 h-3" /> Send for Review
              </button>
            </div>
          </div>

          {/* Right — attachment preview */}
          {selectedDoc && (
            <AttachmentPreview
              key={selectedDoc.id}
              sources={selectedDoc.sources}
              meta={meta}
              idx={idx}
              extras={extras}
            />
          )}
        </div>
      </div>
    </div>
  );
}

