"use client";
export type {
  SubmissionMeta, SubmissionExtras, SovLocation, LossLocation,
  DocItem, EmailAttachment, EmailBatch, ClaimsBreakdown,
  AccumState, PiercingEvent, LayerPenetration, SimilarPill,
  KeyScore, StepInsight, ActionItem, Band, Recommendation,
} from "../SubmissionTypes";

/* ── Ingestion field catalog types ── */
export type FieldKind = "text" | "textarea" | "numeric" | "currency" | "percent" | "date" | "select" | "multi-select" | "display" | "repeatable-table";
export type Criticality = "Yes" | "As applicable" | "Flag if missing" | "QBE Layer dependent";

export interface CatalogDocRef {
  doc: string;
  page: number;
  sheet?: string;
  docUrl?: string;
  excerpt: string;
  highlightLabel: string;
  docType?: DocType;
  bbox?: { x1: number; y1: number; x2: number; y2: number };
}

export interface CatalogField {
  doc: string;
  domain: string;
  subEntity: string;
  label: string;
  detail: string;
  critical: Criticality;
  kind: FieldKind;
  value: string;
  confidence: number;
  options?: string[];
  flagReason?: string;
  conditional?: string;
  schema?: Array<{ col: string; kind: "text" | "percent" | "currency" | "select"; options?: string[] }>;
  docRef?: CatalogDocRef;
}

export interface CatalogMeta {
  id: string;
  namedInsured: string;
  broker: string;
  brokerageHouse: string;
  type: string;
  coverageType: string;
  tivFull: string;
  territory: string;
  locations: string;
  inceptionDate: string;
  submissionDate: string;
  naics: string;
  industry: string;
}

export interface CatalogExtras {
  request: { perils: string[]; limitsSought: string; qbeLayer: string; valuationMethod: string };
  sov: {
    stats: { totalTIV: string; locationCount: number; topState: string; avgHazard: number };
    buildingValue?: string;
    contentsValue?: string;
    biValue?: string;
    biIndemnityPeriod?: string;
    biWaitingPeriod?: string;
    coinsurance?: string;
    yearBuiltRange?: string;
  };
  lossHistory: {
    lossRatio: string;
    summary: string;
    claimsCount?: number;
    largestLoss?: string;
    netLosses?: string;
    grossLosses?: string;
    ibnr?: string;
    lossRunYears?: string;
    claimsYears?: number;
  };
}

export const CRITICALITY_STYLE: Record<Criticality, string> = {
  "Yes":                   "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  "As applicable":         "bg-[#F5F4F1] text-[#4B5563] border-[#E8E6E1]",
  "Flag if missing":       "bg-amber-50 text-amber-800 border-amber-200",
  "QBE Layer dependent":   "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]",
};

export type DocType = "pdf" | "xlsx" | "docx" | "image" | "csv";

export interface PdfPage {
  title:        string;
  pageCount:    number;
  content:      (highlight: string) => import("react").ReactNode;
  pageWidth?:   number;
  pageHeight?:  number;
  renderCanvas?: (ctx: CanvasRenderingContext2D, w: number, h: number, page: number, sheet?: string) => void | Promise<void>;
  /** PDF-only: locate text in the document and return canvas-space bbox. Preferred over hardcoded bbox. */
  findTextBbox?: (text: string, pageNum: number) => Promise<{ x1: number; y1: number; x2: number; y2: number } | null>;
}
