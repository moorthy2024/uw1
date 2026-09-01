"use client";
/* Standardised workflow-step layout.

   Every step below Ingestion presents the same three regions:
     1. a full-width summary band — key details plus the AI agent's write-up
     2. left half  — AI-generated detail, summarised by category
     3. right half — the full, structured detail for whichever category is selected

   Ingestion is the exception: its right half is the source-document / citation
   viewer, because that is the step where extracted values are still being proved
   against the paperwork. It still uses `StepShell` and `StepSummaryBand` so the
   page furniture matches; it just passes its own panes. */

import { type ReactNode, useRef, useLayoutEffect, useCallback } from "react";
import {
  Building2, ChevronRight, FileText, Sparkles,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { StepFeedback } from "./FeedbackComponents";

export type StepStatus = "good" | "watch" | "alert" | "neutral";

export const STEP_STATUS_STYLE: Record<StepStatus, {
  dot: string; text: string; bg: string; border: string; softBg: string;
}> = {
  good:    { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", softBg: "bg-emerald-50" },
  watch:   { dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   softBg: "bg-amber-50" },
  alert:   { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     softBg: "bg-red-50" },
  neutral: { dot: "bg-[#C4C2BE]",   text: "text-[#4B5563]",   bg: "bg-[#F5F4F1]",  border: "border-[#E8E6E1]",   softBg: "bg-[#FAFAF9]" },
};

export type Trend = "up" | "down" | "flat";

const TREND_STYLE: Record<Trend, { icon: typeof Minus; text: string; bg: string; border: string; label: string }> = {
  down: { icon: TrendingDown, text: "text-[#0076BC]", bg: "bg-[#F0F9FF]", border: "border-[#BAE6FD]", label: "Under book" },
  flat: { icon: Minus,        text: "text-[#6B7280]", bg: "bg-[#F5F4F1]", border: "border-[#E8E6E1]", label: "In line with book" },
  up:   { icon: TrendingUp,   text: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200", label: "Over book" },
};

/** Directional indicator: how a measure sits against the bound book. */
export function TrendIndicator({ trend, title, showLabel = false }: { trend: Trend; title?: string; showLabel?: boolean }) {
  const s = TREND_STYLE[trend];
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[9px] flex-shrink-0 ${s.bg} ${s.border} ${s.text}`}
      style={{ fontWeight: 700 }}
      title={title ?? s.label}>
      <Icon className="w-2.5 h-2.5" />
      {showLabel && <span>{s.label}</span>}
    </span>
  );
}

export function SourceChips({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((s) => (
        <span key={s} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-[#F5F4F1] border border-[#E8E6E1] text-[#6B7280]" style={{ fontWeight: 600 }}>
          <FileText className="w-2.5 h-2.5" /> {s}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────── Region 1 — summary band ───────────────────────── */

export interface SummaryStat { label: string; value: string; status?: StepStatus; flex?: number }

/** Full-width key details + AI agent write-up, pinned above the two panes. */
export interface SummaryAction { label: string; onClick: () => void; icon?: typeof Sparkles }

export function StepSummaryBand({ title, status, statusLabel, body, stats = [], action }: {
  title: string; status: StepStatus; statusLabel: string; body: ReactNode; stats?: SummaryStat[];
  /** Prominent one-click CTA that jumps the user to this step's highest-priority focus area. */
  action?: SummaryAction;
}) {
  const s = STEP_STATUS_STYLE[status];
  const ActionIcon = action?.icon ?? ChevronRight;
  return (
    <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{title}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${s.bg} ${s.border} ${s.text}`} style={{ fontWeight: 700 }}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {statusLabel}
            </span>
            <span className="ml-auto flex-shrink-0">
              <StepFeedback stepLabel={title} />
            </span>
          </div>
          <p className="text-[12px] text-[#4B5563] leading-relaxed">{body}</p>
          {action && (
            <div className="mt-2.5">
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00205B] text-white hover:bg-[#001740] text-[12px] transition-colors"
                style={{ fontWeight: 600 }}>
                <ActionIcon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
      {stats.length > 0 && (
        <div className="flex border-t border-[#E8E6E1]/70">
          {stats.map((st, i) => (
            <div key={st.label} className={`px-3 py-1.5 overflow-hidden min-w-0 ${i < stats.length - 1 ? "border-r border-[#E8E6E1]/70" : ""}`}
              style={{ flex: st.flex ?? 1 }}>
              <div className="text-[8px] uppercase tracking-wide text-[#9B9B98] whitespace-nowrap" style={{ fontWeight: 700 }}>{st.label}</div>
              <div className={`text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis ${st.status ? STEP_STATUS_STYLE[st.status].text : "text-[#2D2D2D]"}`} style={{ fontWeight: 700 }}>{st.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Shell — summary + two panes ───────────────────────── */

/** Step frame: summary band at top, fixed-height two-pane area below.
 *  Lives inside a page-level scroll container so both regions are reachable
 *  via the outer scrollbar — no content is ever clipped. */
export function StepShell({ summary, left, right, leftHeader, rightHeader, leftWidth = "44%", scrollToSourceOn, pageScroll = false }: {
  summary?: ReactNode; left: ReactNode; right?: ReactNode;
  leftHeader: ReactNode; rightHeader?: ReactNode; leftWidth?: string;
  scrollToSourceOn?: unknown;
  /** When true, panes grow to their natural height and defer to the outer
   *  page scroll instead of each pane owning a vertical scrollbar. */
  pageScroll?: boolean;
}) {
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);
  const hideScrollbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const hideLeftScrollbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRightScroll = useCallback(() => {
    savedScrollTop.current = rightScrollRef.current?.scrollTop ?? 0;
    const el = rightScrollRef.current;
    if (!el) return;
    el.classList.add("scrolling");
    if (hideScrollbarTimer.current) clearTimeout(hideScrollbarTimer.current);
    hideScrollbarTimer.current = setTimeout(() => {
      el.classList.remove("scrolling");
    }, 900);
  }, []);

  const onLeftScroll = useCallback(() => {
    const el = leftScrollRef.current;
    if (!el) return;
    el.classList.add("scrolling");
    if (hideLeftScrollbarTimer.current) clearTimeout(hideLeftScrollbarTimer.current);
    hideLeftScrollbarTimer.current = setTimeout(() => {
      el.classList.remove("scrolling");
    }, 900);
  }, []);

  // After the DOM updates (content swap), restore the saved position.
  useLayoutEffect(() => {
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = savedScrollTop.current;
    }
  }, [scrollToSourceOn]);

  return (
    <div className="flex flex-col">
      {summary != null && <div className="px-6 pt-3 pb-2">{summary}</div>}
      <div className="flex mx-6 mb-4 gap-4 items-start">
        <div
          className={`flex flex-col border border-[#E8E6E1] rounded-md bg-white overflow-hidden ${right ? "flex-shrink-0" : "flex-1"}`}
          style={right && !pageScroll ? { width: leftWidth, maxHeight: "calc(100vh - 220px)", position: "sticky", top: "12px" } : right ? { width: leftWidth } : undefined}>
          <div className="px-3 py-2 bg-[#FAFAF9] border-b border-[#E8E6E1] flex items-center gap-2 min-w-0 flex-shrink-0">{leftHeader}</div>
          <div ref={leftScrollRef} onScroll={pageScroll ? undefined : onLeftScroll} className={pageScroll ? "flex-1 min-h-0" : "flex-1 overflow-y-auto min-h-0 step-scroll-pane"}>{left}</div>
        </div>
        {right && (
          <div className="flex-1 flex flex-col border border-[#E8E6E1] rounded-md bg-white min-w-0 overflow-hidden"
            style={pageScroll ? undefined : { maxHeight: "calc(100vh - 220px)", position: "sticky", top: "12px" }}>
            <div className="px-3 py-2 bg-[#FAFAF9] border-b border-[#E8E6E1] flex items-center gap-2 flex-wrap min-w-0 flex-shrink-0">{rightHeader}</div>
            <div ref={rightScrollRef} onScroll={pageScroll ? undefined : onRightScroll} className={pageScroll ? "flex-1 min-h-0 bg-white" : "flex-1 overflow-y-auto min-h-0 step-scroll-pane bg-white"}>
              {right}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PaneTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <>
      <span className="text-[11px] text-[#2D2D2D] flex-shrink-0" style={{ fontWeight: 600 }}>{title}</span>
      {hint && <span className="text-[10px] text-[#9B9B98] truncate min-w-0">· {hint}</span>}
    </>
  );
}

/* ───────────────────────── Category model ───────────────────────── */

/** A single measure inside a category summary — shown on the left pane. */
export interface SummaryRow {
  key: string;
  label: string;
  value: string;
  sub?: string;
  trend?: Trend;
  trendTitle?: string;
  status?: StepStatus;
}

/** A label/value line inside the structured right-hand detail. */
export interface DetailRow {
  label: string;
  value: ReactNode;
  note?: string;
  status?: StepStatus;
}

export interface DetailGroup { title: string; rows: DetailRow[] }

export interface DetailTable {
  columns: string[];
  rows: { key: string; cells: ReactNode[]; dim?: boolean; highlight?: boolean }[];
  caption?: string;
}

/** One category: summarised on the left, fully structured on the right. */
export interface StepCategory {
  key: string;
  icon: typeof Building2;
  title: string;
  /** Short metric shown on the collapsed left row, e.g. "72/100". */
  metric?: string;
  status: StepStatus;
  statusLabel: string;
  /** One-line AI headline for the left pane. */
  headline: string;
  /** Supporting sentence, typically the comparison to bound business. */
  context?: string;
  /** Summarised measures listed beneath the headline when the category is open. */
  summaryRows?: SummaryRow[];
  /** Narrative paragraph opening the right-hand detail. */
  narrative?: ReactNode;
  sources?: string[];
  groups?: DetailGroup[];
  table?: DetailTable;
  /** Escape hatch for interactive controls (inputs, decision buttons, drafts). */
  custom?: ReactNode;
  /** Optional terminology / guidance note shown as an info banner in the detail panel. */
  guidanceNote?: ReactNode;
}

/* ───────────────────────── Region 2 — left pane ───────────────────────── */

export function CategorySummaryList({ categories, activeKey, onSelect, activeRowKey, onRowSelect, allExpanded, globalActiveRow }: {
  categories: StepCategory[];
  activeKey: string;
  onSelect: (key: string) => void;
  activeRowKey?: string | null;
  onRowSelect?: (categoryKey: string, rowKey: string) => void;
  /** When true all categories are always expanded; clicking the header still calls onSelect for visual feedback. */
  allExpanded?: boolean;
  /** Cross-category active row: { category, rowKey }. Used when allExpanded=true. */
  globalActiveRow?: { category: string; rowKey: string } | null;
}) {
  return (
    <div>
      {categories.map((c) => {
        const isOpen = allExpanded ? true : c.key === activeKey;
        const s = STEP_STATUS_STYLE[c.status];
        const Icon = c.icon;
        return (
          <div key={c.key} className="border-b border-[#E8E6E1] last:border-b-0">
            <button
              onClick={() => !allExpanded && onSelect(c.key)}
              className={`relative w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${allExpanded ? "bg-[#FAFAF9] cursor-default" : isOpen ? "bg-[#EBF6FE] border-b border-[#B8DFF7]" : "hover:bg-[#FAFAF9]"}`}>
              {/* Active indicator bar */}
              {isOpen && !allExpanded && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[#0076BC] rounded-r-full" />
              )}
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isOpen && !allExpanded ? "bg-[#0076BC]" : "bg-[#F0EFEC]"}`}>
                <Icon className={`w-3.5 h-3.5 ${isOpen && !allExpanded ? "text-white" : "text-[#6B7280]"}`} />
              </div>
              <span className={`text-[12px] flex-1 min-w-0 truncate ${isOpen && !allExpanded ? "text-[#00205B]" : "text-[#2D2D2D]"}`} style={{ fontWeight: isOpen && !allExpanded ? 700 : 600 }}>{c.title}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} title={c.statusLabel} />
              {c.metric && <span className={`text-[11px] tabular-nums flex-shrink-0 mr-1 ${isOpen && !allExpanded ? "text-[#0076BC]" : "text-[#6B7280]"}`} style={{ fontWeight: isOpen && !allExpanded ? 600 : 400 }}>{c.metric}</span>}
              {!allExpanded && <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpen ? "rotate-90 text-[#0076BC]" : "text-[#9B9B98]"}`} />}
            </button>

            {isOpen && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-[11px] text-[#2D2D2D] leading-snug">
                  <span className="text-[9px] uppercase tracking-wide text-[#0076BC] mr-1" style={{ fontWeight: 700 }}>Focus</span>
                  {c.headline}
                </p>
                {c.context && <p className="text-[10px] text-[#6B7280] leading-snug italic">{c.context}</p>}
                {c.sources && <SourceChips sources={c.sources} />}
                {c.summaryRows && c.summaryRows.length > 0 && (
                  <div className="border-t border-[#F0EFEC] pt-2 space-y-1.5">
                    {c.summaryRows.map((r) => {
                      const isActiveRow = globalActiveRow
                        ? globalActiveRow.category === c.key && globalActiveRow.rowKey === r.key
                        : activeRowKey === r.key;
                      const content = (
                        <>
                          {r.status && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STEP_STATUS_STYLE[r.status].dot}`} />}
                          <span className="text-[11px] text-[#2D2D2D] truncate flex-1 min-w-0" style={{ fontWeight: 500 }}>{r.label}</span>
                          <span className="text-[11px] text-[#2D2D2D] tabular-nums flex-shrink-0" style={{ fontWeight: 600 }}>{r.value}</span>
                          {r.sub && <span className="text-[10px] text-[#9B9B98] tabular-nums whitespace-nowrap text-right flex-shrink-0">{r.sub}</span>}
                        </>
                      );
                      return onRowSelect ? (
                        <button key={r.key} onClick={() => onRowSelect(c.key, r.key)}
                          className={`w-full flex items-center gap-1.5 text-left rounded px-1 py-0.5 transition-colors ${isActiveRow ? "bg-[#C2DFF4]" : "hover:bg-[#EEF6FF]"}`}>
                          {content}
                          <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isActiveRow ? "text-[#0076BC]" : "text-[#C4C2BE]"}`} />
                        </button>
                      ) : (
                        <div key={r.key} className="flex items-center gap-1.5 px-1 py-0.5">{content}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Region 3 — right pane ───────────────────────── */

/** The standardised full-detail view: narrative, sources, label/value groups, table. */
export function CategoryDetailView({ category }: { category: StepCategory }) {
  const s = STEP_STATUS_STYLE[category.status];
  const Icon = category.icon;
  return (
    <div className="p-4 space-y-4">
      {/* Detail header */}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
          <Icon className={`w-4 h-4 ${s.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{category.title}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${s.bg} ${s.border} ${s.text}`} style={{ fontWeight: 700 }}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {category.statusLabel}
            </span>
            {category.metric && <span className="text-[11px] text-[#6B7280] tabular-nums">{category.metric}</span>}
          </div>
          {category.narrative && <p className="text-[11px] text-[#4B5563] leading-relaxed mt-1">{category.narrative}</p>}
        </div>
      </div>

      {category.guidanceNote && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-[#C2DFF4] bg-[#EEF6FF]">
          <svg className="w-3.5 h-3.5 text-[#0076BC] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}><circle cx="8" cy="8" r="7"/><path d="M8 7v5M8 5.5v.5"/></svg>
          <div className="text-[10.5px] text-[#0076BC] leading-relaxed">{category.guidanceNote}</div>
        </div>
      )}

      {category.sources && category.sources.length > 0 && <SourceChips sources={category.sources} />}

      {category.groups?.map((g) => (
        <div key={g.title} className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
          <div className="px-3 py-1.5 bg-[#F5F4F1] border-b border-[#E8E6E1]">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>{g.title}</span>
          </div>
          <div className="divide-y divide-[#F0EFEC]">
            {g.rows.map((r) => (
              <div key={r.label} className="flex items-start gap-3 px-3 py-2">
                {r.status && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${STEP_STATUS_STYLE[r.status].dot}`} />}
                <span className="text-[11px] text-[#6B7280] w-40 flex-shrink-0">{r.label}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-[11px] ${r.status ? STEP_STATUS_STYLE[r.status].text : "text-[#2D2D2D]"}`} style={{ fontWeight: 600 }}>{r.value}</div>
                  {r.note && <div className="text-[10px] text-[#9B9B98] mt-0.5 leading-snug">{r.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {category.table && (
        <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-[#F5F4F1]">
                {category.table.columns.map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] uppercase tracking-wide text-[#4B5563] border-b border-[#E8E6E1] whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {category.table.rows.map((r) => (
                <tr key={r.key} className={`border-b border-[#F0EFEC] last:border-b-0 transition-opacity ${r.dim ? "opacity-30" : r.highlight ? "bg-[#EEF6FF]" : "hover:bg-[#FAFAF9]"}`}>
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-3 py-2 text-[#5D5D5D] align-top">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {category.table.caption && (
            <div className="px-3 py-1.5 border-t border-[#E8E6E1] text-[10px] text-[#9B9B98] italic">{category.table.caption}</div>
          )}
        </div>
      )}

      {category.custom}
    </div>
  );
}

/** Legend for the directional row indicators. */
export function TrendLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap text-[10px] text-[#6B7280]">
      <span style={{ fontWeight: 600 }}>vs bound book:</span>
      {(["down", "flat", "up"] as Trend[]).map((t) => (
        <span key={t} className="inline-flex items-center gap-1">
          <TrendIndicator trend={t} />
          <span>{TREND_STYLE[t].label}</span>
        </span>
      ))}
    </div>
  );
}

