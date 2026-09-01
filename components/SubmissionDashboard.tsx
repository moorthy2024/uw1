"use client";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, FileText, AlertTriangle } from "lucide-react";

const submissions = [
  {
    id: "SUB-2026-0847",
    submissionType: "New Business",
    namedInsured: "Westfield Manufacturing Corp",
    producer: "Marsh & McLennan",
    coverageForm: "Special Form",
    territory: "California",
    tiv: "$125,000,000",
    assignedUnderwriter: "Mike Farrell",
    submissionStatus: "In Review",
    hitlGateStatus: "Approved",
    completenessIndicator: "Complete",
  },
  {
    id: "SUB-2026-0846",
    submissionType: "Renewal",
    namedInsured: "Global Tech Industries LLC",
    producer: "Aon",
    coverageForm: "Basic Form",
    territory: "New York",
    tiv: "$89,500,000",
    assignedUnderwriter: "Michael Torres",
    submissionStatus: "Quoted",
    hitlGateStatus: "Approved",
    completenessIndicator: "Complete",
  },
  {
    id: "SUB-2026-0845",
    submissionType: "New Business",
    namedInsured: "Atlantic Distribution Centers",
    producer: "Willis Towers Watson",
    coverageForm: "Special Form",
    territory: "Florida",
    tiv: "$342,000,000",
    assignedUnderwriter: "Mike Farrell",
    submissionStatus: "Pending Info",
    hitlGateStatus: "Pending Review",
    completenessIndicator: "Incomplete",
  },
  {
    id: "SUB-2026-0844",
    submissionType: "Renewal",
    namedInsured: "Northeast Logistics Group",
    producer: "Marsh & McLennan",
    coverageForm: "Broad Form",
    territory: "Massachusetts",
    tiv: "$56,200,000",
    assignedUnderwriter: "James Liu",
    submissionStatus: "In Review",
    hitlGateStatus: "Approved",
    completenessIndicator: "Complete",
  },
  {
    id: "SUB-2026-0843",
    submissionType: "New Business",
    namedInsured: "Pacific Coast Hotels & Resorts",
    producer: "Lockton",
    coverageForm: "Special Form",
    territory: "Hawaii",
    tiv: "$278,000,000",
    assignedUnderwriter: "Mike Farrell",
    submissionStatus: "Referred",
    hitlGateStatus: "Flagged",
    completenessIndicator: "Complete",
  },
];

const kpis = [
  {
    label: "Active Submissions",
    value: "127",
    change: "+12%",
    trend: "up",
    icon: FileText,
  },
  {
    label: "Avg Cycle Time",
    value: "3.2d",
    change: "-8%",
    trend: "down",
    icon: Clock,
  },
  {
    label: "Quote Conversion",
    value: "68%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "HITL Flags",
    value: "8",
    change: "-2",
    trend: "down",
    icon: AlertTriangle,
  },
];

export function SubmissionDashboard() {
  return (
    <div className="p-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === "up";

          return (
            <div key={kpi.label} className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F7F8FA] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0076BC]" />
                </div>
                <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-semibold text-[#111827] mb-1">{kpi.value}</div>
              <div className="text-sm text-[#4B5563]">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Submissions Table */}
        <div className="col-span-2 bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827]">Active Submissions</h3>
            <p className="text-sm text-[#4B5563] mt-1">Prioritized by urgency and completeness</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Submission ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Named Insured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    TIV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    HITL Gate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/submission/${sub.id}`} className="text-sm font-medium text-[#0076BC] hover:text-[#0076BC]">
                        {sub.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#111827]">{sub.namedInsured}</div>
                      <div className="text-xs text-[#4B5563]">{sub.producer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                      {sub.tiv}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sub.submissionStatus === "Quoted"
                            ? "bg-green-100 text-green-800"
                            : sub.submissionStatus === "Pending Info"
                            ? "bg-yellow-100 text-yellow-800"
                            : sub.submissionStatus === "Referred"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {sub.submissionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.hitlGateStatus === "Approved" && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {sub.hitlGateStatus === "Pending Review" && (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                      {sub.hitlGateStatus === "Flagged" && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Alerts and AI Assistant */}
        <div className="space-y-6">
          {/* Queue Panel */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Priority Queue</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-[#111827]">CAT exposure flagged</div>
                  <div className="text-xs text-[#4B5563] mt-1">SUB-2026-0845 requires senior review</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-[#111827]">Pending documentation</div>
                  <div className="text-xs text-[#4B5563] mt-1">3 submissions awaiting SOV</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Panel */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#0076BC] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">AI</span>
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">Underwriting Assistant</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#F7F8FA] rounded-lg">
                <p className="text-sm text-[#111827]">
                  <strong>Recommendation:</strong> SUB-2026-0843 requires CAT modeling due to coastal location and TIV $278M.
                </p>
              </div>

              <div className="p-3 bg-[#F7F8FA] rounded-lg">
                <p className="text-sm text-[#111827]">
                  <strong>Alert:</strong> Producer Marsh & McLennan has 2 submissions pending response &gt;48hrs.
                </p>
              </div>

              <button className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm font-medium text-[#111827]">
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



