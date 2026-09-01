"use client";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import { PROCESSING_STATUS_CONFIG, type ProcessingStatus } from "../CustomerTable";

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

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

const mineSubmissions = [
  { account: "Pacific Coast Hotels & Resorts",    id: "SUB-2026-0843", status: "uw-analysis"  as ProcessingStatus },
  { account: "Heartland Industrial Holdings LLC", id: "SUB-2026-1103", status: "uw-review"    as ProcessingStatus },
  { account: "Pinnacle Global Industries plc",    id: "SUB-2026-1214", status: "uw-review"    as ProcessingStatus },
  { account: "Westfield Manufacturing Corp",      id: "SUB-2026-0847", status: "uw-analysis"  as ProcessingStatus },
  { account: "Atlantic Distribution Centers",     id: "SUB-2026-0845", status: "uw-analysis"  as ProcessingStatus },
  { account: "TechCorp Solutions Inc",            id: "SUB-2026-0850", status: "ready-for-uw" as ProcessingStatus },
];

export function TilePrioritySubmissions({ onOpen }: { onOpen: (id: string) => void }) {
  const router = useRouter();

  return (
    <div className={TILE} style={TILE_SHADOW}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <ClipboardList style={{ width: 10, height: 10, color: "white" }} />
        </div>
        <span className="text-[12px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Priority Submissions</span>
        <span className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>{mineSubmissions.length}</span>
      </div>
      <div className="px-3 pb-2.5 flex flex-col flex-1">
        {mineSubmissions.slice(0, 4).map((sub, idx) => {
          const dot = MINE_STATUS_DOT[sub.status] ?? "#94A3B8";
          const label = MINE_STATUS_LABEL[sub.status] ?? sub.status;
          return (
            <div key={sub.id}
              className={`flex items-center gap-2 py-1.5 cursor-pointer rounded hover:bg-[#F4F6FF] transition-colors ${idx < 3 ? "border-b border-[#F4F6FF]" : ""}`}
              onClick={() => onOpen(sub.id)}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{sub.account}</div>
                <div className="text-[9px]" style={{ color: "#94A3B8" }}>{sub.id}</div>
              </div>
              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: dot + "18", color: dot }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-[#F0F4FF] cursor-pointer hover:bg-[#F8FBFF] rounded-b-2xl transition-colors"
        onClick={() => router.push("/customer")}>
        <span className="text-[10px] font-semibold" style={{ color: "#0076BC" }}>View My Submissions</span>
        <ChevronRight style={{ width: 12, height: 12, color: "#0076BC" }} />
      </div>
    </div>
  );
}
