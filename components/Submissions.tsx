"use client";
import { useState } from "react";
import Link from "next/link";
import { useRole } from "./RoleContext";
import {
  FileText, TrendingUp, DollarSign, Target, Clock, AlertTriangle,
  Filter, Search, ChevronDown, ArrowUpDown, CheckCircle2, XCircle,
  AlertCircle, Flame, MapPin, Building2, Users, Mail
} from "lucide-react";

// Lifecycle Status Card Data
const lifecycleCards = [
  {
    group: "Submissions",
    statuses: [
      { label: "Awaiting Triage", count: 12, filter: "Awaiting Triage" },
      { label: "With Modelling", count: 10, filter: "With Modelling" },
      { label: "Modelling Returned", count: 5, filter: "Modelling Returned" },
    ],
  },
  { group: "Rating", statuses: [{ label: "Live Rating", count: 3, filter: "Live Rating" }] },
  {
    group: "Quoting",
    statuses: [
      { label: "Indications", count: 1, filter: "Indications" },
      { label: "Quotes", count: 2, filter: "Quotes" },
    ],
  },
  {
    group: "Binders",
    statuses: [
      { label: "Bind Orders", count: 1, filter: "Bind Orders" },
      { label: "Binders Awaiting Issuance", count: 0, filter: "Binders Awaiting Issuance" },
    ],
  },
  {
    group: "Policies",
    statuses: [
      { label: "Policies Awaiting Review", count: 8, filter: "Policies Awaiting Review" },
      { label: "Policies Issued YTD", count: 14, filter: "Policies Issued YTD" },
    ],
  },
];

// Broker activity data
const brokerActivity = [
  { broker: "Marsh", subs: 28, quotes: 18, binds: 12, premium: "$42.8M", ratio: 0.64 },
  { broker: "Aon", subs: 24, quotes: 15, binds: 10, premium: "$38.2M", ratio: 0.63 },
  { broker: "WTW", subs: 18, quotes: 12, binds: 8, premium: "$28.5M", ratio: 0.67 },
  { broker: "Lockton", subs: 15, quotes: 10, binds: 7, premium: "$22.1M", ratio: 0.67 },
];

const submissions = [
  {
    id: "SUB-2026-0847",
    inceptionDate: "2026-06-01",
    accountName: "Westfield Manufacturing",
    broker: "Sarah Chen",
    contact: "schen@marsh.com",
    brokerageHouse: "Marsh",
    status: "Awaiting Triage",
    type: "New",
    coverageType: "Property",
    tiv: "$125M",
    territory: "CA, NV",
    priorityScore: 94,
    slaCountdown: "18h",
    completeness: "high",
    assignedUW: "You",
    flags: ["High CAT", "Large TIV"],
  },
  {
    id: "SUB-2026-0845",
    inceptionDate: "2026-05-15",
    accountName: "Atlantic Distribution",
    broker: "Michael Torres",
    contact: "mtorres@wtw.com",
    brokerageHouse: "WTW",
    status: "With Modelling",
    type: "Renewal",
    coverageType: "Property",
    tiv: "$89M",
    territory: "FL, GA",
    priorityScore: 92,
    slaCountdown: "2d",
    completeness: "medium",
    assignedUW: "You",
    flags: ["Wind Zone"],
  },
  {
    id: "SUB-2026-0850",
    inceptionDate: "2026-06-15",
    accountName: "TechCorp Solutions",
    broker: "Jennifer Blake",
    contact: "jblake@aon.com",
    brokerageHouse: "Aon",
    status: "Live Rating",
    type: "New",
    coverageType: "Excess",
    tiv: "$210M",
    territory: "TX, OK",
    priorityScore: 91,
    slaCountdown: "4d",
    completeness: "high",
    assignedUW: "Ashley Rodriguez",
    flags: ["Complex Structure"],
  },
  {
    id: "SUB-2026-0843",
    inceptionDate: "2026-05-01",
    accountName: "Pacific Coast Hotels",
    broker: "David Park",
    contact: "dpark@lockton.com",
    brokerageHouse: "Lockton",
    status: "Modelling Returned",
    type: "Renewal",
    coverageType: "Property",
    tiv: "$156M",
    territory: "CA, OR, WA",
    priorityScore: 90,
    slaCountdown: "1d",
    completeness: "high",
    assignedUW: "You",
    flags: ["EQ Zone", "Coastal"],
  },
  {
    id: "SUB-2026-0844",
    inceptionDate: "2026-06-10",
    accountName: "Northeast Logistics",
    broker: "Sarah Chen",
    contact: "schen@marsh.com",
    brokerageHouse: "Marsh",
    status: "Quotes",
    type: "New",
    coverageType: "Property",
    tiv: "$72M",
    territory: "NY, NJ, CT",
    priorityScore: 76,
    slaCountdown: "6h",
    completeness: "medium",
    assignedUW: "Michael Torres",
    flags: [],
  },
  {
    id: "SUB-2026-0846",
    inceptionDate: "2026-05-20",
    accountName: "Global Tech Industries",
    broker: "Jennifer Blake",
    contact: "jblake@aon.com",
    brokerageHouse: "Aon",
    status: "Bind Orders",
    type: "Renewal",
    coverageType: "Excess",
    tiv: "$95M",
    territory: "NY",
    priorityScore: 88,
    slaCountdown: "Complete",
    completeness: "high",
    assignedUW: "Michael Torres",
    flags: [],
  },
];

export function Submissions() {
  const role = useRole();
  const [activeView, setActiveView] = useState<"all" | "new" | "renewal">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter((sub) => {
    // View filter
    if (activeView === "new" && sub.type !== "New") return false;
    if (activeView === "renewal" && sub.type !== "Renewal") return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !sub.accountName.toLowerCase().includes(search) &&
        !sub.id.toLowerCase().includes(search) &&
        !sub.broker.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter && sub.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      {/* Lifecycle Status Cards */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 py-4">
        <div className="flex gap-6 overflow-x-auto">
          {lifecycleCards.map((cardGroup, idx) => (
            <div key={idx} className="flex-shrink-0">
              <div className="text-xs font-semibold text-[#4B5563] uppercase tracking-wide mb-2">
                {cardGroup.group}
              </div>
              <div className="flex flex-col gap-2">
                {cardGroup.statuses.map((status, sidx) => (
                  <button
                    key={sidx}
                    onClick={() => setStatusFilter(statusFilter === status.filter ? null : status.filter)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left min-w-[180px] ${
                      statusFilter === status.filter
                        ? "bg-[#0076BC] text-white"
                        : "bg-[#F7F8FA] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    <span className="text-sm">{status.label}</span>
                    <span className={`text-sm font-bold ${
                      statusFilter === status.filter
                        ? "text-white"
                        : status.count > 0 ? "text-[#0076BC]" : "text-[#9CA3AF]"
                    }`}>
                      {status.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio KPI Metrics */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 py-4">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "GWP / NWP", value: "142.8m / 125.3m", icon: DollarSign, link: "/portfolio" },
            { label: "Sub to Quote Ratio", value: "0.08", icon: TrendingUp, link: "/submissions" },
            { label: "Quote to Bind Ratio", value: "0.33", icon: Target, link: "/submissions" },
            { label: "Loss Ratio", value: "0.27", icon: Flame, link: "/portfolio" },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={idx}
                href={kpi.link}
                className="bg-[#F7F8FA] rounded-xl p-4 hover:bg-[#E5E7EB] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[#0076BC]" />
                  <div className="text-xs text-[#4B5563]">{kpi.label}</div>
                </div>
                <div className="text-xl font-semibold text-[#111827]">{kpi.value}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Distribution & Recommended Actions */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 py-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Distribution */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0076BC]" />
              Distribution by Broker
            </h3>
            <div className="space-y-2">
              {brokerActivity.map((broker, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-[#111827] font-medium">{broker.broker}</span>
                  <div className="flex items-center gap-4 text-[#4B5563]">
                    <span>{broker.subs} subs</span>
                    <span>{broker.quotes} quotes</span>
                    <span>{broker.binds} binds</span>
                    <span className="font-semibold text-[#0076BC]">{broker.premium}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#0076BC]" />
              Recommended Actions
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#111827]">SLA Risk</div>
                    <div className="text-xs text-[#4B5563] mt-1">
                      SUB-2026-0844 expires in 6h — escalate or complete quote
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#111827]">Pending Review</div>
                    <div className="text-xs text-[#4B5563] mt-1">
                      5 modelling results returned — review CAT outputs and proceed to pricing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Queue Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0076BC]"
              />
            </div>
            <div className="flex gap-2">
              {["all", "new", "renewal"].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view as typeof activeView)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === view
                      ? "bg-[#0076BC] text-white"
                      : "bg-[#F7F8FA] text-[#4B5563] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {view === "all" ? "All Submissions" : view === "new" ? "New Business" : "Renewals"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                <tr>
                  {[
                    "Submission ID",
                    "Inception Date",
                    "Account Name",
                    "Broker",
                    "Brokerage House",
                    "Status",
                    "Type",
                    "Coverage Type",
                    "TIV",
                    "Territory",
                    "Priority",
                    "SLA",
                    "Complete",
                    "Assigned UW",
                    "Flags",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider whitespace-nowrap"
                    >
                      <button className="flex items-center gap-1 hover:text-[#111827]">
                        {header}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/submissions/${sub.id}`}
                        className="text-sm font-medium text-[#0076BC] hover:underline"
                      >
                        {sub.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">
                      {sub.inceptionDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#111827]">{sub.accountName}</div>
                      <div className="text-[11px] text-[#9B9B98] mt-0.5">{sub.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">{sub.broker}</td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">
                      {sub.brokerageHouse}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sub.status.includes("Triage")
                            ? "bg-blue-100 text-blue-800"
                            : sub.status.includes("Modelling")
                            ? "bg-purple-100 text-purple-800"
                            : sub.status.includes("Rating")
                            ? "bg-yellow-100 text-yellow-800"
                            : sub.status.includes("Quote")
                            ? "bg-green-100 text-green-800"
                            : sub.status.includes("Bind")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">{sub.type}</td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">
                      {sub.coverageType}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#0076BC] whitespace-nowrap">
                      {sub.tiv}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">
                      {sub.territory}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#111827]">{sub.priorityScore}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sub.priorityScore >= 90
                              ? "bg-red-500"
                              : sub.priorityScore >= 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          sub.slaCountdown.includes("h") || sub.slaCountdown === "1d"
                            ? "text-red-600"
                            : "text-[#111827]"
                        }`}
                      >
                        {sub.slaCountdown}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          sub.completeness === "high"
                            ? "bg-green-500"
                            : sub.completeness === "medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] whitespace-nowrap">
                      {sub.assignedUW}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


