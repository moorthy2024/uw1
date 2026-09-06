"use client";
import { useState, useEffect } from "react";
import type { SubmissionCard } from "../CustomerTable";
import { transformSubmissionToCard, type ApiSubmission, type ApiSubmissionListMeta } from "@/lib/submissionTransformer";

export interface UseSubmissionsResult {
  cards: SubmissionCard[];
  pagination: ApiSubmissionListMeta | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the submission list from /api/submissions and transforms each item
 * into a SubmissionCard for the table/grid.
 * Falls back gracefully — on error the hook returns empty cards so the
 * existing mock data in CustomerTable/SubmissionsPanel remains visible.
 */
export function useSubmissions(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): UseSubmissionsResult {
  const [cards, setCards] = useState<SubmissionCard[]>([]);
  const [pagination, setPagination] = useState<ApiSubmissionListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page     = params?.page     ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search   = params?.search   ?? "";
  const status   = params?.status   ?? "";

  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("page",      String(page));
    qs.set("page_size", String(pageSize));
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);

    const url = `/api/submissions?${qs.toString()}`;

    console.group(`[useSubmissions] Fetching submission list — page ${page}`);
    console.log("[useSubmissions] URL:", url);
    setIsLoading(true);
    setError(null);

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data: { items: ApiSubmission[]; meta: ApiSubmissionListMeta }) => {
        const items = data.items ?? [];
        console.log("[useSubmissions] Total from API:", data.meta?.total, "items in page:", items.length);
        console.log("[useSubmissions] Pagination:", data.meta);

        const transformed = items.map((item) => {
          const card = transformSubmissionToCard(item);
          console.log("[useSubmissions] Card:", card.id, card.account, card.processingStatus, card.totalTIVm + "M");
          return card;
        });

        console.log("[useSubmissions] Transformed", transformed.length, "cards");
        console.groupEnd();

        setCards(transformed);
        setPagination(data.meta ?? null);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error("[useSubmissions] Fetch error:", err.message, "— table will show mock data");
        console.groupEnd();
        setError(err.message);
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, status]);

  return { cards, pagination, isLoading, error };
}
