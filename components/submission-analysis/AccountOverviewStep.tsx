"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import {
  Building2, Target, Sparkles, Scale, ClipboardList,
  ChevronRight, Gauge, BarChart2, TrendingUp, FileText,
  CheckCircle2, Circle, AlertTriangle, X,
} from "lucide-react";
import type { SubmissionMeta, SubmissionExtras, KeyScore, Recommendation, AccumState, DocItem, Band } from "../SubmissionTypes";
import { useStepActions, BAND_STYLE, deriveRecommendation, RECOMMENDATION_CONFIG, parseTIV, sovFieldCompleteness } from "../SubmissionHelpers";
import { InsightFeedback } from "../FeedbackComponents";
import type { SubmissionIndexEntry, ProcessingStatus } from "../CustomerTable";
import { EXPECTED_DOCS } from "./mock-data";
import { useIngestionFields } from "./useSubmission";
import {
  PanelHeader, TivMixBar, buildTivMix, MetricTooltip,
  CONSTRUCTION_COLORS, STATE_PALETTE,
} from "./SubmissionShared";
import { INFORCE_BOOK, INFORCE_BY_STATE, INFORCE_TOTAL } from "./mock-data";

/* ── Constants ── */

export const INSIGHT_STEP: Record<string, number> = {
  "Documentation Received": 1,
  "Statement of Values (SOV)": 3,
  "SOV Data Completeness": 1,
  "AI Priority Score": 2,
  "Clearance": 2,
  "Hazard Score": 3,
  "Loss History": 3,
  "Capacity Guidelines": 3,
  "Success Propensity": 4,
  "Broker Bound Rate": 5,
};

export interface InsightGroup {
  stepIndex: number;
  stepLabel: string;
  stepIcon: typeof Building2;
  cards: KeyScore[];
  checks?: { label: string; passed: boolean }[];
}

/* ── Helper functions shared between RecommendationBanner and AccountOverviewStep ── */

function buildUwAlignmentSentence(idx: SubmissionIndexEntry, extras: SubmissionExtras): string {
  const hazardLabel = idx.hazardScore <= 50
    ? "within the preferred band"
    : idx.hazardScore <= 70
      ? "in the elevated band — enhanced scrutiny warranted"
      : "above appetite threshold";
  const lrNum = parseFloat(extras.lossHistory.lossRatio);
  const lrLabel = isNaN(lrNum) ? extras.lossHistory.lossRatio
    : lrNum <= 0.25 ? "favourable"
    : lrNum <= 0.45 ? "moderate"
    : "elevated";
  const classLabel = idx.industryClassification === "in-scope"
    ? "fully within appetite"
    : idx.industryClassification === "limited"
      ? "Limited appetite — senior UW sign-off required"
      : "outside current appetite";
  return `Hazard ${idx.hazardScore}/100 is ${hazardLabel}; top construction class ${idx.topConstructionClass} represents ${idx.constructionClassPct}% of TIV. Five-year loss ratio of ${extras.lossHistory.lossRatio} is ${lrLabel}. Industry ${classLabel} for QBE Commercial Property.`;
}

function buildSimilarAccountsSentence(idx: SubmissionIndexEntry, meta: SubmissionMeta): string {
  const subjectTivM = parseTIV(meta.tiv);
  const peers = INFORCE_BOOK.filter(
    (a) => a.industry === idx.accountIndustry && Math.abs(a.tiv - subjectTivM) / Math.max(subjectTivM, 1) <= 0.6,
  );
  if (peers.length === 0)
    return `No comparable ${idx.accountIndustry} accounts found in the inforce book within a similar TIV range.`;
  const bound   = peers.filter((a) => a.decision === "Bound");
  const quoted  = peers.filter((a) => a.decision === "Quoted");
  const declined = peers.filter((a) => a.decision === "Declined");
  const parts: string[] = [];
  if (bound.length)   parts.push(`${bound.length} bound (${bound.map((a) => `${a.account}: ${a.outcome}`).join("; ")})`);
  if (quoted.length)  parts.push(`${quoted.length} quoted (${quoted.map((a) => a.account).join(", ")})`);
  if (declined.length) parts.push(`${declined.length} declined (${declined.map((a) => `${a.account}: ${a.outcome}`).join("; ")})`);
  const lo = Math.round(subjectTivM * 0.5);
  const hi = Math.round(subjectTivM * 1.5);
  return `${peers.length} comparable ${idx.accountIndustry} account${peers.length !== 1 ? "s" : ""} in the $${lo}M–$${hi}M TIV range: ${parts.join("; ")}.`;
}

/* ── RecommendationBanner ── */

export function RecommendationBanner({ meta, idx, extras, recommendation, status, focusNote, triage }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras;
  recommendation: Recommendation; status?: ProcessingStatus; focusNote: string;
  triage: { clearance: boolean; ofac: boolean; appetite: boolean };
}) {
  const rec = RECOMMENDATION_CONFIG[recommendation];

  const triageChecks = [
    { label: "Clearance",        passed: triage.clearance },
    { label: "OFAC Compliance",  passed: triage.ofac },
    { label: "Appetite",         passed: triage.appetite },
  ];

  const sentences: { label: string; text: string }[] = [
    {
      label: "Triage",
      text: "Clearance, OFAC, and Appetite requirements met for proceeding with UW analysis.",
    },
    {
      label: "UW Guidelines Alignment",
      text: buildUwAlignmentSentence(idx, extras),
    },
    {
      label: "Similar Account Profiles",
      text: buildSimilarAccountsSentence(idx, meta),
    },
  ];

  return (
    <div className={`rounded-xl border ${rec.border} ${rec.bg} p-5`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full ${rec.dot} flex-shrink-0`} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-0.5" style={{ fontWeight: 700 }}>
              Overall Recommendation
            </div>
            <div className={`text-[22px] ${rec.color}`} style={{ fontWeight: 700 }}>{rec.label}</div>
            <div className="text-[12px] text-[#5D5D5D] mt-0.5 truncate">
              {meta.accountName} · {meta.id} · {meta.type} · {meta.coverageType}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {triageChecks.map(({ label, passed }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] ${
                  passed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
                style={{ fontWeight: 600 }}
              >
                {passed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {label}
              </span>
            ))}
            {(() => {
              const pct = idx.brokerBoundRate;
              const style = pct >= 75
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : pct >= 60
                ? "bg-[#EEF6FF] border-[#C2DFF4] text-[#0076BC]"
                : "bg-amber-50 border-amber-200 text-amber-700";
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] ${style}`} style={{ fontWeight: 600 }}>
                  <TrendingUp className="w-3 h-3" />
                  Broker Bind Rate: {pct}%
                </span>
              );
            })()}
          </div>
          <InsightFeedback id="recommendation-banner" compact />
        </div>
      </div>

      {/* Three insight sentences */}
      <div className="mt-2 pt-2 border-t border-current/10 flex flex-col gap-1">
        {sentences.map(({ label, text }, i) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="text-[9px] text-[#9B9B98] tabular-nums flex-shrink-0" style={{ fontWeight: 700 }}>{i + 1}.</span>
            <p className="text-[11px] text-[#4B5563] leading-snug">
              <span className="text-[9px] uppercase tracking-wide text-[#9B9B98] mr-1" style={{ fontWeight: 700 }}>{label} —</span>{text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KeyInsightsPanel ── */

export function KeyInsightsPanel({ groups, onNavigate, onScoreClick, navigableLabels }: {
  groups: InsightGroup[];
  onNavigate: (step: number) => void;
  onScoreClick: (label: string) => void;
  navigableLabels: Set<string>;
}) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={Gauge} title="Key Insights" subtitle="Grouped by workflow step — click any insight to navigate" />
      <div className="divide-y divide-[#F0EFEC] flex-1 overflow-auto">
        {groups.map((g) => {
          const StepIcon = g.stepIcon;
          /* Aggregate band across cards: alert > watch > good */
          const worstBand: Band = g.cards.some((c) => c.band === "alert") ? "alert"
            : g.cards.some((c) => c.band === "watch") ? "watch" : "good";
          const bs = BAND_STYLE[worstBand];
          return (
            <div key={g.stepLabel} className="border-b border-[#F0EFEC] last:border-b-0">
              {g.cards.map((s, cardIdx) => {
                const cardBs = BAND_STYLE[s.band];
                const isFirst = cardIdx === 0;
                return (
                  <div
                    key={s.label}
                    onClick={() => navigableLabels.has(s.label) && onScoreClick(s.label)}
                    className={`flex items-stretch transition-colors border-b border-[#F0EFEC] last:border-b-0${navigableLabels.has(s.label) ? " cursor-pointer hover:bg-[#EEF6FF]" : " cursor-default"}${s.label === "AI Priority Score" ? " hidden" : ""}`}
                    title={`Go to ${g.stepLabel} — ${s.label}`}
                  >
                    {/* Label + note / sub-scores */}
                    <div className="min-w-0 flex-1 py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[11px] text-[#6B7280]" style={{ fontWeight: 600 }}>{s.label}</div>
                        <MetricTooltip />
                      </div>
                      {s.accumStates ? (
                        <p className="text-[10px] leading-snug mt-1" style={{ color: "#4B5563" }}>
                          {s.accumStates.map((st, i) => (
                            <span key={st.state}>
                              {i > 0 && ", "}
                              <span style={{ fontWeight: 600, color: "#1E3A5F" }}>{st.state}</span>
                              {" "}({st.locCount} loc{st.locCount !== 1 ? "s" : ""}, {st.locPct}% of account{st.isCATState ? ", CAT" : ""})
                            </span>
                          ))}
                          {s.accumStates.length > 0 && "."}
                        </p>
                      ) : s.layerPenetration ? (
                        <div className="flex flex-col gap-1 mt-0.5">
                          {s.layerPenetration.claimsPiercingLayer === 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151] self-start" style={{ fontWeight: 600 }}>
                              Clean · no claims pierced {s.layerPenetration.attachmentPoint} attachment
                            </span>
                          ) : (
                            <>
                              {(s.layerPenetration.piercingEvents ?? []).map((ev, ei) => (
                                <div key={ei} className="flex items-center gap-1.5 px-2 py-1 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]" style={{ fontWeight: 600 }}>
                                  <span className="shrink-0 px-1 py-px rounded text-[8px] bg-[#E8E6E1] text-[#374151]" style={{ fontWeight: 700 }}>
                                    {ev.peril}
                                  </span>
                                  <span className="flex-1 text-[#6B7280]">{ev.amount} · {ev.location} · {ev.year}</span>
                                  {ev.breachedAnnualAgg && (
                                    <span className="shrink-0 text-[8px] bg-[#E8E6E1] text-[#374151] px-1 py-px rounded" style={{ fontWeight: 700 }}>Agg breach</span>
                                  )}
                                </div>
                              ))}
                              {s.layerPenetration.yearsBreach > 0 && !(s.layerPenetration.piercingEvents ?? []).some(e => e.breachedAnnualAgg) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151] self-start" style={{ fontWeight: 600 }}>
                                  {s.layerPenetration.yearsBreach} yr{s.layerPenetration.yearsBreach > 1 ? "s" : ""} annual aggregate breached
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : s.yearlyPaid && s.yearlyPaid.length > 0 ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {s.yearlyPaid.map(y => (
                            <span key={y.year} className="inline-flex flex-col items-center px-1.5 py-1 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151]" style={{ fontWeight: 600, minWidth: 38 }}>
                              <span className="text-[8px] text-[#9B9B98] leading-none">{y.year}</span>
                              <span className="text-[9px] tabular-nums leading-tight mt-0.5">{y.paid}</span>
                            </span>
                          ))}
                        </div>
                      ) : s.claimsBreakdown ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {(() => {
                            const { totalLocs, highFreq, highSev, both } = s.claimsBreakdown;
                            const pct = (n: number) => totalLocs ? Math.round((n / totalLocs) * 100) : 0;
                            const pills = [
                              both > 0 && { label: "High Freq + Sev", count: both },
                              highFreq > 0 && { label: "High Frequency", count: highFreq },
                              highSev > 0  && { label: "High Severity",  count: highSev },
                            ].filter(Boolean) as { label: string; count: number }[];
                            if (pills.length === 0) return (
                              <span className="text-[9px] text-[#6B7280]" style={{ fontWeight: 600 }}>No high-frequency or high-severity locations</span>
                            );
                            return pills.map(p => (
                              <span key={p.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]" style={{ fontWeight: 600 }}>
                                {p.count}/{totalLocs} bldgs ({pct(p.count)}%) · {p.label}
                              </span>
                            ));
                          })()}
                        </div>
                      ) : s.similarAccountNames && s.similarAccountNames.length > 0 ? (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {s.similarAccountNames.map((name, i) => (
                            <span key={name} className="text-[10px] leading-snug" style={{ color: "#1E3A5F", fontWeight: 500 }}>
                              {i + 1}. {name}
                            </span>
                          ))}
                        </div>
                      ) : s.docPills ? (
                        (() => {
                          const outstanding = s.docPills.filter((doc) => !doc.received || doc.needsReview);
                          if (outstanding.length === 0) {
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px]" style={{ fontWeight: 600 }}>
                                  <span className="text-[8px] text-emerald-500">✓</span>
                                  All received
                                </span>
                              </div>
                            );
                          }
                          return (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="text-[9px] text-[#9B9B98]" style={{ fontWeight: 600 }}>Missing:</span>
                          {outstanding.map((doc) => {
                            const short = doc.name
                              .replace("Risk Engineering Report", "Risk Eng.")
                              .replace("Primary Policy", "Policy")
                              .replace("Loss History", "Loss Runs");
                            const received = doc.received;
                            const symbol = received ? (doc.needsReview ? "⚠" : "✓") : null;
                            return (
                              <span key={doc.name}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] ${
                                  received
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-[#E8E6E1] bg-[#FAFAF9] text-[#9B9B98]"
                                }`}
                                style={{ fontWeight: 600 }}>
                                {symbol && <span className="text-[8px] text-emerald-500">{symbol}</span>}
                                {short}
                              </span>
                            );
                          })}
                        </div>
                          );
                        })()
                      ) : s.subScores ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {s.subScores.map((ss) => (
                            <span key={ss.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]">
                              <span className="text-[#9B9B98]">{ss.label}</span>
                              <span style={{ fontWeight: 700 }}>{ss.grade}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#9B9B98] truncate">{s.note}</div>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0 px-4 py-2 flex flex-col items-end gap-1">
                      <div className="text-[14px] text-[#0076BC] tabular-nums" style={{ fontWeight: 700 }}>{s.value}</div>
                    </div>
                  </div>
                );
              })}

            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── AccountDetailsPanel ── */

export function AccountDetailsPanel({ meta, idx, extras }: { meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras }) {
  const pd = extras.policyDetails;
  const FlatField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{label}</div>
      <div className="text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{value}</div>
    </div>
  );
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0076BC" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Account Details</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <FlatField label="Insured Name"           value={meta.namedInsured} />
        {meta.type === "Renewal" && <FlatField label="Policy Number" value={pd.policyNumber} />}
        <FlatField label="Effective Date"         value={meta.inceptionDate} />
        <FlatField label="Expiration Date"        value={pd.expirationDate} />
        <FlatField label="Underwriter"            value={idx.assignedUW} />
        <FlatField label="New / Renewal"          value={meta.type} />
        <FlatField label="Proposed Commission"     value={pd.commission} />
        <FlatField label="AOP Deductible"         value={pd.aopDeductible} />
        <FlatField label="TIV"                    value={meta.tivFull} />
        <FlatField label="Contents Limit"         value={pd.contentsLimit} />
        <FlatField label="Business Limit"         value={pd.businessLimit} />
        <FlatField label="Equipment Breakdown"    value={pd.equipmentBreakdown ? "Yes" : "No"} />
        <FlatField label="Certified Terrorism"    value={pd.certifiedTerrorism ? "Purchased" : "Declined"} />
      </div>
    </div>
  );
}

/* ── CoverageRequestPanel ── */

function RequestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-[#6B7280] w-28 flex-shrink-0" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function CoverageRequestPanel({ extras }: { extras: SubmissionExtras }) {
  const qbeLayerNum = parseInt(extras.request.towerPosition.match(/Layer (\d+)/)?.[1] ?? "1", 10);
  const others = extras.request.leadCarriers;
  const tower: Array<{ type: "carrier" | "qbe"; label: string; layerNum: number }> = [];
  let otherIdx = 0;
  for (let l = 1; l <= others.length + 1; l++) {
    if (l === qbeLayerNum) {
      tower.push({ type: "qbe", label: extras.request.qbeLayer, layerNum: l });
    } else {
      tower.push({ type: "carrier", label: others[otherIdx] ?? "", layerNum: l });
      otherIdx++;
    }
  }
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={Target} title="Coverage Request" subtitle="Perils, limits, and program tower" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="rounded-md border border-[#C2DFF4] bg-[#EEF6FF] p-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {extras.request.perils.map((p) => (
              <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white border border-[#C2DFF4] text-[#00205B]" style={{ fontWeight: 600 }}>{p}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-1">
            <RequestRow label="Requested Layer Limit" value={extras.request.limitsSought} />
            <RequestRow label="Valuation Method" value={extras.request.valuationMethod} />
          </div>
        </div>
        <div className="flex-1 rounded-md border border-[#E8E6E1] p-3 flex flex-col">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#0076BC] mb-2">Program Tower</p>
          <div className="flex flex-col gap-1">
            {tower.map((row, i) =>
              row.type === "qbe" ? (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] bg-[#00205B] border border-[#00205B] text-white" style={{ fontWeight: 600 }}>
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold bg-[#0076BC] text-white shrink-0">Q</span>
                  <span className="flex-1 truncate">QBE — {row.label}</span>
                  <span className="text-[8px] opacity-60 shrink-0 ml-1">L{row.layerNum}</span>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] bg-white border border-[#E2EDF7] text-[#374151]" style={{ fontWeight: 500 }}>
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold bg-[#E8EFF7] text-[#5B7FA6] shrink-0">{row.layerNum}</span>
                  <span className="flex-1 truncate">{row.label}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TivDistributionPanel ── */

export function TivDistributionPanel({ idx, extras }: { idx: SubmissionIndexEntry; extras: SubmissionExtras }) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={BarChart2} title="TIV Distribution" subtitle="Occupancy · Construction · State exposure" />
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <TivMixBar
          label="Occupancy"
          slices={idx.occupancyByTIV.map((s) => ({ name: s.name, pct: s.pct, color: s.color }))}
        />
        <div className="h-px bg-[#F0EFEC]" />
        <TivMixBar
          label="Construction Class"
          slices={buildTivMix(extras.sov.locations ?? [], "construction", CONSTRUCTION_COLORS)}
        />
        <div className="h-px bg-[#F0EFEC]" />
        <TivMixBar
          label="Exposure by State"
          slices={buildTivMix(extras.sov.locations ?? [], "state", undefined, STATE_PALETTE)}
        />
      </div>
    </div>
  );
}

/* ── DocumentChecklist ── */

export function DocumentChecklist({ documents }: { documents: DocItem[] }) {
  const received = documents.filter((d) => d.received).length;
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md">
      <div className="px-4 py-2.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
          <FileText className="w-4 h-4 text-[#0076BC]" /> Documentation Received
        </span>
        <span className="text-[11px] text-[#6B7280]" style={{ fontWeight: 600 }}>{received} of {documents.length} received</span>
      </div>
      <div className="p-3 space-y-1.5">
        {documents.map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-md border border-[#E8E6E1] px-3 py-2">
            {d.received
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              : <Circle className="w-4 h-4 text-[#C9C7C1] flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <span className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{d.name}</span>
              {d.needsReview && d.reviewReason && (
                <div className={`text-[10px] italic mt-0.5 ${d.received ? "text-amber-700" : "text-red-600"}`}>{d.reviewReason}</div>
              )}
            </div>
            <span className="text-[10px] text-[#9B9B98] flex-shrink-0">{d.received ? d.date : "Not received"}</span>
            {d.needsReview && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0" style={{ fontWeight: 700 }}>
                <AlertTriangle className="w-2.5 h-2.5" /> REVIEW
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AccountOverviewStep ── */

export function AccountOverviewStep({ recommendation, keyScores, triage, onProceed, onNavigate }: {
  recommendation: Recommendation; keyScores: KeyScore[];
  triage: { clearance: boolean; ofac: boolean; appetite: boolean };
  onProceed: () => void;
  onNavigate: (step: number) => void;
}) {
  const { meta, idx, extras } = useSubmissionCtx();
  /* Documentation Received insight — keyed off EXPECTED_DOCS so counts match Step 1 */
  const docLookup = (name: string) => extras.documents.find(d => d.name === name);
  const expectedDocItems = EXPECTED_DOCS.map(name => ({
    name,
    received:     docLookup(name)?.received     ?? false,
    needsReview:  docLookup(name)?.needsReview  ?? false,
    reviewReason: docLookup(name)?.reviewReason,
    date:         docLookup(name)?.date,
  }));
  const docsReceived = expectedDocItems.filter(d => d.received).length;
  const docsTotal    = expectedDocItems.length;
  const docsPct      = Math.round((docsReceived / docsTotal) * 100);
  const docsBand: Band = docsPct === 100 ? "good" : docsPct >= 75 ? "watch" : "alert";

  /* Data Completeness insight — critical fields with an extracted value */
  const { fields: catalogFields } = useIngestionFields(meta.id);
  const criticalFields = (catalogFields ?? []).filter(f => f.critical === "Yes");
  const criticalWithValue = criticalFields.filter(f => f.value.trim() !== "");
  const dataPct = criticalFields.length ? Math.round((criticalWithValue.length / criticalFields.length) * 100) : 0;
  const dataBand: Band = dataPct === 100 ? "good" : dataPct >= 75 ? "watch" : "alert";

  /* Broker Bound Rate insight — brokerBoundRate is stored as a whole-number percentage (e.g. 68) */
  const bbrPct  = idx.brokerBoundRate;
  const bbrBand: Band = idx.brokerBoundRate >= 60 ? "good" : idx.brokerBoundRate >= 40 ? "watch" : "alert";
  const bbrTrendLabel = idx.brokerTrend === "up" ? "↑ trending up" : idx.brokerTrend === "down" ? "↓ trending down" : "→ stable";

  const handleScoreClick = (label: string) => {
    const step = INSIGHT_STEP[label];
    if (step !== undefined) onNavigate(step);
  };

  /* Statement of Values completeness insight */
  const sovComp = sovFieldCompleteness(extras.sov.locations ?? []);
  const sovBand: Band = sovComp.pct >= 90 ? "good" : sovComp.pct >= 70 ? "watch" : "alert";

  const groups: InsightGroup[] = [
    {
      stepIndex: 1, stepLabel: "Ingestion", stepIcon: ClipboardList,
      cards: [
        { label: "Documentation Received", value: `${docsReceived}/${docsTotal} docs`, band: docsBand, note: `${dataPct}% of critical fields extracted`, docPills: expectedDocItems },
        { label: "Statement of Values (SOV)", value: `${sovComp.encoded}/${sovComp.total} fields`, band: sovBand, note: `${sovComp.pct}% of required CP SOV fields encoded`, docPills: sovComp.fieldItems },
      ],
    },
    {
      stepIndex: 2, stepLabel: "Triage", stepIcon: Target,
      cards: [keyScores.find((s) => s.label === "AI Priority Score")!],
      checks: [
        { label: "Clearance", passed: triage.clearance },
        { label: "OFAC Compliance", passed: triage.ofac },
        { label: "Appetite", passed: triage.appetite },
      ],
    },
    {
      stepIndex: 3, stepLabel: "UW Analysis", stepIcon: Sparkles,
      cards: [
        { ...keyScores.find((s) => s.label === "Loss History")!, tier: "L1" as const },
        (() => {
          const peers = INFORCE_BOOK.filter(
            (a) => a.industry === idx.accountIndustry &&
              Math.abs(a.tiv - parseTIV(meta.tiv)) / Math.max(parseTIV(meta.tiv), 1) <= 0.6,
          );
          const total = peers.length;
          const bound = peers.filter((a) => a.decision === "Bound").length;
          const bandVal: Band = total === 0 ? "watch" : bound / total >= 0.6 ? "good" : bound / total >= 0.3 ? "watch" : "alert";
          const submOccupancy = (extras.sov.locations ?? [])[0]?.occupancy ?? "";
          const occupancyMatch = peers.length > 0
            ? peers.filter(p => p.occupancy.toLowerCase().includes(submOccupancy.split(" ")[0].toLowerCase())).length / peers.length >= 0.5
            : true;
          const bands = [
            { label: "$0–150M",   count: peers.filter(p => p.tiv < 150).length },
            { label: "$150–250M", count: peers.filter(p => p.tiv >= 150 && p.tiv < 250).length },
            { label: "$250M+",    count: peers.filter(p => p.tiv >= 250).length },
          ].filter(b => b.count > 0);
          const topState = meta.territory.split(",")[0].trim();
          const topPeril = (extras.request.perils[0] ?? "All Risk").replace("All Risk (AOP)", "AOP");
          const boundPeers = peers.filter(a => a.decision === "Bound");
          const similarAccountNames = boundPeers.length > 0
            ? boundPeers.map(a => a.account)
            : peers.slice(0, 3).map(a => a.account);
          return {
            label: "Comparable Accounts",
            value: String(total),
            band: bandVal,
            note: `Based on occupancy, construction mix, TIV, CAT exposure, loss history, and participation structure — ${total} comparable ${idx.accountIndustry} account${total !== 1 ? "s" : ""} identified`,
            similarAccountNames,
            tier: "L2" as const,
          };
        })(),
      ],
    },
    {
      stepIndex: 4, stepLabel: "UW Review", stepIcon: Scale,
      cards: [
        (() => {
          const CAT_STATES = new Set(["FL","CA","TX","OK","LA","SC","GA","NC"]);
          const locsByState: Record<string, number> = {};
          (extras.sov.locations ?? []).forEach(l => {
            locsByState[l.state] = (locsByState[l.state] ?? 0) + 1;
          });
          const totalLocs = (extras.sov.locations ?? []).length || extras.sov.stats.locationCount || 1;
          const top3: AccumState[] = Object.entries(locsByState)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([state, locCount]) => ({
              state,
              locCount,
              locPct: Math.round((locCount / totalLocs) * 100),
              bookTIVM: INFORCE_BY_STATE[state] ?? 0,
              bookShare: INFORCE_BY_STATE[state] ? Math.round((INFORCE_BY_STATE[state] / INFORCE_TOTAL) * 100) : 0,
              isCATState: CAT_STATES.has(state),
            }));
          const hasCATOverlap = top3.some(s => s.isCATState);
          const hasHighBookOverlap = top3.some(s => s.bookShare >= 10);
          const bandVal: Band = (hasCATOverlap && hasHighBookOverlap) ? "alert" : (hasCATOverlap || hasHighBookOverlap) ? "watch" : "good";
          const topState = top3[0]?.state ?? extras.sov.stats.topState;
          return {
            label: "Accumulation Risk",
            value: topState,
            band: bandVal,
            note: `Top 3 states by locations · book overlap shown`,
            accumStates: top3,
            tier: "L2" as const,
          };
        })(),
      ],
    },
  ];

  useStepActions([
    { icon: ChevronRight, label: "Proceed to Ingestion", onClick: onProceed },
  ], [onProceed]);
  return (
    <>
      <RecommendationBanner meta={meta} idx={idx} extras={extras} recommendation={recommendation} status={idx.processingStatus} focusNote={extras.focusNote} triage={triage} />
      <div className="grid grid-cols-2 gap-4 mt-4" style={{ gridTemplateRows: "auto auto" }}>
        {/* Left column — stacked */}
        <div className="flex flex-col gap-4">
          <KeyInsightsPanel groups={groups} onNavigate={onNavigate} onScoreClick={handleScoreClick} navigableLabels={new Set(Object.keys(INSIGHT_STEP))} />
          <TivDistributionPanel idx={idx} extras={extras} />
        </div>
        {/* Right column — Account Details + Coverage Request stacked */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E8E6E1] rounded-md p-4">
            <AccountDetailsPanel meta={meta} idx={idx} extras={extras} />
          </div>
          <CoverageRequestPanel extras={extras} />
        </div>
      </div>
    </>
  );
}
