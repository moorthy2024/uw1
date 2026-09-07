/**
 * Transforms raw backend submission API response → UI types.
 *
 * Fields available in the API are mapped directly.
 * Fields NOT yet in the API are marked with STATIC so the UI can display
 * them as "[Static Data]" in grey brackets.
 */

import type { SubmissionMeta, SubmissionExtras, DocItem } from "@/components/SubmissionTypes";
import type { SubmissionIndexEntry, SubmissionCard, ProcessingStatus, WorkflowStatus, DataStatus, IndustryClass } from "@/components/CustomerTable";
import type { SubmissionRecord } from "@/components/submission-analysis/useSubmission";
import { DEFAULT_EXTRAS } from "@/components/submission-analysis/mock-data";

// ── Sentinel value for fields not yet provided by the API ──────────────────
export const STATIC = "[Static Data]";

// ── Raw API shape (submission list item and single submission) ─────────────
export interface ApiSubmission {
  id: string;
  submission_id: string;
  broker_id: string | null;
  broker_name: string | null;
  insured_id: string | null;
  insured_name: string | null;
  acord_ref: string | null;
  lob_code: string | null;
  lob_name: string | null;
  status: string;
  received_at: string | null;
  last_received_at: string | null;
  last_updated_at: string | null;
  assigned_uw_id: string | null;
  assigned_uw_name: string | null;
  policy_start: string | null;
  total_tiv: number | null;
  loc_count: number | null;
  limit_structure: string | null;
  version: number | null;
  email_id: string | null;
  last_email_id: string | null;
  email_count: number | null;
  subject: string | null;
  from_address: string | null;
  workflow_stage: string | null;
  ingestion: {
    status: string | null;
    started_at: string | null;
    completed_at: string | null;
  } | null;
  triage: {
    status: string | null;
    assigned_uw_id: string | null;
    assigned_uw_name: string | null;
    clearance_status: string | null;
    ofac_status: string | null;
  } | null;
  documents_received: {
    application: boolean;
    sov: boolean;
    loss_run: boolean;
    engineering_report: boolean;
    coverage_request: boolean;
    prior_policy: boolean;
    // legacy field names — kept for backwards compat during API transition
    primary_policy?: boolean;
    loss_history?: boolean;
    risk_engineering_report?: boolean;
    statement_of_values?: boolean;
  } | null;
  enrichment: {
    appetite: string | null;
    ofac_status: string | null;
    ofac_checked_at: string | null;
    salesforce_opportunity_id: string | null;
    salesforce_stage: string | null;
    salesforce_type: string | null;
    salesforce_last_synced_at: string | null;
    majesco_policy_ref: string | null;
    workday_cost_centre: string | null;
  } | null;
}

// ── Pagination meta from list API ──────────────────────────────────────────
export interface ApiSubmissionListMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiSubmissionListResponse {
  items: ApiSubmission[];
  meta: ApiSubmissionListMeta;
}

// ── Status mapping: API string → UI ProcessingStatus ──────────────────────
function mapStatus(apiStatus: string | null): ProcessingStatus {
  const map: Record<string, ProcessingStatus> = {
    "new":                    "not-processed",
    "received":               "not-processed",
    "submission created":     "not-processed",
    "follow_up":              "follow-up-required",
    "follow-up-required":     "follow-up-required",
    "ready_ops":              "ready-for-ops",
    "ready_for_ops":          "ready-for-ops",
    "ops_ready":              "ready-for-ops",
    "ready_uw":               "ready-for-uw",
    "ready_for_uw":           "ready-for-uw",
    "uw_analysis":            "uw-analysis",
    "in_analysis":            "uw-analysis",
    "uw_review":              "uw-review",
    "in_review":              "uw-review",
    "customer_decision":      "customer-decision",
    "decision":               "customer-decision",
    "bound":                  "customer-decision",
  };
  return map[apiStatus?.toLowerCase() ?? ""] ?? "not-processed";
}

// ── Derive individual workflow dot states from overall status ──────────────
function workflowFromStatus(ps: ProcessingStatus): {
  ingested: WorkflowStatus; processed: WorkflowStatus; triaged: WorkflowStatus;
  uwAnalysis: WorkflowStatus; modellingReady: WorkflowStatus; raterGenerated: WorkflowStatus;
  quoteReady: WorkflowStatus; quoted: WorkflowStatus; formManuscript: WorkflowStatus;
  bind: WorkflowStatus; issue: WorkflowStatus;
} {
  const C: WorkflowStatus = "complete";
  const IP: WorkflowStatus = "in-progress";
  const P: WorkflowStatus = "pending";
  const NS: WorkflowStatus = "not-started";

  switch (ps) {
    case "not-processed":
      return { ingested: P, processed: NS, triaged: NS, uwAnalysis: NS, modellingReady: NS, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
    case "follow-up-required":
      return { ingested: IP, processed: NS, triaged: NS, uwAnalysis: NS, modellingReady: NS, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
    case "ready-for-ops":
      return { ingested: C, processed: IP, triaged: NS, uwAnalysis: NS, modellingReady: NS, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
    case "ready-for-uw":
      return { ingested: C, processed: C, triaged: P, uwAnalysis: NS, modellingReady: NS, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
    case "uw-analysis":
      return { ingested: C, processed: C, triaged: C, uwAnalysis: IP, modellingReady: P, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
    case "uw-review":
      return { ingested: C, processed: C, triaged: C, uwAnalysis: C, modellingReady: C, raterGenerated: C, quoteReady: C, quoted: C, formManuscript: IP, bind: NS, issue: NS };
    case "customer-decision":
      return { ingested: C, processed: C, triaged: C, uwAnalysis: C, modellingReady: C, raterGenerated: C, quoteReady: C, quoted: C, formManuscript: C, bind: IP, issue: NS };
    default:
      return { ingested: NS, processed: NS, triaged: NS, uwAnalysis: NS, modellingReady: NS, raterGenerated: NS, quoteReady: NS, quoted: NS, formManuscript: NS, bind: NS, issue: NS };
  }
}

// ── Appetite → IndustryClass ───────────────────────────────────────────────
function mapAppetite(appetite: string | null): IndustryClass {
  const map: Record<string, IndustryClass> = {
    "clear":         "in-scope",
    "in_scope":      "in-scope",
    "in-scope":      "in-scope",
    "limited":       "limited",
    "out_of_scope":  "out-of-scope",
    "out-of-scope":  "out-of-scope",
    "decline":       "out-of-scope",
    "declined":      "out-of-scope",
  };
  return map[appetite?.toLowerCase() ?? ""] ?? "in-scope";
}

// ── OFAC status → clearance ────────────────────────────────────────────────
function mapOfac(ofacStatus: string | null): "complete" | "in-progress" {
  return ofacStatus?.toLowerCase() === "clear" ? "complete" : "in-progress";
}

// ── Salesforce type → submission type ─────────────────────────────────────
function mapSalesforceType(type: string | null): "New Business" | "Renewal" | "Remarket" {
  const map: Record<string, "New Business" | "Renewal" | "Remarket"> = {
    "new_business":  "New Business",
    "new business":  "New Business",
    "new":           "New Business",
    "renewal":       "Renewal",
    "remarket":      "Remarket",
  };
  return map[type?.toLowerCase() ?? ""] ?? "New Business";
}

// ── ingestion.status → row disable + label ────────────────────────────────
export function mapIngestionStatus(status: string | null): { label: string; disabled: boolean } {
  switch (status) {
    case "correlated":       return { label: "Processing email…",  disabled: true };
    case "docs_tagged":      return { label: "Tagging documents…", disabled: true };
    case "indexed":          return { label: "Extracting fields…", disabled: true };
    case "complete":         return { label: "Ready for Review",   disabled: false };
    default:                 return { label: "Processing…",        disabled: false };
  }
}

// ── documents_received → DataStatus ───────────────────────────────────────
function deriveDataStatus(docs: ApiSubmission["documents_received"]): DataStatus {
  if (!docs) return "Received";
  const coreVals = [docs.application, docs.sov ?? docs.statement_of_values, docs.loss_run ?? docs.loss_history, docs.engineering_report ?? docs.risk_engineering_report, docs.coverage_request, docs.prior_policy ?? docs.primary_policy];
  const receivedCount = coreVals.filter(Boolean).length;
  if (receivedCount === 0) return "Received";
  if (receivedCount === coreVals.length) return "Ready";
  return "Processing";
}

// ── documents_received → DocItem[] ────────────────────────────────────────
function deriveDocItems(docs: ApiSubmission["documents_received"]): DocItem[] {
  type DocEntry = { key: string; name: string; legacyKey?: string };
  const DOC_MAP: DocEntry[] = [
    { key: "application",        name: "Application" },
    { key: "sov",                name: "Statement of Values",     legacyKey: "statement_of_values" },
    { key: "loss_run",           name: "Loss History",            legacyKey: "loss_history" },
    { key: "engineering_report", name: "Risk Engineering Report", legacyKey: "risk_engineering_report" },
    { key: "coverage_request",   name: "Coverage Request" },
    { key: "prior_policy",       name: "Primary Policy",          legacyKey: "primary_policy" },
  ];

  return DOC_MAP.map(({ key, name, legacyKey }) => {
    const d = docs as Record<string, boolean> | null;
    const received = d ? (d[key] ?? (legacyKey ? d[legacyKey] : false)) === true : false;
    return { name, received, needsReview: false };
  });
}

// ── Format TIV ────────────────────────────────────────────────────────────
function formatTiv(total_tiv: number | null): { tiv: string; tivFull: string } {
  if (!total_tiv) return { tiv: "-", tivFull: "-" };
  const m = total_tiv / 1_000_000;
  const tiv = m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.round(m)}M`;
  const tivFull = `$${total_tiv.toLocaleString()}`;
  return { tiv, tivFull };
}

// ── Format date ────────────────────────────────────────────────────────────
// Raw ISO date (YYYY-MM-DD) for table cells — cell component does display formatting
function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return iso.split("T")[0]; // "2026-09-06"
}

// Human-readable date for Account Overview / detail panel fields
function formatDateDisplay(iso: string | null): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "-";
  }
}

// ── Main transformer: API → SubmissionRecord ───────────────────────────────
export function transformSubmissionToRecord(api: ApiSubmission): SubmissionRecord {
  const processingStatus = mapStatus(api.status);
  const { tiv, tivFull } = formatTiv(api.total_tiv);
  const enrichment = api.enrichment;

  console.group(`[transformer] transformSubmissionToRecord — ${api.insured_name ?? api.id}`);
  console.log("[transformer] Raw API status:", api.status, "→ UI processingStatus:", processingStatus);
  console.log("[transformer] TIV:", api.total_tiv, "→", tivFull);
  console.log("[transformer] Appetite:", enrichment?.appetite, "→", mapAppetite(enrichment?.appetite ?? null));
  console.log("[transformer] OFAC:", enrichment?.ofac_status, "→ clearance:", mapOfac(enrichment?.ofac_status ?? null));
  console.log("[transformer] Salesforce type:", enrichment?.salesforce_type, "→ submissionType:", mapSalesforceType(enrichment?.salesforce_type ?? null));
  console.log("[transformer] documents_received:", api.documents_received, "→ dataStatus:", deriveDataStatus(api.documents_received));
  console.log("[transformer] Static fields (not in API):", [
    "brokerageHouse", "naics", "industry", "territory", "summary",
    "hazardScore", "aiPriorityScore", "successPropensity", "processingPattern",
    "occupancyByTIV", "sprinkleredPct", "paidClaims5yr",
  ]);
  console.groupEnd();

  const meta: SubmissionMeta = {
    id:             api.submission_id ?? api.id,
    accountName:    api.insured_name ?? "-",
    namedInsured:   api.insured_name ?? "-",
    broker:         api.broker_name ?? "-",
    brokerageHouse: STATIC,                           // not in API
    type:           mapSalesforceType(enrichment?.salesforce_type ?? null),
    coverageType:   api.lob_name ?? api.lob_code ?? "-",
    tiv,
    tivFull,
    territory:      STATIC,                           // not in API
    locations:      api.loc_count != null ? `${api.loc_count} location${api.loc_count !== 1 ? "s" : ""}` : "-",
    inceptionDate:  formatDateDisplay(api.policy_start),
    submissionDate: formatDateDisplay(api.received_at),
    naics:          STATIC,                           // not in API
    industry:       STATIC,                           // not in API
    summary:        STATIC,                           // not in API
  };

  const indexEntry: SubmissionIndexEntry = {
    processingStatus,
    clearance:               mapOfac(enrichment?.ofac_status ?? null),
    industryClassification:  mapAppetite(enrichment?.appetite ?? null),
    assignedUW:              api.assigned_uw_name ?? "-",
    inceptionDate:           formatDate(api.policy_start),
    // ── Static fields — not yet in API ────────────────────────────────────
    occupancyByTIV:          [],
    hazardScore:             0,
    hazardGrade:             "A",
    totalTIVm:               api.total_tiv ? api.total_tiv / 1_000_000 : 0,
    topConstructionClass:    STATIC,
    constructionClassPct:    0,
    sprinkleredPct:          0,
    successPropensity:       0,
    successPropensityDrivers: STATIC,
    homeOffice:              STATIC,
    accountIndustry:         STATIC,
    brokerBoundRate:         0,
    brokerTrend:             "flat",
    aiPriorityScore:         0,
    processingPattern:       "Low Touch",
    needByDate:              STATIC,
  };

  // Extras: keep SOV/Loss History from DEFAULT_EXTRAS; reset policyDetails to blank
  // so Account Overview shows "-" instead of mock values.
  // Extraction API will supplement policyDetails fields where available.
  const extras: SubmissionExtras = {
    ...DEFAULT_EXTRAS,
    documents: deriveDocItems(api.documents_received),
    policyDetails: {
      policyNumber:       "-",
      expirationDate:     "-",
      commission:         "-",
      generalHazardLevel: "-",
      aopDeductible:      "-",
      buildingLimit:      "-",
      contentsLimit:      "-",
      businessLimit:      "-",
      equipmentBreakdown: false,
      certifiedTerrorism: false,
    },
  };

  return { meta, extras, indexEntry };
}

// ── Extraction API types ───────────────────────────────────────────────────
export interface ApiExtractionField {
  field_name: string;
  field_value: string | number | null;
  confidence_score: number;
  chunk_number: number | null;
  chunk: string | null;
  is_verified: boolean;
}

export interface ApiExtractionDocument {
  name: string;
  url: string;
  tags: string[];
  doc_type: string;
  fields: ApiExtractionField[];
}

export interface ApiExtractionRecord {
  id: string;
  submission_id: string;
  created_at: string;
  extracted_at: string;
  updated_at: string;
  Extracted_fields: Array<{ document: ApiExtractionDocument }>;
  source_document_count: number;
  source_chunk_count: number;
}

export interface ExtractionValueEntry {
  value: string;
  confidence: number;
  docRef?: {
    doc: string;
    page: number;
    docUrl: string;
    excerpt: string;
    highlightLabel: string;
    docType: string;
  };
}

// ── Build a field-name → value lookup from the extraction API response ─────
export function buildExtractionValueMap(
  extractionResponse: ApiExtractionRecord[]
): Record<string, ExtractionValueEntry> {
  const map: Record<string, ExtractionValueEntry> = {};
  if (!Array.isArray(extractionResponse)) return map;

  for (const record of extractionResponse) {
    for (const entry of record.Extracted_fields ?? []) {
      const doc = entry.document;
      const docName = doc.tags?.[0] ?? doc.name ?? "Document";
      const docUrl  = doc.url ?? "";
      const docType = doc.doc_type ?? "html";

      for (const field of doc.fields ?? []) {
        const value = field.field_value != null ? String(field.field_value) : "";
        map[field.field_name] = {
          value,
          confidence: Math.round((field.confidence_score ?? 0) * 100),
          ...(field.chunk
            ? {
                docRef: {
                  doc:            docName,
                  page:           field.chunk_number ?? 1,
                  docUrl,
                  excerpt:        field.chunk,
                  highlightLabel: field.field_name,
                  docType,
                },
              }
            : {}),
        };
      }
    }
  }

  console.log(
    "[buildExtractionValueMap] Fields mapped:",
    Object.entries(map)
      .filter(([, v]) => v.value !== "")
      .map(([k, v]) => `${k}: "${v.value}" (${v.confidence}%)`)
  );

  return map;
}

// ── Transform API list item → SubmissionCard (for the table) ──────────────
export function transformSubmissionToCard(api: ApiSubmission): SubmissionCard {
  const processingStatus = mapStatus(api.status);
  const workflow = workflowFromStatus(processingStatus);
  const { tivFull } = formatTiv(api.total_tiv);
  const enrichment = api.enrichment;
  const ingestion = mapIngestionStatus(api.ingestion?.status ?? null);

  console.log("[transformer] transformSubmissionToCard", api.insured_name ?? api.id, {
    status: processingStatus,
    ingestionStatus: api.ingestion?.status,
    ingestionDisabled: ingestion.disabled,
    tiv: tivFull,
    broker: api.broker_name,
    assignedUW: api.assigned_uw_name,
  });

  return {
    id:                     api.id,
    account:                api.insured_name ?? "-",
    homeOffice:             "-",
    accountIndustry:        "-",
    industryClassification: mapAppetite(enrichment?.appetite ?? null),
    broker:                 api.broker_name ?? "-",
    brokerContact:          "-",
    brokerBoundRate:        0,
    submissionType:         mapSalesforceType(enrichment?.salesforce_type ?? null),
    processingStatus,
    receivedDate:           formatDate(api.received_at),
    needByDate:             "-",
    inceptionDate:          formatDate(api.policy_start),
    hazardScore:            0,
    hazardGrade:            "A",
    totalTIVm:              api.total_tiv ? api.total_tiv / 1_000_000 : 0,
    topConstructionClass:   "-",
    constructionClassPct:   0,
    sprinkleredPct:         0,
    successPropensity:      0,
    successPropensityDrivers: "-",
    occupancyByTIV:         [],
    assignedUW:             api.assigned_uw_name ?? "-",
    aiPriorityScore:        0,
    clearance:              mapOfac(enrichment?.ofac_status ?? null),
    dataStatus:             deriveDataStatus(api.documents_received),
    occupancyAppetite:      [],
    constructionAppetite:   [],
    paidClaims5yr:          "-",
    ingestionStatus:        ingestion.label,
    ingestionDisabled:      ingestion.disabled,
    ...workflow,
  };
}
