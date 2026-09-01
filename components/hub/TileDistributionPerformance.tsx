"use client";
import { useRouter } from "next/navigation";
import { BarChart2, ChevronRight } from "lucide-react";

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

const brokerData = [
  { shortName: "Marsh",      submissions: 142, bound: 38 },
  { shortName: "AON",        submissions: 118, bound: 31 },
  { shortName: "Willis",     submissions: 96,  bound: 24 },
  { shortName: "CRC",        submissions: 74,  bound: 19 },
  { shortName: "Ryan Spec.", submissions: 52,  bound: 12 },
  { shortName: "RPS",        submissions: 38,  bound: 8  },
  { shortName: "Amwins",     submissions: 29,  bound: 6  },
];

const maxSubs = Math.max(...brokerData.map(b => b.submissions));

export function TileDistributionPerformance() {
  const router = useRouter();

  return (
    <div className={TILE} style={TILE_SHADOW}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <BarChart2 style={{ width: 10, height: 10, color: "white" }} />
        </div>
        <div>
          <div className="text-[12px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Distribution Performance</div>
          <div className="text-[8px] whitespace-nowrap" style={{ color: "#94A3B8" }}>Submissions received vs. Policies bound by broker</div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-2 flex items-center justify-end gap-4">
        <span className="flex items-center gap-1 text-[8px] font-semibold" style={{ color: "#0076BC" }}>
          <span className="w-2 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
          Submissions
        </span>
        <span className="flex items-center gap-1 text-[8px] font-semibold" style={{ color: "#00205B" }}>
          <span className="w-2 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#00205B" }} />
          Policies Bound
        </span>
      </div>

      {/* Column header */}
      <div className="flex items-center px-4 pb-1 gap-1">
        <div className="w-[52px] flex-shrink-0" />
        <div className="flex-1" />
        <div className="w-[42px] flex-shrink-0 text-right text-[8px] font-semibold" style={{ color: "#4A6080" }}>Bind %</div>
      </div>

      {/* Bar rows */}
      <div className="px-4 flex-1 flex flex-col justify-center gap-2.5 pb-2">
        {brokerData.map(b => {
          const subPct  = (b.submissions / maxSubs) * 72;
          const bndPct  = (b.bound / maxSubs) * 72;
          const bindRate = ((b.bound / b.submissions) * 100).toFixed(0);
          return (
            <div key={b.shortName} className="flex items-center gap-1.5">
              <div className="w-[52px] flex-shrink-0">
                <span className="text-[9px] font-semibold" style={{ color: "#374151" }}>{b.shortName}</span>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="relative h-2.5 flex items-center">
                  <div className="absolute left-0 h-2 rounded-full" style={{ width: `${subPct}%`, backgroundColor: "#0076BC" }} />
                  <span className="absolute text-[8px] font-bold tabular-nums" style={{ left: `${subPct}%`, paddingLeft: "3px", color: "#0076BC" }}>{b.submissions}</span>
                </div>
                <div className="relative h-2.5 flex items-center">
                  <div className="absolute left-0 h-2 rounded-full" style={{ width: `${bndPct}%`, backgroundColor: "#00205B" }} />
                  <span className="absolute text-[8px] font-bold tabular-nums" style={{ left: `${bndPct}%`, paddingLeft: "3px", color: "#00205B" }}>{b.bound}</span>
                </div>
              </div>
              <div className="w-[42px] flex-shrink-0 text-right">
                <span className="text-[9px] font-bold tabular-nums" style={{ color: "#00205B" }}>{bindRate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pt-1.5 pb-2 border-t border-[#F0F4FF]">
        <div className="text-[8px]" style={{ color: "#94A3B8" }}>Team Distribution Data as of October 23, 2026</div>
      </div>
      <div className="flex items-center gap-1 px-4 py-2 border-t border-[#F0F4FF] cursor-pointer hover:bg-[#F8FBFF] rounded-b-2xl transition-colors"
        onClick={() => { sessionStorage.setItem("performanceTab", "distribution"); router.push("/performance"); }}>
        <span className="text-[10px] font-semibold" style={{ color: "#0076BC" }}>View Distribution Performance</span>
        <ChevronRight style={{ width: 11, height: 11, color: "#0076BC" }} />
      </div>
    </div>
  );
}
