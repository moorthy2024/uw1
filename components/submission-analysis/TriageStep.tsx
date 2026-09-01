"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import { useState } from "react";
import {
  Database, ShieldCheck, TrendingUp, UserCheck,
  Check, AlertTriangle, Send,
} from "lucide-react";
import type { SubmissionMeta, SubmissionExtras } from "../SubmissionTypes";
import { useStepActions } from "../SubmissionHelpers";
import type { SubmissionIndexEntry } from "../CustomerTable";
import {
  StepShell, StepSummaryBand, PaneTitle,
  CategorySummaryList, CategoryDetailView,
  type StepCategory, type StepStatus,
} from "../step-detail-layout";
import { OFAC_SANCTIONED, OFAC_WATCH, UW_AUTHORITY, INDUSTRY_BIND_RATE } from "./mock-data";

/* ── Types ── */

interface ClearanceRecord {
  found: boolean;
  sfRecordId?: string;
  sfAccountName?: string;
  sfOwner?: string;
  sfLastActivity?: string;
  sfStatus?: string;
  matchedFields?: Array<{ label: string; submission: string; salesforce: string; match: boolean }>;
  noRecordReason?: string;
}

/* ── Helpers ── */

function buildOfacResult(homeOffice: string): { country: string; sanctioned: boolean; watchList: boolean } {
  const parts = homeOffice.split(",");
  const country = parts[parts.length - 1]?.trim() ?? homeOffice;
  const sanctioned = OFAC_SANCTIONED.has(country);
  const watchList = !sanctioned && OFAC_WATCH.includes(country);
  return { country, sanctioned, watchList };
}

function buildClearanceRecord(meta: SubmissionMeta, idx: SubmissionIndexEntry): ClearanceRecord {
  const found = idx.clearance === "complete";
  if (!found) {
    return {
      found: false,
      noRecordReason: "No existing Salesforce account record matching this named insured was found. This submission is cleared as new business — no conflicting in-flight submissions detected across all UW desks.",
    };
  }
  return {
    found: true,
    sfRecordId: `SF-ACC-${meta.id.replace("SUB-2026-", "7")}41`,
    sfAccountName: meta.namedInsured,
    sfOwner: idx.assignedUW || "Mike Farrell",
    sfLastActivity: meta.submissionDate,
    sfStatus: "Active — Prior Relationship",
    matchedFields: [
      { label: "Named Insured", submission: meta.namedInsured, salesforce: meta.namedInsured, match: true },
      { label: "NAICS Code", submission: meta.naics.split(" — ")[0], salesforce: meta.naics.split(" — ")[0], match: true },
      { label: "Home Office", submission: idx.homeOffice, salesforce: idx.homeOffice, match: true },
      { label: "Broker House", submission: meta.brokerageHouse, salesforce: meta.brokerageHouse, match: true },
      { label: "Submission Type", submission: meta.type, salesforce: meta.type === "Renewal" ? "Renewal" : "Prior New Business", match: meta.type === "Renewal" },
    ],
  };
}

/* ── TriageActions ── */

export function TriageActions({ onProceed }: { onProceed: () => void }) {
  useStepActions([
    { icon: Send, label: "Proceed to UW Analysis", onClick: onProceed },
  ], []);
  return null;
}

/* ── TriageStep ── */

export function TriageStep({ onProceed }: { onProceed: () => void }) {
  const { meta, idx, extras } = useSubmissionCtx();
  const [assignedUW, setAssignedUW] = useState(idx.assignedUW || "Mike Farrell");
  const [activeCategory, setActiveCategory] = useState("clearance");

  const clearanceOk = idx.clearance === "complete";
  const clearanceRecord = buildClearanceRecord(meta, idx);
  const mismatches = clearanceRecord.matchedFields?.filter(f => !f.match) ?? [];

  const ofacResult = buildOfacResult(idx.homeOffice);
  const industryRate = INDUSTRY_BIND_RATE[meta.industry] ?? 55;
  const combinedPropensity = Math.round((idx.brokerBoundRate + industryRate) / 2);
  const propensityStatus: StepStatus = combinedPropensity >= 60 ? "good" : combinedPropensity >= 45 ? "watch" : "alert";
  const brokerStatus: StepStatus = idx.brokerBoundRate >= 65 ? "good" : idx.brokerBoundRate >= 45 ? "watch" : "alert";
  const uwAuth = UW_AUTHORITY[assignedUW] ?? UW_AUTHORITY["Mike Farrell"];

  const categories: StepCategory[] = [
    /* ── Clearance ── */
    {
      key: "clearance",
      icon: Database,
      title: "Clearance — Salesforce",
      metric: clearanceRecord.found ? "1 record matched" : "No record",
      status: clearanceOk ? "good" : "watch",
      statusLabel: clearanceOk ? "Cleared" : "In progress",
      headline: clearanceRecord.found
        ? `Matched to Salesforce record ${clearanceRecord.sfRecordId} (${clearanceRecord.sfAccountName}), owned by ${clearanceRecord.sfOwner}.`
        : "No conflicting record found in Salesforce — this account is not in flight with another desk.",
      context: clearanceRecord.found
        ? mismatches.length > 0
          ? `${mismatches.length} of ${clearanceRecord.matchedFields?.length} matched fields differ from the submission and need confirmation.`
          : "All matched fields agree with the submission data."
        : clearanceRecord.noRecordReason,
      sources: ["Salesforce", "Application"],
      summaryRows: clearanceRecord.found
        ? (clearanceRecord.matchedFields ?? []).map(f => ({
            key: f.label,
            label: f.label,
            value: f.submission,
            status: (f.match ? "good" : "watch") as StepStatus,
          }))
        : [{ key: "none", label: "Duplicate submissions", value: "0", status: "good" as StepStatus }],
      narrative: clearanceRecord.found
        ? `The clearance agent cross-referenced named insured, broker and NAICS against Salesforce and returned a single candidate. Confirm the ${mismatches.length > 0 ? "flagged" : "matched"} fields below before the account is assigned.`
        : "The clearance agent found no candidate records, so there is no ownership conflict to resolve. Clearance passes on a no-match basis.",
      groups: clearanceRecord.found
        ? [{
            title: "Salesforce Record",
            rows: [
              { label: "Record ID", value: clearanceRecord.sfRecordId },
              { label: "Account Name", value: clearanceRecord.sfAccountName },
              { label: "Record Owner", value: clearanceRecord.sfOwner },
              { label: "Last Activity", value: clearanceRecord.sfLastActivity },
              { label: "Salesforce Status", value: clearanceRecord.sfStatus },
            ],
          }]
        : [{
            title: "Search Result",
            rows: [
              { label: "Records found", value: "0", status: "good" },
              { label: "Basis", value: clearanceRecord.noRecordReason },
              { label: "Searched on", value: `${meta.namedInsured} · ${meta.broker} · NAICS ${meta.naics}` },
            ],
          }],
      table: clearanceRecord.found && clearanceRecord.matchedFields
        ? {
            columns: ["Field", "Submission", "Salesforce", "Result"],
            rows: clearanceRecord.matchedFields.map(f => ({
              key: f.label,
              highlight: !f.match,
              cells: [
                <span key="label" className="text-[#2D2D2D]" style={{ fontWeight: 500 }}>{f.label}</span>,
                f.submission,
                f.salesforce,
                <span key="result" className={`inline-flex items-center gap-1 text-[11px] ${f.match ? "text-emerald-700" : "text-amber-700"}`} style={{ fontWeight: 600 }}>
                  {f.match ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {f.match ? "Match" : "Differs"}
                </span>,
              ],
            })),
            caption: "Field-by-field comparison between the submission and the matched Salesforce record.",
          }
        : undefined,
    },

    /* ── OFAC Compliance ── */
    {
      key: "ofac",
      icon: ShieldCheck,
      title: "OFAC Compliance",
      metric: ofacResult.country,
      status: ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good",
      statusLabel: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Cleared",
      headline: ofacResult.sanctioned
        ? "HQ country is on the OFAC sanctions list — this submission cannot proceed."
        : ofacResult.watchList
          ? "HQ country is on the enhanced due-diligence watch list — manual review required."
          : "Headquarters country is not subject to OFAC sanctions — submission cleared.",
      context: `Headquarters: ${idx.homeOffice} · NAICS: ${meta.naics} · Submission: ${meta.id}`,
      sources: ["OFAC SDN List", "Application"],
      summaryRows: [
        { key: "country", label: "HQ Country", value: ofacResult.country, status: (ofacResult.sanctioned ? "alert" : "good") as StepStatus },
        { key: "sanctions", label: "Sanctions Status", value: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Clear", status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
        { key: "insured", label: "Named Insured", value: meta.namedInsured, status: "good" as StepStatus },
        { key: "date", label: "Submission Date", value: meta.submissionDate, status: "good" as StepStatus },
      ],
      narrative: "Sanctions screening is performed against the OFAC SDN and consolidated sanctions lists. The HQ country of the named insured is the primary screen; broker country is validated separately.",
      groups: [{
        title: "Sanctions Screening",
        rows: [
          { label: "HQ Country", value: ofacResult.country, status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
          { label: "OFAC Sanctions List", value: ofacResult.sanctioned ? "Match — Sanctioned" : ofacResult.watchList ? "Watch List — EDD Required" : "No Match — Clear", status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
          { label: "NAICS Code", value: meta.naics },
          { label: "Submission Type", value: meta.type },
          { label: "Broker Country", value: "United States", status: "good" as StepStatus, note: "All domestic brokers — no secondary country screen required" },
        ],
      }],
    },

    /* ── Success Propensity ── */
    {
      key: "propensity",
      icon: TrendingUp,
      title: "Success Propensity",
      metric: `${combinedPropensity}%`,
      status: propensityStatus,
      statusLabel: combinedPropensity >= 60 ? "High" : combinedPropensity >= 45 ? "Moderate" : "Low",
      headline: `Combined bind likelihood ${combinedPropensity}% — ${meta.brokerageHouse} broker rate ${idx.brokerBoundRate}% (${idx.brokerTrend}) · ${meta.industry} industry rate ${industryRate}%.`,
      context: idx.successPropensityDrivers,
      sources: ["Broker History", "Industry Benchmarks"],
      summaryRows: [
        { key: "broker", label: "Broker Bind Rate", value: `${idx.brokerBoundRate}%`, status: brokerStatus },
        { key: "industry", label: "Industry Bind Rate", value: `${industryRate}%`, status: (industryRate >= 60 ? "good" : industryRate >= 45 ? "watch" : "alert") as StepStatus },
        { key: "combined", label: "Combined Likelihood", value: `${combinedPropensity}%`, status: propensityStatus },
      ],
      narrative: "Bind likelihood is the average of the broker's historical bind rate with QBE and the benchmark bind rate for this industry class. It signals the commercial probability of winning this account, independent of underwriting risk.",
      groups: [{
        title: "Bind Rate Inputs",
        rows: [
          { label: "Broker", value: meta.brokerageHouse, note: `${idx.brokerBoundRate}% bind rate with QBE`, status: brokerStatus },
          { label: "Broker Trend", value: idx.brokerTrend === "up" ? "Improving ↑" : idx.brokerTrend === "down" ? "Declining ↓" : "Stable →", status: (idx.brokerTrend === "up" ? "good" : idx.brokerTrend === "down" ? "alert" : "neutral") as StepStatus },
          { label: "Industry", value: meta.industry, note: `${industryRate}% QBE industry benchmark`, status: (industryRate >= 60 ? "good" : industryRate >= 45 ? "watch" : "alert") as StepStatus },
          { label: "Combined Likelihood", value: `${combinedPropensity}%`, note: "Average of broker and industry bind rates", status: propensityStatus },
        ],
      }],
    },

    /* ── UW Assignment ── */
    {
      key: "assignment",
      icon: UserCheck,
      title: "Underwriter Assignment",
      metric: assignedUW,
      status: "neutral",
      statusLabel: "Assigned",
      headline: `${assignedUW} is assigned under DA ${uwAuth.daRef}, covering ${uwAuth.region}.`,
      context: `${meta.type} · ${meta.coverageType} · ${meta.territory}.`,
      sources: ["Delegated Authority Letter", "Regional Coverage Map", "Submission Email"],
      summaryRows: [
        { key: "uw", label: "Assigned UW", value: assignedUW },
        { key: "da", label: "DA Reference", value: uwAuth.daRef },
        { key: "region", label: "Authorised Region", value: uwAuth.region },
      ],
      narrative: "Assignment is based on territorial coverage under the delegated authority letter, confirmed by the submission email routing. Override using the selector if a different UW holds regional authority.",
      groups: [
        {
          title: "Delegated Authority",
          rows: [
            { label: "DA Reference", value: uwAuth.daRef },
            { label: "Authorised Region", value: uwAuth.region },
            { label: "Authority Limit", value: uwAuth.authority },
            { label: "Assigned UW", value: assignedUW },
          ],
        },
        {
          title: "Submission Routing Basis",
          rows: [
            { label: "Territory", value: meta.territory },
            { label: "Named Insured", value: meta.namedInsured },
            { label: "Broker", value: `${meta.broker} — ${meta.brokerageHouse}` },
            { label: "Submission Type", value: meta.type },
            { label: "Submission Email", value: `Routed via ${meta.brokerageHouse} submission inbox`, note: "Direct email reference confirmed in submission record" },
          ],
        },
      ],
      custom: (
        <div className="rounded-md border border-[#E8E6E1] bg-white p-3">
          <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Reassign Underwriter</label>
          <select value={assignedUW} onChange={e => setAssignedUW(e.target.value)}
            className="mt-1 w-full text-[12px] px-3 py-2 rounded-md border border-[#E8E6E1] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#0076BC]">
            {["Mike Farrell", "Priya Patel", "Jordan Lee", "Ashley Romero", "Diego Alvarez"].map(uw => (
              <option key={uw}>{uw}</option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  const active = categories.find(c => c.key === activeCategory) ?? categories[0];

  return (
    <>
      <TriageActions onProceed={onProceed} />

      <StepShell
        scrollToSourceOn={activeCategory}
        summary={
          <div className="bg-white border border-[#E8E6E1] rounded-md">
            <div className="grid divide-x divide-[#E8E6E1]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[
                {
                  label: "Clearance",
                  value: clearanceOk ? "Cleared" : "In progress",
                  color: clearanceOk ? "#059669" : "#D97706",
                },
                {
                  label: "OFAC Compliance",
                  value: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Cleared",
                  color: ofacResult.sanctioned ? "#DC2626" : ofacResult.watchList ? "#D97706" : "#059669",
                },
                {
                  label: "Success Propensity",
                  value: `${combinedPropensity}%`,
                  color: combinedPropensity >= 60 ? "#059669" : combinedPropensity >= 45 ? "#D97706" : "#DC2626",
                },
                {
                  label: "Assigned UW",
                  value: assignedUW,
                  color: "#0D1B2E",
                },
              ].map(stat => (
                <div key={stat.label} className="px-3 py-1.5">
                  <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                  <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        }
        leftHeader={<PaneTitle title="Triage Rule Outcomes" hint="select a category for its full detail" />}
        left={
          <CategorySummaryList
            categories={categories}
            activeKey={active.key}
            onSelect={setActiveCategory}
          />
        }
        rightHeader={<PaneTitle title={active.title} hint="supporting evidence & criteria" />}
        right={<CategoryDetailView category={active} />}
      />
    </>
  );
}
