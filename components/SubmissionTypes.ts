import { createContext, useContext, useEffect } from "react";

/* Context that lets step components push their action items to the Take Action dropdown */
export interface ActionItem { icon: React.ElementType; label: string; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost" }
export const StepActionsCtx = createContext<(items: ActionItem[]) => void>(() => {});
export function useStepActions(items: ActionItem[], deps: unknown[]) {
  const set = useContext(StepActionsCtx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { set(items); return () => set([]); }, deps);
}

/* ─────────────────────────── Types ─────────────────────────── */

export interface SubmissionMeta {
  id: string;
  accountName: string;
  namedInsured: string;
  broker: string;
  brokerageHouse: string;
  type: "New Business" | "Renewal" | "Remarket";
  coverageType: string;
  tiv: string;
  tivFull: string;
  territory: string;
  locations: string;
  inceptionDate: string;
  submissionDate: string;
  naics: string;
  industry: string;
  summary: string;
}

export type Band = "good" | "watch" | "alert";
export type Recommendation = "out-of-scope" | "follow-up" | "limited" | "in-scope";

/* Insight payload surfaced to the docked AI UW Agent pane on each step change */
export interface StepInsight {
  key: string;          // unique per (submission, step) so the pane can react
  stepIndex: number;
  stepLabel: string;
  prompt: string;       // the pre-defined "Show me the insights" prompt
  message: string;      // formatted recommendation / summary for this step
}

/* Thresholds for per-location claims significance */
export const CLAIMS_HIGH_FREQ_THRESHOLD = 3;   // ≥ N claims over the period
export const CLAIMS_HIGH_SEV_THRESHOLD  = 100; // ≥ $100K paid

export interface ClaimRecord {
  claimId: string;
  locId: string;
  location: string;
  lossDate: string;
  reportDate: string;
  peril: string;
  catEvent: string;
  status: "Open" | "Closed";
  paid: number;
  caseReserve: number;
  incurred: number;
  ibnr: number;
  deductible: string;
  layerAttached: string;
  adjuster: string;
  litigation: boolean;
  subrogationPotential: boolean;
  subrogationRecovered: number;
  reopened: boolean;
  complexity: "Low" | "Medium" | "High";
  reserveAdequacy: string;
  notes: string;
}

export interface ClaimsBreakdown {
  years: number;
  totalLocs: number;
  highFreq: number;
  highSev: number;
  both: number;
}

export interface AccumState {
  state: string;
  locCount: number;
  locPct: number;        // % of this account's locations
  bookTIVM: number;      // inforce book TIV in $M for this state
  bookShare: number;     // % of total inforce book TIV
  isCATState: boolean;
}

export interface PiercingEvent {
  peril: string;
  amount: string;
  year: number;
  location: string;
  breachedAnnualAgg?: boolean;
}

export interface LayerPenetration {
  attachmentPoint: string;
  annualAggregateLimit: string;
  claimsPiercingLayer: number;
  yearsBreach: number;
  largestLoss: string;
  piercingEvents?: PiercingEvent[];
  requestedPerils?: string[];
}

export interface SimilarPill {
  label: string;
  value: string;
  match?: boolean;
  highlight?: boolean;
}

export interface KeyScore {
  label: string;
  value: string;
  band: Band;
  note: string;
  tooltip?: string;
  subScores?: { label: string; grade: string }[];
  docPills?: DocItem[];
  claimsBreakdown?: ClaimsBreakdown;
  accumStates?: AccumState[];
  layerPenetration?: LayerPenetration;
  yearlyPaid?: { year: number; paid: string }[];
  similarPills?: SimilarPill[];
  similarAccountNames?: string[];
  tier?: "L1" | "L2";
}

export interface DocItem {
  name: string;
  received: boolean;
  date?: string;
  needsReview: boolean;
  reviewReason?: string;
}

export interface EmailAttachment {
  filename: string;
  classifiedAs: string | null;
  pageCount: number;
}

export interface EmailBatch {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  attachments: EmailAttachment[];
}

export interface SovLocation {
  loc: string;
  state: string;
  construction: string;
  protectionCode: string;
  occupancy: string;
  tiv: string;
  hazard: number;
  catModel: "Modelled" | "Pending" | "Required";
  healthCheck: "Pass" | "Flag" | "Review";
  /* Expanded Commercial Property property SOV fields — optional so a blank value reads as
     "not yet encoded" and drives the SOV completeness insight. */
  constructionClass?: string;   // ISO construction class, e.g. "Class 4 — Masonry NC"
  yearBuilt?: number;
  roofAge?: number;             // years since roof last updated
  roofType?: string;            // e.g. "Built-up (BUR)", "Metal Standing Seam"
  stories?: number;
  sqFt?: number;
  sprinklerType?: string;       // "ESFR", "Wet Pipe", "Dry Pipe", "None"
  buildingValue?: string;       // component of TIV, e.g. "$40M"
  contentsValue?: string;
  biValue?: string;
  floodZone?: string;           // FEMA flood zone, e.g. "X", "AE"
  distanceToCoast?: string;     // e.g. "12 mi", "0.4 mi"
}

/* Required Commercial Property SOV fields used for the completeness insight. Order matters —
   this is the pill order shown on the Account Overview SOV insight. */
export const EXPECTED_SOV_FIELDS: { key: keyof SovLocation; label: string }[] = [
  { key: "construction",      label: "Construction" },
  { key: "constructionClass", label: "ISO Class" },
  { key: "yearBuilt",         label: "Year Built" },
  { key: "roofAge",           label: "Roof Age" },
  { key: "roofType",          label: "Roof Type" },
  { key: "stories",           label: "Stories" },
  { key: "sqFt",              label: "Sq Ft" },
  { key: "occupancy",         label: "Occupancy" },
  { key: "protectionCode",    label: "Protection Class" },
  { key: "sprinklerType",     label: "Sprinkler Type" },
  { key: "buildingValue",     label: "Building Value" },
  { key: "contentsValue",     label: "Contents Value" },
  { key: "biValue",           label: "BI Value" },
  { key: "tiv",               label: "TIV" },
  { key: "floodZone",         label: "Flood Zone" },
  { key: "distanceToCoast",   label: "Dist. to Coast" },
];

/* A field is "encoded" only when populated on (nearly) every location. Returns
   per-field received flags plus an overall encoded/total count. */
export function sovFieldCompleteness(locations: SovLocation[]) {
  const total = EXPECTED_SOV_FIELDS.length;
  const locCount = Math.max(locations.length, 1);
  const fieldItems = EXPECTED_SOV_FIELDS.map(({ key, label }) => {
    const populated = locations.filter(l => {
      const v = l[key];
      return v !== undefined && v !== null && String(v).trim() !== "";
    }).length;
    // Treat a field as encoded when it is present on at least 90% of locations
    const received = locCount > 0 && populated / locCount >= 0.9;
    return { name: label, received, needsReview: false };
  });
  const encoded = fieldItems.filter(f => f.received).length;
  const pct = Math.round((encoded / total) * 100);
  return { fieldItems, encoded, total, pct };
}

export interface LossLocation {
  loc: string;
  paid: string;
  reportedNotPaid: string;
  count: number;
}

export interface SubmissionExtras {
  request: { perils: string[]; limitsSought: string; qbeLayer: string; towerPosition: string; leadCarriers: string[]; valuationMethod: string };
  focusNote: string;
  hazardByConstruction: string;
  hazardByOccupancy: string;
  documents: DocItem[];
  emailBatches: EmailBatch[];
  sov: {
    modellingReady: boolean;
    completenessPct: number;
    dataCleansingNote: string;
    stats: { totalTIV: string; locationCount: number; topState: string; avgHazard: number };
    locations?: SovLocation[];
    locationsLoader?: () => Promise<SovLocation[]>;
    /** Account-specific SOV summary values from the broker-submitted schedule */
    buildingValue?: string;        // e.g. "7,800,000,000"
    contentsValue?: string;        // e.g. "2,600,000,000"
    biValue?: string;              // e.g. "2,600,000,000"
    biIndemnityPeriod?: string;    // e.g. "18 months"
    biWaitingPeriod?: string;      // e.g. "72 hours"
    coinsurance?: string;          // e.g. "90" or "100"
    yearBuiltRange?: string;       // e.g. "1958–2024 across 20,485 locations"
  };
  lossHistory: {
    lossRatio: string;
    lossRatioBand: Band;
    summary: string;
    claimsYears: number;
    /** Account-specific loss history totals from the loss run */
    claimsCount?: number;          // e.g. 47
    netLosses?: string;            // e.g. "$26.2M"
    grossLosses?: string;          // e.g. "$29.6M"
    ibnr?: string;                 // e.g. "$3.1M"
    largestLoss?: string;          // e.g. "15,800,000"
    lossRunYears?: string;         // e.g. "5 years: 2021–2025"
    topLocations: LossLocation[];
    layerPenetration?: LayerPenetration;
    yearlyBreakdown?: { year: number; paid: string; qbeLayerLoss?: string }[];
    claims?: ClaimRecord[];
  };
  policyDetails: {
    policyNumber: string;
    expirationDate: string;
    commission: string;
    generalHazardLevel: string;
    aopDeductible: string;
    buildingLimit: string;
    contentsLimit: string;
    businessLimit: string;
    equipmentBreakdown: boolean;
    certifiedTerrorism: boolean;
  };
}
