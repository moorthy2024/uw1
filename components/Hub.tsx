"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { SubmissionAnalysis } from "./SubmissionAnalysis";
import { useDetailOpen } from "./RootLayout";
import { createPortal } from "react-dom";
import {
  Sparkles, CheckCircle2, TrendingUp,
  Hash, BarChart2, ChevronRight, ChevronLeft,
  Paperclip, AlertTriangle, X,
  Search, Download, UserCheck, Mail,
  RefreshCw, Link2, FilePlus2, MessageSquare, Building2,
  ChevronDown, ShieldCheck, ShieldAlert, RotateCcw,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PROCESSING_STATUS_CONFIG, type ProcessingStatus } from "./CustomerTable";
import { TileRecommendedActions } from "./hub/TileRecommendedActions";
import { TilePortfolioPerformance } from "./hub/TilePortfolioPerformance";
import { TileDistributionPerformance } from "./hub/TileDistributionPerformance";
import { TileInbox } from "./hub/TileInbox";
import { TilePrioritySubmissions } from "./hub/TilePrioritySubmissions";

// ── Email Category System ────────────────────────────────────────
type EmailCategory = "new-business" | "renewal" | "follow-up" | "internal" | "broker-response" | "unclassified";

interface EmailCategoryConfig {
  label: string;
  bg: string; text: string; border: string; dot: string;
  icon: React.ElementType;
  agentLabel: string;
  agentDesc: string;
  agentBg: string; agentBorder: string; agentText: string;
}

const EMAIL_CATEGORY_CONFIG: Record<EmailCategory, EmailCategoryConfig> = {
  "new-business": {
    label: "New Business",
    bg: "bg-[#EEF6FF]", text: "text-[#0076BC]", border: "border-[#C2DFF4]", dot: "#0076BC",
    icon: FilePlus2,
    agentLabel: "AI Classification — New Business",
    agentDesc: "ACORD 140 form and supporting documents detected. Email identified as a new commercial property submission with no prior relationship in the system.",
    agentBg: "#EFF6FF", agentBorder: "#BFDBFE", agentText: "#1D4ED8",
  },
  "renewal": {
    label: "Renewal",
    bg: "bg-[#DCFCE7]", text: "text-[#15803D]", border: "border-[#BBF7D0]", dot: "#22C55E",
    icon: RefreshCw,
    agentLabel: "AI Classification — Renewal",
    agentDesc: "Existing account detected in system. Submission references prior policy period with updated SOV and loss history. Renewal workflow triggered automatically.",
    agentBg: "#F0FDF4", agentBorder: "#BBF7D0", agentText: "#15803D",
  },
  "follow-up": {
    label: "Follow-up",
    bg: "bg-[#FEF3C7]", text: "text-[#B45309]", border: "border-[#FDE68A]", dot: "#F59E0B",
    icon: MessageSquare,
    agentLabel: "AI Classification — Follow-up",
    agentDesc: "Email contains corrected or supplemental documents referencing an open submission. Classified as a follow-up to an outstanding information request.",
    agentBg: "#FFFBEB", agentBorder: "#FDE68A", agentText: "#B45309",
  },
  "internal": {
    label: "Internal",
    bg: "bg-[#EDE9FE]", text: "text-[#5B21B6]", border: "border-[#DDD6FE]", dot: "#7C3AED",
    icon: Building2,
    agentLabel: "AI Classification — Internal Communication",
    agentDesc: "Sender domain matches QBE internal network. Message identified as internal workflow communication, not a broker submission or external inquiry.",
    agentBg: "#F5F3FF", agentBorder: "#DDD6FE", agentText: "#5B21B6",
  },
  "broker-response": {
    label: "Broker Response",
    bg: "bg-[#F0F9FF]", text: "text-[#0369A1]", border: "border-[#BAE6FD]", dot: "#0284C7",
    icon: MessageSquare,
    agentLabel: "AI Classification — Broker Response",
    agentDesc: "Broker reply on an existing quoted submission. No new insured data extracted. Email relates to terms negotiation or outstanding questions on a prior indication.",
    agentBg: "#F0F9FF", agentBorder: "#BAE6FD", agentText: "#0369A1",
  },
  "unclassified": {
    label: "Non Submission",
    bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", border: "border-[#E5E7EB]", dot: "#9CA3AF",
    icon: AlertTriangle,
    agentLabel: "AI Classification — Non Submission",
    agentDesc: "Unable to determine email category with sufficient confidence. Manual review and classification required before routing.",
    agentBg: "#F9FAFB", agentBorder: "#E5E7EB", agentText: "#6B7280",
  },
};

// Mock accounts for submission linking search
const MOCK_ACCOUNTS = [
  { id: "SUB-2026-1103", account: "Heartland Industrial Holdings LLC", broker: "Aon", status: "uw-review" as ProcessingStatus,
    submissions: ["SUB-2026-1103"] },
  { id: "SUB-2026-1214", account: "Pinnacle Global Industries plc", broker: "Willis", status: "uw-review" as ProcessingStatus,
    submissions: ["SUB-2026-1214"] },
  { id: "SUB-2026-0845", account: "Atlantic Distribution Ltd", broker: "Willis Towers Watson", status: "ready-for-uw" as ProcessingStatus,
    submissions: ["SUB-2026-0845", "SUB-2026-0829"] },
  { id: "SUB-2026-0843", account: "Pacific Coast Hotels Group", broker: "Lockton Companies", status: "uw-review" as ProcessingStatus,
    submissions: ["SUB-2026-0843"] },
  { id: "SUB-2026-0851", account: "Metro Logistics Inc", broker: "Aon", status: "follow-up-required" as ProcessingStatus,
    submissions: ["SUB-2026-0851", "SUB-2026-0840"] },
];

// ── UW Team ─────────────────────────────────────────────────────
const UW_TEAM = ["Ashley Rodriguez", "Mike Farrell", "James Liu", "Sarah Kim"];

// ── AI Action Items ────────────────────────────────────────────
interface AIItem {
  id: string;
  subject: string;
  preview: string;
  submission?: string;
  processingStatus?: ProcessingStatus;
  time: string;
  flag?: "urgent" | "sla" | "overdue";
  unread?: boolean;
  to: string;
  cta: string;
}

// ── Inbox Email Items ──────────────────────────────────────────
interface Attachment {
  name: string;
  size: string;
  type: "pdf" | "xlsx" | "docx" | "csv";
}

interface InboxEmail {
  id: string;
  from: string;
  fromEmail: string;
  company: string;
  subject: string;
  body: string;
  time: string;
  date: string;
  unread?: boolean;
  flag?: "urgent" | "overdue" | "info" | "sla";
  submission?: string;
  submissionName?: string;
  submissionLink?: string;
  attachments: Attachment[];
  assignedUW: string;
  emailCategory: EmailCategory;
  aiConfidence: number;
  verified?: boolean;
}

const aiItems: AIItem[] = [
  {
    id: "ai-1",
    subject: "Heartland Industrial Holdings — UW review required before SLA deadline",
    preview: "Quote review is ready. SLA deadline is today — highest priority in your queue.",
    submission: "SUB-2026-1103",
    processingStatus: "uw-review",
    time: "Now",
    flag: "urgent",
    unread: true,
    to: "/submission/SUB-2026-1103",
    cta: "Review Quote",
  },
  {
    id: "ai-3",
    subject: "Pinnacle Global Industries — indication pending broker response",
    preview: "UW review complete. Broker is awaiting your indication before binding decision.",
    submission: "SUB-2026-1214",
    processingStatus: "uw-review",
    time: "22m ago",
    flag: "sla",
    unread: true,
    to: "/submission/SUB-2026-1214",
    cta: "Send Indication",
  },
];

const inboxEmails: InboxEmail[] = [
  {
    id: "gm-1",
    from: "Sarah Mitchell",
    fromEmail: "sarah.mitchell@marsh.com",
    company: "Marsh & McLennan",
    subject: "Westfield Manufacturing — updated SOV + engineering report",
    body: `Hi Mike,

Please find attached the updated Statement of Values for Westfield Manufacturing, along with the 2025 Engineering Walkthrough Report for the Tampa facility.

Key updates in this revision:
• Building 11 (Tampa) — revised TIV from $38M to $45M following 2025 expansion
• Protection class updated to PC 5 for Tampa location
• Engineering report includes updated roof age and condition survey

Could you please confirm receipt and advise on timing for the CAT modelling submission? Our client is eager for an indication before their board meeting on April 18th.

Best regards,
Sarah Mitchell
Senior Broker, Marsh & McLennan
+1 (212) 345-6789`,
    time: "14m ago",
    date: "2026-04-10",
    unread: true,
    flag: "urgent",
    submission: "SUB-2026-0847",
    submissionName: "Westfield Manufacturing Corp",
    submissionLink: "/submission/SUB-2026-0847",
    attachments: [
      { name: "Westfield_SOV_Rev3_Apr2026.xlsx", size: "2.4 MB", type: "xlsx" },
      { name: "Tampa_Engineering_Report_2025.pdf", size: "8.1 MB", type: "pdf" },
      { name: "Westfield_COPE_Summary.docx", size: "420 KB", type: "docx" },
    ],
    assignedUW: "Ashley Rodriguez",
    emailCategory: "broker-response",
    aiConfidence: 91,
    verified: true,
  },
  {
    id: "gm-2",
    from: "distribution@qbe.com",
    fromEmail: "distribution@qbe.com",
    company: "QBE Ingestion Queue",
    subject: "New submission — Atlantic Distribution renewal",
    body: `This is an automated notification from the QBE Submission Ingestion system.

A new submission has been routed to your queue:

Insured: Atlantic Distribution Ltd
Broker: Willis Towers Watson (WTW)
TIV: $89,000,000
Inception Date: 15 May 2026
Submission Type: Renewal
LOB: Commercial Property — CP

Attachments include the completed ACORD 140 form, current SOV, and last 5-year loss history.

Please triage within 5 business days per SLA guidelines.`,
    time: "1h ago",
    date: "2026-04-10",
    unread: true,
    submission: "SUB-2026-0845",
    submissionName: "Atlantic Distribution Ltd",
    submissionLink: "/submission/SUB-2026-0845",
    attachments: [
      { name: "Atlantic_ACORD_140.pdf", size: "1.2 MB", type: "pdf" },
      { name: "Atlantic_SOV_2026.xlsx", size: "3.6 MB", type: "xlsx" },
      { name: "Atlantic_Loss_History_5yr.pdf", size: "890 KB", type: "pdf" },
    ],
    assignedUW: "Mike Farrell",
    emailCategory: "renewal",
    aiConfidence: 98,
    verified: true,
  },
  {
    id: "pm-2",
    from: "Michael Torres",
    fromEmail: "michael.torres@wtw.com",
    company: "Willis Towers Watson",
    subject: "Atlantic Distribution — loss run clarification",
    body: `Hi Mike,

Following up on the loss run documents we sent last week. Please find attached the corrected 2022 loss run — there was an error in the original that understated a fire claim by approximately $240K.

The corrected figures are:
2022: Total losses $1.24M (prev. reported $1.00M)
Largest single event: Warehouse fire at Birmingham facility, Jan 2022

All other years (2020, 2021, 2023, 2024) are unchanged.

Could you please confirm receipt before triage? Happy to jump on a call if helpful.

Thanks,
Michael Torres
Associate Broker, WTW Commercial Lines`,
    time: "01 Apr",
    date: "2026-04-01",
    unread: true,
    flag: "overdue",
    submission: "SUB-2026-0845",
    submissionName: "Atlantic Distribution Ltd",
    submissionLink: "/submission/SUB-2026-0845",
    attachments: [
      { name: "Atlantic_Loss_Run_2022_CORRECTED.pdf", size: "540 KB", type: "pdf" },
    ],
    assignedUW: "Mike Farrell",
    emailCategory: "follow-up",
    aiConfidence: 87,
  },
  {
    id: "gm-3",
    from: "David Park",
    fromEmail: "david.park@lockton.com",
    company: "Lockton Companies",
    subject: "Re: Pacific Coast Hotels — NWS deductible question",
    body: `Hi Mike,

Thanks for the indication on Pacific Coast Hotels. Our client has reviewed the terms and overall they look strong, but they're pushing back on the $2M NWS deductible — requesting $1.5M given their historical loss performance and property upgrades across all seven hotels in the last 18 months.

Can we discuss whether a $1.5M compromise is feasible? The client is otherwise ready to bind. Their decision timeline is end of next week.

Please let me know your availability for a 20-minute call.

Best,
David Park
Vice President, Lockton Companies
Direct: +1 (415) 888-2200`,
    time: "24 Mar",
    date: "2026-03-24",
    flag: "info",
    submission: "SUB-2026-0843",
    submissionName: "Pacific Coast Hotels Group",
    submissionLink: "/submission/SUB-2026-0843",
    attachments: [],
    assignedUW: "James Liu",
    emailCategory: "unclassified",
    aiConfidence: 42,
  },
];

// ── Mine submissions (Mike Farrell) — priority-ordered to mirror Customer dashboard ──
const mineSubmissions = [
  { account: "Pacific Coast Hotels & Resorts",    id: "SUB-2026-0843", status: "uw-analysis"  as ProcessingStatus },
  { account: "Heartland Industrial Holdings LLC", id: "SUB-2026-1103", status: "uw-review"    as ProcessingStatus },
  { account: "Pinnacle Global Industries plc",    id: "SUB-2026-1214", status: "uw-review"    as ProcessingStatus },
  { account: "Westfield Manufacturing Corp",      id: "SUB-2026-0847", status: "uw-analysis"  as ProcessingStatus },
  { account: "Atlantic Distribution Centers",     id: "SUB-2026-0845", status: "uw-analysis"  as ProcessingStatus },
  { account: "TechCorp Solutions Inc",            id: "SUB-2026-0850", status: "ready-for-uw" as ProcessingStatus },
];

const MINE_STATUS_DOT: Record<string, string> = {
  "uw-analysis":  "#0076BC",
  "uw-review":    "#8B5CF6",
  "ready-for-uw": "#10B981",
};

const MINE_STATUS_LABEL: Record<string, string> = {
  "uw-analysis":  "UW Analysis",
  "uw-review":    "UW Review",
  "ready-for-uw": "Ready for UW",
};

// ── KPI data ────────────────────────────────────────────────────
const kpis = [
  {
    label: "GWP", segment: "Renewal", value: "$11.8M", icon: TrendingUp,
    planPct: 103, planLabel: "vs plan of $11.5M", planBar: "103% of plan",
    delta: "+3%", deltaUp: true,
    spark: [9.1, 9.8, 10.3, 10.9, 11.2, 11.5, 11.8],
  },
  {
    label: "Avg Sub Quote", segment: "Renewal", value: "$112K", icon: Hash,
    planPct: 107, planLabel: "vs plan of $105K", planBar: "107% of plan",
    delta: "+7%", deltaUp: true,
    spark: [98, 101, 104, 106, 109, 111, 112],
  },
  {
    label: "Avg Sub Bound", segment: "Renewal", value: "$118K", icon: CheckCircle2,
    planPct: 112, planLabel: "vs plan of $105K", planBar: "112% of plan",
    delta: "+12%", deltaUp: true,
    spark: [101, 104, 108, 111, 114, 116, 118],
  },
  {
    label: "GWP", segment: "NB", value: "$4.2M", icon: TrendingUp,
    planPct: 108, planLabel: "vs plan of $3.9M", planBar: "108% of plan",
    delta: "+8%", deltaUp: true,
    spark: [2.1, 2.6, 3.0, 3.4, 3.7, 4.0, 4.2],
  },
  {
    label: "Avg Sub Quote", segment: "NB", value: "$68K", icon: Hash,
    planPct: 95, planLabel: "vs plan of $72K", planBar: "95% of plan",
    delta: "-5%", deltaUp: false,
    spark: [74, 72, 71, 70, 69, 68, 68],
  },
  {
    label: "Avg Sub Bound", segment: "NB", value: "$71K", icon: CheckCircle2,
    planPct: 99, planLabel: "vs plan of $72K", planBar: "99% of plan",
    delta: "-1%", deltaUp: false,
    spark: [75, 74, 73, 73, 72, 71, 71],
  },
];

const distMixNB = [
  { label: "AON",          pct: 28 },
  { label: "Marsh",        pct: 22 },
  { label: "Amwins",       pct: 18 },
  { label: "CRC",          pct: 14 },
  { label: "Ryan Specialty",pct: 10 },
  { label: "RPS",          pct: 5  },
  { label: "Willis",       pct: 3  },
];

const distMixRn = [
  { label: "AON",          pct: 34 },
  { label: "Marsh",        pct: 27 },
  { label: "Amwins",       pct: 19 },
  { label: "CRC",          pct: 10 },
  { label: "Ryan Specialty",pct: 6  },
  { label: "RPS",          pct: 3  },
  { label: "Willis",       pct: 1  },
];

const hazardMix = [
  { label: "A", desc: "Lowest hazard, highly desirable",              pct: 28, color: "#C8DCF0" },
  { label: "B", desc: "Favorable, generally in appetite",             pct: 26, color: "#4FA8D5" },
  { label: "C", desc: "Moderate, requires more scrutiny",             pct: 22, color: "#0076BC" },
  { label: "D", desc: "Highest acceptable, tighter terms",            pct: 14, color: "#00205B" },
  { label: "",  desc: "Not eligible or requires referral / exception", pct: 10, color: "#E07010" },
];

// ── Flag dot colours ────────────────────────────────────────────
const flagDot: Record<string, string> = {
  urgent: "#EF4444",
  sla: "#F97316",
  overdue: "#F59E0B",
  info: "#60A5FA",
};

// ── Flag pill styles (for tile preview rows) ─────────────────────
const FLAG_PILL: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  urgent:  { label: "Urgent",  bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", dot: "#EF4444" },
  sla:     { label: "SLA",     bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", dot: "#F97316" },
  overdue: { label: "Overdue", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
  info:    { label: "Info",    bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", dot: "#60A5FA" },
};

// ── KPI Column ──────────────────────────────────────────────────
function KPIColumn({ k }: { k: typeof kpis[0] }) {
  const Icon = k.icon;
  const segmentBg = k.segment === "NB" ? "#00205B" : "#0076BC";

  return (
    <div className="px-4 py-4 min-w-0 flex flex-col h-full">
      {/* Segment badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white tracking-wide"
          style={{ backgroundColor: segmentBg }}>
          {k.segment}
        </span>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#EEF6FF" }}>
          <Icon className="w-2.5 h-2.5" style={{ color: "#0076BC" }} />
        </div>
      </div>

      {/* Label */}
      <span className="text-[10px] leading-tight mb-2 block" style={{ fontWeight: 500, color: "#4A6080" }}>
        {k.label}
      </span>

      {/* Value */}
      <div className="text-[22px] font-bold leading-none mb-3" style={{ color: "#0D1B2E", letterSpacing: "-0.8px" }}>
        {k.value}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ backgroundColor: "#E0E8FF" }}>
        <div className="h-full rounded-full" style={{
          width: `${Math.min(k.planPct, 100)}%`,
          backgroundColor: k.planPct >= 100 ? "#0076BC" : "#F9760A",
        }} />
      </div>
      <div className="text-[10px]" style={{ color: "#94A3B8" }}>{k.planBar}</div>
    </div>
  );
}

// ── Broker Mix Tile ─────────────────────────────────────────────
function BrokerMixTile({ label, data }: { label: string; data: { label: string; pct: number }[] }) {
  const top = data[0]?.pct ?? 100;
  return (
    <div className="bg-white rounded-2xl border border-[#E8EDF5] px-5 py-4 flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.04)" }}>
      <div className="text-[11px] font-semibold mb-4" style={{ color: "#4A6080" }}>{label}</div>
      <div className="flex flex-col gap-3">
        {data.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: "#0D1B2E", fontWeight: i === 0 ? 600 : 400 }}>{d.label}</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#00205B" }}>{d.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF6FF" }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${(d.pct / top) * 100}%`,
                  backgroundColor: i === 0 ? "#00205B" : "#0076BC",
                  opacity: i === 0 ? 1 : 0.55 + (i === 1 ? 0.2 : i === 2 ? 0.1 : 0),
                }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hazard Mix Tile ─────────────────────────────────────────────
function HazardMixTile({ data }: { data: { label: string; desc: string; pct: number; color: string }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8EDF5] px-5 py-4 flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.04)" }}>
      {/* Title + subtitle */}
      <div className="mb-3">
        <div className="text-[11px] font-semibold" style={{ color: "#4A6080" }}>Hazard Mix – Overall</div>
        <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "#94A3B8" }}>
          Combined Occupancy + Construction + Location Exposure ratings · Inforce policies
        </div>
      </div>
      {/* Segmented bar — A–D only */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-px" style={{ backgroundColor: "#EEF6FF" }}>
        {data.map((d, i) => (
          <div key={i} style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
        ))}
      </div>
      {/* Legend rows */}
      <div className="flex flex-col gap-3">
        {data.map((d, i) => {
          const isOOA = d.label === "";
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {!isOOA && (
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-white text-[8px] font-extrabold"
                      style={{ backgroundColor: d.color }}>
                      {d.label}
                    </div>
                  )}
                  <div className="min-w-0">
                    {isOOA && (
                      <div className="text-[9px] font-bold" style={{ color: "#DC2626" }}>Out of Appetite</div>
                    )}
                    <span className="text-[10px] truncate" style={{ color: isOOA ? "#DC2626" : "#6B7280" }}>{d.desc}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold tabular-nums ml-2 flex-shrink-0" style={{ color: isOOA ? "#DC2626" : "#00205B" }}>{d.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isOOA ? "#FEE2E2" : "#EEF6FF" }}>
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Action Row ───────────────────────────────────────────────
function AIActionRow({ item, onOpen }: { item: AIItem; onOpen: (id: string) => void }) {
  const dot = item.flag ? flagDot[item.flag] : null;
  const statusCfg = item.processingStatus ? PROCESSING_STATUS_CONFIG[item.processingStatus] : null;

  return (
    <div
      className="group flex items-start gap-4 px-5 py-2.5 border-b border-[#F0F6FF] hover:bg-[#F8FBFF] transition-colors last:border-b-0 cursor-pointer"
      onClick={() => { if (item.submission) onOpen(item.submission); }}
    >
      <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <Sparkles className="text-white" style={{ width: 18, height: 18 }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {item.submission && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
              style={{ color: "#6B81A0", backgroundColor: "#F0F4FF", border: "1px solid #E0E8FF" }}>
              {item.submission}
            </span>
          )}
          {statusCfg && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
          )}
        </div>
        <div className="text-[13px] font-semibold mb-0.5 leading-snug" style={{ color: "#0D1B2E" }}>
          {item.subject}
        </div>
        <div className="text-[12px] line-clamp-1" style={{ color: "#94A3B8" }}>
          {item.preview}
        </div>
      </div>

      <div className="flex-shrink-0">
        <span className="text-[11px]" style={{ color: "#94A3B8" }}>{item.time}</span>
      </div>
    </div>
  );
}

// ── Avatar colour palette ───────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#EDE9FE", color: "#5B21B6" },
  { bg: "#FCE7F3", color: "#9D174D" },
  { bg: "#E0F2FE", color: "#0369A1" },
];
function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}
function senderInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Attachment type colours ─────────────────────────────────────
const EXT_CFG: Record<string, { bg: string; color: string; label: string }> = {
  xlsx: { bg: "#DCFCE7", color: "#16A34A", label: "XLSX" },
  pdf:  { bg: "#FEE2E2", color: "#DC2626", label: "PDF" },
  docx: { bg: "#DBEAFE", color: "#1D4ED8", label: "DOCX" },
  csv:  { bg: "#FEF3C7", color: "#D97706", label: "CSV" },
};

// ── Group Inbox Row (compact Outlook-list style) ────────────────
function GroupInboxRow({
  email,
  selected,
  onClick,
  onReassign,
}: {
  email: InboxEmail;
  selected: boolean;
  onClick: () => void;
  onReassign: (uw: string) => void;
}) {
  const [reassignOpen, setReassignOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const reassignBtnRef = useRef<HTMLButtonElement>(null);
  const bodyPreview = email.body.split("\n").map(l => l.trim()).filter(Boolean).slice(1, 2)[0] ?? "";
  const pal = avatarPalette(email.from);
  const initials = senderInitials(email.from);
  const uwInitials = senderInitials(email.assignedUW);

  const openReassign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reassignBtnRef.current) {
      const r = reassignBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setReassignOpen(v => !v);
  };

  useEffect(() => {
    if (!reassignOpen) return;
    const close = () => setReassignOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [reassignOpen]);

  return (
    <div
      className={`relative flex items-start gap-2.5 px-3 py-3 border-b border-[#F0F0EE] cursor-pointer transition-colors last:border-b-0 ${selected ? "bg-[#EBF6FE]" : "hover:bg-[#F8FBFF]"}`}
      style={!selected && email.unread ? { borderLeft: "3px solid #0076BC" } : { borderLeft: "3px solid transparent" }}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
        style={{ backgroundColor: pal.bg, color: pal.color }}>
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: sender + time */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[12px] flex-1 min-w-0 truncate" style={{ fontWeight: email.unread ? 700 : 500, color: "#0D1B2E" }}>{email.from}</span>
          <span className="text-[11px] flex-shrink-0" style={{ color: "#94A3B8" }}>{email.time}</span>
        </div>

        {/* Row 2: subject */}
        <div className="text-[12px] leading-snug truncate mb-1"
          style={{ fontWeight: email.unread ? 600 : 400, color: email.unread ? "#0076BC" : "#6B7280" }}>
          {email.subject}
        </div>

        {/* Row 3: preview */}
        <div className="text-[11px] truncate mb-1.5" style={{ color: "#9CA3AF" }}>{bodyPreview}</div>

        {/* Row 4: action class pill + attachments + verified badge + assignee + reassign */}
        <div className="flex items-center gap-1 min-w-0">
          {(() => {
            const ac = defaultActionClass(email);
            const acCfg = ACTION_CLASS_CFG[ac];
            return (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: acCfg.bg, color: acCfg.color, borderColor: acCfg.border }}>
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: acCfg.dot }} />
                {acCfg.label}
              </span>
            );
          })()}
          {email.verified ? (
            <span title="Classification verified" className="flex-shrink-0" style={{ color: "#22C55E" }}>
              <ShieldCheck className="w-3 h-3" />
            </span>
          ) : (
            <span title="Unverified — classification pending" className="flex-shrink-0" style={{ color: "#DC2626" }}>
              <ShieldAlert className="w-3 h-3" />
            </span>
          )}
          {email.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] flex-shrink-0" style={{ color: "#9CA3AF" }}>
              <Paperclip className="w-2.5 h-2.5" />
              {email.attachments.length}
            </span>
          )}

          {/* Assignee + reassign (non-unclassified emails) */}
          {email.emailCategory !== "unclassified" && (
            <>
              <span className="ml-auto flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: "#6B7280" }}
                onClick={e => e.stopPropagation()}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                  style={{ backgroundColor: "#EEF6FF", color: "#0076BC" }}>
                  {uwInitials}
                </span>
                <span className="truncate max-w-[40px]">{email.assignedUW.split(" ")[0]}</span>
              </span>
              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  ref={reassignBtnRef}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-[#E0E8FF] bg-white hover:bg-[#EEF6FF] transition-colors whitespace-nowrap"
                  style={{ color: "#0076BC" }}
                  onClick={openReassign}
                >
                  <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />
                  Reassign
                </button>
                {reassignOpen && dropdownPos && (
                  <div
                    className="fixed z-50 bg-white rounded-md border border-[#E0E8FF] py-0.5"
                    style={{ top: dropdownPos.top, right: dropdownPos.right, width: 100, boxShadow: "0 4px 10px rgba(0,32,91,0.10)" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {UW_TEAM.map(uw => (
                      <button
                        key={uw}
                        className="w-full text-left px-2 py-0.5 text-[10px] hover:bg-[#F0F6FF] transition-colors truncate"
                        style={{ color: uw === email.assignedUW ? "#0076BC" : "#0D1B2E", fontWeight: uw === email.assignedUW ? 600 : 400 }}
                        onClick={() => { onReassign(uw); setReassignOpen(false); }}
                      >
                        {uw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compact Linking Input ────────────────────────────────────────
function CompactLinkingInput({ email }: { email: InboxEmail }) {
  const initialAcc = MOCK_ACCOUNTS.find(a => a.id === email.submission);
  const [linked, setLinked] = useState<{ id: string; name: string } | null>(
    email.submission ? { id: email.submission, name: initialAcc?.account ?? email.submissionName ?? email.submission } : null
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = MOCK_ACCOUNTS.filter(a => {
    if (!query) return true;
    const q = query.toLowerCase();
    return a.account.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.broker.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="flex-1 min-w-0">
      {/* Linked chip — shown when linked and not searching */}
      {linked && !open ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4]">
          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#15803D" }} />
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{linked.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
              style={{ color: "#6B81A0", backgroundColor: "#F0F4FF", border: "1px solid #E0E8FF" }}>{linked.id}</span>
          </div>
          <button
            onClick={() => { setLinked(null); toast("Link removed"); }}
            className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-[#D1FAE5] flex-shrink-0"
            style={{ color: "#15803D" }}>
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Link2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#0076BC" }} />
          <input
            type="text"
            placeholder="Link submission / account…"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full pl-6 pr-6 py-1.5 text-[11px] rounded-lg border border-[#E0E8FF] bg-white outline-none placeholder:text-[#C0CEDC]"
            style={{ color: "#0D1B2E" }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-[#F0F0EE]"
              style={{ color: "#94A3B8" }}>
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="mt-1 rounded-xl overflow-hidden">
          <div className="flex flex-col gap-1 p-1">
            {results.slice(0, 4).map(acc => {
              const stCfg = PROCESSING_STATUS_CONFIG[acc.status];
              const isLinked = linked?.id === acc.id;
              return (
                <div key={acc.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${isLinked ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E8EDF5] hover:bg-[#F8FBFF]"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{acc.account}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded font-semibold flex-shrink-0"
                        style={{ color: "#6B81A0", backgroundColor: "#F0F4FF", border: "1px solid #E0E8FF" }}>{acc.id}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${stCfg.bg} ${stCfg.color} ${stCfg.border}`}>{stCfg.label}</span>
                  </div>
                  {isLinked ? (
                    <button onClick={() => { setLinked(null); setOpen(false); toast("Link removed"); }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] flex-shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Linked
                    </button>
                  ) : (
                    <button onClick={() => { setLinked({ id: acc.id, name: acc.account }); setQuery(""); setOpen(false); toast.success(`Linked to ${acc.account}`); }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-[#C2DFF4] bg-[#EEF6FF] text-[#0076BC] flex-shrink-0">
                      <Link2 className="w-2.5 h-2.5" /> Link
                    </button>
                  )}
                </div>
              );
            })}
            {results.length === 0 && (
              <div className="text-[11px] text-center py-2" style={{ color: "#9CA3AF" }}>No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Action Classification ────────────────────────────────────────
type ActionClass = "new-request" | "update-external" | "update-internal" | "not-relevant";

const ACTION_CLASS_CFG: Record<ActionClass, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "new-request":     { label: "New Request",     color: "#0076BC", bg: "#EEF6FF", border: "#C2DFF4", dot: "#0076BC" },
  "update-external": { label: "Update External",  color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", dot: "#0F766E" },
  "update-internal": { label: "Update Internal",  color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", dot: "#0891B2" },
  "not-relevant":    { label: "Not Relevant",     color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF" },
};

function defaultActionClass(email: InboxEmail): ActionClass {
  switch (email.emailCategory) {
    case "new-business":
    case "renewal":         return "new-request";
    case "follow-up":
    case "broker-response": return "update-external";
    case "internal":        return "update-internal";
    default:                return "not-relevant";
  }
}

// ── Linked Submission hover panel ──────────────────────────────
// ── AI Classification Panel ─────────────────────────────────────
function ClassificationPanel({
  email,
  onVerify,
}: {
  email: InboxEmail;
  onVerify: () => void;
}) {
  const [actionClass, setActionClass] = useState<ActionClass>(() => defaultActionClass(email));
  useEffect(() => { setActionClass(defaultActionClass(email)); }, [email]);
  const [dropOpen, setDropOpen] = useState(false);
  const [hoveredUpdate, setHoveredUpdate] = useState<ActionClass | null>(null);
  const [hoverKey, setHoverKey] = useState<ActionClass | null>(null);
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null);
  const [linkedSubs, setLinkedSubs] = useState<string[]>(() => email.submission ? [email.submission] : []);
  const [accountSearch, setAccountSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const subPanelRef = useRef<HTMLDivElement>(null);
  const thirdPanelRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(null);
  const [thirdPos, setThirdPos] = useState<{ top: number; left: number } | null>(null);
  const leaveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLinkedSubs(email.submission ? [email.submission] : []); setHoveredUpdate(null); setHoveredAccount(null); }, [email]);

  const openDrop = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, right: window.innerWidth - r.left - 180 });
    }
    setDropOpen(true);
    setHoveredUpdate(null);
  };

  const closeDrop = () => {
    setDropOpen(false);
    setHoveredUpdate(null);
    setHoverKey(null);
    setSubPos(null);
    setHoveredAccount(null);
    setThirdPos(null);
  };

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e: MouseEvent) => {
      const node = e.target as Node;
      const inDrop = dropRef.current?.contains(node);
      const inSub = subPanelRef.current?.contains(node);
      const inThird = thirdPanelRef.current?.contains(node);
      const inTrigger = triggerRef.current?.contains(node);
      if (!inDrop && !inSub && !inThird && !inTrigger) closeDrop();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [dropOpen]);

  const cfg = ACTION_CLASS_CFG[actionClass];

  const handleUpdateEnter = (k: ActionClass, e: React.MouseEvent<HTMLButtonElement>) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const subW = 200;
    const mainDropW = 180;
    const mainDropRight = dropPos ? window.innerWidth - dropPos.right : rect.right;
    const mainDropLeft = mainDropRight - mainDropW;
    const spaceRight = window.innerWidth - mainDropRight;
    const left = spaceRight >= subW + 6 ? mainDropRight + 4 : mainDropLeft - subW - 4;
    const HEADER_H = 55;
    const rawTop = dropPos ? dropPos.top : rect.top;
    setHoveredUpdate(k);
    setSubPos({ top: Math.max(8, rawTop - HEADER_H), left: Math.max(4, left) });
  };

  const closeAll = () => {
    setDropOpen(false);
    setDropPos(null);
    setHoveredUpdate(null);
    setSubPos(null);
    setHoveredAccount(null);
    setThirdPos(null);
    setAccountSearch("");
    setSubSearch("");
  };

  const closePanel3 = () => { setHoveredAccount(null); setThirdPos(null); setSubSearch(""); };

  // Panel 1/2 leave: close everything
  const handleUpdateLeave = () => { leaveTimer.current = setTimeout(closeAll, 200); };
  const handleSubEnter    = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); };
  const handleSubLeave    = () => { leaveTimer.current = setTimeout(closeAll, 200); };

  // Panel 3 opens on HOVER of account row — anchored to the exact row position
  const handleAccountEnter = (accountId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (accLeaveTimer.current) clearTimeout(accLeaveTimer.current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const subPanelW = 200;
    const thirdW = 180;
    const spaceRight = window.innerWidth - (subPos ? subPos.left + subPanelW : rect.right);
    const left = spaceRight >= thirdW + 6
      ? (subPos ? subPos.left + subPanelW + 4 : rect.right + 4)
      : (subPos ? subPos.left - thirdW - 4 : rect.left - thirdW - 4);
    // Offset upward by the panel header height (~55px: label + search + padding)
    // so the first submission item aligns with the hovered account row.
    const HEADER_H = 55;
    setHoveredAccount(accountId);
    setThirdPos({ top: Math.max(8, rect.top - HEADER_H), left: Math.max(4, left) });
    requestAnimationFrame(() => {
      if (!thirdPanelRef.current) return;
      const panelRect = thirdPanelRef.current.getBoundingClientRect();
      const overflow = panelRect.bottom - (window.innerHeight - 8);
      if (overflow > 0) {
        setThirdPos(prev => prev ? { ...prev, top: Math.max(8, prev.top - overflow) } : null);
      }
    });
  };
  const handleAccountLeave = () => { accLeaveTimer.current = setTimeout(closePanel3, 150); };
  const handleThirdEnter   = () => {
    if (accLeaveTimer.current) clearTimeout(accLeaveTimer.current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };
  const handleThirdLeave   = () => { leaveTimer.current = setTimeout(closeAll, 200); };

  const selectNonUpdate = (k: ActionClass) => {
    setActionClass(k);
    closeDrop();
  };

  const toggleSubmission = (subId: string, cls: ActionClass) => {
    setActionClass(cls);
    setLinkedSubs(prev => {
      if (prev.includes(subId)) return prev; // already selected — keep it (at least one required)
      const acc = MOCK_ACCOUNTS.find(a => a.submissions.includes(subId));
      toast.success(`Linked ${subId} — ${acc?.account ?? subId}`);
      return [subId]; // single-select: replace previous selection
    });
    closeAll();
  };

  const aiCatCfg = EMAIL_CATEGORY_CONFIG[email.emailCategory];
  const aiSummary = AI_SUMMARY[email.emailCategory];

  return (
    <div className="mx-6 mt-4 mb-1 rounded-xl border" style={{ borderColor: cfg.border, backgroundColor: "#FAFAFA" }}>
      {/* Classification panel */}
      <div className="border-b rounded-t-xl" style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>

        {/* Row 1: title + AI bar + verified badge */}
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
          <span className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "#94A3B8" }}>Classification</span>
          {/* AI confidence + bar — inline */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 mx-1">
            <Sparkles className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#0076BC" }} />
            <span className="text-[8px] font-semibold flex-shrink-0"
              style={{ color: email.aiConfidence >= 80 ? "#15803D" : email.aiConfidence >= 60 ? "#B45309" : "#DC2626" }}>
              {email.aiConfidence}%
            </span>
            <div className="w-10 h-1 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${email.aiConfidence}%`, backgroundColor: email.aiConfidence >= 80 ? "#22C55E" : email.aiConfidence >= 60 ? "#F59E0B" : "#EF4444" }} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!email.verified && (
              <button
                onClick={() => { onVerify(); toast.success("Classification verified"); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold border border-[#E5E7EB] bg-white text-[#374151] transition-colors hover:bg-[#F3F4F6]">
                <CheckCircle2 className="w-2.5 h-2.5" /> Verify
              </button>
            )}
            {email.verified && (
              <span className="flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                <ShieldCheck className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* AI summary — below title row */}
        <div className="flex items-start gap-2 px-4 pb-2">
          <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "#EEF6FF" }}>
            <Sparkles className="w-2 h-2" style={{ color: "#0076BC" }} />
          </div>
          <p className="text-[10px] leading-relaxed flex-1 min-w-0" style={{ color: "#4B5563" }}>
            {aiSummary}
          </p>
        </div>

        {/* Row 2: action class dropdown */}
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <div className="relative flex-shrink-0">
            <button
              ref={triggerRef}
              onClick={dropOpen ? closeDrop : openDrop}
              className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-[#F9FAFB]"
              style={{ color: "#374151" }}>
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
              {cfg.label}
              <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Main dropdown portal */}
        {dropOpen && dropPos && createPortal(
          <div ref={dropRef}
            onMouseLeave={handleUpdateLeave}
            className="fixed z-[9999] bg-white rounded-lg border border-[#E0E8FF] py-1 overflow-hidden"
            style={{ top: dropPos.top, right: dropPos.right, width: 180, boxShadow: "0 6px 20px rgba(0,32,91,0.15)" }}>
            {(Object.keys(ACTION_CLASS_CFG) as ActionClass[]).map(k => {
              const kCfg = ACTION_CLASS_CFG[k];
              const hasCascade = k === "update-external" || k === "update-internal";
              const isActive = actionClass === k;
              const isHovered = hoverKey === k;
              return (
                <button key={k}
                  onClick={hasCascade ? undefined : () => selectNonUpdate(k)}
                  onMouseEnter={e => {
                    setHoverKey(k);
                    if (hasCascade) handleUpdateEnter(k, e);
                    else { setHoveredUpdate(null); setSubPos(null); closePanel3(); }
                  }}
                  onMouseLeave={() => setHoverKey(null)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold transition-colors text-left rounded-sm"
                  style={{
                    backgroundColor: isActive ? "#EEF6FF" : isHovered ? "#F5F9FF" : "transparent",
                    color: isActive ? "#0076BC" : isHovered ? "#0076BC" : "#374151",
                  }}>
                  <span className="flex-1">{kCfg.label}</span>
                  {hasCascade && (
                    <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ opacity: isHovered || isActive ? 1 : 0.3 }} />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}

        {/* Panel 2 — Select Account */}
        {hoveredUpdate && subPos && createPortal(
          <div ref={subPanelRef}
            onMouseEnter={handleSubEnter}
            onMouseLeave={handleSubLeave}
            className="fixed z-[9999] bg-white rounded-lg border border-[#E0E8FF] flex flex-col"
            style={{ top: subPos.top, left: subPos.left, width: 200, boxShadow: "0 6px 20px rgba(0,32,91,0.15)" }}>
            <div className="px-2.5 pt-2 pb-1.5 border-b border-[#EEF2FF] flex-shrink-0">
              <span className="text-[8px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#94A3B8" }}>Select Account</span>
              <div className="relative">
                <Search className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
                <input
                  autoFocus
                  value={accountSearch}
                  onChange={e => setAccountSearch(e.target.value)}
                  placeholder="Search accounts…"
                  className="w-full pl-6 pr-2 py-1 text-[10px] rounded-md border border-[#E0E8FF] outline-none"
                  style={{ color: "#0D1B2E", backgroundColor: "#F8FBFF" }}
                  onMouseEnter={handleSubEnter}
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "220px" }}
              onScroll={closePanel3}>
              {MOCK_ACCOUNTS
                .filter(acc => acc.account.toLowerCase().includes(accountSearch.toLowerCase()))
                .map(acc => {
                const isLinkedAcc = hoveredUpdate === actionClass && acc.submissions.some(s => linkedSubs.includes(s));
                const isActive = hoveredAccount === acc.id;
                return (
                  <button key={acc.id}
                    onMouseEnter={e => handleAccountEnter(acc.id, e)}
                    onMouseLeave={handleAccountLeave}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors"
                    style={{
                      backgroundColor: isLinkedAcc ? "#EEF6FF" : isActive ? "#F5F9FF" : "transparent",
                    }}>
                    {isLinkedAcc
                      ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#0076BC" }} />
                      : <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: isActive ? "#0076BC" : "#D1D5DB" }} />}
                    <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: isLinkedAcc ? "#0076BC" : "#0D1B2E" }}>{acc.account}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: isLinkedAcc ? "#0076BC" : isActive ? "#0076BC" : "#CBD5E1" }} />
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}

        {/* Panel 3 — Select Submission */}
        {hoveredAccount && thirdPos && createPortal(
          <div ref={thirdPanelRef}
            onMouseEnter={handleThirdEnter}
            onMouseLeave={handleThirdLeave}
            className="fixed z-[9999] bg-white rounded-lg border border-[#E0E8FF] flex flex-col"
            style={{ top: thirdPos.top, left: thirdPos.left, width: 180, boxShadow: "0 6px 20px rgba(0,32,91,0.15)" }}>
            <div className="px-2.5 pt-2 pb-1.5 border-b border-[#EEF2FF] flex-shrink-0">
              <span className="text-[8px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#94A3B8" }}>Select Submission</span>
              <div className="relative">
                <Search className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
                <input
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  placeholder="Search IDs…"
                  className="w-full pl-6 pr-2 py-1 text-[10px] rounded-md border border-[#E0E8FF] outline-none"
                  style={{ color: "#0D1B2E", backgroundColor: "#F8FBFF" }}
                  onMouseEnter={handleThirdEnter}
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
              {(MOCK_ACCOUNTS.find(a => a.id === hoveredAccount)?.submissions ?? [])
                .filter(subId => subId.toLowerCase().includes(subSearch.toLowerCase()))
                .map(subId => {
                const isLinked = hoveredUpdate === actionClass && linkedSubs.includes(subId);
                return (
                  <button key={subId}
                    onClick={() => hoveredUpdate && toggleSubmission(subId, hoveredUpdate)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors"
                    style={{ backgroundColor: isLinked ? "#EEF6FF" : "transparent" }}
                    onMouseEnter={e => { if (!isLinked) (e.currentTarget as HTMLElement).style.backgroundColor = "#F5F9FF"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isLinked ? "#EEF6FF" : "transparent"; }}>
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: isLinked ? "#0076BC" : "#D1D5DB", backgroundColor: "transparent" }}>
                      {isLinked && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0076BC" }} />}
                    </div>
                    <span className="text-[10px] font-mono font-semibold flex-1" style={{ color: isLinked ? "#0076BC" : "#0D1B2E" }}>{subId}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}

      {/* Linked submission chip — shown when an Update option has a submission selected */}
      {linkedSubs.length > 0 && (actionClass === "update-external" || actionClass === "update-internal") && (
        <div className="px-4 py-2 border-t border-[#F0F4FF] rounded-b-xl flex flex-col gap-1" style={{ backgroundColor: "#F8FBFF" }}>
          {linkedSubs.map(subId => {
            const acc = MOCK_ACCOUNTS.find(a => a.submissions.includes(subId));
            return (
              <div key={subId} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#15803D" }} />
                <span className="text-[10px] font-semibold flex-1 min-w-0 truncate" style={{ color: "#0D1B2E" }}>{acc?.account ?? "—"}</span>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ color: "#0076BC", backgroundColor: "#EEF6FF", border: "1px solid #C2DFF4" }}>{subId}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Email Reader Pane ───────────────────────────────────────────

const AI_SUMMARY: Record<EmailCategory, string> = {
  "new-business":    "AI identified this as a new business submission based on the structured application data, ACORD forms, and Statement of Values. Triage and route to the appropriate underwriter.",
  "renewal":         "AI identified this as a renewal submission. Expiring policy data and updated SOV detected. Verify TIV changes and loss history before proceeding to rating.",
  "broker-response": "AI identified this as a broker update or document submission. New attachments detected — review and match to the open submission before advancing the workflow.",
  "follow-up":       "AI identified this as a follow-up or status inquiry from the broker. No new submission data detected. Respond or escalate as appropriate.",
  "internal":        "AI identified this as an internal routing or team notification. No broker interaction detected. Review and action as required.",
  "unclassified":    "AI was unable to classify this email with sufficient confidence. Manual review and classification required before routing.",
};

function PdfPreview({ name }: { name: string }) {
  return (
    <div className="px-8 py-6 font-serif" style={{ backgroundColor: "white", minHeight: 480 }}>
      <div className="text-center mb-6 pb-4 border-b border-[#E5E7EB]">
        <div className="text-[15px] font-bold mb-1" style={{ color: "#0D1B2E" }}>{name.replace(/\.[^.]+$/, "")}</div>
        <div className="text-[11px]" style={{ color: "#6B7280" }}>QBE Commercial Property · Confidential</div>
      </div>
      <div className="space-y-3 text-[11px] leading-relaxed" style={{ color: "#374151" }}>
        <p>This document contains the updated Statement of Values and associated engineering data for the named insured. All values reflect the most recent on-site assessment conducted in Q1 2026.</p>
        <div className="mt-4 mb-2 text-[12px] font-bold" style={{ color: "#0D1B2E" }}>1. Property Schedule Summary</div>
        <div className="border border-[#E5E7EB] rounded overflow-hidden text-[10px]">
          {[["Location", "TIV", "Construction", "Year Built"], ["Tampa, FL", "$45,000,000", "JM — Steel", "1998"], ["Chicago, IL", "$28,500,000", "MNC — Concrete", "2004"], ["Houston, TX", "$19,200,000", "FR — Steel", "2011"]].map((row, i) => (
            <div key={i} className={`grid grid-cols-4 ${i === 0 ? "font-semibold bg-[#F8FBFF]" : "hover:bg-[#FAFAFA]"} border-b border-[#F0F0EE] last:border-0`}>
              {row.map((c, j) => <div key={j} className="px-2 py-1.5 border-r border-[#F0F0EE] last:border-r-0">{c}</div>)}
            </div>
          ))}
        </div>
        <div className="mt-4 mb-2 text-[12px] font-bold" style={{ color: "#0D1B2E" }}>2. Key Findings</div>
        <p>The Tampa facility has undergone significant expansion since the prior policy period. Total insurable value has increased from $38M to $45M following the commissioning of Building 11 in November 2025.</p>
        <p>Protection class for the Tampa site has been updated to PC 5 following the installation of an upgraded sprinkler system across all three primary warehouses.</p>
        <div className="mt-4 p-3 rounded-lg border-l-4 text-[10px]" style={{ borderColor: "#0076BC", backgroundColor: "#EEF6FF", color: "#00205B" }}>
          <strong>Note:</strong> Engineering walkthrough report is attached separately. Roof condition at Building 9 (Tampa) rated Fair — replacement recommended within 24 months.
        </div>
      </div>
    </div>
  );
}

function XlsxPreview({ name }: { name: string }) {
  const headers = name.includes("SOV") || name.includes("Loss")
    ? ["Location", "TIV", "Construction", "Occ. Class", "Year Built", "Sprinkler"]
    : ["Account", "GWP", "Premium", "Limit", "SIR", "Status"];
  const rows = name.includes("SOV")
    ? [["Tampa, FL", "$45.0M", "JM Steel", "Warehouse", "1998", "Yes"], ["Chicago, IL", "$28.5M", "MNC Conc.", "Office", "2004", "Yes"], ["Houston, TX", "$19.2M", "FR Steel", "Mfg.", "2011", "Partial"], ["Atlanta, GA", "$11.8M", "Wood Frame", "Storage", "1995", "No"], ["Phoenix, AZ", "$8.4M", "JM Steel", "Warehouse", "2008", "Yes"]]
    : [["Westfield Mfg.", "$1.82M", "$1.82M", "$50M", "$250K", "Bound"], ["Atlantic Dist.", "$1.24M", "$1.24M", "$89M", "$500K", "Quoted"], ["Pacific Hotels", "$980K", "$980K", "$35M", "$100K", "Review"], ["Metro Logistics", "$640K", "$640K", "$22M", "$250K", "Pending"]];
  return (
    <div className="p-4" style={{ backgroundColor: "white", minHeight: 480 }}>
      <div className="text-[11px] font-semibold mb-3 px-1" style={{ color: "#0D1B2E" }}>{name.replace(/\.[^.]+$/, "")}</div>
      <div className="border border-[#D1D5DB] rounded overflow-hidden text-[10px]">
        <div className="grid border-b border-[#D1D5DB]" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)`, backgroundColor: "#E8F0F7" }}>
          {headers.map(h => <div key={h} className="px-2 py-2 font-bold border-r border-[#C8D4E0] last:border-r-0" style={{ color: "#00205B" }}>{h}</div>)}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className="grid border-b border-[#F0F0EE] last:border-0" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)`, backgroundColor: ri % 2 === 0 ? "white" : "#FAFBFD" }}>
            {row.map((cell, ci) => <div key={ci} className="px-2 py-1.5 border-r border-[#F0F0EE] last:border-r-0 truncate" style={{ color: "#374151" }}>{cell}</div>)}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[9px]" style={{ color: "#94A3B8" }}>
        <span>Sheet 1 of 3</span><span>·</span><span>{rows.length} rows shown</span>
      </div>
    </div>
  );
}

function DocxPreview({ name }: { name: string }) {
  return (
    <div className="px-10 py-8 font-serif" style={{ backgroundColor: "white", minHeight: 480 }}>
      <div className="text-[16px] font-bold mb-1" style={{ color: "#0D1B2E" }}>{name.replace(/\.[^.]+$/, "").replace(/_/g, " ")}</div>
      <div className="text-[10px] mb-5 pb-4 border-b border-[#E5E7EB]" style={{ color: "#94A3B8" }}>QBE NA Commercial Property · Internal Document</div>
      <div className="space-y-4 text-[11px] leading-relaxed" style={{ color: "#374151" }}>
        <div>
          <div className="text-[12px] font-bold mb-2" style={{ color: "#0D1B2E" }}>Executive Summary</div>
          <p>This report provides a comprehensive COPE data summary for the named submission. The information contained herein has been verified against the Statement of Values and supplemented with third-party risk data.</p>
        </div>
        <div>
          <div className="text-[12px] font-bold mb-2" style={{ color: "#0D1B2E" }}>Risk Assessment</div>
          <p>Construction quality across the portfolio is rated Good to Excellent for primary locations. Deferred maintenance has been noted at two secondary sites and has been factored into the modelling assumptions.</p>
          <ul className="mt-2 ml-4 space-y-1 list-disc text-[10px]">
            <li>Primary hazard class: Grade B (Favorable)</li>
            <li>CAT exposure: Moderate — Wind/Hail primary peril</li>
            <li>Flood zone: Zone X for 4 of 5 locations</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
          <strong>Action Required:</strong> Confirm updated roof age for Tampa Building 9 before binding. Engineering recommends re-inspection within 60 days.
        </div>
      </div>
    </div>
  );
}

function AttachmentPreviewModal({ att, onClose }: { att: Attachment; onClose: () => void }) {
  const extCfg = EXT_CFG[att.type] ?? { bg: "#F3F4F6", color: "#6B7280", label: att.type.toUpperCase() };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 560, maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#F0F0EE] flex-shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold flex-shrink-0"
            style={{ backgroundColor: extCfg.bg, color: extCfg.color }}>
            {extCfg.label}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{att.name}</div>
            <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{att.size}</div>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#F0F4FF]"
            style={{ color: "#94A3B8" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Preview area */}
        <div className="overflow-y-auto flex-1 border border-[#E5E7EB] mx-4 my-3 rounded-xl" style={{ backgroundColor: "#F9F9F9" }}>
          {att.type === "pdf"  && <PdfPreview  name={att.name} />}
          {att.type === "xlsx" && <XlsxPreview name={att.name} />}
          {att.type === "docx" && <DocxPreview name={att.name} />}
          {!["pdf", "xlsx", "docx"].includes(att.type) && <PdfPreview name={att.name} />}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#F0F0EE] flex-shrink-0 bg-white">
          <button
            onClick={() => { toast.success(`Downloading ${att.name}`, { description: att.size }); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#E5E7EB] bg-white text-[#374151] transition-colors hover:bg-[#F3F4F6]">
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function EmailReaderPane({
  email,
  onClose,
  onVerify,
}: {
  email: InboxEmail;
  onClose: () => void;
  onVerify: () => void;
}) {
  const pal = avatarPalette(email.from);
  const initials = senderInitials(email.from);
  const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);

  return (
    <div className="flex flex-col min-w-0 relative">
      {/* Subject + close */}
      <div className="px-6 pt-2.5 pb-2 flex-shrink-0 border-b border-[#F0F0EE] flex items-center gap-3">
        <h3 className="flex-1 text-[17px] leading-snug" style={{ fontWeight: 700, color: "#0D1B2E", letterSpacing: "-0.3px" }}>
          {email.subject}
        </h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md transition-colors"
          style={{ color: "#6B7280", backgroundColor: "#F3F4F6" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#111827"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F3F4F6"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
          aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sender meta */}
      <div className="flex items-start gap-2 px-6 py-2 flex-shrink-0 border-b border-[#F0F0EE]">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
          style={{ backgroundColor: pal.bg, color: pal.color }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>{email.from}</span>
            <span className="text-[12px]" style={{ color: "#9CA3AF" }}>&lt;{email.fromEmail}&gt;</span>
          </div>
        </div>
        <span className="text-[11px] flex-shrink-0 pt-0.5" style={{ color: "#9CA3AF" }}>
          {email.date} · {email.time}
        </span>
      </div>

      {/* Attachments strip */}
      {email.attachments.length > 0 && (
        <div className="flex items-center gap-1 px-6 py-1 flex-shrink-0 border-b border-[#F0F0EE] flex-wrap">
          {email.attachments.map(att => {
            const extCfg = EXT_CFG[att.type] ?? { bg: "#F3F4F6", color: "#6B7280", label: att.type.toUpperCase() };
            return (
              <button key={att.name}
                onClick={() => setPreviewAtt(att)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8EDF5] bg-white transition-colors hover:border-[#0076BC] hover:bg-[#EEF6FF] group"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center flex-shrink-0 text-[6px] font-bold"
                  style={{ backgroundColor: extCfg.bg, color: extCfg.color }}>
                  {extCfg.label}
                </div>
                <span className="text-[9px] font-medium truncate" style={{ color: "#0D1B2E", maxWidth: 80 }}>{att.name}</span>
                <span className="text-[8px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#0076BC" }}>Preview</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Classification panel */}
      <ClassificationPanel email={email} onVerify={onVerify} />

      {/* Email body */}
      <div className="px-6 py-5">
        <pre className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "inherit", color: "#1F2937" }}>
          {email.body}
        </pre>
      </div>

      {/* Attachment preview modal */}
      {previewAtt && <AttachmentPreviewModal att={previewAtt} onClose={() => setPreviewAtt(null)} />}
    </div>
  );
}

// ── Empty reader state ──────────────────────────────────────────
function ReaderEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EEF6FF" }}>
        <Mail className="w-6 h-6" style={{ color: "#0076BC" }} />
      </div>
      <div className="text-[13px] font-semibold text-center" style={{ color: "#6B7280" }}>Select an email to read</div>
      <div className="text-[12px] text-center" style={{ color: "#9CA3AF" }}>Choose a message from the list on the left</div>
    </div>
  );
}

// ── Recommended Actions Drawer Content ─────────────────────────
function RecommendedActionsContent({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-[#F0F0EE]">
        {aiItems.map((item) => {
          const statusCfg = item.processingStatus ? PROCESSING_STATUS_CONFIG[item.processingStatus] : null;
          const dot = item.flag ? flagDot[item.flag] : null;
          return (
            <div key={item.id}
              className="flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-[#F8FBFF] transition-colors"
              onClick={() => { if (item.submission) onOpen(item.submission); }}
            >
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
                  <Sparkles style={{ width: 18, height: 18, color: "white" }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.submission && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border border-[#E0E8FF] bg-[#F8FBFF]"
                        style={{ color: "#0076BC", fontWeight: 600 }}>{item.submission}</span>
                    )}
                    {statusCfg && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                        style={{ fontWeight: 600 }}>{statusCfg.label}</span>
                    )}
                    {item.flag === "urgent" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">Urgent</span>
                    )}
                    {item.flag === "sla" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">SLA</span>
                    )}
                    {item.flag === "overdue" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">Overdue</span>
                    )}
                  </div>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "#9CA3AF" }}>{item.time}</span>
                </div>
                <div className="text-[14px] font-semibold mb-1 leading-snug" style={{ color: "#0D1B2E" }}>{item.subject}</div>
                <div className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>{item.preview}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Group Inbox Drawer Content ──────────────────────────────────
function GroupInboxContent({ initialEmailId }: { initialEmailId?: string | null }) {
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(() =>
    initialEmailId ? (inboxEmails.find(e => e.id === initialEmailId) ?? null) : null
  );
  const [inboxSearch, setInboxSearch] = useState("");
  const [inboxReadFilter, setInboxReadFilter] = useState<"all" | "unread">("all");
  const [categoryFilter, setCategoryFilter] = useState<ActionClass | "all">("all");
  const [emails, setEmails] = useState(inboxEmails);

  useEffect(() => {
    if (initialEmailId) {
      const found = emails.find(e => e.id === initialEmailId) ?? null;
      setSelectedEmail(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmailId]); // emails intentionally omitted: effect only runs on initial id change

  const unreadInboxCount = emails.filter(e => e.unread).length;

  const filteredInbox = emails.filter(email => {
    if (inboxReadFilter === "unread" && !email.unread) return false;
    if (categoryFilter !== "all" && defaultActionClass(email) !== categoryFilter) return false;
    if (inboxSearch) {
      const q = inboxSearch.toLowerCase();
      const hits =
        email.subject.toLowerCase().includes(q) ||
        email.from.toLowerCase().includes(q) ||
        email.company.toLowerCase().includes(q) ||
        (email.submission?.toLowerCase().includes(q) ?? false) ||
        (email.submissionName?.toLowerCase().includes(q) ?? false);
      if (!hits) return false;
    }
    return true;
  });

  const handleCategoryChange = (emailId: string, cat: EmailCategory) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, emailCategory: cat, verified: false } : e));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, emailCategory: cat, verified: false } : null);
    }
  };

  const handleVerify = (emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, verified: true } : e));
    setSelectedEmail(prev => prev ? { ...prev, verified: true } : null);
  };

  return (
    <div className="flex h-full">
      {/* List pane */}
      <div className="flex flex-col flex-shrink-0 border-r border-[#E8EDF5]" style={{ width: selectedEmail ? 420 : "100%" }}>
        {/* Filters */}
        <div className="px-4 py-3 border-b border-[#F0F0EE] flex flex-col gap-2 flex-shrink-0" style={{ backgroundColor: "#FAFCFF" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search emails…"
              value={inboxSearch}
              onChange={e => setInboxSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl text-[12px] border border-[#E0E8FF] bg-white outline-none placeholder:text-[#C0CEDC]"
              style={{ color: "#0D1B2E" }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0076BC"; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E0E8FF"; }}
            />
            {inboxSearch && (
              <button onClick={() => setInboxSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#F0F0EE]"
                style={{ color: "#94A3B8" }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as ActionClass | "all")}
              className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-[#E0E8FF] bg-white outline-none cursor-pointer"
              style={{ color: "#0D1B2E" }}>
              <option value="all">All Status</option>
              {(Object.keys(ACTION_CLASS_CFG) as ActionClass[]).map(k => (
                <option key={k} value={k}>{ACTION_CLASS_CFG[k].label}</option>
              ))}
            </select>
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[#E0E8FF] flex-shrink-0" style={{ backgroundColor: "#F8FBFF" }}>
              {(["all", "unread"] as const).map(f => (
                <button key={f} onClick={() => setInboxReadFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                  style={inboxReadFilter === f
                    ? { backgroundColor: "white", color: "#0D1B2E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { color: "#94A3B8" }}>
                  {f === "all" ? "All" : `Unread (${unreadInboxCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {filteredInbox.length === 0 ? (
            <div className="py-12 text-center px-4">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2" style={{ color: "#C0CEDC" }} />
              <div className="text-[12px]" style={{ color: "#94A3B8" }}>No messages match your filters.</div>
              <button onClick={() => { setInboxSearch(""); setInboxReadFilter("all"); setCategoryFilter("all"); }}
                className="mt-2 text-[11px] font-semibold hover:underline" style={{ color: "#0076BC" }}>
                Clear filters
              </button>
            </div>
          ) : (
            filteredInbox.map(email => (
              <GroupInboxRow
                key={email.id}
                email={email}
                selected={selectedEmail?.id === email.id}
                onClick={() => {
                  setSelectedEmail(email);
                  setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e));
                }}
                onReassign={(uw) => {
                  setEmails(prev => prev.map(e => e.id === email.id ? { ...e, assignedUW: uw } : e));
                  toast.success(`Reassigned to ${uw}`);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Reader pane */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            className="flex-1 min-w-0 overflow-y-auto"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <EmailReaderPane
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
              onVerify={() => handleVerify(selectedEmail.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared back button ──────────────────────────────────────────
function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="w-7 h-7 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
      style={{ color: "#6B7280", backgroundColor: "#F3F4F6" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#111827"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F3F4F6"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
      aria-label="Close"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

// ── Shared page back-header ─────────────────────────────────────
function HubPageHeader({ title, subtitle, icon: Icon, gradient, children }: {
  title: string; subtitle?: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  gradient?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-6 pt-3 pb-4 border-b border-[#E8EDF5] bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient ?? "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <Icon style={{ width: 16, height: 16, color: "white" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>{title}</div>
          {subtitle && <div className="text-[11px]" style={{ color: "#6B7280" }}>{subtitle}</div>}
        </div>
        {children}
        <BackButton />
      </div>
    </div>
  );
}

// ── Performance page data ────────────────────────────────────────
type PeriodKey = "mtd" | "qtd" | "ytd" | "l12m";

const PERIODS: { key: PeriodKey; label: string; range: string }[] = [
  { key: "mtd",  label: "MTD",      range: "Aug 1–18, 2026" },
  { key: "qtd",  label: "QTD",      range: "Jul 1–Aug 18, 2026" },
  { key: "ytd",  label: "YTD",      range: "Jan 1–Aug 18, 2026" },
  { key: "l12m", label: "Last 12M", range: "Sep 2025–Aug 2026" },
];

interface PerfMetric {
  id: string;
  label: string;
  definition: string;
  segment: "Renewal" | "NB";
  values: Record<PeriodKey, { value: string; planPct: number; planLabel: string; spark: number[] }>;
}

const myPerfMetrics: PerfMetric[] = [
  {
    id: "rn-gwp", label: "GWP", definition: "Gross Written Premium on bound renewal accounts",
    segment: "Renewal",
    values: {
      mtd:  { value: "$1.4M",  planPct: 101, planLabel: "Plan $1.4M",  spark: [1.1, 1.2, 1.3, 1.4] },
      qtd:  { value: "$3.1M",  planPct: 98,  planLabel: "Plan $3.2M",  spark: [1.4, 2.2, 2.7, 3.1] },
      ytd:  { value: "$11.8M", planPct: 103, planLabel: "Plan $11.5M", spark: [9.1, 9.8, 10.3, 10.9, 11.2, 11.5, 11.8] },
      l12m: { value: "$16.2M", planPct: 105, planLabel: "Plan $15.4M", spark: [13.1, 13.9, 14.7, 15.4, 15.8, 16.0, 16.2] },
    },
  },
  {
    id: "rn-quote", label: "Avg Sub Quote", definition: "Average premium quoted per renewal submission",
    segment: "Renewal",
    values: {
      mtd:  { value: "$109K", planPct: 104, planLabel: "Plan $105K", spark: [103, 106, 108, 109] },
      qtd:  { value: "$111K", planPct: 106, planLabel: "Plan $105K", spark: [105, 107, 110, 111] },
      ytd:  { value: "$112K", planPct: 107, planLabel: "Plan $105K", spark: [98, 101, 104, 106, 109, 111, 112] },
      l12m: { value: "$110K", planPct: 105, planLabel: "Plan $105K", spark: [97, 100, 103, 105, 108, 110, 110] },
    },
  },
  {
    id: "rn-bound", label: "Avg Sub Bound", definition: "Average premium on policies that reached bind",
    segment: "Renewal",
    values: {
      mtd:  { value: "$116K", planPct: 110, planLabel: "Plan $105K", spark: [110, 113, 115, 116] },
      qtd:  { value: "$117K", planPct: 111, planLabel: "Plan $105K", spark: [108, 112, 115, 117] },
      ytd:  { value: "$118K", planPct: 112, planLabel: "Plan $105K", spark: [101, 104, 108, 111, 114, 116, 118] },
      l12m: { value: "$115K", planPct: 110, planLabel: "Plan $105K", spark: [100, 103, 106, 109, 112, 114, 115] },
    },
  },
  {
    id: "nb-gwp", label: "GWP", definition: "Gross Written Premium on bound new business accounts",
    segment: "NB",
    values: {
      mtd:  { value: "$0.5M", planPct: 104, planLabel: "Plan $0.48M", spark: [0.3, 0.4, 0.45, 0.5] },
      qtd:  { value: "$1.2M", planPct: 100, planLabel: "Plan $1.2M",  spark: [0.5, 0.8, 1.0, 1.2] },
      ytd:  { value: "$4.2M", planPct: 108, planLabel: "Plan $3.9M",  spark: [2.1, 2.6, 3.0, 3.4, 3.7, 4.0, 4.2] },
      l12m: { value: "$5.8M", planPct: 103, planLabel: "Plan $5.6M",  spark: [4.2, 4.6, 5.0, 5.3, 5.5, 5.7, 5.8] },
    },
  },
  {
    id: "nb-quote", label: "Avg Sub Quote", definition: "Average premium quoted per new business submission",
    segment: "NB",
    values: {
      mtd:  { value: "$70K", planPct: 97, planLabel: "Plan $72K", spark: [71, 70, 70, 70] },
      qtd:  { value: "$69K", planPct: 96, planLabel: "Plan $72K", spark: [72, 71, 70, 69] },
      ytd:  { value: "$68K", planPct: 94, planLabel: "Plan $72K", spark: [74, 72, 71, 70, 69, 68, 68] },
      l12m: { value: "$69K", planPct: 96, planLabel: "Plan $72K", spark: [73, 72, 71, 70, 69, 69, 69] },
    },
  },
  {
    id: "nb-bound", label: "Avg Sub Bound", definition: "Average premium on new accounts that reached bind",
    segment: "NB",
    values: {
      mtd:  { value: "$73K", planPct: 101, planLabel: "Plan $72K", spark: [71, 72, 72, 73] },
      qtd:  { value: "$72K", planPct: 100, planLabel: "Plan $72K", spark: [74, 73, 73, 72] },
      ytd:  { value: "$71K", planPct: 99,  planLabel: "Plan $72K", spark: [75, 74, 73, 73, 72, 71, 71] },
      l12m: { value: "$72K", planPct: 100, planLabel: "Plan $72K", spark: [74, 73, 73, 72, 72, 72, 72] },
    },
  },
];

const teamPerfMetrics: PerfMetric[] = [
  {
    id: "rn-gwp", label: "GWP", definition: "Team-total Gross Written Premium on bound renewal accounts",
    segment: "Renewal",
    values: {
      mtd:  { value: "$4.9M",  planPct: 98,  planLabel: "Plan $5.0M",  spark: [3.8, 4.1, 4.5, 4.9] },
      qtd:  { value: "$11.2M", planPct: 97,  planLabel: "Plan $11.5M", spark: [4.9, 7.8, 9.8, 11.2] },
      ytd:  { value: "$38.4M", planPct: 102, planLabel: "Plan $37.6M", spark: [29, 31, 33, 35, 36, 37, 38.4] },
      l12m: { value: "$54.8M", planPct: 104, planLabel: "Plan $52.7M", spark: [44, 47, 49, 51, 52, 53, 54.8] },
    },
  },
  {
    id: "rn-quote", label: "Avg Sub Quote", definition: "Team average premium quoted per renewal submission",
    segment: "Renewal",
    values: {
      mtd:  { value: "$108K", planPct: 103, planLabel: "Plan $105K", spark: [104, 106, 107, 108] },
      qtd:  { value: "$109K", planPct: 104, planLabel: "Plan $105K", spark: [103, 105, 108, 109] },
      ytd:  { value: "$110K", planPct: 105, planLabel: "Plan $105K", spark: [96, 99, 102, 104, 107, 109, 110] },
      l12m: { value: "$108K", planPct: 103, planLabel: "Plan $105K", spark: [95, 98, 101, 103, 106, 107, 108] },
    },
  },
  {
    id: "rn-bound", label: "Avg Sub Bound", definition: "Team average premium on renewals that reached bind",
    segment: "Renewal",
    values: {
      mtd:  { value: "$114K", planPct: 109, planLabel: "Plan $105K", spark: [108, 110, 112, 114] },
      qtd:  { value: "$115K", planPct: 110, planLabel: "Plan $105K", spark: [107, 110, 113, 115] },
      ytd:  { value: "$116K", planPct: 110, planLabel: "Plan $105K", spark: [100, 103, 107, 109, 112, 114, 116] },
      l12m: { value: "$113K", planPct: 108, planLabel: "Plan $105K", spark: [98, 101, 104, 107, 110, 112, 113] },
    },
  },
  {
    id: "nb-gwp", label: "GWP", definition: "Team-total Gross Written Premium on bound new business",
    segment: "NB",
    values: {
      mtd:  { value: "$1.7M",  planPct: 103, planLabel: "Plan $1.65M", spark: [1.1, 1.3, 1.5, 1.7] },
      qtd:  { value: "$4.0M",  planPct: 102, planLabel: "Plan $3.9M",  spark: [1.7, 2.6, 3.4, 4.0] },
      ytd:  { value: "$14.1M", planPct: 106, planLabel: "Plan $13.3M", spark: [7.2, 8.8, 10.2, 11.4, 12.4, 13.3, 14.1] },
      l12m: { value: "$19.4M", planPct: 104, planLabel: "Plan $18.7M", spark: [14, 15.2, 16.4, 17.4, 18, 18.8, 19.4] },
    },
  },
  {
    id: "nb-quote", label: "Avg Sub Quote", definition: "Team average premium quoted per new business submission",
    segment: "NB",
    values: {
      mtd:  { value: "$69K", planPct: 96, planLabel: "Plan $72K", spark: [72, 71, 70, 69] },
      qtd:  { value: "$70K", planPct: 97, planLabel: "Plan $72K", spark: [73, 72, 71, 70] },
      ytd:  { value: "$71K", planPct: 99, planLabel: "Plan $72K", spark: [75, 74, 73, 73, 72, 71, 71] },
      l12m: { value: "$70K", planPct: 97, planLabel: "Plan $72K", spark: [74, 73, 72, 71, 70, 70, 70] },
    },
  },
  {
    id: "nb-bound", label: "Avg Sub Bound", definition: "Team average premium on new accounts that reached bind",
    segment: "NB",
    values: {
      mtd:  { value: "$74K", planPct: 103, planLabel: "Plan $72K", spark: [71, 72, 73, 74] },
      qtd:  { value: "$73K", planPct: 101, planLabel: "Plan $72K", spark: [74, 73, 73, 73] },
      ytd:  { value: "$73K", planPct: 101, planLabel: "Plan $72K", spark: [76, 75, 74, 73, 73, 73, 73] },
      l12m: { value: "$73K", planPct: 101, planLabel: "Plan $72K", spark: [76, 75, 74, 73, 73, 73, 73] },
    },
  },
];

// ── Performance KPI card ─────────────────────────────────────────
function PerfKPICard({ m, period }: { m: PerfMetric; period: PeriodKey }) {
  const v = m.values[period];
  const segColor = m.segment === "NB" ? "#00205B" : "#0076BC";
  const onPlan = v.planPct >= 100;

  return (
    <div className="bg-white rounded-2xl border border-[#E8EDF5] p-4 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" }}>
      {/* Header row */}
      <div>
        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white tracking-wide mb-1.5"
          style={{ backgroundColor: segColor }}>
          {m.segment === "NB" ? "New Business" : "Renewal"}
        </span>
        <div className="text-[13px] font-bold leading-none" style={{ color: "#0D1B2E" }}>{m.label}</div>
        <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "#94A3B8" }}>{m.definition}</div>
      </div>

      {/* Value */}
      <div className="text-[28px] font-bold leading-none" style={{ color: "#0D1B2E", letterSpacing: "-1px" }}>
        {v.value}
      </div>

      {/* Plan attainment bar */}
      <div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2FF" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(v.planPct, 100)}%`, backgroundColor: onPlan ? "#0076BC" : "#F97316" }} />
        </div>
        <div className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>{v.planLabel}</div>
      </div>
    </div>
  );
}

// ── Hub: Performance page ────────────────────────────────────────
export function HubPerformancePage() {
  const [view, setView] = useState<"my" | "team">("my");
  const [period, setPeriod] = useState<PeriodKey>("ytd");

  const metrics = view === "my" ? myPerfMetrics : teamPerfMetrics;
  const activePeriod = PERIODS.find(p => p.key === period)!;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "#F9FAFB" }}>
      {/* ── Header bar ── */}
      <div className="px-6 pt-3 pb-4 border-b border-[#E8EDF5] bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
            <TrendingUp style={{ width: 14, height: 14, color: "white" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Team Performance</div>
            <div className="text-[11px]" style={{ color: "#6B7280" }}>
              {activePeriod.range} · {view === "my" ? "Mike Farrell" : "Full Team"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* My / Team toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-[#E0E8FF]"
              style={{ backgroundColor: "#F8FBFF" }}>
              {(["my", "team"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={view === v
                    ? { backgroundColor: "white", color: "#00205B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { color: "#94A3B8" }}>
                  {v === "my" ? "My Performance" : "Team Performance"}
                </button>
              ))}
            </div>

            {/* Date range tabs */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-[#E0E8FF]"
              style={{ backgroundColor: "#F8FBFF" }}>
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={period === p.key
                    ? { backgroundColor: "#00205B", color: "white", boxShadow: "0 1px 4px rgba(0,32,91,0.3)" }
                    : { color: "#94A3B8" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <BackButton />
        </div>
      </div>

      {/* ── Period context banner ── */}
      <div className="px-6 py-2.5 flex items-center gap-2 border-b border-[#F0F4FF] flex-shrink-0"
        style={{ backgroundColor: "#F8FBFF" }}>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
        <span className="text-[11px]" style={{ color: "#4A6080" }}>
          <span className="font-semibold" style={{ color: "#0D1B2E" }}>{activePeriod.label}</span>
          {" "}— {activePeriod.range}.{" "}
          {view === "my"
            ? "Metrics reflect Mike Farrell's assigned submissions only."
            : "Metrics reflect all underwriters on the Commercial Property team."}
        </span>
      </div>

      {/* ── KPI grid ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Renewal section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0076BC" }} />
            <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#0076BC" }}>
              Renewal
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E8EDF5" }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {metrics.filter(m => m.segment === "Renewal").map(m => (
              <PerfKPICard key={m.id} m={m} period={period} />
            ))}
          </div>
        </div>

        {/* New Business section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00205B" }} />
            <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#00205B" }}>
              New Business
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E8EDF5" }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {metrics.filter(m => m.segment === "NB").map(m => (
              <PerfKPICard key={m.id} m={m} period={period} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hub: Portfolio & Distribution page ───────────────────────────
export function HubPortfolioPage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "#F9FAFB" }}>
      <HubPageHeader title="Portfolio & Distribution" subtitle="Mix breakdown and distributor performance" icon={BarChart2} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-3">
          <BrokerMixTile label="Distribution Mix – Renewal" data={distMixRn} />
          <BrokerMixTile label="Distribution Mix – New Business" data={distMixNB} />
          <HazardMixTile data={hazardMix} />
        </div>
      </div>
    </div>
  );
}

// ── Hub: Recommended Actions page ───────────────────────────────
export function HubActionsPage() {
  const router = useRouter();
  const [detailId, setDetailId] = useState<string | null>(null);
  useDetailOpen(!!detailId);
  const openSubmission = useCallback((id: string) => setDetailId(id), []);
  useEffect(() => {
    const handler = () => setDetailId(null);
    window.addEventListener("closeDetailView", handler);
    return () => window.removeEventListener("closeDetailView", handler);
  }, []);

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: "#F9FAFB" }}>
      {detailId && (
        <div className="absolute inset-0 z-20 overflow-auto bg-white">
          <SubmissionAnalysis submissionId={detailId} onClose={() => setDetailId(null)} />
        </div>
      )}
      <HubPageHeader title="Recommended Actions" subtitle="AI-prioritised action items for your queue" icon={Sparkles} />
      <div className="flex-1 overflow-hidden">
        <RecommendedActionsContent onOpen={openSubmission} />
      </div>
    </div>
  );
}

// ── Hub: Group Inbox page ────────────────────────────────────────
export function HubInboxPage() {
  const [initialEmailId, setInitialEmailId] = useState<string | null>(null);
  useEffect(() => {
    const pending = sessionStorage.getItem("inboxEmailId");
    if (pending) {
      sessionStorage.removeItem("inboxEmailId");
      setInitialEmailId(pending);
    }
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "#F9FAFB" }}>
      <HubPageHeader
        title="NA-CommercialProperty-PROD"
        subtitle="Shared team inbox — broker submissions and follow-ups"
        icon={Mail}
        gradient="linear-gradient(135deg, #4F46E5, #0076BC)"
      />
      <div className="flex-1 overflow-hidden">
        <GroupInboxContent initialEmailId={initialEmailId} />
      </div>
    </div>
  );
}

// ── Shared tile hover handler ────────────────────────────────────
function tileHover(on: boolean) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      if (on) {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,32,91,0.11)";
        (e.currentTarget as HTMLElement).style.borderColor = "#B3D4F0";
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.04)";
      (e.currentTarget as HTMLElement).style.borderColor = "#E8EDF5";
    },
  };
}

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

// ── Hub ─────────────────────────────────────────────────────────
export function Hub() {
  const router = useRouter();
  const [detailId, setDetailId] = useState<string | null>(null);
  useDetailOpen(!!detailId);
  const openSubmission = useCallback((id: string) => setDetailId(id), []);
  const closeSubmission = useCallback(() => setDetailId(null), []);
  useEffect(() => {
    const handler = () => setDetailId(null);
    window.addEventListener("closeDetailView", handler);
    return () => window.removeEventListener("closeDetailView", handler);
  }, []);

  return (
    <div className="h-full overflow-auto relative" style={{ backgroundColor: "#F9FAFB" }}>
      {detailId && (
        <div className="absolute inset-0 z-20 overflow-auto bg-white">
          <SubmissionAnalysis submissionId={detailId} onClose={closeSubmission} />
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">

        {/* ── 2 × 2 Tile Grid ── */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >

          <TileRecommendedActions onOpen={openSubmission} />
          <TilePortfolioPerformance />
          <TileDistributionPerformance />
          <TileInbox />
          <TilePrioritySubmissions onOpen={openSubmission} />

        </motion.div>

        {/* ── More Features Coming Soon ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08 }}
          className="rounded-2xl border border-dashed border-[#C2DFF4] flex flex-col items-center justify-center py-8 gap-3"
          style={{ backgroundColor: "#F0F7FF" }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EEF6FF, #C2DFF4)" }}>
            <Sparkles style={{ width: 14, height: 14, color: "#0076BC" }} />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-bold tracking-tight" style={{ color: "#00205B" }}>More Features Coming Soon</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#6B87A8" }}>Additional hub modules are on the way</div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}


