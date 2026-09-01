"use client";
import { useSubmissionCtx } from "./SubmissionContext";
import type { ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText, Mail, Send, XCircle, AlertTriangle,
  ChevronRight, CheckCircle2, Paperclip, ExternalLink, X,
} from "lucide-react";
import { toast } from "sonner";
import type { SubmissionMeta, SubmissionExtras, Band } from "../SubmissionTypes";
import {
  useStepActions, benchmarkFor, bookDelta, parseTIV,
  type PeerBenchmark,
} from "../SubmissionHelpers";
import type { SubmissionIndexEntry } from "../CustomerTable";
import {
  StepShell, PaneTitle,
  type StepStatus,
} from "../step-detail-layout";

/* ── Helpers ── */

function splitTIV(tivFull: string): { property: string; bi: string; total: string } {
  const digits = parseFloat(tivFull.replace(/[^0-9.]/g, ""));
  if (!isFinite(digits) || digits <= 0) return { property: tivFull, bi: "—", total: tivFull };
  const property = Math.round(digits * 0.9);
  const bi = digits - property;
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return { property: fmt(property), bi: fmt(bi), total: fmt(digits) };
}

function parseCapacity(qbeLayer: string, limitsSought: string): string {
  const m = qbeLayer.match(/\$?\s*([\d.]+\s*[MB]?)\s*xs\s*\$?\s*([\d.]+\s*[MB]?)/i);
  if (!m) return `${qbeLayer} — part of ${limitsSought} excess of applicable deductibles`;
  const [, part, attach] = m;
  const norm = (s: string) => `$${s.replace(/\s+/g, "").toUpperCase()}`;
  return `${norm(part)} part of ${limitsSought} per occurrence excess of ${norm(attach)} per occurrence, excess of applicable deductibles`;
}

function ProposalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2">
      <span className="text-[11px] text-[#00205B] w-36 flex-shrink-0" style={{ fontWeight: 700 }}>{label}</span>
      <div className="min-w-0 flex-1 text-[11px] text-[#2D2D2D] leading-relaxed">{children}</div>
    </div>
  );
}

/* ── CommModal ── */

interface CommModalProps {
  title: string;
  stage: string;
  account: string;
  to: string;
  toEmail: string;
  cc?: string;
  subject: string;
  initialBody: string;
  attachment?: { filename: string };
  onClose: () => void;
}

function CommModal({ title, stage, account, to, toEmail, cc, subject, initialBody, attachment, onClose }: CommModalProps) {
  const [body, setBody] = useState(initialBody);

  const handleOpenDraft = () => {
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(toEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Draft opened — ${to}`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <Mail className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{title}</div>
              <div className="text-[10px] text-[#9B9B98]">{stage} · {account}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#F0EFEC] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>To</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate" style={{ fontWeight: 600 }}>
              {to} &lt;{toEmail}&gt;
            </span>
          </div>
          {cc && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>CC</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate">{cc}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0 mt-1" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563]">{subject}</span>
          </div>
        </div>

        {attachment && (
          <div className="px-4 py-2 flex-shrink-0 border-b border-[#F0EFEC]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F0F4FF] border border-[#C7D7F5] rounded-md w-fit max-w-full">
              <Paperclip className="w-3 h-3 text-[#4B6CB7] flex-shrink-0" />
              <span className="text-[11px] text-[#374151] font-medium truncate">{attachment.filename}</span>
              <span className="text-[9px] text-[#9B9B98] ml-1 flex-shrink-0">PDF</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            spellCheck
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">Cancel</button>
          <button onClick={handleOpenDraft}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
            style={{ fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" />
            Open Draft Email
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── QuoteProposalPane ── */

function QuoteProposalPane({ meta, extras, sov, idx, initPremium, initRate, onQuoteGenerated }: {
  meta: SubmissionMeta; extras: SubmissionExtras;
  sov: SubmissionExtras["sov"]; idx: SubmissionIndexEntry;
  initPremium: string; initRate: string; onQuoteGenerated?: () => void;
}) {
  const [premium, setPremium] = useState(initPremium);
  const [rate, setRate] = useState(initRate);
  const [showQuote, setShowQuote] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const primaryState = meta.territory.split(",")[0]?.trim() || "—";
  const houseSlug = meta.brokerageHouse.toLowerCase().replace(/[^a-z0-9]/g, "");
  const brokerEmail = `${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${houseSlug}.com`;
  const values = splitTIV(meta.tivFull);
  const capacity = parseCapacity(extras.request.qbeLayer, extras.request.limitsSought);
  const perils = extras.request.perils;
  const catPerils = perils.filter(p => /wind|flood|earth|quake|storm|hail/i.test(p));

  const catPerilStr = catPerils.length > 0 ? ` including ${catPerils.join(", ")}` : "";

  const [fields, setFields] = useState({
    namedInsured: meta.namedInsured,
    mailingAddress: "100 Corporate Center Dr, " + primaryState + ", USA",
    reInsured: "N/A — Section A written on direct QBE paper",
    policyNumber: "Section A (Domestic) — TBD · QBE Specialty Insurance Company\nSection B (Fronted Int'l / Assumed Reinsurance) — TBD · QBE Insurance Corporation",
    companyRating: "\"AA-\" by Standard & Poor's and \"A\" (Excellent) by AM Best",
    nonAdmitted: "Please be advised that this insurance will be issued by a surplus lines insurer.",
    territory: "Section A (Domestic) — Insured locations within the United States of America (including its territories and possessions).\nSection B — Worldwide, except any jurisdiction prohibited or restricted under UN / EU / UK / US sanctions.",
    coverages: "Covered Property: Buildings, Contents, Business Interruption and Extra Expense.\nCovered Cause of Loss: All Risks of Direct Physical Loss or Damage" + catPerilStr + ", excluding Equipment Breakdown.",
    capacity,
  });
  const setField = (k: keyof typeof fields) => (v: string) => setFields(f => ({ ...f, [k]: v }));
  const inputCls = "w-full text-[11px] px-2 py-1 rounded border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC] bg-white leading-relaxed";

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-md border border-[#E8E6E1] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 text-white" style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
          <span className="text-[13px]" style={{ fontWeight: 800, letterSpacing: "0.06em" }}>QBE</span>
          <span className="text-[12px]" style={{ fontWeight: 600 }}>Commercial Property Proposal</span>
        </div>
        <p className="px-3 py-2 text-[10px] text-[#6B7280] leading-relaxed bg-[#FAFAF9]">
          We are pleased to present our quote. Please review the terms carefully as they may differ from what was
          requested in the coverage specifications sent with the submission.
        </p>
      </div>

      <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden divide-y divide-[#F0EFEC]">
        <ProposalField label="Date">{today}</ProposalField>
        <ProposalField label="Broker">
          <div>{meta.broker}</div>
          <div className="text-[#6B7280]">{meta.brokerageHouse}</div>
          <div className="text-[#6B7280]">1166 Avenue of the Americas, New York, {primaryState} 10036</div>
          <div className="text-[#6B7280]">(212) 555-0140 · {brokerEmail}</div>
        </ProposalField>
        <ProposalField label="Name of Insured">
          <input className={inputCls} value={fields.namedInsured} onChange={e => setField("namedInsured")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Mailing Address">
          <input className={inputCls} value={fields.mailingAddress} onChange={e => setField("mailingAddress")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Name of Re-Insured">
          <input className={inputCls} value={fields.reInsured} onChange={e => setField("reInsured")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Policy Number & Company Paper">
          <textarea className={inputCls} rows={2} value={fields.policyNumber} onChange={e => setField("policyNumber")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Company Rating">
          <input className={inputCls} value={fields.companyRating} onChange={e => setField("companyRating")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Non-Admitted Provision">
          <textarea className={inputCls} rows={2} value={fields.nonAdmitted} onChange={e => setField("nonAdmitted")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Period of Insurance">
          From {meta.inceptionDate} &nbsp;To&nbsp; {extras.policyDetails.expirationDate}
          <div className="text-[#9B9B98]">Beginning and ending at 12:01am local standard time at the location of the property insured.</div>
        </ProposalField>
        <ProposalField label="Territory">
          <textarea className={inputCls} rows={3} value={fields.territory} onChange={e => setField("territory")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Coverages">
          <div className="w-full overflow-x-auto -mx-0">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-[#F5F4F1]">
                  {["Coverage", "Status", "Limit / Sub-limit", "Deductible", "Notes"].map(h => (
                    <th key={h} className="border border-[#E8E6E1] px-1.5 py-1 text-left text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { cov: "All Risk Property", status: "Included", limit: extras.request.limitsSought, ded: "AOP per schedule", notes: "" },
                  { cov: "Named Windstorm", status: "Included", limit: "Sub-limit per schedule", ded: "5% TIV / min $250K", notes: "" },
                  { cov: "Flood", status: "Included", limit: "$15,000,000", ded: "5% / min $250K SFHA", notes: "" },
                  { cov: "Earthquake", status: "Included", limit: "$10,000,000", ded: "5% CA / 2% PNW", notes: "" },
                  { cov: "Business Interruption", status: "Included", limit: "Actual loss sustained", ded: "72-hr waiting period", notes: "" },
                  { cov: "Cyber / Electronic Data", status: "Excluded", limit: "—", ded: "—", notes: "LMA5401" },
                  { cov: "Terrorism (TRIA)", status: extras.policyDetails.certifiedTerrorism ? "Purchased" : "Declined", limit: "—", ded: "—", notes: "" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"}>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]" style={{ fontWeight: 600 }}>{row.cov}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] border ${row.status === "Included" || row.status === "Purchased" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : row.status === "Excluded" || row.status === "Declined" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`} style={{ fontWeight: 700 }}>{row.status}</span>
                    </td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]">{row.limit}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]">{row.ded}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px] text-[#9B9B98]">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ProposalField>
        <ProposalField label="Insurable Values">
          <div className="divide-y divide-[#F0EFEC] -my-1">
            <div className="flex justify-between py-1"><span>Property Values</span><span className="tabular-nums" style={{ fontWeight: 600 }}>{values.property}</span></div>
            <div className="flex justify-between py-1"><span>Business Interruption Values</span><span className="tabular-nums" style={{ fontWeight: 600 }}>{values.bi}</span></div>
            <div className="flex justify-between py-1"><span style={{ fontWeight: 700 }}>Total</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{values.total}</span></div>
          </div>
        </ProposalField>
        <ProposalField label="Capacity">
          <input className={inputCls} value={fields.capacity} onChange={e => setField("capacity")(e.target.value)} />
        </ProposalField>
      </div>

      <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
        <div className="px-3 py-1.5 bg-[#F5F4F1] border-b border-[#E8E6E1]">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>Indication</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Indicated Premium</label>
            <input value={premium} onChange={e => setPremium(e.target.value)}
              className="mt-1 w-full text-[13px] px-3 py-2 rounded-md border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC]" style={{ fontWeight: 600 }} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Rate on Line</label>
            <input value={rate} onChange={e => setRate(e.target.value)}
              className="mt-1 w-full text-[13px] px-3 py-2 rounded-md border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC]" style={{ fontWeight: 600 }} />
          </div>
        </div>
      </div>

      {!showQuote ? (
        <button onClick={() => { onQuoteGenerated?.(); setShowQuote(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
          style={{ fontWeight: 600 }}>
          <FileText className="w-3 h-3" />
          Generate Quote Letter
        </button>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-emerald-800" style={{ fontWeight: 600 }}>
            Quote document ready — close this window and use Share Quote to send to broker.
          </span>
        </div>
      )}
    </div>
  );
}

/* ── ReferralWriteUpPane ── */

function ReferralWriteUpPane({ meta, idx, extras, subjectivities, lrBand, bench, openSubjectivities, premium, rate }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras;
  subjectivities: { label: string; value: string; status?: StepStatus; note?: string }[];
  lrBand: Band; bench: PeerBenchmark; openSubjectivities: number; premium: string; rate: string;
}) {
  const sov = extras.sov;
  const loss = extras.lossHistory;
  const yearly = loss.yearlyBreakdown ?? [];
  const lossVals = yearly.map(y => parseFloat(y.paid.replace(/[^0-9.]/g, "")) || 0);
  const total5 = lossVals.reduce((a, b) => a + b, 0);
  const avg5 = yearly.length > 0 ? Math.round(total5 / yearly.length) : 0;
  const fmt$ = (n: number) => `$${n.toLocaleString("en-US")}`;
  const BROKER_TARGET_PRICES: Record<string, string> = {
    "SUB-2026-0843": "$168,500",
    "SUB-2026-1103": "$214,000",
    "SUB-2026-1214": "$198,750",
  };
  const brokerTargetPrice = BROKER_TARGET_PRICES[meta.id] ?? "$142,000";
  const withinAuthority = openSubjectivities === 0 && lrBand !== "alert";
  const recVerb = lrBand === "alert" ? "Recommend to quote subject to conditions"
    : idx.successPropensity >= 60 ? "Recommend to quote" : "Recommend to quote selectively";

  const Section = ({ title, children, accent }: { title: string; children: ReactNode; accent?: boolean }) => (
    <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
      <div className={`px-3 py-1.5 border-b border-[#E8E6E1] ${accent ? "bg-[#EEF6FF]" : "bg-[#F5F4F1]"}`}>
        <span className={`text-[10px] uppercase tracking-[0.08em] ${accent ? "text-[#0076BC]" : "text-[#4B5563]"}`} style={{ fontWeight: 700 }}>{title}</span>
      </div>
      <div className="px-3 py-2 text-[11px] text-[#2D2D2D] leading-relaxed space-y-1">{children}</div>
    </div>
  );
  const KV = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="flex items-start gap-3">
      <span className="text-[#6B7280] w-36 flex-shrink-0">{k}</span>
      <span className="min-w-0 flex-1" style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      <Section title="Broker"><KV k="Producing Broker" v={`${meta.broker} · ${meta.brokerageHouse}`} /></Section>

      <Section title="Bound Details">
        <KV k="QBE Layer" v={extras.request.qbeLayer} />
        <KV k="Tower Position" v={extras.request.towerPosition} />
        <KV k="Indicated Premium" v={premium} />
        <KV k="Rate on Line" v={rate} />
        <KV k="Requested Layer Limit" v={extras.request.limitsSought} />
        <KV k="Perils Bound" v={extras.request.perils.join(", ")} />
      </Section>

      <Section title="New or Renewal"><KV k="Business Type" v={meta.type} /></Section>

      <Section title="Account Overview"><p>{meta.summary}</p></Section>

      <Section title="Total Insurable Values">
        <KV k="TIV $" v={meta.tivFull} />
        <KV k="Break out of TIV per entity" v={`${meta.namedInsured} — ${meta.tivFull} across ${meta.locations}`} />
      </Section>

      <Section title="Recommendation" accent>
        <p>
          {recVerb}. The account presents a {lrBand === "good" ? "clean" : lrBand === "watch" ? "manageable" : "elevated"} risk
          profile with a 5-yr loss ratio of {loss.lossRatio} against a {bench.lossRatio.toFixed(2)} book average for {idx.accountIndustry},
          and a {idx.successPropensity}% success propensity ({idx.successPropensityDrivers.toLowerCase()}).
          {openSubjectivities > 0 ? ` Terms remain non-binding pending ${openSubjectivities} outstanding condition${openSubjectivities === 1 ? "" : "s"}.` : " All conditions precedent are satisfied."}
        </p>
      </Section>

      <Section title="Construction / Occupancy">
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{extras.hazardByConstruction}</li>
          <li>{extras.hazardByOccupancy}</li>
          <li>Portfolio average hazard {sov.stats.avgHazard}/100 across {sov.stats.locationCount} locations; top concentration {sov.stats.topState}.</li>
          <li>Predominant construction class: {idx.topConstructionClass} ({idx.constructionClassPct}% of TIV).</li>
        </ul>
      </Section>

      <Section title="ITVs">
        <p>
          Values reported on a {extras.request.valuationMethod.toLowerCase()} basis and considered adequate.
          RCV supported by broker-provided appraisals; no material insurance-to-value shortfall identified at bind.
        </p>
      </Section>

      <Section title="Main Sublimits & Deductibles">
        <KV k="AOP Deductible" v={extras.policyDetails.aopDeductible} />
        {subjectivities.filter(s => /deductible/i.test(s.label)).map(s => (
          <KV key={s.label} k={s.label} v={`${s.value}${s.note ? ` (${s.note})` : ""}`} />
        ))}
        <KV k="Flood / Earthquake" v="Per-occurrence sublimit $10M; separate CAT deductible applies" />
      </Section>

      <Section title="Loss History (Minimum 5 Years)">
        <p className="text-red-600" style={{ fontWeight: 600 }}>
          Below is historical experience net of the applicable per-occurrence deductible. Under the proposed
          {" "}{extras.request.qbeLayer} attachment there would be no net losses to the QBE layer in recent history.
        </p>
        <div className="divide-y divide-[#F0EFEC] mt-1">
          {yearly.map(y => (
            <div key={y.year} className="flex justify-between py-1">
              <span className="text-[#6B7280]">{y.year}</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>{y.paid}</span>
            </div>
          ))}
          {yearly.length === 0 && <div className="py-1 text-[#9B9B98]">No yearly loss detail on file.</div>}
        </div>
        {yearly.length > 0 && (
          <div className="mt-1 pt-1 border-t border-[#E8E6E1] space-y-0.5">
            <div className="flex justify-between"><span className="text-[#6B7280]">{yearly.length}-yr Total</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{fmt$(total5)}</span></div>
            <div className="flex justify-between"><span className="text-[#6B7280]">{yearly.length}-yr Average</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{fmt$(avg5)}</span></div>
          </div>
        )}
        <p className="text-[#6B7280] mt-1">{loss.summary}</p>
      </Section>

      <Section title="Modeling Results">
        <KV k="Modelled 250-yr PML" v={`${(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * 0.018 / 1e6).toFixed(1)}M (≈1.8% of TIV)`} />
        <KV k="Average Annual Loss (AAL)" v={fmt$(Math.round(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * 0.0006))} />
        <KV k="CAT Model" v={sov.modellingReady ? "RMS v23 — results in appetite" : "Pending — required before bind"} />
        <p className="text-[#9B9B98] italic mt-0.5">Rater screen output attached in file.</p>
      </Section>

      <Section title="Non CAT / Attrition Analysis">
        <p>
          Attritional loss pick derived from the {loss.lossRatio} 5-yr loss ratio, trended for exposure growth.
          Non-CAT experience is {lrBand === "good" ? "favourable and well within" : lrBand === "watch" ? "in line with" : "above"} the
          {" "}{bench.lossRatio.toFixed(2)} portfolio benchmark for {idx.accountIndustry}.
        </p>
      </Section>

      <Section title="Pricing Methodology">
        <p>
          Technical premium built from modelled AAL plus attritional load, expenses and target margin, then benchmarked to the
          indicated {rate} rate on line. Priced against {meta.tivFull} of TIV.
        </p>
        <KV k="Indicated Premium" v={premium} />
        <KV k="Rate on Line" v={rate} />
        <KV k="Broker Requested Target Price" v={brokerTargetPrice} />
      </Section>

      <Section title="Metrics">
        <KV k="Hazard Score" v={`${idx.hazardScore}/100 (Grade ${idx.hazardGrade})`} />
        <KV k="AI Priority Score" v={`${idx.aiPriorityScore}/100`} />
        <KV k="Success Propensity" v={`${idx.successPropensity}%`} />
        <KV k="5-Yr Loss Ratio" v={loss.lossRatio} />
      </Section>

      <Section title="EP Curve">
        <div className="divide-y divide-[#F0EFEC]">
          {[
            { rp: "100-yr", pct: 0.012 },
            { rp: "250-yr", pct: 0.018 },
            { rp: "500-yr", pct: 0.026 },
          ].map(r => (
            <div key={r.rp} className="flex justify-between py-1">
              <span className="text-[#6B7280]">{r.rp} return period</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>{fmt$(Math.round(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * r.pct))}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Marginal Impact">
        <p>
          Adding this {extras.request.qbeLayer} layer is broadly diversifying against the existing
          {" "}{idx.accountIndustry} book, with primary accumulation in {sov.stats.topState}.
          Marginal capital load is modest given the excess attachment and CAT deductible structure.
        </p>
      </Section>

      <Section title="Policy Form & Review">
        <KV k="Form" v="QBE Commercial Property All-Risk (Manuscript)" />
        <KV k="Equipment Breakdown" v={extras.policyDetails.equipmentBreakdown ? "Included" : "Excluded"} />
        <KV k="Certified Terrorism (TRIA)" v={extras.policyDetails.certifiedTerrorism ? "Purchased" : "Declined"} />
      </Section>

      <Section title="Within Authority (Y / N — approved?)" accent>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${withinAuthority ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`} style={{ fontWeight: 700 }}>
            <span className={`w-1.5 h-1.5 rounded-full ${withinAuthority ? "bg-emerald-500" : "bg-amber-400"}`} />
            {withinAuthority ? "Y — Within authority, approved" : "N — Referral required"}
          </span>
        </div>
        <p className="text-[#6B7280] mt-1">
          {withinAuthority
            ? `${idx.assignedUW || "Mike Farrell"} confirms the risk sits within delegated underwriting authority; cleared to release the quote.`
            : `Escalation to line management required: ${openSubjectivities > 0 ? `${openSubjectivities} open subjectivit${openSubjectivities === 1 ? "y" : "ies"}` : "loss experience above appetite"}.`}
        </p>
      </Section>
    </div>
  );
}

/* ── ProposedQuoteModal ── */

function ProposedQuoteModal({ meta, extras, sov, idx, initPremium, initRate, onQuoteGenerated, onClose }: {
  meta: SubmissionMeta; extras: SubmissionExtras;
  sov: SubmissionExtras["sov"]; idx: SubmissionIndexEntry;
  initPremium: string; initRate: string; onQuoteGenerated?: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <FileText className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>Proposed Quote</div>
              <div className="text-[10px] text-[#9B9B98]">{meta.namedInsured} · {meta.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <QuoteProposalPane
            meta={meta} extras={extras} sov={sov} idx={idx}
            initPremium={initPremium} initRate={initRate}
            onQuoteGenerated={onQuoteGenerated}
          />
        </div>
      </div>
    </div>
  );
}

/* ── UWReviewActions ── */

export function UWReviewActions({ onLeadCarrier, onGenQuote, onShareQuote, onDecline, onProceed, quoteGenerated, openSubjectivities }: {
  onLeadCarrier: () => void; onGenQuote: () => void; onShareQuote: () => void;
  onDecline: () => void; onProceed: () => void; quoteGenerated: boolean; openSubjectivities: number;
}) {
  useStepActions([
    { icon: Mail, label: "Request Lead Carrier Info", variant: "secondary" as const, onClick: onLeadCarrier },
    { icon: FileText, label: "Generate Quote", variant: "secondary" as const, onClick: onGenQuote },
    { icon: Send, label: "Share Quote", variant: "secondary" as const, onClick: onShareQuote },
    { icon: XCircle, label: "Decline to Quote", variant: "secondary" as const, onClick: onDecline },
    ...(openSubjectivities > 0 ? [{ icon: AlertTriangle, label: `Clear ${openSubjectivities} open subjectiv${openSubjectivities === 1 ? "y" : "ies"}`, onClick: () => {} }] : []),
    { icon: ChevronRight, label: "Advance to Customer Decision", onClick: onProceed },
  ], [quoteGenerated, openSubjectivities]);
  return null;
}

/* ── UWReviewStep ── */

export function UWReviewStep({ onProceed }: { onProceed: () => void }) {
  const { meta, idx, extras } = useSubmissionCtx();
  const INIT_PREMIUM = "$142,000";
  const INIT_RATE = "0.0499%";

  const lrBand = extras.lossHistory.lossRatioBand;
  const bench = benchmarkFor(idx.accountIndustry);
  const lossSubject = parseFloat(extras.lossHistory.lossRatio) || 0;
  const lossDelta = bookDelta(lossSubject, bench.lossRatio);
  const sov = extras.sov;
  const missingDocs = extras.documents.filter(d => !d.received);
  const subjectivities = [
    { label: "CAT model results", value: "Confirmed", status: "good" as StepStatus, note: "Modelled PML confirmed within appetite." },
    { label: "Completed SOV", value: `${sov.completenessPct}% complete`, status: "good" as StepStatus, note: sov.dataCleansingNote },
    { label: "Risk Engineering survey", value: "On file", status: "good" as StepStatus },
    { label: "Named Windstorm deductible", value: "5% of TIV per occurrence", note: "Minimum $500K" },
  ];
  const openSubjectivities = subjectivities.filter(s => s.status === "watch").length;
  const [showProposedQuote, setShowProposedQuote] = useState(false);
  const [showLeadCarrier, setShowLeadCarrier] = useState(false);
  const [showShareQuote, setShowShareQuote] = useState(false);
  const [showUWRDecline, setShowUWRDecline] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const brokerEmail = `${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;

  const shareQuoteBody = `Dear ${meta.broker},\n\nPlease find attached our formal indication for ${meta.namedInsured}.\n\nAccount:           ${meta.namedInsured}\nSubmission ID:     ${meta.id}\nInception Date:    ${meta.inceptionDate}\nLayer:             ${extras.request.qbeLayer}\nLimits Sought:     ${extras.request.limitsSought}\nPerils:            ${extras.request.perils.join(", ")}\nIndicated Premium: ${INIT_PREMIUM}\nRate on Line:      ${INIT_RATE}\n\nThis indication is subject to our standard terms and subjectivities. Please review the attached quote document and revert with any questions.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const leadCarrierBody = `Dear ${meta.broker},\n\nAs part of our review of ${meta.namedInsured}, we require the following information to progress our underwriting assessment:\n\nSubmission Reference: ${meta.id}\n\n  • Primary policy terms and conditions (current / proposed)\n  • Lead carrier identity and capacity\n  • Current policy wording and endorsements\n  • Any co-insurance or treaty arrangements applicable to this risk\n\nPlease provide the above at your earliest convenience.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const uwrDeclineBody = `Dear ${meta.broker},\n\nThank you for presenting ${meta.namedInsured} for our consideration.\n\nSubmission Reference: ${meta.id}\n\nFollowing a careful review of the submission, referral, and underwriting analysis, we regret that we are unable to provide terms on this occasion.\n\nWe remain open to discussing alternative solutions and look forward to working with you on future submissions.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  return (
    <>
      <UWReviewActions
        onLeadCarrier={() => setShowLeadCarrier(true)}
        onGenQuote={() => setShowProposedQuote(true)}
        onShareQuote={() => setShowShareQuote(true)}
        onDecline={() => setShowUWRDecline(true)}
        onProceed={onProceed}
        quoteGenerated={quoteGenerated}
        openSubjectivities={openSubjectivities} />

      {showProposedQuote && createPortal(
        <ProposedQuoteModal
          meta={meta} extras={extras} sov={sov} idx={idx}
          initPremium={INIT_PREMIUM} initRate={INIT_RATE}
          onQuoteGenerated={() => { setQuoteGenerated(true); setShowProposedQuote(false); }}
          onClose={() => setShowProposedQuote(false)}
        />,
        document.body
      )}

      {showLeadCarrier && (
        <CommModal
          title="Request Primary Policy / Lead Carrier Information"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`[Action Required] Lead Carrier Information Required — ${meta.namedInsured}`}
          initialBody={leadCarrierBody}
          onClose={() => setShowLeadCarrier(false)}
        />
      )}

      {showShareQuote && (
        <CommModal
          title="Share Quote with Broker"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`QBE Formal Indication — ${meta.namedInsured} (${meta.id})`}
          attachment={{ filename: `QBE_Quote_${meta.accountName.replace(/\s+/g, "_")}.pdf` }}
          initialBody={shareQuoteBody}
          onClose={() => setShowShareQuote(false)}
        />
      )}

      {showUWRDecline && (
        <CommModal
          title="Decline to Quote"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`QBE — Decline to Quote — ${meta.namedInsured} (${meta.id})`}
          initialBody={uwrDeclineBody}
          onClose={() => setShowUWRDecline(false)}
        />
      )}

      <StepShell
        summary={
          <div className="bg-white border border-[#E8E6E1] rounded-md">
            <div className="grid divide-x divide-[#E8E6E1]" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr" }}>
              {[
                { label: "Layer",                value: extras.request.qbeLayer,           color: "#0D1B2E" },
                { label: "Indicated Premium",    value: INIT_PREMIUM,                       color: "#0D1B2E" },
                { label: "Rate on Line",         value: INIT_RATE,                          color: "#0D1B2E" },
                { label: "5-Yr Loss Ratio",      value: extras.lossHistory.lossRatio,       color: lrBand === "good" ? "#059669" : lrBand === "watch" ? "#D97706" : "#DC2626" },
                { label: "Success Propensity",   value: `${idx.successPropensity}%`,        color: "#0D1B2E" },
                { label: "Open Subjectivities",  value: String(openSubjectivities),         color: openSubjectivities > 0 ? "#D97706" : "#059669" },
              ].map(stat => (
                <div key={stat.label} className="px-3 py-1.5">
                  <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                  <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        }
        leftHeader={<PaneTitle title="UW Referral Write-Up" hint="AI-generated review for approval" />}
        left={
          <ReferralWriteUpPane
            meta={meta} idx={idx} extras={extras}
            subjectivities={subjectivities}
            lrBand={lrBand} bench={bench}
            openSubjectivities={openSubjectivities}
            premium={INIT_PREMIUM} rate={INIT_RATE}
          />
        }
      />
    </>
  );
}
