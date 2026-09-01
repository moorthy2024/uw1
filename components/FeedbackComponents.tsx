"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, X, Star, CheckCircle2, ChevronDown, MessageSquare, BarChart3, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   INLINE INSIGHT FEEDBACK
   Small thumbs-up / thumbs-down widget to attach to any AI card.
   On thumbs-down a brief "why" picker slides in.
   ───────────────────────────────────────────────────────────────── */

const THUMBS_DOWN_REASONS = [
  "Inaccurate data",
  "Poor recommendation",
  "Missing context",
  "Overcautious",
  "Other",
];

export function InsightFeedback({ id, compact = false }: { id: string; compact?: boolean }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleUp() {
    setVote("up");
    setShowWhy(false);
    setSubmitted(true);
  }

  function handleDown() {
    setVote("down");
    setShowWhy(true);
    setSubmitted(false);
  }

  function handleReason(r: string) {
    setReason(r);
    setShowWhy(false);
    setSubmitted(true);
  }

  function reset() {
    setVote(null);
    setReason(null);
    setShowWhy(false);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span>Thanks for the feedback</span>
        <button onClick={reset} className="ml-1 text-[#C9C7C1] hover:text-[#9B9B98]" title="Change feedback">
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5">
        {!compact && <span className="text-[9px] text-[#C9C7C1] mr-1 uppercase tracking-wide" style={{ fontWeight: 600 }}>AI</span>}
        <button
          onClick={handleUp}
          title="Helpful"
          className={`p-1 rounded transition-colors ${vote === "up" ? "text-emerald-600 bg-emerald-50" : "text-[#C9C7C1] hover:text-emerald-600 hover:bg-emerald-50"}`}
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={handleDown}
          title="Not helpful"
          className={`p-1 rounded transition-colors ${vote === "down" ? "text-red-500 bg-red-50" : "text-[#C9C7C1] hover:text-red-500 hover:bg-red-50"}`}
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>

      {showWhy && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#E8E6E1] rounded-lg shadow-lg p-2 min-w-[160px]">
          <p className="text-[9px] uppercase tracking-wide text-[#9B9B98] mb-1.5 px-1" style={{ fontWeight: 700 }}>
            What was the issue?
          </p>
          <div className="flex flex-col gap-0.5">
            {THUMBS_DOWN_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => handleReason(r)}
                className="text-left text-[11px] text-[#4B5563] px-2 py-1 rounded hover:bg-[#F5F4F1] transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => setShowWhy(false)} className="absolute top-1.5 right-1.5 text-[#C9C7C1] hover:text-[#9B9B98]">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STEP SUMMARY FEEDBACK
   Compact feedback row for a workflow step's AI summary band.
   ───────────────────────────────────────────────────────────────── */

export function StepFeedback({ stepLabel }: { stepLabel: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [done, setDone] = useState(false);

  function handle(v: "up" | "down") {
    setVote(v);
    setDone(true);
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className="text-[9px] text-[#C9C7C1] uppercase tracking-wide hidden sm:block" style={{ fontWeight: 600 }}>
        AI summary
      </span>
      {done ? (
        <span className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Noted
        </span>
      ) : (
        <>
          <button
            onClick={() => handle("up")}
            title={`${stepLabel} summary was helpful`}
            className="p-1 rounded text-[#C9C7C1] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => handle("down")}
            title={`${stepLabel} summary was not helpful`}
            className="p-1 rounded text-[#C9C7C1] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   POST-DECISION SURVEY MODAL
   Triggered when an account is closed (bind / decline / refer).
   ───────────────────────────────────────────────────────────────── */

interface SurveyState {
  aiAccuracy: number;       // 1–5 stars
  recommendationMatch: "yes" | "partial" | "no" | null;
  mostValuable: string[];   // multi-select insight labels
  workflowRating: number;   // 1–5 stars
  comments: string;
}

const INSIGHTS = [
  "AI Priority Score",
  "Hazard Score",
  "5-Yr Loss Ratio",
  "Similar Accounts",
  "Accumulation Risk",
  "Success Propensity",
  "Data Completeness",
];

const MATCH_OPTIONS: { value: "yes" | "partial" | "no"; label: string; color: string }[] = [
  { value: "yes",     label: "Yes — aligned",        color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "partial", label: "Partially",             color: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "no",      label: "No — I overrode it",   color: "border-red-400 bg-red-50 text-red-700" },
];

function StarRating({ value, onChange, size = 18 }: { value: number; onChange: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-colors"
        >
          <Star
            style={{ width: size, height: size }}
            className={`${(hover || value) >= n ? "text-amber-400 fill-amber-400" : "text-[#D1D0CB]"} transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export function PostDecisionSurvey({
  accountName,
  decision,
  onClose,
  onSubmit,
}: {
  accountName: string;
  decision: "bind" | "decline" | "refer" | "quoted-won" | "quoted-lost" | "no-response";
  onClose: () => void;
  onSubmit?: () => void;
}) {
  const [step, setStep] = useState<"survey" | "done">("survey");
  const [form, setForm] = useState<SurveyState>({
    aiAccuracy: 0,
    recommendationMatch: null,
    mostValuable: [],
    workflowRating: 0,
    comments: "",
  });

  const decisionLabel =
    decision === "bind" ? "Bound" :
    decision === "decline" ? "Declined" :
    decision === "refer" ? "Referred" :
    decision === "quoted-won" ? "Quoted Won" :
    decision === "quoted-lost" ? "Quoted Lost" :
    "No Response";
  const decisionColor =
    decision === "bind" || decision === "quoted-won"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : decision === "decline" || decision === "quoted-lost"
      ? "text-red-700 bg-red-50 border-red-200"
    : "text-amber-700 bg-amber-50 border-amber-200";

  function toggleInsight(label: string) {
    setForm((f) => ({
      ...f,
      mostValuable: f.mostValuable.includes(label)
        ? f.mostValuable.filter((x) => x !== label)
        : [...f.mostValuable, label],
    }));
  }

  const canSubmit = form.aiAccuracy > 0 && form.recommendationMatch !== null && form.workflowRating > 0;

  function handleSubmit() {
    setStep("done");
    onSubmit?.();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>Quick Feedback</div>
              <div className="text-[10px] text-[#9B9B98]">{accountName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${decisionColor}`} style={{ fontWeight: 600 }}>
              {decisionLabel}
            </span>
            <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-[14px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>Thanks for the feedback!</div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Helps QBE&apos;s AI team improve accuracy and workflow design.</p>
            </div>
            <button onClick={onClose} className="mt-1 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[12px] hover:bg-[#007EC2] transition-colors" style={{ fontWeight: 600 }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

              {/* Q1 + Q4 — side by side star ratings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SurveyLabel index={1} text="AI insight accuracy" required />
                  <div className="mt-1.5">
                    <StarRating value={form.aiAccuracy} onChange={(n) => setForm((f) => ({ ...f, aiAccuracy: n }))} size={15} />
                  </div>
                </div>
                <div>
                  <SurveyLabel index={4} text="Overall workflow rating" required />
                  <div className="mt-1.5">
                    <StarRating value={form.workflowRating} onChange={(n) => setForm((f) => ({ ...f, workflowRating: n }))} size={15} />
                  </div>
                </div>
              </div>

              {/* Q2 — horizontal chips instead of stacked buttons */}
              <div>
                <SurveyLabel index={2} text="Did AI recommendation align with your decision?" required />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {MATCH_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setForm((f) => ({ ...f, recommendationMatch: o.value }))}
                      className={`px-2.5 py-1 rounded-full border text-[10px] transition-colors ${form.recommendationMatch === o.value ? o.color : "border-[#E8E6E1] text-[#4B5563] hover:bg-[#F5F4F1]"}`}
                      style={{ fontWeight: form.recommendationMatch === o.value ? 600 : 400 }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 — insight chips */}
              <div>
                <SurveyLabel index={3} text="Most valuable AI insights" />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {INSIGHTS.map((ins) => {
                    const selected = form.mostValuable.includes(ins);
                    return (
                      <button
                        key={ins}
                        onClick={() => toggleInsight(ins)}
                        className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${selected ? "bg-[#EEF6FF] border-[#C2DFF4] text-[#00205B]" : "border-[#E8E6E1] text-[#6B7280] hover:border-[#0076BC] hover:text-[#0076BC]"}`}
                        style={{ fontWeight: selected ? 600 : 400 }}
                      >
                        {ins}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q5 — comments */}
              <div>
                <SurveyLabel index={5} text="Comments (optional)" />
                <textarea
                  value={form.comments}
                  onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                  placeholder="Anything to help improve AI accuracy or workflow…"
                  rows={2}
                  className="mt-1.5 w-full text-[11px] px-3 py-2 rounded-lg border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC] resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9]">
              <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-4 py-1.5 rounded-lg text-[11px] transition-colors ${canSubmit ? "bg-[#0076BC] text-white hover:bg-[#007EC2]" : "bg-[#E8E6E1] text-[#9B9B98] cursor-not-allowed"}`}
                style={{ fontWeight: 600 }}
              >
                Submit Feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SurveyLabel({ index: _index, text, required }: { index: number; text: string; required?: boolean }) {
  return (
    <div className="flex items-start gap-1">
      <span className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
        {text}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
    </div>
  );
}

