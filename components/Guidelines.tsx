"use client";
import { useState, useMemo } from "react";
import {
  Shield, ChevronDown, ChevronUp, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronRight, Building2, AlertTriangle, BadgeCheck, User, UserCheck, Briefcase, Calendar, CalendarCheck,
} from "lucide-react";
import { Agents } from "./Agents";

// ── Agent config ──────────────────────────────────────────────────
const AGENTS = [
  { id: "orchestration", name: "Orchestration Agent",            color: "#00205B", guidelines: ["Overall Appetite"] },
  { id: "ingestion",     name: "Ingestion Agent",               color: "#0076BC", guidelines: ["Perils Written", "TIV Limits", "Geography", "Capacity by Peril"] },
  { id: "intelligence",  name: "Intelligence & Reasoning Agent", color: "#20A8E0", guidelines: ["Overall Appetite", "Coverage Type", "Perils Written", "TIV Limits", "Geography", "Territory", "Capacity by Peril", "Deductibles", "Occupancy", "Pricing"] },
  { id: "docsum",        name: "Document Summarization Agent",   color: "#0090DC", guidelines: ["Territory", "Deductibles", "Pricing", "Coverage Forms"] },
];

// ── aiTag → canonical guideline name (for occupancy/coverage sub-tags) ───────
const AGTAG_CANONICAL: Record<string, string> = {
  "In Scope": "Occupancy", "Limited": "Occupancy", "Out of Scope": "Occupancy",
  "Acceptable Forms": "Coverage Forms", "Mandatory Endorsements": "Coverage Forms", "Exclusions": "Coverage Forms",
};

// ── Build aiTag → [agentId] map ───────────────────────────────────
const AGTAG_TO_AGENTS: Record<string, string[]> = {};
for (const agent of AGENTS) {
  for (const gl of agent.guidelines) {
    AGTAG_TO_AGENTS[gl] = [...(AGTAG_TO_AGENTS[gl] ?? []), agent.id];
  }
}

function getAgentColors(aiTag?: string): string[] {
  if (!aiTag) return [];
  const canonical = AGTAG_CANONICAL[aiTag] ?? aiTag;
  return (AGTAG_TO_AGENTS[canonical] ?? []).map(id => AGENTS.find(a => a.id === id)?.color ?? "#0076BC");
}

// ── Types ──────────────────────────────────────────────────────────
interface GuidelineRow {
  id: string;
  text: string;
  active: boolean;
  aiTag?: string;
  value?: string;
  pct?: number;
}

type SectionType = "appetite" | "list" | "peril-bars" | "deductible-table" | "occupancy" | "pricing" | "coverage-forms";

interface Section {
  num: number;
  title: string;
  subtitle: string;
  type: SectionType;
  items: GuidelineRow[];
  note?: string;
}

// ── Section data ──────────────────────────────────────────────────
const INITIAL_SECTIONS: Section[] = [
  {
    num: 1, type: "appetite",
    title: "Overall Appetite & Program Structure",
    subtitle: "Fundamental program parameters and scope",
    items: [
      { id: "s1-1", text: "All Risk Commercial Property",                    active: true,  aiTag: "Coverage Type" },
      { id: "s1-2", text: "Shared & Layered (Primary, Quota Share, Excess)", active: true },
      { id: "s1-3", text: "All Perils Only",                                 active: true,  aiTag: "Perils Written" },
      { id: "s1-4", text: "No DIC / Mono-Line",                              active: false },
      { id: "s1-5", text: "$500M minimum TIV",                               active: true,  aiTag: "TIV Limits" },
      { id: "s1-6", text: "No Maximum",                                      active: true },
      { id: "s1-7", text: "U.S. Domiciled Risks",                            active: true,  aiTag: "Geography" },
      { id: "s1-8", text: "Incidental PR / USVI",                            active: true },
    ],
  },
  {
    num: 2, type: "list",
    title: "Territory & Structure",
    subtitle: "Allowed structural arrangements",
    items: [
      { id: "s2-1", text: "Domestic policy (U.S.)",                          active: true,  aiTag: "Territory" },
      { id: "s2-2", text: "Fronted international exposure with MURA",        active: false, aiTag: "Territory" },
      { id: "s2-3", text: "Separate policy numbers by territory",             active: true,  aiTag: "Territory" },
    ],
  },
  {
    num: 3, type: "peril-bars",
    title: "Capacity by Peril (Visual Ranges)",
    subtitle: "Maximum net limits by catastrophe exposure",
    items: [
      { id: "s3-1", text: "Fire",                                             active: true,  aiTag: "Capacity by Peril", value: "$50M", pct: 100 },
      { id: "s3-2", text: "Earthquake / Earth Movement (Critical States)",    active: true,  aiTag: "Capacity by Peril", value: "$10M", pct: 20 },
      { id: "s3-3", text: "Named Windstorm (Tier 1)",                         active: true,  aiTag: "Capacity by Peril", value: "$10M", pct: 20 },
      { id: "s3-4", text: "Flood (SFHA)",                                     active: true,  aiTag: "Capacity by Peril", value: "$10M", pct: 20 },
    ],
  },
  {
    num: 4, type: "deductible-table",
    title: "Deductible Spectrum by Hazard",
    subtitle: "Typical deductible ranges by peril category",
    items: [
      { id: "s4-1", text: "Non-CAT",         active: true, aiTag: "Deductibles", value: "$25K – $100K+" },
      { id: "s4-2", text: "Earthquake",      active: true, aiTag: "Deductibles", value: "$100K or 2-5%" },
      { id: "s4-3", text: "Named Windstorm", active: true, aiTag: "Deductibles", value: "$100K or 3-5%" },
      { id: "s4-4", text: "Flood",           active: true, aiTag: "Deductibles", value: "$100K (Excess NFIP)" },
    ],
  },
  {
    num: 5, type: "occupancy",
    title: "Occupancy Appetite Classification",
    subtitle: "Risk class segmentation by business type",
    items: [
      { id: "s5-1",  text: "Office & Professional Services",  active: true,  aiTag: "In Scope" },
      { id: "s5-2",  text: "Healthcare (Non-Hazardous)",      active: true },
      { id: "s5-3",  text: "Retail / Wholesale",              active: true },
      { id: "s5-4",  text: "Education & Municipal",           active: true },
      { id: "s5-5",  text: "Habitational (Partial)",          active: true,  aiTag: "Limited" },
      { id: "s5-6",  text: "Hotels, Restaurants",             active: true },
      { id: "s5-7",  text: "Light Manufacturing",             active: true },
      { id: "s5-8",  text: "Chemicals & Energy",              active: false, aiTag: "Out of Scope" },
      { id: "s5-9",  text: "Mining, Rail, Agriculture",       active: false },
      { id: "s5-10", text: "Builders Risk / Construction",    active: false },
    ],
  },
  {
    num: 6, type: "pricing",
    title: "Pricing & Commission Guidance",
    subtitle: "Commission structure and minimum premium requirements",
    note: "Significant deviations require referral to Head of Commercial Property.",
    items: [
      { id: "s6-1", text: "Minimum Premium",      active: true, aiTag: "Pricing", value: "$50,000" },
      { id: "s6-2", text: "Retail Commission",    active: true, aiTag: "Pricing", value: "10% – 15%" },
      { id: "s6-3", text: "Wholesale Commission", active: true, aiTag: "Pricing", value: "15% – 17.5%" },
    ],
  },
  {
    num: 7, type: "coverage-forms",
    title: "Coverage Forms & Endorsements",
    subtitle: "Acceptable policy forms and required endorsements",
    items: [
      { id: "s7-1", text: "Manuscript / Broker Form",                        active: true,  aiTag: "Acceptable Forms" },
      { id: "s7-2", text: "Carrier Form",                                    active: true },
      { id: "s7-3", text: "Commercial Property Follow / Excess Forms",       active: true },
      { id: "s7-4", text: "LMA 5393",                                        active: true,  aiTag: "Mandatory Endorsements" },
      { id: "s7-5", text: "LMA 5400 / 5401 (No amendments)",                active: false },
      { id: "s7-6", text: "No Cyber, Crisis Management, Non-Physical Damage", active: false, aiTag: "Exclusions" },
    ],
  },
];

// ── Group helper ──────────────────────────────────────────────────
type Group = { title: string; items: GuidelineRow[] };
function groupByCategory(items: GuidelineRow[]): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;
  for (const item of items) {
    if (item.aiTag && (cur === null || cur.title !== item.aiTag)) {
      cur = { title: item.aiTag, items: [item] };
      groups.push(cur);
    } else if (cur) {
      cur.items.push(item);
    } else {
      cur = { title: "", items: [item] };
      groups.push(cur);
    }
  }
  return groups;
}

// ── Compute unique agents for an entire section ───────────────────
function getSectionAgents(section: Section): typeof AGENTS[number][] {
  const seen = new Set<string>();
  const agents: typeof AGENTS[number][] = [];
  for (const item of section.items) {
    if (!item.aiTag) continue;
    const canonical = AGTAG_CANONICAL[item.aiTag] ?? item.aiTag;
    for (const agentId of AGTAG_TO_AGENTS[canonical] ?? []) {
      if (!seen.has(agentId)) {
        seen.add(agentId);
        const agent = AGENTS.find(a => a.id === agentId);
        if (agent) agents.push(agent);
      }
    }
  }
  return agents;
}

function getSectionAgentColors(section: Section): string[] {
  return getSectionAgents(section).map(a => a.color);
}

// ── Agent dot indicators ─────────────────────────────────────────
function Dots({ colors = [] }: { colors?: string[] }) {
  if (!colors || colors.length === 0) return null;
  return (
    <div className="flex gap-1 flex-shrink-0">
      {colors.map((color, i) => (
        <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

// ── Section body renderers ────────────────────────────────────────

// 1. Card-grid (Overall Appetite)
function AppetiteBody({ items }: { items: GuidelineRow[] }) {
  const groups = groupByCategory(items);
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        {groups.map((g, i) => {
          return (
            <div key={g.title || i} className="rounded-xl p-4" style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB" }}>
              {g.title && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{g.title}</span>
                </div>
              )}
              <div className="space-y-1.5 mb-4">
                {g.items.map(item => (
                  <div key={item.id} className="text-[13px] leading-snug"
                    style={{ color: item.active ? "#374151" : "#DC2626" }}>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Flat list
function ListBody({ items }: { items: GuidelineRow[] }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id}
          className="flex items-center gap-3 px-5 py-2.5 border-b border-[#F1F5F9] last:border-b-0">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0"
            style={{ color: item.active ? "#22C55E" : "#D1D5DB" }} />
          <span className="flex-1 text-[13px] leading-snug"
            style={{ color: item.active ? "#111827" : "#9CA3AF" }}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// 3. Peril bars
function PerilBarsBody({ items }: { items: GuidelineRow[] }) {
  return (
    <div className="px-5 py-3">
      {items.map(item => (
        <div key={item.id} className="mb-4 last:mb-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "#374151" }}>{item.text}</span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full flex items-center justify-end pr-3"
              style={{ width: `${item.pct ?? 20}%`, backgroundColor: "#0076BC", minWidth: "80px" }}
            >
              <span className="text-[11px] font-bold text-white">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 4. Deductible table
function DeductibleTableBody({ items }: { items: GuidelineRow[] }) {
  return (
    <div>
      <div className="grid px-5 py-2 border-b border-[#E5E7EB]"
        style={{ gridTemplateColumns: "1fr 1fr", backgroundColor: "#F8FAFC" }}>
        {["PERIL", "TYPICAL RANGE"].map(h => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</span>
        ))}
      </div>
      {items.map(item => (
        <div key={item.id} className="grid px-5 py-2.5 border-b border-[#F1F5F9] last:border-b-0 items-center"
          style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>{item.text}</span>
          </div>
          <span className="text-[13px]" style={{ color: "#374151" }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// 5. Occupancy 3-column cards
const OCCUPANCY_STYLE: Record<string, { badge: string; dot: string; border: string }> = {
  "In Scope":     { badge: "text-[#15803D] bg-[#DCFCE7] border-[#BBF7D0]", dot: "#22C55E",  border: "#E5E7EB" },
  "Limited":      { badge: "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]", dot: "#F59E0B",  border: "#E5E7EB" },
  "Out of Scope": { badge: "text-[#B91C1C] bg-[#FEE2E2] border-[#FECACA]", dot: "#EF4444",  border: "#E5E7EB" },
};

function OccupancyBody({ items }: { items: GuidelineRow[] }) {
  const groups = groupByCategory(items);
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-3 gap-3">
        {groups.map(g => {
          const st = OCCUPANCY_STYLE[g.title] ?? OCCUPANCY_STYLE["In Scope"];
          return (
            <div key={g.title} className="rounded-xl p-3" style={{ border: `1px solid ${st.border}` }}>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mb-2.5 border ${st.badge}`}>
                {g.title}
              </div>
              <div className="space-y-1.5 mb-3">
                {g.items.map(item => (
                  <div key={item.id}>
                    <span className="text-[12px] leading-snug" style={{ color: "#374151" }}>• {item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. Pricing tiles
function PricingBody({ items, note }: { items: GuidelineRow[]; note?: string }) {
  return (
    <div className="px-5 py-2">
      <div className="divide-y divide-[#F1F5F9]">
        {items.map(item => (
          <div key={item.id} className="py-2.5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{item.text}</span>
            </div>
            <div className="text-[17px] font-bold" style={{ color: "#111827", letterSpacing: "-0.4px" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      {note && (
        <div className="mt-2 mb-1 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <span className="text-[12px]" style={{ color: "#92400E" }}>{note}</span>
        </div>
      )}
    </div>
  );
}

// 7. Coverage forms with category headers
function CoverageFormsBody({ items }: { items: GuidelineRow[] }) {
  const groups = groupByCategory(items);
  return (
    <div>
      {groups.map(g => (
        <div key={g.title}>
          {g.title && g.title !== "Exclusions" && (
            <div className="px-5 py-2 border-b border-[#E5E7EB]"
              style={{ backgroundColor: "#F8FAFC" }}>
              <span className="text-[13px] font-bold" style={{ color: "#111827" }}>{g.title}</span>
            </div>
          )}
          {g.items.map(item => {
            if (g.title === "Exclusions") {
              return (
                <div key={item.id} className="px-5 py-2.5"
                  style={{ backgroundColor: "#FFF5F5" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#DC2626" }}>{item.text}</span>
                </div>
              );
            }
            return (
              <div key={item.id}
                className="flex items-center gap-3 px-5 py-2.5 border-b border-[#F1F5F9] last:border-b-0">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0"
                  style={{ color: item.active ? "#22C55E" : "#D1D5DB" }} />
                <span className="flex-1 text-[13px] leading-snug"
                  style={{ color: item.active ? "#111827" : "#9CA3AF" }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Section accordion ─────────────────────────────────────────────
function SectionCard({
  section, expanded, onToggle, sectionAgents,
}: {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
  sectionAgents: typeof AGENTS[number][];
}) {
  const agentColors = sectionAgents.map(a => a.color);

  const body = (() => {
    switch (section.type) {
      case "appetite":         return <AppetiteBody items={section.items} />;
      case "list":             return <ListBody items={section.items} />;
      case "peril-bars":       return <PerilBarsBody items={section.items} />;
      case "deductible-table": return <DeductibleTableBody items={section.items} />;
      case "occupancy":        return <OccupancyBody items={section.items} />;
      case "pricing":          return <PricingBody items={section.items} note={section.note} />;
      case "coverage-forms":   return <CoverageFormsBody items={section.items} />;
      default:                 return null;
    }
  })();

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden"
      style={{
        borderColor: expanded ? "#CBD5E1" : "#E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Accordion header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 hover:bg-[#FAFCFF] transition-colors text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-snug" style={{ color: "#111827" }}>
              {section.num}. {section.title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{section.subtitle}</div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
            {expanded
              ? <ChevronUp className="w-5 h-5" style={{ color: "#6B7280" }} />
              : <ChevronDown className="w-5 h-5" style={{ color: "#9CA3AF" }} />
            }
          </div>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-[#F1F5F9]">
          {body}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export function Guidelines() {
  const [activeTab, setActiveTab] = useState<"guidelines" | "authority" | "agents">("guidelines");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = (num: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: "#F9FAFB" }}>
      <div>
        {/* Tabs */}
        <div className="bg-white border-b border-[#C5D4E8] px-8">
          <div className="flex gap-8">
            {([
              { id: "guidelines", label: "Guidelines" },
              { id: "authority",  label: "Authority" },
              { id: "agents",     label: "AI Agents" },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="pb-3 pt-3.5 text-[13px] border-b-2 transition-colors"
                style={{
                  fontWeight: activeTab === tab.id ? 700 : 450,
                  borderBottomColor: activeTab === tab.id ? "#0076BC" : "transparent",
                  color: activeTab === tab.id ? "#0076BC" : "#94A3B8",
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "guidelines" && (
          <div className="p-6">
            {/* Admin Access banner */}
            <div className="flex items-center gap-4 mb-5 px-5 py-4 rounded-2xl border border-[#C2DFF4]"
              style={{ backgroundColor: "#EEF6FF" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#0076BC,#00205B)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Admin Access</div>
                <div className="text-[12px]" style={{ color: "#4A6080" }}>
                  Underwriting Guidelines are as of October 2026. Workflow capabilities for updating them in the Underwriting HUB for the Head of Commercial Property are coming in future releases.
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {INITIAL_SECTIONS.map(section => (
                <SectionCard
                  key={section.num}
                  section={section}
                  expanded={expandedSections.has(section.num)}
                  onToggle={() => toggleSection(section.num)}
                  sectionAgents={getSectionAgents(section)}
                />
              ))}
            </div>
          </div>
        )}
        {activeTab === "authority" && (
          <div className="p-6">
            <AuthorityView />
          </div>
        )}
        {activeTab === "agents" && (
          <div className="flex-1 overflow-auto">
            <Agents />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Underwriting Extensions and Restrictions ──────────────────────
type UWExtRow = {
  division: string;
  region: string;
  type: string;
  description: string;
  currency: string;
  monetaryLimits: string;
  units: string;
  comment: string;
};

const UW_EXT_DATA: UWExtRow[] = [
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Assumed Facultative Reinsurance",
    currency: "", monetaryLimits: "", units: "",
    comment: "Authority to write assumed reinsurance. May not be delegated beyond Cell Leader without CUO Approval.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Ceded Facultative Reinsurance",
    currency: "", monetaryLimits: "", units: "",
    comment: "All placements must adhere to the NAO Ceded Facultative Reinsurance Guidelines. Use of reinsurers must comply with Group Security Committee (GSC) guidelines which require that any use of unapproved reinsurers, or use of an approved reinsurer for an unapproved class of business, requires prior approval from the Group Security Committee. These guidelines are available in the CUO section of the Underwriting Resource Center (URC). Delegation of this authority beyond Cell Leaders requires DCUO approval.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Collateral as per Group Security Committee Guidelines",
    currency: "", monetaryLimits: "", units: "",
    comment: "Authorised",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Insurance/reinsurance Contract and policy wording",
    currency: "", monetaryLimits: "", units: "",
    comment: "In accordance with business plans and treaty reinsurance programs authority is granted to approve drafting of policy documentation, policy holder notices, manuscripts and wordings for general application. Where the treaty is exposed, policy wordings must be consistent with the terms of the treaty reinsurance programs purchased. Where there is no treaty exposure, risks are subject to the maximum net line restriction. Authority to approve drafting of reinsurance policy wording is prohibited for ceded reinsurance and assumed reinsurance portfolios. Authority to approve policy wording for excess coverage over captives is granted.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Multinational",
    currency: "", monetaryLimits: "", units: "",
    comment: "When acting as the servicing office for multinational placements you are deemed to assume the authority limits of the producing office underwriter, enabling you to issue local policies with limits exceeding your own authority as per the QBE multinational underwriting guide. For both New and Renewal accounts that qualify and are written using Commercial Deregulation, Insurance Services Office (ISO) Rule 14, 15, or 34, or NY Free Trade Zone, a maximum credit of 35% off manual premium is allowed. Manual premium is defined as the Manual ISO premium after application of the Experience Modification factor. For all other accounts, the underwriter must follow the state specific schedule modification credit/debit plan. Any exceptions to this guidance requires prior approved from the DCUO. If asked to issue a policy that exceeds the regulatory and/or licensing standards, laws and limits of the country than this should refer to your divisional chief underwriting office to liaise with the chief underwriting officer of the producing office to resolve. All other local policy requests should be dealt with in accordance with producing office instructions.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Multinational",
    currency: "", monetaryLimits: "", units: "",
    comment: "You may accept risks using the Multinational proposition in line with the Multinational underwriting Guide.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Underwriting-related agreements with third parties",
    currency: "", monetaryLimits: "", units: "",
    comment: "This authority is subject to: adherence to the QBE Group Delegated Underwriting Authorities Standard; prior approval by the GCUO for any underwriting-related contracts where the annualised GWP is anticipated to exceed 3% of your Division's budgeted GWP; prior approval by the GCUO of any exclusive underwriting agency contracts, and the GCEO of any other non-underwriting exclusive agency contracts. Material variances to be signed off by the appropriate divisional product manager (or equivalent) and the Divisional Chief Underwriting Officer (or equivalent) after appropriate consultation with the relevant compliance, technical and/or legal representatives.",
  },
  {
    division: "NA", region: "", type: "Underwriting Extension",
    description: "Underwriting-related agreements with third parties — Commission increase of up to:",
    currency: "USD", monetaryLimits: "5", units: "Points",
    comment: "",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Exclusions",
    currency: "", monetaryLimits: "", units: "",
    comment: "Any new or renewing business of the following types requires prior written approval of the GCUO. In the event where the GCUO is intending to agree a referral or take on risk outside of GCUO's authority then the GCRO is required to endorse prior to approval by the GCEO. Nuclear perils arising from the design, build, operation/maintenance, or decommissioning of a Nuclear Energy Reactor, components specifically designed for use in them or clients providing professional advice to the Nuclear sector, unless back to back treaty reinsurance is in place. Financial guarantee, other than trade credit, consumer credit, surety and performance bond. Participation or membership in any pool and the reinsurance of such pools, except residual market mechanisms formed to provide coverage for Automobile Physical Damage, inter-agency or inter-government joint UW created by or permitted by statute, or a compulsory requirement. This exception does not apply to nuclear insurance pools, oil gas, or petrol-chemical plants, oil or gas drilling, or aviation risks. Ceded or Facultative Reinsurance restrictions do not apply to policies issued to a captive insurance company. Gradual pollution. Asbestos, Lead, Per- And Polyfluoroalkyl Substances (PFAS), climate change exclusions to higher hazard risks as outlined in the Divisional Underwriting guidelines. Retrospective liability extensions in respect of incurred but not reported, known or reported claims (not applicable to claims made contracts). Whole account stop loss policies, except for Health business.",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Gross and Net delegated aggregate limits on a management basis (excluding quota shares to Equator Re)",
    currency: "", monetaryLimits: "", units: "",
    comment: "Should you anticipate exceeding these limits you should discuss with the GCUO in order that QBE Group may remain within target limits overall.",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Insurance/reinsurance Contract and policy wording",
    currency: "", monetaryLimits: "", units: "",
    comment: "No authority to manuscript or draft policy and/or form language.",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Maximum net line size where there is no treaty protection",
    currency: "USD", monetaryLimits: "20,000,000", units: "Any one risk",
    comment: "",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Maximum Premium — New Individual Risk",
    currency: "USD", monetaryLimits: "5,000,000", units: "GWP",
    comment: "",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Maximum Premium — Renewal Individual Risk",
    currency: "USD", monetaryLimits: "10,000,000", units: "GWP",
    comment: "",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Period of Coverage for any One Insurance/reinsurance policy",
    currency: "USD", monetaryLimits: "2", units: "Years",
    comment: "Plus odd time",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Period of Coverage — Construction, Engineering and Associated Project Professional Indemnity and Liability policies",
    currency: "USD", monetaryLimits: "10", units: "Years",
    comment: "Plus the Statute of Repose period",
  },
  {
    division: "NA", region: "", type: "Underwriting Restriction",
    description: "Period of Coverage — Other business where conventional market practice includes longer periods",
    currency: "USD", monetaryLimits: "10", units: "Years",
    comment: "",
  },
];

// ── UW Extensions table ──────────────────────────────────────────
type SortDir = "asc" | "desc" | null;
type ExtSortKey = "division" | "monetaryLimits" | null;

function UWExtensionsTable() {
  const [sortKey, setSortKey] = useState<ExtSortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpand(i: number) {
    setExpanded(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  function handleSort(col: NonNullable<ExtSortKey>) {
    if (sortKey !== col) { setSortKey(col); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir(null); }
  }

  const indexed = useMemo(() => UW_EXT_DATA.map((r, i) => ({ ...r, _i: i })), []);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return indexed;
    return [...indexed].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [indexed, sortKey, sortDir]);

  const extensions   = sorted.filter(r => r.type === "Underwriting Extension");
  const restrictions = sorted.filter(r => r.type === "Underwriting Restriction");

  function ColHeader({ col, label, w }: { col?: NonNullable<ExtSortKey>; label: string; w?: string }) {
    const active = col && sortKey === col;
    return (
      <th className="px-3 py-2.5 text-left border-b border-[#E8EDF4] whitespace-nowrap"
        style={w ? { width: w } : undefined}>
        {col ? (
          <button onClick={() => handleSort(col)}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: active ? "#0076BC" : "#94A3B8" }}>
            {label}
            {active && sortDir === "asc"  ? <ArrowUp className="w-3 h-3" />
             : active && sortDir === "desc" ? <ArrowDown className="w-3 h-3" />
             : <ArrowUpDown className="w-3 h-3 opacity-30" />}
          </button>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{label}</span>
        )}
      </th>
    );
  }

  function TableBody({ rows }: { rows: (UWExtRow & { _i: number })[] }) {
    const TYPE_BADGE: Record<string, { bg: string; text: string; border: string; short: string }> = {
      "Underwriting Extension":   { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0", short: "Extension" },
      "Underwriting Restriction": { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA", short: "Restriction" },
    };
    return (
      <tbody>
        {rows.map(row => {
          const isExp = expanded.has(row._i);
          const hasLong = row.comment.length > 160;
          const badge = TYPE_BADGE[row.type];
          return (
            <tr key={row._i}
              className="border-b last:border-b-0"
              style={{ borderColor: "#EEF2F7" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FAFBFE")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
              <td className="px-3 py-3 align-top text-[12px]" style={{ color: "#4A6080" }}>{row.division}</td>
              <td className="px-3 py-3 align-top text-[12px]" style={{ color: "#4A6080" }}>{row.region}</td>
              <td className="px-3 py-3 align-top whitespace-nowrap">
                {badge && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                    style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}>
                    {badge.short}
                  </span>
                )}
              </td>
              <td className="px-3 py-3 align-top">
                <span className="text-[12px] leading-snug" style={{ color: "#0D1B2E" }}>{row.description}</span>
              </td>
              <td className="px-3 py-3 align-top text-[12px]" style={{ color: "#4A6080" }}>{row.currency}</td>
              <td className="px-3 py-3 align-top text-[12px] font-bold tabular-nums" style={{ color: "#0D1B2E" }}>{row.monetaryLimits}</td>
              <td className="px-3 py-3 align-top text-[12px]" style={{ color: "#4A6080" }}>{row.units}</td>
              <td className="px-3 py-3 align-top">
                {row.comment ? (
                  <div>
                    <p className="text-[12px] leading-relaxed" style={{
                      color: "#4A6080",
                      display: isExp ? "block" : "-webkit-box",
                      WebkitLineClamp: isExp ? undefined : 2,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: isExp ? "visible" : "hidden",
                    }}>
                      {row.comment}
                    </p>
                    {hasLong && (
                      <button onClick={() => toggleExpand(row._i)}
                        className="inline-flex items-center gap-0.5 mt-1 text-[11px] font-semibold"
                        style={{ color: "#0076BC" }}>
                        {isExp ? "Show less" : "Show more"}
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExp ? "rotate-90" : ""}`} />
                      </button>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  }

  function SharedHeader() {
    return (
      <tr style={{ backgroundColor: "#FAFBFC" }}>
        <ColHeader col="division"       label="Division"        w="64px" />
        <ColHeader                      label="Region"          w="64px" />
        <ColHeader                      label="Type"            w="96px" />
        <ColHeader                      label="Description"     w="16%" />
        <ColHeader                      label="Currency"        w="64px" />
        <ColHeader col="monetaryLimits" label="Monetary Limits" w="100px" />
        <ColHeader                      label="Units"           w="88px" />
        <ColHeader                      label="Comment"         w="38%" />
      </tr>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#C5D4E8] overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}>
      <div className="px-5 py-4 border-b border-[#C5D4E8]"
        style={{ background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" }}>
        <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Underwriting Extensions and Restrictions</div>
      </div>

      <div className="p-5 space-y-4">
        {/* Extensions section */}
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #BBF7D0" }}>
          <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor: "#F0FDF4", borderBottom: "1px solid #BBF7D0" }}>
            <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#15803D" }} />
            <span className="text-[12px] font-bold" style={{ color: "#15803D" }}>Extensions</span>
            <span className="ml-auto text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#15803D18", color: "#15803D" }}>{extensions.length}</span>
          </div>
          <table className="w-full table-fixed">
            <thead><SharedHeader /></thead>
            <TableBody rows={extensions} />
          </table>
        </div>

        {/* Restrictions section */}
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #FECACA" }}>
          <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor: "#FFF5F5", borderBottom: "1px solid #FECACA" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#B91C1C" }} />
            <span className="text-[12px] font-bold" style={{ color: "#B91C1C" }}>Restrictions</span>
            <span className="ml-auto text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#B91C1C18", color: "#B91C1C" }}>{restrictions.length}</span>
          </div>
          <table className="w-full table-fixed">
            <thead><SharedHeader /></thead>
            <TableBody rows={restrictions} />
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Authority view ────────────────────────────────────────────────
const ENTITIES = [
  "General Casualty Company of Wisconsin",
  "General Casualty Insurance Company",
  "North Pointe Insurance Company",
  "Praetorian Insurance Company",
  "QBE Insurance Corporation",
  "QBE Reinsurance Corporation",
  "QBE Specialty Insurance Company",
  "Regent Insurance Company",
  "Southern Pilot Insurance Company",
  "Stonington Insurance Company",
];

const UW_AUTHORITIES = [
  { business: "Inland Marine — All other",     division: "NA", currency: "USD", maxLine: "50,000,000",  units: "Maximum Limit" },
  { business: "Inland Marine — Builders Risk", division: "NA", currency: "USD", maxLine: "50,000,000",  units: "Maximum Limit" },
  { business: "Property",                      division: "NA", currency: "USD", maxLine: "100,000,000", units: "Maximum amount subject" },
  { business: "Property — Semi-automatic",     division: "NA", currency: "USD", maxLine: "100,000,000", units: "Per property risk" },
  { business: "Property — Shared & Layered",   division: "NA", currency: "USD", maxLine: "100,000,000", units: "Total Any One Account" },
];

function AuthorityView() {

  return (
    <div className="space-y-5">

      {/* ── Guideline Authority ── */}
      <div className="bg-white rounded-2xl border border-[#C5D4E8] overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}>
        {/* Header strip */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-[#C5D4E8]"
          style={{ background: "linear-gradient(135deg,#00205B,#0076BC)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white leading-tight">Guideline Authority</div>
            <div className="text-[11px] text-white/60 mt-0.5">Delegation of underwriting authority</div>
          </div>
        </div>
        {/* Stat strip */}
        <div className="grid grid-cols-5 divide-x divide-[#E8EDF4]">
          {[
            { icon: User,          label: "Delegator",        value: "Matthew Westhoff" },
            { icon: UserCheck,     label: "Authority Holder", value: "Mike Farrell" },
            { icon: Briefcase,     label: "Business Title",   value: "Head of CP" },
            { icon: Calendar,      label: "Effective Date",   value: "23 May 2026" },
            { icon: CalendarCheck, label: "Acceptance Date",  value: "26 May 2026" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color: "#0076BC" }} />
                <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#94A3B8" }}>{label}</div>
              </div>
              <div className="text-[13px] font-semibold leading-snug" style={{ color: "#0D1B2E" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Entities + Authorities side by side ── */}
      <div className="grid grid-cols-5 gap-4">

        {/* Entities — left 2 columns */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#C5D4E8] overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}>
          <div className="px-4 py-3 border-b border-[#C5D4E8]"
            style={{ background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "#0076BC" }} />
              <div className="text-[13px] font-bold" style={{ color: "#0D1B2E" }}>Entities</div>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Entities Description</div>
          </div>
          <div className="divide-y divide-[#EEF2F7]">
            {ENTITIES.map((entity, i) => (
              <div key={entity} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FBFF] transition-colors">
                <span className="text-[10px] font-bold tabular-nums w-4 flex-shrink-0" style={{ color: "#C5D4E8" }}>{i + 1}</span>
                <span className="text-[12px] font-medium leading-snug" style={{ color: "#0D1B2E" }}>{entity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Underwriting Authorities — right 3 columns */}
        <div className="col-span-3 bg-white rounded-2xl border border-[#C5D4E8] overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}>
          <div className="px-4 py-3 border-b border-[#C5D4E8]"
            style={{ background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" }}>
            <div className="text-[13px] font-bold" style={{ color: "#0D1B2E" }}>Underwriting Authorities</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Maximum net lines by class of business</div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#FAFBFC" }}>
                {[
                  { label: "Class of Business", w: "auto" },
                  { label: "Div",               w: "48px" },
                  { label: "Currency",          w: "64px" },
                  { label: "Max Signed Line",   w: "110px" },
                  { label: "Units",             w: "auto" },
                ].map(h => (
                  <th key={h.label}
                    className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-[#E8EDF4]"
                    style={{ color: "#94A3B8", width: h.w }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UW_AUTHORITIES.map(row => (
                <tr key={row.business}
                  className="border-b last:border-b-0 transition-colors"
                  style={{ borderColor: "#EEF2F7" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FAFBFE")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                  <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{row.business}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#94A3B8" }}>{row.division}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#4A6080" }}>{row.currency}</td>
                  <td className="px-4 py-3 text-[13px] font-bold tabular-nums" style={{ color: "#0076BC" }}>
                    {row.maxLine}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#4A6080" }}>{row.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UWExtensionsTable />

    </div>
  );
}

