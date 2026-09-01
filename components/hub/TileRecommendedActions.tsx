"use client";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight } from "lucide-react";

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

const FLAG_PILL: Record<string, { label: string; bg: string; text: string; border: string }> = {
  urgent:  { label: "Urgent",  bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  sla:     { label: "SLA",     bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  overdue: { label: "Overdue", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  info:    { label: "Info",    bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
};

const aiItems = [
  {
    id: "ai-1",
    subject: "Heartland Industrial Holdings — UW review required before SLA deadline",
    submission: "SUB-2026-1103",
    time: "Now",
    flag: "urgent" as const,
  },
  {
    id: "ai-3",
    subject: "Pinnacle Global Industries — indication pending broker response",
    submission: "SUB-2026-1214",
    time: "22m ago",
    flag: "sla" as const,
  },
];

export function TileRecommendedActions({ onOpen }: { onOpen: (id: string) => void }) {
  const router = useRouter();

  return (
    <div className={TILE} style={TILE_SHADOW}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <Sparkles style={{ width: 10, height: 10, color: "white" }} />
        </div>
        <span className="text-[12px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Recommended Actions</span>
        <span className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>{aiItems.length}</span>
      </div>
      <div className="mx-3 mb-2 px-2.5 py-2 rounded-xl border border-[#C2DFF4]" style={{ backgroundColor: "#EEF6FF" }}>
        <p className="text-[10px] leading-relaxed" style={{ color: "#1E3A5F" }}>
          Good morning, Mike. You have{" "}
          <strong style={{ color: "#0D1B2E" }}>5 submissions</strong> in your queue — Heartland Industrial Holdings is your top priority — SLA deadline is today.
        </p>
      </div>
      <div className="px-3 pb-2.5 flex flex-col gap-1.5 flex-1">
        {aiItems.slice(0, 3).map((item) => {
          const pill = item.flag ? FLAG_PILL[item.flag] : null;
          return (
            <div key={item.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer border"
              style={{ backgroundColor: "#F8FBFF", borderColor: "#EEF2FF" }}
              onClick={() => { if (item.submission) onOpen(item.submission); }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
                <Sparkles style={{ width: 8, height: 8, color: "white" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold leading-snug truncate flex-1 min-w-0" style={{ color: "#0D1B2E" }}>
                    {item.subject}
                  </span>
                  {pill && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded-full border flex-shrink-0"
                      style={{ backgroundColor: pill.bg, color: pill.text, borderColor: pill.border }}>
                      {pill.label}
                    </span>
                  )}
                  <span className="text-[8px] flex-shrink-0" style={{ color: "#94A3B8" }}>{item.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-[#F0F4FF] cursor-pointer hover:bg-[#F8FBFF] rounded-b-2xl transition-colors"
        onClick={() => router.push("/actions")}>
        <span className="text-[10px] font-semibold" style={{ color: "#0076BC" }}>View All Actions</span>
        <ChevronRight style={{ width: 11, height: 11, color: "#0076BC" }} />
      </div>
    </div>
  );
}
