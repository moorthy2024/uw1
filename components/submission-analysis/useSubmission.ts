"use client";
import type { SubmissionMeta, SubmissionExtras } from "./types";
import type { CatalogField } from "./types";
import { submissionData, DEFAULT_EXTRAS, submissionExtras, buildFieldCatalog } from "./mock-data";
import { SUBMISSION_INDEX } from "../CustomerTable";

export interface SubmissionRecord {
  meta: SubmissionMeta;
  extras: SubmissionExtras;
}

export function useSubmission(submissionId: string | undefined): {
  data: SubmissionRecord | null;
  isLoading: boolean;
  error: string | null;
} {
  // ── MOCK IMPLEMENTATION ──────────────────────────────────────────────
  // TODO: Replace this block with a real API call, e.g.:
  //   const { data, isLoading, error } = useSWR(
  //     submissionId ? `/api/submissions/${submissionId}` : null,
  //     fetcher
  //   );
  //   return { data, isLoading, error };
  // ────────────────────────────────────────────────────────────────────
  const meta = submissionId ? submissionData[submissionId] ?? null : null;
  if (!meta) return { data: null, isLoading: false, error: null };
  const extras: SubmissionExtras = { ...DEFAULT_EXTRAS, ...submissionExtras[submissionId ?? ""] };
  return { data: { meta, extras }, isLoading: false, error: null };
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
// Each hook is the single swap point for its step's data source.
// Replace the mock body with useSWR(...) to wire in a real API.

export function useIngestionFields(submissionId: string | undefined): {
  fields: CatalogField[] | null;
  isLoading: boolean;
  error: string | null;
} {
  // TODO: Replace with → useSWR(submissionId ? `/api/submissions/${submissionId}/ingestion-fields` : null, fetcher)
  const { data } = useSubmission(submissionId);
  const idx = submissionId ? SUBMISSION_INDEX[submissionId] : undefined;
  if (!data || !idx) return { fields: null, isLoading: false, error: null };
  const fields = buildFieldCatalog(data.meta, idx, data.extras);
  return { fields, isLoading: false, error: null };
}
