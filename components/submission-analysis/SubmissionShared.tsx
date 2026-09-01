"use client";
import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { SovLocation } from "../SubmissionTypes";
import { parseTIV } from "../SubmissionHelpers";
import type { ProcessingStatus } from "../CustomerTable";
import { CheckCircle2, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  HAZARD_GRADE_CFG,
  CONSTRUCTION_COLORS,
  STATE_PALETTE,
} from "./mock-data";

/* ── Re-export constants needed by consumers ── */
export { HAZARD_GRADE_CFG, CONSTRUCTION_COLORS, STATE_PALETTE };

/* ── TivSlice type ── */
export type TivSlice = { name: string; pct: number; color: string };

/* ── Hazard grade derivation helpers ── */

export function locHazardGrade(score: number): keyof typeof HAZARD_GRADE_CFG {
  if (score <= 50) return "A";
  if (score <= 65) return "B";
  if (score <= 75) return "C";
  return "D";
}

export function occupancyHazardGrade(occupancyByTIV: { name: string; pct: number }[]): string | null {
  if (!occupancyByTIV || occupancyByTIV.length === 0) return null;
  const dominant = occupancyByTIV.reduce((a, b) => (b.pct > a.pct ? b : a), occupancyByTIV[0]);
  const name = dominant?.name?.toLowerCase() ?? "";
  if (name.includes("office") || name.includes("lab")) return "A";
  if (name.includes("data center") || name.includes("warehouse") || name.includes("distribution")) return "B";
  if (name.includes("mfg") || name.includes("manufacturing") || name.includes("hotel")) return "C";
  return "C";
}

export function constructionHazardGrade(topClass: string, pct: number): string {
  const c = topClass.toLowerCase();
  if (c.includes("fire resist")) return "A";
  if (c.includes("steel") || (c.includes("masonry") && !c.includes("masonry nc"))) return "B";
  if (c.includes("masonry nc")) return "C";
  if (c.includes("frame") && pct >= 50) return "D";
  if (c.includes("frame")) return "C";
  return "B";
}

export function territoryHazardGrade(territory: string): string {
  const states = territory.toUpperCase().split(/[,\s]+/).filter(Boolean);
  const hasFl = states.includes("FL");
  const hasCa = states.includes("CA");
  if (hasFl && hasCa) return "D";
  if (hasFl || hasCa) return "C";
  const moderateStates = ["TX", "OK", "LA", "MS", "AL", "GA", "SC", "NC"];
  if (states.some((s) => moderateStates.includes(s))) return "B";
  return "A";
}

/* ── Workflow step index helper ── */

export function statusStepIndex(ps: ProcessingStatus): number {
  const map: Record<ProcessingStatus, number> = {
    "not-processed": 1, "follow-up-required": 1, "ready-for-ops": 1,
    "ready-for-uw": 2, "uw-analysis": 3, "uw-review": 4, "customer-decision": 5,
  };
  return map[ps] ?? 1;
}

/* ── TIV mix builder ── */

export function buildTivMix(
  locations: SovLocation[],
  key: "construction" | "state",
  colorMap?: Record<string, string>,
  palette?: string[],
): TivSlice[] {
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const loc of locations) {
    const tivVal = parseTIV(loc.tiv);
    const groupKey = key === "state" ? loc.state : loc.construction;
    totals[groupKey] = (totals[groupKey] ?? 0) + tivVal;
    grand += tivVal;
  }
  if (grand === 0) return [];
  const paletteRef = palette ?? STATE_PALETTE;
  let paletteIdx = 0;
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => ({
      name,
      pct: Math.round((val / grand) * 100),
      color: colorMap?.[name] ?? paletteRef[paletteIdx++ % paletteRef.length],
    }));
}

/* ── TivMixBar component ── */

export function TivMixBar({ label, slices }: { label: string; slices: TivSlice[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-[#9B9B98] mb-1" style={{ fontWeight: 700 }}>{label}</div>
      <div className="h-1.5 rounded-full overflow-hidden flex w-full">
        {slices.map((s) => (
          <div key={s.name} style={{ width: `${s.pct}%`, backgroundColor: s.color, flexShrink: 0 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] text-[#6B7280] whitespace-nowrap">{s.name} {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MetricTooltip component ── */

const METRIC_TOOLTIP_TEXT = "The tooltip text needs to be updated";

export function MetricTooltip({ content = METRIC_TOOLTIP_TEXT }: { content?: string }) {
  return (
    <TooltipPrimitive.Root delayDuration={100}>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#C9C7C1] text-[#9B9B98] hover:border-[#0076BC] hover:text-[#0076BC] transition-colors flex-shrink-0"
          style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}
          aria-label="Metric explanation"
        >
          i
        </button>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top" align="center" sideOffset={6}
          className="z-[9999] max-w-[260px] px-3 py-2 rounded-lg text-[11px] leading-snug"
          style={{
            backgroundColor: "#fff",
            color: "#374151",
            fontWeight: 500,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
          }}
        >
          {content}
          <TooltipPrimitive.Arrow style={{ fill: "#E5E7EB" }} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ── Shared small primitives ── */

export function PanelHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="px-4 py-2.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center gap-2 min-w-0 overflow-hidden">
      <Icon className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
      <span className="text-[13px] text-[#2D2D2D] flex-shrink-0" style={{ fontWeight: 600 }}>{title}</span>
      {subtitle && <span className="text-[11px] text-[#9B9B98] truncate min-w-0">— {subtitle}</span>}
    </div>
  );
}

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 600 }}>
      {children}
    </span>
  );
}

export function MiniField({ label, value }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-md border border-[#E8E6E1] p-2">
      <div className="text-[9px] uppercase tracking-wide text-[#6B7280] mb-0.5" style={{ fontWeight: 600 }}>{label}</div>
      <div className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export function RequestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-[#6B7280] w-28 flex-shrink-0" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function PolicyRow({ label, value }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function TriageTick({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-2 ${passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      {passed
        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        : <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      <span className={`text-[11px] ${passed ? "text-emerald-800" : "text-amber-800"}`} style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}
