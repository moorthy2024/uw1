"use client";
import { useState, useMemo } from "react";
import {
  Sparkles, MailQuestion, XCircle, FileUp, MessageSquareReply,
  CheckCircle2, X, Send, ChevronRight, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  SUBMISSION_CARDS, PROCESSING_STATUS_CONFIG,
  type SubmissionCard,
} from "./CustomerTable";
import { Checkbox } from "./ui/checkbox";

/* ───────────────────────── Bucket model ───────────────────────── */

type BucketKey = "follow-up" | "decline" | "proceed-quote" | "respond-broker" | "bind";

/** Assign each submission to exactly one bulk-processing bucket (priority order). */
function deriveBucket(c: SubmissionCard): BucketKey | null {
  if (c.industryClassification === "out-of-scope") return "decline";
  if (c.industryClassification !== "in-scope" && c.successPropensity < 25) return "decline";
  if (c.processingStatus === "follow-up-required") return "follow-up";
  if (c.processingStatus === "ready-for-ops" || c.processingStatus === "ready-for-uw" || c.processingStatus === "uw-analysis") return "proceed-quote";
  if (c.processingStatus === "uw-review") return "respond-broker";
  if (c.processingStatus === "customer-decision") return "bind";
  return null; // not-processed → still ingesting, ungrouped
}

interface BucketDef {
  key: BucketKey;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;      // text/icon accent
  tint: string;        // soft background for icon pill
  cta: string;         // tile button label verb
  sendVerb: string;    // modal send-all button verb
  toast: (n: number) => string;
  /** Bulk-request preview text for the selected submissions. */
  template: (cards: SubmissionCard[]) => string;
}

const line = (cards: SubmissionCard[], f: (c: SubmissionCard) => string) =>
  cards.map(c => `  • ${f(c)}`).join("\n") || "  (no submissions selected)";

const BUCKETS: BucketDef[] = [
  {
    key: "follow-up",
    label: "Ready to Follow Up",
    description: "Outstanding information required from broker",
    icon: MailQuestion,
    accent: "#B45309", tint: "#FEF3C7",
    cta: "Request info", sendVerb: "Send follow-ups",
    toast: n => `Information requests sent for ${n} submission${n === 1 ? "" : "s"}`,
    template: cards =>
`BULK BROKER FOLLOW-UP — Outstanding Information

The following ${cards.length} submission${cards.length === 1 ? "" : "s"} require additional information before triage can complete. An individualised request will be emailed to each broker:

${line(cards, c => `${c.account} — ${c.broker} (${c.brokerContact})\n     Needed: complete SOV, missing supporting documents · due ${c.needByDate}`)}

Each broker receives the QBE outstanding-items template referencing their submission ID.`,
  },
  {
    key: "decline",
    label: "Ready to Decline",
    description: "Outside appetite based on triage outcomes",
    icon: XCircle,
    accent: "#B91C1C", tint: "#FEE2E2",
    cta: "Decline", sendVerb: "Send declinations",
    toast: n => `Declination notices sent for ${n} submission${n === 1 ? "" : "s"}`,
    template: cards =>
`BULK DECLINATION — Outside Appetite

Triage flagged the following ${cards.length} submission${cards.length === 1 ? "" : "s"} as outside current underwriting appetite. A declination notice will be sent to each broker:

${line(cards, c => `${c.account} — ${c.broker}\n     Reason: ${c.industryClassification === "out-of-scope" ? "industry class out-of-scope" : "low success propensity / limited appetite"} · win ${c.successPropensity}%`)}

Standard QBE declination language applies; the broker is thanked for the opportunity.`,
  },
  {
    key: "proceed-quote",
    label: "Ready to Proceed to Quote",
    description: "Bulk layering request + SOV for CAT modelling",
    icon: FileUp,
    accent: "#005A8F", tint: "#E8F4FC",
    cta: "Proceed to quote", sendVerb: "Send requests",
    toast: n => `Layering request + SOV sent for ${n} submission${n === 1 ? "" : "s"}`,
    template: cards =>
`BULK QUOTE PREPARATION — Layering Request + SOV

Submitting the layering request and SOV to the CAT / rating team for the following ${cards.length} submission${cards.length === 1 ? "" : "s"}:

${line(cards, c => `${c.account} — ${c.accountIndustry} · ${c.homeOffice}\n     Action: send layering request + geocoded SOV for CAT modelling · assigned ${c.assignedUW}`)}

Each package includes the QBE layer request form and the completed SOV for CatNet processing.`,
  },
  {
    key: "respond-broker",
    label: "Ready to Respond to Broker",
    description: "Broker follow-up on quotes submitted",
    icon: MessageSquareReply,
    accent: "#00205B", tint: "#E6EBF5",
    cta: "Respond", sendVerb: "Send responses",
    toast: n => `Responses sent to brokers for ${n} submission${n === 1 ? "" : "s"}`,
    template: cards =>
`BULK BROKER RESPONSE — Quote Follow-up

Responding to broker follow-ups on the following ${cards.length} quoted submission${cards.length === 1 ? "" : "s"}:

${line(cards, c => `${c.account} — ${c.broker} (${c.brokerContact})\n     Action: confirm indicated terms, answer outstanding questions, hold quote`)}

Each broker receives an updated position on the submitted indication.`,
  },
  {
    key: "bind",
    label: "Ready to Bind",
    description: "Broker accepted — issue bind orders",
    icon: CheckCircle2,
    accent: "#047857", tint: "#D1FAE5",
    cta: "Bind", sendVerb: "Confirm binds",
    toast: n => `Bind orders confirmed for ${n} submission${n === 1 ? "" : "s"}`,
    template: cards =>
`BULK BIND — Confirm Bind Orders

The following ${cards.length} submission${cards.length === 1 ? "" : "s"} are ready to bind. A bind confirmation will be issued to each broker:

${line(cards, c => `${c.account} — ${c.broker}\n     Action: issue bind order, generate binder, trigger policy issuance`)}

Bind documentation follows within 2 business days of confirmation.`,
  },
];

/* ───────────────────────── Status pill ───────────────────────── */

function StatusPill({ status }: { status: SubmissionCard["processingStatus"] }) {
  const cfg = PROCESSING_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border flex-shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

/* ───────────────────────── Bulk review modal ───────────────────────── */

function BulkModal({ bucket, cards, onClose }: {
  bucket: BucketDef; cards: SubmissionCard[]; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(cards.map(c => c.id)));
  const Icon = bucket.icon;

  const toggle = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allSelected = selected.size === cards.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(cards.map(c => c.id)));

  const selectedCards = cards.filter(c => selected.has(c.id));
  const n = selectedCards.length;

  const send = () => {
    toast.success(bucket.toast(n));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#E8EDF5] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,32,91,0.28)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8EDF5]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bucket.tint }}>
            <Icon className="w-4 h-4" style={{ color: bucket.accent }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-[#0D1B2E]" style={{ fontWeight: 700 }}>{bucket.label}</div>
            <div className="text-[12px] text-[#6B7280]">{bucket.description}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F3F3F1]"><X className="w-5 h-5 text-[#9B9B98]" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Submission selection list */}
          <div className="px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#0076BC]" style={{ fontWeight: 700 }}>Submissions ({cards.length})</span>
              <button onClick={toggleAll} className="text-[11px] text-[#0076BC] hover:underline" style={{ fontWeight: 600 }}>
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {cards.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#E8EDF5] hover:bg-[#FAFBFD] cursor-pointer">
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-[#0D1B2E] truncate" style={{ fontWeight: 600 }}>{c.account}</div>
                    <div className="text-[11px] text-[#6B7280] truncate">{c.id} · {c.broker}</div>
                  </div>
                  <StatusPill status={c.processingStatus} />
                </label>
              ))}
            </div>
          </div>

          {/* Bulk request preview */}
          <div className="px-5 pb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#0076BC] mb-2" style={{ fontWeight: 700 }}>Bulk Request Preview</div>
            <pre className="text-[11px] text-[#4B5563] leading-relaxed whitespace-pre-wrap font-mono bg-[#F5F7FA] border border-[#E8EDF5] rounded-lg p-3">{bucket.template(selectedCards)}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#E8EDF5] bg-[#FAFBFD]">
          <span className="text-[12px] text-[#6B7280]">{n} of {cards.length} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E8EDF5] text-[12px] text-[#4B5563] hover:bg-[#F3F3F1]" style={{ fontWeight: 600 }}>Cancel</button>
            <button onClick={send} disabled={n === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-white transition-colors ${n === 0 ? "bg-[#C0CEDC] cursor-not-allowed" : "bg-[#00205B] hover:bg-[#001740]"}`}
              style={{ fontWeight: 600 }}>
              <Send className="w-3.5 h-3.5" /> {bucket.sendVerb} ({n})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Bucket tile ───────────────────────── */

function BucketTile({ bucket, count, onOpen }: { bucket: BucketDef; count: number; onOpen: () => void }) {
  const Icon = bucket.icon;
  const empty = count === 0;
  return (
    <div className="flex-1 min-w-[180px] bg-white rounded-2xl border border-[#E8EDF5] px-4 pt-4 pb-4 flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.04)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bucket.tint }}>
          <Icon className="w-4 h-4" style={{ color: bucket.accent }} />
        </div>
        <span className="text-[22px] leading-none tabular-nums" style={{ fontWeight: 800, color: empty ? "#C0CEDC" : "#0D1B2E", letterSpacing: "-0.5px" }}>{count}</span>
      </div>
      <div className="text-[13px] text-[#0D1B2E] mb-0.5" style={{ fontWeight: 700 }}>{bucket.label}</div>
      <div className="text-[11px] text-[#6B7280] leading-snug mb-3 flex-1">{bucket.description}</div>
      <button onClick={onOpen} disabled={empty}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors whitespace-nowrap w-full ${
          empty ? "bg-[#F3F5F8] text-[#B4C0CE] cursor-not-allowed" : "bg-[#00205B] text-white hover:bg-[#001740]"}`}
        style={{ fontWeight: 600 }}>
        {bucket.cta} ({count}) <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
      </button>
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export function PortfolioRecommendations({ showHeader = true }: { showHeader?: boolean }) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);

  const grouped = useMemo(() => {
    const map: Record<BucketKey, SubmissionCard[]> = {
      "follow-up": [], "decline": [], "proceed-quote": [], "respond-broker": [], "bind": [],
    };
    for (const c of SUBMISSION_CARDS) {
      const b = deriveBucket(c);
      if (b) map[b].push(c);
    }
    return map;
  }, []);

  const activeBucket = openBucket ? BUCKETS.find(b => b.key === openBucket)! : null;

  return (
    <div>
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] text-[#0D1B2E]" style={{ fontWeight: 700 }}>AI Recommendations</span>
          <span className="text-[11px] text-[#6B7280]">— portfolio-level bulk processing</span>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {BUCKETS.map(b => (
          <BucketTile key={b.key} bucket={b} count={grouped[b.key].length} onOpen={() => setOpenBucket(b.key)} />
        ))}
      </div>

      {activeBucket && (
        <BulkModal bucket={activeBucket} cards={grouped[activeBucket.key]} onClose={() => setOpenBucket(null)} />
      )}
    </div>
  );
}

