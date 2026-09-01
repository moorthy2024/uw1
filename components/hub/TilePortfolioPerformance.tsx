"use client";
import { useRouter } from "next/navigation";
import { TrendingUp, ChevronRight } from "lucide-react";

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

export function TilePortfolioPerformance() {
  const router = useRouter();

  return (
    <div className={TILE} style={TILE_SHADOW}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <TrendingUp style={{ width: 10, height: 10, color: "white" }} />
        </div>
        <span className="text-[12px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Portfolio Performance</span>
      </div>

      <div className="px-3 pb-1 flex flex-col gap-2 flex-1 justify-center">
        {/* Renewal group */}
        <div className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#0076BC" }}>Renewal</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="rounded-xl px-3 py-2.5 border border-[#DBEAFE]" style={{ backgroundColor: "#EFF6FF" }}>
            <div className="text-[9px] leading-tight mb-1" style={{ color: "#3B82F6", fontWeight: 600 }}>Bound</div>
            <div className="text-[20px] font-extrabold tabular-nums leading-none" style={{ color: "#00205B", letterSpacing: "-0.6px" }}>68</div>
          </div>
          <div className="rounded-xl px-3 py-2.5 border border-[#DBEAFE]" style={{ backgroundColor: "#EFF6FF" }}>
            <div className="text-[9px] leading-tight mb-1" style={{ color: "#3B82F6", fontWeight: 600 }}>Premium</div>
            <div className="text-[20px] font-extrabold tabular-nums leading-none" style={{ color: "#00205B", letterSpacing: "-0.6px" }}>$11.8M</div>
            <div className="text-[7px] mt-1 leading-tight" style={{ color: "#64748B" }}>Total Premium for all bound policies</div>
          </div>
        </div>

        {/* New Business group */}
        <div className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#00205B" }}>New Business</div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-xl px-3 py-2.5 border border-[#C7D2FE]" style={{ backgroundColor: "#EEF2FF" }}>
            <div className="text-[9px] leading-tight mb-1" style={{ color: "#6366F1", fontWeight: 600 }}>Bound</div>
            <div className="text-[20px] font-extrabold tabular-nums leading-none" style={{ color: "#00205B", letterSpacing: "-0.6px" }}>34</div>
          </div>
          <div className="rounded-xl px-3 py-2.5 border border-[#C7D2FE]" style={{ backgroundColor: "#EEF2FF" }}>
            <div className="text-[9px] leading-tight mb-1" style={{ color: "#6366F1", fontWeight: 600 }}>Premium</div>
            <div className="text-[20px] font-extrabold tabular-nums leading-none" style={{ color: "#00205B", letterSpacing: "-0.6px" }}>$4.2M</div>
            <div className="text-[7px] mt-1 leading-tight" style={{ color: "#64748B" }}>Total Premium for all bound policies</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-t border-[#F0F4FF]">
        <div className="text-[9px]" style={{ color: "#94A3B8" }}>Team Portfolio Data as of October 23, 2026</div>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-[#F0F4FF] cursor-pointer hover:bg-[#F8FBFF] rounded-b-2xl transition-colors"
        onClick={() => router.push("/performance")}>
        <span className="text-[10px] font-semibold" style={{ color: "#0076BC" }}>View Portfolio Performance</span>
        <ChevronRight style={{ width: 11, height: 11, color: "#0076BC" }} />
      </div>
    </div>
  );
}
