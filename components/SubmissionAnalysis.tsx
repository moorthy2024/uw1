"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { DocumentCreationModal } from "./DocumentCreationModal";
import { useParams } from "next/navigation";
import {
  StepActionsCtx,
  type ActionItem,
  type Band,
  type KeyScore,
  type StepInsight,
  type LossLocation,
  type SubmissionExtras,
  CLAIMS_HIGH_FREQ_THRESHOLD,
  CLAIMS_HIGH_SEV_THRESHOLD,
} from "./SubmissionTypes";
export type { StepInsight } from "./SubmissionTypes";
export type { ActionItem } from "./SubmissionTypes";
import {
  WORKFLOW_STEPS,
  RECOMMENDATION_CONFIG,
  deriveRecommendation,
  hazardBand,
  winBand,
  parsePaidK,
  fmtPaid,
  buildStepInsight,
} from "./SubmissionHelpers";
import { IngestionStep } from "./submission-analysis/IngestionStep";
import { DecisionStep } from "./submission-analysis/DecisionStep";
import { Sparkles, ChevronRight, ShieldCheck } from "lucide-react";
import {
  SUBMISSION_INDEX,
  type SubmissionIndexEntry,
} from "./CustomerTable";

/* ── Extracted modules ── */
import { useSubmission } from "./submission-analysis/useSubmission";
import { SubmissionProvider } from "./submission-analysis/SubmissionContext";
import { statusStepIndex, locHazardGrade } from "./submission-analysis/SubmissionShared";
import { AccountSummaryBar, StepperNav } from "./submission-analysis/AccountSummaryBar";
import { LinkEmailModal } from "./submission-analysis/LinkEmailModal";
import { AccountOverviewStep } from "./submission-analysis/AccountOverviewStep";
import { TriageStep } from "./submission-analysis/TriageStep";
import { UWAnalysisStep } from "./submission-analysis/UWAnalysisStep";
import { UWReviewStep } from "./submission-analysis/UWReviewStep";

interface SubmissionAnalysisProps {
  submissionId?: string;
  onInsightChange?: (insight: StepInsight) => void;
  onActionsChange?: (actions: ActionItem[]) => void;
  onClose?: () => void;
}

export function SubmissionAnalysis({ submissionId, onInsightChange, onActionsChange, onClose }: SubmissionAnalysisProps = {}) {
  const params = useParams();
  const rawId = submissionId || params.id;
  const id: string | undefined = Array.isArray(rawId) ? rawId[0] : (rawId || undefined);
  const { data: submissionRecord, isLoading: submissionLoading } = useSubmission(id);
  const meta = submissionRecord?.meta ?? null;
  // Real API submissions carry their own indexEntry from the transformer.
  // Mock submissions fall back to the static SUBMISSION_INDEX lookup.
  const idx: SubmissionIndexEntry | undefined =
    submissionRecord?.indexEntry ?? (id ? SUBMISSION_INDEX[id] : undefined);

  const defaultStep = idx ? statusStepIndex(idx.processingStatus) : 0;
  const [activeStep, setActiveStep] = useState(defaultStep);
  const [reachedStep, setReachedStep] = useState(defaultStep);

  useEffect(() => {
    const s = idx ? statusStepIndex(idx.processingStatus) : 0;
    setActiveStep(s);
    setReachedStep(s);
  }, [id, idx]);
  const [stepActions, setStepActions] = useState<ActionItem[]>([]);
  useEffect(() => { onActionsChange?.(stepActions); }, [stepActions, onActionsChange]);
  const [takeActionOpen, setTakeActionOpen] = useState(false);
  const takeActionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!takeActionOpen) return;
    const close = (e: MouseEvent) => { if (takeActionRef.current && !takeActionRef.current.contains(e.target as Node)) setTakeActionOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [takeActionOpen]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const navigateToStep = useCallback((step: number) => {
    setActiveStep(step);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* Insight is computed in the render body (after meta/idx guard) and stashed
     here; this effect flushes it to the docked AI pane on step / submission change. */
  const insightRef = useRef<StepInsight | null>(null);
  useEffect(() => {
    if (onInsightChange && insightRef.current) onInsightChange(insightRef.current);
  }, [activeStep, id, onInsightChange]);

  /* Stable per-step callbacks — steps register their action buttons in an effect
     keyed on these, so recreating them each render would loop the registration. */
  const goToStep = useCallback((step: number) => () => navigateToStep(step), [navigateToStep]);
  const proceedTo = useMemo(
    () => WORKFLOW_STEPS.map((_, i) => () => {
      setReachedStep(prev => Math.max(prev, i));
      navigateToStep(i);
    }),
    [navigateToStep]
  );
  const stepActionsValue = useCallback((items: ActionItem[]) => setStepActions(items), []);

  if (submissionLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-[#F9F9F8]">
        <div className="w-6 h-6 rounded-full border-2 border-[#0076BC] border-t-transparent animate-spin" />
        <p className="text-sm text-[#9B9B98]">Loading submission…</p>
      </div>
    );
  }

  if (!meta || !idx) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-[#F9F9F8]">
        <p className="text-sm text-[#9B9B98]">Select a submission to view insights.</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E8E6E1] text-[#6B7280] hover:bg-[#F5F4F1] transition-colors"
          >
            ← Go back
          </button>
        )}
      </div>
    );
  }

  const extras: SubmissionExtras = submissionRecord!.extras;
  const recommendation = deriveRecommendation(idx.industryClassification, idx.processingStatus);

  const triageChecks = {
    clearance: idx.clearance === "complete",
    ofac: true,
    appetite: idx.industryClassification !== "out-of-scope",
  };

  const keyScores: KeyScore[] = ([
    (() => {
      const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
      (extras.sov.locations ?? []).forEach(l => { gradeCounts[locHazardGrade(l.hazard)]++; });
      const subScores = (["A","B","C","D"] as const)
        .filter(g => gradeCounts[g] > 0)
        .map(g => ({ label: g, grade: `${gradeCounts[g]}` }));
      return { label: "Hazard Score", value: `${idx.hazardScore}/100`, band: hazardBand(idx.hazardScore), note: "Locations by hazard grade", subScores };
    })(),
    { label: "Success Propensity", value: `${idx.successPropensity}%`, band: winBand(idx.successPropensity), note: idx.successPropensityDrivers },
    (() => {
      const lh = extras.lossHistory;
      const isFreq = (l: LossLocation) => l.count >= CLAIMS_HIGH_FREQ_THRESHOLD;
      const isSev  = (l: LossLocation) => parsePaidK(l.paid) >= CLAIMS_HIGH_SEV_THRESHOLD;
      const highFreq = lh.topLocations.filter(l => isFreq(l) && !isSev(l)).length;
      const highSev  = lh.topLocations.filter(l => isSev(l) && !isFreq(l)).length;
      const both     = lh.topLocations.filter(l => isFreq(l) && isSev(l)).length;
      const anyFlagged = highFreq + highSev + both;
      const claimsBand: Band = both > 0 ? "alert" : anyFlagged > 0 ? "watch" : "good";
      const totalK = (lh.yearlyBreakdown ?? []).reduce((s, y) => s + parsePaidK(y.paid), 0);
      return {
        label: "Loss History",
        value: fmtPaid(totalK),
        band: claimsBand,
        note: `5-yr total paid · ${lh.claimsYears} yrs of loss history`,
        yearlyPaid: lh.yearlyBreakdown ?? [],
      };
    })(),
    (() => {
      const lp = extras.lossHistory.layerPenetration;
      if (!lp) return null;
      const lpBand: Band = lp.yearsBreach > 0 ? "alert" : lp.claimsPiercingLayer > 0 ? "watch" : "good";
      const valueStr = lp.claimsPiercingLayer === 0 ? "Clean" : `${lp.claimsPiercingLayer} event${lp.claimsPiercingLayer > 1 ? "s" : ""}`;
      return {
        label: "Capacity Guidelines",
        value: valueStr,
        band: lpBand,
        note: `Claims vs ${lp.attachmentPoint} attachment · ${lp.annualAggregateLimit} annual aggregate`,
        layerPenetration: { ...lp, requestedPerils: extras.request.perils },
      };
    })(),
    { label: "SOV Data Completeness", value: `${extras.sov.completenessPct}%`, band: extras.sov.completenessPct >= 90 ? "good" : extras.sov.completenessPct >= 70 ? "watch" : "alert", note: extras.sov.modellingReady ? "Ready for CAT modelling" : "Cleanse before CAT modelling" },
    { label: "AI Priority Score", value: `${idx.aiPriorityScore}/100`, band: idx.aiPriorityScore >= 85 ? "good" : idx.aiPriorityScore >= 70 ? "watch" : "alert", note: "Composite triage priority" },
  ] as (KeyScore | null)[]).filter((s): s is KeyScore => s !== null);

  // Stash the current step's insight for the docked AI pane (flushed via effect)
  insightRef.current = buildStepInsight(
    id!, activeStep, meta, extras.focusNote,
    RECOMMENDATION_CONFIG[recommendation].label, keyScores,
  );

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
    <StepActionsCtx.Provider value={stepActionsValue}>
    <SubmissionProvider meta={meta} idx={idx} extras={extras}>
      <div className="h-full flex flex-col bg-[#F9FAFB] overflow-hidden">
        {/* Account details — frozen above the stepper, constant across every step */}
        <AccountSummaryBar onClose={onClose} />

        {/* Stepper nav */}
        <StepperNav active={activeStep} onChange={navigateToStep} reachedStep={reachedStep} />

        {/* UW Accountability strip + Take Action dropdown */}
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-1.5 border-b" style={{ backgroundColor: "#FAFBFF", borderColor: "#E8EFFF" }}>
          <ShieldCheck className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
          <p className="text-[10px] text-[#9B9B98] leading-none flex-1">
            <span style={{ fontWeight: 600 }}>UW Accountability —</span>{" "}
            AI provides processing support and recommendations only. You remain accountable and responsible for all outputs and final underwriting decisions.
          </p>
          {/* Take Action dropdown */}
          <div ref={takeActionRef} className="relative flex-shrink-0">
            <button
              onClick={() => setTakeActionOpen(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] transition-colors"
              style={{ fontWeight: 600, color: "white", borderColor: "#001740", backgroundColor: "#00205B" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#001740")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#00205B")}
            >
              <Sparkles className="w-3 h-3" />
              Take Action
              <ChevronRight className={`w-3 h-3 transition-transform ${takeActionOpen ? "rotate-90" : ""}`} />
            </button>
            {takeActionOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-[#E0E8FF] py-1 min-w-[220px]"
                style={{ boxShadow: "0 8px 24px rgba(0,32,91,0.12)" }}>
                {stepActions.map((item, i) => {
                  const Icon = item.icon;
                  const color = item.variant === "danger" ? "#DC2626" : item.variant === "primary" ? "#00205B" : "#0076BC";
                  return (
                    <button key={i}
                      onClick={() => { item.onClick?.(); setTakeActionOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F0F6FF] transition-colors text-left"
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Content area — scrolls while header + stepper stay frozen */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {activeStep === 0 ? (
            <div className="px-6 py-4">
              <AccountOverviewStep
                recommendation={recommendation} keyScores={keyScores} triage={triageChecks}
                onProceed={proceedTo[1]}
                onNavigate={navigateToStep}
              />
            </div>
          ) : (
            <>
              {activeStep === 1 && <IngestionStep onProceed={proceedTo[2]} />}
              {activeStep === 2 && <TriageStep onProceed={proceedTo[3]} />}
              {activeStep === 3 && <UWAnalysisStep onProceed={proceedTo[4]} />}
              {activeStep === 4 && <UWReviewStep onProceed={proceedTo[5]} />}
              {activeStep === 5 && <DecisionStep />}
            </>
          )}
        </div>
      </div>
      {showDocModal && (
        <DocumentCreationModal
          meta={meta} idx={idx} extras={extras}
          activeStepIndex={activeStep}
          onClose={() => setShowDocModal(false)}
        />
      )}
      {showLinkEmailModal && meta && (
        <LinkEmailModal submissionId={id ?? ""} onClose={() => setShowLinkEmailModal(false)} />
      )}
    </SubmissionProvider>
    </StepActionsCtx.Provider>
    </TooltipPrimitive.Provider>
  );
}
