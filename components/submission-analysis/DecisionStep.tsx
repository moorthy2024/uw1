"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Gavel, Mail, CheckCircle2, ClipboardList, X, Check, Send, FileText,
  Shield, Download, Sparkles, RotateCcw, RefreshCw, Circle, ExternalLink, Paperclip,
} from "lucide-react";
import {
  StepShell, PaneTitle,
  CategorySummaryList, CategoryDetailView,
  STEP_STATUS_STYLE,
  type StepCategory, type StepStatus, type SummaryStat,
} from "../step-detail-layout";
import { PostDecisionSurvey } from "../FeedbackComponents";
import { ActionBtn } from "../SubmissionHelpers";
import { useStepActions } from "../SubmissionTypes";
import {
  type SubmissionMeta, type SubmissionExtras,
} from "../SubmissionTypes";
import { type SubmissionIndexEntry } from "../CustomerTable";
import {
  deriveRecommendation, hazardBand, RECOMMENDATION_CONFIG,
} from "../SubmissionHelpers";

const INIT_PREMIUM = "$142,000";

/* ── CommModal — local copy for Decision step ── */
interface CommModalProps {
  title: string; stage: string; account: string;
  to: string; toEmail: string; subject: string;
  initialBody: string; attachment?: { filename: string };
  onClose: () => void;
}
function CommModal({ title, stage, account, to, toEmail, subject, initialBody, attachment, onClose }: CommModalProps) {
  const [body, setBody] = useState(initialBody);
  const handleOpenDraft = () => {
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(toEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <Mail className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{title}</div>
              <div className="text-[10px] text-[#9B9B98]">{stage} · {account}</div>
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
              {to} &lt;{toEmail}&gt;
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0 mt-1" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563]">{subject}</span>
          </div>
        </div>
        {attachment && (
          <div className="px-4 py-2 flex-shrink-0 border-b border-[#F0EFEC]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F0F4FF] border border-[#C7D7F5] rounded-md w-fit max-w-full">
              <Paperclip className="w-3 h-3 text-[#4B6CB7] flex-shrink-0" />
              <span className="text-[11px] text-[#374151] font-medium truncate">{attachment.filename}</span>
              <span className="text-[9px] text-[#9B9B98] ml-1 flex-shrink-0">PDF</span>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            spellCheck
          />
        </div>
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
    </div>,
    document.body
  );
}

/* ── Step 5: Decision ── */
export function DecisionStep() {
  const { meta, idx, extras } = useSubmissionCtx();
  // Pre-set known outcomes for specific submissions
  const presetDecision: "quoted-won" | "quoted-lost" | "no-response" | null =
    meta.id === "SUB-2026-0851" ? "quoted-lost" : null;
  const [decision, setDecision] = useState<"quoted-won" | "quoted-lost" | "no-response" | null>(presetDecision);
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [activeCategory, setActiveCategory] = useState("decision");
  const [showSurvey, setShowSurvey] = useState(false);
  const [attested, setAttested] = useState(false);

  // Send binder/policy modals
  const [showSendBinder, setShowSendBinder] = useState(false);
  const [showSendPolicy, setShowSendPolicy] = useState(false);

  // Document generation workflow
  const [docGenOpen, setDocGenOpen] = useState(false);
  const [docGenStep, setDocGenStep] = useState<1|2|3|4>(1);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set(["quote", "binder"]));
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set(["lma5393"]));
  const [selectedEndorsements, setSelectedEndorsements] = useState<Set<string>>(new Set());
  const [docFields, setDocFields] = useState({ effectiveDate: "", namedInsured: "", layer: "", premium: "", broker: "" });
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<Record<string, "pending"|"generating"|"done">>({});
  const [docGenComplete, setDocGenComplete] = useState(false);


  const recKey = deriveRecommendation(idx.industryClassification, idx.processingStatus);
  const rec = RECOMMENDATION_CONFIG[recKey];
  const recStatus: StepStatus = recKey === "in-scope" ? "good" : recKey === "out-of-scope" ? "alert" : "watch";
  const uw = idx.assignedUW || "Mike Farrell";
  const sov = extras.sov;
  const missingDocs = extras.documents.filter(d => !d.received);

  const disclaimer = `\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;
  const decisionEmail = decision === "quoted-won"
    ? `Subject: QBE — Quote Won Confirmation (${meta.id})\n\nDear ${meta.broker},\n\nWe are pleased to confirm the quote has been won for:\n\nAccount:    ${meta.namedInsured}\nSubmission: ${meta.id}\nLayer:      ${extras.request.qbeLayer}\nInception:  ${meta.inceptionDate}\n\nPolicy documentation will follow within 2 business days.\n\nRationale: ${rationale || "(no rationale entered)"}\n\nBest regards,\n${uw} — QBE${disclaimer}`
    : decision === "quoted-lost"
    ? `Subject: QBE — Quote Not Accepted (${meta.id})\n\nDear ${meta.broker},\n\nThank you for the opportunity to review ${meta.namedInsured}.\n\nSubmission Reference: ${meta.id}\n\nWe understand the quote was not accepted on this occasion.\n\nRationale: ${rationale || "(no rationale entered)"}\n\nWe look forward to working with you on future submissions.\n\nBest regards,\n${uw} — QBE${disclaimer}`
    : `Subject: QBE — Submission Follow-Up (${meta.id})\n\nDear ${meta.broker},\n\nWe have not received a response on ${meta.namedInsured}.\n\nSubmission Reference: ${meta.id}\n\nPlease let us know if you require any further information.\n\nBest regards,\n${uw} — QBE${disclaimer}`;

  const auditTrail = [
    { label: "Submission received", value: meta.submissionDate, note: `${meta.type} from ${meta.broker} — ${meta.brokerageHouse}` },
    { label: "Ingestion", value: "Fields extracted and verified", note: `SOV completeness ${sov.completenessPct}%` },
    { label: "Triage", value: idx.clearance === "complete" ? "Cleared" : "Clearance in progress", note: `Appetite: ${idx.industryClassification}` },
    { label: "UW Analysis", value: `Hazard ${idx.hazardScore}/100`, note: `Top accumulation ${sov.stats.topState}; 5-yr loss ratio ${extras.lossHistory.lossRatio}` },
    { label: "UW Review", value: `${extras.request.qbeLayer} quoted`, note: `Assigned UW ${uw}` },
  ];

  const decisionStatus: StepStatus = decision === "quoted-won" ? "good" : decision === "quoted-lost" ? "alert" : decision === "no-response" ? "watch" : "neutral";
  const decisionLabel = decision === "quoted-won" ? "Quoted Won" : decision === "quoted-lost" ? "Quote Not Accepted" : decision === "no-response" ? "No Response" : "Not yet recorded";

  const categories: StepCategory[] = [
    {
      key: "decision",
      icon: Gavel,
      title: "Decision Record",
      status: decisionStatus,
      statusLabel: decisionLabel,
      headline: decision
        ? `${decisionLabel} recorded for ${meta.accountName} by ${uw}.`
        : "No decision recorded yet — select an outcome to continue.",
      context: rationale ? `Rationale: ${rationale}` : "A written rationale is required before the decision is confirmed.",
      sources: ["Underwriter Input"],
      summaryRows: [
        { key: "outcome", label: "Outcome", value: decisionLabel, status: decisionStatus },
        { key: "uw", label: "Decided By", value: uw },
        { key: "rationale", label: "Rationale", value: rationale ? "Entered" : "Not entered", status: rationale ? "good" : "watch" },
      ],
      narrative: "Record the outcome and the reasoning behind it. Both are written to the account audit trail.",
      custom: (
        <div className="p-3">
          {decision ? (
            (() => {
              const cfg =
                decision === "quoted-won"  ? { Icon: CheckCircle2, label: "Quoted Won",        bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D" } :
                decision === "quoted-lost" ? { Icon: X,            label: "Quote Not Accepted", bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C" } :
                                             { Icon: RotateCcw,    label: "No Response",        bg: "#FFFBEB", border: "#FDE68A", color: "#B45309" };
              return (
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3">
                  <div className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2" style={{ fontWeight: 700 }}>Final Outcome</div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px]"
                    style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color, fontWeight: 700 }}>
                    <cfg.Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Gavel className="w-8 h-8 text-[#C0CEDC]" />
              <p className="text-[13px] text-[#94A3B8]">No outcome recorded yet.</p>
              <p className="text-[11px] text-[#C0CEDC]">Use <strong className="text-[#6B7280]">Take Action</strong> to select an outcome.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "recommendation",
      icon: Sparkles,
      title: "AI Recommendation",
      metric: rec.label,
      status: recStatus,
      statusLabel: rec.label,
      headline: extras.focusNote,
      context: `Based on ${idx.accountIndustry} appetite classification, hazard ${idx.hazardScore}/100 and a 5-yr loss ratio of ${extras.lossHistory.lossRatio}.`,
      sources: ["Triage", "UW Analysis", "Loss Runs"],
      summaryRows: [
        { key: "rec", label: "Recommendation", value: rec.label, status: recStatus },
        { key: "win", label: "Success Propensity", value: `${idx.successPropensity}%`, status: idx.successPropensity >= 60 ? "good" : "watch" },
        { key: "lr", label: "5-Yr Loss Ratio", value: extras.lossHistory.lossRatio, status: extras.lossHistory.lossRatioBand },
      ],
      narrative: "The recommendation is advisory. The underwriter's decision below is what is recorded against the account.",
      groups: [{
        title: "Supporting Position",
        rows: [
          { label: "Appetite Classification", value: idx.industryClassification, status: recStatus },
          { label: "Hazard Score", value: `${idx.hazardScore}/100`, status: hazardBand(idx.hazardScore) },
          { label: "5-Yr Loss Ratio", value: extras.lossHistory.lossRatio, status: extras.lossHistory.lossRatioBand },
          { label: "Success Propensity", value: `${idx.successPropensity}%`, note: idx.successPropensityDrivers },
          { label: "SOV Completeness", value: `${sov.completenessPct}%`, status: sov.completenessPct >= 90 ? "good" : "watch" },
          { label: "Outstanding Documents", value: missingDocs.length > 0 ? missingDocs.map(d => d.name).join(", ") : "None", status: missingDocs.length > 0 ? "watch" : "good" },
        ],
      }],
    },


    /* ── Correspondence ── */
    {
      key: "correspondence",
      icon: Mail,
      title: "Customer Correspondence",
      metric: showEmail && decision ? "Drafted" : "Not drafted",
      status: showEmail && decision ? "good" : "neutral",
      statusLabel: showEmail && decision ? "Ready to send" : "Awaiting decision",
      headline: decision
        ? `${decision === "quoted-won" ? "Quote won confirmation" : decision === "quoted-lost" ? "Quote not accepted notice" : "Submission follow-up"} addressed to ${meta.broker} at ${meta.brokerageHouse}.`
        : "Record a decision to generate the customer letter.",
      context: "The letter quotes the rationale exactly as entered on the decision record.",
      sources: ["Template Library"],
      summaryRows: [
        { key: "to", label: "Recipient", value: meta.broker },
        { key: "house", label: "Brokerage", value: meta.brokerageHouse },
        { key: "acct", label: "Account", value: meta.accountName },
      ],
      narrative: "Nothing is sent until you confirm from the action bar.",
      custom: decision ? (
        <div className="space-y-3">
          {!showEmail ? (
            <ActionBtn icon={Mail} label="Generate Customer Letter" onClick={() => setShowEmail(true)} />
          ) : (
            <>
              {/* Draft status notice */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-md border"
                style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
                <Circle className="w-2 h-2 mt-0.5 flex-shrink-0" style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold" style={{ color: "#92400E" }}>Draft — Ready to Send</div>
                  <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "#B45309" }}>
                    Nothing is sent until you confirm from the action bar.
                  </div>
                </div>
              </div>

              {/* Letter preview */}
              <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-[#FAFAF9] border-b border-[#E8E6E1] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
                      {decision === "quoted-won" ? "Quote Won Confirmation" : decision === "quoted-lost" ? "Quote Not Accepted" : "Submission Follow-Up"} — {meta.id}
                    </span>
                    <div className="text-[9px] mt-0.5" style={{ color: "#9B9B98" }}>
                      Draft correspondence for {meta.broker} · {meta.brokerageHouse}
                    </div>
                  </div>
                  <button onClick={() => setShowEmail(false)}><X className="w-3.5 h-3.5 text-[#9B9B98]" /></button>
                </div>
                <div className="p-3">
                  <textarea
                    value={editedEmail ?? decisionEmail}
                    onChange={e => setEditedEmail(e.target.value)}
                    rows={12}
                    className="w-full rounded-md border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
                    spellCheck
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        const body = editedEmail ?? decisionEmail;
                        const subjectLine = body.split("\n")[0].replace(/^Subject:\s*/i, "");
                        const bodyText = body.split("\n").slice(2).join("\n");
                        const brokerEmail = `${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;
                        const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(brokerEmail)}&subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Draft Email
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#E8E6E1] bg-white p-4 text-[11px] text-[#9B9B98] text-center">
          Select a decision outcome first.
        </div>
      ),
    },

    /* ── Document Generation ── */
    {
      key: "docgen",
      icon: Download,
      title: "Document Generation",
      metric: docGenComplete ? "Package Ready" : decision === "quoted-won" ? "In Progress" : "Awaiting Decision",
      status: docGenComplete ? "good" : decision === "quoted-won" ? "watch" : "neutral",
      statusLabel: docGenComplete ? "Package generated" : decision === "quoted-won" ? "Workflow open" : "Awaiting decision",
      headline: docGenComplete
        ? `Quote and Binder generated for ${meta.accountName}.`
        : decision === "quoted-won"
        ? "Document generation workflow is open — select documents, forms, and complete required fields."
        : "Select Quoted Won to trigger the document generation workflow.",
      context: "Documents are saved to the account and available for download once generated.",
      sources: ["Document Library", "Policy Admin"],
      summaryRows: [
        { key: "quote",  label: "Quote Document",       value: selectedDocs.has("quote")  ? (docGenComplete ? "Generated" : "Selected") : "Not selected", status: docGenComplete && selectedDocs.has("quote") ? "good" : "neutral" },
        { key: "binder", label: "Binder",               value: selectedDocs.has("binder") ? (docGenComplete ? "Generated" : "Selected") : "Not selected", status: docGenComplete && selectedDocs.has("binder") ? "good" : "neutral" },
        { key: "policy", label: "Policy Schedule",      value: selectedDocs.has("policy") ? (docGenComplete ? "Generated" : "Selected") : "Not selected", status: docGenComplete && selectedDocs.has("policy") ? "good" : "neutral" },
        { key: "forms",  label: "Forms & Endorsements", value: `${selectedForms.size + selectedEndorsements.size} attached` },
      ],
      narrative: "Use the Generate Package button to open the workflow, or re-open it to add documents.",
      custom: (
        <div className="space-y-3">
          {decision === "quoted-won" ? (
            <>
              {docGenComplete && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "quote",  label: "Quote Document" },
                      { key: "binder", label: "Binder" },
                      { key: "policy", label: "Policy Schedule" },
                    ].filter(d => selectedDocs.has(d.key)).map(d => (
                      <button key={d.key}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E6E1] text-[11px] font-semibold hover:bg-[#F9FAFB] transition-colors"
                        style={{ color: "#0076BC" }}>
                        <Download className="w-3.5 h-3.5" />
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedDocs.has("binder") && (
                      <ActionBtn icon={Mail} label="Send Binder to Broker" onClick={() => setShowSendBinder(true)} />
                    )}
                    <ActionBtn icon={Mail} label="Send Policy to Broker" onClick={() => setShowSendPolicy(true)} />
                  </div>
                </>
              )}
              <ActionBtn
                icon={docGenComplete ? RefreshCw : Sparkles}
                label={docGenComplete ? "Re-open Workflow" : "Open Document Workflow"}
                onClick={() => { setDocGenStep(1); setDocGenOpen(true); }}
              />
            </>
          ) : (
            <div className="rounded-md border border-dashed border-[#E8E6E1] bg-white p-4 text-[11px] text-[#9B9B98] text-center">
              Select Quoted Won to trigger document generation.
            </div>
          )}
        </div>
      ),
    },

    /* ── Audit trail ── */
    {
      key: "audit",
      icon: ClipboardList,
      title: "Audit Trail",
      metric: `${auditTrail.length} steps`,
      status: "neutral",
      statusLabel: "Complete workflow record",
      headline: `${meta.id} moved from receipt on ${meta.submissionDate} through to decision with ${uw} on the desk.`,
      context: "Every step's evidence remains retrievable from its own tab.",
      sources: ["Workflow Log"],
      summaryRows: auditTrail.map(a => ({ key: a.label, label: a.label, value: a.value })),
      narrative: "The record below is what is written to the policy administration system alongside the decision.",
      groups: [{ title: "Workflow History", rows: auditTrail }],
    },
  ];

  const active = categories.find(c => c.key === activeCategory) ?? categories[0];

  return (
    <>
      <DecisionActions onSelect={(d) => {
        setDecision(d);
        setEditedEmail(null);
        if (d === "quoted-won") {
          setDocFields({
            effectiveDate: meta.inceptionDate,
            namedInsured: meta.namedInsured,
            layer: extras.request.qbeLayer,
            premium: INIT_PREMIUM,
            broker: meta.broker,
          });
          setDocGenStep(1);
          setDocGenComplete(false);
          setGenProgress({});
          setDocGenOpen(true);
        } else {
          setShowSurvey(true);
        }
      }} />
      {docGenOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col" style={{ width: 640, maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E1] flex-shrink-0">
              <div>
                <div className="text-[13px] font-bold text-[#0D1B2E]">Document Generation Workflow</div>
                <div className="text-[10px] text-[#9B9B98] mt-0.5">{meta.accountName} · {meta.id.replace("SUB","POL")}</div>
              </div>
              <button onClick={() => setDocGenOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#F3F4F6] transition-colors">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            {/* Step tabs */}
            <div className="flex border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
              {[
                { n: 1, label: "Documents",           Icon: FileText },
                { n: 2, label: "Forms & Endorsements", Icon: ClipboardList },
                { n: 3, label: "Required Fields",      Icon: Shield },
                { n: 4, label: "Generate",             Icon: Sparkles },
              ].map((s) => {
                const done = docGenStep > s.n;
                const active = docGenStep === s.n;
                return (
                  <button key={s.n}
                    onClick={() => !generating && s.n <= docGenStep && setDocGenStep(s.n as 1|2|3|4)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] border-b-2 transition-colors
                      ${active ? "border-[#0076BC] bg-white text-[#0076BC]" : "border-transparent text-[#6B7280] hover:text-[#2D2D2D] hover:bg-white"}`}
                    style={{ fontWeight: active ? 700 : 500 }}>
                    {done
                      ? <Check className="w-3 h-3 text-[#059669] flex-shrink-0" />
                      : <s.Icon className="w-3 h-3 flex-shrink-0" />}
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Step body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* ── Step 1: Document Selection ── */}
              {docGenStep === 1 && (
                <div className="space-y-3">
                  <p className="text-[12px]" style={{ color: "#6B7280" }}>Select the documents to include in the final package.</p>
                  {[
                    { key: "quote",  icon: FileText,      label: "Quote Document",  desc: "Formal quote letter with terms, layer, and premium" },
                    { key: "binder", icon: ClipboardList, label: "Binder",          desc: "Binding confirmation document for immediate coverage" },
                    { key: "policy", icon: Shield,        label: "Policy Schedule", desc: "Full policy schedule with declarations" },
                  ].map(({ key, icon: Icon, label, desc }) => {
                    const sel = selectedDocs.has(key);
                    return (
                      <button key={key} onClick={() => {
                        setSelectedDocs(prev => {
                          const n = new Set(prev);
                          sel ? n.delete(key) : n.add(key);
                          return n;
                        });
                      }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: sel ? "#0076BC" : "#E8E6E1",
                          backgroundColor: sel ? "#EEF6FF" : "white",
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: sel ? "#0076BC" : "#F3F4F6" }}>
                          <Icon className="w-5 h-5" style={{ color: sel ? "white" : "#9B9B98" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold" style={{ color: sel ? "#0D1B2E" : "#374151" }}>{label}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#9B9B98" }}>{desc}</div>
                        </div>
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: sel ? "#0076BC" : "#D1D5DB", backgroundColor: sel ? "#0076BC" : "white" }}>
                          {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Step 2: Forms & Endorsements ── */}
              {docGenStep === 2 && (
                <div className="space-y-5">
                  <p className="text-[12px]" style={{ color: "#6B7280" }}>Select the forms and endorsements to attach.</p>
                  <div className="grid grid-cols-2 gap-5">
                    {/* Forms */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "#9B9B98" }}>Forms</div>
                      <div className="space-y-2">
                        {[
                          { key: "manuscript", label: "Manuscript / Broker Form" },
                          { key: "carrier",    label: "Carrier Form" },
                          { key: "es-follow",  label: "Commercial Property Follow / Excess Form" },
                          { key: "lma5393",    label: "LMA 5393" },
                        ].map(f => {
                          const sel = selectedForms.has(f.key);
                          return (
                            <button key={f.key} onClick={() => {
                              setSelectedForms(prev => { const n = new Set(prev); sel ? n.delete(f.key) : n.add(f.key); return n; });
                            }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                              style={{ borderColor: sel ? "#0076BC" : "#E8E6E1", backgroundColor: sel ? "#EEF6FF" : "white" }}>
                              <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: sel ? "#0076BC" : "#D1D5DB", backgroundColor: sel ? "#0076BC" : "white" }}>
                                {sel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                              </div>
                              <span className="text-[12px]" style={{ color: sel ? "#0D1B2E" : "#374151", fontWeight: sel ? 600 : 400 }}>{f.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Endorsements */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "#9B9B98" }}>Endorsements</div>
                      <div className="space-y-2">
                        {[
                          { key: "nw-end",     label: "Named Windstorm Endorsement" },
                          { key: "eq-ded",     label: "Earthquake Deductible Endorsement" },
                          { key: "flood-excl", label: "Flood Exclusion Endorsement" },
                          { key: "cyber-excl", label: "Cyber Exclusion" },
                          { key: "ofac",       label: "OFAC Compliance Endorsement" },
                          { key: "cat-model",  label: "CAT Modeling Endorsement" },
                        ].map(e => {
                          const sel = selectedEndorsements.has(e.key);
                          return (
                            <button key={e.key} onClick={() => {
                              setSelectedEndorsements(prev => { const n = new Set(prev); sel ? n.delete(e.key) : n.add(e.key); return n; });
                            }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                              style={{ borderColor: sel ? "#0076BC" : "#E8E6E1", backgroundColor: sel ? "#EEF6FF" : "white" }}>
                              <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: sel ? "#0076BC" : "#D1D5DB", backgroundColor: sel ? "#0076BC" : "white" }}>
                                {sel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                              </div>
                              <span className="text-[12px]" style={{ color: sel ? "#0D1B2E" : "#374151", fontWeight: sel ? 600 : 400 }}>{e.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Required Fields ── */}
              {docGenStep === 3 && (
                <div className="space-y-4">
                  <p className="text-[12px]" style={{ color: "#6B7280" }}>Review and confirm the fields that will be populated across all generated documents.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: "namedInsured",  label: "Named Insured",    placeholder: "Legal entity name" },
                      { key: "effectiveDate", label: "Effective Date",   placeholder: "DD/MM/YYYY" },
                      { key: "layer",         label: "Layer / Limit",    placeholder: "e.g. $10M xs $3M" },
                      { key: "premium",       label: "Indicated Premium", placeholder: "e.g. $142,000" },
                      { key: "broker",        label: "Broker",           placeholder: "Broker name" },
                    ] as const).map(field => (
                      <div key={field.key}>
                        <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: "#9B9B98" }}>{field.label}</label>
                        <input
                          type="text"
                          value={docFields[field.key]}
                          onChange={e => setDocFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full text-[12px] px-3 py-2 rounded-lg border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC]"
                          style={{ color: "#0D1B2E" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Generate ── */}
              {docGenStep === 4 && (
                <div className="space-y-4">
                  {!docGenComplete ? (
                    <>
                      <p className="text-[12px]" style={{ color: "#6B7280" }}>
                        Ready to generate {selectedDocs.size} document{selectedDocs.size !== 1 ? "s" : ""} with {selectedForms.size + selectedEndorsements.size} form{selectedForms.size + selectedEndorsements.size !== 1 ? "s" : ""} and endorsements attached.
                      </p>
                      {/* Summary */}
                      <div className="rounded-xl border border-[#E8E6E1] overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#E8E6E1]" style={{ backgroundColor: "#FAFAF9" }}>
                          <span className="text-[11px] font-bold" style={{ color: "#0D1B2E" }}>Package Summary</span>
                        </div>
                        <div className="divide-y divide-[#F1F5F9]">
                          {[
                            { label: "Named Insured",  value: docFields.namedInsured },
                            { label: "Effective Date", value: docFields.effectiveDate },
                            { label: "Layer",          value: docFields.layer },
                            { label: "Premium",        value: docFields.premium },
                            { label: "Broker",         value: docFields.broker },
                            { label: "Documents",      value: [selectedDocs.has("quote") && "Quote", selectedDocs.has("binder") && "Binder", selectedDocs.has("policy") && "Policy"].filter(Boolean).join(" · ") },
                            { label: "Forms",          value: selectedForms.size > 0 ? `${selectedForms.size} selected` : "None" },
                            { label: "Endorsements",   value: selectedEndorsements.size > 0 ? `${selectedEndorsements.size} selected` : "None" },
                          ].map(row => (
                            <div key={row.label} className="flex px-4 py-2 gap-4">
                              <span className="text-[11px] w-32 flex-shrink-0" style={{ color: "#9B9B98" }}>{row.label}</span>
                              <span className="text-[11px] font-semibold" style={{ color: "#0D1B2E" }}>{row.value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Generate progress */}
                      <div className="space-y-2">
                        {[
                          { key: "quote",  label: "Quote Document",  show: selectedDocs.has("quote") },
                          { key: "binder", label: "Binder",          show: selectedDocs.has("binder") },
                          { key: "policy", label: "Policy Schedule", show: selectedDocs.has("policy") },
                        ].filter(d => d.show).map(d => (
                          <div key={d.key} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E8E6E1]">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: genProgress[d.key] === "done" ? "#059669" : genProgress[d.key] === "generating" ? "#EEF6FF" : "#F3F4F6",
                              }}>
                              {genProgress[d.key] === "done"
                                ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                : genProgress[d.key] === "generating"
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: "#0076BC" }} />
                                : <Circle className="w-3.5 h-3.5" style={{ color: "#D1D5DB" }} />}
                            </div>
                            <span className="text-[12px] font-semibold flex-1" style={{ color: "#0D1B2E" }}>{d.label}</span>
                            <span className="text-[11px]" style={{ color: genProgress[d.key] === "done" ? "#059669" : genProgress[d.key] === "generating" ? "#0076BC" : "#9B9B98" }}>
                              {genProgress[d.key] === "done" ? "Ready" : genProgress[d.key] === "generating" ? "Generating..." : "Queued"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Completion state */
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
                        <CheckCircle2 className="w-8 h-8" style={{ color: "#059669" }} />
                      </div>
                      <div className="text-center">
                        <div className="text-[16px] font-bold" style={{ color: "#0D1B2E" }}>Package Generated</div>
                        <div className="text-[12px] mt-1" style={{ color: "#6B7280" }}>All documents have been generated and saved to the account.</div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        {[
                          { key: "quote",  label: "Quote Document" },
                          { key: "binder", label: "Binder" },
                          { key: "policy", label: "Policy Documents" },
                        ].filter(d => selectedDocs.has(d.key)).map(d => (
                          <button key={d.key}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E6E1] text-[11px] font-semibold hover:bg-[#F9FAFB] transition-colors"
                            style={{ color: "#0076BC" }}>
                            <Download className="w-3.5 h-3.5" />
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E8E6E1] flex items-center justify-between flex-shrink-0">
              <div className="text-[11px]" style={{ color: "#9B9B98" }}>
                Step {docGenStep} of 4
              </div>
              <div className="flex gap-2">
                {docGenStep > 1 && !docGenComplete && (
                  <button onClick={() => setDocGenStep(prev => (prev - 1) as 1|2|3|4)}
                    disabled={generating}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-[#E8E6E1] hover:bg-[#F9FAFB] transition-colors disabled:opacity-40"
                    style={{ color: "#6B7280" }}>
                    Back
                  </button>
                )}
                {docGenStep < 4 && (
                  <button onClick={() => setDocGenStep(prev => (prev + 1) as 2|3|4)}
                    disabled={docGenStep === 1 && selectedDocs.size === 0}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
                    style={{ backgroundColor: "#0076BC" }}>
                    Next
                  </button>
                )}
                {docGenStep === 4 && !docGenComplete && (
                  <button
                    disabled={generating}
                    onClick={() => {
                      setGenerating(true);
                      const docs = ["quote", "binder", "policy"].filter(d => selectedDocs.has(d));
                      docs.forEach((doc, i) => {
                        setTimeout(() => setGenProgress(p => ({ ...p, [doc]: "generating" })), i * 800);
                        setTimeout(() => setGenProgress(p => ({ ...p, [doc]: "done" })), i * 800 + 1200);
                      });
                      setTimeout(() => { setGenerating(false); setDocGenComplete(true); }, docs.length * 800 + 1200);
                    }}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-60"
                    style={{ backgroundColor: "#059669" }}>
                    {generating ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate Package</>}
                  </button>
                )}
                {docGenComplete && (
                  <button onClick={() => setDocGenOpen(false)}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white"
                    style={{ backgroundColor: "#0076BC" }}>
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showSendBinder && (
        <CommModal
          title="Send Binder to Broker"
          stage="Customer Decision"
          account={meta.accountName}
          to={meta.broker}
          toEmail={`${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`}
          subject={`QBE — Binder — ${meta.namedInsured} (${meta.id})`}
          attachment={{ filename: `QBE_Binder_${meta.accountName.replace(/\s+/g, "_")}.pdf` }}
          initialBody={`Dear ${meta.broker},\n\nPlease find attached the binder for ${meta.namedInsured}.\n\nSubmission Reference: ${meta.id}\nLayer:               ${extras.request.qbeLayer}\nInception Date:      ${meta.inceptionDate}\n\nPlease review and revert with any queries. Full policy documentation will follow.\n\nKind regards,\n${uw} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`}
          onClose={() => setShowSendBinder(false)}
        />
      )}
      {showSendPolicy && (
        <CommModal
          title="Send Policy to Broker"
          stage="Customer Decision"
          account={meta.accountName}
          to={meta.broker}
          toEmail={`${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`}
          subject={`QBE — Policy — ${meta.namedInsured} (${meta.id})`}
          attachment={{ filename: `QBE_Policy_${meta.accountName.replace(/\s+/g, "_")}.pdf` }}
          initialBody={`Dear ${meta.broker},\n\nPlease find attached the policy schedule for ${meta.namedInsured}.\n\nSubmission Reference: ${meta.id}\nLayer:               ${extras.request.qbeLayer}\nInception Date:      ${meta.inceptionDate}\n\nPlease review the enclosed policy documents and endorsements carefully. Contact us if you have any questions.\n\nKind regards,\n${uw} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`}
          onClose={() => setShowSendPolicy(false)}
        />
      )}
      {showSurvey && decision && (
        <PostDecisionSurvey
          accountName={meta.accountName}
          decision={decision}
          onClose={() => setShowSurvey(false)}
          onSubmit={() => {
            setAttested(true);   // auto-confirm on survey submit
            setShowSurvey(false);
            setActiveCategory("correspondence");
            setShowEmail(true);
          }}
        />
      )}

      <StepShell
        scrollToSourceOn={activeCategory}
        summary={
          <DecisionStatsBand
            stats={[
              { label: "Recommendation", value: rec.label, status: recStatus, flex: 1.8 },
              { label: "Decision", value: decisionLabel, status: decisionStatus },
              { label: "Layer", value: extras.request.qbeLayer },
              { label: "5-Yr Loss Ratio", value: extras.lossHistory.lossRatio, status: extras.lossHistory.lossRatioBand, flex: 0.7 },
              { label: "Success Propensity", value: `${idx.successPropensity}%` },
              { label: "Decided By", value: uw },
            ]}
          />
        }
        leftHeader={<PaneTitle title="Decision Inputs" hint="select a section for its full detail" />}
        left={
          <CategorySummaryList
            categories={categories}
            activeKey={active.key}
            onSelect={setActiveCategory}
          />
        }
        rightHeader={<PaneTitle title={active.title} hint="full record" />}
        right={<CategoryDetailView category={active} />}
      />
    </>
  );
}


function DecisionActions({ onSelect }: { onSelect: (o: "quoted-won" | "quoted-lost" | "no-response") => void }) {
  useStepActions([
    { icon: CheckCircle2, label: "Quoted Won",         variant: "secondary" as const, onClick: () => onSelect("quoted-won") },
    { icon: X,            label: "Quote Not Accepted", variant: "secondary" as const, onClick: () => onSelect("quoted-lost") },
    { icon: RotateCcw,    label: "No Response",        variant: "secondary" as const, onClick: () => onSelect("no-response") },
  ], []);
  return null;
}

function DecisionStatsBand({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
      <div className="flex">
        {stats.map((st, i) => (
          <div
            key={st.label}
            className={`px-3 py-1.5 overflow-hidden min-w-0 ${i < stats.length - 1 ? "border-r border-[#E8E6E1]/70" : ""}`}
            style={{ flex: st.flex ?? 1 }}
          >
            <div className="text-[8px] uppercase tracking-wide text-[#9B9B98] whitespace-nowrap" style={{ fontWeight: 700 }}>{st.label}</div>
            <div className={`text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis ${st.status ? STEP_STATUS_STYLE[st.status].text : "text-[#2D2D2D]"}`} style={{ fontWeight: 700 }}>{st.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

