"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Filter, TrendingUp, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface SubmissionsProps {
  onSubmissionSelect?: (id: string) => void;
  selectedId?: string | null;
  filterType?: "new-business" | "renewals";
}

// Combined submission data with pricing info
const submissions = [
  {
    id: "SUB-2026-0847",
    namedInsured: "Westfield Manufacturing Corp",
    broker: "Marsh & McLennan",
    coverageType: "Special Form",
    tivRange: "$100M - $150M",
    territory: "California",
    submissionType: "New Business",
    status: "Analysis",
    aiPriorityScore: 94,
    accretiveness: "High",
    successPropensity: 78,
    strategyAlignment: "Strong",
    receivedDate: "2026-04-08",
    slaCountdown: "1d 14h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Gate 1b Pending",
    completenessIndicator: 100,
    hxStatus: "Complete",
    hxLastUpdated: "2026-04-10 10:47 AM",
    hxRecordId: "HX-2026-04-10-847",
    catnetStatus: "Complete",
    catnetPerils: "Earthquake, Wildfire",
    catnetLastRun: "2026-04-10 10:30 AM",
    processingPattern: "High Touch",
    domesticPolicyNumber: "DOM-US-2026-847",
    internationalPolicyNumber: "INTL-GL-2026-847",
    domesticPremium: "$325,000",
    internationalPremium: "$162,500",
  },
  {
    id: "SUB-2026-0846",
    namedInsured: "Global Tech Industries LLC",
    broker: "Aon",
    coverageType: "Basic Form",
    tivRange: "$75M - $100M",
    territory: "New York",
    submissionType: "Renewal",
    status: "Quoted",
    aiPriorityScore: 88,
    accretiveness: "Medium",
    successPropensity: 85,
    strategyAlignment: "Aligned",
    receivedDate: "2026-04-06",
    slaCountdown: "Quoted",
    assignedUW: "Michael Torres",
    hitlGateStatus: "All Gates Passed",
    completenessIndicator: 100,
    hxStatus: "Complete",
    hxLastUpdated: "2026-04-09 3:22 PM",
    hxRecordId: "HX-2026-04-09-846",
    processingPattern: "Low Touch",
  },
  {
    id: "SUB-2026-0845",
    namedInsured: "Atlantic Distribution Centers",
    broker: "Willis Towers Watson",
    coverageType: "Special Form",
    tivRange: "$300M+",
    territory: "Florida",
    submissionType: "New Business",
    status: "In Triage",
    aiPriorityScore: 92,
    accretiveness: "High",
    successPropensity: 65,
    strategyAlignment: "Strong",
    receivedDate: "2026-04-09",
    slaCountdown: "2d 3h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Gate 1a Pending",
    completenessIndicator: 85,
    catnetStatus: "Running",
    catnetPerils: "Hurricane, Flood",
    catnetLastRun: "2026-04-10 9:00 AM",
    catnetTimeInQueue: "1h 32m",
    processingPattern: "High Touch",
  },
  {
    id: "SUB-2026-0844",
    namedInsured: "Northeast Logistics Group",
    broker: "Lockton",
    coverageType: "Broad Form",
    tivRange: "$50M - $75M",
    territory: "Massachusetts",
    submissionType: "Renewal",
    status: "Analysis",
    aiPriorityScore: 76,
    accretiveness: "Medium",
    successPropensity: 90,
    strategyAlignment: "Aligned",
    receivedDate: "2026-04-07",
    slaCountdown: "1d 8h",
    assignedUW: "James Liu",
    hitlGateStatus: "Gate 2 Pending",
    completenessIndicator: 95,
    hxStatus: "Pending",
    hxLastUpdated: "2026-04-09 11:30 AM",
    hxRecordId: "HX-2026-04-09-844",
    catnetStatus: "Queued",
    catnetPerils: "Convective Storm",
    catnetLastRun: "Never",
    catnetTimeInQueue: "12h 45m",
    processingPattern: "Medium Touch",
  },
  {
    id: "SUB-2026-0843",
    namedInsured: "Pacific Coast Hotels & Resorts",
    broker: "Marsh & McLennan",
    coverageType: "Special Form",
    tivRange: "$200M - $300M",
    territory: "Hawaii",
    submissionType: "New Business",
    status: "Pending CAT",
    aiPriorityScore: 90,
    accretiveness: "High",
    successPropensity: 72,
    strategyAlignment: "Strong",
    receivedDate: "2026-04-05",
    slaCountdown: "3d 12h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Gate 3 Pending",
    completenessIndicator: 100,
    hxStatus: "Pending",
    hxLastUpdated: "2026-04-10 8:15 AM",
    hxRecordId: "HX-2026-04-10-843",
    catnetStatus: "Complete",
    catnetPerils: "Hurricane, Earthquake",
    catnetLastRun: "2026-04-09 2:15 PM",
    processingPattern: "Medium Touch",
  },
  {
    id: "SUB-2026-0842",
    namedInsured: "Midwest Manufacturing Inc",
    broker: "Aon",
    coverageType: "Basic Form",
    tivRange: "$25M - $50M",
    territory: "Illinois",
    submissionType: "Renewal",
    status: "New",
    aiPriorityScore: 72,
    accretiveness: "Low",
    successPropensity: 88,
    strategyAlignment: "Neutral",
    receivedDate: "2026-04-10",
    slaCountdown: "2d 20h",
    assignedUW: "Emily Rodriguez",
    hitlGateStatus: "Not Started",
    completenessIndicator: 70,
    processingPattern: "Low Touch",
  },
  {
    id: "SUB-2026-0841",
    namedInsured: "Southeast Industrial Parks",
    broker: "Willis Towers Watson",
    coverageType: "Special Form",
    tivRange: "$150M - $200M",
    territory: "Georgia",
    submissionType: "Remarket",
    status: "Declined",
    aiPriorityScore: 45,
    accretiveness: "Low",
    successPropensity: 35,
    strategyAlignment: "Misaligned",
    receivedDate: "2026-04-03",
    slaCountdown: "Declined",
    assignedUW: "James Liu",
    hitlGateStatus: "Failed Gate 1a",
    completenessIndicator: 100,
    processingPattern: "Medium Touch",
  },
  // Upcoming Renewal with Endorsements
  {
    id: "SUB-2026-0850",
    namedInsured: "TechCorp Solutions Inc",
    broker: "Aon",
    coverageType: "Special Form",
    tivRange: "$200M - $300M",
    territory: "Texas",
    submissionType: "Renewal",
    status: "Analysis",
    aiPriorityScore: 91,
    accretiveness: "High",
    successPropensity: 88,
    strategyAlignment: "Strong",
    receivedDate: "2026-04-12",
    slaCountdown: "18d 6h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Gate 1a Pending",
    completenessIndicator: 95,
    hxStatus: "Pending",
    hxLastUpdated: "2026-04-12 2:15 PM",
    hxRecordId: "HX-2026-04-12-850",
    catnetStatus: "Queued",
    catnetPerils: "Tornado, Hail",
    catnetLastRun: "Never",
    catnetTimeInQueue: "4h 12m",
    upcomingRenewal: "05/01/2026",
    processingPattern: "Medium Touch",
  },
  {
    id: "SUB-2026-0851",
    namedInsured: "TechCorp Solutions Inc",
    broker: "Aon",
    coverageType: "Special Form",
    tivRange: "$200M - $300M",
    territory: "Texas",
    submissionType: "Renewal",
    status: "Quoted",
    aiPriorityScore: 82,
    accretiveness: "Medium",
    successPropensity: 92,
    strategyAlignment: "Aligned",
    receivedDate: "2026-02-15",
    slaCountdown: "Quoted",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "All Gates Passed",
    completenessIndicator: 100,
    hxStatus: "Complete",
    hxLastUpdated: "2026-02-16 9:30 AM",
    hxRecordId: "HX-2026-02-16-851",
    parentSubmission: "Add Austin Office",
    processingPattern: "Low Touch",
  },
  {
    id: "SUB-2026-0852",
    namedInsured: "TechCorp Solutions Inc",
    broker: "Aon",
    coverageType: "Special Form",
    tivRange: "$200M - $300M",
    territory: "Texas",
    submissionType: "Renewal",
    status: "Analysis",
    aiPriorityScore: 79,
    accretiveness: "Medium",
    successPropensity: 90,
    strategyAlignment: "Aligned",
    receivedDate: "2026-03-22",
    slaCountdown: "1d 4h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Gate 2 Pending",
    completenessIndicator: 90,
    hxStatus: "Pending",
    hxLastUpdated: "2026-03-22 11:45 AM",
    hxRecordId: "HX-2026-03-22-852",
    parentSubmission: "Increase Equipment Coverage",
    processingPattern: "Medium Touch",
  },
  {
    id: "SUB-2026-0853",
    namedInsured: "TechCorp Solutions Inc",
    broker: "Aon",
    coverageType: "Special Form",
    tivRange: "$200M - $300M",
    territory: "Texas",
    submissionType: "Renewal",
    status: "New",
    aiPriorityScore: 76,
    accretiveness: "Medium",
    successPropensity: 89,
    strategyAlignment: "Aligned",
    receivedDate: "2026-04-11",
    slaCountdown: "2d 8h",
    assignedUW: "Mike Farrell",
    hitlGateStatus: "Not Started",
    completenessIndicator: 75,
    parentSubmission: "Update Building Values",
    processingPattern: "Low Touch",
  },
];

export function SubmissionsMerged({ onSubmissionSelect, selectedId, filterType = "new-business" }: SubmissionsProps = {}) {
  // Filter submissions based on type
  const filteredSubmissions = submissions.filter(sub => {
    if (filterType === "new-business") {
      return sub.submissionType === "New Business" || sub.submissionType === "Remarket";
    } else {
      return sub.submissionType === "Renewal";
    }
  });

  // Group filtered submissions by customer
  const groupedByCustomer = filteredSubmissions.reduce((acc, sub) => {
    if (!acc[sub.namedInsured]) {
      acc[sub.namedInsured] = [];
    }
    acc[sub.namedInsured].push(sub);
    return acc;
  }, {} as Record<string, typeof submissions>);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set(Object.keys(groupedByCustomer))
  );

  const toggleCustomer = (customer: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customer)) {
        newSet.delete(customer);
      } else {
        newSet.add(customer);
      }
      return newSet;
    });
  };

  const isCompressed = selectedId !== null;

  return (
    <div className={`${isCompressed ? "p-4" : "p-8"}`}>
      {/* Top Controls */}
      {!isCompressed && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium text-[#111827]">Filter</span>
            </button>
            <select className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#111827] hover:bg-[#F3F4F6] transition-colors">
              <option>All Submissions</option>
              <option>My Queue</option>
              <option>High Priority</option>
              <option>Renewals</option>
              <option>New Business</option>
              <option>Pending CAT</option>
            </select>
          </div>
        </div>
      )}

      {/* Compressed Tile View */}
      {isCompressed ? (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSubmissionSelect?.(sub.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedId === sub.id
                  ? "bg-blue-50 border-[#0076BC] border-2"
                  : "bg-white border-[#E5E7EB] hover:border-[#0076BC]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#0076BC] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {sub.aiPriorityScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#111827] truncate">{sub.namedInsured}</div>
                  <div className="text-xs text-[#4B5563] truncate">{sub.broker}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    sub.status === "Quoted"
                      ? "bg-green-100 text-green-800"
                      : sub.status === "Declined"
                      ? "bg-red-100 text-red-800"
                      : sub.status === "Pending CAT"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {sub.status}
                </span>
                <span className="text-xs text-[#4B5563]">{sub.id}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grouped Table View */
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827]">Submissions by Customer</h3>
            <p className="text-sm text-[#4B5563] mt-1">Grouped by account with submission and pricing details</p>
          </div>

          <div className="overflow-x-auto">
            {Object.entries(groupedByCustomer).map(([customer, subs]) => {
              const hasUpcomingRenewal = subs.some(s => s.upcomingRenewal);
              const renewalDate = subs.find(s => s.upcomingRenewal)?.upcomingRenewal;

              return (
              <div key={customer} className="mb-4 bg-white border-2 border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden" style={{ borderLeftColor: '#0076BC', borderLeftWidth: '6px' }}>
                {/* Customer Header Row */}
                <div
                  className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-colors"
                  onClick={() => toggleCustomer(customer)}
                >
                  <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50/30 to-transparent">
                    <div className="flex items-center gap-3">
                      <button className="flex items-center justify-center w-6 h-6">
                        {expandedCustomers.has(customer) ? (
                          <ChevronDown className="w-5 h-5 text-[#4B5563]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-[#4B5563]" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#111827]">{customer}</h4>
                          {hasUpcomingRenewal && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0076BC] text-white">
                              Upcoming Renewal: {renewalDate}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#4B5563] mt-0.5">
                          {subs.length} submission{subs.length > 1 ? "s" : ""} • {subs[0].broker}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-[#4B5563]">Submission Types</div>
                        <div className="text-sm font-medium text-[#111827]">
                          {[...new Set(subs.map(s => s.submissionType))].join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-[#4B5563]">Avg Success Propensity</div>
                          <div className="text-sm font-semibold text-green-600">
                            {Math.round(subs.reduce((sum, s) => sum + s.successPropensity, 0) / subs.length)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-[#4B5563]">Portfolio Impact</div>
                          <div className="text-sm font-semibold text-[#111827]">
                            {subs.filter(s => s.accretiveness === "High").length > 0 ? "Accretive" : "Neutral"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Rows */}
                {expandedCustomers.has(customer) && (
                  <div className="border-t border-[#E5E7EB]">
                    <table className="w-full">
                      <thead className="bg-[#FAFBFC] border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Submission ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Coverage / TIV
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Indicators
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            HX Pricing
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            CAT Modeling
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {subs.map((sub) => (
                          <tr
                            key={sub.id}
                            onClick={() => onSubmissionSelect?.(sub.id)}
                            className={`hover:bg-[#F7F8FA] cursor-pointer transition-colors ${
                              selectedId === sub.id ? "bg-blue-50 border-l-4 border-[#0076BC]" : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-[#0076BC] text-white flex items-center justify-center font-bold text-sm">
                                  {sub.aiPriorityScore}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-[#0076BC]">{sub.id}</div>
                                  <div className="text-xs text-[#4B5563]">{sub.territory}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sub.submissionType === "New Business"
                                    ? "bg-blue-100 text-blue-800"
                                    : sub.submissionType === "Renewal"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {sub.submissionType}
                              </span>
                              {sub.parentSubmission && (
                                <div className="text-xs text-[#4B5563] mt-1">{sub.parentSubmission}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-[#111827]">{sub.coverageType}</div>
                              <div className="text-xs text-[#4B5563]">{sub.tivRange}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sub.status === "Quoted"
                                    ? "bg-green-100 text-green-800"
                                    : sub.status === "Declined"
                                    ? "bg-red-100 text-red-800"
                                    : sub.status === "Pending CAT"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : sub.status === "New"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                              <div className="text-xs text-[#4B5563] mt-1">{sub.slaCountdown}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#4B5563]">Win:</span>
                                  <span className="text-xs font-semibold text-green-600">{sub.successPropensity}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#4B5563]">Accretive:</span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      sub.accretiveness === "High"
                                        ? "text-green-600"
                                        : sub.accretiveness === "Medium"
                                        ? "text-yellow-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {sub.accretiveness}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#4B5563]">Strategy:</span>
                                  <span className="text-xs font-medium text-[#111827]">{sub.strategyAlignment}</span>
                                </div>
                                <div className="mt-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      sub.processingPattern === "Low Touch"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : sub.processingPattern === "Medium Touch"
                                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    {sub.processingPattern}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {sub.hxStatus ? (
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      sub.hxStatus === "Complete"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {sub.hxStatus === "Complete" ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {sub.hxStatus}
                                  </span>
                                  <div className="text-xs text-[#4B5563] mt-1">{sub.hxLastUpdated}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-[#9CA3AF]">Not submitted</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {sub.catnetStatus ? (
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      sub.catnetStatus === "Complete"
                                        ? "bg-green-100 text-green-800"
                                        : sub.catnetStatus === "Running"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {sub.catnetStatus === "Complete" ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : sub.catnetStatus === "Running" ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {sub.catnetStatus}
                                  </span>
                                  <div className="text-xs text-[#4B5563] mt-1">{sub.catnetPerils}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-[#9CA3AF]">Not submitted</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                {sub.hxStatus && (
                                  <button className="flex items-center gap-1 px-2 py-1 bg-[#0076BC] text-white rounded text-xs font-medium hover:bg-[#0076BC] transition-colors">
                                    <span>HX</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {sub.catnetStatus && (
                                  <button className="flex items-center gap-1 px-2 py-1 bg-[#0076BC] text-white rounded text-xs font-medium hover:bg-[#0076BC] transition-colors">
                                    <span>CatNet</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {!isCompressed && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]">
          <div className="flex items-center gap-6 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0076BC]"></div>
              <span className="text-[#4B5563]">AI Priority Score: Composite of accretiveness, success propensity, and strategy fit</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-[#4B5563]">Accretiveness: Portfolio quality improvement indicator</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span className="text-[#4B5563]">Success Propensity: Likelihood of bind based on market conditions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


