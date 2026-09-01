"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, ChevronRight, FileText, FileSpreadsheet, Mail, ScrollText,
  Quote, ExternalLink, X, CheckCircle2, Sparkles, MapPin, Building2, ShieldCheck,
  Database, Wand2, Globe, Hash, AlertTriangle, Download, Eye,
} from "lucide-react";

type DocId = "email" | "acord125" | "sov" | "lossruns" | "engineering" | "manuscript";

interface SourceDoc {
  id: DocId;
  name: string;
  kind: "EML" | "PDF" | "XLSX" | "DOCX";
  pages: number;
  receivedAt: string;
  size: string;
  icon: typeof FileText;
}

const SOURCE_DOCS: SourceDoc[] = [
  { id: "email", name: "Submission email — Marsh & McLennan", kind: "EML", pages: 1, receivedAt: "08 Apr 2026 · 09:14 AM", size: "12 KB", icon: Mail },
  { id: "acord125", name: "ACORD 125 — Commercial Application", kind: "PDF", pages: 4, receivedAt: "08 Apr 2026 · 09:14 AM", size: "184 KB", icon: FileText },
  { id: "sov", name: "Statement of Values (broker submitted)", kind: "XLSX", pages: 1, receivedAt: "08 Apr 2026 · 09:14 AM", size: "62 KB", icon: FileSpreadsheet },
  { id: "lossruns", name: "Loss Runs — 5 Year History", kind: "PDF", pages: 9, receivedAt: "08 Apr 2026 · 09:15 AM", size: "412 KB", icon: FileText },
  { id: "engineering", name: "Engineering & Inspection Reports", kind: "PDF", pages: 22, receivedAt: "08 Apr 2026 · 09:15 AM", size: "1.4 MB", icon: FileText },
  { id: "manuscript", name: "Manuscript Wording (prior policy)", kind: "DOCX", pages: 14, receivedAt: "08 Apr 2026 · 09:16 AM", size: "98 KB", icon: ScrollText },
];

type EnrichmentKind = "geocoded" | "naics" | "dnb" | "ofac" | "rms" | "none";

interface ExtractedField {
  label: string;
  value: string;
  source: DocId;
  cite: string;
  enrichment?: EnrichmentKind;
  highlight?: string;
}

interface FieldGroup {
  group: string;
  icon: typeof Building2;
  fields: ExtractedField[];
}

const ENRICHMENT_META: Record<EnrichmentKind, { label: string; color: string; bg: string; border: string; icon: typeof Wand2 }> = {
  geocoded: { label: "Geocoded", color: "#0E7C66", bg: "bg-emerald-50", border: "border-emerald-200", icon: Globe },
  naics:    { label: "NAICS enriched", color: "#2D5BFF", bg: "bg-blue-50",    border: "border-blue-200",    icon: Hash },
  dnb:      { label: "D&B verified",   color: "#7C3AED", bg: "bg-purple-50",  border: "border-purple-200",  icon: ShieldCheck },
  ofac:     { label: "OFAC screened",  color: "#0E7490", bg: "bg-cyan-50",    border: "border-cyan-200",    icon: ShieldCheck },
  rms:      { label: "RMS hazard",     color: "#B45309", bg: "bg-amber-50",   border: "border-amber-200",   icon: Wand2 },
  none:     { label: "Raw",            color: "#6B7280", bg: "bg-[#F2F1EE]",  border: "border-[#E8E6E1]",   icon: Database },
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    group: "Account Identity",
    icon: Building2,
    fields: [
      { label: "Named Insured", value: "Westfield Manufacturing LLC", source: "acord125", cite: "ACORD 125 · §1 · Box 2", enrichment: "dnb", highlight: "Westfield Manufacturing LLC" },
      { label: "FEIN",           value: "31-1234567",                  source: "acord125", cite: "ACORD 125 · §1 · Box 7", enrichment: "dnb", highlight: "31-1234567" },
      { label: "Mailing Address",value: "4200 Industrial Pkwy, Westfield OH 44062", source: "acord125", cite: "ACORD 125 · §1 · Box 4", enrichment: "geocoded", highlight: "4200 Industrial Pkwy, Westfield OH 44062" },
      { label: "Business Type",  value: "New Business",                 source: "email",    cite: "Email · subject line", enrichment: "none", highlight: "new business submission" },
      { label: "OFAC Screened",  value: "Cleared (08 Apr 2026)",        source: "acord125", cite: "ACORD 125 · §1 · Box 2", enrichment: "ofac", highlight: "Westfield Manufacturing LLC" },
      { label: "NAICS",          value: "332710 — Machine Shops",       source: "acord125", cite: "ACORD 125 · §3 · Box 14", enrichment: "naics", highlight: "332710" },
    ],
  },
  {
    group: "Program & Coverage",
    icon: ShieldCheck,
    fields: [
      { label: "Coverage Type",   value: "Commercial Property — All Risk", source: "email",    cite: "Email · body ¶1", enrichment: "none", highlight: "all risk property" },
      { label: "Total Insured Value", value: "$285,000,000",                source: "sov",      cite: "SOV · summary row", enrichment: "none", highlight: "285,000,000" },
      { label: "Policy Inception",value: "01 Jul 2026",                    source: "acord125", cite: "ACORD 125 · §2 · Box 9", enrichment: "none", highlight: "07/01/2026" },
      { label: "Requested Limit", value: "$285M / occurrence",             source: "email",    cite: "Email · body ¶2", enrichment: "none", highlight: "$285M per occurrence" },
      { label: "Deductible (AOP)",value: "$100,000",                       source: "acord125", cite: "ACORD 125 · §4 · Box 22", enrichment: "none", highlight: "$100,000" },
      { label: "Manuscript Form", value: "NMA2914 + LMA5390",              source: "manuscript", cite: "Manuscript · §3 forms list", enrichment: "none", highlight: "NMA2914" },
    ],
  },
  {
    group: "Locations & Exposure",
    icon: MapPin,
    fields: [
      { label: "No. of Locations", value: "8 (OH:4 · IN:3 · FL:1)", source: "sov", cite: "SOV · row count", enrichment: "geocoded", highlight: "Building 1–8" },
      { label: "Largest Location", value: "Building 5, Westfield OH — $86.4M", source: "sov", cite: "SOV · row 5", enrichment: "geocoded", highlight: "Building 5" },
      { label: "FL Tampa (NEW)",   value: "Building 8 — $42.3M (added 2025)", source: "sov", cite: "SOV · row 8", enrichment: "rms", highlight: "Building 8" },
      { label: "CAT Zone — NWS",   value: "Tier 1 (FL coastal)",     source: "sov", cite: "SOV · row 8", enrichment: "rms", highlight: "Building 8" },
      { label: "Construction",     value: "ISO Class 4 (Masonry NC)", source: "engineering", cite: "Engineering · pp. 4–6", enrichment: "none", highlight: "Class 4 (Masonry Non-Combustible)" },
      { label: "Sprinklered",      value: "Yes — full coverage all locations", source: "engineering", cite: "Engineering · §2", enrichment: "none", highlight: "Sprinklered: Yes" },
    ],
  },
  {
    group: "Loss History",
    icon: AlertTriangle,
    fields: [
      { label: "5-Yr Loss Ratio",  value: "0.42",                    source: "lossruns", cite: "Loss Runs · summary", enrichment: "none", highlight: "Loss Ratio 0.42" },
      { label: "Total Incurred",   value: "$1.84M (5 yr)",           source: "lossruns", cite: "Loss Runs · totals row", enrichment: "none", highlight: "$1,842,300" },
      { label: "Largest Single Loss", value: "$612K — 2023 fire (paint booth)", source: "lossruns", cite: "Loss Runs · 2023 detail", enrichment: "none", highlight: "Paint booth fire — $612,300" },
      { label: "Frequency (5 yr)", value: "11 claims",               source: "lossruns", cite: "Loss Runs · claim count", enrichment: "none", highlight: "11 claims" },
      { label: "Open Claims",      value: "0",                       source: "lossruns", cite: "Loss Runs · status column", enrichment: "none", highlight: "Open: 0" },
    ],
  },
  {
    group: "Broker & Distribution",
    icon: Mail,
    fields: [
      { label: "Broker",           value: "Sarah Chen",              source: "email", cite: "Email · From header", enrichment: "none", highlight: "From: Sarah Chen" },
      { label: "Brokerage House",  value: "Marsh & McLennan",        source: "email", cite: "Email · From header", enrichment: "none", highlight: "@marsh.com" },
      { label: "Submission Date",  value: "08 Apr 2026",             source: "email", cite: "Email · sent timestamp", enrichment: "none", highlight: "Apr 8, 2026" },
      { label: "Need-By Date",     value: "18 Apr 2026",             source: "email", cite: "Email · body ¶3", enrichment: "none", highlight: "needed by 4/18" },
    ],
  },
];

interface IngestionDetailsProps {
  accountName: string;
  submissionId: string;
}

export function IngestionDetails({ accountName, submissionId }: IngestionDetailsProps) {
  const [openSection, setOpenSection] = useState<"docs" | "fields" | "prep" | null>(null);
  const [activeCite, setActiveCite] = useState<{ docId: DocId; highlight?: string; cite?: string; field?: string } | null>(null);
  const [showSOVPreview, setShowSOVPreview] = useState(false);

  const totalFields = FIELD_GROUPS.reduce((acc, g) => acc + g.fields.length, 0);

  const toggle = (key: "docs" | "fields" | "prep") => {
    setOpenSection(openSection === key ? null : key);
  };

  return (
    <div className="mt-4 rounded-md border border-[#E8E6E1] bg-white">
      <div className="px-4 py-2.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#0076BC]" />
          <span className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>
            Ingestion Detail · {SOURCE_DOCS.length} documents · {totalFields} fields extracted
          </span>
        </div>
        <span className="text-[10px] text-[#9B9B98]">All values are AI-extracted and traceable to source.</span>
      </div>

      {/* Enrichment legend */}
      <div className="px-4 py-2 border-b border-[#E8E6E1] bg-white flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-[#6B7280] uppercase tracking-wider mr-1" style={{ fontWeight: 700 }}>Enrichment</span>
        {(Object.keys(ENRICHMENT_META) as EnrichmentKind[]).filter(k => k !== "none").map(k => {
          const m = ENRICHMENT_META[k];
          const Icon = m.icon;
          return (
            <span
              key={k}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${m.bg} ${m.border} text-[10px]`}
              style={{ color: m.color, fontWeight: 600 }}
            >
              <Icon className="w-2.5 h-2.5" />
              {m.label}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E6E1] bg-[#F2F1EE] text-[10px] text-[#6B7280]" style={{ fontWeight: 600 }}>
          <Database className="w-2.5 h-2.5" />
          Raw — verbatim from source
        </span>
      </div>

      {/* Section 1: source documents */}
      <Disclosure
        open={openSection === "docs"}
        onToggle={() => toggle("docs")}
        title="Source submission documentation received"
        subtitle={`${SOURCE_DOCS.length} files · ${SOURCE_DOCS.reduce((a, d) => a + d.pages, 0)} pages parsed`}
        icon={FileText}
      >
        <div className="space-y-1.5">
          {SOURCE_DOCS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setActiveCite({ docId: d.id })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded border border-[#E8E6E1] bg-white hover:bg-[#FAFAF9] hover:border-[#D4D2CC] text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-[#F2F1EE] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#2D2D2D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#2D2D2D] truncate" style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="text-[10px] text-[#6B7280]">
                    {d.kind} · {d.pages} {d.pages === 1 ? "page" : "pages"} · {d.size} · received {d.receivedAt}
                  </div>
                </div>
                <Eye className="w-3.5 h-3.5 text-[#9B9B98] flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </Disclosure>

      {/* Section 2: extracted fields */}
      <Disclosure
        open={openSection === "fields"}
        onToggle={() => toggle("fields")}
        title="Extracted fields with source citations"
        subtitle={`${totalFields} fields · click any citation to view source`}
        icon={Sparkles}
      >
        <div className="space-y-3">
          {FIELD_GROUPS.map((g) => {
            const GIcon = g.icon;
            return (
              <div key={g.group} className="rounded border border-[#E8E6E1] bg-white">
                <div className="px-3 py-1.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center gap-1.5">
                  <GIcon className="w-3 h-3 text-[#6B7280]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#2D2D2D]" style={{ fontWeight: 700 }}>{g.group}</span>
                  <span className="ml-auto text-[10px] text-[#9B9B98]">{g.fields.length} fields</span>
                </div>
                <div className="divide-y divide-[#F2F1EE]">
                  {g.fields.map((f) => {
                    const m = ENRICHMENT_META[f.enrichment ?? "none"];
                    const Icon = m.icon;
                    const doc = SOURCE_DOCS.find(d => d.id === f.source);
                    return (
                      <div key={f.label} className="px-3 py-2 flex items-start gap-3">
                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider" style={{ fontWeight: 600 }}>{f.label}</div>
                          <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{f.value}</div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${m.bg} ${m.border} text-[10px] flex-shrink-0`}
                          style={{ color: m.color, fontWeight: 600 }}
                          title={m.label}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {m.label}
                        </span>
                        <button
                          onClick={() => setActiveCite({ docId: f.source, highlight: f.highlight, cite: f.cite, field: f.label })}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#C2DFF4] bg-[#EEF6FF] hover:bg-[#EAF6FE] text-[10px] text-[#0079B5] flex-shrink-0 transition-colors"
                          style={{ fontWeight: 600 }}
                          title={`View source: ${doc?.name ?? f.cite}`}
                        >
                          <Quote className="w-2.5 h-2.5" />
                          {f.cite}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Disclosure>

      {/* Section 3: data preparation */}
      <Disclosure
        open={openSection === "prep"}
        onToggle={() => toggle("prep")}
        title="Data preparation — SOV cleansing & ready"
        subtitle="Normalization, geocoding, hazard tagging applied · ready for downstream agents"
        icon={Wand2}
      >
        <div className="space-y-3">
          {/* Cleansing log */}
          <div className="rounded border border-[#E8E6E1] bg-white">
            <div className="px-3 py-1.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#0076BC]" />
              <span className="text-[10px] uppercase tracking-wider text-[#2D2D2D]" style={{ fontWeight: 700 }}>SOV Cleansing Log</span>
            </div>
            <ul className="divide-y divide-[#F2F1EE]">
              {[
                { t: "Normalized 8 location rows to OED schema", e: "geocoded" as EnrichmentKind },
                { t: "Geocoded 8/8 addresses (100% match rate)", e: "geocoded" as EnrichmentKind },
                { t: "Reconciled TIV — broker total $284.7M → corrected to $285.0M after rounding fix", e: "none" as EnrichmentKind },
                { t: "RMS hazard tags applied — 1 NWS Tier 1, 0 EQ Zone 4", e: "rms" as EnrichmentKind },
                { t: "Class code 332710 enriched from NAICS index", e: "naics" as EnrichmentKind },
                { t: "OFAC screening — Cleared", e: "ofac" as EnrichmentKind },
              ].map((row, idx) => {
                const m = ENRICHMENT_META[row.e];
                const Icon = m.icon;
                return (
                  <li key={idx} className="px-3 py-1.5 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="text-[11px] text-[#2D2D2D] flex-1">{row.t}</span>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${m.bg} ${m.border} text-[10px]`} style={{ color: m.color, fontWeight: 600 }}>
                      <Icon className="w-2.5 h-2.5" />
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* SOV Ready link */}
          <button
            onClick={() => setShowSOVPreview(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-emerald-900" style={{ fontWeight: 700 }}>SOV ready</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-emerald-200 text-emerald-700 text-[9px]" style={{ fontWeight: 700 }}>
                  v2 · NORMALIZED
                </span>
              </div>
              <div className="text-[10px] text-emerald-800 mt-0.5">
                8 locations · $285M TIV · OED schema · ready for CAT model and rater
              </div>
            </div>
            <Eye className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
          </button>
        </div>
      </Disclosure>

      {/* Citation preview overlay */}
      <AnimatePresence>
        {activeCite && (
          <DocPreviewOverlay
            doc={SOURCE_DOCS.find(d => d.id === activeCite.docId)!}
            highlight={activeCite.highlight}
            cite={activeCite.cite}
            field={activeCite.field}
            accountName={accountName}
            submissionId={submissionId}
            onClose={() => setActiveCite(null)}
          />
        )}
      </AnimatePresence>

      {/* SOV preview overlay */}
      <AnimatePresence>
        {showSOVPreview && (
          <SOVPreviewOverlay
            accountName={accountName}
            submissionId={submissionId}
            onClose={() => setShowSOVPreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Disclosure({
  open, onToggle, title, subtitle, icon: Icon, children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#E8E6E1] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#FAFAF9] text-left transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />}
        <Icon className="w-3.5 h-3.5 text-[#0076BC]" />
        <div className="flex-1">
          <div className="text-[12px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>{title}</div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">{subtitle}</div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── Document preview overlay ─────────── */

function DocPreviewOverlay({
  doc, highlight, cite, field, accountName, submissionId, onClose,
}: {
  doc: SourceDoc;
  highlight?: string;
  cite?: string;
  field?: string;
  accountName: string;
  submissionId: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-white border border-[#E8E6E1] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#2D2D2D]" />
            </div>
            <div>
              <div className="text-[12px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>{doc.name}</div>
              <div className="text-[10px] text-[#6B7280]">
                {doc.kind} · {doc.pages} pages · {accountName} · {submissionId}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation banner */}
        {field && cite && (
          <div className="px-5 py-2 border-b border-[#C2DFF4] bg-[#EEF6FF] flex items-center gap-2">
            <Quote className="w-3 h-3 text-[#0079B5]" />
            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider" style={{ fontWeight: 700 }}>Source for</span>
            <span className="text-[11px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>{field}</span>
            <span className="text-[10px] text-[#6B7280]">·</span>
            <span className="text-[11px] text-[#0079B5]">{cite}</span>
          </div>
        )}

        {/* Body — fake document preview */}
        <div className="flex-1 overflow-auto p-6 bg-[#F2F1EE]">
          <div className="max-w-2xl mx-auto bg-white shadow-sm rounded border border-[#E8E6E1] p-8">
            <DocPreviewBody doc={doc} highlight={highlight} accountName={accountName} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#E8E6E1] bg-white flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-[#9B9B98]">Page 1 of {doc.pages} · highlighted region cited above</span>
          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E8E6E1] bg-white hover:bg-[#FAFAF9] text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
            <Download className="w-3 h-3" />
            Download original
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-yellow-200 text-[#1A1A1A] px-0.5 rounded ring-2 ring-yellow-300/50">
      {children}
    </mark>
  );
}

function highlightText(text: string, highlight?: string) {
  if (!highlight) return text;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <Mark>{text.slice(idx, idx + highlight.length)}</Mark>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function DocPreviewBody({ doc, highlight, accountName }: { doc: SourceDoc; highlight?: string; accountName: string }) {
  if (doc.id === "email") {
    return (
      <div className="text-[12px] text-[#2D2D2D] leading-relaxed space-y-2">
        <div className="text-[10px] text-[#9B9B98]">From: {highlightText("Sarah Chen <sarah.chen@marsh.com>", highlight)}</div>
        <div className="text-[10px] text-[#9B9B98]">To: submissions@qbe.com</div>
        <div className="text-[10px] text-[#9B9B98]">Sent: {highlightText("Apr 8, 2026 09:14 AM", highlight)}</div>
        <div className="text-[10px] text-[#9B9B98]">Subject: {highlightText(`${accountName} — new business submission`, highlight)}</div>
        <hr className="border-[#E8E6E1] my-2" />
        <p>Hi team,</p>
        <p>Please find attached a {highlightText("all risk property", highlight)} new business submission for {accountName}. Limit {highlightText("$285M per occurrence", highlight)}, inception 7/1/2026.</p>
        <p>Quote {highlightText("needed by 4/18", highlight)}. SOV (8 locations OH/IN/FL), 5-yr loss runs, ACORD 125, and engineering reports attached. Manuscript wording NMA2914 carrying over from prior placement.</p>
        <p>Thanks,<br/>Sarah</p>
      </div>
    );
  }
  if (doc.id === "acord125") {
    return (
      <div className="text-[12px] text-[#2D2D2D] space-y-3">
        <div className="text-center">
          <div className="text-[10px] text-[#9B9B98]">ACORD 125 (2016/03)</div>
          <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>COMMERCIAL INSURANCE APPLICATION</div>
        </div>
        <hr className="border-[#E8E6E1]" />
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>§1 Applicant Information</div>
          <table className="w-full text-[11px] border border-[#E8E6E1]">
            <tbody>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280] w-1/3">Box 2 — Named Insured</td><td className="px-2 py-1">{highlightText("Westfield Manufacturing LLC", highlight)}</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">Box 4 — Mailing Address</td><td className="px-2 py-1">{highlightText("4200 Industrial Pkwy, Westfield OH 44062", highlight)}</td></tr>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280]">Box 7 — FEIN</td><td className="px-2 py-1">{highlightText("31-1234567", highlight)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>§2 Policy Information</div>
          <table className="w-full text-[11px] border border-[#E8E6E1]">
            <tbody>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280] w-1/3">Box 9 — Effective Date</td><td className="px-2 py-1">{highlightText("07/01/2026", highlight)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>§3 Nature of Business</div>
          <table className="w-full text-[11px] border border-[#E8E6E1]">
            <tbody>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280] w-1/3">Box 14 — NAICS</td><td className="px-2 py-1">{highlightText("332710 — Machine Shops", highlight)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>§4 Coverage</div>
          <table className="w-full text-[11px] border border-[#E8E6E1]">
            <tbody>
              <tr className="border-b border-[#E8E6E1]"><td className="px-2 py-1 bg-[#FAFAF9] text-[#6B7280] w-1/3">Box 22 — Deductible (AOP)</td><td className="px-2 py-1">{highlightText("$100,000", highlight)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (doc.id === "sov") {
    return (
      <div className="text-[11px] text-[#2D2D2D] space-y-2">
        <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>Statement of Values — broker submitted</div>
        <table className="w-full border border-[#E8E6E1] text-[10px]">
          <thead className="bg-[#FAFAF9]">
            <tr>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">#</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">Building</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">Address</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-right">TIV</th>
            </tr>
          </thead>
          <tbody>
            {[
              { n: 1, b: "Building 1", a: "4200 Industrial Pkwy, Westfield OH", v: "$48,200,000" },
              { n: 2, b: "Building 2", a: "4250 Industrial Pkwy, Westfield OH", v: "$31,800,000" },
              { n: 3, b: "Building 3", a: "4300 Industrial Pkwy, Westfield OH", v: "$22,600,000" },
              { n: 4, b: "Building 4", a: "4350 Industrial Pkwy, Westfield OH", v: "$18,400,000" },
              { n: 5, b: "Building 5", a: "780 Foundry Rd, Indianapolis IN", v: "$86,400,000" },
              { n: 6, b: "Building 6", a: "812 Foundry Rd, Indianapolis IN", v: "$22,300,000" },
              { n: 7, b: "Building 7", a: "120 Logistics Ln, Anderson IN", v: "$13,000,000" },
              { n: 8, b: "Building 8", a: "1500 Bayshore Blvd, Tampa FL", v: "$42,300,000" },
            ].map(r => (
              <tr key={r.n}>
                <td className="px-2 py-1 border border-[#E8E6E1]">{r.n}</td>
                <td className="px-2 py-1 border border-[#E8E6E1]">{highlightText(r.b, highlight)}</td>
                <td className="px-2 py-1 border border-[#E8E6E1]">{highlightText(r.a, highlight)}</td>
                <td className="px-2 py-1 border border-[#E8E6E1] text-right">{highlightText(r.v, highlight)}</td>
              </tr>
            ))}
            <tr className="bg-[#FAFAF9]">
              <td colSpan={3} className="px-2 py-1 border border-[#E8E6E1] text-right" style={{ fontWeight: 700 }}>Total</td>
              <td className="px-2 py-1 border border-[#E8E6E1] text-right" style={{ fontWeight: 700 }}>{highlightText("$285,000,000", highlight)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (doc.id === "lossruns") {
    return (
      <div className="text-[11px] text-[#2D2D2D] space-y-2">
        <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>Loss Runs — 5 Year History</div>
        <table className="w-full border border-[#E8E6E1] text-[10px]">
          <thead className="bg-[#FAFAF9]">
            <tr>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">Year</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">Cause</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-right">Incurred</th>
              <th className="px-2 py-1 border border-[#E8E6E1] text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { y: 2021, c: "Water damage — Bldg 2", v: "$84,200", s: "Closed" },
              { y: 2022, c: "Theft — Bldg 4", v: "$112,000", s: "Closed" },
              { y: 2023, c: "Paint booth fire — $612,300", v: "$612,300", s: "Closed" },
              { y: 2024, c: "Wind — Bldg 5", v: "$348,500", s: "Closed" },
              { y: 2025, c: "Equipment breakdown — Bldg 6", v: "$685,300", s: "Closed" },
            ].map(r => (
              <tr key={r.y}>
                <td className="px-2 py-1 border border-[#E8E6E1]">{r.y}</td>
                <td className="px-2 py-1 border border-[#E8E6E1]">{highlightText(r.c, highlight)}</td>
                <td className="px-2 py-1 border border-[#E8E6E1] text-right">{highlightText(r.v, highlight)}</td>
                <td className="px-2 py-1 border border-[#E8E6E1]">{highlightText(`${r.s === "Closed" ? "Open: 0" : ""}${r.s}`, highlight)}</td>
              </tr>
            ))}
            <tr className="bg-[#FAFAF9]">
              <td colSpan={2} className="px-2 py-1 border border-[#E8E6E1] text-right" style={{ fontWeight: 700 }}>Total / 5 yr</td>
              <td className="px-2 py-1 border border-[#E8E6E1] text-right" style={{ fontWeight: 700 }}>{highlightText("$1,842,300", highlight)}</td>
              <td className="px-2 py-1 border border-[#E8E6E1]">{highlightText("Loss Ratio 0.42", highlight)} · {highlightText("11 claims", highlight)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (doc.id === "engineering") {
    return (
      <div className="text-[12px] text-[#2D2D2D] space-y-2">
        <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>Engineering &amp; Inspection Report</div>
        <div className="text-[10px] text-[#9B9B98]">Prepared by SiteRisk Inspections · 18 Mar 2026</div>
        <hr className="border-[#E8E6E1]" />
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider" style={{ fontWeight: 700 }}>§1 Construction</div>
          <p>Buildings 1–7 confirmed as {highlightText("Class 4 (Masonry Non-Combustible)", highlight)}. Building 8 (Tampa) constructed 2021, masonry tilt-up.</p>
        </div>
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider" style={{ fontWeight: 700 }}>§2 Protection</div>
          <p>{highlightText("Sprinklered: Yes", highlight)} — wet-pipe systems, ESFR coverage in Bldgs 1, 5, 8. Central station alarm at all locations.</p>
        </div>
      </div>
    );
  }
  if (doc.id === "manuscript") {
    return (
      <div className="text-[12px] text-[#2D2D2D] space-y-2">
        <div className="text-[14px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>Manuscript Wording — prior policy</div>
        <hr className="border-[#E8E6E1]" />
        <div>
          <div className="text-[10px] text-[#9B9B98] uppercase tracking-wider" style={{ fontWeight: 700 }}>§3 Forms &amp; Endorsements</div>
          <ul className="list-disc pl-5 text-[11px]">
            <li>{highlightText("NMA2914", highlight)} — War &amp; Civil War Exclusion (with painting-booth carve-out, 2025 endorsement)</li>
            <li>LMA5390 — Cyber Exclusion</li>
            <li>QBE-MAN-2024-Rev3 — Standard manuscript provisions</li>
          </ul>
        </div>
      </div>
    );
  }
  return null;
}

/* ─────────── SOV preview overlay (Data Prep output) ─────────── */

function SOVPreviewOverlay({
  accountName, submissionId, onClose,
}: {
  accountName: string;
  submissionId: string;
  onClose: () => void;
}) {
  const rows = [
    { n: 1, b: "Building 1", a: "4200 Industrial Pkwy, Westfield OH 44062", lat: "40.0431", lng: "-82.4346", c: "Class 4 (M-NC)", o: "Metal mfg", spr: "Yes", tiv: "$48,200,000", nws: "Inland", eq: "Zone 1" },
    { n: 2, b: "Building 2", a: "4250 Industrial Pkwy, Westfield OH 44062", lat: "40.0429", lng: "-82.4338", c: "Class 4 (M-NC)", o: "Warehouse", spr: "Yes", tiv: "$31,800,000", nws: "Inland", eq: "Zone 1" },
    { n: 3, b: "Building 3", a: "4300 Industrial Pkwy, Westfield OH 44062", lat: "40.0426", lng: "-82.4329", c: "Class 4 (M-NC)", o: "Metal mfg", spr: "Yes", tiv: "$22,600,000", nws: "Inland", eq: "Zone 1" },
    { n: 4, b: "Building 4", a: "4350 Industrial Pkwy, Westfield OH 44062", lat: "40.0420", lng: "-82.4321", c: "Class 4 (M-NC)", o: "Warehouse", spr: "Yes", tiv: "$18,400,000", nws: "Inland", eq: "Zone 1" },
    { n: 5, b: "Building 5", a: "780 Foundry Rd, Indianapolis IN 46226",     lat: "39.8203", lng: "-86.0850", c: "Class 4 (M-NC)", o: "Foundry",   spr: "Yes (ESFR)", tiv: "$86,400,000", nws: "Inland", eq: "Zone 2" },
    { n: 6, b: "Building 6", a: "812 Foundry Rd, Indianapolis IN 46226",     lat: "39.8210", lng: "-86.0842", c: "Class 4 (M-NC)", o: "Metal mfg", spr: "Yes", tiv: "$22,300,000", nws: "Inland", eq: "Zone 2" },
    { n: 7, b: "Building 7", a: "120 Logistics Ln, Anderson IN 46016",       lat: "40.1053", lng: "-85.6803", c: "Class 4 (M-NC)", o: "Distribution", spr: "Yes", tiv: "$13,000,000", nws: "Inland", eq: "Zone 1" },
    { n: 8, b: "Building 8", a: "1500 Bayshore Blvd, Tampa FL 33606",         lat: "27.9341", lng: "-82.4685", c: "Masonry Tilt",   o: "Distribution", spr: "Yes (ESFR)", tiv: "$42,300,000", nws: "Tier 1", eq: "Zone 1" },
  ];
  const total = "$285,000,000";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-[12px] text-[#1A1A1A]" style={{ fontWeight: 700 }}>SOV — Normalized v2 (OED schema)</div>
              <div className="text-[10px] text-[#6B7280]">{accountName} · {submissionId} · 8 locations · ready for downstream</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E8E6E1] bg-white hover:bg-[#FAFAF9] text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
              <Download className="w-3 h-3" />
              Export OED
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-[#F2F1EE] flex items-center justify-center text-[#6B7280]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-[#FAFAF9] sticky top-0">
              <tr>
                {["#","Building","Address","Lat","Lng","Construction","Occupancy","Sprinklered","NWS Zone","EQ Zone","TIV"].map(h => (
                  <th key={h} className="px-2 py-2 border-b border-[#E8E6E1] text-left text-[10px] uppercase tracking-wider text-[#6B7280]" style={{ fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.n} className="hover:bg-[#FAFAF9] border-b border-[#F2F1EE]">
                  <td className="px-2 py-1.5 text-[#6B7280]">{r.n}</td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]" style={{ fontWeight: 600 }}>{r.b}</td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]">{r.a}</td>
                  <td className="px-2 py-1.5 text-[#0079B5]">{r.lat}</td>
                  <td className="px-2 py-1.5 text-[#0079B5]">{r.lng}</td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]">{r.c}</td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]">{r.o}</td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]">{r.spr}</td>
                  <td className="px-2 py-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${r.nws === "Tier 1" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-[#F2F1EE] text-[#6B7280] border border-[#E8E6E1]"}`} style={{ fontWeight: 600 }}>
                      {r.nws}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[#2D2D2D]">{r.eq}</td>
                  <td className="px-2 py-1.5 text-right text-[#2D2D2D]" style={{ fontWeight: 600 }}>{r.tiv}</td>
                </tr>
              ))}
              <tr className="bg-[#FAFAF9]">
                <td colSpan={10} className="px-2 py-2 text-right text-[#1A1A1A]" style={{ fontWeight: 700 }}>Total Insured Value</td>
                <td className="px-2 py-2 text-right text-[#1A1A1A]" style={{ fontWeight: 700 }}>{total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2 border-t border-[#E8E6E1] bg-white flex items-center gap-2 text-[10px] text-[#6B7280]">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Geocoded 8/8 · NAICS 332710 enriched · NWS &amp; EQ tags applied via RMS · OFAC cleared. Ready for CAT model and rater.
        </div>
      </motion.div>
    </motion.div>
  );
}

