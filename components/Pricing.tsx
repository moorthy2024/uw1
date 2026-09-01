"use client";
import { ExternalLink, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const hxSubmissions = [
  {
    id: "SUB-2026-0847",
    namedInsured: "Westfield Manufacturing Corp",
    status: "Complete",
    lastUpdated: "2026-04-10 10:47 AM",
    updatedBy: "Mike Farrell",
    hxRecordId: "HX-2026-04-10-847",
  },
  {
    id: "SUB-2026-0846",
    namedInsured: "Global Tech Industries LLC",
    status: "Complete",
    lastUpdated: "2026-04-09 3:22 PM",
    updatedBy: "Michael Torres",
    hxRecordId: "HX-2026-04-09-846",
  },
  {
    id: "SUB-2026-0843",
    namedInsured: "Pacific Coast Hotels & Resorts",
    status: "Pending",
    lastUpdated: "2026-04-10 8:15 AM",
    updatedBy: "Mike Farrell",
    hxRecordId: "HX-2026-04-10-843",
  },
  {
    id: "SUB-2026-0844",
    namedInsured: "Northeast Logistics Group",
    status: "Pending",
    lastUpdated: "2026-04-09 11:30 AM",
    updatedBy: "James Liu",
    hxRecordId: "HX-2026-04-09-844",
  },
];

const catnetSubmissions = [
  {
    id: "SUB-2026-0847",
    namedInsured: "Westfield Manufacturing Corp",
    modelStatus: "Complete",
    perilBreakdown: "Earthquake, Wildfire",
    lastRun: "2026-04-10 10:30 AM",
    timeInQueue: "—",
  },
  {
    id: "SUB-2026-0845",
    namedInsured: "Atlantic Distribution Centers",
    modelStatus: "Running",
    perilBreakdown: "Hurricane, Flood",
    lastRun: "2026-04-10 9:00 AM",
    timeInQueue: "1h 32m",
  },
  {
    id: "SUB-2026-0843",
    namedInsured: "Pacific Coast Hotels & Resorts",
    modelStatus: "Complete",
    perilBreakdown: "Hurricane, Earthquake",
    lastRun: "2026-04-09 2:15 PM",
    timeInQueue: "—",
  },
  {
    id: "SUB-2026-0844",
    namedInsured: "Northeast Logistics Group",
    modelStatus: "Queued",
    perilBreakdown: "Convective Storm",
    lastRun: "Never",
    timeInQueue: "12h 45m",
  },
];

export function Pricing() {
  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Hyperexponential (HX) Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">Hyperexponential (HX) Submissions</h3>
                <p className="text-sm text-[#4B5563] mt-1">Active pricing records in HX rater</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4B5563]">
                  {hxSubmissions.filter(s => s.status === "Complete").length} complete • {hxSubmissions.filter(s => s.status === "Pending").length} pending
                </span>
              </div>
            </div>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {hxSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#0076BC]">{sub.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#111827]">{sub.namedInsured}</div>
                      <div className="text-xs text-[#4B5563]">HX Record: {sub.hxRecordId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sub.status === "Complete"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {sub.status === "Complete" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                      {sub.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B5563]">
                      {sub.updatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors text-sm font-medium">
                        <span>Open in HX</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CatNet Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">CatNet Submissions</h3>
                <p className="text-sm text-[#4B5563] mt-1">Active CAT modeling submissions</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4B5563]">
                  {catnetSubmissions.filter(s => s.modelStatus === "Complete").length} complete • {catnetSubmissions.filter(s => s.modelStatus === "Running").length} running • {catnetSubmissions.filter(s => s.modelStatus === "Queued").length} queued
                </span>
              </div>
            </div>
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
                    Model Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Peril Breakdown
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Time in Queue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {catnetSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#0076BC]">{sub.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#111827]">{sub.namedInsured}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sub.modelStatus === "Complete"
                            ? "bg-green-100 text-green-800"
                            : sub.modelStatus === "Running"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sub.modelStatus === "Complete" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : sub.modelStatus === "Running" ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {sub.modelStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#111827]">
                      {sub.perilBreakdown}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                      {sub.lastRun}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.timeInQueue === "—" ? (
                        <span className="text-sm text-[#4B5563]">—</span>
                      ) : (
                        <span className="text-sm font-medium text-yellow-600">{sub.timeInQueue}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors text-sm font-medium">
                        <span>Open in CatNet</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Status Indicators</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-[#111827]">Complete</div>
                <div className="text-xs text-[#4B5563] mt-1">Pricing or modeling successfully completed and results available for review</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-[#111827]">Running / In Progress</div>
                <div className="text-xs text-[#4B5563] mt-1">Currently processing in the external system</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-[#111827]">Pending / Queued</div>
                <div className="text-xs text-[#4B5563] mt-1">Waiting for processing to begin or UW action required</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Panel */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-[#111827] mb-1">Stale Pricing Alert</div>
              <div className="text-sm text-[#4B5563]">
                1 submission (SUB-2026-0846) has pricing that is over 7 days old. Consider re-running HX rater before final quote issuance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


