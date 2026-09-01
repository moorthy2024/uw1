"use client";
import { useState } from "react";
import { MapPin, AlertTriangle, FileText, DollarSign, Shield, Target, Flame } from "lucide-react";
import { ScrollRegion } from "./ScrollRegion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";

const inforceMetrics = [
  { label: "Total Policies", value: "1,247", change: "+8.3%" },
  { label: "Total TIV", value: "$18.4B", change: "+12.1%" },
  { label: "GWP Inforce", value: "$142.8M", change: "+12.4%" },
  { label: "Avg Premium", value: "$485K", change: "+5.2%" },
  { label: "Loss Ratio YTD", value: "54%", change: "-2.8%" },
  { label: "Combined Ratio", value: "96.5%", change: "-1.5%" },
];

const locationExposures = [
  { territory: "California", policyCount: 342, tiv: "$5.2B", locationCount: 2847, catExposure: "High", eqPML: "$1.8B" },
  { territory: "New York", policyCount: 198, tiv: "$3.8B", locationCount: 1456, catExposure: "Moderate", eqPML: "$420M" },
  { territory: "Florida", policyCount: 156, tiv: "$2.9B", locationCount: 1098, catExposure: "High", eqPML: "$0" },
  { territory: "Texas", policyCount: 134, tiv: "$2.1B", locationCount: 978, catExposure: "Moderate", eqPML: "$0" },
  { territory: "Illinois", policyCount: 112, tiv: "$1.7B", locationCount: 745, catExposure: "Low", eqPML: "$85M" },
];

const accumulations = [
  { zone: "Los Angeles Metro", peril: "Earthquake", tivConcentration: "$1.5B", policyCount: 112, limitUtilization: 92, status: "At Limit" },
  { zone: "San Francisco Bay", peril: "Earthquake", tivConcentration: "$1.2B", policyCount: 87, limitUtilization: 85, status: "Near Limit" },
  { zone: "Miami-Dade County", peril: "Hurricane", tivConcentration: "$890M", policyCount: 64, limitUtilization: 78, status: "Monitor" },
  { zone: "Houston Metro", peril: "Flood/Wind", tivConcentration: "$720M", policyCount: 52, limitUtilization: 62, status: "Healthy" },
  { zone: "Tornado Alley", peril: "Convective Storm", tivConcentration: "$580M", policyCount: 45, limitUtilization: 58, status: "Healthy" },
  { zone: "Pacific NW", peril: "Earthquake", tivConcentration: "$340M", policyCount: 28, limitUtilization: 42, status: "Healthy" },
];

const catExceedance = [
  { rp: "10yr", fire: 8.2, eq: 12.5, wind: 6.8, flood: 3.2 },
  { rp: "25yr", fire: 14.5, eq: 28.4, wind: 15.2, flood: 7.8 },
  { rp: "50yr", fire: 22.1, eq: 48.2, wind: 28.5, flood: 14.2 },
  { rp: "100yr", fire: 32.8, eq: 72.4, wind: 45.8, flood: 22.5 },
  { rp: "250yr", fire: 48.5, eq: 112.8, wind: 68.2, flood: 35.4 },
  { rp: "500yr", fire: 65.2, eq: 158.4, wind: 92.5, flood: 48.8 },
];

const lossRatioTrend = [
  { quarter: "Q1'25", attritional: 32, cat: 8, total: 40 },
  { quarter: "Q2'25", attritional: 35, cat: 22, total: 57 },
  { quarter: "Q3'25", attritional: 33, cat: 5, total: 38 },
  { quarter: "Q4'25", attritional: 30, cat: 4, total: 34 },
  { quarter: "Q1'26", attritional: 31, cat: 3, total: 34 },
];

const occupancyDistribution = [
  { name: "Office", value: 32, color: "#0076BC" },
  { name: "Healthcare", value: 18, color: "#0090DC" },
  { name: "Retail", value: 15, color: "#F4A030" },
  { name: "Education", value: 12, color: "#20A8E0" },
  { name: "Manufacturing", value: 14, color: "#E07010" },
  { name: "Municipal", value: 9, color: "#80CCF0" },
];

const reinsuranceTreaty = [
  { treaty: "Quota Share (25%)", capacity: "$250M", utilized: "$187M", pct: 75, status: "Active" },
  { treaty: "1st Excess ($10M xs $5M)", capacity: "$10M", utilized: "$0", pct: 0, status: "Active" },
  { treaty: "CAT XL ($50M xs $25M)", capacity: "$50M", utilized: "$0", pct: 0, status: "Active" },
  { treaty: "Fac Obligatory", capacity: "$100M", utilized: "$42M", pct: 42, status: "Active" },
];

// ── shared badge helper ───────────────────────────────────────────
function CatBadge({ level }: { level: string }) {
  const cls =
    level === "High"
      ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
      : level === "Moderate"
      ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
      : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]";
  return (
    <span className={`rounded-full text-[11px] font-semibold border px-2 py-0.5 ${cls}`}>
      {level}
    </span>
  );
}

function AccumBadge({ status }: { status: string }) {
  const cls =
    status === "At Limit"
      ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
      : status === "Near Limit"
      ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
      : status === "Monitor"
      ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
      : "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]";
  return (
    <span className={`rounded-full text-[11px] font-semibold border px-2 py-0.5 ${cls}`}>
      {status}
    </span>
  );
}

function GreenBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full text-[11px] font-semibold border px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]">
      {label}
    </span>
  );
}

const CARD = "bg-white rounded-2xl border border-[#C5D4E8]";
const CARD_SHADOW: React.CSSProperties = { boxShadow: "0 1px 4px rgba(0,32,91,0.05)" };
const HERO_GRADIENT: React.CSSProperties = { background: "linear-gradient(135deg,#00205B,#0076BC)" };
const SECTION_GRADIENT: React.CSSProperties = { background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" };
const TOOLTIP_STYLE = { fontSize: "11px", borderRadius: "8px", border: "1px solid #C5D4E8", backgroundColor: "#fff" };

export function Portfolio() {
  const [activeTab, setActiveTab] = useState<"overview" | "cat" | "reinsurance">("overview");

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar — Guidelines style */}
      <div className="bg-white border-b border-[#C5D4E8] px-8">
        <div className="flex gap-8">
          {[
            { key: "overview" as const, label: "Portfolio Overview" },
            { key: "cat" as const, label: "CAT & Accumulation" },
            { key: "reinsurance" as const, label: "Reinsurance" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-1 py-4 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#0076BC] text-[#0076BC] font-bold text-[13px]"
                  : "border-transparent text-[#94A3B8] font-[450] text-[13px] hover:text-[#0D1B2E]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "cat" && <CATTab />}
        {activeTab === "reinsurance" && <ReinsuranceTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="h-full flex flex-col min-h-0 p-6 gap-4">

      {/* Inforce metrics — single hero card with stat strip */}
      <div className={`${CARD} flex-shrink-0 overflow-hidden`} style={CARD_SHADOW}>
        {/* Hero header */}
        <div className="flex items-center gap-3 px-5 py-4" style={HERO_GRADIENT}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">Inforce Portfolio</div>
            <div className="text-[11px] text-white/70">Key metrics across active policies</div>
          </div>
        </div>
        {/* Stat strip */}
        <div className="grid grid-cols-6 divide-x divide-[#E8EDF4]">
          {inforceMetrics.map((m) => (
            <div key={m.label} className="px-4 py-3.5">
              <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>
                {m.label}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 flex-shrink-0">
        {/* Occupancy Mix */}
        <div className={`col-span-2 ${CARD} overflow-hidden`} style={CARD_SHADOW}>
          <div className="px-5 py-4 border-b border-[#C5D4E8]" style={SECTION_GRADIENT}>
            <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Occupancy Mix</div>
            <div className="text-[11px]" style={{ color: "#94A3B8" }}>% of inforce premium</div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <ResponsiveContainer width="50%" height={150}>
              <PieChart>
                <Pie key="pie-portfolio-occupancy" data={occupancyDistribution} cx="50%" cy="50%" outerRadius={65} innerRadius={35} dataKey="value" paddingAngle={2}>
                  {occupancyDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {occupancyDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[12px]">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="flex-1" style={{ color: "#94A3B8" }}>{item.name}</span>
                  <span className="font-semibold" style={{ color: "#0D1B2E" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Territory Table */}
      <div className={`${CARD} flex-1 min-h-0 flex flex-col overflow-hidden`} style={CARD_SHADOW}>
        <div className="px-5 py-4 border-b border-[#C5D4E8] flex-shrink-0" style={SECTION_GRADIENT}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: "#0076BC" }} />
            <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Territory Exposure Summary</div>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Policy and TIV distribution by territory</div>
        </div>
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#FAFBFC] border-b border-[#E8EDF4]">
                {["Territory", "Policies", "Total TIV", "Locations", "EQ PML", "CAT Exposure"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locationExposures.map((item, i) => (
                <HoverRow key={item.territory} isLast={i === locationExposures.length - 1}>
                  <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{item.territory}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{item.policyCount}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#0076BC" }}>{item.tiv}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{item.locationCount}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{item.eqPML}</td>
                  <td className="px-4 py-3">
                    <CatBadge level={item.catExposure} />
                  </td>
                </HoverRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CATTab() {
  const catMetrics = [
    { label: "Portfolio AAL", value: "$12.4M", hint: "All perils" },
    { label: "250-yr OEP", value: "$112.8M", hint: "Earthquake dominant" },
    { label: "500-yr OEP", value: "$158.4M", hint: "Tail risk" },
    { label: "250-yr TVaR", value: "$128.5M", hint: "Tail Value at Risk" },
    { label: "Net Retention", value: "$75M", hint: "After reinsurance" },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 p-6 gap-4">

      {/* CAT summary stat strip card */}
      <div className={`${CARD} flex-shrink-0 overflow-hidden`} style={CARD_SHADOW}>
        <div className="flex items-center gap-3 px-5 py-4" style={HERO_GRADIENT}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">CAT Exposure Summary</div>
            <div className="text-[11px] text-white/70">Modeled loss metrics across all perils</div>
          </div>
        </div>
        <div className="grid grid-cols-5 divide-x divide-[#E8EDF4]">
          {catMetrics.map((m) => (
            <div key={m.label} className="px-4 py-3.5">
              <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>{m.label}</div>
              <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>{m.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>{m.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exceedance Curve */}
      <div className={`${CARD} flex-shrink-0 overflow-hidden`} style={CARD_SHADOW}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">OEP Exceedance Curve by Peril ($M)</div>
            <div className="text-[11px] text-white/70">Return period losses across all modeled perils</div>
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={catExceedance}>
              <CartesianGrid key="grid-exceedance" strokeDasharray="3 3" stroke="#E8EDF4" />
              <XAxis key="xaxis-exceedance" dataKey="rp" stroke="#94A3B8" style={{ fontSize: "11px" }} />
              <YAxis key="yaxis-exceedance" stroke="#94A3B8" style={{ fontSize: "11px" }} />
              <Tooltip key="tooltip-exceedance" contentStyle={TOOLTIP_STYLE} />
              <Legend key="legend-exceedance" wrapperStyle={{ fontSize: "11px" }} />
              <Line key="eq-line" type="monotone" dataKey="eq" stroke="#E07010" strokeWidth={2.5} name="Earthquake" dot={{ r: 4 }} />
              <Line key="wind-line" type="monotone" dataKey="wind" stroke="#0076BC" strokeWidth={2} name="Windstorm" dot={{ r: 3 }} />
              <Line key="fire-line" type="monotone" dataKey="fire" stroke="#F4A030" strokeWidth={2} name="Fire" dot={{ r: 3 }} />
              <Line key="flood-line" type="monotone" dataKey="flood" stroke="#0090DC" strokeWidth={1.5} name="Flood" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accumulation Table */}
      <div className={`${CARD} flex-1 min-h-0 flex flex-col overflow-hidden`} style={CARD_SHADOW}>
        <div className="px-5 py-4 border-b border-[#C5D4E8] flex-shrink-0" style={SECTION_GRADIENT}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "#0076BC" }} />
            <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Accumulation Zone Monitoring</div>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>TIV concentration by zone and peril with capacity limits</div>
        </div>
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#FAFBFC] border-b border-[#E8EDF4]">
                {["Zone", "Peril", "TIV", "Policies", "Limit Utilization", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accumulations.map((item, i) => (
                <HoverRow key={item.zone} isLast={i === accumulations.length - 1}>
                  <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{item.zone}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{item.peril}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#0076BC" }}>{item.tivConcentration}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{item.policyCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#E8EDF4] rounded-full h-1.5 max-w-[80px]">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${item.limitUtilization}%`,
                            backgroundColor:
                              item.limitUtilization >= 90 ? "#B91C1C"
                              : item.limitUtilization >= 75 ? "#B45309"
                              : "#15803D",
                          }}
                        />
                      </div>
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>{item.limitUtilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AccumBadge status={item.status} />
                  </td>
                </HoverRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReinsuranceTab() {
  const scenarioTests = [
    { scenario: "San Andreas M8.0", grossLoss: "$145M", ceded: "$95M", netRetained: "$50M", impact: "Within tolerance" },
    { scenario: "FL Cat 5 Landfall (Miami)", grossLoss: "$82M", ceded: "$52M", netRetained: "$30M", impact: "Within tolerance" },
    { scenario: "New Madrid EQ M7.5", grossLoss: "$38M", ceded: "$18M", netRetained: "$20M", impact: "Within tolerance" },
    { scenario: "CA Wildfire (LA County)", grossLoss: "$28M", ceded: "$12M", netRetained: "$16M", impact: "Within tolerance" },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 p-6">
      <ScrollRegion ariaLabel="Reinsurance tables" innerClassName="space-y-4 pr-1" fadeColor="#F9F9F8">

        {/* Treaty Summary */}
        <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={SECTION_GRADIENT}>
            <Shield className="w-4 h-4" style={{ color: "#0076BC" }} />
            <div>
              <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Reinsurance Treaty Structure</div>
              <div className="text-[11px]" style={{ color: "#94A3B8" }}>Active treaty programs and utilization</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#E8EDF4]">
                  {["Treaty", "Capacity", "Utilized", "Utilization", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reinsuranceTreaty.map((t, i) => (
                  <HoverRow key={t.treaty} isLast={i === reinsuranceTreaty.length - 1}>
                    <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{t.treaty}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{t.capacity}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#0076BC" }}>{t.utilized}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#E8EDF4] rounded-full h-1.5 max-w-[80px]">
                          <div className="h-1.5 rounded-full bg-[#0076BC]" style={{ width: `${t.pct}%` }} />
                        </div>
                        <span className="text-[11px]" style={{ color: "#94A3B8" }}>{t.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <GreenBadge label={t.status} />
                    </td>
                  </HoverRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scenario Testing */}
        <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={SECTION_GRADIENT}>
            <Flame className="w-4 h-4" style={{ color: "#0076BC" }} />
            <div>
              <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Stress Test Scenarios</div>
              <div className="text-[11px]" style={{ color: "#94A3B8" }}>Net retained loss after reinsurance recoveries</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#E8EDF4]">
                  {["Scenario", "Gross Loss", "Ceded", "Net Retained", "Assessment"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenarioTests.map((s, i) => (
                  <HoverRow key={s.scenario} isLast={i === scenarioTests.length - 1}>
                    <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{s.scenario}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#B91C1C" }}>{s.grossLoss}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#0076BC" }}>{s.ceded}</td>
                    <td className="px-4 py-3 text-[12px] font-bold" style={{ color: "#0D1B2E" }}>{s.netRetained}</td>
                    <td className="px-4 py-3">
                      <GreenBadge label={s.impact} />
                    </td>
                  </HoverRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </ScrollRegion>
    </div>
  );
}

// ── hover row helper (inline onMouseEnter/Leave per spec) ────────
function HoverRow({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? "#F5F8FF" : "transparent" }}
      className={`transition-colors ${!isLast ? "border-b border-[#EEF2F7]" : ""}`}
    >
      {children}
    </tr>
  );
}

