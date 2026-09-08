"use client";
import { useState, useEffect } from "react";
import type { SubmissionMeta, SubmissionExtras } from "./types";
import type { CatalogField } from "./types";
import type { SubmissionIndexEntry } from "../CustomerTable";
import { submissionData, DEFAULT_EXTRAS, submissionExtras, buildFieldCatalog, FIELD_CATALOG } from "./mock-data";
import { SUBMISSION_INDEX } from "../CustomerTable";
import {
  transformSubmissionToRecord,
  buildExtractionValueMap,
  type ApiExtractionRecord,
  type ExtractionValueEntry,
} from "@/lib/submissionTransformer";

export interface SubmissionRecord {
  meta: SubmissionMeta;
  extras: SubmissionExtras;
  indexEntry?: SubmissionIndexEntry; // Present for real API submissions; absent for mock
}

export function useSubmission(submissionId: string | undefined): {
  data: SubmissionRecord | null;
  isLoading: boolean;
  error: string | null;
} {
  // Initialise from mock data synchronously — so known mock IDs render instantly
  const [data, setData] = useState<SubmissionRecord | null>(() => {
    if (!submissionId) return null;
    const meta = submissionData[submissionId] ?? null;
    if (!meta) return null;
    const extras: SubmissionExtras = { ...DEFAULT_EXTRAS, ...submissionExtras[submissionId] };
    return { meta, extras };
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only show loading spinner for IDs not in the mock set
    if (!submissionId) return false;
    return !submissionData[submissionId];
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Mock submission — already set synchronously above, nothing to fetch
    if (submissionData[submissionId]) {
      console.log(`[useSubmission] Mock data used for ${submissionId}`);
      return;
    }

    // Real API submission — fetch from backend via proxy route
    console.group(`[useSubmission] Fetching real API submission — id: ${submissionId}`);
    setIsLoading(true);
    setError(null);

    // Fetch submission and extraction in parallel
    Promise.all([
      fetch(`/api/submissions/${submissionId}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      }),
      fetch(`/api/submissions/${submissionId}/extractions`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([apiData, extractionData]) => {
        console.log("[useSubmission] Submission API response:", apiData);

        let record = transformSubmissionToRecord(apiData);

        console.log("[useSubmission] Transformed SubmissionRecord (before extraction supplement):", {
          accountName:   record.meta.accountName,
          broker:        record.meta.broker,
          tivFull:       record.meta.tivFull,
          inceptionDate: record.meta.inceptionDate,
          submissionDate:record.meta.submissionDate,
          coverageType:  record.meta.coverageType,
          locations:     record.meta.locations,
        });

        if (extractionData && Array.isArray(extractionData) && extractionData.length > 0) {
          const valueMap = buildExtractionValueMap(extractionData);
          record = supplementRecordFromExtraction(record, valueMap);
          console.log("[useSubmission] Extraction supplemented Account Overview:", {
            broker:            record.meta.broker,
            inceptionDate:     record.meta.inceptionDate,
            tivFull:           record.meta.tivFull,
            expirationDate:    record.extras.policyDetails.expirationDate,
            commission:        record.extras.policyDetails.commission,
            aopDeductible:     record.extras.policyDetails.aopDeductible,
          });
        } else {
          console.log("[useSubmission] No extraction data — policyDetails remain blank");
        }

        console.log("[useSubmission] Final IndexEntry:", record.indexEntry);
        console.groupEnd();

        setData(record);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error("[useSubmission] Fetch error:", err.message);
        console.groupEnd();
        setError(err.message);
        setIsLoading(false);
      });
  }, [submissionId]);

  return { data, isLoading, error };
}

export function useSubmissionMeta(id: string | undefined) {
  const { data, isLoading, error } = useSubmission(id);
  return { data: data?.meta ?? null, isLoading, error };
}

export function useSubmissionExtras(id: string | undefined) {
  const { data, isLoading, error } = useSubmission(id);
  return { data: data?.extras ?? null, isLoading, error };
}

export function useSubmissionSOV(id: string | undefined) {
  const { data, isLoading, error } = useSubmission(id);
  return { data: data?.extras?.sov ?? null, isLoading, error };
}

export function useSubmissionLossHistory(id: string | undefined) {
  const { data, isLoading, error } = useSubmission(id);
  return { data: data?.extras?.lossHistory ?? null, isLoading, error };
}

// ── Supplement Account Overview meta/policyDetails from extraction values ────
function formatExtractionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function supplementRecordFromExtraction(
  record: SubmissionRecord,
  valueMap: Record<string, ExtractionValueEntry>
): SubmissionRecord {
  const meta    = { ...record.meta };
  const pd      = { ...record.extras.policyDetails };
  const extras  = { ...record.extras, policyDetails: pd };

  const get = (key: string) => valueMap[key]?.value ?? "";

  // Supplement meta — only fill where currently "-"
  const brokerFirm = get("Broker Firm Name");
  if (brokerFirm && meta.broker === "-") meta.broker = brokerFirm;

  const effectiveDate = get("Effective Date");
  if (effectiveDate && meta.inceptionDate === "-") meta.inceptionDate = formatExtractionDate(effectiveDate);

  const totalLimit = get("Total Program Limit ($)");
  if (totalLimit && meta.tiv === "-") {
    const num = parseFloat(totalLimit.replace(/[^0-9.]/g, ""));
    if (!isNaN(num)) {
      const m = num / 1_000_000;
      meta.tiv     = m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.round(m)}M`;
      meta.tivFull = `$${num.toLocaleString()}`;
    }
  }

  // Supplement policyDetails from extraction
  const expiryDate = get("Expiry Date");
  if (expiryDate) pd.expirationDate = formatExtractionDate(expiryDate);

  const commission = get("Proposed Commission (%)");
  if (commission) pd.commission = commission.includes("%") ? commission : `${commission}%`;

  const aopDeductible = get("AOP Deductible ($)");
  if (aopDeductible) {
    const num = parseFloat(aopDeductible.replace(/[^0-9.]/g, ""));
    pd.aopDeductible = !isNaN(num) ? `$${num.toLocaleString()}` : aopDeductible;
  }

  return { ...record, meta, extras };
}

// ── Per-step API hooks ───────────────────────────────────────────────────────

export interface DefaultPreview {
  docUrl: string;
  docType: string;
  docName: string;
}

export function useIngestionFields(submissionId: string | undefined): {
  fields: CatalogField[] | null;
  isLoading: boolean;
  error: string | null;
  defaultPreview: DefaultPreview | null;
} {
  const { data: submissionRecord } = useSubmission(submissionId);
  const [fields, setFields]           = useState<CatalogField[] | null>(null);
  // Start as true for real API submissions so the spinner shows on first render
  const [isLoading, setIsLoading]     = useState<boolean>(() =>
    !!submissionId && !(submissionId in submissionData)
  );
  const [error, setError]             = useState<string | null>(null);
  const [defaultPreview, setDefaultPreview] = useState<DefaultPreview | null>(null);

  useEffect(() => {
    if (!submissionId || !submissionRecord) { setFields(null); return; }

    // idx: mock submissions → SUBMISSION_INDEX; API submissions → indexEntry
    const idx = SUBMISSION_INDEX[submissionId] ?? submissionRecord.indexEntry;
    const isMock = submissionId in submissionData;

    if (isMock && idx) {
      // Mock submission — use buildFieldCatalog with full mock data
      const f = buildFieldCatalog(submissionRecord.meta, idx, submissionRecord.extras);
      setFields(f);
      return;
    }

    if (!idx) { setFields(null); return; }

    // Real API submission — fetch extraction and overlay values onto catalog schema
    setIsLoading(true);
    setError(null);

    console.group(`[useIngestionFields] Fetching extraction — submission: ${submissionId}`);

    fetch(`/api/submissions/${submissionId}/extractions`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiExtractionRecord[]>;
      })
      .then(extractionData => {
        console.log("[useIngestionFields] Raw extraction response:", extractionData);

        const valueMap = buildExtractionValueMap(extractionData);
        const withValues = Object.values(valueMap).filter(v => v.value !== "");
        console.log(`[useIngestionFields] Value map: ${Object.keys(valueMap).length} fields, ${withValues.length} with extracted values`);
        console.log("[useIngestionFields] Extracted values:", withValues.map(v => `${Object.entries(valueMap).find(([,val]) => val === v)?.[0]}: "${v.value}"`));

        // Extract default preview from the first document in the extraction response
        const firstDoc = extractionData[0]?.Extracted_fields?.[0]?.document;
        if (firstDoc?.url) {
          const docName = firstDoc.tags?.[0] ?? firstDoc.name ?? "Email";
          const docType = firstDoc.doc_type ?? "html";
          console.log("[useIngestionFields] Default preview doc:", docName, docType, firstDoc.url.slice(0, 60));
          setDefaultPreview({ docUrl: firstDoc.url, docType, docName });
        }

        // Catalog lookup for domain/subEntity grouping (case-insensitive)
        const catalogLookup = new Map(FIELD_CATALOG.map(e => [e.label.toLowerCase(), e]));
        const catalogOrder  = new Map(FIELD_CATALOG.map((e, i) => [e.label.toLowerCase(), i]));

        // Build one CatalogField per field in the API response — all 46, including empty ones.
        // Fields not found in the catalog fall back to "Application / Other".
        const merged: CatalogField[] = Object.entries(valueMap)
          .map(([label, entry]) => {
            const cat = catalogLookup.get(label.toLowerCase());
            return {
              doc:        cat?.domain    ?? "Application",
              domain:     cat?.subEntity ?? "Other",
              subEntity:  "",
              label,
              kind:       "text" as const,
              value:      entry.value,
              confidence: entry.confidence,
              critical:   "As applicable" as const,
              detail:     "",
              ...(entry.docRef ? { docRef: { ...entry.docRef, docType: entry.docRef.docType as any } } : {}),
            };
          })
          .sort((a, b) => {
            const ai = catalogOrder.get(a.label.toLowerCase()) ?? 999;
            const bi = catalogOrder.get(b.label.toLowerCase()) ?? 999;
            return ai - bi;
          });

        const filled = merged.filter(f => f.value !== "").length;
        console.log(`[useIngestionFields] ${merged.length} fields from API, ${filled} with extracted values`);
        console.groupEnd();

        setFields(merged);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error("[useIngestionFields] Extraction fetch error:", err.message);
        console.groupEnd();
        setError(err.message);
        setIsLoading(false);
      });
  }, [submissionId, submissionRecord]);

  return { fields, isLoading, error, defaultPreview };
}
