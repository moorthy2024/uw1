"use client";
import { useState, useMemo, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useDetailOpen } from "./RootLayout";
import {
  Search, ChevronDown, LayoutGrid, List,
  MapPin, Lock, AlertTriangle, UserCog,
  Inbox, Filter, SearchCheck, ClipboardCheck, Handshake,
} from "lucide-react";
const qbeLogo = "/assets/qbe-logo.png";
import {
  CustomerTable,
  SUBMISSION_CARDS,
  PROCESSING_STATUS_CONFIG,
  DATA_STATUS_CFG,
  AppetiteBucketBar,
  STAGE_ROLLUP,
  INTERACTIVE_ACCOUNTS,
  SORT_PRIORITY,
  type SubmissionCard,
  type ProcessingStatus,
} from "./CustomerTable";
import { SubmissionAnalysis, type StepInsight } from "./SubmissionAnalysis";
import { AIAgentPane } from "./AIAgentPane";
import type { ActionItem } from "./SubmissionTypes";
import { fmtTIV } from "./SubmissionHelpers";
import { PortfolioRecommendations } from "./PortfolioRecommendations";
import { useSubmissions } from "./submission-analysis/useSubmissions";

// ── Broker breakdown per stage ──────────────────────────────────
function brokersAtStatuses(statuses: ProcessingStatus[]): { broker: string; count: number }[] {
  const counts: Record<string, number> = {};
  SUBMISSION_CARDS.forEach(s => {
    if (statuses.includes(s.processingStatus as ProcessingStatus)) {
      counts[s.broker] = (counts[s.broker] ?? 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([broker, count]) => ({ broker, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Stage filter maps ───────────────────────────────────────────
const STAGE_STATUSES: Record<string, ProcessingStatus[]> = {
  ingestion: ["not-processed", "follow-up-required", "ready-for-ops"],
  triage:    ["ready-for-uw"],
  analysis:  ["uw-analysis"],
  review:    ["uw-review"],
  decision:  ["customer-decision"],
};

const SUBITEM_PREDS: Record<string, (s: SubmissionCard) => boolean> = {
  "ingestion|Received":          s => s.ingested === "complete",
  "ingestion|Data Extracted":    s => s.processed === "complete",
  "triage|Awaiting Triage":      s => s.triaged === "in-progress" || s.triaged === "pending",
  "triage|Cleared":              s => s.triaged === "complete",
  "analysis|In Analysis":        s => s.uwAnalysis === "in-progress",
  "analysis|In CAT Modelling":   s => s.modellingReady === "in-progress",
  "analysis|Modelling Returned": s => s.modellingReady === "complete",
  "analysis|In Rating":          s => s.raterGenerated === "in-progress",
  "review|Quote Ready":          s => s.quoteReady === "complete" && s.quoted !== "complete",
  "review|Quoted":               s => s.quoted === "complete",
  "review|Manuscript":           s => s.formManuscript === "in-progress" || s.formManuscript === "complete",
  "decision|Awaiting Issuance":  s => s.bind === "complete" && s.issue !== "complete",
  "decision|Issued":             s => s.issue === "complete",
};

// ── Book snapshot KPIs ──────────────────────────────────────────
// Real-time book snapshot — one tile per workflow stage, derived from actual submission records.
const snapshotKPIs = [
  { key: "ingestion", label: "INGESTION",         icon: Inbox,          total: STAGE_ROLLUP.ingestion.total, items: STAGE_ROLLUP.ingestion.items, brokers: brokersAtStatuses(["not-processed","follow-up-required","ready-for-ops"]) },
  { key: "triage",    label: "TRIAGE",            icon: Filter,         total: STAGE_ROLLUP.triage.total,    items: STAGE_ROLLUP.triage.items,    brokers: brokersAtStatuses(["ready-for-uw"]) },
  { key: "analysis",  label: "UW ANALYSIS",       icon: SearchCheck,    total: STAGE_ROLLUP.analysis.total,  items: STAGE_ROLLUP.analysis.items,  brokers: brokersAtStatuses(["uw-analysis"]) },
  { key: "review",    label: "UW REVIEW",         icon: ClipboardCheck, total: STAGE_ROLLUP.review.total,    items: STAGE_ROLLUP.review.items,    brokers: brokersAtStatuses(["uw-review"]) },
  { key: "decision",  label: "CUSTOMER DECISION", icon: Handshake,      total: STAGE_ROLLUP.decision.total,  items: STAGE_ROLLUP.decision.items,  brokers: brokersAtStatuses(["customer-decision"]) },
];

// ── Pipeline Strip ──────────────────────────────────────────────
function PipelineStrip({
  activeStage, activeSubItem, onStageClick, onSubItemClick,
}: {
  activeStage: string | null;
  activeSubItem: string | null;
  onStageClick: (key: string) => void;
  onSubItemClick: (stageKey: string, label: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex gap-3" style={{ marginBottom: "12px" }}>
        {snapshotKPIs.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.key;
          return (
            <div
              key={stage.key}
              className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 cursor-pointer transition-all"
              style={{
                backgroundColor: isActive ? "#EEF6FF" : "white",
                borderColor: isActive ? "#0076BC" : "#E8EFF8",
                boxShadow: isActive ? "0 0 0 1px #0076BC22" : undefined,
              }}
              onClick={() => onStageClick(stage.key)}
            >
              {/* Stage header */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? "#0076BC" : "#0076BC" }} />
                <span className="text-[10px] tracking-widest uppercase flex-1 min-w-0 leading-tight" style={{ color: "#0076BC", fontWeight: isActive ? 800 : 700 }}>
                  {stage.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
                )}
              </div>
              {/* Sub-items */}
              <div className="flex flex-col gap-1.5">
                {stage.items.map(item => {
                  const isSubActive = isActive && activeSubItem === item.label;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2 rounded-md px-1 -mx-1 cursor-pointer transition-colors"
                      style={{ backgroundColor: isSubActive ? "#DBEAFE" : undefined }}
                      onClick={e => { e.stopPropagation(); onSubItemClick(stage.key, item.label); }}
                      onMouseEnter={e => { if (!isSubActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#F0F8FF"; }}
                      onMouseLeave={e => { if (!isSubActive) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                    >
                      <span className="text-[11px] truncate" style={{
                        color: isSubActive ? "#0076BC" : item.count > 0 ? "#374151" : "#C0CEDC",
                        fontWeight: isSubActive ? 700 : 400,
                      }}>{item.label}</span>
                      <span className="text-[12px] tabular-nums flex-shrink-0" style={{
                        color: isSubActive ? "#0076BC" : item.count > 0 ? "#0D1B2E" : "#C0CEDC",
                        fontWeight: 700,
                      }}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-b border-[#E8EFF8]" />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}


const HAZARD_INFO: Record<"A" | "B" | "C" | "D", { label: string; textColor: string; bg: string; bar: string }> = {
  A: { label: "A", textColor: "#0076BC", bg: "#EEF6FF", bar: "#4FA8D5" },
  B: { label: "B", textColor: "#15803D", bg: "#F0FDF4", bar: "#22C55E" },
  C: { label: "C", textColor: "#C2410C", bg: "#FFF7ED", bar: "#F97316" },
  D: { label: "D", textColor: "#DC2626", bg: "#FEF2F2", bar: "#EF4444" },
};
function hazardInfo(grade: "A" | "B" | "C" | "D") {
  return HAZARD_INFO[grade];
}

const TYPE_CFG: Record<string, { text: string; bg: string; border: string }> = {
  "New Business": { text: "#059669", bg: "#F0FFF4", border: "#BBF7D0" },
  "Renewal":      { text: "#0076BC", bg: "#EEF6FF", border: "#C2DFF4" },
  "Remarket":     { text: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
};


const UW_COLORS: Record<string, string> = {
  "Mike Farrell":  "linear-gradient(135deg,#0076BC,#00205B)",
  "Priya Patel":   "linear-gradient(135deg,#7C3AED,#4F46E5)",
  "Jordan Lee":    "linear-gradient(135deg,#059669,#0D9488)",
  "Diego Alvarez": "linear-gradient(135deg,#D97706,#B45309)",
};
const TEAM_UWS = ["Mike Farrell", "Priya Patel", "Jordan Lee", "Diego Alvarez"];

function uwInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2);
}

// ── Success propensity ring ─────────────────────────────────────────
function WinRing({ pct }: { pct: number }) {
  const r = 14; const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  const color = pct >= 75 ? "#22C55E" : pct >= 60 ? "#0076BC" : "#F59E0B";
  return (
    <svg width="38" height="38" className="flex-shrink-0">
      <circle cx="19" cy="19" r={r} fill="none" stroke="#E0E8FF" strokeWidth="2.5" />
      <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round"
        transform="rotate(-90 19 19)" />
      <text x="19" y="19" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="#0D1B2E">
        {pct}%
      </text>
    </svg>
  );
}

// ── Grid card ───────────────────────────────────────────────────
function SubmissionGridCard({ sub, onClick, assignedUW: assignedUWProp, onReassign }: {
  sub: SubmissionCard; onClick: () => void;
  assignedUW?: string; onReassign?: (id: string, uw: string) => void;
}) {
  const statusCfg = PROCESSING_STATUS_CONFIG[sub.processingStatus];
  const typeCfg   = TYPE_CFG[sub.submissionType] ?? TYPE_CFG["New Business"];
  const hz        = hazardInfo(sub.hazardGrade);
const assignedUW = assignedUWProp ?? sub.assignedUW;
  const initials  = uwInitials(assignedUW);
  const avatarBg  = UW_COLORS[assignedUW] ?? "linear-gradient(135deg,#64748B,#334155)";
  const canReassign = assignedUW === "Mike Farrell" && !!onReassign;
  const isClickable = INTERACTIVE_ACCOUNTS.has(sub.account);
  const [uwOpen, setUwOpen] = useState(false);
  const uwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uwOpen) return;
    const handler = (e: MouseEvent) => {
      if (uwRef.current && !uwRef.current.contains(e.target as Node)) setUwOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [uwOpen]);

  if (!isClickable) {
    const ds = DATA_STATUS_CFG[sub.dataStatus];
    return (
      <div
        className="bg-[#F8FAFB] rounded-2xl border border-[#E8EEFF] flex items-center justify-between gap-3 px-4 py-3 cursor-not-allowed"
        style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.03)" }}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-[13px] font-semibold leading-snug truncate" style={{ color: "#9BA8B8" }}>{sub.account}</div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#B8C4D0" }}>
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{sub.homeOffice}</span>
          </div>
        </div>
        <span className={`text-[8px] font-bold px-2 py-1 rounded flex-shrink-0 border ${ds.bg} ${ds.color} ${ds.border}`}>{ds.label}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#E0E8FF] flex flex-col transition-all cursor-pointer hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,32,91,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "#B3D4F0"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,32,91,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "#E0E8FF"; }}
    >
      {/* ── Top section ── */}
      <div className="px-3 pt-3 pb-2">
        {/* Type + status row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
            style={{ color: typeCfg.text, backgroundColor: typeCfg.bg, borderColor: typeCfg.border }}>
            {sub.submissionType}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Account name + phase */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[13px] font-bold leading-snug flex-1 min-w-0" style={{ color: "#0D1B2E" }}>
            {sub.account}
          </div>
          {(() => {
            const ds = DATA_STATUS_CFG[sub.dataStatus];
            return (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 border ${ds.bg} ${ds.color} ${ds.border}`}>
                {ds.label}
              </span>
            );
          })()}
        </div>

        {/* Location + ID inline */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#94A3B8" }} />
          <span className="text-[11px]" style={{ color: "#94A3B8" }}>{sub.homeOffice}</span>
          <span className="text-[#CBD5E1]">·</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
            style={{ color: "#6B81A0", backgroundColor: "#F0F4FF", border: "1px solid #E0E8FF" }}>
            {sub.id}
          </span>
        </div>
      </div>

      {/* ── Middle section ── */}
      <div className="px-3 pb-1.5 border-t border-[#F0F6FF] pt-1.5 flex-1">
        {/* Fields + Bind Rate ring */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: "auto 1fr" }}>
              {[
                { label: "Brokerage", value: sub.broker },
                { label: "Broker",    value: sub.brokerContact },
              ].map(({ label, value }) => (
                <Fragment key={label}>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: "#94A3B8" }}>{label}</span>
                  <span className="text-[10px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{value}</span>
                </Fragment>
              ))}
              {/* Occupancy — top 3 from SOV */}
              <span className="text-[10px] whitespace-nowrap self-start pt-0.5" style={{ color: "#94A3B8" }}>Occupancy</span>
              <div className="flex flex-col gap-0.5">
                {sub.occupancyByTIV.slice(0, 3).map(slice => (
                  <div key={slice.name} className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{slice.name}</span>
                    <span className="text-[9px] tabular-nums flex-shrink-0" style={{ color: "#94A3B8" }}>{slice.pct}%</span>
                  </div>
                ))}
              </div>
              {/* TIV */}
              <span className="text-[10px] whitespace-nowrap" style={{ color: "#94A3B8" }}>TIV</span>
              <span className="text-[10px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{fmtTIV(sub.totalTIVm)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <WinRing pct={sub.brokerBoundRate} />
            <span className="text-[8px] uppercase tracking-wide text-center" style={{ color: "#94A3B8", fontWeight: 700 }}>Bind Rate</span>
          </div>
        </div>

        {/* Sprinkler */}
        <div className="mb-3 mt-3">
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: "#94A3B8", fontWeight: 700 }}>Sprinkler</div>
          <div className="flex h-1.5 rounded-full overflow-hidden w-full mb-1">
            <div style={{ width: `${sub.sprinkleredPct}%`, backgroundColor: "#0076BC" }} />
            <div style={{ width: `${100 - sub.sprinkleredPct}%`, backgroundColor: "#E0E8FF" }} />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="flex items-center gap-0.5" style={{ color: "#94A3B8" }}>
              <span className="w-1.5 h-1.5 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
              Sprinklered <span style={{ color: "#1E3A5F", fontWeight: 600, marginLeft: 2 }}>{sub.sprinkleredPct}%</span>
            </span>
            <span className="flex items-center gap-0.5" style={{ color: "#94A3B8" }}>
              <span className="w-1.5 h-1.5 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#E0E8FF", border: "1px solid #CBD5E1" }} />
              Not Sprinklered <span style={{ color: "#1E3A5F", fontWeight: 600, marginLeft: 2 }}>{100 - sub.sprinkleredPct}%</span>
            </span>
          </div>
        </div>

        {/* Occupancy % TIV */}
        <div className="mb-3 mt-3">
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: "#94A3B8", fontWeight: 700 }}>Occupancy % TIV</div>
          <AppetiteBucketBar slices={sub.occupancyAppetite} inline />
        </div>

        {/* 5-Yr Paid Claims */}
        <div>
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: "#94A3B8", fontWeight: 700 }}>5-Yr Paid Claims</div>
          <div className="text-[16px] font-extrabold tabular-nums leading-none" style={{ color: "#00205B" }}>{sub.paidClaims5yr}</div>
          <div className="text-[8px] mt-0.5" style={{ color: "#94A3B8" }}>5-year claims history</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-2 border-t border-[#F0F6FF] flex items-center gap-2">
        {/* UW avatar + reassign dropdown */}
        <div className="relative flex-shrink-0" ref={uwRef}>
          <button
            onClick={e => { e.stopPropagation(); if (canReassign) setUwOpen(o => !o); }}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors ${canReassign ? "hover:bg-[#F0F6FF] cursor-pointer" : "cursor-default"}`}
            title={canReassign ? "Click to reassign" : `Locked — ${assignedUW}`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
              style={{ background: avatarBg }}>
              {initials}
            </div>
            <span className="text-[11px] font-medium" style={{ color: "#4A6080" }}>
              {assignedUW.split(" ")[0]}
            </span>
            {canReassign
              ? <ChevronDown className="w-3 h-3" style={{ color: "#94A3B8" }} />
              : <Lock className="w-3 h-3" style={{ color: "#C0CEDC" }} />}
          </button>
          {uwOpen && canReassign && (
            <div className="absolute bottom-full left-0 mb-1 z-30 w-44 bg-white border border-[#E0E8FF] rounded-lg shadow-lg py-1"
              onClick={e => e.stopPropagation()}>
              <div className="px-3 py-1.5 text-[10px] text-[#94A3B8] uppercase tracking-wider" style={{ fontWeight: 700 }}>Re-assign to</div>
              {TEAM_UWS.filter(u => u !== assignedUW).map(u => (
                <button key={u} onClick={() => { onReassign!(sub.id, u); setUwOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-[#F8FBFF]" style={{ color: "#1E3A5F" }}>
                  <UserCog className="w-3.5 h-3.5" style={{ color: "#0076BC" }} />
                  <span>{u}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-end gap-0.5">
          <span className="text-[9px] whitespace-nowrap" style={{ color: "#94A3B8" }}>Inception <span style={{ color: "#1E3A5F", fontWeight: 500 }}>{fmtDate(sub.inceptionDate)}</span></span>
          <span className="text-[9px] whitespace-nowrap" style={{ color: "#94A3B8" }}>Received <span style={{ color: "#1E3A5F", fontWeight: 500 }}>{fmtDate(sub.receivedDate)}</span></span>
        </div>
      </div>
    </div>
  );
}

// ── Dropdown ────────────────────────────────────────────────────
function Dropdown({ label, value, options, items, onChange }: {
  label: string; value: string; options?: string[];
  items?: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[12px] font-medium border border-[#E0E8FF] bg-white outline-none transition-colors cursor-pointer"
        style={{ color: value === "" ? "#94A3B8" : "#0D1B2E" }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0076BC"; }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E0E8FF"; }}
      >
        <option value="">{label}</option>
        {items
          ? items.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
          : (options ?? []).map(o => <option key={o} value={o}>{o}</option>)
        }
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#94A3B8" }} />
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export function SubmissionsPanel() {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const returnToRef = useRef<string | null>(null);

  // Signal Root to collapse sidebar when detail is open
  useDetailOpen(!!selectedId);
  useEffect(() => {
    const handler = () => setSelectedId(null);
    window.addEventListener("closeDetailView", handler);
    return () => window.removeEventListener("closeDetailView", handler);
  }, []);

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [activeTab, setActiveTab] = useState<"all" | "new-business" | "renewals">("all");
  const [searchQ, setSearchQ] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<{ stageKey: string; subItem: string | null } | null>(null);
  const [uwFilter, setUwFilter] = useState<"all" | "mine">("all");
  const [stepInsight, setStepInsight] = useState<StepInsight | null>(null);
  const [stepActions, setStepActions] = useState<ActionItem[]>([]);
  const [gridAssignments, setGridAssignments] = useState<Record<string, string>>({});
  const handleGridReassign = (id: string, uw: string) => setGridAssignments(p => ({ ...p, [id]: uw }));
  const [gridPage, setGridPage] = useState(1);
  const gridPerPage = 9;

  const handleSelectSubmission = (id: string) => {
    setStepInsight(null);
    setStepActions([]);
    setSelectedId(id);
  };

  // Real submissions from API only
  const { cards: apiCards } = useSubmissions();
  const mergedCards = useMemo<SubmissionCard[]>(() => {
    console.log("[SubmissionsPanel] API cards:", apiCards.length);
    return apiCards;
  }, [apiCards]);

  const accounts = useMemo(() => [...new Set(mergedCards.map(s => s.account))].sort(), [mergedCards]);
  const brokers  = useMemo(() => [...new Set(mergedCards.map(s => s.broker))].sort(),  [mergedCards]);
  const statuses = useMemo(() => [...new Set(mergedCards.map(s => s.processingStatus))], [mergedCards]);

  const filtered = useMemo(() => {
    let list = [...mergedCards];
    if (activeTab === "new-business") list = list.filter(s => s.dataStatus === "Ready" && s.submissionType === "New Business");
    if (activeTab === "renewals")     list = list.filter(s => s.dataStatus === "Ready" && s.submissionType === "Renewal");
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(s =>
        s.account.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.broker.toLowerCase().includes(q) ||
        s.homeOffice.toLowerCase().includes(q)
      );
    }
    if (accountFilter) list = list.filter(s => s.account === accountFilter);
    if (brokerFilter) list = list.filter(s => s.broker === brokerFilter);
    if (statusFilter) list = list.filter(s => s.processingStatus === statusFilter as ProcessingStatus);
    if (stageFilter) {
      const statuses = STAGE_STATUSES[stageFilter.stageKey];
      list = list.filter(s => statuses.includes(s.processingStatus));
      if (stageFilter.subItem) {
        const pred = SUBITEM_PREDS[`${stageFilter.stageKey}|${stageFilter.subItem}`];
        if (pred) list = list.filter(pred);
      }
    }
    if (uwFilter === "mine") list = list.filter(s => s.assignedUW === "Mike Farrell");
    return list.sort((a, b) => {
      // Pin interactive accounts to the top (Pacific Coast first)
      const pa = SORT_PRIORITY[a.account] ?? 99;
      const pb = SORT_PRIORITY[b.account] ?? 99;
      if (pa !== pb) return pa - pb;
      const aReady = a.dataStatus === "Ready", bReady = b.dataStatus === "Ready";
      if (!aReady && bReady) return 1;
      if (aReady && !bReady) return -1;
      if (!aReady && !bReady) return 0;
      return new Date(a.needByDate).getTime() - new Date(b.needByDate).getTime();
    });
  }, [activeTab, searchQ, accountFilter, brokerFilter, statusFilter, stageFilter, uwFilter]);

  // Reset grid page whenever filters change
  useEffect(() => { setGridPage(1); }, [activeTab, searchQ, accountFilter, brokerFilter, statusFilter, uwFilter, stageFilter]);

  const mineCount = SUBMISSION_CARDS.filter(s => s.assignedUW === "Mike Farrell").length;

  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "new-business" as const, label: "New Business" },
    { key: "renewals" as const, label: "Renewals" },
  ];

  const handleClose = () => {
    setSelectedId(null);
    setStepInsight(null);
    setStepActions([]);
    if (returnToRef.current === "hub") {
      returnToRef.current = null;
      router.push("/");
    }
  };

  // ── Full-width detail view with floating AI chat ──────────────
  if (selectedId) {
    return (
      <div className="h-full overflow-y-auto" style={{ backgroundColor: "#F9FAFB" }}>
        <SubmissionAnalysis
          submissionId={selectedId}
          onInsightChange={setStepInsight}
          onActionsChange={setStepActions}
          onClose={handleClose}
        />
        <AIAgentPane insight={stepInsight} stepActions={stepActions} />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#F9FAFB" }}>

      {/* ── Filters + tabs ── */}
      <div className="px-6 pt-4 pb-0 bg-white border-b border-[#E0E8FF] flex-shrink-0">
        {/* Page title */}
        <div className="mb-3">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#0D1B2E" }}>Customer Processing</span>
        </div>
        {/* Pipeline cards */}
        <PipelineStrip
          activeStage={stageFilter?.stageKey ?? null}
          activeSubItem={stageFilter?.subItem ?? null}
          onStageClick={key => {
            setStageFilter(prev => prev?.stageKey === key && !prev.subItem ? null : { stageKey: key, subItem: null });
            setStatusFilter("");
          }}
          onSubItemClick={(key, label) => {
            setStageFilter(prev => prev?.stageKey === key && prev.subItem === label ? null : { stageKey: key, subItem: label });
            setStatusFilter("");
          }}
        />
        {/* Search + filter row */}
        <div className="flex items-center gap-3 mb-4 mt-3">
          {/* Search */}
          <div className="relative flex-[20]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search accounts, IDs, brokers..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] border border-[#E0E8FF] bg-white outline-none transition-colors"
              style={{ color: "#0D1B2E" }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0076BC"; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E0E8FF"; }}
            />
          </div>

          {/* Account dropdown */}
          <Dropdown
            label="All Accounts"
            value={accountFilter}
            options={accounts}
            onChange={setAccountFilter}
          />

          {/* Broker dropdown */}
          <Dropdown
            label="All Brokers"
            value={brokerFilter}
            options={brokers}
            onChange={setBrokerFilter}
          />

          {/* Status dropdown */}
          <Dropdown
            label="All Statuses"
            value={statusFilter}
            items={statuses.map(s => ({ value: s, label: PROCESSING_STATUS_CONFIG[s as keyof typeof PROCESSING_STATUS_CONFIG]?.label ?? s }))}
            onChange={v => { setStatusFilter(v); setStageFilter(null); }}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* UW toggle + view toggle (combined right cluster) */}
          <div className="flex items-center rounded-xl border border-[#E0E8FF] overflow-hidden">
            <button
              onClick={() => setUwFilter("all")}
              className="px-4 py-2 text-[12px] font-semibold transition-colors"
              style={uwFilter === "all"
                ? { backgroundColor: "#00205B", color: "white" }
                : { backgroundColor: "white", color: "#4A6080" }}
            >
              All UWs ({SUBMISSION_CARDS.length})
            </button>
            <button
              onClick={() => setUwFilter("mine")}
              className="px-4 py-2 text-[12px] font-semibold transition-colors border-l border-[#E0E8FF]"
              style={uwFilter === "mine"
                ? { backgroundColor: "#00205B", color: "white" }
                : { backgroundColor: "white", color: "#4A6080" }}
            >
              Mine ({mineCount})
            </button>
            {/* Divider */}
            <div className="w-px self-stretch bg-[#E0E8FF]" />
            {/* Grid/Table toggle embedded */}
            <button
              onClick={() => setViewMode("grid")}
              className="w-9 h-9 flex items-center justify-center transition-colors border-l border-[#E0E8FF]"
              style={viewMode === "grid"
                ? { backgroundColor: "#00205B", color: "white" }
                : { backgroundColor: "white", color: "#94A3B8" }}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="w-9 h-9 flex items-center justify-center transition-colors border-l border-[#E0E8FF]"
              style={viewMode === "table"
                ? { backgroundColor: "#00205B", color: "white" }
                : { backgroundColor: "white", color: "#94A3B8" }}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex items-center">
          <div className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-[13px] border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#00205B] text-[#0D1B2E]"
                    : "border-transparent text-[#94A3B8] hover:text-[#4A6080]"
                }`}
                style={{ fontWeight: activeTab === tab.key ? 700 : 450 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1">
        {viewMode === "grid" ? (
          <div className="p-6">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-3" style={{ color: "#C0CEDC" }} />
                <div className="text-[14px] font-semibold mb-1" style={{ color: "#4A6080" }}>No submissions match your filters</div>
                <div className="text-[13px]" style={{ color: "#94A3B8" }}>Try adjusting the search or filter criteria.</div>
              </div>
            ) : (() => {
              const gridTotalPages = Math.max(1, Math.ceil(filtered.length / gridPerPage));
              const pagedGrid = filtered.slice((gridPage - 1) * gridPerPage, gridPage * gridPerPage);
              const from = filtered.length === 0 ? 0 : (gridPage - 1) * gridPerPage + 1;
              const to = Math.min(gridPage * gridPerPage, filtered.length);
              return (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {pagedGrid.map(sub => (
                      <SubmissionGridCard
                        key={sub.id}
                        sub={sub}
                        onClick={() => handleSelectSubmission(sub.id)}
                        assignedUW={gridAssignments[sub.id] ?? sub.assignedUW}
                        onReassign={handleGridReassign}
                      />
                    ))}
                  </div>
                  <div className={`mt-5 ${gridTotalPages > 1 ? "grid grid-cols-3 items-center" : ""}`}>
                    <span className="text-[12px]" style={{ color: "#94A3B8" }}>
                      Showing {from} to {to} of {filtered.length} submissions
                    </span>
                    {gridTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setGridPage(p => Math.max(1, p - 1))}
                          disabled={gridPage === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E8FF] bg-white text-[12px] font-semibold hover:bg-[#F0F4FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: "#94A3B8" }}
                        >&#8249;</button>
                        {Array.from({ length: gridTotalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => setGridPage(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-colors"
                            style={p === gridPage
                              ? { backgroundColor: "#00205B", color: "white" }
                              : { backgroundColor: "white", color: "#94A3B8", border: "1px solid #E0E8FF" }}
                          >{p}</button>
                        ))}
                        <button
                          onClick={() => setGridPage(p => Math.min(gridTotalPages, p + 1))}
                          disabled={gridPage === gridTotalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E8FF] bg-white text-[12px] font-semibold hover:bg-[#F0F4FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: "#94A3B8" }}
                        >&#8250;</button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <CustomerTable
            onSubmissionSelect={handleSelectSubmission}
            selectedId={null}
            filterType={activeTab === "new-business" ? "new-business" : activeTab === "renewals" ? "renewals" : "all"}
            hideControls
            externalSearch={searchQ}
            externalAccount={accountFilter || "all"}
            externalBroker={brokerFilter || "all"}
            externalStatus={statusFilter || "all"}
            externalUwView={uwFilter}
            externalStageStatuses={stageFilter ? STAGE_STATUSES[stageFilter.stageKey] : undefined}
            externalSubItemKey={stageFilter?.subItem ? `${stageFilter.stageKey}|${stageFilter.subItem}` : undefined}
            apiSubmissions={apiCards}
          />
        )}
      </div>

    </div>
  );
}

