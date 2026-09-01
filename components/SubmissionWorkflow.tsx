"use client";
import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2, Clock, AlertTriangle, FileText, Shield, TrendingUp, DollarSign,
  Zap, FileCheck, ScrollText, FileSignature, Clipboard, Upload,
  AlertCircle, X, Sparkles, ChevronDown, ChevronRight, BarChart3,
  Activity, Layers, Target, BookOpen, Mail,
  Flag, ThumbsUp, ThumbsDown, Info, ArrowRight, Edit3,
  PlusCircle, Check, Lock,
  Download, Eye
} from "lucide-react";

interface SubmissionWorkflowProps { submissionId: string }

type WorkflowStep = { id: number; name: string; icon: React.ElementType; role: string; status: "completed" | "active" | "pending"; group: number };

const workflowSteps: WorkflowStep[] = [
  { id: 1, name: "Ingested", icon: FileText, role: "Ops", status: "completed", group: 1 },
  { id: 2, name: "Processed", icon: Zap, role: "Ops", status: "completed", group: 1 },
  { id: 3, name: "Triaged", icon: Shield, role: "UW", status: "completed", group: 2 },
  { id: 4, name: "UW Analysis", icon: TrendingUp, role: "UW", status: "active", group: 3 },
  { id: 5, name: "Modelling", icon: BarChart3, role: "UW", status: "pending", group: 3 },
  { id: 6, name: "Rater", icon: DollarSign, role: "UW", status: "pending", group: 3 },
  { id: 7, name: "Quote Ready", icon: FileCheck, role: "UW", status: "pending", group: 4 },
  { id: 8, name: "Quoted", icon: CheckCircle2, role: "UW", status: "pending", group: 4 },
  { id: 9, name: "Manuscript", icon: ScrollText, role: "UW", status: "pending", group: 4 },
  { id: 10, name: "Book", icon: BookOpen, role: "Ops", status: "pending", group: 5 },
  { id: 11, name: "Bind", icon: FileSignature, role: "Ops", status: "pending", group: 5 },
  { id: 12, name: "Issue", icon: Clipboard, role: "Ops", status: "pending", group: 5 },
];

const GROUPS = [
  { id: 1, label: "Ingestion", steps: [1, 2] },
  { id: 2, label: "Triage", steps: [3] },
  { id: 3, label: "UW Analysis", steps: [4, 5, 6] },
  { id: 4, label: "UW Review", steps: [7, 8, 9] },
  { id: 5, label: "Customer Decision", steps: [10, 11, 12] },
];

// ─── Shared primitives ───────────────────────────────────────────────────────

function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "blue" | "purple" | "gray" | "navy" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-[#0076BC] border border-blue-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    navy: "bg-[#00205B] text-white border-transparent",
  }[variant];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase ${cls}`}>{label}</span>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-widest text-[#8E8C88] mb-2">{children}</div>;
}

function StatPill({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "green" | "amber" | "red" | "blue" | "default" }) {
  const valColor = { green: "text-emerald-600", amber: "text-amber-600", red: "text-red-600", blue: "text-[#0076BC]", default: "text-[#1A1A1A]" }[tone];
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-4 flex flex-col gap-1">
      <div className="text-[10px] text-[#8E8C88] uppercase tracking-wider font-semibold">{label}</div>
      <div className={`text-xl font-bold tabular-nums leading-none ${valColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-[#9B9B98]">{sub}</div>}
    </div>
  );
}

function RuleRow({ label, status, detail, evidence }: { label: string; status: "pass" | "fail" | "warn" | "info"; detail: string; evidence?: string }) {
  const cfg = {
    pass: { icon: CheckCircle2, text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
    fail: { icon: X, text: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
    warn: { icon: AlertTriangle, text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
    info: { icon: Info, text: "text-[#0076BC]", bg: "bg-blue-50", border: "border-blue-100" },
  }[status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.text}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <div className="text-xs text-[#5D5D5D] mt-0.5 leading-snug">{detail}</div>
        {evidence && <div className="text-xs text-[#8E8C88] mt-1 italic">Evidence: {evidence}</div>}
      </div>
    </div>
  );
}

function ScoreGauge({ score, max = 10, label }: { score: number; max?: number; label: string }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  const r = 32;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E8E6E1" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - pct / 100)}`}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-[11px] text-[#5D5D5D] font-medium text-center">{label}</div>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#0076BC" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#E8E6E1] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Workflow sidebar ─────────────────────────────────────────────────────────

function WorkflowSidebar({ currentStep, setCurrentStep }: { currentStep: number; setCurrentStep: (n: number) => void }) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggle = (g: number) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });
  return (
    <div className="w-[220px] flex-shrink-0 bg-white border-r border-[#E8E6E1] flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[#E8E6E1] bg-[#F7F7F6]">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#0076BC] mb-1">Commercial Property</div>
        <div className="text-sm font-bold text-[#1A1A1A] leading-tight">Westfield Manufacturing</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-[#8E8C88]">SUB-2026-0847</span>
          <span className="w-1 h-1 rounded-full bg-[#D0CECC]" />
          <Badge label="Active" variant="green" />
        </div>
      </div>
      <div className="flex-1 overflow-auto py-3 px-2 space-y-1">
        {GROUPS.map(g => {
          const open = !collapsed.has(g.id);
          const steps = workflowSteps.filter(s => g.steps.includes(s.id));
          const groupDone = steps.every(s => s.status === "completed");
          const groupActive = steps.some(s => s.id === currentStep);
          return (
            <div key={g.id}>
              <button onClick={() => toggle(g.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${groupActive ? "text-[#0076BC]" : "text-[#8E8C88] hover:text-[#1A1A1A]"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${groupDone ? "bg-emerald-500" : groupActive ? "bg-[#0076BC]" : "bg-[#E8E6E1]"}`}>
                  {groupDone ? <Check className="w-2.5 h-2.5 text-white" /> : <span className="text-[8px] font-bold text-white">{g.id}</span>}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider flex-1 truncate">{g.label}</span>
                {open ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              </button>
              {open && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {steps.map(step => {
                    const Icon = step.icon;
                    const isActive = step.id === currentStep;
                    const isDone = step.status === "completed";
                    return (
                      <button key={step.id} onClick={() => setCurrentStep(step.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                          isActive ? "bg-[#EEF6FF] border border-[#BAD9F5] text-[#0076BC]"
                          : isDone ? "hover:bg-[#F7F7F6] text-[#5D5D5D]"
                          : "hover:bg-[#F7F7F6] text-[#B0AEA9]"
                        }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isActive ? "bg-[#0076BC]" : isDone ? "bg-emerald-100" : "bg-[#E8E6E1]"
                        }`}>
                          {isDone ? <Check className="w-3 h-3 text-emerald-600" /> : <Icon className={`w-3 h-3 ${isActive ? "text-white" : "text-[#B0AEA9]"}`} />}
                        </div>
                        <span className={`text-xs font-medium truncate ${isActive ? "text-[#0076BC]" : isDone ? "text-[#3D3D3D]" : "text-[#B0AEA9]"}`}>{step.name}</span>
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          step.role === "UW" ? "bg-[#EEF6FF] text-[#0076BC]" : "bg-[#F3F3F1] text-[#9B9B98]"
                        }`}>{step.role}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-[#E8E6E1] bg-amber-50">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">SLA · 18h remaining</span>
        </div>
        <ProgressBar value={25} color="#F59E0B" />
      </div>
    </div>
  );
}

// ─── Account bar ──────────────────────────────────────────────────────────────

function AccountBar({ submissionId }: { submissionId: string }) {
  return (
    <div className="flex-shrink-0 bg-[#00205B] px-6 py-3 flex items-center gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-white text-base font-bold truncate">Westfield Manufacturing Corp</h1>
          <span className="text-[#7AA8D8] text-xs font-medium">{submissionId}</span>
        </div>
        <div className="flex items-center gap-4 mt-0.5 flex-wrap">
          {[["Industry", "Electronics Mfg"], ["Locations", "12"], ["Territory", "CA / NV"], ["TIV", "$125M"], ["Broker", "Marsh & McLennan"]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="text-[#7AA8D8] text-[10px] font-semibold uppercase tracking-wide">{l}</span>
              <span className="text-white text-xs font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge label="New Business" variant="blue" />
        <Badge label="High Touch" variant="amber" />
        <Badge label="Manuscript" variant="purple" />
      </div>
    </div>
  );
}

// ─── AI insight band ──────────────────────────────────────────────────────────

function AIBand({ stepLabel, summary, actions }: { stepLabel: string; summary: string; actions: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="mx-6 mt-4 rounded-xl border border-[#BAD9F5] bg-gradient-to-r from-[#F0F7FF] to-[#F7FBFF] px-5 py-3.5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F9760A] to-[#00205B] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0076BC]">AI UW Agent · {stepLabel}</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-sm text-[#2D2D2D] leading-relaxed">{summary}</p>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-[#0076BC] font-medium">
                <ArrowRight className="w-3 h-3 flex-shrink-0" /> {a}
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-[#E0EDFD] text-[#8E8C88] transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Step 1: Ingested ─────────────────────────────────────────────────────────

function IngestedStep({ submissionId }: { submissionId: string }) {
  const docs = [
    { name: "ACORD Application.pdf", pages: 12, size: "2.4 MB" },
    { name: "Statement of Values.xlsx", pages: 1, size: "156 KB" },
    { name: "Loss Runs 2021–2025.pdf", pages: 8, size: "1.8 MB" },
    { name: "Expiring Policy.pdf", pages: 45, size: "3.2 MB" },
    { name: "Risk Engineering Report.pdf", pages: 22, size: "4.1 MB" },
  ];
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="Ingestion" summary="Submission received from Marsh & McLennan with 5 documents totalling 88 pages. All required ACORD sections present. Risk Engineering report included — above-average completeness at intake." actions={["Advance to data extraction", "Verify producer contact"]} />
      <div className="p-6 grid grid-cols-2 gap-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Submission Details</SectionLabel>
          <div className="space-y-2.5 mt-3">
            {[["Received", "Apr 8, 2026 · 2:15 PM"], ["Broker", "Marsh & McLennan"], ["Producer", "Sarah Chen · schen@marsh.com"], ["Named Insured", "Westfield Manufacturing Corp"], ["Type", "New Business"], ["Requested Effective", "May 1, 2026"]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-[#F2F1EE]">
                <span className="text-xs text-[#8E8C88] font-medium">{l}</span>
                <span className="text-xs text-[#1A1A1A] font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Documents Received</SectionLabel>
          <div className="space-y-2 mt-3">
            {docs.map(d => (
              <div key={d.name} className="flex items-center gap-3 p-3 bg-[#F7F7F6] rounded-lg">
                <FileText className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1A1A1A] truncate">{d.name}</div>
                  <div className="text-[10px] text-[#9B9B98]">{d.pages} pages · {d.size}</div>
                </div>
                <Badge label="Received" variant="green" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Processed ────────────────────────────────────────────────────────

function ProcessedStep({ submissionId }: { submissionId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const fields = [
    { key: "namedInsured", label: "Named Insured", value: "Westfield Manufacturing Corp", confidence: 98, page: 1, ok: true },
    { key: "effectiveDate", label: "Effective Date", value: "05/01/2026", confidence: 95, page: 1, ok: true },
    { key: "totalInsuredValue", label: "Total Insured Value", value: "$125,000,000", confidence: 92, page: 3, ok: false },
    { key: "primaryLocation", label: "Primary Location", value: "San Diego, CA", confidence: 98, page: 2, ok: true },
    { key: "occupancy", label: "Occupancy", value: "Manufacturing — Electronics", confidence: 88, page: 2, ok: false },
    { key: "constructionType", label: "Construction", value: "Non-Combustible", confidence: 90, page: 3, ok: true },
    { key: "sprinklered", label: "Sprinklered", value: "Yes — Full Coverage", confidence: 95, page: 3, ok: true },
    { key: "deductible", label: "AOP Deductible", value: "$100,000", confidence: 90, page: 4, ok: true },
    { key: "squareFootage", label: "Square Footage", value: "185,000 sq ft", confidence: 88, page: 3, ok: false },
    { key: "roofType", label: "Roof Type", value: "Built-up / EPDM", confidence: 75, page: 3, ok: false },
  ];
  const validated = fields.filter(f => f.ok).length;
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="Processing" summary={`Data extraction complete at 91% average confidence. ${validated}/${fields.length} fields auto-validated. 4 fields require human review — TIV reconciliation and roof type have the lowest confidence scores.`} actions={["Review flagged fields", "Confirm TIV against SOV"]} />
      <div className="p-6 grid grid-cols-2 gap-5" style={{ height: "calc(100% - 120px)" }}>
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E8E6E1] bg-[#F7F7F6] flex items-center justify-between">
            <SectionLabel>Extracted Fields</SectionLabel>
            <span className="text-[10px] text-emerald-600 font-bold">{validated}/{fields.length} validated</span>
          </div>
          <div className="overflow-auto flex-1 divide-y divide-[#F2F1EE]">
            {fields.map(f => (
              <button key={f.key} onClick={() => setSelected(f.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selected === f.key ? "bg-[#EEF6FF] border-l-2 border-[#0076BC]" : "hover:bg-[#F7F7F6]"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${f.ok ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {f.ok ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <AlertCircle className="w-2.5 h-2.5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1A1A1A]">{f.label}</div>
                  <div className="text-[11px] text-[#5D5D5D] truncate">{f.value}</div>
                </div>
                <span className={`text-[10px] font-bold ${f.confidence >= 90 ? "text-emerald-600" : f.confidence >= 80 ? "text-amber-600" : "text-red-600"}`}>{f.confidence}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E8E6E1] bg-[#F7F7F6]"><SectionLabel>Source Document</SectionLabel></div>
          <div className="flex-1 flex items-center justify-center bg-[#F7F7F6] p-6">
            {selected ? (() => {
              const f = fields.find(x => x.key === selected)!;
              return (
                <div className="w-full">
                  <div className="bg-white border-2 border-[#E8E6E1] rounded-xl p-6 shadow-sm mb-4">
                    <div className="text-center font-bold text-[#1A1A1A] text-sm mb-4 pb-4 border-b border-[#E8E6E1]">ACORD APPLICATION · Commercial Property</div>
                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                      <div className="text-[10px] uppercase tracking-wider text-[#8E8C88] mb-1">{f.label} · Page {f.page}</div>
                      <div className="text-lg font-bold text-[#1A1A1A]">{f.value}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${f.confidence >= 90 ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-xs text-[#5D5D5D]">Extraction confidence: <strong>{f.confidence}%</strong></span>
                    </div>
                  </div>
                  {!f.ok && (
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold transition-colors">✓ Validate</button>
                      <button className="flex-1 px-4 py-2 bg-white border border-[#E8E6E1] text-[#1A1A1A] rounded-lg hover:bg-[#F7F7F6] text-xs font-bold transition-colors">Edit Value</button>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="text-center text-[#B0AEA9]">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-xs">Select a field to view source</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Triaged ──────────────────────────────────────────────────────────

function TriagedStep({ submissionId }: { submissionId: string }) {
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="Triage" summary="All appetite and compliance rules In Scope. Submission is high-touch due to TIV >$75M and multi-location CAT exposure. Routing to full UW analysis workflow." actions={["Advance to UW Analysis", "Assign to senior UW"]} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, color: "text-emerald-600", border: "border-emerald-200", title: "Appetite Check", result: "IN SCOPE", resultColor: "text-emerald-600", sub: "Within all guidelines" },
            { icon: CheckCircle2, color: "text-emerald-600", border: "border-emerald-200", title: "Compliance", result: "IN SCOPE", resultColor: "text-emerald-600", sub: "All requirements met" },
            { icon: Shield, color: "text-[#0076BC]", border: "border-[#BAD9F5]", title: "Risk Tier", result: "HIGH TOUCH", resultColor: "text-[#0076BC]", sub: "Manual UW required" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.title} className={`bg-white border ${c.border} rounded-xl p-4 flex items-start gap-3`}>
                <Icon className={`w-5 h-5 ${c.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]">{c.title}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${c.resultColor}`}>{c.result}</div>
                  <div className="text-[11px] text-[#9B9B98] mt-0.5">{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Guideline Assessment</SectionLabel>
          <div className="space-y-2 mt-3">
            <RuleRow label="TIV within appetite" status="pass" detail="$125M TIV · Appetite min $500M" evidence="SOV page 3 · $125,000,000 aggregate" />
            <RuleRow label="Geography approved" status="pass" detail="California and Nevada · Both approved territories" evidence="ACORD page 2 · San Diego, CA primary" />
            <RuleRow label="Occupancy acceptable" status="pass" detail="Electronics Manufacturing · Within scope" evidence="ACORD page 2 · NAICS 334419" />
            <RuleRow label="Construction type" status="pass" detail="Non-Combustible · Preferred class" evidence="SOV page 3 · Steel frame, concrete tilt-up" />
            <RuleRow label="Protection adequate" status="pass" detail="Fully sprinklered · ISO Protection Class 3" evidence="RE Report page 5 · Central station monitoring" />
            <RuleRow label="Minimum premium" status="pass" detail="Est. $487K · Exceeds $50K minimum" evidence="Rating model pre-indication" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: UW Analysis ──────────────────────────────────────────────────────

type UWTab = "overview" | "risk" | "coverage" | "decision";

function UWAnalysisStep({ submissionId }: { submissionId: string }) {
  const [tab, setTab] = useState<UWTab>("overview");
  const [decision, setDecision] = useState<"approve" | "refer" | "decline" | null>(null);
  const [riskEngOpen, setRiskEngOpen] = useState(false);
  const [conditionNotes, setConditionNotes] = useState("");

  const tabs: { id: UWTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "risk", label: "Risk Assessment", icon: Shield },
    { id: "coverage", label: "Coverage & Terms", icon: Layers },
    { id: "decision", label: "UW Decision", icon: Target },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AIBand
        stepLabel="UW Analysis"
        summary="Risk quality is above average. CAT exposure is the primary underwriting consideration — 65% of TIV in earthquake and wildfire zones. Favorable 5-yr loss ratio (18%) and excellent protection systems partially offset CAT concentration. Recommend referral to CAT Manager before advancing to modelling."
        actions={["Trigger CAT modelling", "Confirm accumulation limits", "Request COPE data for LA facility"]}
      />
      <div className="px-6 mt-4 grid grid-cols-6 gap-3">
        <StatPill label="Total TIV" value="$125M" sub="12 locations" />
        <StatPill label="Req'd Limit" value="$125M" sub="Per occurrence" tone="blue" />
        <StatPill label="Tech Premium" value="$487.5K" sub="Pre tax & fees" />
        <StatPill label="Quoted Premium" value="$512.9K" sub="Total at bind" tone="blue" />
        <StatPill label="Risk Score" value="9.4" sub="Highly appetitive" tone="green" />
        <StatPill label="CAT Concen." value="65%" sub="EQ & wildfire" tone="amber" />
      </div>
      <div className="px-6 mt-4 flex items-center gap-1 border-b border-[#E8E6E1]">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                tab === t.id ? "border-[#0076BC] text-[#0076BC]" : "border-transparent text-[#8E8C88] hover:text-[#1A1A1A]"
              }`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">
        {tab === "overview" && <UWOverviewTab riskEngOpen={riskEngOpen} setRiskEngOpen={setRiskEngOpen} />}
        {tab === "risk" && <UWRiskTab />}
        {tab === "coverage" && <UWCoverageTab />}
        {tab === "decision" && <UWDecisionTab decision={decision} setDecision={setDecision} conditionNotes={conditionNotes} setConditionNotes={setConditionNotes} />}
      </div>
    </div>
  );
}

function UWOverviewTab({ riskEngOpen, setRiskEngOpen }: { riskEngOpen: boolean; setRiskEngOpen: (b: boolean) => void }) {
  return (
    <div className="p-6 grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>AI Risk Scoring</SectionLabel>
          <div className="flex items-center gap-8 mt-4">
            <ScoreGauge score={9.4} max={10} label="Appetite" />
            <ScoreGauge score={7.8} max={10} label="Hazard" />
            <ScoreGauge score={8.6} max={10} label="Protection" />
            <ScoreGauge score={6.2} max={10} label="CAT" />
            <div className="flex-1 space-y-3 ml-4">
              {[
                { label: "Construction", value: 85, color: "#10B981" },
                { label: "Occupancy", value: 72, color: "#F59E0B" },
                { label: "CAT Exposure", value: 58, color: "#EF4444" },
                { label: "Loss History", value: 92, color: "#10B981" },
                { label: "Protection", value: 88, color: "#10B981" },
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#5D5D5D] font-medium">{s.label}</span>
                    <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                  <ProgressBar value={s.value} color={s.color} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Risk Highlights</SectionLabel>
            <Badge label="HITL UW Review Required" variant="amber" />
          </div>
          <div className="space-y-2.5">
            <RuleRow label="Coastal exposure validation" status="warn" detail="3 locations within 5 miles of coast — CAT team sign-off required before modelling" evidence="RE Report page 11 · Lat/Long confirmed" />
            <RuleRow label="EQ zone concentration" status="warn" detail="65% of TIV in moderate-high seismic zones across California — validate PML and reinsurance" evidence="SOV geocoding — 8 of 12 locations in Zone D" />
            <RuleRow label="Protection credits validated" status="pass" detail="All 12 locations fully sprinklered with central station alarms — preserve credits in pricing" evidence="RE Report page 5–7 · Third party inspected 2025" />
            <RuleRow label="Favorable loss history" status="pass" detail="Only 2 claims in 5 years · Both minor water damage <$100K · LR 18%" evidence="Loss runs 2021–2025 · Independently verified" />
            <RuleRow label="Wildfire proximity — LA facility" status="warn" detail="LA Distribution Center within 2 miles of high-risk WUI — fire pump replacement pending" evidence="RE Report page 14 · Installed 2008" />
          </div>
          <div className="mt-4 pt-4 border-t border-[#F2F1EE]">
            {!riskEngOpen ? (
              <button onClick={() => setRiskEngOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-[#0076BC] text-[#0076BC] rounded-lg text-xs font-semibold hover:bg-[#EEF6FF] transition-colors">
                <Upload className="w-4 h-4" /> Attach Risk Engineering Insights
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Risk Engineering Report Loaded</span>
                  <Badge label="Apr 9, 2026" variant="green" />
                </div>
                <p className="text-xs text-[#5D5D5D]">Overall rating: <strong className="text-emerald-700">Good</strong>. 1 critical item (LA fire pump), 5 recommended improvements. Estimated loss potential reduction 15–20% if implemented.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Key UW Values</SectionLabel>
          <div className="space-y-3 mt-3">
            {[
              { label: "Largest Location", value: "$42M", sub: "San Diego facility" },
              { label: "5-yr Loss Ratio", value: "18%", sub: "Excellent history" },
              { label: "250-yr EQ PML", value: "$18.2M", sub: "14.6% of TIV" },
              { label: "Open Conditions", value: "1", sub: "Coastal review" },
              { label: "Effective Date", value: "May 1, 2026", sub: "23 days" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-start py-2 border-b border-[#F2F1EE]">
                <div>
                  <div className="text-[10px] text-[#8E8C88] font-semibold uppercase tracking-wide">{m.label}</div>
                  <div className="text-[11px] text-[#9B9B98]">{m.sub}</div>
                </div>
                <div className="text-sm font-bold text-[#1A1A1A]">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Exception Inbox</SectionLabel>
          <div className="space-y-2.5 mt-3">
            {[
              { dot: "bg-amber-500", title: "CAT exposure confirmation", desc: "Coastal location ($42M TIV) requires CAT Manager sign-off", owner: "UW" },
              { dot: "bg-blue-500", title: "Facultative support", desc: "Indicative quote received, awaiting final confirmation", owner: "Reinsurance" },
              { dot: "bg-red-500", title: "LA fire pump timeline", desc: "Replacement required within 12 months — binding condition?", owner: "UW" },
            ].map((e, i) => (
              <div key={i} className="flex gap-3 p-3 bg-[#F7F7F6] rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1A1A1A]">{e.title}</div>
                  <div className="text-[11px] text-[#5D5D5D] mt-0.5">{e.desc}</div>
                  <div className="text-[10px] text-[#0076BC] font-semibold mt-1">Owner · {e.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="space-y-2 mt-3">
            <button className="w-full px-4 py-2.5 bg-[#00205B] text-white rounded-lg text-xs font-bold hover:bg-[#001740] transition-colors flex items-center justify-between">
              Approve Risk Position <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button className="w-full px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-between">
              Refer to CAT Manager <Flag className="w-3.5 h-3.5" />
            </button>
            <button className="w-full px-4 py-2.5 bg-white border border-[#E8E6E1] text-[#1A1A1A] rounded-lg text-xs font-semibold hover:bg-[#F7F7F6] transition-colors flex items-center justify-between">
              Request Broker Info <Mail className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UWRiskTab() {
  const locations = [
    { name: "San Diego Main Facility", state: "CA", tiv: "$42M", const: "Non-Comb", prot: "ISO 3", eq: "High", wf: "Low", fl: "None", score: 78 },
    { name: "Los Angeles Distribution", state: "CA", tiv: "$28M", const: "Non-Comb", prot: "ISO 4", eq: "High", wf: "High", fl: "None", score: 62 },
    { name: "Sacramento Warehouse", state: "CA", tiv: "$18M", const: "Masonry", prot: "ISO 3", eq: "Moderate", wf: "Low", fl: "None", score: 85 },
    { name: "San Jose R&D Campus", state: "CA", tiv: "$15M", const: "Steel Frame", prot: "ISO 2", eq: "High", wf: "Low", fl: "Low", score: 81 },
    { name: "Reno Distribution", state: "NV", tiv: "$9M", const: "Tilt-Up", prot: "ISO 4", eq: "Moderate", wf: "Moderate", fl: "None", score: 74 },
  ];
  const pc = (v: string) => v === "High" ? "text-red-600" : v === "Moderate" ? "text-amber-600" : v === "Low" ? "text-emerald-600" : "text-[#B0AEA9]";
  return (
    <div className="p-6 space-y-5">
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#F7F7F6] flex items-center justify-between">
          <SectionLabel>Location Risk Matrix</SectionLabel>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E6E1] rounded-lg text-xs font-medium text-[#5D5D5D] hover:bg-[#F7F7F6]">
            <Download className="w-3 h-3" /> Export SOV
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-[#F7F7F6]"><tr>
            {["Location", "State", "TIV", "Construction", "Protection", "EQ", "Wildfire", "Flood", "Score"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#8E8C88]">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-[#F2F1EE]">
            {locations.map(l => (
              <tr key={l.name} className="hover:bg-[#FAFAF9] transition-colors">
                <td className="px-4 py-3 text-xs font-semibold text-[#1A1A1A]">{l.name}</td>
                <td className="px-4 py-3 text-xs text-[#5D5D5D]">{l.state}</td>
                <td className="px-4 py-3 text-xs font-bold text-[#1A1A1A]">{l.tiv}</td>
                <td className="px-4 py-3 text-xs text-[#5D5D5D]">{l.const}</td>
                <td className="px-4 py-3 text-xs text-[#5D5D5D]">{l.prot}</td>
                <td className={`px-4 py-3 text-xs font-semibold ${pc(l.eq)}`}>{l.eq}</td>
                <td className={`px-4 py-3 text-xs font-semibold ${pc(l.wf)}`}>{l.wf}</td>
                <td className={`px-4 py-3 text-xs font-semibold ${pc(l.fl)}`}>{l.fl}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16"><ProgressBar value={l.score} color={l.score >= 80 ? "#10B981" : l.score >= 70 ? "#F59E0B" : "#EF4444"} /></div>
                    <span className={`text-xs font-bold ${l.score >= 80 ? "text-emerald-600" : l.score >= 70 ? "text-amber-600" : "text-red-600"}`}>{l.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-[#E8E6E1] bg-[#F7F7F6]">
          <span className="text-[11px] text-[#8E8C88]">Showing top 5 of 12 locations · <button className="text-[#0076BC] font-semibold hover:underline">View all</button></span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>5-Year Loss History</SectionLabel>
          <div className="space-y-3 mt-3">
            {[
              { year: "2025", paid: "$0", lr: "0%", bar: 0 },
              { year: "2024", paid: "$48K", lr: "9%", bar: 9 },
              { year: "2023", paid: "$76K", lr: "14%", bar: 14 },
              { year: "2022", paid: "$0", lr: "0%", bar: 0 },
              { year: "2021", paid: "$0", lr: "0%", bar: 0 },
            ].map(l => (
              <div key={l.year} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#5D5D5D] w-10">{l.year}</span>
                <div className="flex-1"><ProgressBar value={l.bar} max={50} color="#0076BC" /></div>
                <span className="text-xs text-[#5D5D5D] w-16 text-right">{l.paid}</span>
                <span className="text-xs font-bold text-emerald-600 w-8 text-right">{l.lr}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#F2F1EE] flex justify-between">
            <span className="text-xs text-[#8E8C88]">5-yr aggregate loss ratio</span>
            <span className="text-sm font-bold text-emerald-600">18%</span>
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Peril Exposure Summary</SectionLabel>
          <div className="space-y-3 mt-3">
            {[
              { peril: "Earthquake", tiv: "$81.3M", pct: 65, color: "#E07010" },
              { peril: "Wildfire (WUI)", tiv: "$37.5M", pct: 30, color: "#F4A030" },
              { peril: "Coastal Wind", tiv: "$42.0M", pct: 34, color: "#0090DC" },
              { peril: "Flood Zone", tiv: "$0M", pct: 0, color: "#20A8E0" },
            ].map(p => (
              <div key={p.peril} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{p.peril}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#5D5D5D]">{p.tiv}</span>
                    <span className="text-xs font-bold" style={{ color: p.color }}>{p.pct}%</span>
                  </div>
                </div>
                <ProgressBar value={p.pct} color={p.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UWCoverageTab() {
  const [selected, setSelected] = useState<string | null>("building");
  const lines = [
    { id: "building", label: "Building", limit: "$125,000,000", deductible: "$100,000", basis: "RCV", status: "ok" as const },
    { id: "bi", label: "Business Income", limit: "$24,000,000", deductible: "72 hr waiting period", basis: "ALS", status: "ok" as const },
    { id: "eq", label: "Earthquake", limit: "$50,000,000", deductible: "5% TIV", basis: "RCV", status: "warn" as const },
    { id: "flood", label: "Flood", limit: "Excluded", deductible: "N/A", basis: "N/A", status: "info" as const },
    { id: "wind", label: "Named Windstorm", limit: "$125,000,000", deductible: "3% TIV", basis: "RCV", status: "ok" as const },
    { id: "equipment", label: "Equipment Breakdown", limit: "$10,000,000", deductible: "$25,000", basis: "ACV", status: "ok" as const },
  ];
  const si = { ok: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, warn: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, info: <Info className="w-3.5 h-3.5 text-[#0076BC]" /> };
  const conditions = [
    "Full ESFR sprinkler inspection report within 90 days of binding",
    "LA facility fire pump replaced or escrow established within 12 months",
    "Completed COPE data for all locations prior to binding",
    "Wind mitigation credits subject to independent verification",
  ];
  return (
    <div className="p-6 grid grid-cols-5 gap-5">
      <div className="col-span-2 bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E6E1] bg-[#F7F7F6]"><SectionLabel>Coverage Lines</SectionLabel></div>
        <div className="divide-y divide-[#F2F1EE]">
          {lines.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${selected === c.id ? "bg-[#EEF6FF] border-l-2 border-[#0076BC]" : "hover:bg-[#F7F7F6]"}`}>
              {si[c.status]}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#1A1A1A]">{c.label}</div>
                <div className="text-[11px] text-[#9B9B98]">{c.limit}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#D0CECC]" />
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-3 space-y-5">
        {selected && (() => {
          const c = lines.find(x => x.id === selected)!;
          return (
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#1A1A1A]">{c.label}</span>
                {si[c.status]}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[["Limit", c.limit], ["Deductible", c.deductible], ["Valuation", c.basis]].map(([l, v]) => (
                  <div key={l} className="bg-[#F7F7F6] rounded-lg p-3">
                    <div className="text-[10px] text-[#8E8C88] uppercase tracking-wider mb-1">{l}</div>
                    <div className="text-sm font-bold text-[#1A1A1A]">{v}</div>
                  </div>
                ))}
              </div>
              {c.id === "eq" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <strong>UW Note:</strong> EQ deductible of 5% TIV ($6.25M) may be insufficient given concentration. Consider 7.5% for CA locations. Validate against treaty reinsurance terms.
                </div>
              )}
              {c.id === "flood" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#0076BC]">
                  <strong>Note:</strong> Flood excluded per QBE CA appetite guidelines. All 12 locations outside FEMA Zone AE. Broker aware of exclusion.
                </div>
              )}
            </div>
          );
        })()}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Binding Conditions</SectionLabel>
          <div className="space-y-2 mt-3">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#5D5D5D]">{c}</span>
              </div>
            ))}
            <button className="flex items-center gap-2 text-xs text-[#0076BC] font-semibold hover:underline mt-1">
              <PlusCircle className="w-3.5 h-3.5" /> Add condition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UWDecisionTab({ decision, setDecision, conditionNotes, setConditionNotes }: {
  decision: "approve" | "refer" | "decline" | null;
  setDecision: (d: "approve" | "refer" | "decline" | null) => void;
  conditionNotes: string;
  setConditionNotes: (s: string) => void;
}) {
  const [rationale, setRationale] = useState("");
  const opts = [
    { id: "approve" as const, label: "Approve Risk Position", sub: "Advance to CAT modelling", icon: ThumbsUp, sel: "bg-emerald-600 text-white border-emerald-600" },
    { id: "refer" as const, label: "Refer to CAT Manager", sub: "Hold pending CAT review", icon: Flag, sel: "bg-amber-500 text-white border-amber-500" },
    { id: "decline" as const, label: "Decline Submission", sub: "Outside appetite or capacity", icon: ThumbsDown, sel: "bg-red-600 text-white border-red-600" },
  ];
  const checklist = [
    { label: "Appetite guideline review complete", done: true },
    { label: "CAT exposure assessment reviewed", done: true },
    { label: "Loss history independently verified", done: true },
    { label: "Coverage terms confirmed with broker", done: false },
    { label: "Reinsurance capacity confirmed", done: false },
    { label: "COPE data validated for all locations", done: false },
    { label: "Binding conditions documented", done: false },
  ];
  const completed = checklist.filter(c => c.done).length;
  return (
    <div className="p-6 grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Pre-Decision Checklist</SectionLabel>
            <span className="text-xs font-bold text-[#0076BC]">{completed}/{checklist.length} complete</span>
          </div>
          <ProgressBar value={completed} max={checklist.length} color="#0076BC" />
          <div className="space-y-2 mt-4">
            {checklist.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${c.done ? "bg-emerald-50" : "bg-[#F7F7F6]"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? "bg-emerald-500" : "border-2 border-[#D0CECC]"}`}>
                  {c.done && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-xs ${c.done ? "text-emerald-700 font-medium" : "text-[#5D5D5D]"}`}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Decision Rationale</SectionLabel>
          <textarea value={rationale} onChange={e => setRationale(e.target.value)}
            placeholder="Document your underwriting rationale, key risk drivers, and any deviations from standard guidelines…"
            className="w-full mt-3 px-4 py-3 bg-[#F7F7F6] border border-[#E8E6E1] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#B0AEA9] focus:outline-none focus:border-[#0076BC] resize-none transition-colors"
            rows={5} />
          <div className="mt-3">
            <SectionLabel>Conditions & Notes</SectionLabel>
            <textarea value={conditionNotes} onChange={e => setConditionNotes(e.target.value)}
              placeholder="List any special conditions, endorsements, or additional requirements…"
              className="w-full mt-2 px-4 py-3 bg-[#F7F7F6] border border-[#E8E6E1] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#B0AEA9] focus:outline-none focus:border-[#0076BC] resize-none transition-colors"
              rows={3} />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Underwriter Decision</SectionLabel>
          <div className="space-y-2.5 mt-4">
            {opts.map(opt => {
              const Icon = opt.icon;
              const isSel = decision === opt.id;
              return (
                <button key={opt.id} onClick={() => setDecision(isSel ? null : opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${isSel ? `${opt.sel} shadow-sm` : "bg-white border-[#E8E6E1] hover:border-[#D0CECC]"}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSel ? "text-white" : "text-[#8E8C88]"}`} />
                  <div className="flex-1">
                    <div className={`text-xs font-bold ${isSel ? "text-white" : "text-[#1A1A1A]"}`}>{opt.label}</div>
                    <div className={`text-[11px] ${isSel ? "text-white/80" : "text-[#9B9B98]"}`}>{opt.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {decision && (
          <div className={`rounded-xl p-4 border text-xs ${
            decision === "approve" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : decision === "refer" ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {decision === "approve" && "Approving will advance this submission to CAT modelling. Ensure all checklist items are complete."}
            {decision === "refer" && "Referring to CAT Manager will pause workflow pending their review and sign-off on coastal exposure."}
            {decision === "decline" && "Declining will notify the broker and archive the submission. This action is logged and cannot be reversed."}
          </div>
        )}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <SectionLabel>Authority Level</SectionLabel>
          <div className="space-y-2 mt-3">
            {[["UW Authority", "$50M limit", "green"], ["This Account", "$125M limit", "red"], ["Required Level", "Senior UW", "amber"]].map(([l, v, t]) => (
              <div key={l} className="flex justify-between items-center py-2 border-b border-[#F2F1EE]">
                <span className="text-xs text-[#8E8C88]">{l}</span>
                <span className={`text-xs font-bold ${t === "green" ? "text-emerald-600" : t === "red" ? "text-red-600" : "text-amber-600"}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-amber-700">Exceeds individual UW authority — requires Senior UW counter-signature.</span>
          </div>
        </div>
        <button disabled={!decision}
          className="w-full px-4 py-3 bg-[#00205B] text-white rounded-xl text-xs font-bold hover:bg-[#001740] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> Confirm Decision & Advance
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Modelling ────────────────────────────────────────────────────────

function ModellingStep({ submissionId }: { submissionId: string }) {
  const [model, setModel] = useState<"rms" | "verisk" | "blended">("blended");
  const results = {
    rms: { aal: "$1.24M", oep100: "$12.8M", oep250: "$18.2M", oep500: "$24.1M", tvar: "$21.5M" },
    verisk: { aal: "$1.18M", oep100: "$11.9M", oep250: "$17.4M", oep500: "$22.8M", tvar: "$20.1M" },
    blended: { aal: "$1.21M", oep100: "$12.4M", oep250: "$17.8M", oep500: "$23.5M", tvar: "$20.8M" },
  };
  const cur = results[model];
  const perils = [
    { name: "Earthquake", aal: "$680K", oep250: "$14.2M", pct: 56, color: "#E07010" },
    { name: "Fire / AOP", aal: "$320K", oep250: "$2.1M", pct: 26, color: "#F4A030" },
    { name: "Wildfire", aal: "$142K", oep250: "$1.2M", pct: 12, color: "#00205B" },
    { name: "Flood", aal: "$68K", oep250: "$0.3M", pct: 6, color: "#0090DC" },
  ];
  const zones = [
    { zone: "LA Metro", curr: "$1.42B", after: "$1.55B", limit: "$1.65B", util: 94 },
    { zone: "SF Bay Area", curr: "$1.15B", after: "$1.17B", limit: "$1.40B", util: 84 },
    { zone: "San Diego", curr: "$480M", after: "$522M", limit: "$800M", util: 65 },
  ];
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="CAT Modelling" summary="Blended model results returned. 250-yr EQ PML ($17.8M) is 14.2% of TIV — within acceptable range. LA Metro zone utilization reaches 94% post-add — flagged for accumulation review." actions={["Validate SOV geocoding", "Check LA Metro reinsurance headroom", "Confirm EQ deductible adequacy"]} />
      <div className="p-6 space-y-5">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Model Output</SectionLabel>
            <div className="flex items-center gap-1 bg-[#F7F7F6] rounded-lg p-1">
              {(["rms", "verisk", "blended"] as const).map(m => (
                <button key={m} onClick={() => setModel(m)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${model === m ? "bg-white shadow-sm text-[#0076BC]" : "text-[#8E8C88] hover:text-[#1A1A1A]"}`}>
                  {m === "blended" ? "Blended" : m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[["AAL", cur.aal, "Annual Aggregate Loss"], ["100-yr OEP", cur.oep100, "Occurrence EP"], ["250-yr OEP", cur.oep250, "Key pricing return"], ["500-yr OEP", cur.oep500, "Tail risk"], ["250-yr TVaR", cur.tvar, "Tail Value at Risk"]].map(([l, v, s]) => (
              <StatPill key={l} label={l} value={v} sub={s} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Loss by Peril</SectionLabel>
            <div className="space-y-4 mt-4">
              {perils.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-semibold text-[#1A1A1A]">{p.name}</div>
                  <div className="flex-1"><ProgressBar value={p.pct} color={p.color} /></div>
                  <div className="text-xs font-bold text-[#1A1A1A] w-14 text-right">{p.aal}</div>
                  <div className="text-[10px] text-[#9B9B98] w-14 text-right">{p.oep250}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Portfolio Marginal Impact</SectionLabel>
            <table className="w-full mt-3">
              <thead><tr className="border-b border-[#E8E6E1]">
                {["Zone", "Current", "After Add", "Limit", "Util."].map(h => (
                  <th key={h} className="pb-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8E8C88]">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F2F1EE]">
                {zones.map(z => (
                  <tr key={z.zone}>
                    <td className="py-2.5 text-xs font-semibold text-[#1A1A1A]">{z.zone}</td>
                    <td className="py-2.5 text-xs text-[#5D5D5D]">{z.curr}</td>
                    <td className="py-2.5 text-xs font-bold text-[#0076BC]">{z.after}</td>
                    <td className="py-2.5 text-xs text-[#5D5D5D]">{z.limit}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12"><ProgressBar value={z.util} color={z.util >= 90 ? "#EF4444" : z.util >= 75 ? "#F59E0B" : "#10B981"} /></div>
                        <span className={`text-xs font-bold ${z.util >= 90 ? "text-red-600" : z.util >= 75 ? "text-amber-600" : "text-emerald-600"}`}>{z.util}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-red-700">LA Metro reaches 94% zone utilization post-add. Reinsurance headroom check required before binding.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Rater ────────────────────────────────────────────────────────────

function RaterGeneratedStep({ submissionId }: { submissionId: string }) {
  const rows = [
    { label: "Base Rate (AOP)", value: "$189,500", basis: "$1.52/1000 TIV", mod: "" },
    { label: "Construction Credit", value: "($18,950)", basis: "−10% Non-Combustible", mod: "credit" },
    { label: "Protection Credit", value: "($28,425)", basis: "−15% Full sprinkler + central station", mod: "credit" },
    { label: "Loss History Credit", value: "($37,900)", basis: "−20% 5-yr LR 18%", mod: "credit" },
    { label: "CAT Load (EQ)", value: "$94,750", basis: "+50% CA EQ concentration", mod: "debit" },
    { label: "Wildfire Load", value: "$28,425", basis: "+15% WUI proximity (LA)", mod: "debit" },
    { label: "Terrorism (TRIA)", value: "$12,500", basis: "$0.10/1000 TIV", mod: "" },
    { label: "Engineering Fee", value: "$4,500", basis: "Per assessment", mod: "" },
  ];
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="Rating" summary="Technical rating complete. Loss cost base of $1.52/$1,000 TIV yields technical premium of $487.5K before fees. CAT load is the primary driver — EQ concentration adds 50% to base. Target final premium $512.9K after fees and TRIA." actions={["Validate CAT load methodology", "Confirm TRIA election with broker", "Review RoL vs cedant treaty"]} />
      <div className="p-6 grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#F7F7F6]"><SectionLabel>Premium Build-Up</SectionLabel></div>
          <table className="w-full">
            <thead><tr className="border-b border-[#E8E6E1] bg-[#F7F7F6]">
              {["Component", "Amount", "Basis", ""].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#8E8C88]">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-[#F2F1EE]">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-[#FAFAF9]">
                  <td className="px-5 py-3 text-xs font-medium text-[#1A1A1A]">{r.label}</td>
                  <td className={`px-5 py-3 text-xs font-bold tabular-nums ${r.mod === "credit" ? "text-emerald-600" : r.mod === "debit" ? "text-red-600" : "text-[#1A1A1A]"}`}>{r.value}</td>
                  <td className="px-5 py-3 text-xs text-[#8E8C88]">{r.basis}</td>
                  <td className="px-5 py-3">
                    {r.mod === "credit" && <Badge label="Credit" variant="green" />}
                    {r.mod === "debit" && <Badge label="Load" variant="red" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t-2 border-[#E8E6E1] bg-[#F7F7F6] space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-[#1A1A1A]">Technical Premium</span>
              <span className="text-sm font-bold text-[#1A1A1A] tabular-nums">$487,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8E8C88]">+ Broker Commission (12%)</span>
              <span className="text-xs text-[#5D5D5D] tabular-nums">$58,500</span>
            </div>
            <div className="flex justify-between border-t border-[#E8E6E1] pt-2">
              <span className="text-sm font-bold text-[#00205B]">Quoted Premium</span>
              <span className="text-lg font-bold text-[#00205B] tabular-nums">$512,900</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Rate on Line</SectionLabel>
            <div className="space-y-3 mt-3">
              {[["Technical RoL", "0.39%", "default"], ["Market RoL", "0.38–0.42%", "default"], ["Position", "Within range", "green"]].map(([l, v, t]) => (
                <div key={l} className="flex justify-between items-center py-2 border-b border-[#F2F1EE]">
                  <span className="text-xs text-[#8E8C88]">{l}</span>
                  <span className={`text-xs font-bold ${t === "green" ? "text-emerald-600" : "text-[#1A1A1A]"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Pricing Validation</SectionLabel>
            <div className="space-y-2 mt-3">
              <RuleRow label="Above technical minimum" status="pass" detail="$512.9K > $487.5K tech" />
              <RuleRow label="Within market range" status="pass" detail="RoL 0.39% · Market 0.38–0.42%" />
              <RuleRow label="CAT load justified" status="warn" detail="50% load — above peer average 38%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 7: Quote Ready ──────────────────────────────────────────────────────

function QuoteReadyStep({ submissionId }: { submissionId: string }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="flex-1 overflow-auto">
      <AIBand stepLabel="Quote Ready" summary="All underwriting steps complete. Technical premium validated at $512.9K. Quote letter and coverage schedule ready for generation. Recommend sending within 24 hours to maintain SLA compliance." actions={["Log in Salesforce"]} />
      <div className="p-6 grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Quote Summary</SectionLabel>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0 mt-3">
              {[
                ["Named Insured", "Westfield Manufacturing Corp"],
                ["Effective Date", "May 1, 2026"],
                ["Expiration Date", "May 1, 2027"],
                ["Quoted Premium", "$512,900"],
                ["Total TIV", "$125,000,000"],
                ["Primary Layer", "$125M xs $0"],
                ["Reinsurance Layer", "$75M xs $50M (FACS)"],
                ["Quote Valid Until", "May 15, 2026"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-[#F2F1EE]">
                  <span className="text-xs text-[#8E8C88]">{l}</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Quote Documents</SectionLabel>
            <div className="space-y-2 mt-3">
              {[
                { name: "Quote Letter — Westfield Manufacturing.pdf", ready: true },
                { name: "Coverage Schedule.pdf", ready: true },
                { name: "Terms & Conditions.pdf", ready: true },
                { name: "Specimen Policy.pdf", ready: true },
              ].map(d => (
                <div key={d.name} className="flex items-center gap-3 p-3 bg-[#F7F7F6] rounded-lg">
                  <FileText className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium text-[#1A1A1A]">{d.name}</span>
                  <Badge label="Ready" variant="green" />
                  <button className="px-3 py-1 bg-white border border-[#E8E6E1] rounded-lg text-[10px] font-semibold text-[#0076BC] hover:bg-[#EEF6FF] transition-colors">
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Broker Contact</SectionLabel>
            <div className="mt-3">
              <div className="p-3 bg-[#F7F7F6] rounded-lg">
                <div className="text-xs font-semibold text-[#1A1A1A]">Sarah Chen</div>
                <div className="text-[11px] text-[#9B9B98]">schen@marsh.com · Marsh & McLennan</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
            <SectionLabel>Approval Chain</SectionLabel>
            <div className="space-y-2 mt-3">
              {[
                { name: "Mike Farrell", role: "Underwriter", status: "approved" },
                { name: "Jennifer Park", role: "Senior UW", status: "pending" },
                { name: "David Lee", role: "UW Manager", status: "not-started" },
              ].map(a => (
                <div key={a.name} className="flex items-center gap-3 p-2.5 bg-[#F7F7F6] rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${a.status === "approved" ? "bg-emerald-500" : a.status === "pending" ? "bg-amber-500" : "bg-[#D0CECC]"}`}>
                    {a.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#1A1A1A]">{a.name}</div>
                    <div className="text-[10px] text-[#9B9B98]">{a.role}</div>
                  </div>
                  <Badge label={a.status === "approved" ? "Approved" : a.status === "pending" ? "Pending" : "Waiting"} variant={a.status === "approved" ? "green" : a.status === "pending" ? "amber" : "gray"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E1] bg-[#F7F7F6]">
              <div className="text-sm font-bold text-[#1A1A1A]">Quote Letter Preview</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-white border border-[#E8E6E1] rounded-lg text-xs font-medium text-[#5D5D5D] hover:bg-[#F7F7F6] flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button className="px-3 py-1.5 bg-white border border-[#E8E6E1] rounded-lg text-xs font-medium text-[#5D5D5D] hover:bg-[#F7F7F6] flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={() => setPreview(false)} className="p-1.5 rounded-lg hover:bg-[#EEEDEB] text-[#8E8C88]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 text-sm leading-relaxed space-y-4">
              <div className="text-right text-xs text-[#8E8C88]">April 10, 2026</div>
              <div className="text-xs text-[#5D5D5D]">Sarah Chen<br />Marsh & McLennan<br />schen@marsh.com</div>
              <div className="font-bold text-[#1A1A1A] text-sm">Re: Westfield Manufacturing Corp — Commercial Property Quote<br />Policy Period: May 1, 2026 – May 1, 2027</div>
              <p className="text-xs text-[#5D5D5D]">Dear Ms. Chen,</p>
              <p className="text-xs text-[#5D5D5D]">We are pleased to provide the following quote for commercial property coverage for Westfield Manufacturing Corp, subject to the terms and conditions outlined herein.</p>
              <div className="border border-[#E8E6E1] rounded-lg p-4 bg-[#F7F7F6] space-y-2">
                <div className="font-bold text-xs text-[#1A1A1A] mb-2 uppercase tracking-wider">Coverage Summary</div>
                {[["Named Insured", "Westfield Manufacturing Corp"], ["Coverage", "Commercial Property — All Risk"], ["Total Insured Value", "$125,000,000"], ["Annual Premium", "$512,900"], ["Deductible", "$100,000 AOP / 5% EQ"], ["Effective Date", "May 1, 2026"]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-[#8E8C88]">{l}</span>
                    <span className="font-semibold text-[#1A1A1A]">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#5D5D5D]">This quote is valid through May 15, 2026 and is subject to satisfactory completion of all binding conditions including ESFR sprinkler verification and COPE data submission.</p>
              <p className="text-xs text-[#5D5D5D]">Please do not hesitate to contact me with any questions.</p>
              <p className="text-xs text-[#5D5D5D]">Sincerely,<br /><strong>Mike Farrell</strong><br />Underwriter, Commercial Property<br />QBE North America</p>
            </div>
            <div className="px-6 py-4 border-t border-[#E8E6E1] flex justify-end gap-3">
              <button onClick={() => setPreview(false)} className="px-4 py-2 border border-[#E8E6E1] rounded-lg text-xs font-semibold text-[#5D5D5D] hover:bg-[#F7F7F6]">Close</button>
              <button className="px-4 py-2 bg-[#0076BC] text-white rounded-lg text-xs font-bold hover:bg-[#005F99] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Open in Outlook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple placeholder steps ─────────────────────────────────────────────────

function SimpleStep({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-[#EEF6FF] flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-[#0076BC]" />
        </div>
        <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{title}</h3>
        <p className="text-sm text-[#8E8C88]">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SubmissionWorkflow({ submissionId }: SubmissionWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(4);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <IngestedStep submissionId={submissionId} />;
      case 2: return <ProcessedStep submissionId={submissionId} />;
      case 3: return <TriagedStep submissionId={submissionId} />;
      case 4: return <UWAnalysisStep submissionId={submissionId} />;
      case 5: return <ModellingStep submissionId={submissionId} />;
      case 6: return <RaterGeneratedStep submissionId={submissionId} />;
      case 7: return <QuoteReadyStep submissionId={submissionId} />;
      case 8: return <SimpleStep title="Quoted" desc="Quote sent to broker. Awaiting broker response and customer acceptance." />;
      case 9: return <SimpleStep title="Form & Manuscript" desc="Policy manuscript generation in progress. Custom endorsements and bespoke language under review." />;
      case 10: return <SimpleStep title="Book" desc="Submission ready for binding. Awaiting broker bind order confirmation." />;
      case 11: return <SimpleStep title="Bind" desc="Bind order received. Policy binding in progress." />;
      case 12: return <SimpleStep title="Issue" desc="Policy issued. All documents dispatched to broker and insured." />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#F4F3F1]">
      <WorkflowSidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AccountBar submissionId={submissionId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

