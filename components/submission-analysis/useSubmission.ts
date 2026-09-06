"use client";
import { useState, useEffect } from "react";
import type { SubmissionMeta, SubmissionExtras } from "./types";
import type { CatalogField } from "./types";
import type { SubmissionIndexEntry } from "../CustomerTable";
import { submissionData, DEFAULT_EXTRAS, submissionExtras, buildFieldCatalog } from "./mock-data";
import { SUBMISSION_INDEX } from "../CustomerTable";
import { transformSubmissionToRecord } from "@/lib/submissionTransformer";

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

    fetch(`/api/submissions/${submissionId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const apiData = await res.json();

        console.log("[useSubmission] Raw API response:", apiData);
        const record = transformSubmissionToRecord(apiData);
        console.log("[useSubmission] Transformed SubmissionRecord:", record);
        console.log("[useSubmission] Meta (from API):", {
          accountName:   record.meta.accountName,
          broker:        record.meta.broker,
          tivFull:       record.meta.tivFull,
          inceptionDate: record.meta.inceptionDate,
          submissionDate:record.meta.submissionDate,
          coverageType:  record.meta.coverageType,
          locations:     record.meta.locations,
        });
        console.log("[useSubmission] IndexEntry (from API + static):", record.indexEntry);
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

// ── Per-step API hooks ───────────────────────────────────────────────────────

export function useIngestionFields(submissionId: string | undefined): {
  fields: CatalogField[] | null;
  isLoading: boolean;
  error: string | null;
} {
  // TODO: Replace with real API call when /api/v1/submissions/{id}/extractions is ready:
  // const { data, isLoading, error } = useSWR<CatalogField[]>(
  //   submissionId ? `/api/v1/submissions/${submissionId}/extractions` : null,
  //   (url: string) => fetch(url).then(r => r.json()).then(transformExtractionFields),
  // );
  // return { fields: data ?? null, isLoading, error: error?.message ?? null };

  const { data } = useSubmission(submissionId);
  const idx = submissionId ? SUBMISSION_INDEX[submissionId] : undefined;
  if (!data || !idx) return { fields: null, isLoading: false, error: null };
  const fields = buildFieldCatalog(data.meta, idx, data.extras);
  return { fields, isLoading: false, error: null };
}
