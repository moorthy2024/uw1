"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import type { ReactNode } from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Hammer, Layers, Shield, Globe2, MapPin, ChevronRight,
  Mail, BarChart3, XCircle, X, Search, AlertTriangle,
  FileText, Download, ExternalLink, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import type { SubmissionMeta, SubmissionExtras, SovLocation, LossLocation } from "../SubmissionTypes";
import {
  useStepActions, BAND_STYLE, hazardBand, parseTIV, parsePaidK, fmtTIV, fmtPaid,
  concentrationBand, groupByTIV, bookDelta, protectionScore, parsePC,
  type BookDelta, type CopeGroup,
} from "../SubmissionHelpers";
import type { SubmissionIndexEntry } from "../CustomerTable";
import {
  StepShell, PaneTitle, CategorySummaryList,
  type StepCategory, type StepStatus, type Trend,
} from "../step-detail-layout";
import {
  NWS_STATES, EQ_STATES, FLOOD_STATES,
  CAT_MODEL_CFG, HEALTH_CHECK_CFG,
  HISTORIC_DECISIONS, DECISION_STYLE,
} from "./mock-data";
import { locHazardGrade, HAZARD_GRADE_CFG } from "./SubmissionShared";

/* ── Types ── */

/** Which summarised measure the underwriter drilled into, if any. */
type MeasureFilter = { category: string; rowKey: string } | null;

const DELTA_TREND: Record<BookDelta, Trend> = { under: "down", "in-line": "flat", over: "up" };
const DELTA_LABEL: Record<BookDelta, string> = { under: "under", "in-line": "in line with", over: "over" };

/** Where a measure sits against comparable bound business, as a display trend. */
function trendOf(subject: number, benchmark: number, tolerance?: number): Trend {
  return DELTA_TREND[bookDelta(subject, benchmark, tolerance)];
}

/** The SOV field each COPE category groups by — also the field a drill-in filters on. */
const CATEGORY_FIELD: Record<string, keyof Pick<SovLocation, "construction" | "occupancy" | "protectionCode" | "state">> = {
  construction: "construction",
  occupancy: "occupancy",
  protection: "protectionCode",
  exposure: "state",
};

export type UWFollowUpTab = "broker" | "cat" | "decline";

const UW_FOLLOWUP_OPTIONS: { id: UWFollowUpTab; label: string; icon: typeof Mail }[] = [
  { id: "broker",  label: "Request Additional Information", icon: Mail },
  { id: "cat",     label: "CAT Modelling Request",          icon: BarChart3 },
  { id: "decline", label: "Decline to Quote",               icon: XCircle },
];

type SortKey = "tiv" | "hazard" | "state" | "construction" | "occupancy" | "loc";
interface SovField {
  label: string;
  sortKey?: SortKey;
  render: (l: SovLocation) => ReactNode;
}
interface SovCategory {
  key: string;
  label: string;
  summary: SovField;
  fields: SovField[];
}

/* ── Small render helpers ── */

const naCell = <span className="text-[#C4C2BE] text-[11px]">— Not provided</span>;
function txt(v: string | number | undefined | null) {
  if (v === undefined || v === null || String(v).trim() === "") return naCell;
  return <span className="text-[#5D5D5D]">{v}</span>;
}
function hazardCell(l: SovLocation) {
  const hb = BAND_STYLE[hazardBand(l.hazard)];
  const g = HAZARD_GRADE_CFG[locHazardGrade(l.hazard)];
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-extrabold ${g.bg} ${g.text} ${g.border}`}>{locHazardGrade(l.hazard)}</span>
      <span className={`text-[11px] tabular-nums ${hb.text}`} style={{ fontWeight: 600 }}>{l.hazard}</span>
    </div>
  );
}
function badgeCell(cfg: { label: string; bg: string; text: string; border: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 600 }}>{cfg.label}</span>;
}

/* ── LossHistoryTable ── */

export function LossHistoryTable({
  lossHistory,
  submissionType,
}: {
  lossHistory: SubmissionExtras["lossHistory"];
  submissionType: "New Business" | "Renewal" | "Remarket";
}) {
  const breakdown = lossHistory.yearlyBreakdown ?? [];
  const totalK = breakdown.reduce((s, y) => s + parsePaidK(y.paid), 0);
  const lrBand = lossHistory.lossRatioBand;
  const lrColor = lrBand === "good" ? "#059669" : lrBand === "watch" ? "#D97706" : "#DC2626";
  const pierceYears = new Set(
    (lossHistory.layerPenetration?.piercingEvents ?? []).map(e => e.year)
  );
  const isRenewal = submissionType === "Renewal";

  const totalLayerK = isRenewal
    ? breakdown.reduce((s, y) => s + (y.qbeLayerLoss ? parsePaidK(y.qbeLayerLoss) : 0), 0)
    : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
        <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>
            Annual Loss Summary — Last {lossHistory.claimsYears} Years
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#9B9B98]">{lossHistory.claimsYears}-yr paid: {fmtPaid(totalK)}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
              fontWeight: 700, color: lrColor,
              backgroundColor: lrBand === "good" ? "#F0FDF4" : lrBand === "watch" ? "#FFFBEB" : "#FEF2F2",
              border: `1px solid ${lrBand === "good" ? "#BBF7D0" : lrBand === "watch" ? "#FDE68A" : "#FECACA"}`,
            }}>LR {lossHistory.lossRatio}</span>
          </div>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#F0EFEC]">
              <th className="px-3 py-1.5 text-left text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Year</th>
              <th className="px-3 py-1.5 text-right text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Gross Paid</th>
              {isRenewal && (
                <th className="px-3 py-1.5 text-right text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>QBE Layer Loss</th>
              )}
              <th className="px-3 py-1.5 text-center text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Layer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9F8F7]">
            {breakdown.map(y => {
              const k = parsePaidK(y.paid);
              const pierced = pierceYears.has(y.year);
              return (
                <tr key={y.year} className={pierced ? "bg-red-50/60" : "hover:bg-[#FAFAF9]"}>
                  <td className="px-3 py-1.5 text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{y.year}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: k === 0 ? "#C9C7C1" : "#0D1B2E" }}>
                    {k === 0 ? "—" : y.paid}
                  </td>
                  {isRenewal && (
                    <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: y.qbeLayerLoss ? "#0D1B2E" : "#C9C7C1" }}>
                      {y.qbeLayerLoss ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-center">
                    {pierced
                      ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200" style={{ fontWeight: 700 }}>Pierced</span>
                      : <span className="text-[9px] text-[#C9C7C1]">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E8E6E1] bg-[#FAFAF9]">
              <td className="px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>5-Yr Total</td>
              <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 700, color: "#0D1B2E" }}>{fmtPaid(totalK)}</td>
              {isRenewal && (
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 700, color: "#0D1B2E" }}>
                  {totalLayerK > 0 ? fmtPaid(totalLayerK) : "—"}
                </td>
              )}
              <td />
            </tr>
          </tfoot>
        </table>
        <div className="px-3 py-1.5 border-t border-[#F0EFEC] bg-[#FAFAF9]">
          <p className="text-[10px] text-[#6B7280] leading-snug">{lossHistory.summary}</p>
        </div>
      </div>
      {(lossHistory.claims?.length ?? 0) > 0 && (
        <ClaimsTable claims={lossHistory.claims!} />
      )}
    </div>
  );
}

/* ── ClaimsTable ── */

type ClaimRow = NonNullable<SubmissionExtras["lossHistory"]["claims"]>[number];
type ClaimSortKey = "lossDate" | "paid" | "incurred" | "status" | "peril" | "location";

function ClaimsTable({ claims }: { claims: ClaimRow[] }) {
  const [sortCol, setSortCol] = useState<ClaimSortKey>("lossDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeril, setFilterPeril] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const uniqueStatuses = useMemo(() => [...new Set(claims.map(c => c.status))].sort(), [claims]);
  const uniquePerils   = useMemo(() => [...new Set(claims.map(c => c.peril))].sort(), [claims]);

  function toggleSort(col: ClaimSortKey) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "lossDate" ? "desc" : "desc"); }
  }

  const sorted = [...claims].sort((a, b) => {
    let va: any, vb: any;
    if (sortCol === "lossDate") { va = a.lossDate; vb = b.lossDate; }
    else if (sortCol === "paid")     { va = a.paid;     vb = b.paid; }
    else if (sortCol === "incurred") { va = a.incurred; vb = b.incurred; }
    else if (sortCol === "status")   { va = a.status;   vb = b.status; }
    else if (sortCol === "peril")    { va = a.peril;    vb = b.peril; }
    else                             { va = a.location; vb = b.location; }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const filtered = sorted.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPeril  && c.peril  !== filterPeril)  return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (![c.claimId, c.location, c.peril, c.status].some(v => v.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const sortTh = (label: string, col: ClaimSortKey, right = false) => (
    <th onClick={() => toggleSort(col)}
      className={`px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98] cursor-pointer hover:text-[#0076BC] select-none whitespace-nowrap ${right ? "text-right" : "text-left"} ${sortCol === col ? "text-[#0076BC]" : ""}`}
      style={{ fontWeight: 700 }}>
      {label}{sortCol === col ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
    </th>
  );

  const statusCfg: Record<string, { bg: string; text: string; border: string }> = {
    Closed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Open:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  };
  const fmtAmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${Math.round(n/1_000)}K` : `$${n}`;

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      <div className="px-3 py-1.5 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center gap-2">
        <Search className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search claims, location, peril…"
          className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#C4C2BE]"
          style={{ color: "#2D2D2D" }}
        />
        {searchQ && (
          <button onClick={() => setSearchQ("")} className="text-[#9B9B98] hover:text-[#5D5D5D]">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center gap-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Individual Claims — {claims.length} records</span>
        <div className="flex items-center gap-2 ml-auto">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className={`h-5 pl-2 pr-5 rounded border text-[9px] bg-white appearance-none cursor-pointer outline-none ${filterStatus ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
            style={{ fontWeight: filterStatus ? 700 : 500 }}>
            <option value="">Status</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPeril} onChange={e => setFilterPeril(e.target.value)}
            className={`h-5 pl-2 pr-5 rounded border text-[9px] bg-white appearance-none cursor-pointer outline-none max-w-[140px] ${filterPeril ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
            style={{ fontWeight: filterPeril ? 700 : 500 }}>
            <option value="">Peril</option>
            {uniquePerils.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterStatus || filterPeril) && (
            <button onClick={() => { setFilterStatus(""); setFilterPeril(""); }}
              className="text-[9px] text-[#0076BC] hover:text-[#005A8E] flex items-center gap-0.5" style={{ fontWeight: 600 }}>
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          )}
          <span className="text-[9px] text-[#9B9B98] tabular-nums">{filtered.length} shown</span>
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight: "520px" }}>
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#F0EFEC] bg-[#FAFAF9]">
              {sortTh("Claim ID",    "location")}
              {sortTh("Location",    "location")}
              {sortTh("Loss Date",   "lossDate")}
              {sortTh("Peril",       "peril")}
              {sortTh("Status",      "status")}
              {sortTh("Paid",        "paid",     true)}
              {sortTh("Case Rsv",   "incurred", true)}
              {sortTh("Incurred",   "incurred", true)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9F8F7]">
            {filtered.map(c => {
              const sc = statusCfg[c.status] ?? statusCfg["Open"];
              const hasOpen = c.status === "Open";
              return (
                <tr key={c.claimId} className={`hover:bg-[#FAFAF9] ${hasOpen ? "bg-amber-50/30" : ""}`}>
                  <td className="px-3 py-1.5 tabular-nums text-[10px] text-[#6B7280] whitespace-nowrap" style={{ fontWeight: 600 }}>{c.claimId}</td>
                  <td className="px-3 py-1.5 max-w-[140px]"><span className="block truncate text-[#2D2D2D]">{c.location}</span></td>
                  <td className="px-3 py-1.5 tabular-nums text-[#4B5563] whitespace-nowrap">{c.lossDate}</td>
                  <td className="px-3 py-1.5 text-[#5D5D5D] max-w-[120px]"><span className="block truncate">{c.peril}</span></td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] ${sc.bg} ${sc.text} ${sc.border}`} style={{ fontWeight: 700 }}>{c.status}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: c.paid > 0 ? "#0D1B2E" : "#C9C7C1" }}>{c.paid > 0 ? fmtAmt(c.paid) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#6B7280]">{c.caseReserve > 0 ? fmtAmt(c.caseReserve) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: "#0D1B2E" }}>{fmtAmt(c.incurred)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── PerilSummaryStrip ── */

export function PerilSummaryStrip({ perils, sov, lossHistory, layer }: {
  perils: string[];
  sov: SubmissionExtras["sov"];
  lossHistory: SubmissionExtras["lossHistory"];
  layer: string;
}) {
  const sovLocs = sov.locations ?? [];
  const totalTIV = sovLocs.reduce((s, l) => s + parseTIV(l.tiv), 0);
  const modelledCount = sovLocs.filter(l => l.catModel === "Modelled").length;
  const totalClaimsPaidK = (lossHistory.yearlyBreakdown ?? []).reduce((s, y) => s + parsePaidK(y.paid), 0);
  const claimsPaid5yr = fmtPaid(totalClaimsPaidK);

  const perilData = perils.map(peril => {
    const isNWS   = /windstorm/i.test(peril);
    const isEQ    = /earthquake/i.test(peril);
    const isFlood = /flood/i.test(peril);
    const isAOP   = !isNWS && !isEQ && !isFlood;

    const exposed = isAOP   ? sovLocs
      : isNWS   ? sovLocs.filter(l => NWS_STATES.has(l.state))
      : isFlood ? sovLocs.filter(l => FLOOD_STATES.has(l.state))
      : isEQ    ? sovLocs.filter(l => EQ_STATES.has(l.state))
      : [];

    const exposedTIV = exposed.reduce((s, l) => s + parseTIV(l.tiv), 0);
    const exposedPct = totalTIV > 0 ? Math.round((exposedTIV / totalTIV) * 100) : 0;
    const avgHazard  = exposed.length
      ? Math.round(exposed.reduce((s, l) => s + l.hazard, 0) / exposed.length)
      : 0;

    const abTIV = exposed.filter(l => locHazardGrade(l.hazard) === "A" || locHazardGrade(l.hazard) === "B")
      .reduce((s, l) => s + parseTIV(l.tiv), 0);
    const cdTIV = exposed.filter(l => locHazardGrade(l.hazard) === "C" || locHazardGrade(l.hazard) === "D")
      .reduce((s, l) => s + parseTIV(l.tiv), 0);
    const abPct = exposedTIV > 0 ? Math.round((abTIV / exposedTIV) * 100) : 0;
    const cdPct = exposedTIV > 0 ? Math.round((cdTIV / exposedTIV) * 100) : 0;

    const spkldTIV    = exposed.filter(l => parsePC(l.protectionCode) <= 3).reduce((s, l) => s + parseTIV(l.tiv), 0);
    const notSpkldTIV = exposedTIV - spkldTIV;
    const spkldPct    = exposedTIV > 0 ? Math.round((spkldTIV / exposedTIV) * 100) : 0;
    const notSpkldPct = 100 - spkldPct;

    const byState: Record<string, number> = {};
    exposed.forEach(l => { byState[l.state] = (byState[l.state] ?? 0) + parseTIV(l.tiv); });
    const topState = Object.entries(byState).sort((a, b) => b[1] - a[1])[0];

    const status: StepStatus = exposed.length === 0 ? "good"
      : avgHazard >= 70 ? "alert"
      : avgHazard >= 55 ? "watch"
      : "good";

    return { peril, exposedTIV, exposedPct, abTIV, cdTIV, abPct, cdPct, spkldTIV, notSpkldTIV, spkldPct, notSpkldPct, topState, exposed: exposed.length, status, isAOP };
  });

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Peril Summary</span>
        {modelledCount === 0 && !sov.modellingReady
          ? <span className="text-[9px] text-[#D97706]" style={{ fontWeight: 600 }}>Pending CAT &amp; HX Pricing Data</span>
          : <span className="text-[9px] text-[#9B9B98]">QBE layer: {layer} · {modelledCount}/{sov.stats?.locationCount ?? sovLocs.length} locations CAT modelled · 5-yr claims paid: {claimsPaid5yr}</span>
        }
      </div>
      <div className={`grid gap-0 divide-x divide-[#F0EFEC]`} style={{ gridTemplateColumns: `repeat(${perils.length}, 1fr)` }}>
        {perilData.map((p, i) => {
          const s = BAND_STYLE[p.status];
          return (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{p.peril}</span>
                <span className={`text-[9px] ${p.exposed === 0 ? "text-[#9B9B98]" : s.text}`} style={{ fontWeight: 600 }}>
                  {p.exposed === 0 ? "No exposure" : p.status === "alert" ? "Elevated" : p.status === "watch" ? "Monitor" : "In appetite"}
                </span>
              </div>
              {p.exposed > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9B9B98]">TIV</span>
                    <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{fmtTIV(p.exposedTIV)} <span className="text-[9px] text-[#9B9B98]">({p.exposedPct}%)</span></span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">A/B Hazard TIV</span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.abTIV)} <span className="text-[9px] text-[#9B9B98]">({p.abPct}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">C/D Hazard TIV</span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.cdTIV)} <span className="text-[9px] text-[#9B9B98]">({p.cdPct}%)</span>
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#F0EFEC] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
                        <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
                        Sprinklered TIV
                      </span>
                      <span className="text-[11px] tabular-nums text-[#2D2D2D]" style={{ fontWeight: 600 }}>
                        <span style={{ color: p.spkldPct >= 75 ? "#059669" : p.spkldPct >= 50 ? "#D97706" : "#DC2626" }}>{fmtTIV(p.spkldTIV)}</span>{" "}
                        <span className="text-[9px] text-[#9B9B98]">({p.spkldPct}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
                        <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#E0E8FF", border: "1px solid #CBD5E1" }} />
                        Not Sprinklered
                      </span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.notSpkldTIV)} <span className="text-[9px] text-[#9B9B98]">({p.notSpkldPct}%)</span>
                      </span>
                    </div>
                  </div>
                  {p.topState && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">Top State</span>
                      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{p.topState[0]} <span className="text-[9px] text-[#9B9B98]">{fmtTIV(p.topState[1])}</span></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9B9B98]">Claims Paid (5 yr)</span>
                    <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{claimsPaid5yr}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-[#C9C7C1] italic">No locations in {p.peril.toLowerCase()} exposure states</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── PreRatingComparables ── */

export function PreRatingComparables({ decisions, subjectHazard, subjectLayer }: {
  decisions: typeof HISTORIC_DECISIONS;
  subjectHazard: number;
  subjectLayer: string;
}) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Pre-Rating Decision Comparables</span>
          <span className="text-[10px] text-[#9B9B98] ml-2">Similar COPE profile · Frame / Light Mfg · Excess layer · Loss ratio 0.35–0.55</span>
        </div>
        <span className="text-[9px] text-[#9B9B98]">Hazard {subjectHazard}/100 · {subjectLayer}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[#F0EFEC]">
              {["Account", "Hazard", "Top Construction", "Top Occupancy", "Loss Ratio", "QBE Layer", "Decision", "Premium / Note"].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98] whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => {
              const ds = DECISION_STYLE[d.decision];
              const hazardDiff = d.hazard - subjectHazard;
              return (
                <tr key={i} className="border-b border-[#F0EFEC] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-3 py-2 text-[#2D2D2D]" style={{ fontWeight: 500 }}>{d.account}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <span className={`${d.hazard > subjectHazard ? "text-amber-600" : "text-emerald-600"}`} style={{ fontWeight: 600 }}>{d.hazard}</span>
                    <span className="text-[9px] text-[#9B9B98] ml-1">({hazardDiff > 0 ? "+" : ""}{hazardDiff})</span>
                  </td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.topConstruction} <span className="text-[#9B9B98]">{d.constrPct}%</span></td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.topOccupancy}</td>
                  <td className="px-3 py-2 tabular-nums text-[#4B5563]">{d.lossRatio}</td>
                  <td className="px-3 py-2 text-[#4B5563] whitespace-nowrap">{d.layer}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] border ${ds.bg} ${ds.color} ${ds.border}`} style={{ fontWeight: 700 }}>{ds.label}</span>
                  </td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.premium ?? <span className="text-[#9B9B98] italic">{d.note}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── BuildingRoster ── */

function BuildingRoster({ rows, lossLocMap, hasFilter, totalPaid, filterKey }: {
  rows: { loc: SovLocation; match: boolean }[];
  lossLocMap: Map<string, LossLocation>;
  hasFilter: boolean;
  totalPaid: number;
  filterKey?: string | null;
}) {
  const [sortCol, setSortCol] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["construction"]));
  const [visibleCount, setVisibleCount] = useState(20);
  const [colFilters, setColFilters] = useState({ state: "", construction: "", occupancy: "", catModel: "", healthCheck: "" });
  const [searchQ, setSearchQ] = useState("");
  const firstMatchRef = useRef<HTMLTableRowElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const uniqueStates        = useMemo(() => [...new Set(rows.map(r => r.loc.state))].sort(), [rows]);
  const uniqueConstructions = useMemo(() => [...new Set(rows.map(r => r.loc.construction))].sort(), [rows]);
  const uniqueOccupancies   = useMemo(() => [...new Set(rows.map(r => r.loc.occupancy))].sort(), [rows]);
  const hasColFilter = Object.values(colFilters).some(Boolean);

  useEffect(() => { setVisibleCount(20); }, [filterKey, sortCol, sortDir, colFilters, searchQ]);

  useEffect(() => {
    if (!filterKey) return;
    firstMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filterKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 50); },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length]);

  function toggleSort(col: SortKey) {
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
  function setColFilter(key: keyof typeof colFilters, val: string) {
    setColFilters(prev => ({ ...prev, [key]: val }));
  }

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    if (sortCol === "tiv")    { const va = parseTIV(a.loc.tiv), vb = parseTIV(b.loc.tiv); return sortDir === "desc" ? vb - va : va - vb; }
    if (sortCol === "hazard") { return sortDir === "desc" ? b.loc.hazard - a.loc.hazard : a.loc.hazard - b.loc.hazard; }
    const va = String(a.loc[sortCol as keyof SovLocation] ?? "");
    const vb = String(b.loc[sortCol as keyof SovLocation] ?? "");
    return sortDir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
  });

  const displayed = sorted.filter(({ loc: l, match }) => {
    if (hasFilter && !match) return false;
    if (colFilters.state        && l.state        !== colFilters.state)        return false;
    if (colFilters.construction && l.construction !== colFilters.construction) return false;
    if (colFilters.occupancy    && l.occupancy    !== colFilters.occupancy)    return false;
    if (colFilters.catModel     && l.catModel     !== colFilters.catModel)     return false;
    if (colFilters.healthCheck  && l.healthCheck  !== colFilters.healthCheck)  return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (![l.loc, l.state, l.construction, l.occupancy].some(v => String(v ?? "").toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const categories: SovCategory[] = [
    {
      key: "construction", label: "Construction & Structure",
      summary: { label: "Construction", sortKey: "construction", render: l => <span className="text-[#5D5D5D]">{l.construction}</span> },
      fields: [
        { label: "Construction", sortKey: "construction" as SortKey, render: l => <span className="text-[#5D5D5D]">{l.construction}</span> },
        { label: "ISO Class",    render: l => txt(l.constructionClass) },
        { label: "Year Built",   render: l => txt(l.yearBuilt) },
        { label: "Roof Age",     render: l => txt(l.roofAge !== undefined ? `${l.roofAge} yrs` : undefined) },
        { label: "Roof Type",    render: l => txt(l.roofType) },
        { label: "Stories",      render: l => txt(l.stories) },
        { label: "Sq Ft",        render: l => txt(l.sqFt !== undefined ? l.sqFt.toLocaleString() : undefined) },
      ],
    },
    {
      key: "protection", label: "Protection",
      summary: { label: "Sprinkler", render: l => <span className="text-[#5D5D5D]">{parsePC(l.protectionCode) <= 3 ? "Sprinklered" : "Non-Sprinklered"}</span> },
      fields: [
        { label: "Sprinkler",   render: l => <span className="text-[#5D5D5D]">{parsePC(l.protectionCode) <= 3 ? "Sprinklered" : "Non-Sprinklered"}</span> },
        { label: "Spk Type",    render: l => txt(l.sprinklerType) },
        { label: "Protection",  render: l => <span className="text-[#5D5D5D]">{l.protectionCode}</span> },
        { label: "Health Check",render: l => badgeCell(HEALTH_CHECK_CFG[l.healthCheck]) },
      ],
    },
    {
      key: "valuation", label: "Occupancy & Valuation",
      summary: { label: "TIV", sortKey: "tiv", render: l => <span className="text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{l.tiv}</span> },
      fields: [
        { label: "Occupancy", sortKey: "occupancy" as SortKey, render: l => <span className="text-[#5D5D5D]">{l.occupancy}</span> },
        { label: "Building",    render: l => txt(l.buildingValue) },
        { label: "Contents",    render: l => txt(l.contentsValue) },
        { label: "BI",          render: l => txt(l.biValue) },
        { label: "TIV", sortKey: "tiv", render: l => <span className="text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{l.tiv}</span> },
      ],
    },
    {
      key: "cat", label: "CAT & Modeling",
      summary: { label: "Hazard", sortKey: "hazard", render: hazardCell },
      fields: [
        { label: "Flood Zone",   render: l => txt(l.floodZone) },
        { label: "Dist. Coast",  render: l => txt(l.distanceToCoast) },
        { label: "CAT Modeling", render: l => badgeCell(CAT_MODEL_CFG[l.catModel]) },
        { label: "Hazard", sortKey: "hazard", render: hazardCell },
      ],
    },
    {
      key: "loss", label: "Loss",
      summary: {
        label: "5yr Paid Loss",
        render: l => {
          const lossRec = lossLocMap.get(l.loc);
          return lossRec ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span className="text-amber-700" style={{ fontWeight: 600 }}>{lossRec.paid}</span>
              <span className="text-[10px] text-[#9B9B98]">{lossRec.count}×</span>
            </span>
          ) : <span className="text-[#C4C2BE]">—</span>;
        },
      },
      fields: [
        {
          label: "5yr Paid Loss",
          render: l => {
            const lossRec = lossLocMap.get(l.loc);
            return lossRec ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span className="text-amber-700" style={{ fontWeight: 600 }}>{lossRec.paid}</span>
                <span className="text-[10px] text-[#9B9B98]">{lossRec.count}×</span>
              </span>
            ) : <span className="text-[#C4C2BE]">—</span>;
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

  const renderFieldTh = (f: SovField, key: string) => {
    const isSortable = !!f.sortKey;
    const isActive = f.sortKey && sortCol === f.sortKey;
    return (
      <th key={key}
        onClick={isSortable ? () => toggleSort(f.sortKey!) : undefined}
        className={`text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap select-none ${isSortable ? "cursor-pointer hover:bg-[#EAE9E6]" : ""} ${isActive ? "text-[#0076BC]" : ""}`}
        style={{ fontWeight: 700 }}>
        {f.label}{isActive ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
      </th>
    );
  };

  const filterSelect = (label: string, value: string, options: string[], key: keyof typeof colFilters) => (
    <select
      value={value}
      onChange={e => setColFilter(key, e.target.value)}
      className={`h-6 pl-2 pr-6 rounded border text-[10px] bg-white appearance-none cursor-pointer outline-none transition-colors ${value ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
      style={{ fontWeight: value ? 700 : 500 }}>
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF9] border-b border-[#E8E6E1]">
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
      <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF9] border-b border-[#E8E6E1] flex-wrap">
        <span className="text-[9px] uppercase tracking-wider text-[#9B9B98] flex-shrink-0" style={{ fontWeight: 700 }}>Filter</span>
        {filterSelect("State", colFilters.state, uniqueStates, "state")}
        {filterSelect("Construction", colFilters.construction, uniqueConstructions, "construction")}
        {filterSelect("Occupancy", colFilters.occupancy, uniqueOccupancies, "occupancy")}
        {filterSelect("CAT Model", colFilters.catModel, ["Modelled", "Pending", "Required"], "catModel")}
        {filterSelect("Health Check", colFilters.healthCheck, ["Pass", "Flag", "Review"], "healthCheck")}
        {hasColFilter && (
          <button onClick={() => setColFilters({ state: "", construction: "", occupancy: "", catModel: "", healthCheck: "" })}
            className="ml-1 text-[10px] text-[#0076BC] hover:text-[#005A8E] flex items-center gap-0.5 transition-colors"
            style={{ fontWeight: 600 }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-[#9B9B98] tabular-nums">{displayed.length} rows</span>
      </div>
      {!hasFilter && !hasColFilter && (
        <div className="px-4 py-2 bg-[#EEF6FF] border-b border-[#C2DFF4]">
          <p className="text-[10px] text-[#0076BC]">Expand a category header to reveal its fields, or select a measure on the left to filter this list.</p>
        </div>
      )}
      <table className="text-[12px] border-collapse" style={{ minWidth: "100%" }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#EDEBE7]">
            <th rowSpan={2}
              className="sticky left-0 z-30 bg-[#EDEBE7] text-left px-3 py-2 border-b border-r border-[#E0DDD7] whitespace-nowrap align-bottom"
              style={{ fontWeight: 700 }}>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleSort("loc")} className={`text-[10px] uppercase tracking-wide hover:text-[#0076BC] transition-colors ${sortCol === "loc" ? "text-[#0076BC]" : "text-[#4B5563]"}`} style={{ fontWeight: 700 }}>
                  Location{sortCol === "loc" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </button>
                <button onClick={() => toggleSort("state")} className={`text-[9px] uppercase tracking-wide hover:text-[#0076BC] transition-colors ${sortCol === "state" ? "text-[#0076BC]" : "text-[#9B9B98]"}`} style={{ fontWeight: 700 }}>
                  / State{sortCol === "state" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </button>
              </div>
            </th>
            {visible.map(({ cat, expanded, fields }) => (
              <th key={cat.key} colSpan={fields.length}
                className="text-left px-3 py-1.5 border-b border-l border-[#E0DDD7] bg-[#EDEBE7]">
                <button onClick={() => toggleCat(cat.key)}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#334155] hover:text-[#0076BC] transition-colors select-none"
                  style={{ fontWeight: 700 }}>
                  <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                  {cat.label}
                </button>
              </th>
            ))}
          </tr>
          <tr className="bg-[#F5F4F1]">
            {visible.map(({ cat, fields }) =>
              fields.map((f, i) => renderFieldTh(f, `${cat.key}-${i}`)),
            )}
          </tr>
        </thead>
        <tbody>
          {displayed.slice(0, visibleCount).map(({ loc: l, match }, rowIdx) => {
            const highlight = hasFilter && match;
            const isFirstMatch = highlight && rowIdx === 0;
            const stickyBg = highlight ? "bg-[#F0F9FF]" : "bg-white";
            return (
              <tr key={l.loc}
                ref={isFirstMatch ? firstMatchRef : undefined}
                className={`border-b border-[#F0EFEC] last:border-b-0 transition-all group ${highlight ? "bg-[#F0F9FF]" : "hover:bg-[#FAFAF9]"}`}>
                <td className={`sticky left-0 z-20 px-3 py-2 align-middle whitespace-nowrap border-r border-[#EFEEE9] ${stickyBg} group-hover:bg-[#FAFAF9]`}
                  style={{ fontWeight: highlight ? 600 : 500 }}>
                  <div className="text-[#2D2D2D] leading-tight">{l.loc}</div>
                  <div className="text-[10px] text-[#9B9B98] tabular-nums">{l.state}</div>
                </td>
                {visible.map(({ cat, fields }) =>
                  fields.map((f, i) => (
                    <td key={`${cat.key}-${i}`} className="px-3 py-2 align-middle whitespace-nowrap">
                      {f.render(l)}
                    </td>
                  )),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div ref={sentinelRef} className="h-1" />
      {visibleCount < sorted.length && (
        <div className="px-4 py-2 text-[10px] text-[#9B9B98] border-t border-[#E8E6E1] bg-[#FAFAF9]">
          Showing {Math.min(visibleCount, sorted.length).toLocaleString()} of {sorted.length.toLocaleString()} locations — scroll to load more
        </div>
      )}
      {totalPaid > 0 && visibleCount >= sorted.length && (
        <div className="px-4 py-2 border-t border-[#E8E6E1] bg-[#FAFAF9]">
          <p className="text-[10px] text-[#9B9B98]">
            5yr paid loss shows incurred amounts from the loss runs for locations with reported claims. Blank = no claims. &ldquo;— Not provided&rdquo; marks SOV fields not yet encoded.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── UWFollowUpCatModal ── */

export function UWFollowUpCatModal({ broker, brokerageHouse, accountName, brokerDraft, catDraft, declineDraft, defaultTab, onClose }: {
  broker: string; brokerageHouse: string; accountName: string;
  brokerDraft: string; catDraft: string; declineDraft: string;
  defaultTab?: UWFollowUpTab; onClose: () => void;
}) {
  const [tab, setTab] = useState<UWFollowUpTab>(defaultTab ?? "broker");
  const brokerEmail = `${broker.toLowerCase().replace(/\s+/g, ".")}@${brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;
  const catEmail = "cat.modelling@qbe.com";

  const subjects: Record<UWFollowUpTab, string> = {
    broker:  `[Action Required] Additional Information — ${accountName}`,
    cat:     `CAT Modelling Request — ${accountName}`,
    decline: `QBE — Decline to Quote — ${accountName}`,
  };
  const recipients: Record<UWFollowUpTab, { label: string; email: string }> = {
    broker:  { label: broker, email: brokerEmail },
    cat:     { label: "CAT Modelling Team", email: catEmail },
    decline: { label: broker, email: brokerEmail },
  };
  const [editedBodies, setEditedBodies] = useState<Record<UWFollowUpTab, string>>({
    broker:  brokerDraft,
    cat:     catDraft,
    decline: declineDraft,
  });

  const handleSend = () => {
    const { email, label } = recipients[tab];
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subjects[tab])}&body=${encodeURIComponent(editedBodies[tab])}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Draft opened — ${label}`);
    onClose();
  };

  const { label: toLabel, email: toEmail } = recipients[tab];
  const activeOpt = UW_FOLLOWUP_OPTIONS.find(o => o.id === tab)!;
  const ActiveIcon = activeOpt.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center border bg-[#EEF6FF] border-[#C2DFF4]">
              <ActiveIcon className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{activeOpt.label}</div>
              <div className="text-[10px] text-[#9B9B98]">{broker} · {brokerageHouse} · {accountName}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#F0EFEC] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>To</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate" style={{ fontWeight: 600 }}>
              {toLabel} &lt;{toEmail}&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563] truncate">{subjects[tab]}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "cat" && (
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FFF7ED] border border-[#FED7AA]">
              <AlertTriangle className="w-3 h-3 text-[#EA580C] flex-shrink-0" />
              <span className="text-[10px] text-[#9A3412]" style={{ fontWeight: 600 }}>Internal email — recipient: CAT Modelling Team (cat.modelling@qbe.com)</span>
            </div>
          )}
          <textarea
            key={tab}
            value={editedBodies[tab]}
            onChange={e => setEditedBodies(prev => ({ ...prev, [tab]: e.target.value }))}
            rows={14}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            spellCheck
          />
        </div>

        {tab === "cat" && (
          <div className="px-4 py-2 flex-shrink-0 border-t border-[#F0EFEC] flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider text-[#9B9B98] flex-shrink-0" style={{ fontWeight: 700 }}>Attachments</span>
            {["2026 SOV Heartland_Submission", "2026 SOV Heartland_Mapped Submission"].map(name => (
              <a key={name} href="#" download={`${name}.xlsx`}
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F4F1] border border-[#E8E6E1] hover:bg-[#EEF6FF] hover:border-[#C2DFF4] transition-colors group">
                <FileText className="w-2.5 h-2.5 text-[#0076BC] flex-shrink-0" />
                <span className="text-[10px] text-[#374151]" style={{ fontWeight: 500 }}>{name}.xlsx</span>
                <Download className="w-2.5 h-2.5 text-[#9B9B98] group-hover:text-[#0076BC] transition-colors" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            Cancel
          </button>
          <button onClick={handleSend}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-[11px] transition-colors bg-[#0076BC] hover:bg-[#005A8E]"
            style={{ fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" />
            Open Draft Email
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── UWAnalysisActions ── */

export function UWAnalysisActions({ onRequestInfo, onRequestCat, onDecline, onProceed }: {
  onRequestInfo: () => void; onRequestCat: () => void; onDecline: () => void; onProceed: () => void;
}) {
  useStepActions([
    { icon: Mail,      label: "Request Additional Information", variant: "secondary" as const, onClick: onRequestInfo },
    { icon: BarChart3, label: "CAT Modelling Request",          variant: "secondary" as const, onClick: onRequestCat },
    { icon: XCircle,   label: "Decline to Quote",               variant: "secondary" as const, onClick: onDecline },
    { icon: ChevronRight, label: "Advance to UW Review", onClick: onProceed },
  ], []);
  return null;
}

/* ── UWAnalysisStep ── */

export function UWAnalysisStep({ onProceed }: { onProceed: () => void }) {
  const { meta, idx, extras } = useSubmissionCtx();
  const [showFollowUpCat, setShowFollowUpCat] = useState(false);
  const [followUpCatDefaultTab, setFollowUpCatDefaultTab] = useState<UWFollowUpTab>("broker");
  const [measureFilter, setMeasureFilter] = useState<MeasureFilter>(null);

  const brokerDraft = `Dear ${meta.broker},\n\nFollowing our review of ${meta.namedInsured}'s submission, we have a few outstanding items requiring your attention:\n\nSubmission Reference: ${meta.id}\n\n• ${extras.sov.dataCleansingNote}\n${extras.documents.filter(d => !d.received).map(d => `• ${d.name} — not yet received, required for rating`).join("\n")}\n\nPlease provide the above at your earliest convenience to avoid SLA delays.\n\nBest regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const catDraft = `Dear CAT Modelling Team,\n\nPlease prioritise the CAT model run for the following account:\n\nAccount:       ${meta.namedInsured}\nSubmission ID: ${meta.id}\nTIV:           ${meta.tivFull}\n\nPlease model the following layers:\n\n  Primary $2.25B    $2.16M\n  Primary $1.5B     $2.56M\n  Primary $0.5B     $1.5M\n\nFull SOV and mapped submission are attached.\n\nAdditional UW Instructions:\n[Please add any specific modelling requirements here]\n\nRequired by: ${meta.inceptionDate}\nAssigned UW: ${idx.assignedUW || "Mike Farrell"}\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const declineDraft = `Dear ${meta.broker},\n\nThank you for presenting ${meta.namedInsured} for our consideration.\n\nSubmission Reference: ${meta.id}\n\nFollowing a careful review of the submission and underwriting analysis, we regret that we are unable to provide terms on this occasion.\n\nWe remain open to discussing alternative solutions and look forward to working with you on future opportunities.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const sov = extras.sov;

  const [locations, setLocations] = useState<SovLocation[]>(sov.locations ?? []);
  const [locationsLoading, setLocationsLoading] = useState(!!(sov.locationsLoader && !(sov.locations?.length)));
  useEffect(() => {
    if (sov.locationsLoader && !(sov.locations?.length)) {
      sov.locationsLoader().then(locs => { setLocations(locs); setLocationsLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const constructionGroups = groupByTIV(locations, (l) => l.construction);
  const occupancyGroups    = groupByTIV(locations, (l) => l.occupancy);
  const protectionGroups   = groupByTIV(locations, (l) => l.protectionCode);
  const exposureGroups     = groupByTIV(locations, (l) => l.state);

  const constrWorst   = [...constructionGroups].sort((a, b) => b.avgHazard - a.avgHazard)[0];
  const constrSubject = constructionGroups[0]?.avgHazard ?? idx.hazardScore;

  const occWorst   = [...occupancyGroups].sort((a, b) => b.avgHazard - a.avgHazard)[0];
  const occSubject = occupancyGroups[0]?.avgHazard ?? idx.hazardScore;

  const reDoc = extras.documents.find((d) => d.name === "Risk Engineering Report");
  const avgPC = locations.length
    ? locations.reduce((s, l) => s + parsePC(l.protectionCode), 0) / locations.length : 4;
  const protSubject = protectionScore(avgPC);
  const protFocus   = !reDoc?.received
    ? `No current risk engineering report on file — protection grades unverified across ${fmtTIV(protectionGroups.reduce((s, g) => s + g.tiv, 0))} of TIV.`
    : reDoc.needsReview && reDoc.reviewReason ? reDoc.reviewReason
    : `Protection confirmed by risk engineering; lead exposure at ${protectionGroups[0]?.key ?? "—"}.`;

  const accumulationRows = exposureGroups.map((g) => {
    const locs = locations.filter(l => l.state === g.key);
    const catFlags: string[] = [];
    if (NWS_STATES.has(g.key))   catFlags.push("NWS");
    if (EQ_STATES.has(g.key))    catFlags.push("EQ");
    if (FLOOD_STATES.has(g.key)) catFlags.push("Flood");
    return { ...g, locCount: locs.length, catFlags };
  });
  const expTop = accumulationRows[0];

  const totalPaid  = extras.lossHistory.topLocations.reduce((s, l) => s + parseTIV(l.paid), 0);
  const lossLocSet = new Set(extras.lossHistory.topLocations.map((l) => l.loc));
  const lossLocMap = new Map(extras.lossHistory.topLocations.map((l) => [l.loc, l]));

  const spklTIV    = locations.filter(l => parsePC(l.protectionCode) <= 3).reduce((s, l) => s + parseTIV(l.tiv), 0);
  const totalSOVTIV = locations.reduce((s, l) => s + parseTIV(l.tiv), 0);
  const notSpklTIV = totalSOVTIV - spklTIV;
  const spklPct    = totalSOVTIV > 0 ? Math.round((spklTIV / totalSOVTIV) * 100) : 0;
  const notSpklPct = 100 - spklPct;

  const gradeGroups = (["A", "B", "C", "D"] as const).map(grade => ({
    grade,
    tiv: locations.filter(l => locHazardGrade(l.hazard) === grade).reduce((s, l) => s + parseTIV(l.tiv), 0),
  }));
  const constrMetric = gradeGroups.map(g => `${g.grade} ${fmtTIV(g.tiv)}`).join(" · ");

  const categories: StepCategory[] = [
    {
      key: "construction",
      icon: Hammer,
      title: "Construction",
      metric: constrMetric,
      status: hazardBand(constrSubject),
      statusLabel: constrSubject >= 70 ? "High Hazard" : constrSubject >= 50 ? "Moderate Hazard" : "Low Hazard",
      headline: constrWorst
        ? `${constrWorst.key} drives the highest construction hazard (${constrWorst.avgHazard}/100) across ${fmtTIV(constrWorst.tiv)} — ${constrWorst.pct}% of TIV.`
        : "No construction data on file.",
      context: `Construction mix: ${constructionGroups.map(g => `${g.key} ${g.pct}%`).join(" · ")}`,
      summaryRows: constructionGroups.map((g) => ({
        key: g.key, label: g.key, value: fmtTIV(g.tiv), sub: `${g.pct}%`,
        status: g.band,
      })),
      groups: [
        {
          title: "Sprinkler Protection — TIV Breakout",
          rows: [
            {
              label: "Sprinklered TIV",
              value: `${fmtTIV(spklTIV)} (${spklPct}%)`,
              status: spklPct >= 75 ? "good" : spklPct >= 50 ? "watch" : "alert",
              note: "Locations with Protection Class ≤ 3 (sprinkler-protected)",
            },
            {
              label: "Not Sprinklered TIV",
              value: `${fmtTIV(notSpklTIV)} (${notSpklPct}%)`,
              status: notSpklPct > 50 ? "alert" : notSpklPct > 25 ? "watch" : "good",
              note: "Locations with Protection Class > 3 (unsprinklered or limited protection)",
            },
          ],
        },
      ],
    },

    {
      key: "occupancy",
      icon: Layers,
      title: "Occupancy",
      metric: `${occSubject}/100`,
      status: hazardBand(occSubject),
      statusLabel: occSubject >= 70 ? "High Hazard" : occSubject >= 50 ? "Moderate Hazard" : "Low Hazard",
      headline: occWorst
        ? `${occWorst.key} carries the heaviest ignition/severity load (${occWorst.avgHazard}/100) across ${fmtTIV(occWorst.tiv)} of TIV.`
        : "No occupancy data on file.",
      context: `Occupancy mix: ${occupancyGroups.map(g => `${g.key} ${g.pct}%`).join(" · ")}`,
      summaryRows: occupancyGroups.map((g) => ({
        key: g.key, label: g.key, value: fmtTIV(g.tiv), sub: `${g.pct}%`,
        status: g.band,
      })),
    },

    {
      key: "protection",
      icon: Shield,
      title: "Protection",
      metric: `${notSpklPct}% Non-Sprinklered`,
      status: reDoc?.received ? hazardBand(100 - protSubject) : "watch",
      statusLabel: reDoc?.received
        ? (spklPct >= 75 ? "Well Protected" : spklPct >= 50 ? "Partially Protected" : "Limited Protection")
        : "Unverified",
      headline: protFocus,
      context: `${spklPct}% of TIV in sprinkler-protected locations (PC ≤ 3). ${reDoc?.received ? "Risk engineering report on file." : "No risk engineering report on file — protection grades unconfirmed."}`,
      summaryRows: [
        {
          key: "sprinklered",
          label: "Sprinklered",
          value: fmtTIV(spklTIV),
          sub: `${spklPct}%`,
          status: (spklPct >= 75 ? "good" : spklPct >= 50 ? "watch" : "alert") as "good" | "watch" | "alert",
        },
        {
          key: "non-sprinklered",
          label: "Non-Sprinklered",
          value: fmtTIV(notSpklTIV),
          sub: `${notSpklPct}%`,
          status: (notSpklPct > 50 ? "alert" : notSpklPct > 25 ? "watch" : "good") as "good" | "watch" | "alert",
        },
      ],
    },

    {
      key: "exposure",
      icon: Globe2,
      title: "Exposure Accumulation",
      metric: expTop ? `${expTop.key} — ${expTop.pct}% of TIV` : undefined,
      status: expTop ? concentrationBand(expTop.pct) : "neutral",
      statusLabel: expTop
        ? `${expTop.locCount} location${expTop.locCount !== 1 ? "s" : ""}${expTop.catFlags.length ? " · CAT exposed" : ""}`
        : "No concentration",
      headline: expTop
        ? `${expTop.key} is the largest geographic concentration at ${fmtTIV(expTop.tiv)} (${expTop.pct}% of TIV) across ${expTop.locCount} location${expTop.locCount !== 1 ? "s" : ""}.`
        : "No geographic data on file.",
      context: accumulationRows.some(r => r.catFlags.length > 0)
        ? `CAT-exposed states: ${accumulationRows.filter(r => r.catFlags.length > 0).map(r => `${r.key} (${r.catFlags.join("/")})`).join(", ")}`
        : "No material CAT exposure by state.",
      summaryRows: accumulationRows.slice(0, 5).map((r) => ({
        key: r.key,
        label: r.key,
        value: fmtTIV(r.tiv),
        sub: `${r.pct}% · ${r.locCount} loc${r.locCount !== 1 ? "s" : ""}`,
        status: concentrationBand(r.pct),
      })),
      groups: [
        {
          title: "Accumulation by State",
          rows: accumulationRows.map(r => ({
            label: r.key,
            value: `${fmtTIV(r.tiv)} · ${r.pct}%`,
            status: concentrationBand(r.pct),
            note: `${r.locCount} location${r.locCount !== 1 ? "s" : ""}${r.catFlags.length ? ` — CAT exposed (${r.catFlags.join(", ")})` : ""}`,
          })),
        },
      ],
    },
  ];

  const proceedToCat = sov.modellingReady && sov.completenessPct >= 90;
  const missingDoc = extras.documents.find((d) => !d.received);
  const overallStatus: StepStatus = proceedToCat ? "good" : "watch";

  function handleRowSelect(categoryKey: string, rowKey: string) {
    setMeasureFilter(prev =>
      prev && prev.category === categoryKey && prev.rowKey === rowKey ? null : { category: categoryKey, rowKey });
  }

  const activeField = measureFilter ? CATEGORY_FIELD[measureFilter.category] : undefined;
  const filteredRows = locations.map((l) => {
    if (!measureFilter) return { loc: l, match: true };
    if (measureFilter.category === "loss") {
      return { loc: l, match: lossLocSet.has(l.loc) && l.loc === measureFilter.rowKey };
    }
    return { loc: l, match: activeField !== undefined && l[activeField] === measureFilter.rowKey };
  });
  const matchCount = filteredRows.filter((r) => r.match).length;

  return (
    <>
      <UWAnalysisActions
        onRequestInfo={() => { setFollowUpCatDefaultTab("broker");  setShowFollowUpCat(true); }}
        onRequestCat={() =>  { setFollowUpCatDefaultTab("cat");     setShowFollowUpCat(true); }}
        onDecline={() =>     { setFollowUpCatDefaultTab("decline"); setShowFollowUpCat(true); }}
        onProceed={onProceed} />

      <StepShell
        summary={
          <div className="space-y-3">
            <div className="bg-white border border-[#E8E6E1] rounded-md">
              <div className="grid grid-cols-5 divide-x divide-[#E8E6E1]">
                {[
                  { label: "Total TIV",        value: sov.stats.totalTIV,                                                              color: "#0D1B2E" },
                  { label: "Locations",         value: String(sov.stats.locationCount),                                                 color: "#0D1B2E" },
                  { label: "Avg Hazard",        value: `${sov.stats.avgHazard}/100`,                                                    color: sov.stats.avgHazard >= 70 ? "#DC2626" : sov.stats.avgHazard >= 50 ? "#D97706" : "#059669" },
                  { label: "Top Accumulation",  value: expTop ? `${expTop.key} ${expTop.pct}%` : "—",                                  color: expTop ? "#059669" : "#9B9B98" },
                  { label: "5-Yr Loss Ratio",   value: extras.lossHistory.lossRatio,                                                   color: extras.lossHistory.lossRatioBand === "good" ? "#059669" : extras.lossHistory.lossRatioBand === "watch" ? "#D97706" : "#DC2626" },
                ].map(stat => (
                  <div key={stat.label} className="px-3 py-1.5">
                    <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                    <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {showFollowUpCat && createPortal(
              <UWFollowUpCatModal
                broker={meta.broker}
                brokerageHouse={meta.brokerageHouse}
                accountName={meta.accountName}
                brokerDraft={brokerDraft}
                catDraft={catDraft}
                declineDraft={declineDraft}
                defaultTab={followUpCatDefaultTab}
                onClose={() => setShowFollowUpCat(false)}
              />,
              document.body
            )}
            <PerilSummaryStrip perils={extras.request.perils} sov={sov} lossHistory={extras.lossHistory} layer={extras.request.qbeLayer} />
            <LossHistoryTable lossHistory={extras.lossHistory} submissionType={meta.type} />
          </div>
        }
        leftHeader={<PaneTitle title="COPE Analysis" hint="select any measure to filter the building list →" />}
        left={
          <CategorySummaryList
            categories={categories}
            activeKey={categories[0].key}
            onSelect={() => {}}
            allExpanded
            globalActiveRow={measureFilter}
            onRowSelect={handleRowSelect}
          />
        }
        rightHeader={
          <>
            <MapPin className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
            <PaneTitle title="Statement of Values" hint={locationsLoading ? "Loading locations…" : measureFilter ? `${matchCount} of ${sov.stats.locationCount} locations` : `All ${locations.length} locations`} />
            {measureFilter && (
              <button onClick={() => setMeasureFilter(null)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#C2DFF4] border border-[#0076BC] text-[#0076BC] hover:bg-[#BEE3F8] transition-colors ml-auto" style={{ fontWeight: 600 }}>
                {measureFilter.rowKey} <X className="w-3 h-3" />
              </button>
            )}
          </>
        }
        right={
          locationsLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <div className="text-[11px] text-[#6B7280] font-medium mb-1">Loading {sov.stats.locationCount.toLocaleString()} locations…</div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-7 rounded bg-[#F0EFEC] animate-pulse" style={{ opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          ) : (
            <BuildingRoster
              rows={filteredRows}
              lossLocMap={lossLocMap}
              hasFilter={!!measureFilter}
              totalPaid={totalPaid}
              filterKey={measureFilter ? `${measureFilter.category}|${measureFilter.rowKey}` : null}
            />
          )
        }
      />
    </>
  );
}
