"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SubmissionMeta, SubmissionExtras } from "./types";
import type { SubmissionIndexEntry } from "../CustomerTable";

interface SubmissionContextValue {
  meta: SubmissionMeta;
  idx: SubmissionIndexEntry;
  extras: SubmissionExtras;
}

const SubmissionCtx = createContext<SubmissionContextValue | null>(null);

export function SubmissionProvider({
  meta, idx, extras, children,
}: SubmissionContextValue & { children: ReactNode }) {
  return (
    <SubmissionCtx.Provider value={{ meta, idx, extras }}>
      {children}
    </SubmissionCtx.Provider>
  );
}

export function useSubmissionCtx(): SubmissionContextValue {
  const ctx = useContext(SubmissionCtx);
  if (!ctx) throw new Error("useSubmissionCtx must be used inside <SubmissionProvider>");
  return ctx;
}
