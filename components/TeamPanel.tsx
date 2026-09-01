"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Handshake, ChevronDown, ChevronRight, X,
  BarChart2, DollarSign, Target, FileText, TrendingUp,
} from "lucide-react";
import { TeamPerformance, BROKER_METRICS } from "./TeamPerformance";

type Tab = "portfolio" | "distribution";

/* ── Style tokens ────────────────────────────────────────────────── */
const CARD = "bg-white rounded-2xl border border-[#C5D4E8]";
const CARD_SHADOW: React.CSSProperties = { boxShadow: "0 1px 4px rgba(0,32,91,0.05)" };
const HERO_GRAD: React.CSSProperties = { background: "linear-gradient(135deg,#00205B,#0076BC)" };
const LIGHT_GRAD: React.CSSProperties = { background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" };

/* ── Distribution Performance Tab ──────────────────────────────── */
const DIST_TIMELINE_LABEL: Record<string, string> = {
  "4w": "Last 4 Weeks", "q1": "Q1 2026", "q2": "Q2 2026", "ytd": "Year to Date",
};
const DIST_TIMELINE_FACTOR: Record<string, number> = {
  "4w": 0.10, "q1": 0.26, "q2": 0.52, "ytd": 1.0,
};



function DetailStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "#94A3B8" }}>{label}</span>
      <span className="text-[13px] font-bold tabular-nums" style={{ color: "#0D1B2E" }}>{value}</span>
      {sub && <span className="text-[10px]" style={{ color: "#94A3B8" }}>{sub}</span>}
    </div>
  );
}

function DistributionPerformanceTab() {
  const [broker, setBroker] = useState("all");
  const [timeline, setTimeline] = useState("ytd");
  const [expanded, setExpanded] = useState<string | null>(null);

  const factor = DIST_TIMELINE_FACTOR[timeline] ?? 1.0;
  const filteredBrokers = broker === "all" ? BROKER_METRICS : BROKER_METRICS.filter(b => b.name === broker);

  const sc = useCallback((n: number) => Math.round(n * factor), [factor]);

  /* Aggregate KPIs across filtered brokers */
  const kpis = useMemo(() => {
    const totalSubs    = filteredBrokers.reduce((s, b) => s + sc(b.submissions), 0);
    const totalBound   = filteredBrokers.reduce((s, b) => s + sc(b.bound), 0);
    const totalPremium = filteredBrokers.reduce((s, b) => s + b.premium * factor, 0);
    const totalTIV     = filteredBrokers.reduce((s, b) => s + b.totalTIV, 0);
    const avgBind      = totalSubs > 0 ? Math.round((totalBound / totalSubs) * 100) : 0;
    return { totalSubs, totalBound, totalPremium, totalTIV, avgBind, brokerCount: filteredBrokers.length };
  }, [filteredBrokers, factor, sc]);

  return (
    <div className="p-6 space-y-5">

      {/* ── KPI hero strip ── */}
      <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
        {/* Dark header */}
        <div className="flex items-center gap-3 px-5 py-3.5" style={HERO_GRAD}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 flex-shrink-0">
            <Handshake className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-white leading-tight">Distribution Performance</div>
            <div className="text-[11px] text-white/60">Commercial Property · {DIST_TIMELINE_LABEL[timeline]}</div>
          </div>
          {/* Inline filters in header */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <select value={broker} onChange={e => { setBroker(e.target.value); setExpanded(null); }}
                className="text-[11px] pl-2.5 pr-6 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white focus:outline-none cursor-pointer appearance-none">
                <option value="all" className="text-[#0D1B2E] bg-white">All Brokers</option>
                {BROKER_METRICS.map(b => <option key={b.name} value={b.name} className="text-[#0D1B2E] bg-white">{b.shortName}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white/60" />
            </div>
            <div className="relative">
              <select value={timeline} onChange={e => setTimeline(e.target.value)}
                className="text-[11px] pl-2.5 pr-6 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white focus:outline-none cursor-pointer appearance-none">
                {[["4w","Last 4 Weeks"],["q1","Q1 2026"],["q2","Q2 2026"],["ytd","Year to Date"]].map(([v, l]) =>
                  <option key={v} value={v} className="text-[#0D1B2E] bg-white">{l}</option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white/60" />
            </div>
          </div>
        </div>
        {/* Stat strip */}
        <div className="grid divide-x divide-[#E8EDF4]" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {[
            { icon: BarChart2,   label: "Brokers",          value: String(kpis.brokerCount),              sub: "in view" },
            { icon: FileText,    label: "Submissions",       value: kpis.totalSubs.toLocaleString(),       sub: DIST_TIMELINE_LABEL[timeline] },
            { icon: Target,      label: "Policies Bound",    value: kpis.totalBound.toLocaleString(),      sub: "of submissions" },
            { icon: TrendingUp,  label: "Avg Bind Rate",     value: `${kpis.avgBind}%`,                   sub: "submission → bind" },
            { icon: DollarSign,  label: "Total Premium",     value: `$${kpis.totalPremium.toFixed(1)}M`,  sub: "GWP" },
            { icon: DollarSign,  label: "Total TIV",         value: `$${kpis.totalTIV.toFixed(1)}B`,      sub: "insured exposure" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color: "#0076BC" }} />
                <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#94A3B8" }}>{label}</div>
              </div>
              <div className="text-[15px] font-bold tabular-nums leading-tight" style={{ color: "#0D1B2E" }}>{value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Broker Performance table ── */}
      <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
        {/* Card header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#C5D4E8]" style={LIGHT_GRAD}>
          <Handshake className="w-4 h-4 flex-shrink-0" style={{ color: "#0076BC" }} />
          <div>
            <div className="text-[13px] font-bold" style={{ color: "#0D1B2E" }}>Broker Performance</div>
            <div className="text-[11px]" style={{ color: "#94A3B8" }}>Click any row to expand detailed metrics</div>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAFBFC" }}>
              {[
                { label: "",                    w: "36px" },
                { label: "Broker",              w: "auto" },
                { label: "Policy Count",        w: "100px" },
                { label: "Submissions",         w: "100px" },
                { label: "Declined",            w: "80px" },
                { label: "Bound",               w: "80px" },
                { label: "Bind Rate",           w: "90px" },
                { label: "Total Premium",       w: "110px" },
              ].map(({ label, w }, i) => (
                <th key={i}
                  className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-[#E8EDF4] whitespace-nowrap"
                  style={{ color: "#94A3B8", width: w }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBrokers.map((b) => {
              const isOpen = expanded === b.name;
              return (
                <React.Fragment key={b.name}>
                  <tr
                    className="border-b cursor-pointer"
                    style={{ borderColor: isOpen ? "#C2DFF4" : "#EEF2F7", backgroundColor: isOpen ? "#EEF6FF" : "white" }}
                    onClick={() => setExpanded(isOpen ? null : b.name)}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFBFE"; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "white"; }}>
                    <td className="px-3 py-3">
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "#0076BC" }} />
                        : <ChevronRight className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{b.name}</div>
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      {sc(b.newBusinessPolicies + b.renewalPolicies)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      {sc(b.submissions)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      {sc(b.declined)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      {sc(b.bound)}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      {b.bindRate}%
                    </td>
                    <td className="px-3 py-3 text-[12px] font-semibold tabular-nums" style={{ color: "#0D1B2E" }}>
                      ${(b.premium * factor).toFixed(1)}M
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={9} className="px-5 py-4 border-b border-[#C2DFF4]"
                        style={{ backgroundColor: "#F4F8FF" }}>
                        <div className="grid grid-cols-4 gap-3">

                          {/* Submission Outcomes */}
                          <div className="bg-white rounded-xl border border-[#C5D4E8] overflow-hidden" style={CARD_SHADOW}>
                            <div className="px-3.5 py-2.5 border-b border-[#C5D4E8]" style={LIGHT_GRAD}>
                              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0076BC" }}>Submission Outcomes</div>
                            </div>
                            <div className="px-3.5 py-3 flex flex-col gap-2.5">
                              <DetailStat label="Submissions Received" value={String(sc(b.submissions))} />
                              <DetailStat label="Quoted" value={String(sc(b.quoted))} />
                              <div className="border-t border-[#EEF2F7] pt-2.5 flex flex-col gap-2.5">
                                <DetailStat label="Bound" value={String(sc(b.bound))} sub={`${b.bindRate}% of quoted`} />
                                <DetailStat label="Not Bound (Lost)" value={String(sc(b.lost))} sub={`${Math.round((b.lost / b.quoted) * 100)}% of quoted`} />
                              </div>
                            </div>
                          </div>

                          {/* Bound Policies by Type */}
                          <div className="bg-white rounded-xl border border-[#C5D4E8] overflow-hidden" style={CARD_SHADOW}>
                            <div className="px-3.5 py-2.5 border-b border-[#C5D4E8]" style={LIGHT_GRAD}>
                              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0076BC" }}>Bound Policies by Type</div>
                            </div>
                            <div className="px-3.5 py-3 flex flex-col gap-2.5">
                              <DetailStat label="New Business" value={String(sc(b.newBusinessPolicies))} sub={`${Math.round((b.newBusinessPolicies / b.bound) * 100)}% of bound`} />
                              <DetailStat label="Renewal" value={String(sc(b.renewalPolicies))} sub={`${Math.round((b.renewalPolicies / b.bound) * 100)}% of bound`} />
                              <div className="border-t border-[#EEF2F7] pt-2.5">
                                <DetailStat label="Total Bound Policies" value={String(sc(b.newBusinessPolicies + b.renewalPolicies))} />
                              </div>
                            </div>
                          </div>

                          {/* Insured Exposure */}
                          <div className="bg-white rounded-xl border border-[#C5D4E8] overflow-hidden" style={CARD_SHADOW}>
                            <div className="px-3.5 py-2.5 border-b border-[#C5D4E8]" style={LIGHT_GRAD}>
                              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0076BC" }}>Insured Exposure (TIV)</div>
                            </div>
                            <div className="px-3.5 py-3 flex flex-col gap-2.5">
                              <DetailStat label="Total Insured Value" value={`$${b.totalTIV.toFixed(1)}B`} />
                              <DetailStat label="Avg TIV per Submission" value={`$${b.avgTIVPerSub.toFixed(1)}M`} />
                            </div>
                          </div>

                          {/* GWP */}
                          <div className="bg-white rounded-xl border border-[#C5D4E8] overflow-hidden" style={CARD_SHADOW}>
                            <div className="px-3.5 py-2.5 border-b border-[#C5D4E8]" style={LIGHT_GRAD}>
                              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0076BC" }}>Gross Written Premium</div>
                            </div>
                            <div className="px-3.5 py-3 flex flex-col gap-2.5">
                              <DetailStat label="New Business" value={`$${(b.gwpNewBusiness * factor).toFixed(1)}M`} sub={`${Math.round((b.gwpNewBusiness / b.premium) * 100)}% of total`} />
                              <DetailStat label="Renewal" value={`$${(b.gwpRenewal * factor).toFixed(1)}M`} sub={`${Math.round((b.gwpRenewal / b.premium) * 100)}% of total`} />
                              <div className="border-t border-[#EEF2F7] pt-2.5">
                                <DetailStat label="Total Premium" value={`$${(b.premium * factor).toFixed(1)}M`} />
                              </div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

/* ── TeamPanel ─────────────────────────────────────────────────── */
export function TeamPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "portfolio";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const pending = sessionStorage.getItem("performanceTab") as Tab | null;
    if (pending) {
      sessionStorage.removeItem("performanceTab");
      setActiveTab(pending);
    }
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "portfolio",     label: "Portfolio Performance" },
    { id: "distribution",  label: "Distribution Performance" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="bg-white border-b border-[#C5D4E8] px-8 flex items-center">
        <div className="flex gap-8 flex-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "border-[#0076BC] text-[#0076BC] text-[13px] font-bold"
                  : "border-transparent text-[#94A3B8] text-[13px] font-[450] hover:text-[#0D1B2E]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "portfolio"    && <TeamPerformance />}
        {activeTab === "distribution" && <DistributionPerformanceTab />}
      </div>
    </div>
  );
}

