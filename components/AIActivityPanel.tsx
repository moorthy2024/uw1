"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Activity, MessageCircle, Sparkles } from "lucide-react";

const agentActivity = [
  {
    id: 1,
    agent: "Orchestration Agent",
    action: "Routed SUB-2026-0847 to deep-path analysis (TIV $125M)",
    timestamp: "2 minutes ago",
    status: "completed",
  },
  {
    id: 2,
    agent: "Ingestion Agent",
    action: "Extracted SOV from SUB-2026-0847 with 98% confidence",
    timestamp: "4 minutes ago",
    status: "completed",
  },
  {
    id: 3,
    agent: "Ingestion Agent",
    action: "Normalized SOV and formatted CatNet payload for SUB-2026-0847",
    timestamp: "6 minutes ago",
    status: "completed",
  },
  {
    id: 4,
    agent: "Intelligence & Reasoning Agent",
    action: "Generated accretiveness score 94 for SUB-2026-0847",
    timestamp: "8 minutes ago",
    status: "completed",
  },
  {
    id: 5,
    agent: "Intelligence & Reasoning Agent",
    action: "Identified moderate CAT exposure for SUB-2026-0845 (FL coastal)",
    timestamp: "12 minutes ago",
    status: "completed",
  },
  {
    id: 6,
    agent: "Intelligence & Reasoning Agent",
    action: "Found 3 comparable accounts for SUB-2026-0846 pricing guidance",
    timestamp: "15 minutes ago",
    status: "completed",
  },
  {
    id: 7,
    agent: "Document Summarization Agent",
    action: "Drafted pricing recommendation and quote for SUB-2026-0843",
    timestamp: "22 minutes ago",
    status: "in_progress",
  },
  {
    id: 8,
    agent: "Document Summarization Agent",
    action: "Drafted decline letter for SUB-2026-0841 (appetite mismatch)",
    timestamp: "28 minutes ago",
    status: "completed",
  },
  {
    id: 9,
    agent: "Orchestration Agent",
    action: "Triggered HITL Gate 2 for SUB-2026-0844 (TIV threshold)",
    timestamp: "35 minutes ago",
    status: "completed",
  },
  {
    id: 10,
    agent: "Intelligence & Reasoning Agent",
    action: "Detected sector concentration alert — manufacturing at 42%",
    timestamp: "1 hour ago",
    status: "completed",
  },
  {
    id: 11,
    agent: "Intelligence & Reasoning Agent",
    action: "LA Metro earthquake accumulation reached 92% of limit",
    timestamp: "1 hour ago",
    status: "alert",
  },
  {
    id: 12,
    agent: "Document Summarization Agent",
    action: "Generated binder for SUB-2026-0840 — ready for execution",
    timestamp: "2 hours ago",
    status: "completed",
  },
];

interface AIActivityPanelProps {
  currentPageInsight: string;
  onExpandChange?: (expanded: boolean) => void;
}

export function AIActivityPanel({ currentPageInsight, onExpandChange }: AIActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  return (
    <div
      className={`relative h-screen bg-white border-l border-[#E5E7EB] shadow-xl transition-all duration-300 flex flex-col ${
        isExpanded ? "w-96" : "w-12"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleExpanded}
        className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-16 bg-white border border-[#E5E7EB] border-r-0 rounded-l-lg flex items-center justify-center hover:bg-[#F7F8FA] transition-colors shadow-md z-10"
      >
        {isExpanded ? (
          <ChevronRight className="w-4 h-4 text-[#4B5563]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#4B5563]" />
        )}
      </button>

      {/* Collapsed State - Icon Only */}
      {!isExpanded && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative">
            <Activity className="w-6 h-6 text-[#0076BC]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-[#E5E7EB] bg-gradient-to-r from-[#F9760A] to-[#00205B] text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Agent Activity</h3>
            </div>
            <p className="text-xs text-blue-100">Real-time transparency and insights</p>
          </div>

          {/* Page Insight */}
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-[#0076BC] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#111827] mb-1">Context-Aware Insight</div>
                <div className="text-sm text-[#4B5563]">{currentPageInsight}</div>
              </div>
            </div>
          </div>

          {/* Agent Activity Stream */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#0076BC]" />
              <h4 className="text-sm font-semibold text-[#111827]">Recent Activity</h4>
            </div>

            {/* Activity Stream */}
            <div className="space-y-3">
              {agentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        activity.status === "completed"
                          ? "bg-green-600"
                          : activity.status === "in_progress"
                          ? "bg-blue-600 animate-pulse"
                          : "bg-red-600"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#0076BC]">{activity.agent}</span>
                      </div>
                      <div className="text-xs text-[#111827] mb-1">{activity.action}</div>
                      <div className="text-xs text-[#4B5563]">{activity.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

