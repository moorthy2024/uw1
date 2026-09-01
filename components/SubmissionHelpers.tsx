"use client";
import { type ReactNode } from "react";
import {
  Building2, ClipboardList, Target, Sparkles, Scale, Gavel, Send,
} from "lucide-react";
import {
  type Band, type StepInsight, type Recommendation, type SovLocation,
  type KeyScore, type SubmissionMeta,
} from "./SubmissionTypes";
import {
  type IndustryClass, type ProcessingStatus,
} from "./CustomerTable";

/* ─────────────────────────── Workflow steps metadata ─────────────────────────── */

export const WORKFLOW_STEPS = [
  { label: "Account Overview", short: "Overview", icon: Building2, desc: "Account summary, documents & recommendation" },
  { label: "Ingestion", short: "Ingestion", icon: ClipboardList, desc: "Validate extracted data & documentation from broker" },
  { label: "Triage", short: "Triage", icon: Target, desc: "Clearance, scoring engines & go / no-go guidance" },
  { label: "UW Analysis", short: "Analysis", icon: Sparkles, desc: "Decision criteria, CAT modelling & quote generation" },
  { label: "UW Review", short: "Review", icon: Scale, desc: "Approval & compliance check before broker submission" },
  { label: "Customer Decision", short: "Decision", icon: Gavel, desc: "Policy & binder documentation or submission close-out" },
] as const;

/* ─────────────────────────── Derivation helpers ─────────────────────────── */

export const RECOMMENDATION_CONFIG: Record<Recommendation, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "out-of-scope": { label: "Out of Scope", color: "text-red-800", bg: "bg-red-50", border: "border-red-300", dot: "bg-red-500" },
  "follow-up": { label: "Follow Up Required", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-300", dot: "bg-amber-500" },
  "limited": { label: "Limited / Review Needed", color: "text-[#003087]", bg: "bg-[#EEF6FF]", border: "border-[#0076BC]", dot: "bg-[#0076BC]" },
  "in-scope": { label: "In Scope — Proceed to Rating", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-300", dot: "bg-emerald-500" },
};


export function deriveRecommendation(cls: IndustryClass, status: ProcessingStatus): Recommendation {
  if (cls === "out-of-scope") return "out-of-scope";
  if (status === "follow-up-required") return "follow-up";
  if (cls === "limited") return "limited";
  return "in-scope";
}

export function hazardBand(score: number): Band {
  return score <= 50 ? "good" : score <= 70 ? "watch" : "alert";
}

/* Builds the AI UW Agent insight message for a given workflow step, reusing
   the recommendation + summary content already computed on that screen. */
export function buildStepInsight(
  id: string,
  activeStep: number,
  meta: SubmissionMeta | null,
  focusNote: string,
  recommendationLabel: string,
  keyScores: KeyScore[],
): StepInsight {
  const stepLabel = WORKFLOW_STEPS[activeStep]?.label ?? "Overview";
  const account = meta?.accountName ?? "This submission";
  const score = (label: string) => keyScores.find(s => s.label === label);

  const line = (s?: KeyScore) => (s ? `• ${s.label}: ${s.value} — ${s.note}` : null);

  // Pick the scores most relevant to each step
  const perStep: Record<number, (KeyScore | undefined)[]> = {
    0: [score("Hazard Score"), score("AI Priority Score"), score("Success Propensity")],
    1: [score("SOV Data Completeness"), score("Hazard Score")],
    2: [score("AI Priority Score"), score("Hazard Score"), score("Success Propensity")],
    3: [score("Hazard Score"), score("Loss History"), score("Capacity Guidelines"), score("SOV Data Completeness")],
    4: [score("Loss History"), score("Capacity Guidelines"), score("Success Propensity")],
    5: [score("AI Priority Score"), score("Hazard Score"), score("Loss History")],
  };

  const bullets = (perStep[activeStep] ?? perStep[0])
    .map(line)
    .filter((l): l is string => Boolean(l));

  const header = `${account} — ${stepLabel} insights\n\nRecommendation: ${recommendationLabel}`;
  const summary = meta?.summary ? `\n\n${meta.summary}` : "";
  const focus = focusNote ? `\n\nFocus: ${focusNote}` : "";
  const body = bullets.length ? `\n\n${bullets.join("\n")}` : "";

  return {
    key: `${id}::${activeStep}`,
    stepIndex: activeStep,
    stepLabel,
    prompt: "Show me the insights",
    message: `${header}${summary}${focus}${body}`,
  };
}

export function winBand(score: number): Band {
  return score >= 75 ? "good" : score >= 60 ? "watch" : "alert";
}

export const BAND_STYLE: Record<Band, { chip: string; text: string; label: string }> = {
  good: { chip: "bg-emerald-500", text: "text-emerald-700", label: "Good" },
  watch: { chip: "bg-amber-500", text: "text-amber-700", label: "Watch" },
  alert: { chip: "bg-red-500", text: "text-red-700", label: "Alert" },
};

/* TIV string helpers — parse "$62M" → 62 ($M), format 62 → "$62M" */
export function parseTIV(tiv: string): number {
  const n = parseFloat(tiv.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
/* Parse claim paid amounts to thousands — "$142K" → 142, "$1.2M" → 1200 */
export function parsePaidK(paid: string): number {
  const n = parseFloat(paid.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return paid.toUpperCase().includes("M") ? n * 1000 : n;
}
export function fmtTIV(millions: number): string {
  return millions >= 1000 ? `$${(millions / 1000).toFixed(1)}B` : `$${Math.round(millions)}M`;
}
export function fmtPaid(thousands: number): string {
  if (thousands === 0) return "$0";
  if (thousands >= 1000) return `$${(thousands / 1000).toFixed(thousands % 1000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(thousands)}K`;
}
export function concentrationBand(pct: number): Band {
  return pct <= 15 ? "good" : pct <= 30 ? "watch" : "alert";
}

/* ─────────────────────────── C. UW Analysis — shared tile shell ─────────────────────────── */


/* Bound-book benchmarks by industry (mock) — the comparative baseline for the L2 row. */
export interface PeerBenchmark { constructionHazard: number; occupancyHazard: number; protectionScore: number; lossRatio: number }
export const PEER_BENCHMARK: Record<string, PeerBenchmark> = {
  Manufacturing: { constructionHazard: 63, occupancyHazard: 66, protectionScore: 72, lossRatio: 0.29 },
  Technology: { constructionHazard: 42, occupancyHazard: 48, protectionScore: 85, lossRatio: 0.12 },
  Logistics: { constructionHazard: 64, occupancyHazard: 62, protectionScore: 70, lossRatio: 0.34 },
  Hospitality: { constructionHazard: 70, occupancyHazard: 71, protectionScore: 64, lossRatio: 0.41 },
};
export const DEFAULT_BENCHMARK: PeerBenchmark = { constructionHazard: 60, occupancyHazard: 60, protectionScore: 72, lossRatio: 0.30 };
export function benchmarkFor(industry: string): PeerBenchmark { return PEER_BENCHMARK[industry] ?? DEFAULT_BENCHMARK; }


export function parsePC(code: string): number { const n = parseFloat(code.replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : 4; }

export interface CopeGroup { key: string; tiv: number; pct: number; avgHazard: number; band: Band }

export function groupByTIV(locations: SovLocation[], keyFn: (l: SovLocation) => string): CopeGroup[] {
  const total = locations.reduce((s, l) => s + parseTIV(l.tiv), 0) || 1;
  const map = new Map<string, { tiv: number; hazardSum: number; count: number }>();
  for (const l of locations) {
    const k = keyFn(l);
    const cur = map.get(k) ?? { tiv: 0, hazardSum: 0, count: 0 };
    cur.tiv += parseTIV(l.tiv);
    cur.hazardSum += l.hazard;
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([key, v]) => {
      const avgHazard = Math.round(v.hazardSum / v.count);
      return { key, tiv: v.tiv, pct: Math.round((v.tiv / total) * 100), avgHazard, band: hazardBand(avgHazard) };
    })
    .sort((a, b) => b.tiv - a.tiv);
}

/** Where a single measure sits against comparable existing accounts. */
export type BookDelta = "under" | "in-line" | "over";

/** Compare a measure to the book baseline; within ±5% counts as in line. */
export function bookDelta(subject: number, benchmark: number, tolerance = 0.05): BookDelta {
  const base = Math.abs(benchmark) || 1;
  const rel = (subject - benchmark) / base;
  if (Math.abs(rel) < tolerance) return "in-line";
  return rel > 0 ? "over" : "under";
}

export function protectionScore(pc: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - (pc - 1) * 14)));
}

/* ─────────────────────────── Step wrappers ─────────────────────────── */

export function ActionBtn({ icon: Icon, label, variant = "primary", onClick, disabled }: {
  icon: typeof Send; label: string; variant?: "primary" | "secondary" | "danger" | "ghost";
  onClick?: () => void; disabled?: boolean;
}) {
  const enabledCls =
    variant === "primary" ? "bg-[#00205B] text-white hover:bg-[#001740] border-transparent" :
    variant === "danger" ? "bg-red-600 text-white hover:bg-red-700 border-transparent" :
    variant === "ghost" ? "bg-transparent text-[#4B5563] hover:bg-[#F3F3F1] border-[#E8E6E1]" :
    "bg-white text-[#0076BC] hover:bg-[#F0F8FF] border-[#C2DFF4]";
  const disabledCls = "bg-[#F3F3F1] text-[#B0B0AC] border-[#E8E6E1] cursor-not-allowed";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] transition-colors ${disabled ? disabledCls : enabledCls}`}
      style={{ fontWeight: 600 }}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

