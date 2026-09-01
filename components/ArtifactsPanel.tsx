"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, FileCheck2, FileSignature, ScrollText, Receipt, Mail, FileSpreadsheet,
  ShieldCheck, BarChart3, Map, BookOpenCheck, Scale, X, Lock, ChevronRight, ChevronLeft,
  Inbox, Loader2, RefreshCw, Sparkles, Check, Send, Paperclip,
} from "lucide-react";
import type { ComponentType } from "react";

export type ArtifactStepId = "s01" | "s02" | "s03" | "s04" | "s05";

interface ArtifactDef {
  id: string;
  name: string;
  kind: string;
  icon: ComponentType<{ className?: string }>;
  version?: string;
  updatedNote?: string;
  previewable?: boolean;
}

interface ArtifactGroup {
  step: ArtifactStepId;
  number: string;
  label: string;
  artifacts: ArtifactDef[];
}

const ARTIFACT_GROUPS: ArtifactGroup[] = [
  {
    step: "s01",
    number: "01",
    label: "Ingestion",
    artifacts: [
      { id: "submission-email", name: "Submission Email", kind: "EML", icon: Mail, previewable: true },
      { id: "acord-125", name: "ACORD 125 — Commercial Application", kind: "PDF", icon: FileText, previewable: true },
      {
        id: "sov-normalized",
        name: "Statement of Values (Normalized)",
        kind: "XLSX",
        icon: FileSpreadsheet,
        version: "v2",
        updatedNote: "Re-populated from updated SOV received 11:42 AM — added 2 missing locations",
        previewable: true,
      },
      {
        id: "loss-runs",
        name: "Loss Runs — 5 Year History",
        kind: "PDF",
        icon: FileText,
        version: "v2",
        updatedNote: "Broker forwarded missing 2024 carrier loss run — Account Overview refreshed",
        previewable: true,
      },
      { id: "engineering-reports", name: "Engineering & Inspection Reports", kind: "PDF", icon: FileText, previewable: true },
    ],
  },
  {
    step: "s02",
    number: "02",
    label: "Triage",
    artifacts: [
      { id: "triage-report", name: "Triage Decision Report", kind: "PDF", icon: FileCheck2, previewable: true },
      { id: "appetite-check", name: "Appetite & Authority Check", kind: "PDF", icon: ShieldCheck, previewable: true },
      { id: "clearance", name: "Clearance Confirmation (Salesforce)", kind: "PDF", icon: FileCheck2, previewable: true },
    ],
  },
  {
    step: "s03",
    number: "03",
    label: "UW Analysis",
    artifacts: [
      { id: "risk-synopsis", name: "Risk Synopsis (Unified L1/L2/L3)", kind: "PDF", icon: BookOpenCheck, previewable: true },
      { id: "cat-model", name: "CAT Modeling Report (RMS)", kind: "PDF", icon: BarChart3, previewable: true },
      { id: "accumulation", name: "Portfolio Accumulation Memo", kind: "PDF", icon: Map, previewable: true },
      { id: "comparables", name: "Comparable Accounts Analysis", kind: "PDF", icon: BarChart3, previewable: true },
    ],
  },
  {
    step: "s04",
    number: "04",
    label: "UW Review",
    artifacts: [
      { id: "pricing-indication", name: "Pricing Indication", kind: "PDF", icon: Scale, previewable: true },
      { id: "quote-letter", name: "Quote Letter", kind: "PDF", icon: FileSignature, previewable: true },
      { id: "terms-conditions", name: "Terms & Conditions (Draft)", kind: "PDF", icon: ScrollText, previewable: true },
      { id: "manuscript", name: "Manuscript Policy Wording", kind: "DOCX", icon: ScrollText, previewable: true },
    ],
  },
  {
    step: "s05",
    number: "05",
    label: "Decision",
    artifacts: [
      { id: "binder", name: "Binder", kind: "PDF", icon: FileSignature, previewable: true },
      { id: "policy", name: "Bound Policy", kind: "PDF", icon: ScrollText, previewable: true },
      { id: "invoice", name: "Premium Invoice", kind: "PDF", icon: Receipt, previewable: true },
      { id: "decision-letter", name: "Customer Decision Letter", kind: "PDF", icon: Mail, previewable: true },
    ],
  },
];

function findArtifact(id: string): ArtifactDef | null {
  for (const g of ARTIFACT_GROUPS) {
    const a = g.artifacts.find(x => x.id === id);
    if (a) return a;
  }
  return null;
}

export type ArtifactsStepStatus = Record<ArtifactStepId, "complete" | "current" | "pending">;

interface ArtifactsPanelProps {
  accountName: string;
  submissionId: string;
  stepStatus: ArtifactsStepStatus;
  onClose: () => void;
  initialArtifactId?: string | null;
}

export function ArtifactsPanel({ accountName, submissionId, stepStatus, onClose, initialArtifactId }: ArtifactsPanelProps) {
  const [activeArtifact, setActiveArtifact] = useState<string | null>(initialArtifactId ?? null);
  useEffect(() => {
    if (initialArtifactId) setActiveArtifact(initialArtifactId);
  }, [initialArtifactId]);

  const totalArtifacts = ARTIFACT_GROUPS.reduce((acc, g) => acc + g.artifacts.length, 0);
  const availableCount = ARTIFACT_GROUPS.reduce(
    (acc, g) => acc + (stepStatus[g.step] === "complete" ? g.artifacts.length : 0),
    0,
  );

  return (
    <>
      <motion.aside
        initial={{ x: 480, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 480, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="absolute top-0 right-0 h-full w-[460px] bg-white border-l border-[#E8E6E1] shadow-xl flex flex-col z-30"
      >
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col h-full"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F2F1EE] border border-[#E8E6E1] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#2D2D2D]" />
                </div>
                <div>
                  <h2 className="text-sm text-[#1A1A1A]" style={{ fontWeight: 600 }}>
                    Artifacts
                  </h2>
                  <p className="text-[11px] text-[#9B9B98]">
                    {availableCount} of {totalArtifacts} available · {accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280] transition-colors"
                aria-label="Close artifacts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account ref */}
            <div className="px-5 py-2.5 border-b border-[#E8E6E1] bg-white">
              <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Project · {submissionId}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                All documents generated end-to-end across the underwriting process. Artifacts unlock as each step completes and re-populate when new broker docs arrive.
              </p>
            </div>

            {/* Incoming mailbox */}
            <IncomingMailboxTile />

            {/* Groups */}
            <div className="flex-1 overflow-auto px-3 py-3 space-y-4">
              {ARTIFACT_GROUPS.map((group) => {
                const status = stepStatus[group.step];
                const isAvailable = status === "complete";
                const isCurrent = status === "current";

                return (
                  <div key={group.step}>
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase tracking-wider ${
                            isAvailable ? "text-[#2D2D2D]" : "text-[#9B9B98]"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {group.number} · {group.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] text-[#0076BC] uppercase tracking-wider" style={{ fontWeight: 700 }}>
                            In progress
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#9B9B98]">
                        {isAvailable ? `${group.artifacts.length} ready` : isCurrent ? "Generating…" : "Pending"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {group.artifacts.map((art) => {
                        const Icon = art.icon;
                        const updated = !!art.version;
                        const previewable = art.previewable && isAvailable;
                        return (
                          <button
                            key={art.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                if (previewable) {
                                  setActiveArtifact(art.id);
                                } else {
                                  console.log(`Open artifact: ${art.id} for ${submissionId}`);
                                }
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-colors ${
                              isAvailable
                                ? "border-[#E8E6E1] bg-white hover:bg-[#FAFAF9] hover:border-[#D4D2CC] cursor-pointer"
                                : "border-[#EFEDE7] bg-[#F7F6F3] cursor-not-allowed"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                                isAvailable ? "bg-[#F2F1EE] text-[#2D2D2D]" : "bg-[#EFEDE7] text-[#B5B3AC]"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[12px] truncate ${isAvailable ? "text-[#2D2D2D]" : "text-[#9B9B98]"}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {art.name}
                                </span>
                                {updated && isAvailable && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px]" style={{ fontWeight: 700 }}>
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    {art.version} · UPDATED
                                  </span>
                                )}
                                {previewable && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#0076BC]/10 text-[#0076BC] border border-[#0076BC]/30 text-[9px]" style={{ fontWeight: 700 }}>
                                    REVIEW
                                  </span>
                                )}
                              </div>
                              <div className={`text-[10px] ${isAvailable ? "text-[#6B7280]" : "text-[#B5B3AC]"}`}>
                                {art.kind}
                                {!isAvailable && (isCurrent ? " · awaiting generation" : " · not yet generated")}
                                {art.updatedNote && isAvailable && (
                                  <span className="block mt-0.5 text-[10px] text-emerald-700">{art.updatedNote}</span>
                                )}
                              </div>
                            </div>
                            {isAvailable ? (
                              <ChevronRight className="w-4 h-4 text-[#9B9B98] flex-shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-[#B5B3AC] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
        </motion.div>
      </motion.aside>

      <AnimatePresence>
        {activeArtifact && (
          <motion.div
            key="artifact-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveArtifact(null)}
          >
            <motion.div
              key="artifact-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-[#E8E6E1]"
              onClick={(e) => e.stopPropagation()}
            >
              {activeArtifact === "terms-conditions" ? (
                <TermsAndConditionsPreview
                  key="tc"
                  accountName={accountName}
                  submissionId={submissionId}
                  onBack={() => setActiveArtifact(null)}
                  onClose={() => setActiveArtifact(null)}
                />
              ) : findArtifact(activeArtifact) ? (
                <GenericArtifactPreview
                  key={activeArtifact}
                  artifact={findArtifact(activeArtifact)!}
                  accountName={accountName}
                  submissionId={submissionId}
                  onBack={() => setActiveArtifact(null)}
                  onClose={() => setActiveArtifact(null)}
                />
              ) : (
                <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                  <FileText className="w-10 h-10 text-[#9B9B98] mb-3" />
                  <h3 className="text-sm text-[#1A1A1A]" style={{ fontWeight: 600 }}>
                    Artifact not found
                  </h3>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    The selected artifact ({activeArtifact}) is not yet available for preview.
                  </p>
                  <button
                    onClick={() => setActiveArtifact(null)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2D2D2D] text-white text-[11px]"
                    style={{ fontWeight: 600 }}
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IncomingMailboxTile() {
  return (
    <div className="mx-3 mt-3 p-3 rounded-md border border-[#C2DFF4] bg-[#EEF6FF]">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Inbox className="w-4 h-4 text-[#0076BC]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-[#EEF6FF] animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>
            Mailbox · 1 incoming document
          </div>
          <div className="text-[10px] text-[#6B7280]">Forwarded from broker just now</div>
        </div>
        <span className="text-[9px] text-emerald-700 uppercase tracking-wider" style={{ fontWeight: 700 }}>Live</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white border border-[#E8E6E1]">
        <FileText className="w-3.5 h-3.5 text-[#0076BC]" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[#2D2D2D] truncate" style={{ fontWeight: 600 }}>
            SOV_Westfield_Updated_v2.xlsx
          </div>
          <div className="text-[9px] text-[#6B7280]">Ingestion Agent · parsing &amp; reconciling locations</div>
        </div>
        <Loader2 className="w-3.5 h-3.5 text-[#0076BC] animate-spin" />
      </div>
      <div className="mt-1.5 text-[10px] text-[#6B7280]">
        Account Overview will refresh automatically — changed fields will be tagged.
      </div>
    </div>
  );
}

function TermsAndConditionsPreview({
  accountName,
  submissionId,
  onBack,
  onClose,
}: {
  accountName: string;
  submissionId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Record<string, boolean>>({});
  const [generated, setGenerated] = useState(false);
  const emailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (generated && emailRef.current) {
      emailRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [generated]);
  const [chatInput, setChatInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string; diff?: string[] }>>([
    {
      role: "user",
      text: "Add a $5M EQ sublimit on the IN location and tighten the NMA2914 carve-out to enumerate welding sparks.",
    },
    {
      role: "ai",
      text: "Updated. Applied $5M EQ sublimit on Bldg 5 (Indianapolis IN). Tightened NMA2914 carve-out to enumerate welding, cutting, and grinding ignition sources. Diff highlighted on §3 and §4.",
      diff: [
        "§3 Manuscript — NMA2914 carve-out: now lists welding, cutting, grinding, painting-booth ignition",
        "§4 Sublimits — added: Earthquake (Bldg 5 Indianapolis IN) — $5,000,000",
      ],
    },
  ]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setChatInput("");
    setPending(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "ai",
        text: `Applied: "${text}". Manuscript redlined and AI suggestions list updated. Re-run pricing to confirm impact on indication.`,
      }]);
      setPending(false);
    }, 1200);
  };

  const suggestions = [
    {
      id: "nws-ded",
      title: "Increase Named Windstorm deductible",
      detail: "AI suggests 5% NWS deductible (currently 2%) for FL Tampa location given comparables average 3–5%.",
    },
    {
      id: "manu-nma2914",
      title: "Add NMA2914 carve-out",
      detail: "Manuscript wording NMA2914 is on watchlist — AI proposes carve-out for ignition exposure on painting booth.",
    },
    {
      id: "sublimit-eq",
      title: "Add EQ sublimit on CA location",
      detail: "Earthquake exposure on Building 8 — AI recommends $25M sublimit aligning to portfolio strategy.",
    },
  ];

  const allAccepted = suggestions.every(s => acceptedSuggestions[s.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280]"
            aria-label="Back to artifacts"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm text-[#1A1A1A]" style={{ fontWeight: 600 }}>
              Terms &amp; Conditions — Draft
            </h2>
            <p className="text-[11px] text-[#9B9B98]">{accountName} · {submissionId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-[#FAFAF9]">
        {/* Document preview */}
        <div className="bg-white border border-[#E8E6E1] rounded-md shadow-sm">
          <div className="px-4 py-2 border-b border-[#E8E6E1] flex items-center justify-between bg-[#F7F6F3]">
            <div className="flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5 text-[#2D2D2D]" />
              <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>
                TermsAndConditions_{submissionId}.pdf
              </span>
            </div>
            <span className="text-[10px] text-[#9B9B98]">Page 1 of 6</span>
          </div>
          <div className="p-5 text-[11px] text-[#2D2D2D] leading-relaxed space-y-3">
            <div className="text-center text-[#1A1A1A]" style={{ fontWeight: 700 }}>
              QBE NORTH AMERICA · COMMERCIAL PROPERTY
            </div>
            <div className="text-center text-[#6B7280] text-[10px]">
              Manuscript Policy Terms &amp; Conditions — DRAFT
            </div>
            <div className="border-t border-[#E8E6E1] my-2" />
            <div>
              <div className="text-[#1A1A1A]" style={{ fontWeight: 700 }}>1. Named Insured</div>
              <div className="text-[#4B5563]">{accountName}</div>
            </div>
            <div>
              <div className="text-[#1A1A1A]" style={{ fontWeight: 700 }}>2. Coverage</div>
              <div className="text-[#4B5563]">All Risk of Direct Physical Loss or Damage subject to policy exclusions.</div>
            </div>
            <div>
              <div className="text-[#1A1A1A]" style={{ fontWeight: 700 }}>3. Limits &amp; Sublimits</div>
              <ul className="list-disc pl-5 text-[#4B5563]">
                <li>TIV / Policy Limit — $285,000,000 (per occurrence)</li>
                <li>Named Windstorm — $15,000,000 / 2% deductible <span className="bg-yellow-100 text-yellow-800 px-1 rounded">AI suggests 5% NWS deductible</span></li>
                <li>Earthquake — $50,000,000 (excludes CA) <span className="bg-yellow-100 text-yellow-800 px-1 rounded">AI proposes $25M CA sublimit</span></li>
                <li>Flood — $25,000,000</li>
              </ul>
            </div>
            <div>
              <div className="text-[#1A1A1A]" style={{ fontWeight: 700 }}>4. Manuscript Wording</div>
              <div className="text-[#4B5563]">
                NMA2914 (War &amp; Civil War Exclusion) <span className="bg-yellow-100 text-yellow-800 px-1 rounded">AI proposes painting-booth carve-out</span>, LMA5390, and standard QBE manuscript provisions.
              </div>
            </div>
            <div className="text-[#9B9B98] text-[10px] italic">— continued on page 2 —</div>
          </div>
        </div>

        {/* AI suggestions */}
        <div className="bg-white border border-[#E8E6E1] rounded-md">
          <div className="px-4 py-2.5 border-b border-[#E8E6E1] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0076BC]" />
            <span className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>
              AI UW Agent · {suggestions.length} suggested edits
            </span>
            <span className="ml-auto text-[10px] text-[#9B9B98]">
              {Object.values(acceptedSuggestions).filter(Boolean).length}/{suggestions.length} confirmed
            </span>
          </div>
          <div className="divide-y divide-[#E8E6E1]">
            {suggestions.map((s) => {
              const accepted = acceptedSuggestions[s.id];
              return (
                <div key={s.id} className="p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 600 }}>{s.title}</div>
                    <div className="text-[10px] text-[#6B7280] mt-0.5 leading-relaxed">{s.detail}</div>
                  </div>
                  <button
                    onClick={() => setAcceptedSuggestions(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] transition-colors ${
                      accepted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-[#2D2D2D] border-[#E8E6E1] hover:bg-[#FAFAF9]"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {accepted ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {accepted ? "Confirmed" : "Confirm"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inline chat — manuscript edits */}
        <div className="bg-white border border-[#E8E6E1] rounded-md flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#E8E6E1] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0076BC]" />
            <span className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>
              Chat with AI UW Agent · Manuscript edits
            </span>
            <span className="ml-auto text-[10px] text-[#9B9B98]">live · in-context</span>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-auto bg-[#FAFAF9]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-md px-3 py-2 text-[11px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#0076BC] text-white"
                      : "bg-white border border-[#E8E6E1] text-[#2D2D2D]"
                  }`}
                >
                  <div>{m.text}</div>
                  {m.diff && (
                    <ul className="mt-2 space-y-0.5 text-[10px] text-emerald-700">
                      {m.diff.map((d, j) => (
                        <li key={j} className="flex items-start gap-1">
                          <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E8E6E1] rounded-md px-3 py-2 text-[11px] text-[#6B7280] flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#0076BC]" />
                  Drafting redline…
                </div>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-[#E8E6E1] flex items-center gap-2 bg-white">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a manuscript change… e.g. 'Raise NWS deductible to 5%'"
              className="flex-1 px-2.5 py-1.5 text-[11px] rounded-md border border-[#E8E6E1] focus:outline-none focus:ring-2 focus:ring-[#0076BC]/30 bg-white"
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || pending}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#2D2D2D] text-white text-[11px] hover:bg-[#1A1A1A] disabled:bg-[#E8E6E1] disabled:text-[#9B9B98]"
              style={{ fontWeight: 600 }}
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          </div>
        </div>

        {/* Generated email draft */}
        <AnimatePresence>
          {generated && (
            <motion.div
              ref={emailRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-white border-2 border-emerald-300 rounded-md shadow-md ring-2 ring-emerald-100"
            >
              <div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[11px] text-emerald-800" style={{ fontWeight: 700 }}>
                  Email draft ready · pending send
                </span>
              </div>
              <div className="p-3 text-[11px] text-[#2D2D2D] space-y-1.5">
                <div><span className="text-[#9B9B98]">To:</span> sarah.chen@marsh.com</div>
                <div><span className="text-[#9B9B98]">Subject:</span> {accountName} · {submissionId} — Draft Terms &amp; Conditions for review</div>
                <div className="pt-2 text-[#4B5563] leading-relaxed">
                  Hi Sarah, please find attached the drafted Terms &amp; Conditions for {accountName}. Highlights: 5% NWS deductible on FL location, $25M CA earthquake sublimit, NMA2914 with painting-booth carve-out. Happy to walk through.
                </div>
                <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                  <Paperclip className="w-3 h-3" />
                  TermsAndConditions_{submissionId}.pdf · 6 pages
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Generate */}
      <div className="px-4 py-3 border-t border-[#E8E6E1] bg-white flex items-center gap-2">
        <div className="text-[10px] text-[#6B7280] flex-1">
          {allAccepted ? "All AI suggestions confirmed — ready to generate." : "Confirm AI suggestions before generating broker email."}
        </div>
        <button
          onClick={() => setGenerated(true)}
          disabled={!allAccepted}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors ${
            allAccepted
              ? "bg-[#2D2D2D] text-white hover:bg-[#1A1A1A]"
              : "bg-[#F2F1EE] text-[#9B9B98] cursor-not-allowed"
          }`}
          style={{ fontWeight: 600 }}
        >
          <Send className="w-3.5 h-3.5" />
          Generate broker email
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────── Generic artifact preview ─────────── */

function GenericArtifactPreview({
  artifact, accountName, submissionId, onBack, onClose,
}: {
  artifact: ArtifactDef;
  accountName: string;
  submissionId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const Icon = artifact.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-white border border-[#E8E6E1] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#2D2D2D]" />
          </div>
          <div>
            <h2 className="text-sm text-[#1A1A1A]" style={{ fontWeight: 600 }}>{artifact.name}</h2>
            <p className="text-[11px] text-[#9B9B98]">{artifact.kind} · {accountName} · {submissionId}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280]"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {artifact.updatedNote && (
        <div className="px-5 py-2 border-b border-emerald-100 bg-emerald-50 flex items-start gap-2">
          <RefreshCw className="w-3 h-3 text-emerald-700 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] text-emerald-800">
            <span style={{ fontWeight: 700 }}>{artifact.version} · UPDATED</span> — {artifact.updatedNote}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 bg-[#F2F1EE]">
        <div className="bg-white border border-[#E8E6E1] rounded shadow-sm">
          <div className="px-4 py-2 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAFAF9]">
            <span className="text-[10px] text-[#6B7280]">{artifact.id}.{artifact.kind.toLowerCase()}</span>
            <span className="text-[10px] text-[#9B9B98]">{accountName}</span>
          </div>
          <div className="p-5">
            {renderArtifactBody(artifact.id, accountName, submissionId)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#E8E6E1] bg-white flex items-center gap-2">
        <span className="text-[10px] text-[#6B7280] flex-1">Read-only preview · download for offline review</span>
        <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E8E6E1] bg-white hover:bg-[#FAFAF9] text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
          <Paperclip className="w-3 h-3" />
          Download
        </button>
      </div>
    </motion.div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-[#1A1A1A] mb-1" style={{ fontWeight: 700 }}>{children}</div>;
}
function L({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>{children}</div>;
}

function renderArtifactBody(id: string, accountName: string, submissionId: string): React.ReactNode {
  switch (id) {
    case "submission-email":
      return (
        <div className="text-[11px] text-[#2D2D2D] leading-relaxed space-y-2">
          <div className="text-[10px] text-[#9B9B98]">From: Sarah Chen &lt;sarah.chen@marsh.com&gt;</div>
          <div className="text-[10px] text-[#9B9B98]">To: submissions@qbe.com</div>
          <div className="text-[10px] text-[#9B9B98]">Sent: Apr 8, 2026 09:14 AM</div>
          <div className="text-[10px] text-[#9B9B98]">Subject: {accountName} — new business submission</div>
          <hr className="border-[#E8E6E1]" />
          <p>Hi team, please find attached an all-risk property submission for {accountName}. Limit $285M / occurrence, inception 7/1/2026. Quote needed by 4/18.</p>
          <p>Attached: SOV (8 locations OH/IN/FL), 5-yr loss runs, ACORD 125, engineering reports, prior manuscript.</p>
          <p>Thanks, Sarah</p>
        </div>
      );
    case "acord-125":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <div className="text-center">
            <div className="text-[10px] text-[#9B9B98]">ACORD 125 (2016/03)</div>
            <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>COMMERCIAL INSURANCE APPLICATION</div>
          </div>
          <hr className="border-[#E8E6E1]" />
          <table className="w-full border border-[#E8E6E1] text-[11px]">
            <tbody>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280] w-1/3">Named Insured</td><td className="px-2 py-1">{accountName} LLC</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">FEIN</td><td className="px-2 py-1">31-1234567</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">Mailing Address</td><td className="px-2 py-1">4200 Industrial Pkwy, Westfield OH 44062</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">Effective Date</td><td className="px-2 py-1">07/01/2026</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">NAICS</td><td className="px-2 py-1">332710 — Machine Shops</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">Deductible (AOP)</td><td className="px-2 py-1">$100,000</td></tr>
            </tbody>
          </table>
        </div>
      );
    case "sov-normalized":
      return (
        <div className="text-[10px] text-[#2D2D2D] space-y-2">
          <H>Statement of Values — Normalized v2 (OED schema)</H>
          <table className="w-full border border-[#E8E6E1]">
            <thead className="bg-[#FAFAF9]">
              <tr>
                {["#","Building","Address","Construction","NWS","TIV"].map(h => (
                  <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1","Bldg 1","Westfield OH","Class 4","Inland","$48.2M"],
                ["2","Bldg 2","Westfield OH","Class 4","Inland","$31.8M"],
                ["3","Bldg 3","Westfield OH","Class 4","Inland","$22.6M"],
                ["4","Bldg 4","Westfield OH","Class 4","Inland","$18.4M"],
                ["5","Bldg 5","Indianapolis IN","Class 4","Inland","$86.4M"],
                ["6","Bldg 6","Indianapolis IN","Class 4","Inland","$22.3M"],
                ["7","Bldg 7","Anderson IN","Class 4","Inland","$13.0M"],
                ["8","Bldg 8","Tampa FL","Masonry Tilt","Tier 1","$42.3M"],
              ].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className="px-2 py-1 border border-[#E8E6E1]">{c}</td>)}</tr>
              ))}
              <tr className="bg-[#FAFAF9]"><td colSpan={5} className="px-2 py-1 text-right border border-[#E8E6E1]" style={{fontWeight:700}}>TIV</td><td className="px-2 py-1 border border-[#E8E6E1]" style={{fontWeight:700}}>$285.0M</td></tr>
            </tbody>
          </table>
        </div>
      );
    case "loss-runs":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Loss Runs — 5 Year History</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <thead className="bg-[#FAFAF9]"><tr>{["Year","Cause","Incurred","Status"].map(h => <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {[["2021","Water — Bldg 2","$84,200","Closed"],["2022","Theft — Bldg 4","$112,000","Closed"],["2023","Paint booth fire","$612,300","Closed"],["2024","Wind — Bldg 5","$348,500","Closed"],["2025","Eq breakdown — Bldg 6","$685,300","Closed"]].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className="px-2 py-1 border border-[#E8E6E1]">{c}</td>)}</tr>
              ))}
              <tr className="bg-[#FAFAF9]"><td colSpan={2} className="px-2 py-1 text-right border border-[#E8E6E1]" style={{fontWeight:700}}>Total / 5yr · LR 0.42</td><td className="px-2 py-1 border border-[#E8E6E1]" style={{fontWeight:700}}>$1,842,300</td><td className="px-2 py-1 border border-[#E8E6E1]">11 claims · 0 open</td></tr>
            </tbody>
          </table>
        </div>
      );
    case "engineering-reports":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>Engineering & Inspection Report — SiteRisk Inspections</H>
          <div><L>§1 Construction</L><p>Buildings 1–7 confirmed Class 4 (Masonry Non-Combustible). Building 8 (Tampa) constructed 2021, masonry tilt-up.</p></div>
          <div><L>§2 Protection</L><p>Sprinklered: Yes — wet-pipe systems, ESFR coverage in Bldgs 1, 5, 8. Central station alarm at all locations.</p></div>
          <div><L>§3 Hazard notes</L><p>Painting booth (Bldg 1) flagged ignition exposure — recommend booth-specific carve-out in manuscript wording.</p></div>
        </div>
      );
    case "triage-report":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Triage Decision Report</H>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-700" /><span className="text-emerald-800" style={{fontWeight:700}}>PASS — proceed to UW Analysis</span>
          </div>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <thead className="bg-[#FAFAF9]"><tr>{["Rule","Result","Note"].map(h => <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {[["Appetite — Property NB","In Scope","Manufacturing in appetite"],["Territory — OH/IN/FL","In Scope","All approved"],["TIV ≤ $500M","In Scope","$285M"],["OFAC screening","In Scope","Cleared"],["Loss ratio ≤ 0.65","In Scope","0.42"],["Clearance via Salesforce","In Scope","No prior 12-mo submission"]].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className={`px-2 py-1 border border-[#E8E6E1] ${i===1?"text-emerald-700":""}`} style={i===1?{fontWeight:700}:undefined}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "appetite-check":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Appetite & Authority Check</H>
          <ul className="space-y-1">
            <li>✓ Class 332710 — In appetite (target class)</li>
            <li>✓ TIV $285M within $500M segment cap</li>
            <li>✓ NWS Tier 1 capacity available — $42.3M FL within $75M zone limit</li>
            <li>✓ EQ Zone 2 (IN) within accumulation ceiling</li>
            <li>⚠ Manuscript NMA2914 — requires UW carve-out review (per guideline 4.2)</li>
            <li>✓ Mike Farrell authority: $50M / 5% ROL — within scope</li>
          </ul>
        </div>
      );
    case "clearance":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>Salesforce Clearance Confirmation</H>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 space-y-1">
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-700" /><span style={{fontWeight:700}} className="text-emerald-800">CLEARED via Salesforce</span></div>
            <div>Account ID: 0017k00000B3xQbAAJ</div>
            <div>Cleared on: 08 Apr 2026 09:17 AM</div>
            <div>No prior QBE submission in trailing 12 months.</div>
            <div>Checked against named-insured aliases and FEIN.</div>
          </div>
        </div>
      );
    case "risk-synopsis":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>Risk Synopsis — Unified L1/L2/L3</H>
          <div><L>L1 — Deal level</L><p>Score 94. Manufacturing class with strong loss history (LR 0.42), full sprinkler protection, prior carrier renewal pricing in line.</p></div>
          <div><L>L2 — Risk level</L><p>FL Tampa addition introduces NWS Tier 1 exposure ($42.3M). Recommend $5M NWS deductible at minimum. Painting booth ignition hazard at Bldg 1.</p></div>
          <div><L>L3 — Portfolio level</L><p>Adds 3.2% to NA Property writings; mild positive diversification (manufacturing currently underweight). FL NWS accumulation moves from 88% → 92% of zone cap — flag for CAT committee.</p></div>
        </div>
      );
    case "cat-model":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>CAT Modeling Report — RMS Risk Modeler</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <thead className="bg-[#FAFAF9]"><tr>{["Peril","AAL","100yr PML","250yr PML"].map(h => <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {[["Named Wind (FL)","$148K","$6.8M","$11.2M"],["Severe Conv. Storm","$92K","$2.4M","$3.9M"],["Earthquake (IN)","$18K","$0.9M","$1.6M"],["Flood","$11K","$0.6M","$1.0M"]].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className="px-2 py-1 border border-[#E8E6E1]">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p>Run completed against RMS RiskLink v22, hazard set NA-2025-Q1. Tampa Bldg 8 drives 78% of NWS AAL.</p>
        </div>
      );
    case "accumulation":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Portfolio Accumulation Memo</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <thead className="bg-[#FAFAF9]"><tr>{["Zone","Current","With this risk","Cap","Util"].map(h => <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {[["FL Tampa NWS","$258M","$300M","$325M","92%"],["IN EQ Zone 2","$184M","$292M","$400M","73%"],["OH SCS","$412M","$533M","$750M","71%"]].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className={`px-2 py-1 border border-[#E8E6E1] ${i===4 && c==="92%"?"text-amber-700":""}`} style={i===4?{fontWeight:700}:undefined}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="text-amber-700 flex items-center gap-1"><Sparkles className="w-3 h-3"/>FL NWS at 92% — within tolerance, monitor next placement.</p>
        </div>
      );
    case "comparables":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Comparable Accounts Analysis</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <thead className="bg-[#FAFAF9]"><tr>{["Account","Class","TIV","Rate","NWS Ded"].map(h => <th key={h} className="px-2 py-1 border border-[#E8E6E1] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {[["Heartland Metalworks","332710","$240M","0.082","5%"],["Coastline Mfg Co","332710","$310M","0.094","5%"],["Tri-State Foundry","331","$268M","0.078","3%"],["Gulf Industrial","332710","$295M","0.101","5%"]].map(r => (
                <tr key={r[0]}>{r.map((c,i) => <td key={i} className="px-2 py-1 border border-[#E8E6E1]">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p>Comparable median rate: 0.088. Median NWS deductible: 5% — supports T&C suggestion.</p>
        </div>
      );
    case "pricing-indication":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>Pricing Indication</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <tbody>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9] w-1/2">Indicated Premium</td><td className="px-2 py-1">$2,508,000</td></tr>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9]">Rate (per $100 TIV)</td><td className="px-2 py-1">0.088</td></tr>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9]">Commission</td><td className="px-2 py-1">17.5%</td></tr>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9]">Target Loss Ratio</td><td className="px-2 py-1">0.54</td></tr>
              <tr><td className="px-2 py-1 bg-[#FAFAF9]">Range (low / high)</td><td className="px-2 py-1">$2.38M – $2.69M</td></tr>
            </tbody>
          </table>
          <p>AI pricing aligned to comparables median + 0.5pt CAT load for FL Tier 1 NWS exposure.</p>
        </div>
      );
    case "quote-letter":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <div className="text-center"><H>QBE NORTH AMERICA — QUOTATION LETTER</H></div>
          <div>Date: 29 Apr 2026</div>
          <div>To: Sarah Chen, Marsh & McLennan</div>
          <div>Re: {accountName} · {submissionId}</div>
          <hr className="border-[#E8E6E1]" />
          <p>We are pleased to offer a quotation for the captioned account on the following terms:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Total Limit: $285,000,000 / occurrence</li>
            <li>Inception: 07/01/2026 · 12-month policy</li>
            <li>Premium: $2,508,000 (gross, 17.5% commission)</li>
            <li>Form: Manuscript with QBE-MAN-2024-Rev3, NMA2914 (booth carve-out), LMA5390</li>
          </ul>
          <p>This quotation is valid for 30 days. Subject to review of confirmed values and final inspection.</p>
        </div>
      );
    case "manuscript":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-3">
          <H>Manuscript Policy Wording</H>
          <div><L>§3 Forms & Endorsements</L><ul className="list-disc pl-5 space-y-0.5"><li>NMA2914 — War & Civil War Exclusion (with painting-booth carve-out)</li><li>LMA5390 — Cyber Exclusion</li><li>QBE-MAN-2024-Rev3 — Standard manuscript provisions</li></ul></div>
          <div><L>§4 Sublimits</L><ul className="list-disc pl-5 space-y-0.5"><li>Named Wind: $15M / 5% ded</li><li>Earthquake: $50M (excl. CA)</li><li>Flood: $25M</li><li>Equipment Breakdown: $25M</li></ul></div>
          <div><L>§5 Exclusions</L><p>War, terrorism (TRIA-eligible), nuclear, intentional acts, wear & tear, contamination unless ensuing covered peril.</p></div>
        </div>
      );
    case "binder":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <div className="text-center"><H>BINDER OF INSURANCE</H></div>
          <div>Effective: 07/01/2026 · 12 months</div>
          <div>Insurer: QBE Insurance Corporation · Policy #: QBE-NA-CP-2026-08847</div>
          <div>Insured: {accountName} LLC</div>
          <hr className="border-[#E8E6E1]" />
          <p>Coverage bound per quote dated 29 Apr 2026 and acceptance signed 06 May 2026. Forms and endorsements as set out in manuscript wording.</p>
          <p>Total Premium: $2,508,000 · Limit: $285M / occ · AOP Ded: $100K · NWS Ded: 5%.</p>
        </div>
      );
    case "policy":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <div className="text-center"><H>BOUND POLICY — DECLARATIONS</H></div>
          <div>Policy Number: QBE-NA-CP-2026-08847</div>
          <div>Period: 07/01/2026 — 07/01/2027</div>
          <div>Named Insured: {accountName} LLC</div>
          <hr className="border-[#E8E6E1]" />
          <p>This policy consists of the Declarations, the Manuscript Policy Wording (QBE-MAN-2024-Rev3), and any endorsements attached. In witness, the Insurer has caused this policy to be signed.</p>
        </div>
      );
    case "invoice":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Premium Invoice</H>
          <table className="w-full border border-[#E8E6E1] text-[10px]">
            <tbody>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9] w-2/3">Gross Premium</td><td className="px-2 py-1 text-right">$2,508,000.00</td></tr>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9]">Commission (17.5%)</td><td className="px-2 py-1 text-right">($438,900.00)</td></tr>
              <tr className="border-b"><td className="px-2 py-1 bg-[#FAFAF9]">Surplus Lines Tax (FL portion)</td><td className="px-2 py-1 text-right">$8,234.50</td></tr>
              <tr><td className="px-2 py-1 bg-[#FAFAF9]" style={{fontWeight:700}}>Net Due</td><td className="px-2 py-1 text-right" style={{fontWeight:700}}>$2,077,334.50</td></tr>
            </tbody>
          </table>
          <p>Due 30 days from binding. Wire to QBE NA — collections.</p>
        </div>
      );
    case "decision-letter":
      return (
        <div className="text-[11px] text-[#2D2D2D] space-y-2">
          <H>Customer Decision Letter</H>
          <p>Dear Sarah,</p>
          <p>We are pleased to confirm coverage has been bound for {accountName} effective 07/01/2026 under policy QBE-NA-CP-2026-08847. Binder, declarations, and manuscript wording are attached. Premium invoice will follow under separate cover.</p>
          <p>Welcome to QBE — please reach out with any questions.</p>
          <p>Mike Farrell<br/>Senior Underwriter, QBE NA Commercial Property</p>
        </div>
      );
    default:
      return <div className="text-[11px] text-[#6B7280]">Preview not yet available.</div>;
  }
}

