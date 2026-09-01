"use client";
import { useState } from "react";
import { Users, Mail, TrendingUp, Clock, AlertCircle, Send, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ScrollRegion } from "./ScrollRegion";

const producerData = [
  {
    producer: "Marsh & McLennan",
    producerTier: "Platinum",
    totalSubmissions: 342,
    submissionVolume: 28,
    quoteConversionRate: "72%",
    bindConversionRate: "58%",
    averageWrittenPremium: "$485,000",
    responseTime: "2.1 days",
    openCommunicationsCount: 5,
    submissionPipelineStatus: "Active",
    producerEngagementScore: 92,
    slaStatus: "Compliant",
  },
  {
    producer: "Aon",
    producerTier: "Platinum",
    totalSubmissions: 298,
    submissionVolume: 24,
    quoteConversionRate: "68%",
    bindConversionRate: "55%",
    averageWrittenPremium: "$520,000",
    responseTime: "2.4 days",
    openCommunicationsCount: 3,
    submissionPipelineStatus: "Active",
    producerEngagementScore: 88,
    slaStatus: "Compliant",
  },
  {
    producer: "Willis Towers Watson",
    producerTier: "Gold",
    totalSubmissions: 187,
    submissionVolume: 15,
    quoteConversionRate: "65%",
    bindConversionRate: "52%",
    averageWrittenPremium: "$412,000",
    responseTime: "2.8 days",
    openCommunicationsCount: 8,
    submissionPipelineStatus: "Active",
    producerEngagementScore: 85,
    slaStatus: "At Risk",
  },
  {
    producer: "Lockton",
    producerTier: "Gold",
    totalSubmissions: 156,
    submissionVolume: 12,
    quoteConversionRate: "70%",
    bindConversionRate: "60%",
    averageWrittenPremium: "$398,000",
    responseTime: "2.3 days",
    openCommunicationsCount: 2,
    submissionPipelineStatus: "Active",
    producerEngagementScore: 90,
    slaStatus: "Compliant",
  },
];

const volumeChartData = [
  { month: "Oct", volume: 82 },
  { month: "Nov", volume: 91 },
  { month: "Dec", volume: 78 },
  { month: "Jan", volume: 95 },
  { month: "Feb", volume: 88 },
  { month: "Mar", volume: 103 },
];

// ── shared style tokens ──────────────────────────────────────────
const CARD = "bg-white rounded-2xl border border-[#C5D4E8]";
const CARD_SHADOW: React.CSSProperties = { boxShadow: "0 1px 4px rgba(0,32,91,0.05)" };
const HERO_GRADIENT: React.CSSProperties = { background: "linear-gradient(135deg,#00205B,#0076BC)" };
const SECTION_GRADIENT: React.CSSProperties = { background: "linear-gradient(135deg,#EEF6FF,#F8FBFF)" };
const TOOLTIP_STYLE = { fontSize: "11px", borderRadius: "8px", border: "1px solid #C5D4E8", backgroundColor: "#fff" };

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "Platinum"
      ? "bg-[#EEF6FF] text-[#0076BC] border-[#C2DFF4]"
      : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
  return (
    <span className={`rounded-full text-[11px] font-semibold border px-2 py-0.5 ${cls}`}>{tier}</span>
  );
}

function SlaBadge({ status }: { status: string }) {
  const cls =
    status === "Compliant"
      ? "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
      : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
  return (
    <span className={`rounded-full text-[11px] font-semibold border px-2 py-0.5 ${cls}`}>{status}</span>
  );
}

function HoverRow({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? "#F5F8FF" : "transparent" }}
      className={`transition-colors cursor-pointer ${!isLast ? "border-b border-[#EEF2F7]" : ""}`}
    >
      {children}
    </tr>
  );
}

export function Distribution() {
  return (
    <div className="h-full flex flex-col overflow-hidden p-6 gap-4">

      {/* Summary stat strip — single hero card */}
      <div className={`${CARD} flex-shrink-0 overflow-hidden`} style={CARD_SHADOW}>
        <div className="flex items-center gap-3 px-5 py-4" style={HERO_GRADIENT}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">Producer Performance Summary</div>
            <div className="text-[11px] text-white/70">Aggregate metrics across active producers</div>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-[#E8EDF4]">
          <div className="px-4 py-3.5">
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>Active Producers</div>
            <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>24</div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>Avg Conversion</div>
            <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>56%</div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>Avg Response</div>
            <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>2.4d</div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: "#94A3B8" }}>Open Comms</div>
            <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>18</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">

        {/* Main Content */}
        <div className="col-span-2 flex flex-col min-h-0 gap-4">

          {/* Submission Volume Trend */}
          <div className={`${CARD} flex-shrink-0 overflow-hidden`} style={CARD_SHADOW}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-white">Submission Volume (Trailing Period)</div>
                <div className="text-[11px] text-white/70">Monthly submission trends from all producers</div>
              </div>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={volumeChartData}>
                  <CartesianGrid key="grid-dist" strokeDasharray="3 3" stroke="#E8EDF4" />
                  <XAxis key="xaxis-dist" dataKey="month" stroke="#94A3B8" style={{ fontSize: "11px" }} />
                  <YAxis key="yaxis-dist" stroke="#94A3B8" style={{ fontSize: "11px" }} />
                  <Tooltip
                    key="tooltip-dist"
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar key="bar-volume" dataKey="volume" fill="#0076BC" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Producer Performance Table */}
          <div className={`${CARD} flex-1 min-h-0 flex flex-col overflow-hidden`} style={CARD_SHADOW}>
            <div className="px-5 py-4 border-b border-[#C5D4E8] flex-shrink-0" style={SECTION_GRADIENT}>
              <div className="text-[14px] font-bold" style={{ color: "#0D1B2E" }}>Producer Performance</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Key metrics and engagement scores</div>
            </div>

            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#FAFBFC] border-b border-[#E8EDF4]">
                    {["Producer", "Tier", "Volume (30d)", "Bind Rate", "Avg Premium", "Engagement", "SLA"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {producerData.map((prod, idx) => (
                    <HoverRow key={idx} isLast={idx === producerData.length - 1}>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{prod.producer}</div>
                        <div className="text-[11px]" style={{ color: "#94A3B8" }}>{prod.openCommunicationsCount} open comms</div>
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={prod.producerTier} />
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{prod.submissionVolume}</td>
                      <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#0D1B2E" }}>{prod.bindConversionRate}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "#0D1B2E" }}>{prod.averageWrittenPremium}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#E8EDF4] rounded-full h-1.5 max-w-[60px]">
                            <div className="bg-[#0076BC] h-1.5 rounded-full" style={{ width: `${prod.producerEngagementScore}%` }} />
                          </div>
                          <span className="text-[11px]" style={{ color: "#94A3B8" }}>{prod.producerEngagementScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SlaBadge status={prod.slaStatus} />
                      </td>
                    </HoverRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-1 flex flex-col min-h-0">
          <ScrollRegion ariaLabel="Communications and insights" innerClassName="space-y-4 pr-1" fadeColor="#F9F9F8">

            {/* Open Communications */}
            <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">Open Communications</div>
                  <div className="text-[11px] text-white/70">Pending responses and follow-ups</div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="p-3 bg-[#F8FBFF] rounded-xl border border-[#C5D4E8]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[12px] font-medium" style={{ color: "#0D1B2E" }}>Quote Package – SUB-2026-0846</div>
                      <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>To: Aon (Global Tech Industries)</div>
                    </div>
                    <span className="text-[11px]" style={{ color: "#94A3B8" }}>2 days ago</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-white border border-[#C5D4E8] rounded-lg text-[11px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                      View Thread
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors" style={{ backgroundColor: "#00205B" }}>
                      Follow Up
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#FDE68A] bg-[#FEF3C7]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" style={{ color: "#B45309" }} />
                        <div className="text-[12px] font-medium" style={{ color: "#0D1B2E" }}>Info Request – SUB-2026-0845</div>
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>To: Willis Towers Watson (Atlantic Distribution)</div>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: "#B45309" }}>Overdue 1d</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-white border border-[#C5D4E8] rounded-lg text-[11px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                      View Thread
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors" style={{ backgroundColor: "#00205B" }}>
                      Send Reminder
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FBFF] rounded-xl border border-[#C5D4E8]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[12px] font-medium" style={{ color: "#0D1B2E" }}>Pricing Discussion – SUB-2026-0843</div>
                      <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>To: Lockton (Pacific Coast Hotels)</div>
                    </div>
                    <span className="text-[11px]" style={{ color: "#94A3B8" }}>5 hours ago</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-white border border-[#C5D4E8] rounded-lg text-[11px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                      View Thread
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-[#C5D4E8] rounded-lg text-[11px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Insights */}
            <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[11px] font-bold">AI</span>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">Engagement Insights</div>
                  <div className="text-[11px] text-white/70">AI-generated producer signals</div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="p-3 rounded-xl border border-[#FDE68A] bg-[#FEF3C7]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#B45309" }} />
                    <div>
                      <div className="text-[12px] font-medium mb-1" style={{ color: "#0D1B2E" }}>Urgent Follow-Up</div>
                      <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                        Willis Towers Watson has 8 open items, 3 overdue. Schedule check-in call.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#C5D4E8] bg-[#F8FBFF]">
                  <div className="text-[12px] font-medium mb-1" style={{ color: "#0D1B2E" }}>High Performer</div>
                  <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                    Lockton maintains 90 engagement score with 60% bind rate. Consider capacity increase.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#C5D4E8] bg-[#F8FBFF]">
                  <div className="text-[12px] font-medium mb-1" style={{ color: "#0D1B2E" }}>Volume Alert</div>
                  <div className="text-[11px]" style={{ color: "#94A3B8" }}>
                    Marsh & McLennan volume up 18% MoM. Pipeline review recommended.
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8EDF4]">
                  <button className="w-full px-4 py-2 bg-white border border-[#C5D4E8] rounded-xl text-[12px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                    View Full Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">Quick Actions</div>
                  <div className="text-[11px] text-white/70">Common producer workflows</div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium text-white transition-colors" style={{ backgroundColor: "#00205B" }}>
                  <Mail className="w-4 h-4" />
                  Draft Email
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-[#C5D4E8] rounded-xl text-[12px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                  <Send className="w-4 h-4" />
                  Send Quote Package
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-[#C5D4E8] rounded-xl text-[12px] font-medium hover:bg-[#F8FBFF] transition-colors" style={{ color: "#0D1B2E" }}>
                  <Calendar className="w-4 h-4" />
                  Schedule Follow-Up
                </button>
              </div>
            </div>

            {/* Pipeline Status */}
            <div className={`${CARD} overflow-hidden`} style={CARD_SHADOW}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#C5D4E8]" style={HERO_GRADIENT}>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">Submission Pipeline Status</div>
                  <div className="text-[11px] text-white/70">Current stage distribution</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "In Review", count: 47, pct: 42, color: "#0076BC" },
                  { label: "Quoted", count: 35, pct: 31, color: "#0076BC" },
                  { label: "Pending Info", count: 18, pct: 16, color: "#B45309" },
                  { label: "Bound", count: 12, pct: 11, color: "#15803D" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>{item.label}</span>
                      <span className="text-[11px] font-medium" style={{ color: "#0D1B2E" }}>{item.count}</span>
                    </div>
                    <div className="bg-[#E8EDF4] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </ScrollRegion>
        </div>
      </div>
    </div>
  );
}

