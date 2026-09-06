"use client";
import { useState, useEffect } from "react";
import type { SubmissionMeta, SubmissionExtras } from "./types";
import type { CatalogField } from "./types";
import type { SubmissionIndexEntry } from "../CustomerTable";
import { submissionData, DEFAULT_EXTRAS, submissionExtras, buildFieldCatalog } from "./mock-data";
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

export function useIngestionFields(submissionId: string | undefined): {
  fields: CatalogField[] | null;
  isLoading: boolean;
  error: string | null;
} {
  const { data: submissionRecord } = useSubmission(submissionId);
  const [fields, setFields]       = useState<CatalogField[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

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

        // Build catalog schema (provides domain/subEntity/label/kind/detail metadata)
        const catalogSchema = buildFieldCatalog(submissionRecord.meta, idx, DEFAULT_EXTRAS);
        console.log(`[useIngestionFields] Catalog schema: ${catalogSchema.length} fields`);

        // Overlay real extraction values — null → empty string
        const merged = catalogSchema.map(f => {
          const real = valueMap[f.label];
          if (!real) return { ...f, value: "" };
          return {
            ...f,
            value:      real.value,
            confidence: real.confidence,
            ...(real.docRef ? { docRef: { ...real.docRef, docType: real.docRef.docType as any } } : {}),
          };
        });

        const filled = merged.filter(f => f.value !== "").length;
        console.log(`[useIngestionFields] Merged: ${merged.length} fields, ${filled} filled from extraction`);
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

  return { fields, isLoading, error };
}
