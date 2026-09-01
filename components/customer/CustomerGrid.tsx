"use client";
import { MapPin } from "lucide-react";
import {
  PROCESSING_STATUS_CONFIG,
  INTERACTIVE_ACCOUNTS,
  DATA_STATUS_CFG,
  type ProcessingStatus,
  type DataStatus,
} from "../CustomerTable";

interface SubmissionGridItem {
  id: string;
  account: string;
  homeOffice: string;
  submissionType: string;
  processingStatus: ProcessingStatus;
  brokerBoundRate: number;
  needByDate: string;
  dataStatus: DataStatus;
}

interface CustomerGridProps {
  sorted: SubmissionGridItem[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId?: string | null;
  onSubmissionSelect?: (id: string) => void;
}

function urgencyDays(needBy: string): number {
  return Math.ceil((new Date(needBy).getTime() - Date.now()) / 86400000);
}

function DataStatusBadge({ status }: { status: DataStatus }) {
  const cfg = DATA_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

function CompactSubmissionCard({ sub, isSelected, onClick }: {
  sub: SubmissionGridItem; isSelected: boolean; onClick: () => void;
}) {
  const cfg = PROCESSING_STATUS_CONFIG[sub.processingStatus];
  const days = urgencyDays(sub.needByDate);
  const urgColor = days <= 3 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-[#94A3B8]";
  const bindColor = sub.brokerBoundRate >= 75 ? "#22C55E" : sub.brokerBoundRate >= 60 ? "#0076BC" : "#F59E0B";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-[#EEF2FF] transition-colors ${
        isSelected ? "bg-[#EEF6FF] border-l-2 border-l-[#0076BC]" : "hover:bg-[#F8FBFF]"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {/* Bind Rate ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
          <div className="w-9 h-9 relative">
            <svg width="36" height="36" className="-rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E0E8FF" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={bindColor} strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - sub.brokerBoundRate / 100)}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px]"
              style={{ fontWeight: 700, color: bindColor }}>{sub.brokerBoundRate}</span>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#C0CEDC" }}>Bind Rate</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[#0D1B2E] truncate leading-snug mb-0.5" style={{ fontWeight: 600 }}>{sub.account}</div>
          <div className="text-[10px] text-[#94A3B8] mb-1.5">{sub.id} · {sub.submissionType}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function CustomerGrid({ sorted, search, onSearchChange, selectedId, onSubmissionSelect }: CustomerGridProps) {
  return (
    <div>
      <div className="px-3 py-2 bg-[#F8FBFF] border-b border-[#E0E8FF]">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-[#E0E8FF] rounded-lg text-[12px] bg-white placeholder:text-[#C0CEDC] focus:outline-none focus:ring-1 focus:ring-[#0076BC]"
        />
      </div>
      <div className="divide-y divide-[#EEF2FF]">
        {sorted.map(sub => {
          const isClickable = INTERACTIVE_ACCOUNTS.has(sub.account);
          if (!isClickable) {
            return (
              <div key={sub.id} className="px-3 py-3 border-b border-[#EEF2FF] bg-[#F8FAFB] cursor-not-allowed">
                <div className="text-[12px] text-[#9BA8B8] leading-snug mb-0.5" style={{ fontWeight: 600 }}>{sub.account}</div>
                <div className="flex items-center gap-1 text-[10px] mb-1" style={{ color: "#B8C4D0" }}>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {sub.homeOffice}
                </div>
                <div className="flex items-center gap-1.5">
                  <DataStatusBadge status={sub.dataStatus} />
                </div>
              </div>
            );
          }
          return (
            <CompactSubmissionCard
              key={sub.id}
              sub={sub}
              isSelected={sub.id === selectedId}
              onClick={() => onSubmissionSelect?.(sub.id)}
            />
          );
        })}
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-[#94A3B8]">No submissions match your search.</div>
        )}
      </div>
    </div>
  );
}
