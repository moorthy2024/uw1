/* ──────────────────────────────────────────────────────────────
   Submission Ingestion Field Catalog

   The full list of fields sought during submission ingestion,
   organised as a four-level hierarchy:

     Expected Document  →  Domain Name  →  Entity / Sub-Entity  →  Field

   Each leaf carries the extracted value, the criticality flag from the
   ingestion specification, and a citation back into the source document.
   ────────────────────────────────────────────────────────────── */

import type { SubmissionIndexEntry } from "./CustomerTable";

export type FieldKind = "text" | "textarea" | "numeric" | "currency" | "percent" | "date" | "select" | "multi-select" | "display" | "repeatable-table";

/** NB/Renewal ingestion criticality straight from the field specification. */
export type Criticality = "Yes" | "As applicable" | "Flag if missing" | "QBE Layer dependent";

export interface CatalogDocRef {
  doc: string;
  page: number;
  excerpt: string;
  highlightLabel: string;
}

export interface CatalogField {
  /** Expected document this field is sourced from — top level of the hierarchy. */
  doc: string;
  /** Domain name — second level. */
  domain: string;
  /** Entity / sub-entity — third level. */
  subEntity: string;
  /** Field name — leaf. */
  label: string;
  /** Specification detail / expected value guidance. */
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

/* Expected documents — top level of the hierarchy, also the pre-flight checklist */
export const EXPECTED_DOCS = [
  "Application",
  "Coverage Request",
  "Primary Policy",
  "Loss History",
  "Risk Engineering Report",
  "Statement of Values",
] as const;

/* Ordering for the domain and sub-entity levels so groups render consistently */
export const DOMAIN_ORDER = [
  "Party & Customer",
  "Agreement / Policy",
  "Coverage / Peril",
  "Location / Insurable Object",
  "Financial / Account Reference",
] as const;

export const CRITICALITY_STYLE: Record<Criticality, string> = {
  "Yes":                   "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  "As applicable":         "bg-[#F5F4F1] text-[#4B5563] border-[#E8E6E1]",
  "Flag if missing":       "bg-amber-50 text-amber-800 border-amber-200",
  "QBE Layer dependent":   "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]",
};

/* Minimal shape of the submission metadata this catalog reads from */
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

/** Add one year to an MM/DD/YYYY date string — used to derive the expiry date. */
function plusOneYear(date: string): string {
  const parts = date.split("/");
  if (parts.length !== 3) return date;
  const year = Number(parts[2]);
  return Number.isNaN(year) ? date : `${parts[0]}/${parts[1]}/${year + 1}`;
}

export function buildFieldCatalog(
  meta: CatalogMeta,
  idx: SubmissionIndexEntry,
  extras: CatalogExtras,
): CatalogField[] {
  const isRenewal = meta.type === "Renewal";
  const state = extras.sov.stats.topState;
  const ref = (doc: string, page: number, excerpt: string, label: string): CatalogDocRef =>
    ({ doc, page, excerpt, highlightLabel: label });

  return [
    /* ───────────── Application ───────────── */
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Named insured (legal name)", detail: "Account Name", critical: "Yes", kind: "text",
      value: meta.namedInsured, confidence: 98,
      docRef: ref("Application", 1, "Named Insured field", "Named Insured") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Legal entity type", detail: "LLC, Corp, Partnership, Trust", critical: "Yes", kind: "select",
      value: "Corporation", confidence: 93, options: ["LLC", "Corporation", "Partnership", "Trust"],
      docRef: ref("Application", 1, "Entity type declaration", "Legal Entity Type") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "NAICS code (Industry Level 3 — Salesforce)", detail: "Industry Code e.g. Agriculture, Construction, Manufacturing", critical: "Yes", kind: "text",
      value: meta.naics, confidence: 95,
      docRef: ref("Application", 1, "Business classification", "NAICS Code") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Appetite ID (4-digit, from Hazard Grade tool)", detail: "4-digit row ID from QBE's Hazard Grade tool for the occupancy/SIC combination; sets appetite and capacity", critical: "Yes", kind: "numeric",
      value: "4182", confidence: 86,
      docRef: ref("Application", 1, "Occupancy / SIC combination", "Appetite ID") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "ATC occupancy code", detail: "Classifies buildings by primary use e.g. Apartment, Church, Dwellings", critical: "Yes", kind: "numeric",
      value: "48", confidence: 89,
      docRef: ref("Application", 1, "Occupancy classification", "ATC Occupancy Code") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Occupancy description (text label)", detail: "Select the occupancy category that best describes the primary use of the insured's properties. Choose 'Other (describe below)' if no category fits.", critical: "Yes", kind: "select",
      value: meta.industry, confidence: 92,
      options: ["Healthcare / Medical", "Industrial / Manufacturing", "Real Estate / Habitational", "Municipalities / Government", "Education / Institutional", "Hospitality / Lodging", "Office / Professional Services", "Financial Institutions / Banking", "Retail / Wholesale Trade", "Light Manufacturing / Assembly", "Warehouse / Distribution", "Other (describe below)"],
      docRef: ref("Application", 1, "Occupancy description", "Occupancy Description") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Description of Operations & Material Flow", detail: "Describe the insured's primary business operations, materials handled, and any processes that may affect property risk (e.g. chemicals, hazardous materials, storage, manufacturing steps)", critical: "Yes", kind: "textarea",
      value: `${meta.industry} operations across ${meta.locations} scheduled locations`, confidence: 88,
      docRef: ref("Application", 1, "Operations narrative", "Business Operations") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Insured",
      label: "Occupancy group (Commercial / Residential / Other)", detail: "Target Occupancy Classes: Healthcare, Industrial, Real Estate, Municipalities, Education, Hospitality, Offices, Financial Institutions, Retail, Wholesale, Light Manufacturing", critical: "Yes", kind: "select",
      value: "Commercial", confidence: 94, options: ["Commercial", "Residential", "Other"],
      docRef: ref("Application", 1, "Occupancy group", "Occupancy Group") },

    { doc: "Application", domain: "Party & Customer", subEntity: "Broker / Producer",
      label: "Broker firm name", detail: "Name of the brokerage submitting the risk", critical: "Yes", kind: "text",
      value: meta.brokerageHouse, confidence: 99,
      docRef: ref("Application", 3, "Brokerage firm name", "Brokerage House") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Broker / Producer",
      label: "Broker producer code", detail: "Unique numeric code identifying the producer within the agency, used in Salesforce and Majesco", critical: "Yes", kind: "numeric",
      value: "PR-408271", confidence: 91,
      docRef: ref("Application", 3, "Producer code", "Broker Producer Code") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Broker / Producer",
      label: "Broker email address", detail: "Email address of the submitting broker contact", critical: "Yes", kind: "text",
      value: `${meta.broker.toLowerCase().replace(/[^a-z]+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/[^a-z]+/g, "")}.com`, confidence: 96,
      docRef: ref("Application", 3, "Broker information section", "Broker Contact") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Broker / Producer",
      label: "Retail broker name (if wholesale)", detail: "Underlying retail broker when a wholesale intermediary places the risk", critical: "Yes", kind: "text",
      value: "Not applicable — direct retail placement", confidence: 78,
      docRef: ref("Application", 3, "Retail broker declaration", "Retail Broker") },
    { doc: "Application", domain: "Party & Customer", subEntity: "Broker / Producer",
      label: "Proposed Commission (%)", detail: "Brokerage commission percentage proposed by the broker; deducted from gross premium at bind", critical: "Yes", kind: "percent",
      value: "15", confidence: 87,
      docRef: ref("Application", 3, "Commission terms", "Commission %") },

    { doc: "Application", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Insured mailing address", detail: "Legal mailing address of the named insured (e.g. P.O. Box 69, Belle Chasse, LA 70037)", critical: "Yes", kind: "text",
      value: idx.homeOffice, confidence: 92,
      docRef: ref("Application", 1, "Mailing address section", "Home Office") },
    { doc: "Application", domain: "Location / Insurable Object", subEntity: "Location",
      label: "State of domicile", detail: "US state where the insured is legally domiciled (e.g. LA, TX, CA, VT)", critical: "Yes", kind: "text",
      value: state, confidence: 94,
      docRef: ref("Application", 1, "Domicile declaration", "State of Domicile") },
    { doc: "Application", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Country of domicile", detail: "US domestic risks use QBE Specialty paper; international exposures require a fronting carrier", critical: "Yes", kind: "text",
      value: "United States", confidence: 97,
      docRef: ref("Application", 1, "Domicile declaration", "Country of Domicile") },
    { doc: "Application", domain: "Location / Insurable Object", subEntity: "Location",
      label: "US domestic vs international flag", detail: "\"US Domestic\" if all locations are within the 50 states; \"International\" if any location requires a fronting carrier and MURA", critical: "Yes", kind: "select",
      value: "US Domestic", confidence: 95, options: ["US Domestic", "International"],
      docRef: ref("Application", 1, "Territory scope", "US Domestic Flag") },
    { doc: "Application", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Fronting carrier name (if applicable)", detail: "Local carrier issuing policy for international locations; QBE sits behind as assumed reinsurer", critical: "Yes", kind: "text",
      value: "Not applicable — US domestic risk", confidence: 80,
      docRef: ref("Application", 1, "Fronting arrangements", "Fronting Carrier") },

    { doc: "Application", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Effective date", detail: "Policy inception date in MM/DD/YYYY format", critical: "Yes", kind: "date",
      value: meta.inceptionDate, confidence: 99,
      docRef: ref("Application", 2, "Policy effective date", "Inception Date") },
    { doc: "Application", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Expiry date", detail: "Policy expiration date, typically 12 months after effective date", critical: "Yes", kind: "date",
      value: plusOneYear(meta.inceptionDate), confidence: 97,
      docRef: ref("Application", 2, "Policy expiration date", "Expiry Date") },
    { doc: "Application", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "New business vs renewal flag", detail: "Indicates whether this is a new account or a renewal", critical: "Yes", kind: "select",
      value: meta.type, confidence: 99, options: ["New Business", "Renewal", "Remarket"],
      docRef: ref("Application", 2, "Coverage request header", "Submission Type") },
    { doc: "Application", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Prior Policy Number (Renewals)", detail: "Policy number from the expiring term, used to locate prior files and pull loss history. Populated for renewals only; enter 'Not applicable' for new business.", critical: "Yes", kind: "text",
      value: isRenewal ? "140012568" : "Not applicable — new business", confidence: isRenewal ? 93 : 75,
      flagReason: isRenewal ? undefined : "No prior term — new business submission",
      docRef: ref("Application", 2, "Expiring policy reference", "Prior Policy Number") },
    { doc: "Application", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Submission received date / timestamp", detail: "Date and time the submission email or portal download was received; determines \"First In\" broker priority", critical: "Yes", kind: "date",
      value: `${meta.submissionDate} at 10:32 AM`, confidence: 99,
      docRef: ref("Application", 1, "Date of submission", "Submission Date") },
    { doc: "Application", domain: "Agreement / Policy", subEntity: "System Reference",
      label: "Submission Reference Number (SUB-YYYY-XXXX)", detail: "Internal workflow identifier — not the insurance policy number. Assigned at Clearance & Setup; primary reference across all screens and system records.", critical: "Yes", kind: "text",
      value: meta.id, confidence: 100,
      docRef: ref("Application", 1, "Workbench reference", "Submission Reference") },

    /* ───────────── Coverage Request ───────────── */
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Line of business", detail: "Insurance line being written (e.g. Commercial Property)", critical: "Yes", kind: "text",
      value: meta.coverageType, confidence: 99,
      docRef: ref("Coverage Request", 1, "Line of business", "Coverage Type") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Program Position", detail: "Position of QBE's participation in the insurance tower. Select Primary for ground-up; Excess for any layer above an underlying policy.", critical: "Yes", kind: "select",
      value: extras.request.qbeLayer, confidence: 93, options: ["Primary", "Excess", "Quota Share", "Buffer"],
      docRef: ref("Coverage Request", 1, "QBE specific layer", "QBE Layer") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Requested Layer(s)", detail: "Specific layer selection for excess submissions. Shown only when Program Position is Excess.", critical: "As applicable", kind: "select",
      value: "Specific layer", confidence: 88, options: ["Specific layer", "Multiple layers", "Any layer (UW discretion)"],
      conditional: "Program Position=Excess",
      docRef: ref("Coverage Request", 1, "QBE specific layer", "Requested Layers") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Requested Layer Limit ($)", detail: "Maximum QBE pays for any single loss event within this layer", critical: "Yes", kind: "currency",
      value: extras.request.limitsSought, confidence: 95,
      docRef: ref("Coverage Request", 1, "Limit and layer detail", "Limits Sought") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Total Program Limit ($)", detail: "Maximum QBE pays across all occurrences in the policy year for a specific peril (aggregate cap)", critical: "Yes", kind: "currency",
      value: "25,000,000", confidence: 90,
      docRef: ref("Coverage Request", 1, "Aggregate limit clause", "Aggregate Limit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Attachment / retention point ($)", detail: "Dollar amount the underlying insurance must pay before this policy responds", critical: "Yes", kind: "currency",
      value: "15,000,000", confidence: 91,
      conditional: "Program Position=Primary|Excess",
      docRef: ref("Coverage Request", 1, "Attachment point", "Attachment Point") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Layering Structure (combined)", detail: "Combined display of layer limit xs attachment point. Auto-calculated from Requested Layer Limit and Attachment fields.", critical: "As applicable", kind: "display",
      value: `${extras.request.limitsSought} xs $15,000,000`, confidence: 93,
      docRef: ref("Coverage Request", 1, "Layer structure summary", "Layering Structure") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "AOP deductible ($)", detail: "All Other Perils flat dollar deductible applied to non-catastrophe losses", critical: "Yes", kind: "currency",
      value: "100,000", confidence: 94,
      docRef: ref("Coverage Request", 2, "Deductible schedule", "AOP Deductible") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Named windstorm deductible (%)", detail: "Percentage of property values at each affected location for named windstorm losses (minimum $250,000 per occurrence). Add a row per territory/zone.", critical: "Yes", kind: "repeatable-table",
      value: JSON.stringify([{ Territory: "Gulf Coast", "%orFlat": "5%", Minimum: "$250,000", Maximum: "", Basis: "TIV per location", Notes: "" }]), confidence: 92,
      schema: [
        { col: "Territory", kind: "text" },
        { col: "%orFlat", kind: "text" },
        { col: "Minimum", kind: "currency" },
        { col: "Maximum", kind: "currency" },
        { col: "Basis", kind: "select", options: ["TIV per location", "TIV per occurrence", "Flat per occurrence"] },
        { col: "Notes", kind: "text" },
      ],
      docRef: ref("Coverage Request", 2, "Deductible schedule", "Named Windstorm Deductible") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "EQ deductible (%)", detail: "Percentage of values for earthquake / earth movement losses. Add a row per territory (CA = 5%, Pacific Northwest = 2%, etc.).", critical: "Yes", kind: "repeatable-table",
      value: JSON.stringify([{ Territory: "CA", "%orFlat": "5%", Minimum: "$100,000", Maximum: "", Basis: "TIV per location", Notes: "" }, { Territory: "Pacific Northwest (OR/WA)", "%orFlat": "2%", Minimum: "$50,000", Maximum: "", Basis: "TIV per location", Notes: "" }]), confidence: 89,
      schema: [
        { col: "Territory", kind: "select", options: ["CA", "Pacific Northwest (OR/WA)", "AK", "PR", "HI", "NM", "Other"] },
        { col: "%orFlat", kind: "text" },
        { col: "Minimum", kind: "currency" },
        { col: "Maximum", kind: "currency" },
        { col: "Basis", kind: "select", options: ["TIV per location", "TIV per occurrence", "Flat per occurrence"] },
        { col: "Notes", kind: "text" },
      ],
      docRef: ref("Coverage Request", 2, "Deductible schedule", "EQ Deductible") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Flood deductible (%)", detail: "SFHA: NFIP maximum plus $100,000; MFHA: $100,000 per occurrence; named-windstorm flood: 5% of values, min $250,000", critical: "Yes", kind: "percent",
      value: "5", confidence: 87,
      docRef: ref("Coverage Request", 2, "Deductible schedule", "Flood Deductible") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Flood sublimit ($)", detail: "Per-occurrence sublimit for flood / surface water losses.", critical: "Yes", kind: "currency",
      value: "15,000,000", confidence: 88,
      docRef: ref("Coverage Request", 2, "Sublimit schedule", "Flood Sublimit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Earth Movement / EQ sublimit ($)", detail: "Per-occurrence sublimit for earthquake and earth movement losses.", critical: "Yes", kind: "currency",
      value: "10,000,000", confidence: 88,
      docRef: ref("Coverage Request", 2, "Sublimit schedule", "EQ Sublimit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Named Windstorm sublimit ($)", detail: "Per-occurrence sublimit for named windstorm / hurricane losses.", critical: "Yes", kind: "currency",
      value: "", confidence: 80,
      docRef: ref("Coverage Request", 2, "Sublimit schedule", "Named Windstorm Sublimit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Terrorism sublimit ($)", detail: "Per-occurrence sublimit for certified terrorism losses (TRIA / non-TRIA).", critical: "As applicable", kind: "currency",
      value: "", confidence: 80,
      docRef: ref("Coverage Request", 2, "Sublimit schedule", "Terrorism Sublimit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Other perils sublimit ($)", detail: "Per-occurrence sublimit for any remaining perils not listed above (e.g. NBCR, inland flood, miscellaneous).", critical: "As applicable", kind: "currency",
      value: "", confidence: 80,
      docRef: ref("Coverage Request", 2, "Sublimit schedule", "Other Perils Sublimit") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Mandatory Endorsements (LMA5393 / LMA5400/5401)", detail: "LMA5393 (Communicable Disease Exclusion), LMA5401 (Property Cyber & Data Exclusion). Select all endorsements attached to the submission.", critical: "Yes", kind: "multi-select",
      value: "LMA5393, LMA5401 attached", confidence: 96,
      options: ["LMA5393 — Communicable Disease Exclusion", "LMA5400 — Cyber & Data Exclusion", "LMA5401 — Property Cyber & Data Exclusion", "LMA5404 — Sanctions", "LMA5567 — Electronic Data Exclusion", "Other"],
      docRef: ref("Coverage Request", 2, "Endorsement schedule", "Mandatory Endorsements") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Cyber / Electronic Data Coverage", detail: "Status of Cyber and Electronic Data coverage under this submission (ref. LMA5401).", critical: "As applicable", kind: "select",
      value: "Excluded", confidence: 90,
      options: ["Excluded", "Not purchased", "Included", "Endorsed"],
      docRef: ref("Coverage Request", 2, "Cyber exclusion status", "Excluded Coverage") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Crisis Management Coverage", detail: "Status of Crisis Management / Political Violence coverage under this submission.", critical: "As applicable", kind: "select",
      value: "Not purchased", confidence: 90,
      options: ["Excluded", "Not purchased", "Included", "Endorsed"],
      docRef: ref("Coverage Request", 2, "Crisis management status", "Excluded Coverage") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Non-Physical Damage BI (NPD BI)", detail: "Status of Non-Physical Damage Business Interruption coverage under this submission.", critical: "As applicable", kind: "select",
      value: "Excluded", confidence: 90,
      options: ["Excluded", "Not purchased", "Included", "Endorsed"],
      docRef: ref("Coverage Request", 2, "NPD BI status", "Excluded Coverage") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Requested perils", detail: "Perils the broker is asking QBE to write", critical: "Yes", kind: "multi-select",
      value: extras.request.perils.join(", "), confidence: 97,
      options: [
        "Fire & Lightning",
        "Wind / Windstorm",
        "Named Windstorm / Hurricane",
        "Flood",
        "Earth Movement / Earthquake",
        "Hail",
        "Sprinkler Leakage",
        "Water Damage",
        "Theft / Burglary",
        "Vandalism & Malicious Mischief",
        "Business Interruption",
        "Extra Expense",
        "Boiler & Machinery",
        "Terrorism (TRIA)",
        "NBCR",
        "Other",
      ],
      docRef: ref("Coverage Request", 1, "Requested perils list", "Requested Perils") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "NFIP eligibility flag (eligible / not eligible per location)", detail: "Whether a property or community qualifies for the National Flood Insurance Program", critical: "Yes", kind: "select",
      value: "Eligible", confidence: 84, options: ["Eligible", "Not eligible", "To be confirmed", "Not applicable"],
      docRef: ref("Coverage Request", 2, "NFIP eligibility", "NFIP Eligibility") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "TRIA Election", detail: "TRIA must be offered at every quote. Election (purchased or declined) is confirmed at binding only.", critical: "Yes", kind: "display",
      value: "TBD — confirmed at binding", confidence: 0,
      docRef: ref("Coverage Request", 2, "TRIA election", "TRIA Election") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Boiler & Machinery (B&M) - Included/Excluded", detail: "Equipment breakdown coverage status on the submission", critical: "As applicable", kind: "select",
      value: "Excluded", confidence: 86, options: ["Included", "Excluded"],
      docRef: ref("Coverage Request", 2, "Equipment breakdown", "Boiler & Machinery") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Manuscript Requests", detail: "Non-standard coverage requests requiring custom manuscript language; must be approved by Head of Commercial Property", critical: "As applicable", kind: "select",
      value: "None submitted", confidence: 82,
      options: ["Non-Standard Wording", "Coverage Modification", "Exclusion Modification", "Limit / Sublimit Modification", "Custom Endorsement", "Other"],
      docRef: ref("Coverage Request", 2, "Manuscript requests", "Manuscript Requests") },
    { doc: "Coverage Request", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Valuation Basis (RC / ACV / AV)", detail: "Replacement Cost (RC), Actual Cash Value (ACV), or Agreed Value (AV)", critical: "Yes", kind: "select",
      value: extras.request.valuationMethod, confidence: 96,
      options: ["RCV", "ACV", "Agreed Value", "Functional Replacement Cost"],
      docRef: ref("Coverage Request", 2, "Valuation basis clause", "Valuation Method") },

    /* ───────────── Primary Policy ───────────── */
    { doc: "Primary Policy", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Lead Primary Policy carrier and policy number", detail: "Carrier name and policy number for the lead primary layer this excess policy follows", critical: "Yes", kind: "text",
      value: "Swiss Re Corporate Solutions — NAP 2006902 00", confidence: 90,
      docRef: ref("Primary Policy", 1, "Declarations page", "Lead Primary Carrier") },
    { doc: "Primary Policy", domain: "Coverage / Peril", subEntity: "Coverage Term",
      label: "Underlying limits ($)", detail: "Total limits of all underlying policies that must be exhausted before this layer responds", critical: "QBE Layer dependent", kind: "currency",
      value: "18,500,000", confidence: 88,
      docRef: ref("Primary Policy", 1, "Schedule of underlying insurance", "Underlying Limits") },
    { doc: "Primary Policy", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Binder Reference Number", detail: "Unique identifier assigned to the binder document at the bind stage. Populated when coverage is bound; blank prior to bind.", critical: "Yes", kind: "text",
      value: "BND-2026-11482", confidence: 85,
      docRef: ref("Primary Policy", 1, "Binder reference", "Binder Reference") },
    { doc: "Primary Policy", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Per-Territory Policy Number", detail: "Sub-field of the Policy Number. A separate number is issued per US state or territory when regulatory filings require individual state endorsements.", critical: "Yes", kind: "text",
      value: `140012568-${state}`, confidence: 81,
      docRef: ref("Primary Policy", 1, "Territory filings", "Per-Territory Policy Number") },
    { doc: "Primary Policy", domain: "Agreement / Policy", subEntity: "Policy / Slip",
      label: "Policy Number", detail: "Official policy number appearing on the declarations page. Primary identifier once the policy is issued.", critical: "Yes", kind: "text",
      value: "140012568", confidence: 87,
      docRef: ref("Primary Policy", 1, "Declarations page", "Policy Number") },
    { doc: "Primary Policy", domain: "Financial / Account Reference", subEntity: "Premium Transaction",
      label: "Layer structure / attachment points", detail: "Full program tower with each layer's attachment and limit", critical: "Yes", kind: "text",
      value: `QBE: 5.4% of $10,000,000 xs $185,000,000 xs $15,000,000 per occurrence`, confidence: 86,
      docRef: ref("Primary Policy", 1, "Program tower", "Layer Structure") },
    { doc: "Primary Policy", domain: "Financial / Account Reference", subEntity: "Premium Transaction",
      label: "Final sold premium ($)", detail: "QBE's share of premium at the agreed bound terms", critical: "Yes", kind: "currency",
      value: "742,500", confidence: 83,
      docRef: ref("Primary Policy", 1, "Premium summary", "Final Sold Premium") },
    { doc: "Primary Policy", domain: "Financial / Account Reference", subEntity: "Premium Transaction",
      label: "Rate per $100 TIV", detail: "Final bound premium expressed as dollars per $100 of total insured value", critical: "Yes", kind: "numeric",
      value: "0.23", confidence: 85,
      docRef: ref("Primary Policy", 1, "Rating basis", "Rate per $100 TIV") },
    { doc: "Primary Policy", domain: "Financial / Account Reference", subEntity: "Premium Transaction",
      label: "Expiring premium ($)", detail: "Premium from the most recently expiring policy term; pricing benchmark for renewals", critical: "Yes", kind: "currency",
      value: isRenewal ? "698,000" : "Not applicable — new business", confidence: isRenewal ? 89 : 74,
      docRef: ref("Primary Policy", 1, "Expiring terms", "Expiring Premium") },

    /* ───────────── Loss History ───────────── */
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Premium Transaction",
      label: "Loss ratio (claims / premium)", detail: "Total incurred losses divided by earned premium for the loss history period", critical: "Yes", kind: "text",
      value: extras.lossHistory.lossRatio, confidence: 92,
      docRef: ref("Loss History", 1, "Loss ratio summary", "Loss Ratio") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Number of claims in period", detail: "Total reported claims across the loss run years provided", critical: "Yes", kind: "numeric",
      value: String(extras.lossHistory.claimsCount ?? 3), confidence: 95,
      docRef: ref("Loss History", 1, "Claim count", "Number of Claims") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Claims History", detail: "Full narrative loss history — claim count, incurred, paid, reserves, cause of loss, and location", critical: "Yes", kind: "select",
      options: [
        "Favorable — no losses over $50K; attritional only",
        "Moderate — 1–3 losses over $50K; no frequency concern",
        "Adverse — recurring losses or single loss >$250K",
        "Clean — no claims in period",
      ],
      value: "Favorable — no losses over $50K; attritional only", confidence: 90,
      docRef: ref("Loss History", 1, "Loss narrative", "Claims History") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Largest single loss ($)", detail: "Dollar amount of the single largest claim in the loss history", critical: "Yes", kind: "currency",
      value: extras.lossHistory.largestLoss ?? "9,085", confidence: 93,
      docRef: ref("Loss History", 1, "Largest loss", "Largest Single Loss") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Loss run years provided", detail: "Number of policy years covered by the loss run", critical: "Yes", kind: "select",
      options: [
        "3 years: 2023–2025",
        "5 years: 2021–2025",
        "7 years: 2019–2025",
        "10 years: 2016–2025",
      ],
      value: extras.lossHistory.lossRunYears ?? "5 years: 2021–2025", confidence: 96,
      docRef: ref("Loss History", 1, "Loss run period", "Loss Run Years") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Net losses (5-year total)", detail: "Total net paid losses across the 5-year loss run period after recoveries and deductibles", critical: "Yes", kind: "currency",
      value: extras.lossHistory.netLosses ?? "$5.42M", confidence: 94,
      docRef: ref("Loss History", 1, "Net loss total", "Net Losses (5-Year Total)") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Gross losses (5-year total)", detail: "Total gross incurred losses across the 5-year loss run period before recoveries", critical: "Yes", kind: "currency",
      value: extras.lossHistory.grossLosses ?? "$5.62M", confidence: 93,
      docRef: ref("Loss History", 1, "Gross loss total", "Gross Losses (5-Year Total)") },
    { doc: "Loss History", domain: "Financial / Account Reference", subEntity: "Financial Transaction",
      label: "Outstanding reserves / IBNR", detail: "Total case reserves and incurred-but-not-reported estimates outstanding at the loss run date", critical: "Yes", kind: "currency",
      value: extras.lossHistory.ibnr ?? "$0.20M", confidence: 91,
      docRef: ref("Loss History", 1, "Reserve total", "Outstanding Reserves / IBNR") },

    /* ───────────── Statement of Values ───────────── */
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Total insured value (TIV)", detail: "Sum of all building, contents, BI, and M&E values across all insured locations", critical: "Yes", kind: "currency",
      value: meta.tivFull, confidence: 94,
      docRef: ref("Statement of Values", 1, "TIV summary line", "Total Insured Value") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Building value (total)", detail: "Aggregate replacement cost value of all insured buildings across the full schedule", critical: "Yes", kind: "currency",
      value: extras.sov.buildingValue ?? "212,400,000", confidence: 91,
      docRef: ref("Statement of Values", 1, "Value breakdown", "Building Value") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Contents value (total)", detail: "Aggregate insured value of contents across all locations", critical: "Yes", kind: "currency",
      value: extras.sov.contentsValue ?? "58,900,000", confidence: 90,
      docRef: ref("Statement of Values", 1, "Value breakdown", "Contents Value") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Stock TIV", detail: "Insured value of stock / inventory, tracked separately from contents for CAT modelling and pricing", critical: "As applicable", kind: "currency",
      value: "24,500,000", confidence: 84,
      docRef: ref("Statement of Values", 1, "Stock values", "Stock TIV") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Business interruption (BI) value", detail: "Total time element / BI value across all locations", critical: "As applicable", kind: "currency",
      value: extras.sov.biValue ?? "33,240,379", confidence: 88,
      docRef: ref("Statement of Values", 1, "Time element values", "BI Value") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "BI Indemnity Period", detail: "Maximum months the policy pays business interruption losses following a covered event", critical: "As applicable", kind: "text",
      value: extras.sov.biIndemnityPeriod ?? "12 months", confidence: 86,
      docRef: ref("Statement of Values", 1, "BI terms", "BI Indemnity Period") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "BI Waiting Period", detail: "Hours that must elapse after a loss before BI coverage begins", critical: "As applicable", kind: "text",
      value: extras.sov.biWaitingPeriod ?? "72 hours", confidence: 85,
      docRef: ref("Statement of Values", 1, "BI terms", "BI Waiting Period") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Coinsurance", detail: "Percentage of total insured value the insured must maintain to avoid penalty at time of loss", critical: "As applicable", kind: "percent",
      value: extras.sov.coinsurance ?? "90", confidence: 83,
      docRef: ref("Statement of Values", 1, "Coinsurance clause", "Coinsurance") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Valuation Basis (RC / ACV / AV)", detail: "Method used to value insured property at time of loss", critical: "Yes", kind: "select",
      value: "RC", confidence: 92, options: ["RC", "ACV", "AV"],
      docRef: ref("Statement of Values", 1, "Valuation basis", "SOV Valuation Basis") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Machinery & equipment value", detail: "Aggregate value of machinery and equipment (M&E / Contents 3 in RMS template)", critical: "Yes", kind: "currency",
      value: "18,760,000", confidence: 87,
      docRef: ref("Statement of Values", 2, "M&E values", "Machinery & Equipment Value") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "SOV file (Excel / broker-provided)", detail: "Broker-provided Schedule of Values listing every insured location with COPE data and values", critical: "Yes", kind: "text",
      value: `SOV_${meta.namedInsured.replace(/[^A-Za-z0-9]+/g, "_")}_2026.xlsx`, confidence: 99,
      docRef: ref("Statement of Values", 1, "File header", "SOV File") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Number of locations", detail: "Total count of distinct insured premises across the schedule", critical: "Yes", kind: "numeric",
      value: meta.locations, confidence: 96,
      docRef: ref("Statement of Values", 1, "Location count header", "Location Count") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Number of buildings", detail: "Total count of individual insured structures — a single location may have multiple buildings", critical: "Yes", kind: "numeric",
      value: `${extras.sov.stats.locationCount * 2}`, confidence: 89,
      docRef: ref("Statement of Values", 1, "Building count", "Number of Buildings") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Total floor area (sq ft)", detail: "Sum of gross floor areas in square feet across all buildings", critical: "Yes", kind: "numeric",
      value: "1,482,600", confidence: 86,
      docRef: ref("Statement of Values", 2, "Floor area column", "Total Floor Area") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Currency of values", detail: "Currency in which SOV values are denominated", critical: "Yes", kind: "select",
      value: "USD", confidence: 99, options: ["USD", "CAD", "GBP", "EUR"],
      docRef: ref("Statement of Values", 1, "Currency declaration", "Currency of Values") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Construction type (Frame / JM / MNC / FR)", detail: "RMS/ATC construction class — Frame (1), Joisted Masonry (2), Non-Combustible (3/3C), Masonry Non-Combustible (4C), Fire Resistive (5)", critical: "Yes", kind: "text",
      value: `${idx.topConstructionClass} (${idx.constructionClassPct}% of TIV)`, confidence: 91,
      docRef: ref("Statement of Values", 2, "Construction class breakdown", "Top Construction Class") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Year Built (Portfolio Range)", detail: "Account-level summary derived from SOV data. Shows the oldest to newest construction year across all scheduled locations.", critical: "Yes", kind: "display",
      value: extras.sov.yearBuiltRange ?? `1965–2018 across ${meta.locations} locations`, confidence: 88,
      docRef: ref("Statement of Values", 2, "Year built column", "Year Built") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Year of upgrade / renovation", detail: "Year of the most recent significant structural renovation", critical: "Yes", kind: "numeric",
      value: "2016", confidence: 82,
      docRef: ref("Statement of Values", 2, "Renovation column", "Year of Renovation") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Number of stories", detail: "Total number of floors in the building", critical: "Yes", kind: "numeric",
      value: "4", confidence: 90,
      docRef: ref("Statement of Values", 2, "Stories column", "Number of Stories") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Floors occupied", detail: "Number of floors actively occupied by the insured", critical: "Yes", kind: "numeric",
      value: "4", confidence: 84,
      docRef: ref("Statement of Values", 2, "Occupied floors column", "Floors Occupied") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Roof type / covering material", detail: "Roof surface material — affects wind and hail pricing", critical: "Yes", kind: "text",
      value: "Built-up / single-ply with gutters", confidence: 85,
      docRef: ref("Statement of Values", 2, "Roof covering column", "Roof Type") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Roof age", detail: "Age in years of the current roof installation; older roofs attract higher wind/hail loadings", critical: "Yes", kind: "numeric",
      value: "12", confidence: 80,
      flagReason: "Roof age above 10 years — confirm condition with risk engineering",
      docRef: ref("Statement of Values", 2, "Roof age column", "Roof Age") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Roof geometry (flat / gable / hip)", detail: "Structural shape of the roof — affects wind uplift vulnerability", critical: "Yes", kind: "select",
      value: "Flat", confidence: 87, options: ["Flat", "Gable", "Hip"],
      docRef: ref("Statement of Values", 2, "Roof geometry column", "Roof Geometry") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Roof anchor type", detail: "How the roof deck is fastened to the structure (Clips, Straps, Toe-nailed)", critical: "Yes", kind: "select",
      value: "Clips", confidence: 78, options: ["Clips", "Straps", "Toe-nailed", "Unknown"],
      docRef: ref("Statement of Values", 2, "Roof anchorage column", "Roof Anchor Type") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Exterior wall / cladding type", detail: "Material and construction of exterior walls (entered as CLADDING in the RMS template)", critical: "Yes", kind: "text",
      value: "Concrete tilt-up panel", confidence: 86,
      docRef: ref("Statement of Values", 2, "Cladding column", "Exterior Wall Type") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Occupancy type per location (ATC code)", detail: "ATC occupancy code for each individual location (e.g. 51 Casino & Resort, 15 Education, 11 Parking, 48 Office)", critical: "Yes", kind: "text",
      value: "48 Office (3), 11 Parking (1), 15 Education (1)", confidence: 88,
      docRef: ref("Statement of Values", 2, "Occupancy column", "Occupancy per Location") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Number of basement levels", detail: "Count of below-grade floors at each location; critical for flood loss potential", critical: "Yes", kind: "numeric",
      value: "1", confidence: 83,
      docRef: ref("Statement of Values", 2, "Basement column", "Basement Levels") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Basement finish type", detail: "Finished, Unfinished, or Mechanical Only; affects contents and BI loss potential during flood events", critical: "Yes", kind: "select",
      value: "Mechanical Only", confidence: 79, options: ["Finished", "Unfinished", "Mechanical Only"],
      docRef: ref("Statement of Values", 2, "Basement finish column", "Basement Finish Type") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Full street address per location", detail: "Complete street address for geocoding and CAT modelling", critical: "Yes", kind: "text",
      value: "Provided for all scheduled locations", confidence: 94,
      docRef: ref("Statement of Values", 2, "Address columns", "Street Address") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "City", detail: "City name for each insured location", critical: "Yes", kind: "text",
      value: "Provided for all scheduled locations", confidence: 94,
      docRef: ref("Statement of Values", 2, "City column", "City") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "State / territory code", detail: "Two-letter state / territory code for each location", critical: "Yes", kind: "text",
      value: meta.territory, confidence: 96,
      docRef: ref("Statement of Values", 1, "Location territory summary", "Territory") },
    { doc: "Statement of Values", domain: "Location / Insurable Object", subEntity: "Location",
      label: "Postal / zip code", detail: "5-digit ZIP code for each location", critical: "Yes", kind: "text",
      value: "Provided for all scheduled locations", confidence: 93,
      docRef: ref("Statement of Values", 2, "ZIP column", "Postal Code") },

    /* ───────────── Risk Engineering Report ───────────── */
    { doc: "Risk Engineering Report", domain: "Coverage / Peril", subEntity: "Peril Group",
      label: "Engineering Document", detail: "Engineering inspection or risk improvement survey; influences pricing and may generate subjectivities", critical: "Flag if missing", kind: "text",
      value: "Risk improvement survey dated 04/2025 provided", confidence: 90,
      docRef: ref("Risk Engineering Report", 1, "Survey cover page", "Engineering Document") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Sprinkler system (Y / N)", detail: "Whether an automatic fire sprinkler system is installed throughout the building", critical: "Yes", kind: "select",
      value: "Y", confidence: 93, options: ["Y", "N", "Partial"],
      docRef: ref("Risk Engineering Report", 1, "Fire protection section", "Sprinkler System") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Sprinkler type (wet / dry pipe etc.)", detail: "Type of sprinkler system installed", critical: "Yes", kind: "select",
      value: "Wet Pipe", confidence: 89, options: ["Wet Pipe", "Dry Pipe", "Pre-Action", "Deluge"],
      docRef: ref("Risk Engineering Report", 1, "Fire protection section", "Sprinkler Type") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Protection class (1–10)", detail: "ISO Public Protection Classification — 1 is best (hydrants and fire station within 1,000 ft), 10 is no protection", critical: "Yes", kind: "numeric",
      value: "3", confidence: 91,
      docRef: ref("Risk Engineering Report", 1, "Public protection", "Protection Class") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Ground level mechanical / electrical equipment flag", detail: "Whether critical HVAC, electrical switchgear, or other M&E sits at ground level, increasing flood severity", critical: "Yes", kind: "select",
      value: "Y", confidence: 81, options: ["Y", "N"],
      flagReason: "Ground-level M&E present — elevated flood severity",
      docRef: ref("Risk Engineering Report", 2, "Flood exposure notes", "Ground Level M&E") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Roof equipment bracing", detail: "Whether rooftop HVAC units and other equipment are anchored against wind uplift", critical: "Yes", kind: "select",
      value: "Y — anchored to curbs", confidence: 80, options: ["Y — anchored to curbs", "N", "Partial"],
      docRef: ref("Risk Engineering Report", 2, "Wind exposure notes", "Roof Equipment Bracing") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Opening Protection", detail: "Rating of window and door protection against wind-borne debris — None, Basic, Hurricane", critical: "Yes", kind: "select",
      value: "Basic", confidence: 82, options: ["None", "Basic", "Hurricane"],
      docRef: ref("Risk Engineering Report", 2, "Wind exposure notes", "Opening Protection") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Wind Mitigation Features", detail: "Structural features reducing wind damage — shutters, reinforced garage doors, hip roof", critical: "Yes", kind: "text",
      value: "Reinforced roof-to-wall connections; no shutters", confidence: 78,
      docRef: ref("Risk Engineering Report", 2, "Wind mitigation", "Wind Mitigation Features") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Fire Alarm", detail: "Type and monitoring status of the fire alarm system — Local, Central Station, or None", critical: "Yes", kind: "select",
      value: "Central Station monitored — UL listed", confidence: 90,
      options: ["Central Station monitored — UL listed", "Local", "None"],
      docRef: ref("Risk Engineering Report", 1, "Fire protection section", "Fire Alarm") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Soft Story", detail: "Floor significantly weaker than those above it, increasing seismic vulnerability", critical: "Yes", kind: "select",
      value: "N", confidence: 84, options: ["Y", "N"],
      docRef: ref("Risk Engineering Report", 2, "Seismic notes", "Soft Story") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Foundation Bolting", detail: "Whether the wooden frame is bolted to the foundation to reduce seismic loss", critical: "Yes", kind: "select",
      value: "N/A — non-frame construction", confidence: 77,
      options: ["Y", "N", "N/A — non-frame construction"],
      docRef: ref("Risk Engineering Report", 2, "Seismic notes", "Foundation Bolting") },
    { doc: "Risk Engineering Report", domain: "Location / Insurable Object", subEntity: "Building / Structure",
      label: "Hazard score", detail: "Overall hazard grade produced by the risk engineering assessment", critical: "Yes", kind: "numeric",
      value: `${idx.hazardScore}`, confidence: 87,
      flagReason: idx.hazardScore >= 70 ? "Above watch threshold — verify construction data" : undefined,
      docRef: ref("Risk Engineering Report", 2, "Overall hazard score summary", "Hazard Score") },
  ];
}
