"use client";
import { useMemo, useState } from "react";
import {
  TrendingUp, Clock, Target, CheckCircle2, Award, BarChart3, DollarSign,
  Filter, Users, MapPin, Calendar, ChevronDown, Activity, Shield,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { useRole } from "./RoleContext";

type Region = "Northeast" | "Southeast" | "Midwest" | "West";
type Timeline = "4w" | "q1" | "q2" | "ytd";

interface TeamMember {
  id: string; name: string; role: "UW" | "Sr UW" | "Lead UW";
  region: Region; team: string;
  submissions: number; premium: number; handleTime: number; bindRate: number; sla: number;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "mike-chen",   name: "Mike Farrell",    role: "Sr UW",   region: "Midwest",   team: "Commercial Property", submissions: 38, premium: 18.4, handleTime: 2.6, bindRate: 51, sla: 97 },
  { id: "rachel-park", name: "Rachel Park",  role: "UW",      region: "Midwest",   team: "Commercial Property", submissions: 32, premium: 14.8, handleTime: 2.9, bindRate: 46, sla: 95 },
  { id: "david-liu",   name: "David Liu",    role: "UW",      region: "Midwest",   team: "Commercial Property", submissions: 29, premium: 12.2, handleTime: 3.0, bindRate: 44, sla: 94 },
  { id: "tara-singh",  name: "Tara Singh",   role: "UW",      region: "Midwest",   team: "Commercial Property", submissions: 36, premium: 17.1, handleTime: 2.5, bindRate: 49, sla: 98 },
  { id: "jen-kim",     name: "Jen Kim",      role: "Lead UW", region: "Northeast", team: "NE Commercial",    submissions: 41, premium: 22.6, handleTime: 2.4, bindRate: 53, sla: 98 },
  { id: "marco-rossi", name: "Marco Rossi",  role: "Sr UW",   region: "Northeast", team: "NE Commercial",    submissions: 34, premium: 16.9, handleTime: 2.8, bindRate: 47, sla: 96 },
  { id: "amy-stone",   name: "Amy Stone",    role: "UW",      region: "Northeast", team: "NE Commercial",    submissions: 27, premium: 11.4, handleTime: 3.2, bindRate: 42, sla: 91 },
  { id: "luis-garza",  name: "Luis Garza",   role: "Lead UW", region: "Southeast", team: "SE CAT-Heavy",     submissions: 45, premium: 26.8, handleTime: 2.3, bindRate: 55, sla: 99 },
  { id: "kara-bell",   name: "Kara Bell",    role: "Sr UW",   region: "Southeast", team: "SE CAT-Heavy",     submissions: 31, premium: 15.2, handleTime: 2.9, bindRate: 45, sla: 93 },
  { id: "owen-pratt",  name: "Owen Pratt",   role: "UW",      region: "Southeast", team: "SE CAT-Heavy",     submissions: 24, premium: 9.8,  handleTime: 3.4, bindRate: 39, sla: 89 },
  { id: "nina-cole",   name: "Nina Cole",    role: "Sr UW",   region: "West",      team: "West Property",    submissions: 33, premium: 16.3, handleTime: 2.7, bindRate: 48, sla: 96 },
  { id: "sam-vega",    name: "Sam Vega",     role: "UW",      region: "West",      team: "West Property",    submissions: 28, premium: 12.6, handleTime: 3.0, bindRate: 43, sla: 92 },
];

export interface BrokerMetric {
  name: string; shortName: string;
  type: "National" | "Regional" | "Specialty";
  submissions: number; premium: number;
  bindRate: number; avgHandleTime: number;
  trend: "up" | "down" | "flat"; trendPct: number;
  nB: number; renewal: number;
  // Expanded detail fields
  quoted: number;
  bound: number;
  lost: number;
  declined: number;
  newBusinessPolicies: number;
  renewalPolicies: number;
  totalTIV: number;       // $B
  avgTIVPerSub: number;   // $M
  gwpNewBusiness: number; // $M
  gwpRenewal: number;     // $M
}

export const BROKER_METRICS: BrokerMetric[] = [
  { name: "Marsh & McLennan",    shortName: "Marsh",               type: "National",  submissions: 142, premium: 38.4, bindRate: 68, avgHandleTime: 2.4, trend: "up",   trendPct: 5,  nB: 61, renewal: 81, quoted: 125, bound: 85, lost: 40, declined: 17, newBusinessPolicies: 38, renewalPolicies: 47, totalTIV: 4.2,  avgTIVPerSub: 29.6, gwpNewBusiness: 16.8, gwpRenewal: 21.6 },
  { name: "Aon",                 shortName: "Aon",                  type: "National",  submissions: 118, premium: 31.2, bindRate: 72, avgHandleTime: 2.6, trend: "up",   trendPct: 8,  nB: 48, renewal: 70, quoted: 104, bound: 75, lost: 29, declined: 14, newBusinessPolicies: 32, renewalPolicies: 43, totalTIV: 3.5,  avgTIVPerSub: 29.7, gwpNewBusiness: 13.4, gwpRenewal: 17.8 },
  { name: "Willis Towers Watson", shortName: "Willis Towers Watson", type: "National",  submissions: 96,  premium: 24.8, bindRate: 55, avgHandleTime: 2.9, trend: "down", trendPct: 4,  nB: 52, renewal: 44, quoted: 84,  bound: 46, lost: 38, declined: 12, newBusinessPolicies: 26, renewalPolicies: 20, totalTIV: 2.8,  avgTIVPerSub: 29.2, gwpNewBusiness: 12.8, gwpRenewal: 12.0 },
  { name: "Lockton",             shortName: "Lockton",              type: "Regional",  submissions: 74,  premium: 18.6, bindRate: 81, avgHandleTime: 2.2, trend: "flat", trendPct: 1,  nB: 28, renewal: 46, quoted: 65,  bound: 53, lost: 12, declined:  9, newBusinessPolicies: 21, renewalPolicies: 32, totalTIV: 2.1,  avgTIVPerSub: 28.4, gwpNewBusiness:  7.2, gwpRenewal: 11.4 },
  { name: "Burns & Wilcox",      shortName: "Burns & Wilcox",       type: "Specialty", submissions: 52,  premium: 12.4, bindRate: 63, avgHandleTime: 3.1, trend: "up",   trendPct: 12, nB: 34, renewal: 18, quoted: 44,  bound: 28, lost: 16, declined:  8, newBusinessPolicies: 18, renewalPolicies: 10, totalTIV: 1.4,  avgTIVPerSub: 26.9, gwpNewBusiness:  8.1, gwpRenewal:  4.3 },
  { name: "AmWINS",              shortName: "AmWINS",               type: "Specialty", submissions: 38,  premium: 9.2,  bindRate: 58, avgHandleTime: 3.3, trend: "up",   trendPct: 6,  nB: 26, renewal: 12, quoted: 32,  bound: 19, lost: 13, declined:  6, newBusinessPolicies: 12, renewalPolicies:  7, totalTIV: 1.0,  avgTIVPerSub: 26.3, gwpNewBusiness:  5.6, gwpRenewal:  3.6 },
];

const TIMELINE_LABEL: Record<Timeline, string> = {
  "4w": "Last 4 Weeks", "q1": "Q1 2026", "q2": "Q2 2026 (Current)", "ytd": "Year to Date",
};

const TIMELINE_BUCKETS: Record<Timeline, { label: string; received: number; quoted: number; bound: number; lost: number; declined: number }[]> = {
  "4w":  [
    { label:"W1", received:30, quoted:22, bound:14, lost:5,  declined:3  },
    { label:"W2", received:34, quoted:26, bound:17, lost:6,  declined:3  },
    { label:"W3", received:36, quoted:28, bound:18, lost:7,  declined:3  },
    { label:"W4", received:35, quoted:27, bound:16, lost:7,  declined:4  },
  ],
  "q1":  [
    { label:"Jan", received:112, quoted:88,  bound:58,  lost:20, declined:14 },
    { label:"Feb", received:118, quoted:95,  bound:64,  lost:21, declined:10 },
    { label:"Mar", received:127, quoted:104, bound:71,  lost:23, declined:10 },
  ],
  "q2":  [
    { label:"Apr", received:135, quoted:112, bound:78,  lost:24, declined:10 },
    { label:"May", received:128, quoted:104, bound:72,  lost:22, declined:10 },
    { label:"Jun", received:118, quoted:96,  bound:65,  lost:21, declined:10 },
  ],
  "ytd": [
    { label:"Jan", received:112, quoted:88,  bound:58,  lost:20, declined:14 },
    { label:"Feb", received:118, quoted:95,  bound:64,  lost:21, declined:10 },
    { label:"Mar", received:127, quoted:104, bound:71,  lost:23, declined:10 },
    { label:"Apr", received:135, quoted:112, bound:78,  lost:24, declined:10 },
  ],
};

const HANDLE_TIME_BUCKETS: Record<Timeline, { label: string; actual: number; target: number }[]> = {
  "4w":  [{label:"W1",actual:2.8,target:3.5},{label:"W2",actual:2.6,target:3.5},{label:"W3",actual:2.9,target:3.5},{label:"W4",actual:2.7,target:3.5}],
  "q1":  [{label:"Jan",actual:3.2,target:3.5},{label:"Feb",actual:3.0,target:3.5},{label:"Mar",actual:2.9,target:3.5}],
  "q2":  [{label:"Apr",actual:2.7,target:3.5},{label:"May",actual:2.6,target:3.5},{label:"Jun",actual:2.5,target:3.5}],
  "ytd": [{label:"Q1",actual:3.0,target:3.5},{label:"Q2",actual:2.6,target:3.5}],
};

// Avatar initials palette
const AVATAR_PALETTES = [
  { bg: "#DBEAFE", color: "#1D4ED8" }, { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#FEF3C7", color: "#92400E" }, { bg: "#EDE9FE", color: "#5B21B6" },
  { bg: "#FCE7F3", color: "#9D174D" }, { bg: "#E0F2FE", color: "#0369A1" },
];
function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}
function memberInitials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function SlaBadge({ sla }: { sla: number }) {
  const cfg =
    sla >= 97 ? { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" } :
    sla >= 95 ? { bg: "#EEF6FF", text: "#0076BC", border: "#C2DFF4" } :
    sla >= 90 ? { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" } :
               { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
      {sla}%
    </span>
  );
}

// ── Submission Performance – custom SVG grouped bar chart ─────────────────
type TrendRow = { label: string; received: number; quoted: number; bound: number; lost: number; declined: number };
const SUBMISSION_SERIES: { key: keyof Omit<TrendRow, "label">; name: string; color: string }[] = [
  { key: "received", name: "Submissions Received", color: "#0076BC" },
  { key: "quoted",   name: "Quoted",               color: "#38BDF8" },
  { key: "bound",    name: "Bound",                color: "#00205B" },
  { key: "lost",     name: "Lost",                 color: "#F59E0B" },
  { key: "declined", name: "Declined",             color: "#EF4444" },
];

function SubmissionBarChart({ data }: { data: TrendRow[] }) {
  const [hov, setHov] = useState<number | null>(null);

  const VW = 680, VH = 210;
  const pL = 44, pR = 8, pT = 10, pB = 32;
  const plotW = VW - pL - pR;
  const plotH = VH - pT - pB;
  const N = data.length;

  const dataMax = Math.max(...data.flatMap(d => SUBMISSION_SERIES.map(s => d[s.key])));
  const yStep = dataMax <= 50 ? 10 : dataMax <= 100 ? 20 : 40;
  const yMax = Math.ceil(dataMax / yStep) * yStep + yStep;
  const yTicks = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep);

  const catW = plotW / N;
  const bGap = 2;
  const bW = Math.min(11, Math.max(4, Math.floor((catW * 0.44 - 4 * bGap) / 5)));
  const groupW = 5 * bW + 4 * bGap;

  const gL = (i: number) => pL + i * catW + (catW - groupW) / 2;
  const bX = (i: number, j: number) => gL(i) + j * (bW + bGap);
  const bY = (v: number) => pT + plotH - (Math.min(v, yMax) / yMax) * plotH;
  const bH = (v: number) => (Math.min(v, yMax) / yMax) * plotH;

  const rRect = (x: number, y: number, w: number, h: number) => {
    if (h <= 0) return "";
    const r = Math.min(2, h / 2, w / 2);
    if (r <= 0) return `M ${x},${y} h ${w} v ${h} h ${-w} z`;
    return `M ${x+r},${y} L ${x+w-r},${y} Q ${x+w},${y} ${x+w},${y+r} L ${x+w},${y+h} L ${x},${y+h} L ${x},${y+r} Q ${x},${y} ${x+r},${y} Z`;
  };

  return (
    <div className="select-none">
      <div className="relative" style={{ overflow: "visible" }}>
        <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block", overflow: "visible" }}>
          {/* Grid + Y labels */}
          {yTicks.map(v => {
            const y = bY(v);
            return (
              <g key={v}>
                <line x1={pL} y1={y} x2={VW - pR} y2={y}
                  stroke={v === 0 ? "#D1D5DB" : "#EEF0F4"}
                  strokeWidth={v === 0 ? 1 : 0.8}
                  strokeDasharray={v === 0 ? undefined : "3 4"} />
                <text x={pL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill="#9CA3AF" fontFamily="inherit">{v}</text>
              </g>
            );
          })}
          <line x1={pL} y1={pT} x2={pL} y2={pT + plotH} stroke="#D1D5DB" strokeWidth={1} />

          {/* Groups */}
          {data.map((d, i) => {
            const active = hov === i;
            return (
              <g key={d.label}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{ cursor: "default" }}>
                {/* Hover zone */}
                <rect x={pL + i * catW + 2} y={pT} width={catW - 4} height={plotH}
                  fill={active ? "rgba(0,118,188,0.05)" : "transparent"} rx={3} />
                {/* Bars */}
                {SUBMISSION_SERIES.map((s, j) => {
                  const v = d[s.key];
                  const h = bH(v);
                  const d2 = rRect(bX(i, j), bY(v), bW, h);
                  return d2 ? (
                    <path key={s.key} d={d2} fill={s.color}
                      opacity={hov === null || active ? 1 : 0.3} />
                  ) : null;
                })}
                {/* X label */}
                <text x={pL + i * catW + catW / 2} y={pT + plotH + 18}
                  textAnchor="middle" fontSize={10} fontFamily="inherit"
                  fill={active ? "#00205B" : "#6B7280"}
                  fontWeight={active ? 700 : 400}>{d.label}</text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hov !== null && (() => {
          const d = data[hov];
          const pct = (pL + hov * catW + catW / 2) / VW * 100;
          return (
            <div className="absolute pointer-events-none"
              style={{ top: 4, left: `${pct}%`, transform: "translate(-50%, 0)", zIndex: 30 }}>
              <div className="rounded-xl border border-[#E0E8FF] bg-white px-3 py-2"
                style={{ boxShadow: "0 8px 32px rgba(0,32,91,0.18)", minWidth: 158 }}>
                <div className="text-[9px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#00205B" }}>{d.label}</div>
                {SUBMISSION_SERIES.map(s => (
                  <div key={s.key} className="flex items-center justify-between gap-4 py-px">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[9px]" style={{ color: "#6B7280" }}>{s.name}</span>
                    </div>
                    <span className="text-[9px] font-bold tabular-nums" style={{ color: "#0D1B2E" }}>{d[s.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3">
        {SUBMISSION_SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-semibold" style={{ color: "#4A6080" }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom tooltip for other charts
function QBETooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E0E8FF] bg-white px-2.5 py-1.5"
      style={{ boxShadow: "0 8px 24px rgba(0,32,91,0.14)", minWidth: 100 }}>
      <div className="text-[9px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#00205B" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-[9px]" style={{ color: "#6B7280" }}>{p.name}</span>
          </div>
          <span className="text-[9px] font-bold" style={{ color: "#0D1B2E" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TeamPerformance() {
  const role = useRole();
  const isManager = role === "manager";
  const mikeMember = TEAM_MEMBERS.find(m => m.id === "mike-chen")!;
  const defaultRegion: Region | "all" = isManager ? "all" : mikeMember.region;
  const defaultTeam: string | "all" = isManager ? "all" : mikeMember.team;

  const [region, setRegion] = useState<Region | "all">(defaultRegion);
  const [team, setTeam] = useState<string | "all">(defaultTeam);
  const [timeline, setTimeline] = useState<Timeline>("q2");
  const [memberId, setMemberId] = useState<string>("all");

  const visibleMembers = useMemo(() => TEAM_MEMBERS.filter(m => {
    if (!isManager && m.team !== mikeMember.team) return false;
    if (region !== "all" && m.region !== region) return false;
    if (team !== "all" && m.team !== team) return false;
    if (memberId !== "all" && m.id !== memberId) return false;
    return true;
  }), [isManager, mikeMember.team, region, team, memberId]);

  const teamOptions = useMemo(() => {
    const base = isManager ? TEAM_MEMBERS : TEAM_MEMBERS.filter(m => m.team === mikeMember.team);
    return Array.from(new Set(base.filter(m => region === "all" || m.region === region).map(m => m.team)));
  }, [isManager, mikeMember.team, region]);

  const totals = useMemo(() => {
    const n = visibleMembers.length || 1;
    return {
      submissions: visibleMembers.reduce((s, m) => s + m.submissions, 0),
      premium:     visibleMembers.reduce((s, m) => s + m.premium, 0),
      handleTime:  visibleMembers.reduce((s, m) => s + m.handleTime, 0) / n,
      sla:         visibleMembers.reduce((s, m) => s + m.sla, 0) / n,
      bindRate:    visibleMembers.reduce((s, m) => s + m.bindRate, 0) / n,
    };
  }, [visibleMembers]);

  const regionRollup = useMemo(() => {
    return (["Northeast", "Southeast", "Midwest", "West"] as Region[]).map(r => {
      const mems = TEAM_MEMBERS.filter(m => m.region === r);
      return {
        region: r,
        submissions: mems.reduce((s, m) => s + m.submissions, 0),
        premium:     mems.reduce((s, m) => s + m.premium, 0),
        handleTime:  mems.reduce((s, m) => s + m.handleTime, 0) / mems.length,
        sla:         mems.reduce((s, m) => s + m.sla, 0) / mems.length,
        members:     mems.length,
      };
    });
  }, []);

  const submissionsTrend = TIMELINE_BUCKETS[timeline];
  const handleTrend      = HANDLE_TIME_BUCKETS[timeline];


  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: "#F4F7FB" }}>
      <div className="p-6 flex flex-col gap-5">

        {/* ── Hero banner + KPI stat strip ── */}
        <div className="rounded-2xl overflow-hidden border border-[#C5D4E8]"
          style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05)" }}>

          {/* Top row: icon + title on left, filters on right */}
          <div className="flex items-center gap-3 px-5 py-3.5"
            style={{ background: "linear-gradient(135deg, #00205B 0%, #0076BC 100%)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-white leading-tight">
                {isManager ? "Portfolio Exceeding Plan" : "Team Exceeding Plan"}
              </div>
              <div className="text-[11px] text-white/60">
                {isManager ? "Manager view · all regions" : `Underwriter view · ${mikeMember.team}`}
                {region !== "all" && ` · ${region}`}
                {" · "}{TIMELINE_LABEL[timeline]}
              </div>
            </div>
            {/* Filters on the right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <select value={memberId} onChange={e => setMemberId(e.target.value)}
                  className="text-[11px] pl-2.5 pr-6 py-1.5 rounded-lg border text-white focus:outline-none cursor-pointer appearance-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}>
                  <option value="all" className="text-[#0D1B2E] bg-white">All Members</option>
                  {TEAM_MEMBERS.filter(m => isManager || m.team === mikeMember.team)
                    .map(m => <option key={m.id} value={m.id} className="text-[#0D1B2E] bg-white">{m.name}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.6)" }} />
              </div>
              <div className="relative">
                <select value={timeline} onChange={e => setTimeline(e.target.value as Timeline)}
                  className="text-[11px] pl-2.5 pr-6 py-1.5 rounded-lg border text-white focus:outline-none cursor-pointer appearance-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}>
                  {[["4w","Last 4 Weeks"],["q1","Q1 2026"],["q2","Q2 2026"],["ytd","Year to Date"]].map(([v, l]) =>
                    <option key={v} value={v} className="text-[#0D1B2E] bg-white">{l}</option>
                  )}
                </select>
                <ChevronDown className="w-3 h-3 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.6)" }} />
              </div>
            </div>
          </div>

          {/* KPI stat strip */}
          <div className="grid divide-x divide-[#E8EDF4]"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", backgroundColor: "white" }}>
            {[
              { icon: BarChart3,  label: "Submission Volume",   value: `${totals.submissions}`,            sub: TIMELINE_LABEL[timeline] },
              { icon: DollarSign, label: "Premium Written",      value: `$${totals.premium.toFixed(1)}M`,  sub: "Gross Written Premium" },
              { icon: Target,     label: "Submission to Quote",  value: `${Math.round(totals.bindRate)}%`, sub: "avg across visible members" },
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

        {/* ── Body ── */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 flex flex-col gap-5">

            {/* Region rollup — Manager only */}
            {isManager && (
              <div className="bg-white rounded-2xl border border-[#E0E8FF] overflow-hidden"
                style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF5]" style={{ backgroundColor: "#F8FBFF" }}>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: "#00205B" }}>Performance by Region</div>
                    <div className="text-[11px]" style={{ color: "#94A3B8" }}>Click a region row to filter</div>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0F6FF" }}>
                      {["Region","Members","Submissions","Premium","Handle Time"].map((h, i) => (
                        <th key={h} className={`py-2 text-[10px] uppercase tracking-widest font-bold ${i === 0 ? "text-left px-5" : i === 4 ? "text-right px-5" : "text-right px-3"}`}
                          style={{ color: "#4A6080" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionRollup.map((r, i) => (
                      <tr key={r.region}
                        className="border-t border-[#F0F6FF] cursor-pointer transition-colors"
                        style={{ backgroundColor: region === r.region ? "#EEF6FF" : i % 2 === 0 ? "white" : "#FAFBFD" }}
                        onClick={() => { setRegion(r.region); setTeam("all"); setMemberId("all"); }}
                        onMouseEnter={e => { if (region !== r.region) (e.currentTarget as HTMLElement).style.backgroundColor = "#F0F6FF"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = region === r.region ? "#EEF6FF" : i % 2 === 0 ? "white" : "#FAFBFD"; }}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            {region === r.region && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />}
                            <span className="text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{r.region}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[12px]" style={{ color: "#4A6080" }}>{r.members}</td>
                        <td className="px-3 py-2.5 text-right text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{r.submissions}</td>
                        <td className="px-3 py-2.5 text-right text-[12px]" style={{ color: "#4A6080" }}>${r.premium.toFixed(1)}M</td>
                        <td className="px-5 py-2.5 text-right text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{r.handleTime?.toFixed(1) ?? "—"}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Submission Performance chart */}
            <div className="bg-white rounded-2xl border border-[#E0E8FF] overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
              <div className="px-5 py-3.5 border-b border-[#E8EDF5]" style={{ backgroundColor: "#F8FBFF" }}>
                <div className="text-[13px] font-bold" style={{ color: "#00205B" }}>Submission Performance</div>
                <div className="text-[11px]" style={{ color: "#94A3B8" }}>{TIMELINE_LABEL[timeline]}</div>
              </div>
              <div className="px-5 pb-5 pt-4">
                <SubmissionBarChart data={submissionsTrend} />
              </div>
            </div>

            {/* Member breakdown table */}
            <div className="bg-white rounded-2xl border border-[#E0E8FF] overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF5]" style={{ backgroundColor: "#F8FBFF" }}>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: "#00205B" }}>
                    {isManager ? "Performance by Team Member" : "My Team"}
                  </div>
                  <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                    {visibleMembers.length} {visibleMembers.length === 1 ? "member" : "members"} matching filters
                  </div>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#F0F6FF" }}>
                    {["Underwriter","Region · Team","Subs","Premium","Submission to Quote","Handle Time"].map((h, i) => (
                      <th key={h} className={`py-2 text-[10px] uppercase tracking-widest font-bold text-left ${i === 0 ? "px-5" : i === 5 ? "px-5" : "px-3"}`}
                        style={{ color: "#4A6080" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleMembers.map((m, i) => {
                    const pal = avatarPalette(m.name);
                    const initials = memberInitials(m.name);
                    const isMe = m.id === mikeMember.id && !isManager;
                    return (
                      <tr key={m.id}
                        className="border-t border-[#F0F6FF] transition-colors"
                        style={{ backgroundColor: i % 2 === 0 ? "white" : "#FAFBFD" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F0F6FF"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? "white" : "#FAFBFD"; }}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: pal.bg, color: pal.color }}>{initials}</div>
                            <div>
                              <div className="text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>
                                {m.name}{isMe && <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#EEF6FF", color: "#0076BC" }}>You</span>}
                              </div>
                              <div className="text-[10px]" style={{ color: "#94A3B8" }}>{m.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[11px]" style={{ color: "#6B7280" }}>{m.region} · {m.team}</td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{m.submissions}</td>
                        <td className="px-3 py-2.5 text-[12px]" style={{ color: "#4A6080" }}>${m.premium.toFixed(1)}M</td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{m.bindRate}%</td>
                        <td className="px-5 py-2.5 text-[12px]" style={{ color: "#4A6080" }}>{m.handleTime.toFixed(1)}d</td>
                      </tr>
                    );
                  })}
                  {visibleMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center px-6 py-8 text-[12px]" style={{ color: "#94A3B8" }}>
                        No team members match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-5">
            {/* Bind rate leaderboard */}
            <div className="bg-white rounded-2xl border border-[#E0E8FF] overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
              <div className="px-5 py-3.5 border-b border-[#E8EDF5]" style={{ backgroundColor: "#F8FBFF" }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: "#0076BC" }} />
                  <div className="text-[13px] font-bold" style={{ color: "#00205B" }}>Bind Rate Leaders</div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {[...visibleMembers].sort((a,b) => b.bindRate - a.bindRate).slice(0, 5).map((m, i) => {
                  const pal = avatarPalette(m.name);
                  const initials = memberInitials(m.name);
                  const pct = m.bindRate;
                  return (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold w-4 text-right flex-shrink-0" style={{ color: i === 0 ? "#F9760A" : "#94A3B8" }}>
                        {i + 1}
                      </span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: pal.bg, color: pal.color }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{m.name}</div>
                        <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "#E0E8FF" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: i === 0 ? "#F9760A" : "#0076BC" }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: i === 0 ? "#F9760A" : "#0D1B2E" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission to Quote Handle Time chart */}
            <div className="bg-white rounded-2xl border border-[#E0E8FF] overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
              <div className="px-5 py-3.5 border-b border-[#E8EDF5]" style={{ backgroundColor: "#F8FBFF" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#0076BC" }} />
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: "#00205B" }}>Submission to Quote Handle Time</div>
                    <div className="text-[11px]" style={{ color: "#94A3B8" }}>Days per underwriter · target 3.5d · {TIMELINE_LABEL[timeline]}</div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {visibleMembers.length === 0 ? (
                  <div className="py-8 text-center text-[12px]" style={{ color: "#94A3B8" }}>No members match the selected filters.</div>
                ) : (
                  <HandleTimeChart members={visibleMembers} />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Handle Time – pure SVG horizontal bar chart ────────────────
function HandleTimeChart({ members }: { members: TeamMember[] }) {
  const TARGET = 3.5;
  const BAR_H = 20;
  const GAP = 8;
  const pL = 60; // left pad for initials
  const pR = 48; // right pad for value labels
  const pT = 8;
  const pB = 24; // bottom pad for x-axis labels
  const VW = 580;
  const VH = pT + members.length * (BAR_H + GAP) - GAP + pB;
  const plotW = VW - pL - pR;

  const maxVal = Math.max(...members.map(m => m.handleTime), TARGET, 4);
  const xMax = Math.ceil(maxVal * 2) / 2; // round to nearest 0.5d
  const x = (v: number) => pL + (v / xMax) * plotW;
  const barY = (i: number) => pT + i * (BAR_H + GAP);

  const xTicks = Array.from({ length: Math.floor(xMax * 2) + 1 }, (_, i) => i * 0.5).filter(v => v <= xMax);

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const barColor = (ht: number) => ht > TARGET ? "#EF4444" : ht > TARGET - 0.5 ? "#F59E0B" : "#0076BC";

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block", overflow: "visible" }}>
      {/* Grid lines */}
      {xTicks.map(v => {
        const cx = x(v);
        return (
          <g key={v}>
            <line x1={cx} y1={pT} x2={cx} y2={pT + members.length * (BAR_H + GAP) - GAP}
              stroke={v === 0 ? "#D1D5DB" : "#EEF0F4"} strokeWidth={0.8}
              strokeDasharray={v === 0 ? undefined : "3 4"} />
            <text x={cx} y={VH - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF" fontFamily="inherit">
              {v % 1 === 0 ? `${v}d` : `${v}`}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {members.map((m, i) => {
        const by = barY(i);
        const bw = Math.max(0, (m.handleTime / xMax) * plotW);
        const color = barColor(m.handleTime);
        return (
          <g key={m.id}>
            {/* Background track */}
            <rect x={pL} y={by} width={plotW} height={BAR_H} rx={4} fill="#F1F5F9" />
            {/* Value bar */}
            <rect x={pL} y={by} width={bw} height={BAR_H} rx={4} fill={color} opacity={0.85} />
            {/* Initials label */}
            <text x={pL - 6} y={by + BAR_H / 2 + 4} textAnchor="end" fontSize={10}
              fill="#4A6080" fontFamily="inherit" fontWeight="600">
              {initials(m.name)}
            </text>
            {/* Value label */}
            <text x={pL + bw + 6} y={by + BAR_H / 2 + 4} textAnchor="start" fontSize={10}
              fill={color} fontFamily="inherit" fontWeight="700">
              {m.handleTime.toFixed(1)}d
            </text>
          </g>
        );
      })}

      {/* Target reference line */}
      {(() => {
        const tx = x(TARGET);
        const lBottom = pT + members.length * (BAR_H + GAP) - GAP;
        return (
          <g>
            <line x1={tx} y1={pT - 4} x2={tx} y2={lBottom}
              stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={tx} y={pT - 6} textAnchor="middle" fontSize={8.5}
              fill="#D97706" fontFamily="inherit" fontWeight="600">
              Target
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options, disabled }: {
  icon?: any; label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-3 py-2 bg-white border border-[#E0E8FF] rounded-xl text-[12px] text-[#4A6080] focus:outline-none focus:ring-2 focus:ring-[#0076BC] ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function KPICard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0E8FF] px-5 py-4"
      style={{ boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 16px rgba(0,32,91,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF6FF" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: "#0076BC" }} />
        </div>
        <div className="text-[11px] leading-tight" style={{ fontWeight: 500, color: "#4A6080" }}>{label}</div>
      </div>
      <div className="text-[26px] font-extrabold leading-none mb-2" style={{ color: "#0D1B2E", letterSpacing: "-0.5px" }}>{value}</div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#22C55E" }} />
        <span className="text-[11px]" style={{ color: "#6B7280" }}>{sub}</span>
      </div>
    </div>
  );
}

function QBEProgressRow({ label, value, pct, color, trackColor }: {
  label: string; value: string; pct: number; color: string; trackColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px]" style={{ color: "#4A6080" }}>{label}</span>
        <span className="text-[12px] font-bold" style={{ color: "#0D1B2E" }}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SidebarRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: "#6B7280" }}>{label}</span>
      <span className={bold ? "text-[14px] font-bold" : "text-[12px] font-semibold"} style={{ color: "#0D1B2E" }}>{value}</span>
    </div>
  );
}

