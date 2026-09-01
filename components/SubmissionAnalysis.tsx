"use client";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { DocumentCreationModal } from "./DocumentCreationModal";
import { InsightFeedback, StepFeedback, PostDecisionSurvey } from "./FeedbackComponents";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  StepActionsCtx, useStepActions, type ActionItem,
  type SubmissionMeta, type Band, type Recommendation,
  type StepInsight, type ClaimsBreakdown, type AccumState,
  type PiercingEvent, type LayerPenetration, type SimilarPill,
  type KeyScore, type DocItem, type EmailAttachment, type EmailBatch,
  type SovLocation, type LossLocation, type SubmissionExtras,
  CLAIMS_HIGH_FREQ_THRESHOLD, CLAIMS_HIGH_SEV_THRESHOLD,
  sovFieldCompleteness,
} from "./SubmissionTypes";
export type { StepInsight } from "./SubmissionTypes";
export type { ActionItem } from "./SubmissionTypes";
import {
  WORKFLOW_STEPS, RECOMMENDATION_CONFIG, deriveRecommendation,
  hazardBand, winBand, BAND_STYLE,
  parseTIV, parsePaidK, fmtTIV, fmtPaid, concentrationBand,
  buildStepInsight, ActionBtn,
  type PeerBenchmark, PEER_BENCHMARK, DEFAULT_BENCHMARK, benchmarkFor,
  parsePC, type CopeGroup, groupByTIV, type BookDelta, bookDelta, protectionScore,
} from "./SubmissionHelpers";
import { IngestionStep } from "./IngestionStep";
import { DecisionStep } from "./DecisionStep";

import {
  Building2, MapPin, Layers, FileText, CheckCircle2, Circle,
  AlertTriangle, Sparkles, Target, Gauge, Waves,
  Shield, ShieldCheck, Hammer, Globe2,
  ClipboardList, UserCheck, Mail, ChevronLeft, ChevronRight, Scale, Gavel,
  Send, Check, X, BarChart2, BarChart3, Database, RotateCcw, Briefcase, Home, Download, ExternalLink, TrendingUp,
  Paperclip, XCircle,
  RefreshCw, Link, Inbox, Search, Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  PROCESSING_STATUS_CONFIG,
  SUBMISSION_INDEX,
  type ProcessingStatus,
  type IndustryClass,
  type SubmissionIndexEntry,
} from "./CustomerTable";
import {
  buildFieldCatalog,
  EXPECTED_DOCS,
} from "./ingestion-field-catalog";
import { PINNACLE_SOV_LOCATIONS } from "@/app/data/pinnacleSOV";
import { loadHeartlandSOV } from "@/app/data/heartlandSOV";
import {
  StepShell,
  StepSummaryBand,
  PaneTitle,
  CategorySummaryList,
  CategoryDetailView,
  TrendLegend,
  type StepCategory,
  type StepStatus,
  type Trend,
} from "./step-detail-layout";

/* Types, interfaces, constants, and context are now in ./SubmissionTypes */

/* ─────────────────────────── Base metadata ─────────────────────────── */

const submissionData: Record<string, SubmissionMeta> = {
  "SUB-2026-0847": {
    id: "SUB-2026-0847", accountName: "Westfield Manufacturing", namedInsured: "Westfield Manufacturing LLC",
    broker: "Sarah Chen", brokerageHouse: "Marsh & McLennan", type: "New Business", coverageType: "Commercial Property",
    tiv: "$850M", tivFull: "$850,000,000", territory: "OH, IN, FL", locations: "8 — OH:4, IN:3, FL:1",
    inceptionDate: "01 Jul 2026", submissionDate: "08 Apr 2026", naics: "332710 — Metal Mfg", industry: "Manufacturing",
    summary: "Westfield Manufacturing operates three light industrial facilities in Ohio and Indiana producing fabricated metal components. Primary CAT exposure is wind/hail (OH/IN) and hurricane (FL location added 2025). Painting booth flagged as ignition hazard.",
  },
  "SUB-2026-0846": {
    id: "SUB-2026-0846", accountName: "Global Tech Industries", namedInsured: "Global Tech Industries LLC",
    broker: "Michael Torres", brokerageHouse: "Aon", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$620M", tivFull: "$620,000,000", territory: "CA, TX, NC", locations: "5 — CA:2, TX:2, NC:1",
    inceptionDate: "01 Jun 2026", submissionDate: "06 Apr 2026", naics: "541512 — Computer Systems Design", industry: "Technology",
    summary: "Global Tech operates data centers and tech offices across CA/TX/NC. Renewal of expiring program — clean loss history (LR 0.08). CA earthquake exposure and rising data-center fire load are renewal focus areas.",
  },
  "SUB-2026-0845": {
    id: "SUB-2026-0845", accountName: "Atlantic Distribution", namedInsured: "Atlantic Distribution Centers, Inc.",
    broker: "Jennifer Blake", brokerageHouse: "Willis Towers Watson", type: "New Business", coverageType: "Commercial Property",
    tiv: "$735M", tivFull: "$735,000,000", territory: "FL, GA, SC", locations: "12 — FL:6, GA:4, SC:2",
    inceptionDate: "15 May 2026", submissionDate: "09 Apr 2026", naics: "493110 — General Warehousing", industry: "Logistics",
    summary: "Atlantic Distribution runs 12 high-bay distribution centers across FL/GA/SC. New business — no prior QBE relationship. Hurricane exposure heavy along FL coast; ESFR sprinkler protection confirmed at 10 of 12 sites.",
  },
  "SUB-2026-0844": {
    id: "SUB-2026-0844", accountName: "Northeast Logistics Group", namedInsured: "Northeast Logistics Group LLC",
    broker: "David Park", brokerageHouse: "Lockton", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$540M", tivFull: "$540,000,000", territory: "NY, NJ, PA", locations: "6 — NY:3, NJ:2, PA:1",
    inceptionDate: "10 Mar 2026", submissionDate: "07 Apr 2026", naics: "488510 — Freight Arrangement", industry: "Logistics",
    summary: "Mid-term renewal update to add a new Bronx, NY warehouse ($18M TIV) to existing program. Standard occupancy match; no change to perils. Quick-touch renewal.",
  },
  "SUB-2026-0850": {
    id: "SUB-2026-0850", accountName: "TechCorp Solutions", namedInsured: "TechCorp Solutions Inc.",
    broker: "Lisa Rodriguez", brokerageHouse: "Aon", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$680M", tivFull: "$680,000,000", territory: "TX, OK", locations: "4 — TX:3, OK:1",
    inceptionDate: "15 Jun 2026", submissionDate: "12 Apr 2026", naics: "541512 — Computer Systems Design", industry: "Technology",
    summary: "TechCorp renewal of $25M xs $25M layer. Expiring LR 0.04 — clean. SCS exposure across TX is the only renewal focus; broker requesting modest premium reduction.",
  },
  "SUB-2026-0851": {
    id: "SUB-2026-0851", accountName: "TechCorp Solutions", namedInsured: "TechCorp Solutions Inc.",
    broker: "Lisa Rodriguez", brokerageHouse: "Aon", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$680M", tivFull: "$680,000,000", territory: "TX, OK", locations: "4 — TX:3, OK:1",
    inceptionDate: "15 Feb 2026", submissionDate: "15 Feb 2026", naics: "541512 — Computer Systems Design", industry: "Technology",
    summary: "TechCorp renewal — name change update following entity rename. No exposure change.",
  },
  "SUB-2026-0843": {
    id: "SUB-2026-0843", accountName: "Pacific Coast Hotels & Resorts", namedInsured: "Pacific Coast Hotels & Resorts LP",
    broker: "Sarah Chen", brokerageHouse: "Marsh & McLennan", type: "New Business", coverageType: "Commercial Property",
    tiv: "$1.2B", tivFull: "$1,200,000,000", territory: "CA, OR, WA", locations: "9 — CA:5, OR:2, WA:2",
    inceptionDate: "01 May 2026", submissionDate: "05 Apr 2026", naics: "721110 — Hotels (except Casino)", industry: "Hospitality",
    summary: "Boutique hotel portfolio across the Pacific Coast. New business submission with mixed wood-frame and Type II construction. CA earthquake and wildfire are primary CAT exposures; sprinkler coverage incomplete at 2 of 9 properties.",
  },
  "SUB-2026-0842": {
    id: "SUB-2026-0842", accountName: "Midwest Manufacturing", namedInsured: "Midwest Manufacturing Inc.",
    broker: "Michael Torres", brokerageHouse: "Aon", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$510M", tivFull: "$510,000,000", territory: "IL, WI", locations: "3 — IL:2, WI:1",
    inceptionDate: "01 Jun 2026", submissionDate: "10 Apr 2026", naics: "333120 — Construction Mfg", industry: "Manufacturing",
    summary: "Midwest Manufacturing renewal — long-standing account, 6 years on book. Single small loss this period ($38K — equipment breakdown). Stable program structure expected.",
  },
  "SUB-2026-1103": {
    id: "SUB-2026-1103", accountName: "Heartland Industrial Holdings", namedInsured: "Heartland Industrial Holdings LLC",
    broker: "Nicole Baxter", brokerageHouse: "Aon Risk Solutions", type: "New Business", coverageType: "Commercial Property",
    tiv: "$13.0B", tivFull: "$13,000,000,000", territory: "TX, IN, OH, IL, PA (38 states)", locations: "20,485 — TX:2321, IN:1758, OH:1528",
    inceptionDate: "01 Sep 2026", submissionDate: "03 Aug 2026", naics: "332999 — Diversified Fabricated Metal Mfg", industry: "Manufacturing",
    summary: "Heartland Industrial Holdings is a large domestic manufacturer with 20,485 scheduled locations across 38 states. New business — no prior QBE relationship. Primary CAT exposures: tornado/wind (Midwest), hurricane/flood (FL/TX Gulf Coast), wildfire (CA/AZ). SOV completeness 64%; CAT model pending full portfolio run. Facultative committee referral required given $13B TIV exceeds single-risk authority.",
  },
  "SUB-2026-1287": {
    id: "SUB-2026-1287", accountName: "Meridian Global Financial Group", namedInsured: "Meridian Global Financial Group",
    broker: "James Whitfield", brokerageHouse: "Marsh & McLennan", type: "Renewal", coverageType: "Commercial Property",
    tiv: "$1.85B", tivFull: "$1,850,000,000", territory: "US, UK, DE, SG, HK, JP, IE, CA, BR, CH, IN, AU, ZA, FR", locations: "46 — 14 countries",
    inceptionDate: "01 Nov 2026", submissionDate: "01 Sep 2026", naics: "522110 — Commercial Banking", industry: "Financial Institutions",
    summary: "Meridian Global Financial Group is a 4th-renewal loss-affected global banking and data-processing portfolio. Two layer-piercing events in the prior 5-year period (2022 Miami hurricane flood $61.5M; 2024 London HQ electrical fire $54.7M). Renewal rate increase required. Hazard profile is favorable (fire-resistive offices and data centers) but BI severity risk is elevated. Conditions: rate increase and risk improvement plan before bind.",
  },
  "SUB-2026-1214": {
    id: "SUB-2026-1214", accountName: "Pinnacle Global Industries", namedInsured: "Pinnacle Global Industries plc",
    broker: "Isabelle Duarte", brokerageHouse: "Willis Towers Watson", type: "New Business", coverageType: "Commercial Property (E&S / Surplus Lines)",
    tiv: "$11.2B", tivFull: "$11,200,000,000", territory: "US, DE, JP, BR, NL, AU, ZA, UK (8 countries)", locations: "312 — 8 countries",
    inceptionDate: "01 Oct 2026", submissionDate: "15 Aug 2026", naics: "331110 — Iron & Steel / Primary Metal Mfg", industry: "Manufacturing",
    summary: "Pinnacle Global Industries plc is an international heavy industrial manufacturer seeking new E&S placement across 8 countries. Reinforced concrete and steel frame construction with multi-territory CAT accumulation (US Gulf, Japan EQ, Continental Europe flood, CA/Pacific EQ, CA/AU wildfire). SOV 73% complete; CAT model re-run required for Sao Paulo and Osaka before bind. Facultative referral required ($11.2B > $350M single-risk authority).",
  },
};

/* ─────────────────────────── Per-submission detail extras ─────────────────────────── */

const DEFAULT_EXTRAS: SubmissionExtras = {
  request: {
    perils: ["All Risk (AOP)", "Named Windstorm", "Flood", "Earthquake"],
    limitsSought: "$25M per occurrence",
    qbeLayer: "$10M xs $3M",
    towerPosition: "Layer 1 of 3 (Primary Excess)",
    leadCarriers: ["AIG — $3M Primary (Lead)", "Chubb — $5M xs $13M", "Swiss Re — $7M xs $18M"],
    valuationMethod: "Replacement Cost (RCV) — agreed value on structures",
  },
  policyDetails: {
    policyNumber: "140010888",
    expirationDate: "01 Jul 2027",
    commission: "17.5%",
    generalHazardLevel: "Medium",
    aopDeductible: "$100,000",
    buildingLimit: "$12,897,524,580",
    contentsLimit: "$70,299,600",
    businessLimit: "$1,413,976,567",
    equipmentBreakdown: false,
    certifiedTerrorism: false,
  },
  focusNote: "Confirm CAT deductible adequacy against the modelled PML concentration before advancing to rating.",
  hazardByConstruction: "Predominantly combustible frame — elevates fire hazard band.",
  hazardByOccupancy: "Light manufacturing occupancy carries moderate ignition / loss-severity load.",
  documents: [
    { name: "Application", received: true, date: "08 Apr 2026", needsReview: false },
    { name: "Primary Policy", received: true, date: "08 Apr 2026", needsReview: false },
    { name: "Risk Engineering Report", received: false, needsReview: false },
    { name: "Loss History", received: true, date: "08 Apr 2026", needsReview: false },
  ],
  emailBatches: [
    {
      id: "email-1",
      from: "lisa.rodriguez@aon.com",
      subject: "TechCorp Solutions — New Business Submission",
      receivedAt: "08 Apr 2026, 09:14",
      attachments: [
        { filename: "CommercialPropertyApp_TechCorp.pdf", classifiedAs: "Application", pageCount: 6 },
        { filename: "ExpiringPolicy_TechCorp_2025.pdf", classifiedAs: "Primary Policy", pageCount: 14 },
        { filename: "LossRuns_TechCorp_5yr.xlsx", classifiedAs: "Loss History", pageCount: 3 },
      ],
    },
    {
      id: "email-2",
      from: "lisa.rodriguez@aon.com",
      subject: "RE: TechCorp — Follow-up docs",
      receivedAt: "10 Apr 2026, 14:32",
      attachments: [
        { filename: "TechCorp_SOV_Draft.xlsx", classifiedAs: null, pageCount: 2 },
      ],
    },
  ],
  sov: {
    modellingReady: false,
    completenessPct: 82,
    dataCleansingNote: "Geocoding complete; 2 locations missing protection class — cleanse before model submission.",
    stats: { totalTIV: "$850M", locationCount: 22, topState: "OH", avgHazard: 64 },
    locations: [
      { loc: "Bldg 1 — Columbus",      state: "OH", construction: "Frame",        protectionCode: "PC 3", occupancy: "Light Mfg",    tiv: "$62M", hazard: 68, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1998, stories: 2, sqFt: 210000, sprinklerType: "Wet Pipe", buildingValue: "$40M" },
      { loc: "Bldg 2 — Dayton",        state: "OH", construction: "Masonry NC",   protectionCode: "PC 4", occupancy: "Warehouse",     tiv: "$48M", hazard: 55, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1985, stories: 1, sqFt: 320000, sprinklerType: "None",     buildingValue: "$31M" },
      { loc: "Bldg 3 — Cincinnati",    state: "OH", construction: "Frame",        protectionCode: "PC 4", occupancy: "Light Mfg",    tiv: "$31M", hazard: 70, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 2004, stories: 2, sqFt: 140000, sprinklerType: "None",     buildingValue: "$20M" },
      { loc: "Bldg 4 — Cleveland",     state: "OH", construction: "Steel Frame",  protectionCode: "PC 2", occupancy: "Office",        tiv: "$22M", hazard: 42, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 3 — Non-Combustible", yearBuilt: 2011, stories: 4, sqFt: 95000,  sprinklerType: "Wet Pipe", buildingValue: "$14M" },
      { loc: "Bldg 5 — Akron",         state: "OH", construction: "Masonry NC",   protectionCode: "PC 3", occupancy: "Warehouse",     tiv: "$19M", hazard: 53, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1992, stories: 1, sqFt: 180000, sprinklerType: "ESFR",     buildingValue: "$12M" },
      { loc: "Bldg 6 — Toledo",        state: "OH", construction: "Frame",        protectionCode: "PC 5", occupancy: "Light Mfg",    tiv: "$14M", hazard: 74, catModel: "Required",  healthCheck: "Review", constructionClass: "Class 1 — Frame",           yearBuilt: 1978, stories: 2, sqFt: 88000,  sprinklerType: "None",     buildingValue: "$9M"  },
      { loc: "Bldg 7 — Fort Wayne",    state: "IN", construction: "Steel Frame",  protectionCode: "PC 3", occupancy: "Light Mfg",    tiv: "$54M", hazard: 61, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 3 — Non-Combustible", yearBuilt: 2007, stories: 2, sqFt: 240000, sprinklerType: "Wet Pipe", buildingValue: "$35M" },
      { loc: "Bldg 8 — Indianapolis",  state: "IN", construction: "Frame",        protectionCode: "PC 4", occupancy: "Warehouse",     tiv: "$28M", hazard: 66, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1989, stories: 1, sqFt: 200000, sprinklerType: "None",     buildingValue: "$18M" },
      { loc: "Bldg 9 — South Bend",    state: "IN", construction: "Masonry NC",   protectionCode: "PC 5", occupancy: "Light Mfg",    tiv: "$17M", hazard: 57, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1995, stories: 2, sqFt: 110000, sprinklerType: "None",     buildingValue: "$11M" },
      { loc: "Bldg 10 — Evansville",   state: "IN", construction: "Frame",        protectionCode: "PC 6", occupancy: "Warehouse",     tiv: "$11M", hazard: 71, catModel: "Required",  healthCheck: "Flag",   constructionClass: "Class 1 — Frame",           yearBuilt: 1972, stories: 1, sqFt: 150000, sprinklerType: "None",     buildingValue: "$7M"  },
      { loc: "Bldg 11 — Tampa",        state: "FL", construction: "Masonry NC",   protectionCode: "PC 5", occupancy: "Warehouse",     tiv: "$45M", hazard: 88, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1990, stories: 1, sqFt: 280000, sprinklerType: "None",     buildingValue: "$29M", floodZone: "AE", distanceToCoast: "3 mi" },
      { loc: "Bldg 12 — Orlando",      state: "FL", construction: "Frame",        protectionCode: "PC 4", occupancy: "Light Mfg",    tiv: "$23M", hazard: 82, catModel: "Modelled",  healthCheck: "Review", constructionClass: "Class 1 — Frame",           yearBuilt: 2001, stories: 2, sqFt: 130000, sprinklerType: "None",     buildingValue: "$15M" },
      { loc: "Bldg 13 — Jacksonville", state: "FL", construction: "Steel Frame",  protectionCode: "PC 3", occupancy: "Office",        tiv: "$18M", hazard: 76, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 3 — Non-Combustible", yearBuilt: 2013, stories: 3, sqFt: 76000,  sprinklerType: "Wet Pipe", buildingValue: "$12M", floodZone: "X",  distanceToCoast: "8 mi" },
      { loc: "Bldg 14 — Miami",        state: "FL", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office",        tiv: "$29M", hazard: 65, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2015, stories: 6, sqFt: 120000, sprinklerType: "Wet Pipe", buildingValue: "$19M", floodZone: "AE", distanceToCoast: "0.6 mi" },
      { loc: "Bldg 15 — Ft Lauderdale",state: "FL", construction: "Masonry NC",   protectionCode: "PC 5", occupancy: "Warehouse",     tiv: "$16M", hazard: 84, catModel: "Pending",   healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1988, stories: 1, sqFt: 160000, sprinklerType: "None",     buildingValue: "$10M", floodZone: "AE", distanceToCoast: "1.2 mi" },
      { loc: "Bldg 16 — Louisville",   state: "KY", construction: "Frame",        protectionCode: "PC 5", occupancy: "Light Mfg",    tiv: "$13M", hazard: 69, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1983, stories: 2, sqFt: 90000,  sprinklerType: "None",     buildingValue: "$8M"  },
      { loc: "Bldg 17 — Lexington",    state: "KY", construction: "Masonry NC",   protectionCode: "PC 4", occupancy: "Warehouse",     tiv: "$9M",  hazard: 54, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1996, stories: 1, sqFt: 100000, sprinklerType: "None",     buildingValue: "$6M"  },
      { loc: "Bldg 18 — Nashville",    state: "TN", construction: "Frame",        protectionCode: "PC 4", occupancy: "Light Mfg",    tiv: "$15M", hazard: 63, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 2002, stories: 2, sqFt: 105000, sprinklerType: "None",     buildingValue: "$10M" },
      { loc: "Bldg 19 — Memphis",      state: "TN", construction: "Steel Frame",  protectionCode: "PC 3", occupancy: "Warehouse",     tiv: "$11M", hazard: 58, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 3 — Non-Combustible", yearBuilt: 2009, stories: 1, sqFt: 170000, sprinklerType: "ESFR",     buildingValue: "$7M"  },
      { loc: "Bldg 20 — Knoxville",    state: "TN", construction: "Frame",        protectionCode: "PC 6", occupancy: "Light Mfg",    tiv: "$8M",  hazard: 72, catModel: "Required",  healthCheck: "Review", constructionClass: "Class 1 — Frame",           yearBuilt: 1975, stories: 2, sqFt: 70000,  sprinklerType: "None",     buildingValue: "$5M"  },
      { loc: "Bldg 21 — Pittsburgh",   state: "PA", construction: "Masonry NC",   protectionCode: "PC 3", occupancy: "Office",        tiv: "$12M", hazard: 46, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 2006, stories: 3, sqFt: 65000,  sprinklerType: "Wet Pipe", buildingValue: "$8M"  },
      { loc: "Bldg 22 — Philadelphia", state: "PA", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office",        tiv: "$17M", hazard: 40, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2014, stories: 5, sqFt: 88000,  sprinklerType: "Wet Pipe", buildingValue: "$11M" },
    ],
  },
  lossHistory: {
    lossRatio: "0.21", lossRatioBand: "good", claimsYears: 5,
    summary: "5-year incurred loss ratio 0.21 — favorable. No losses over $250K; frequency driven by minor water / equipment claims.",
    topLocations: [
      { loc: "Bldg 1 — Columbus", paid: "$142K", reportedNotPaid: "$0", count: 4 },
      { loc: "Bldg 5 — Fort Wayne", paid: "$61K", reportedNotPaid: "$18K", count: 2 },
      { loc: "Bldg 2 — Dayton", paid: "$22K", reportedNotPaid: "$0", count: 1 },
    ],
    yearlyBreakdown: [
      { year: 2021, paid: "$28K" },
      { year: 2022, paid: "$18K" },
      { year: 2023, paid: "$92K" },
      { year: 2024, paid: "$61K" },
      { year: 2025, paid: "$26K" },
    ],
    layerPenetration: {
      attachmentPoint: "$3M",
      annualAggregateLimit: "$10M",
      claimsPiercingLayer: 1,
      yearsBreach: 0,
      largestLoss: "$3.8M (2023 — equipment fire, Columbus)",
      piercingEvents: [
        { peril: "All Risk (AOP)", amount: "$3.8M", year: 2023, location: "Bldg 1 — Columbus" },
      ],
    },
  },
};

const submissionExtras: Record<string, Partial<SubmissionExtras>> = {
  "SUB-2026-0847": {
    focusNote: "FL (Tampa) location added post-2025 drives 62% of modelled hurricane PML — validate the NWS deductible ($1M) is adequate against a $9.1M single-location PML before rating.",
    request: {
      perils: ["All Risk (AOP)", "Named Windstorm", "Flood", "Earthquake"],
      limitsSought: "$25M xs $3M",
      qbeLayer: "$10M xs $3M",
      towerPosition: "Layer 1 of 4 (Primary Excess)",
      leadCarriers: ["FM Global — $3M Primary (Lead)", "Zurich — $5M xs $13M", "Liberty Mutual — $7M xs $18M", "Berkley — $5M xs $25M"],
      valuationMethod: "Replacement Cost (RCV); business income on ALS basis",
    },
    lossHistory: {
      lossRatio: "0.38", lossRatioBand: "watch", claimsYears: 5,
      summary: "5-year loss ratio 0.38 — moderate. Two significant wind events in FL; frequency elevated across OH locations.",
      topLocations: [
        { loc: "Bldg 11 — Tampa", paid: "$5.2M", reportedNotPaid: "$1.1M", count: 3 },
        { loc: "Bldg 1 — Columbus", paid: "$142K", reportedNotPaid: "$0", count: 4 },
        { loc: "Bldg 3 — Cincinnati", paid: "$88K", reportedNotPaid: "$22K", count: 2 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$88K" },
        { year: 2022, paid: "$3.1M" },
        { year: 2023, paid: "$44K" },
        { year: 2024, paid: "$2.19M" },
        { year: 2025, paid: "$0" },
      ],
      layerPenetration: {
        attachmentPoint: "$3M",
        annualAggregateLimit: "$10M",
        claimsPiercingLayer: 2,
        yearsBreach: 1,
        largestLoss: "$5.2M (2024 — hurricane wind, Tampa)",
        piercingEvents: [
          { peril: "Named Windstorm", amount: "$5.2M", year: 2024, location: "Bldg 11 — Tampa", breachedAnnualAgg: true },
          { peril: "Named Windstorm", amount: "$3.1M", year: 2022, location: "Bldg 12 — Orlando" },
        ],
      },
    },
    documents: [
      { name: "Application", received: true, date: "08 Apr 2026", needsReview: false },
      { name: "Primary Policy", received: true, date: "08 Apr 2026", needsReview: true, reviewReason: "NMA2914 manuscript carve-out differs from expiring — verify wording." },
      { name: "Risk Engineering Report", received: true, date: "12 Apr 2026", needsReview: true, reviewReason: "No current survey on file for FL (Tampa) — added post-2025 cycle." },
      { name: "Loss History", received: true, date: "08 Apr 2026", needsReview: false },
    ],
  },
  "SUB-2026-0846": {
    focusNote: "Renewal with clean loss history; CA earthquake accumulation and rising data-center fire load are the review focus given the Limited appetite classification.",
    request: {
      perils: ["All Risk (AOP)", "Earthquake", "Flood"],
      limitsSought: "$20M per occurrence",
      qbeLayer: "$10M xs $10M",
      towerPosition: "Layer 2 of 3 (Middle Excess)",
      leadCarriers: ["AIG — $10M Primary (Lead)", "Chubb — $10M xs $20M"],
      valuationMethod: "Replacement Cost (RCV)",
    },
    hazardByConstruction: "Fire-resistive construction — favorable structural hazard band.",
    hazardByOccupancy: "Data-center occupancy raises fire load / BI severity despite low structural hazard.",
    lossHistory: {
      lossRatio: "0.08", lossRatioBand: "good", claimsYears: 5,
      summary: "5-year loss ratio 0.08 — excellent. No CAT losses; two minor equipment claims.",
      topLocations: [
        { loc: "Santa Clara DC", paid: "$54K", reportedNotPaid: "$0", count: 1 },
        { loc: "Austin Campus", paid: "$31K", reportedNotPaid: "$0", count: 1 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$0" },
        { year: 2022, paid: "$0" },
        { year: 2023, paid: "$54K" },
        { year: 2024, paid: "$31K" },
        { year: 2025, paid: "$0" },
      ],
      layerPenetration: {
        attachmentPoint: "$10M",
        annualAggregateLimit: "$10M",
        claimsPiercingLayer: 0,
        yearsBreach: 0,
        largestLoss: "$54K (2023 — minor equipment)",
        piercingEvents: [],
      },
    },
  },
  "SUB-2026-0842": {
    focusNote: "Submission is incomplete — processing paused pending broker follow-up. Missing updated SOV and current-year loss runs before triage can complete.",
    documents: [
      { name: "Application", received: true, date: "10 Apr 2026", needsReview: false },
      { name: "Primary Policy", received: true, date: "10 Apr 2026", needsReview: false },
      { name: "Risk Engineering Report", received: false, needsReview: false },
      { name: "Loss History", received: false, needsReview: true, reviewReason: "Current-year loss runs outstanding — requested from broker." },
    ],
    sov: {
      modellingReady: false, completenessPct: 54,
      dataCleansingNote: "Updated SOV not yet received — TIV and protection data stale from prior term.",
      stats: { totalTIV: "$510M", locationCount: 3, topState: "IL", avgHazard: 63 },
      locations: [
        { loc: "Plant 1 — Chicago", state: "IL", construction: "Frame", protectionCode: "PC 4", occupancy: "Manufacturing", tiv: "$46M", hazard: 66, catModel: "Modelled", healthCheck: "Pass",   constructionClass: "Class 1 — Frame",      yearBuilt: 1981 },
        { loc: "Plant 2 — Rockford", state: "IL", construction: "Masonry NC", protectionCode: "PC 4", occupancy: "Warehouse", tiv: "$30M", hazard: 58, catModel: "Pending",  healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC" },
        { loc: "Plant 3 — Madison", state: "WI", construction: "Frame", protectionCode: "PC 5", occupancy: "Manufacturing", tiv: "$18M", hazard: 64, catModel: "Required", healthCheck: "Review", constructionClass: "Class 1 — Frame" },
      ],
    },
  },
  "SUB-2026-0843": {
    focusNote: "Hospitality portfolio with CA earthquake + wildfire exposure; sprinkler coverage incomplete at 2 of 9 properties — condition rating on protection improvements.",
    sov: {
      modellingReady: false, completenessPct: 89,
      dataCleansingNote: "Geocoding complete; 2 CA locations missing flood zone designation — required before EQ model submission.",
      stats: { totalTIV: "$1.2B", locationCount: 100, topState: "CA", avgHazard: 59 },
      locations: [
        { loc: "Santa Monica Resort",        state: "CA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$62M", hazard: 65, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1994, stories: 10, sqFt: 310000, sprinklerType: "Wet Pipe", buildingValue: "$54M", floodZone: "X",  distanceToCoast: "0.3 mi" },
        { loc: "Beverly Hills Hotel",         state: "CA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$58M", hazard: 48, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2001, stories: 8,  sqFt: 240000, sprinklerType: "Wet Pipe", buildingValue: "$50M" },
        { loc: "SF Union Square Hotel",       state: "CA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$48M", hazard: 72, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1988, stories: 14, sqFt: 195000, sprinklerType: "Wet Pipe", buildingValue: "$41M" },
        { loc: "San Diego Bayfront Resort",   state: "CA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$44M", hazard: 52, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2008, stories: 12, sqFt: 210000, sprinklerType: "Wet Pipe", buildingValue: "$38M", floodZone: "X",  distanceToCoast: "0.1 mi" },
        { loc: "Napa Valley Inn",             state: "CA", construction: "Masonry NC",    protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$22M", hazard: 81, catModel: "Pending",   healthCheck: "Review", constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1977, stories: 3,  sqFt: 95000,  sprinklerType: "None",     buildingValue: "$16M" },
        { loc: "Burbank Hotel",               state: "CA", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$18M", hazard: 74, catModel: "Modelled",  healthCheck: "Review", constructionClass: "Class 1 — Frame",           yearBuilt: 1969, stories: 4,  sqFt: 88000,  sprinklerType: "None",     buildingValue: "$12M" },
        { loc: "Pasadena Inn",                state: "CA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 68, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1985, stories: 5,  sqFt: 72000,  sprinklerType: "Wet Pipe", buildingValue: "$10M" },
        { loc: "Long Beach Harbour Hotel",    state: "CA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$31M", hazard: 58, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2005, stories: 9,  sqFt: 148000, sprinklerType: "Wet Pipe", buildingValue: "$27M", floodZone: "AE", distanceToCoast: "0.4 mi" },
        { loc: "Sacramento Capital Hotel",    state: "CA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$19M", hazard: 55, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1993, stories: 6,  sqFt: 102000, sprinklerType: "Wet Pipe", buildingValue: "$14M" },
        { loc: "Irvine Tech Hotel",           state: "CA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$26M", hazard: 47, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2014, stories: 7,  sqFt: 130000, sprinklerType: "Wet Pipe", buildingValue: "$22M" },
        { loc: "Fresno Convention Hotel",     state: "CA", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 63, catModel: "Required",  healthCheck: "Flag",   constructionClass: "Class 1 — Frame",           yearBuilt: 1971, stories: 3,  sqFt: 62000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Monterey Bay Hotel",          state: "CA", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$16M", hazard: 69, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1982, stories: 4,  sqFt: 78000,  sprinklerType: "None",     buildingValue: "$11M", floodZone: "X",  distanceToCoast: "0.2 mi" },
        { loc: "Oakland Airport Inn",         state: "CA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$13M", hazard: 61, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1996, stories: 4,  sqFt: 68000,  sprinklerType: "Wet Pipe", buildingValue: "$9M" },
        { loc: "Palm Springs Resort",         state: "CA", construction: "Fire Resist.",  protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$24M", hazard: 43, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2003, stories: 5,  sqFt: 115000, sprinklerType: "Wet Pipe", buildingValue: "$20M" },
        { loc: "Santa Barbara Coast Hotel",   state: "CA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$17M", hazard: 70, catModel: "Modelled",  healthCheck: "Review", constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1979, stories: 4,  sqFt: 84000,  sprinklerType: "None",     buildingValue: "$12M", floodZone: "X",  distanceToCoast: "0.6 mi" },
        { loc: "Redwood City Suites",         state: "CA", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 58, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1989, stories: 3,  sqFt: 48000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Riverside Garden Hotel",      state: "CA", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 66, catModel: "Pending",   healthCheck: "Flag",   constructionClass: "Class 1 — Frame",           yearBuilt: 1974, stories: 3,  sqFt: 44000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Seattle Waterfront Hotel",    state: "WA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$41M", hazard: 44, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2009, stories: 11, sqFt: 188000, sprinklerType: "Wet Pipe", buildingValue: "$35M", floodZone: "X",  distanceToCoast: "0.1 mi" },
        { loc: "Bellevue Tech Hotel",         state: "WA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$28M", hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2016, stories: 9,  sqFt: 138000, sprinklerType: "Wet Pipe", buildingValue: "$24M" },
        { loc: "Tacoma Convention Inn",       state: "WA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 42, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1991, stories: 5,  sqFt: 72000,  sprinklerType: "Wet Pipe", buildingValue: "$10M" },
        { loc: "Spokane Center Hotel",        state: "WA", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 39, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1986, stories: 4,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Portland Pearl Hotel",        state: "OR", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$24M", hazard: 46, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2011, stories: 8,  sqFt: 118000, sprinklerType: "Wet Pipe", buildingValue: "$20M" },
        { loc: "Portland Airport Inn",        state: "OR", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 41, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1998, stories: 4,  sqFt: 60000,  sprinklerType: "None",     buildingValue: "$8M" },
        { loc: "Eugene Cascades Hotel",       state: "OR", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$7M",  hazard: 44, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1983, stories: 3,  sqFt: 38000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Las Vegas Strip Resort",      state: "NV", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$52M", hazard: 31, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2005, stories: 28, sqFt: 480000, sprinklerType: "Wet Pipe", buildingValue: "$46M" },
        { loc: "Las Vegas Downtown Inn",      state: "NV", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$18M", hazard: 34, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1992, stories: 6,  sqFt: 95000,  sprinklerType: "Wet Pipe", buildingValue: "$13M" },
        { loc: "Reno Convention Hotel",       state: "NV", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 37, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1988, stories: 5,  sqFt: 64000,  sprinklerType: "None",     buildingValue: "$8M" },
        { loc: "Henderson Suites",            state: "NV", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 32, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 2001, stories: 3,  sqFt: 44000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Phoenix Desert Resort",       state: "AZ", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$33M", hazard: 36, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2007, stories: 7,  sqFt: 162000, sprinklerType: "Wet Pipe", buildingValue: "$28M" },
        { loc: "Scottsdale Spa Resort",       state: "AZ", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$28M", hazard: 34, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2012, stories: 5,  sqFt: 140000, sprinklerType: "Wet Pipe", buildingValue: "$24M" },
        { loc: "Tucson Mountain Inn",         state: "AZ", construction: "Masonry NC",    protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1989, stories: 3,  sqFt: 58000,  sprinklerType: "None",     buildingValue: "$8M" },
        { loc: "Tempe University Hotel",      state: "AZ", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 35, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1995, stories: 3,  sqFt: 48000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Honolulu Beachfront Resort",  state: "HI", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$54M", hazard: 55, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1998, stories: 16, sqFt: 260000, sprinklerType: "Wet Pipe", buildingValue: "$47M", floodZone: "AE", distanceToCoast: "0.0 mi" },
        { loc: "Maui Shores Resort",          state: "HI", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$38M", hazard: 58, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1985, stories: 10, sqFt: 180000, sprinklerType: "Wet Pipe", buildingValue: "$32M", floodZone: "AE", distanceToCoast: "0.0 mi" },
        { loc: "Kauai Garden Hotel",          state: "HI", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$16M", hazard: 61, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1979, stories: 4,  sqFt: 85000,  sprinklerType: "None",     buildingValue: "$11M", floodZone: "X",  distanceToCoast: "0.3 mi" },
        { loc: "Denver Tech Hotel",           state: "CO", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$27M", hazard: 35, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2013, stories: 8,  sqFt: 132000, sprinklerType: "Wet Pipe", buildingValue: "$23M" },
        { loc: "Boulder Mountain Inn",        state: "CO", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 40, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1992, stories: 4,  sqFt: 62000,  sprinklerType: "None",     buildingValue: "$9M" },
        { loc: "Colorado Springs Resort",     state: "CO", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 42, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1987, stories: 3,  sqFt: 50000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Austin Downtown Hotel",       state: "TX", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$32M", hazard: 53, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2010, stories: 10, sqFt: 158000, sprinklerType: "Wet Pipe", buildingValue: "$28M" },
        { loc: "Houston Galleria Hotel",      state: "TX", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$29M", hazard: 61, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2004, stories: 9,  sqFt: 142000, sprinklerType: "Wet Pipe", buildingValue: "$25M", floodZone: "AE", distanceToCoast: "50 mi" },
        { loc: "Dallas Uptown Hotel",         state: "TX", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$21M", hazard: 55, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1997, stories: 6,  sqFt: 108000, sprinklerType: "Wet Pipe", buildingValue: "$17M" },
        { loc: "San Antonio River Hotel",     state: "TX", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$16M", hazard: 52, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1988, stories: 5,  sqFt: 82000,  sprinklerType: "None",     buildingValue: "$11M" },
        { loc: "Fort Worth Convention Inn",   state: "TX", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 54, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1982, stories: 3,  sqFt: 55000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Chicago Magnificent Mile",    state: "IL", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$44M", hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1999, stories: 18, sqFt: 220000, sprinklerType: "Wet Pipe", buildingValue: "$38M" },
        { loc: "Chicago Midway Inn",          state: "IL", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$13M", hazard: 41, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1991, stories: 4,  sqFt: 68000,  sprinklerType: "None",     buildingValue: "$9M" },
        { loc: "New York Midtown Hotel",      state: "NY", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$68M", hazard: 29, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2002, stories: 22, sqFt: 310000, sprinklerType: "Wet Pipe", buildingValue: "$60M" },
        { loc: "NYC Financial District Inn",  state: "NY", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$36M", hazard: 31, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2008, stories: 14, sqFt: 165000, sprinklerType: "Wet Pipe", buildingValue: "$31M" },
        { loc: "Albany Capital Hotel",        state: "NY", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 35, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1985, stories: 4,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Boston Back Bay Hotel",       state: "MA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$35M", hazard: 36, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2006, stories: 12, sqFt: 168000, sprinklerType: "Wet Pipe", buildingValue: "$30M" },
        { loc: "Cambridge Inn",               state: "MA", construction: "Masonry NC",    protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 33, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1993, stories: 5,  sqFt: 62000,  sprinklerType: "Wet Pipe", buildingValue: "$9M" },
        { loc: "Miami Beach Resort",          state: "FL", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$46M", hazard: 72, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1995, stories: 14, sqFt: 215000, sprinklerType: "Wet Pipe", buildingValue: "$40M", floodZone: "AE", distanceToCoast: "0.0 mi" },
        { loc: "Orlando Disney Hotel",        state: "FL", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$38M", hazard: 65, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2000, stories: 10, sqFt: 185000, sprinklerType: "Wet Pipe", buildingValue: "$33M" },
        { loc: "Tampa Bay Marina Hotel",      state: "FL", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$22M", hazard: 76, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1987, stories: 6,  sqFt: 112000, sprinklerType: "None",     buildingValue: "$16M", floodZone: "AE", distanceToCoast: "0.5 mi" },
        { loc: "Fort Lauderdale Inn",         state: "FL", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 78, catModel: "Pending",   healthCheck: "Review", constructionClass: "Class 1 — Frame",           yearBuilt: 1978, stories: 4,  sqFt: 72000,  sprinklerType: "None",     buildingValue: "$9M", floodZone: "AE", distanceToCoast: "0.2 mi" },
        { loc: "Atlanta Peachtree Hotel",     state: "GA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$28M", hazard: 48, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2003, stories: 9,  sqFt: 138000, sprinklerType: "Wet Pipe", buildingValue: "$24M" },
        { loc: "Savannah Historic Inn",       state: "GA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 54, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1961, stories: 4,  sqFt: 58000,  sprinklerType: "Wet Pipe", buildingValue: "$8M" },
        { loc: "Charlotte Uptown Hotel",      state: "NC", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$22M", hazard: 42, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2009, stories: 7,  sqFt: 108000, sprinklerType: "Wet Pipe", buildingValue: "$19M" },
        { loc: "Raleigh Convention Hotel",    state: "NC", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 39, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1996, stories: 5,  sqFt: 72000,  sprinklerType: "None",     buildingValue: "$10M" },
        { loc: "Arlington National Hotel",    state: "VA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$29M", hazard: 35, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2007, stories: 9,  sqFt: 142000, sprinklerType: "Wet Pipe", buildingValue: "$25M" },
        { loc: "Richmond City Hotel",         state: "VA", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1990, stories: 4,  sqFt: 62000,  sprinklerType: "None",     buildingValue: "$9M" },
        { loc: "Minneapolis Downtown Hotel",  state: "MN", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$23M", hazard: 33, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2011, stories: 7,  sqFt: 112000, sprinklerType: "Wet Pipe", buildingValue: "$20M" },
        { loc: "St. Paul Convention Inn",     state: "MN", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 35, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1989, stories: 4,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "New Orleans French Quarter",  state: "LA", construction: "Masonry NC",    protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$19M", hazard: 71, catModel: "Modelled",  healthCheck: "Flag",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1968, stories: 5,  sqFt: 94000,  sprinklerType: "None",     buildingValue: "$13M", floodZone: "AE", distanceToCoast: "80 mi" },
        { loc: "Baton Rouge Hotel",           state: "LA", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 68, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1981, stories: 3,  sqFt: 42000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Nashville Music Row Hotel",   state: "TN", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$18M", hazard: 48, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2014, stories: 6,  sqFt: 88000,  sprinklerType: "Wet Pipe", buildingValue: "$15M" },
        { loc: "Memphis Riverside Hotel",     state: "TN", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 52, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1987, stories: 4,  sqFt: 58000,  sprinklerType: "None",     buildingValue: "$8M" },
        { loc: "Kansas City Hotel",           state: "MO", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$17M", hazard: 44, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2005, stories: 6,  sqFt: 84000,  sprinklerType: "Wet Pipe", buildingValue: "$14M" },
        { loc: "St. Louis Gateway Hotel",     state: "MO", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$13M", hazard: 47, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1993, stories: 5,  sqFt: 66000,  sprinklerType: "None",     buildingValue: "$9M" },
        { loc: "Indianapolis Convention Hotel",state: "IN", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$21M", hazard: 45, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2008, stories: 7,  sqFt: 104000, sprinklerType: "Wet Pipe", buildingValue: "$18M" },
        { loc: "Fort Wayne Inn",              state: "IN", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 48, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1994, stories: 3,  sqFt: 42000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Columbus Convention Hotel",   state: "OH", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$22M", hazard: 46, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2006, stories: 7,  sqFt: 108000, sprinklerType: "Wet Pipe", buildingValue: "$19M" },
        { loc: "Cleveland Lakefront Hotel",   state: "OH", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 42, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1990, stories: 5,  sqFt: 72000,  sprinklerType: "None",     buildingValue: "$10M" },
        { loc: "Cincinnati Hotel",            state: "OH", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 49, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1983, stories: 3,  sqFt: 46000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Pittsburgh Downtown Hotel",   state: "PA", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$19M", hazard: 37, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2009, stories: 7,  sqFt: 94000,  sprinklerType: "Wet Pipe", buildingValue: "$16M" },
        { loc: "Philadelphia Center Hotel",   state: "PA", construction: "Fire Resist.",  protectionCode: "PC 1", occupancy: "Hotel / Hospitality", tiv: "$28M", hazard: 34, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2003, stories: 10, sqFt: 138000, sprinklerType: "Wet Pipe", buildingValue: "$24M" },
        { loc: "Louisville Inn",              state: "KY", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 45, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1992, stories: 4,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Albuquerque Hotel",           state: "NM", construction: "Masonry NC",    protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 39, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1990, stories: 3,  sqFt: 46000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Santa Fe Adobe Inn",          state: "NM", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$7M",  hazard: 42, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1975, stories: 2,  sqFt: 36000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Salt Lake City Hotel",        state: "UT", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$16M", hazard: 44, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2010, stories: 6,  sqFt: 78000,  sprinklerType: "Wet Pipe", buildingValue: "$14M" },
        { loc: "Park City Mountain Inn",      state: "UT", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 47, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1999, stories: 4,  sqFt: 58000,  sprinklerType: "None",     buildingValue: "$8M" },
        { loc: "Boise Airport Hotel",         state: "ID", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1997, stories: 3,  sqFt: 42000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Anchorage Downtown Hotel",    state: "AK", construction: "Fire Resist.",  protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 52, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 1988, stories: 5,  sqFt: 56000,  sprinklerType: "Wet Pipe", buildingValue: "$8M" },
        { loc: "Fairbanks Lodge",             state: "AK", construction: "Frame",         protectionCode: "PC 6", occupancy: "Hotel / Hospitality", tiv: "$5M",  hazard: 55, catModel: "Required",  healthCheck: "Flag",   constructionClass: "Class 1 — Frame",           yearBuilt: 1973, stories: 2,  sqFt: 28000,  sprinklerType: "None",     buildingValue: "$3M" },
        { loc: "Baltimore Harbor Hotel",      state: "MD", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$20M", hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2004, stories: 7,  sqFt: 98000,  sprinklerType: "Wet Pipe", buildingValue: "$17M", floodZone: "AE", distanceToCoast: "0.1 mi" },
        { loc: "Annapolis Inn",               state: "MD", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$9M",  hazard: 41, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1986, stories: 3,  sqFt: 46000,  sprinklerType: "None",     buildingValue: "$6M" },
        { loc: "Detroit Riverfront Hotel",    state: "MI", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$17M", hazard: 40, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2007, stories: 6,  sqFt: 84000,  sprinklerType: "Wet Pipe", buildingValue: "$14M" },
        { loc: "Grand Rapids Inn",            state: "MI", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 38, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1993, stories: 3,  sqFt: 42000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Milwaukee Lake Hotel",        state: "WI", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$14M", hazard: 36, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2012, stories: 5,  sqFt: 70000,  sprinklerType: "Wet Pipe", buildingValue: "$12M" },
        { loc: "Madison Capitol Inn",         state: "WI", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$7M",  hazard: 34, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1991, stories: 3,  sqFt: 36000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Oklahoma City Hotel",         state: "OK", construction: "Fire Resist.",  protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$12M", hazard: 62, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2001, stories: 5,  sqFt: 60000,  sprinklerType: "Wet Pipe", buildingValue: "$10M" },
        { loc: "Tulsa Convention Hotel",      state: "OK", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$7M",  hazard: 59, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1984, stories: 3,  sqFt: 36000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Omaha Downtown Hotel",        state: "NE", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 47, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1995, stories: 4,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Des Moines Hotel",            state: "IA", construction: "Masonry NC",    protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$8M",  hazard: 44, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1988, stories: 3,  sqFt: 42000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Wichita Convention Inn",      state: "KS", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$6M",  hazard: 58, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1980, stories: 2,  sqFt: 32000,  sprinklerType: "None",     buildingValue: "$4M" },
        { loc: "Jackson Hole Resort",         state: "WY", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$10M", hazard: 46, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1990, stories: 3,  sqFt: 52000,  sprinklerType: "None",     buildingValue: "$7M" },
        { loc: "Cheyenne Inn",                state: "WY", construction: "Frame",         protectionCode: "PC 5", occupancy: "Hotel / Hospitality", tiv: "$5M",  hazard: 44, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1978, stories: 2,  sqFt: 28000,  sprinklerType: "None",     buildingValue: "$3M" },
        { loc: "Providence Hotel",            state: "RI", construction: "Masonry NC",    protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$11M", hazard: 33, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1994, stories: 4,  sqFt: 56000,  sprinklerType: "Wet Pipe", buildingValue: "$8M" },
        { loc: "Hartford Convention Hotel",   state: "CT", construction: "Fire Resist.",  protectionCode: "PC 2", occupancy: "Hotel / Hospitality", tiv: "$13M", hazard: 31, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 6 — Fire Resistive",  yearBuilt: 2001, stories: 5,  sqFt: 64000,  sprinklerType: "Wet Pipe", buildingValue: "$11M" },
        { loc: "Manchester NH Hotel",         state: "NH", construction: "Masonry NC",    protectionCode: "PC 3", occupancy: "Hotel / Hospitality", tiv: "$7M",  hazard: 32, catModel: "Modelled",  healthCheck: "Pass",   constructionClass: "Class 2 — Masonry NC",      yearBuilt: 1989, stories: 3,  sqFt: 36000,  sprinklerType: "None",     buildingValue: "$5M" },
        { loc: "Burlington VT Hotel",         state: "VT", construction: "Frame",         protectionCode: "PC 4", occupancy: "Hotel / Hospitality", tiv: "$6M",  hazard: 34, catModel: "Pending",   healthCheck: "Pass",   constructionClass: "Class 1 — Frame",           yearBuilt: 1983, stories: 3,  sqFt: 30000,  sprinklerType: "None",     buildingValue: "$4M" },
      ],
    },
    request: {
      perils: ["All Risk (AOP)", "Earthquake", "Wildfire", "Flood"],
      limitsSought: "$25M per occurrence",
      qbeLayer: "$10M xs $5M",
      towerPosition: "Layer 2 of 4 (Second Excess)",
      leadCarriers: ["Markel — $5M Primary (Lead)", "Starr — $5M xs $15M", "Everest Re — $5M xs $20M"],
      valuationMethod: "Replacement Cost (RCV); agreed value on flagship properties",
    },
    hazardByConstruction: "Mixed wood-frame and Type II — wood-frame properties elevate the hazard band.",
    hazardByOccupancy: "Hotel occupancy with restaurant exposure raises ignition frequency.",
    lossHistory: {
      lossRatio: "0.29", lossRatioBand: "watch", claimsYears: 5,
      summary: "5-year loss ratio 0.29 — moderate. One claim pierced the first-layer attachment following a seismic event.",
      topLocations: [
        { loc: "Santa Monica Resort", paid: "$6.1M", reportedNotPaid: "$0.8M", count: 1 },
        { loc: "Burbank Hotel", paid: "$218K", reportedNotPaid: "$0", count: 2 },
        { loc: "Pasadena Inn", paid: "$74K", reportedNotPaid: "$0", count: 1 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$74K" },
        { year: 2022, paid: "$6.1M" },
        { year: 2023, paid: "$0" },
        { year: 2024, paid: "$218K" },
        { year: 2025, paid: "$0" },
      ],
      layerPenetration: {
        attachmentPoint: "$5M",
        annualAggregateLimit: "$10M",
        claimsPiercingLayer: 1,
        yearsBreach: 0,
        largestLoss: "$6.1M (2022 — EQ damage, Santa Monica)",
        piercingEvents: [
          { peril: "Earthquake", amount: "$6.1M", year: 2022, location: "Santa Monica Resort" },
        ],
      },
    },
  },
  "SUB-2026-1103": {
    focusNote: "TX, FL, CA — CAT accumulation across 38 states; full-portfolio CAT model run (6,512 of 20,485 locations modelled to date) and completed SOV required before bind. Facultative committee referral required — TIV $13.0B exceeds $350M single-risk authority.",
    request: {
      perils: ["All Risk (AOP)", "Named Windstorm", "Flood", "Earthquake", "Wildfire"],
      limitsSought: "$450M xs $50M",
      qbeLayer: "$50M xs $200M",
      towerPosition: "Layer 3 of 5 (Mid Excess)",
      leadCarriers: ["FM Global — $50M Primary (Lead, SIR $50M below)", "AIG/Zurich — $100M xs $100M (co-lead)", "Chubb — $100M xs $250M", "Layer 5 — TBD"],
      valuationMethod: "Replacement Cost (RCV); business income on ALS basis",
    },
    hazardByConstruction: "Predominantly steel frame/ISO 4 — moderate fire hazard band; scale drives severity risk across 20,485 locations.",
    hazardByOccupancy: "Diversified manufacturing — moderate ignition load across 38 states; 71% of TIV in manufacturing occupancy.",
    documents: [
      { name: "Application", received: true, date: "03 Aug 2026", needsReview: false },
      { name: "Primary Policy", received: true, date: "04 Aug 2026", needsReview: true, reviewReason: "FM Global HPR conditions attach to all layers — verify endorsement cascade." },
      { name: "Risk Engineering Report", received: true, date: "12 Aug 2026", needsReview: true, reviewReason: "79 of 120 largest locations not yet surveyed — surveys required before bind." },
      { name: "Loss History", received: true, date: "03 Aug 2026", needsReview: false },
    ],
    sov: {
      modellingReady: false, completenessPct: 64,
      dataCleansingNote: "6,512 of 20,485 locations individually valued; 13,973 blanket-reported sites require cleanse and re-value before full CAT model submission.",
      stats: { totalTIV: "$13.0B", locationCount: 20485, topState: "TX", avgHazard: 58 },
      buildingValue: "7,800,000,000", contentsValue: "2,600,000,000", biValue: "2,600,000,000",
      biIndemnityPeriod: "18 months", biWaitingPeriod: "72 hours", coinsurance: "90",
      yearBuiltRange: "1958–2024 across 20,485 locations",
      locations: [],
      locationsLoader: loadHeartlandSOV,
    },
    lossHistory: {
      lossRatio: "0.31", lossRatioBand: "watch", claimsYears: 5,
      claimsCount: 47, largestLoss: "15,800,000", netLosses: "$26.2M", grossLosses: "$29.6M", ibnr: "$3.1M",
      lossRunYears: "5 years: 2021–2025",
      summary: "5-year net loss ratio 0.31 — moderate. 47 claims across 38 states. One layer-piercing event (2022 EF-2 tornado, Gary IN — $15.8M). Losses otherwise attritional and well within attachment. Two open claims (2025): fire in Gary IN (vendor litigation) and wildfire smoke exposure in Phoenix AZ.",
      topLocations: [
        { loc: "HIH-000412 — Gary, IN",          paid: "$15.9M", reportedNotPaid: "$0",    count: 3 },
        { loc: "HIH-000188 — Gary, IN",          paid: "$2.5M",  reportedNotPaid: "$0.9M", count: 1 },
        { loc: "HIH-000955 — Nashville, TN",     paid: "$2.1M",  reportedNotPaid: "$0",    count: 2 },
        { loc: "HIH-002310 — Phoenix, AZ",       paid: "$1.5M",  reportedNotPaid: "$0.3M", count: 1 },
        { loc: "HIH-001420 — Pittsburgh, PA",    paid: "$0.7M",  reportedNotPaid: "$0",    count: 7 },
        { loc: "HIH-014220 — Houston, TX",       paid: "$0.6M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "HIH-019300 — Richmond, VA",      paid: "$0.5M",  reportedNotPaid: "$0",    count: 5 },
        { loc: "HIH-015200 — Louisville, KY",    paid: "$0.4M",  reportedNotPaid: "$0",    count: 5 },
        { loc: "HIH-008100 — Seattle, WA",       paid: "$0.4M",  reportedNotPaid: "$0",    count: 2 },
        { loc: "HIH-003040 — Atlanta, GA",       paid: "$0.3M",  reportedNotPaid: "$0",    count: 4 },
        { loc: "HIH-013900 — Milwaukee, WI",     paid: "$0.3M",  reportedNotPaid: "$0",    count: 3 },
        { loc: "HIH-016700 — Greenville, SC",    paid: "$0.2M",  reportedNotPaid: "$0",    count: 3 },
        { loc: "HIH-012500 — St. Louis, MO",     paid: "$0.2M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "HIH-005200 — Phoenix, AZ",       paid: "$0.2M",  reportedNotPaid: "$0",    count: 2 },
        { loc: "HIH-009900 — Los Angeles, CA",   paid: "$0.2M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "HIH-011200 — Tampa, FL",         paid: "$0.2M",  reportedNotPaid: "$0",    count: 2 },
        { loc: "HIH-018100 — Birmingham, AL",    paid: "$0.1M",  reportedNotPaid: "$0",    count: 2 },
        { loc: "HIH-007300 — Nashville, TN",     paid: "$46K",   reportedNotPaid: "$0",    count: 1 },
        { loc: "HIH-006600 — Columbus, OH",      paid: "$24K",   reportedNotPaid: "$0",    count: 1 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$1.2M" },
        { year: 2022, paid: "$18.4M" },
        { year: 2023, paid: "$2.1M" },
        { year: 2024, paid: "$0.6M" },
        { year: 2025, paid: "$3.9M" },
      ],
      layerPenetration: {
        attachmentPoint: "$50M",
        annualAggregateLimit: "$50M",
        claimsPiercingLayer: 1,
        yearsBreach: 0,
        largestLoss: "$15.8M (2022 — EF-2 Tornado, Gary IN)",
        piercingEvents: [],
      },
      claims: [
        { claimId: "HIH-CLM-0024", locId: "HIH-019300", location: "Richmond, VA", lossDate: "2021-01-03", reportDate: "2021-01-04", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 34736, caseReserve: 1526, incurred: 36262, ibnr: 153, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0015", locId: "HIH-015200", location: "Louisville, KY", lossDate: "2021-01-10", reportDate: "2021-01-11", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 104749, caseReserve: 1794, incurred: 106543, ibnr: 179, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0016", locId: "HIH-007300", location: "Nashville, TN", lossDate: "2021-02-11", reportDate: "2021-02-16", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 46133, caseReserve: 2503, incurred: 48636, ibnr: 250, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0021", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2021-05-12", reportDate: "2021-05-16", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 85557, caseReserve: 3685, incurred: 89242, ibnr: 368, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0025", locId: "HIH-018100", location: "Birmingham, AL", lossDate: "2021-05-25", reportDate: "2021-05-28", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 64025, caseReserve: 2070, incurred: 66095, ibnr: 207, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0006", locId: "HIH-003040", location: "Atlanta, GA", lossDate: "2021-05-26", reportDate: "2021-05-28", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 89317, caseReserve: 5189, incurred: 94506, ibnr: 519, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0022", locId: "HIH-015200", location: "Louisville, KY", lossDate: "2021-06-07", reportDate: "2021-06-08", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 50524, caseReserve: 1647, incurred: 52171, ibnr: 165, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0011", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2021-06-18", reportDate: "2021-06-20", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 81390, caseReserve: 2903, incurred: 84293, ibnr: 290, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0014", locId: "HIH-011200", location: "Tampa, FL", lossDate: "2021-07-11", reportDate: "2021-07-13", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 43385, caseReserve: 2101, incurred: 45486, ibnr: 210, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0013", locId: "HIH-018100", location: "Birmingham, AL", lossDate: "2021-07-14", reportDate: "2021-07-17", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 37844, caseReserve: 2263, incurred: 40107, ibnr: 226, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0017", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2021-08-17", reportDate: "2021-08-20", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 74742, caseReserve: 1009, incurred: 75751, ibnr: 101, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0023", locId: "HIH-003040", location: "Atlanta, GA", lossDate: "2021-08-17", reportDate: "2021-08-20", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 32622, caseReserve: 650, incurred: 33272, ibnr: 65, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0008", locId: "HIH-013900", location: "Milwaukee, WI", lossDate: "2021-08-23", reportDate: "2021-08-28", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 105835, caseReserve: 7081, incurred: 112916, ibnr: 708, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0010", locId: "HIH-019300", location: "Richmond, VA", lossDate: "2021-09-25", reportDate: "2021-09-28", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 53354, caseReserve: 2838, incurred: 56192, ibnr: 284, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0012", locId: "HIH-016700", location: "Greenville, SC", lossDate: "2021-10-04", reportDate: "2021-10-06", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 63744, caseReserve: 1396, incurred: 65140, ibnr: 140, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0020", locId: "HIH-015200", location: "Louisville, KY", lossDate: "2021-10-06", reportDate: "2021-10-09", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 45065, caseReserve: 169, incurred: 45234, ibnr: 17, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0019", locId: "HIH-003040", location: "Atlanta, GA", lossDate: "2021-11-16", reportDate: "2021-11-18", peril: "Wind / Hail", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 63692, caseReserve: 1131, incurred: 64823, ibnr: 113, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0007", locId: "HIH-013900", location: "Milwaukee, WI", lossDate: "2021-11-21", reportDate: "2021-11-24", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 70709, caseReserve: 4988, incurred: 75697, ibnr: 499, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0018", locId: "HIH-005200", location: "Phoenix, AZ", lossDate: "2021-12-02", reportDate: "2021-12-06", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 28569, caseReserve: 1230, incurred: 29799, ibnr: 123, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0009", locId: "HIH-006600", location: "Columbus, OH", lossDate: "2021-12-26", reportDate: "2021-12-27", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 24007, caseReserve: 1747, incurred: 25754, ibnr: 175, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0027", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2022-01-09", reportDate: "2022-01-11", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 122730, caseReserve: 422, incurred: 123152, ibnr: 42, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0028", locId: "HIH-016700", location: "Greenville, SC", lossDate: "2022-02-02", reportDate: "2022-02-05", peril: "Lightning", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 102589, caseReserve: 1151, incurred: 103740, ibnr: 115, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0035", locId: "HIH-000412", location: "Houston, TX", lossDate: "2022-02-03", reportDate: "2022-02-05", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 43091, caseReserve: 1343, incurred: 44434, ibnr: 134, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0044", locId: "HIH-013900", location: "Milwaukee, WI", lossDate: "2022-02-10", reportDate: "2022-02-12", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 94654, caseReserve: 428, incurred: 95082, ibnr: 43, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0030", locId: "HIH-005200", location: "Phoenix, AZ", lossDate: "2022-02-13", reportDate: "2022-02-14", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 145157, caseReserve: 6449, incurred: 151606, ibnr: 645, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0046", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2022-02-25", reportDate: "2022-02-28", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 82384, caseReserve: 2892, incurred: 85276, ibnr: 289, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0029", locId: "HIH-015200", location: "Louisville, KY", lossDate: "2022-04-05", reportDate: "2022-04-06", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 126086, caseReserve: 9214, incurred: 135300, ibnr: 921, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0042", locId: "HIH-011200", location: "Tampa, FL", lossDate: "2022-04-19", reportDate: "2022-04-23", peril: "Vandalism", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 129257, caseReserve: 3899, incurred: 133156, ibnr: 390, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0031", locId: "HIH-003040", location: "Atlanta, GA", lossDate: "2022-05-04", reportDate: "2022-05-07", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 104671, caseReserve: 861, incurred: 105532, ibnr: 86, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0047", locId: "HIH-008100", location: "Seattle, WA", lossDate: "2022-05-12", reportDate: "2022-05-13", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 173068, caseReserve: 5125, incurred: 178193, ibnr: 512, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0001", locId: "HIH-000412", location: "Gary, IN", lossDate: "2022-05-14", reportDate: "2022-05-15", peril: "Tornado / Wind", catEvent: "Midwest Tornado Outbreak — May 2022", status: "Closed", paid: 15800000, caseReserve: 0, incurred: 15800000, ibnr: 0, deductible: "$250,000 AOP", layerAttached: "Primary / Underlying — pierces $50M SIR", adjuster: "Crawford & Company", litigation: false, subrogationPotential: true, subrogationRecovered: 420000, reopened: false, complexity: "High", reserveAdequacy: "Medium — reserve fully paid; 2 subrogation actions against contractor still in discovery", notes: "Total loss to main production bay roof and equipment; EF-2 tornado. Business-income claim under active review; largest single loss on the account and the event that pierces the $50M SIR." },
        { claimId: "HIH-CLM-0026", locId: "HIH-015200", location: "Louisville, KY", lossDate: "2022-05-28", reportDate: "2022-05-28", peril: "Lightning", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 64550, caseReserve: 185, incurred: 64735, ibnr: 18, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0043", locId: "HIH-019300", location: "Richmond, VA", lossDate: "2022-06-11", reportDate: "2022-06-16", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 146156, caseReserve: 3710, incurred: 149866, ibnr: 371, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0037", locId: "HIH-000412", location: "Houston, TX", lossDate: "2022-06-17", reportDate: "2022-06-21", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 50503, caseReserve: 3646, incurred: 54149, ibnr: 365, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0034", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2022-06-23", reportDate: "2022-06-26", peril: "Lightning", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 187022, caseReserve: 7421, incurred: 194443, ibnr: 742, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0041", locId: "HIH-001420", location: "Pittsburgh, PA", lossDate: "2022-07-25", reportDate: "2022-07-28", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 98669, caseReserve: 5456, incurred: 104125, ibnr: 546, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0038", locId: "HIH-009900", location: "Los Angeles, CA", lossDate: "2022-08-10", reportDate: "2022-08-15", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 165771, caseReserve: 11132, incurred: 176903, ibnr: 1113, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0045", locId: "HIH-000955", location: "Chicago, IL", lossDate: "2022-09-02", reportDate: "2022-09-04", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 33118, caseReserve: 2524, incurred: 35642, ibnr: 252, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0032", locId: "HIH-012500", location: "St. Louis, MO", lossDate: "2022-09-15", reportDate: "2022-09-16", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 174168, caseReserve: 3097, incurred: 177265, ibnr: 310, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0040", locId: "HIH-019300", location: "Richmond, VA", lossDate: "2022-09-26", reportDate: "2022-09-28", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 193087, caseReserve: 13383, incurred: 206470, ibnr: 1338, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0036", locId: "HIH-016700", location: "Greenville, SC", lossDate: "2022-10-06", reportDate: "2022-10-07", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 80374, caseReserve: 3864, incurred: 84238, ibnr: 386, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0039", locId: "HIH-019300", location: "Richmond, VA", lossDate: "2022-10-14", reportDate: "2022-10-19", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 94061, caseReserve: 4954, incurred: 99015, ibnr: 495, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0033", locId: "HIH-008100", location: "Seattle, WA", lossDate: "2022-10-25", reportDate: "2022-10-28", peril: "Vandalism", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 188834, caseReserve: 1268, incurred: 190102, ibnr: 127, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "HIH-CLM-0002", locId: "HIH-000955", location: "Nashville, TN", lossDate: "2023-04-02", reportDate: "2023-04-04", peril: "Wind / Hail", catEvent: "Severe Convective Storm — April 2023", status: "Closed", paid: 2100000, caseReserve: 0, incurred: 2100000, ibnr: 0, deductible: "$250,000 AOP", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Medium", reserveAdequacy: "High — fully developed and closed", notes: "Hail damage to roof membrane and rooftop HVAC across warehouse complex; straightforward property claim." },
        { claimId: "HIH-CLM-0003", locId: "HIH-014220", location: "Houston, TX", lossDate: "2024-08-19", reportDate: "2024-08-21", peril: "Wind / Hail", catEvent: "Tropical Storm Remnant — August 2024", status: "Closed", paid: 600000, caseReserve: 0, incurred: 600000, ibnr: 0, deductible: "$250,000 AOP", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High — fully developed and closed", notes: "Minor roof and siding damage; below facultative referral threshold." },
        { claimId: "HIH-CLM-0004", locId: "HIH-000188", location: "Gary, IN", lossDate: "2025-03-11", reportDate: "2025-03-13", peril: "Fire", catEvent: "Not applicable", status: "Open", paid: 2450000, caseReserve: 900000, incurred: 3350000, ibnr: 350000, deductible: "$250,000 AOP", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: true, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "High", reserveAdequacy: "Low — litigation ongoing with equipment vendor; reserve may develop upward pending liability determination", notes: "Electrical fire in tooling area, suspected equipment failure; vendor liability dispute ongoing, reserve carries uncertainty." },
        { claimId: "HIH-CLM-0005", locId: "HIH-002310", location: "Phoenix, AZ", lossDate: "2025-07-22", reportDate: "2025-07-24", peril: "Wildfire (Exposure)", catEvent: "Southwest Wildfire Season 2025", status: "Open", paid: 1450000, caseReserve: 300000, incurred: 1750000, ibnr: 150000, deductible: "$250,000 AOP", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Medium", reserveAdequacy: "Medium — smoke/ash remediation costs still being finalized", notes: "Smoke and ash contamination to finished-goods inventory from nearby wildfire; no structural damage." },
      ],
    },
  },
  "SUB-2026-1287": {
    focusNote: "Miami named-storm exposure (data annex) and London HQ tower electrical fire — both layer-piercing events in prior 5 years. Renewal rate increase required; risk improvement plan is a condition of renewal.",
    request: {
      perils: ["All Risk (AOP)", "Flood", "Named Windstorm"],
      limitsSought: "$200M xs $50M",
      qbeLayer: "$25M xs $175M",
      towerPosition: "Layer 4 of 4 (High Excess)",
      leadCarriers: ["AIG Property Casualty — $25M xs $50M (Lead)", "Allianz — $50M xs $75M", "AXA XL — $50M xs $125M"],
      valuationMethod: "Replacement Cost (RCV); business income on ALS basis",
    },
    hazardByConstruction: "Predominantly fire-resistive high-rise and data-center — low fire hazard band; high business-interruption severity.",
    hazardByOccupancy: "Office and data processing — low ignition load, high BI dependency and concentration of critical infrastructure.",
    documents: [
      { name: "Application", received: true, date: "01 Sep 2026", needsReview: false },
      { name: "Primary Policy", received: true, date: "02 Sep 2026", needsReview: false },
      { name: "Risk Engineering Report", received: true, date: "06 Sep 2026", needsReview: true, reviewReason: "HQ tower survey renewal due — expiring survey on file." },
      { name: "Loss History", received: true, date: "01 Sep 2026", needsReview: false },
    ],
    sov: {
      modellingReady: true, completenessPct: 91,
      dataCleansingNote: "Minor address standardization outstanding for 4 international locations; no material impact on TIV or modelling.",
      stats: { totalTIV: "$1.85B", locationCount: 46, topState: "NY", avgHazard: 31 },
      buildingValue: "1,150,000,000", contentsValue: "350,000,000", biValue: "350,000,000",
      biIndemnityPeriod: "24 months", biWaitingPeriod: "48 hours", coinsurance: "100",
      yearBuiltRange: "1971–2021 across 46 locations",
      locations: [
        { loc: "MGF-001 — New York, NY", state: "NY", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$328M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1993, stories: 29, sqFt: 660512, sprinklerType: "Wet Pipe", buildingValue: "$323M", contentsValue: "$4M", biValue: "$0.3M" },
        { loc: "MGF-002 — Ashburn, VA", state: "VA", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Data Processing", tiv: "$127M", hazard: 30, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2007, stories: 1, sqFt: 141880, sprinklerType: "Wet Pipe", buildingValue: "$110M", contentsValue: "$3M", biValue: "$14M" },
        { loc: "MGF-003 — Piscataway, NJ", state: "NJ", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Data Processing", tiv: "$41M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1996, stories: 1, sqFt: 146459, sprinklerType: "Wet Pipe", buildingValue: "$22M", contentsValue: "$0.3M", biValue: "$18M" },
        { loc: "MGF-004 — Charlotte, NC", state: "NC", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Data Processing", tiv: "$51M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2019, stories: 1, sqFt: 254529, sprinklerType: "Wet Pipe", buildingValue: "$50M", contentsValue: "$0.1M", biValue: "$1M" },
        { loc: "MGF-005 — Chicago, IL", state: "IL", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$28M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1980, stories: 8, sqFt: 298515, sprinklerType: "Wet Pipe", buildingValue: "$22M", contentsValue: "$2M", biValue: "$4M" },
        { loc: "MGF-006 — Boston, MA", state: "MA", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$51M", hazard: 32, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1992, stories: 4, sqFt: 35641, sprinklerType: "Wet Pipe", buildingValue: "$1M", contentsValue: "$25M", biValue: "$26M" },
        { loc: "MGF-007 — Dallas, TX", state: "TX", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$7M", hazard: 50, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2002, stories: 8, sqFt: 127971, sprinklerType: "Wet Pipe", buildingValue: "$4M", contentsValue: "$2M", biValue: "$0.8M" },
        { loc: "MGF-008 — Miami, FL", state: "FL", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$5M", hazard: 82, catModel: "Modelled", healthCheck: "Flag", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1982, stories: 12, sqFt: 314191, sprinklerType: "Wet Pipe", buildingValue: "$1M", contentsValue: "$0.2M", biValue: "$3M", floodZone: "AE", distanceToCoast: "0.8 mi" },
        { loc: "MGF-009 — San Francisco, CA", state: "CA", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$78M", hazard: 38, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1971, stories: 6, sqFt: 295919, sprinklerType: "Wet Pipe", buildingValue: "$19M", contentsValue: "$9M", biValue: "$49M" },
        { loc: "MGF-010 — London, United Kingdom", state: "United Kingdom", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$73M", hazard: 28, catModel: "Modelled", healthCheck: "Review", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1989, stories: 3, sqFt: 209788, sprinklerType: "Wet Pipe", buildingValue: "$62M", contentsValue: "$11M", biValue: "$0.3M" },
        { loc: "MGF-011 — Frankfurt, Germany", state: "Germany", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$10M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1979, stories: 4, sqFt: 115949, sprinklerType: "Wet Pipe", buildingValue: "$0.4M", contentsValue: "$2M", biValue: "$7M" },
        { loc: "MGF-012 — Dublin, Ireland", state: "Ireland", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Data Processing", tiv: "$68M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2010, stories: 1, sqFt: 108978, sprinklerType: "Wet Pipe", buildingValue: "$60M", contentsValue: "$5M", biValue: "$3M" },
        { loc: "MGF-013 — Paris, France", state: "France", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$62M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1986, stories: 2, sqFt: 138651, sprinklerType: "Wet Pipe", buildingValue: "$27M", contentsValue: "$0.2M", biValue: "$35M" },
        { loc: "MGF-014 — Zurich, Switzerland", state: "Switzerland", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$7M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1989, stories: 12, sqFt: 269607, sprinklerType: "Wet Pipe", buildingValue: "$2M", contentsValue: "$4M", biValue: "$0.1M" },
        { loc: "MGF-015 — Singapore", state: "Singapore", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$19M", hazard: 35, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1980, stories: 5, sqFt: 261416, sprinklerType: "Wet Pipe", buildingValue: "$2M", contentsValue: "$11M", biValue: "$6M" },
        { loc: "MGF-016 — Hong Kong SAR", state: "Hong Kong SAR", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$39M", hazard: 50, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1975, stories: 3, sqFt: 179393, sprinklerType: "Wet Pipe", buildingValue: "$38M", contentsValue: "$2M", biValue: "$0.05M" },
        { loc: "MGF-017 — Tokyo, Japan", state: "Japan", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$11M", hazard: 70, catModel: "Modelled", healthCheck: "Flag", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1977, stories: 5, sqFt: 303762, sprinklerType: "Wet Pipe", buildingValue: "$0.2M", contentsValue: "$5M", biValue: "$6M" },
        { loc: "MGF-018 — Toronto, Canada", state: "Canada", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$67M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2005, stories: 6, sqFt: 70195, sprinklerType: "Wet Pipe", buildingValue: "$41M", contentsValue: "$27M", biValue: "$0.06M" },
        { loc: "MGF-019 — Sao Paulo, Brazil", state: "Brazil", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$42M", hazard: 38, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2002, stories: 9, sqFt: 30597, sprinklerType: "Wet Pipe", buildingValue: "$0.6M", contentsValue: "$41M", biValue: "$0.2M" },
        { loc: "MGF-020 — Mumbai, India", state: "India", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$15M", hazard: 42, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2012, stories: 9, sqFt: 317660, sprinklerType: "Wet Pipe", buildingValue: "$4M", contentsValue: "$4M", biValue: "$7M" },
        { loc: "MGF-021 — Sydney, Australia", state: "Australia", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$71M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2003, stories: 7, sqFt: 294745, sprinklerType: "Wet Pipe", buildingValue: "$4M", contentsValue: "$36M", biValue: "$31M" },
        { loc: "MGF-022 — Johannesburg, South Africa", state: "South Africa", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$14M", hazard: 32, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2013, stories: 4, sqFt: 248832, sprinklerType: "Wet Pipe", buildingValue: "$12M", contentsValue: "$1M", biValue: "$0.5M" },
        { loc: "MGF-023 — Los Angeles, CA", state: "CA", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$57M", hazard: 42, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2011, stories: 8, sqFt: 25830, sprinklerType: "Wet Pipe", buildingValue: "$8M", contentsValue: "$49M", biValue: "$0.3M" },
        { loc: "MGF-024 — Atlanta, GA", state: "GA", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$15M", hazard: 35, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1999, stories: 3, sqFt: 206407, sprinklerType: "None", buildingValue: "$5M", contentsValue: "$0.5M", biValue: "$10M" },
        { loc: "MGF-025 — Denver, CO", state: "CO", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$10M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1978, stories: 10, sqFt: 220482, sprinklerType: "Wet Pipe", buildingValue: "$3M", contentsValue: "$6M", biValue: "$1M" },
        { loc: "MGF-026 — Seattle, WA", state: "WA", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$8M", hazard: 30, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1998, stories: 2, sqFt: 39795, sprinklerType: "Wet Pipe", buildingValue: "$3M", contentsValue: "$2M", biValue: "$3M" },
        { loc: "MGF-027 — Houston, TX", state: "TX", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$28M", hazard: 65, catModel: "Modelled", healthCheck: "Flag", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1989, stories: 2, sqFt: 287077, sprinklerType: "None", buildingValue: "$4M", contentsValue: "$23M", biValue: "$1M", floodZone: "X" },
        { loc: "MGF-028 — Edinburgh, United Kingdom", state: "United Kingdom", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$16M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1990, stories: 2, sqFt: 119060, sprinklerType: "Wet Pipe", buildingValue: "$7M", contentsValue: "$2M", biValue: "$8M" },
        { loc: "MGF-029 — Munich, Germany", state: "Germany", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$62M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2017, stories: 7, sqFt: 124551, sprinklerType: "None", buildingValue: "$57M", contentsValue: "$4M", biValue: "$0.4M" },
        { loc: "MGF-030 — Milan, Italy", state: "Italy", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$8M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1987, stories: 10, sqFt: 287786, sprinklerType: "Wet Pipe", buildingValue: "$3M", contentsValue: "$1M", biValue: "$3M" },
        { loc: "MGF-031 — Madrid, Spain", state: "Spain", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$7M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2005, stories: 10, sqFt: 212108, sprinklerType: "Wet Pipe", buildingValue: "$1M", contentsValue: "$5M", biValue: "$2M" },
        { loc: "MGF-032 — Luxembourg", state: "Luxembourg", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$47M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1995, stories: 11, sqFt: 132298, sprinklerType: "Wet Pipe", buildingValue: "$45M", contentsValue: "$2M", biValue: "$0.5M" },
        { loc: "MGF-033 — Shanghai, China", state: "China", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$19M", hazard: 45, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1977, stories: 8, sqFt: 198270, sprinklerType: "Wet Pipe", buildingValue: "$13M", contentsValue: "$4M", biValue: "$2M" },
        { loc: "MGF-034 — Osaka, Japan", state: "Japan", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$21M", hazard: 80, catModel: "Pending", healthCheck: "Review", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2012, stories: 10, sqFt: 226752, sprinklerType: "Wet Pipe", buildingValue: "$18M", contentsValue: "$1M", biValue: "$2M" },
        { loc: "MGF-035 — Melbourne, Australia", state: "Australia", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$10M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1985, stories: 11, sqFt: 78903, sprinklerType: "Wet Pipe", buildingValue: "$6M", contentsValue: "$2M", biValue: "$2M" },
        { loc: "MGF-036 — Rio de Janeiro, Brazil", state: "Brazil", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$129M", hazard: 35, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1979, stories: 12, sqFt: 145863, sprinklerType: "Wet Pipe", buildingValue: "$120M", contentsValue: "$2M", biValue: "$7M" },
        { loc: "MGF-037 — Delhi, India", state: "India", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$51M", hazard: 40, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1992, stories: 6, sqFt: 64771, sprinklerType: "Wet Pipe", buildingValue: "$29M", contentsValue: "$1M", biValue: "$21M" },
        { loc: "MGF-038 — Cape Town, South Africa", state: "South Africa", construction: "Fire Resist.", protectionCode: "PC 2", occupancy: "Office", tiv: "$6M", hazard: 30, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1993, stories: 12, sqFt: 56430, sprinklerType: "Wet Pipe", buildingValue: "$0.1M", contentsValue: "$2M", biValue: "$4M" },
        { loc: "MGF-039 — Montreal, Canada", state: "Canada", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$20M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2013, stories: 9, sqFt: 276876, sprinklerType: "Wet Pipe", buildingValue: "$5M", contentsValue: "$14M", biValue: "$1M" },
        { loc: "MGF-040 — Vancouver, Canada", state: "Canada", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$6M", hazard: 28, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1982, stories: 12, sqFt: 16425, sprinklerType: "Wet Pipe", buildingValue: "$3M", contentsValue: "$0.2M", biValue: "$3M" },
        { loc: "MGF-041 — Geneva, Switzerland", state: "Switzerland", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$38M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2012, stories: 10, sqFt: 184835, sprinklerType: "Wet Pipe", buildingValue: "$4M", contentsValue: "$5M", biValue: "$29M" },
        { loc: "MGF-042 — Amsterdam, Netherlands", state: "Netherlands", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$13M", hazard: 30, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1980, stories: 6, sqFt: 21363, sprinklerType: "Wet Pipe", buildingValue: "$7M", contentsValue: "$3M", biValue: "$3M" },
        { loc: "MGF-043 — Brussels, Belgium", state: "Belgium", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$6M", hazard: 25, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1974, stories: 12, sqFt: 34035, sprinklerType: "None", buildingValue: "$2M", contentsValue: "$1M", biValue: "$3M" },
        { loc: "MGF-044 — Stockholm, Sweden", state: "Sweden", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$34M", hazard: 20, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2011, stories: 6, sqFt: 180910, sprinklerType: "Wet Pipe", buildingValue: "$1M", contentsValue: "$7M", biValue: "$26M" },
        { loc: "MGF-045 — Warsaw, Poland", state: "Poland", construction: "Fire Resist.", protectionCode: "PC 1", occupancy: "Office", tiv: "$15M", hazard: 22, catModel: "Modelled", healthCheck: "Pass", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 2011, stories: 12, sqFt: 226206, sprinklerType: "Wet Pipe", buildingValue: "$3M", contentsValue: "$10M", biValue: "$3M" },
        { loc: "MGF-046 — Manila, Philippines", state: "Philippines", construction: "Fire Resist.", protectionCode: "PC 3", occupancy: "Office", tiv: "$8M", hazard: 72, catModel: "Modelled", healthCheck: "Flag", constructionClass: "Class 6 — Fire Resistive", yearBuilt: 1996, stories: 9, sqFt: 71708, sprinklerType: "None", buildingValue: "$0.1M", contentsValue: "$7M", biValue: "$1M", floodZone: "AE", distanceToCoast: "2.1 mi" },
      ],
    },
    lossHistory: {
      lossRatio: "1.36", lossRatioBand: "alert", claimsYears: 5,
      claimsCount: 22, largestLoss: "61,500,000", netLosses: "$150.0M", grossLosses: "$168.4M", ibnr: "$11.6M",
      lossRunYears: "5 years: 2021–2025",
      summary: "5-year net loss ratio 1.36 — adverse. 22 claims across 14 countries. Two layer-piercing events: 2022 Hurricane Ian flood at Miami data annex ($61.5M) and 2024 London HQ electrical fire ($54.7M). Seven open claims. Renewal rate increase required.",
      topLocations: [
        { loc: "MGF-008 — Miami, FL",                   paid: "$61.5M", reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-010 — London, United Kingdom",      paid: "$48.9M", reportedNotPaid: "$6.5M", count: 3 },
        { loc: "MGF-004 — Charlotte, United States",    paid: "$11.4M", reportedNotPaid: "$0",    count: 4 },
        { loc: "MGF-001 — New York, NY",                paid: "$7.3M",  reportedNotPaid: "$0.1M", count: 2 },
        { loc: "MGF-011 — Frankfurt, Germany",          paid: "$3.8M",  reportedNotPaid: "$0.2M", count: 3 },
        { loc: "MGF-007 — Dallas, United States",       paid: "$3.0M",  reportedNotPaid: "$0.1M", count: 2 },
        { loc: "MGF-014 — Zurich, Switzerland",         paid: "$2.5M",  reportedNotPaid: "$0.1M", count: 1 },
        { loc: "MGF-006 — Boston, United States",       paid: "$2.1M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-016 — Hong Kong, Hong Kong SAR",    paid: "$0.8M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-003 — Piscataway, United States",   paid: "$0.7M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-012 — Dublin, Ireland",             paid: "$0.6M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-009 — San Francisco, United States",paid: "$0.5M",  reportedNotPaid: "$0",    count: 1 },
        { loc: "MGF-013 — Paris, France",               paid: "$0.4M",  reportedNotPaid: "$0",    count: 1 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$8.2M" },
        { year: 2022, paid: "$61.5M" },
        { year: 2023, paid: "$12.8M" },
        { year: 2024, paid: "$54.7M" },
        { year: 2025, paid: "$12.8M" },
      ],
      layerPenetration: {
        attachmentPoint: "$50M",
        annualAggregateLimit: "$25M",
        claimsPiercingLayer: 2,
        yearsBreach: 2,
        largestLoss: "$61.5M (2022 — Hurricane Ian flood, Miami data annex)",
        piercingEvents: [
          { peril: "Named Windstorm / Flood", amount: "$61.5M", year: 2022, location: "MGF-008 — Miami, FL", breachedAnnualAgg: true },
          { peril: "Fire", amount: "$54.7M", year: 2024, location: "MGF-010 — London, United Kingdom", breachedAnnualAgg: true },
        ],
      },
      claims: [
        { claimId: "MGF-CLM-0007", locId: "MGF-011", location: "Frankfurt, Germany", lossDate: "2021-01-03", reportDate: "2021-01-05", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 760498, caseReserve: 3023, incurred: 763521, ibnr: 302, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0006", locId: "MGF-012", location: "Dublin, Ireland", lossDate: "2021-01-09", reportDate: "2021-01-12", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 550248, caseReserve: 20837, incurred: 571085, ibnr: 2084, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0005", locId: "MGF-016", location: "Hong Kong, Hong Kong SAR", lossDate: "2021-01-10", reportDate: "2021-01-15", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 818896, caseReserve: 6037, incurred: 824933, ibnr: 604, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0009", locId: "MGF-010", location: "London, United Kingdom", lossDate: "2021-05-12", reportDate: "2021-05-13", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 280180, caseReserve: 12160, incurred: 292340, ibnr: 1216, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0003", locId: "MGF-001", location: "New York, United States", lossDate: "2021-06-10", reportDate: "2021-06-11", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable", status: "Closed", paid: 5100000, caseReserve: 0, incurred: 5100000, ibnr: 0, deductible: "$500,000 AOP", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Medium", reserveAdequacy: "High — fully developed and closed", notes: "Chilled-water riser failure flooded 3 trading floors; contents and BI claim, no structural damage." },
        { claimId: "MGF-CLM-0008", locId: "MGF-003", location: "Piscataway, United States", lossDate: "2021-07-27", reportDate: "2021-07-28", peril: "Wind / Hail", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 690178, caseReserve: 38751, incurred: 728929, ibnr: 3875, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0001", locId: "MGF-008", location: "Miami, United States", lossDate: "2022-09-28", reportDate: "2022-09-29", peril: "Named Windstorm / Flood", catEvent: "Hurricane Ian — September 2022", status: "Closed", paid: 61500000, caseReserve: 0, incurred: 61500000, ibnr: 0, deductible: "$500,000 AOP / 5% NS", layerAttached: "Excess — pierces $50M SIR + $25M Layer 1", adjuster: "Crawford & Company", litigation: true, subrogationPotential: true, subrogationRecovered: 1800000, reopened: false, complexity: "High", reserveAdequacy: "Medium — settled with insured; subrogation recovery from municipal drainage authority still being pursued", notes: "Storm surge and flooding disabled the Miami data annex for 11 weeks; largest loss on the account and the event that pierces both the SIR and Layer 1 aggregate." },
        { claimId: "MGF-CLM-0013", locId: "MGF-004", location: "Charlotte, United States", lossDate: "2023-01-03", reportDate: "2023-01-05", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 182686, caseReserve: 860, incurred: 183546, ibnr: 86, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0012", locId: "MGF-007", location: "Dallas, United States", lossDate: "2023-03-05", reportDate: "2023-03-09", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 872309, caseReserve: 34364, incurred: 906673, ibnr: 3436, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0014", locId: "MGF-004", location: "Charlotte, United States", lossDate: "2023-05-18", reportDate: "2023-05-22", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 554381, caseReserve: 41456, incurred: 595837, ibnr: 4146, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0011", locId: "MGF-004", location: "Charlotte, United States", lossDate: "2023-07-06", reportDate: "2023-07-11", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 874350, caseReserve: 47349, incurred: 921699, ibnr: 4735, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0004", locId: "MGF-004", location: "Charlotte, United States", lossDate: "2023-07-19", reportDate: "2023-07-20", peril: "Equipment Breakdown", catEvent: "Not applicable", status: "Closed", paid: 9800000, caseReserve: 0, incurred: 9800000, ibnr: 0, deductible: "$500,000 AOP", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Medium", reserveAdequacy: "High — fully developed and closed", notes: "Cooling-plant failure at Charlotte data center caused partial outage; contingent BI and equipment replacement claim." },
        { claimId: "MGF-CLM-0010", locId: "MGF-009", location: "San Francisco, United States", lossDate: "2023-08-10", reportDate: "2023-08-14", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 516273, caseReserve: 24511, incurred: 540784, ibnr: 2451, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0002", locId: "MGF-010", location: "London, United Kingdom", lossDate: "2024-02-14", reportDate: "2024-02-14", peril: "Fire", catEvent: "Not applicable", status: "Open", paid: 48200000, caseReserve: 6500000, incurred: 54700000, ibnr: 4100000, deductible: "$500,000 AOP", layerAttached: "Excess — pierces Layer 1 annual aggregate", adjuster: "Sedgwick Claims Management", litigation: true, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "High", reserveAdequacy: "Low — cause-and-origin litigation with electrical contractor ongoing; reserve may develop further pending expert report", notes: "Electrical switchgear fire in the London HQ tower plant room; extensive smoke damage to upper floors and prolonged business interruption while trading floors relocated." },
        { claimId: "MGF-CLM-0018", locId: "MGF-011", location: "Frankfurt, Germany", lossDate: "2025-02-23", reportDate: "2025-02-27", peril: "Wind / Hail", catEvent: "Not applicable — attritional loss", status: "Open", paid: 2133600, caseReserve: 133455, incurred: 2267055, ibnr: 13346, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0022", locId: "MGF-014", location: "Zurich, Switzerland", lossDate: "2025-03-13", reportDate: "2025-03-14", peril: "Wind / Hail", catEvent: "Not applicable — attritional loss", status: "Open", paid: 2477217, caseReserve: 83321, incurred: 2560538, ibnr: 8332, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0020", locId: "MGF-013", location: "Paris, France", lossDate: "2025-06-25", reportDate: "2025-06-27", peril: "Vehicle Impact", catEvent: "Not applicable — attritional loss", status: "Open", paid: 365080, caseReserve: 21241, incurred: 386321, ibnr: 2124, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0015", locId: "MGF-001", location: "New York, United States", lossDate: "2025-07-26", reportDate: "2025-07-28", peril: "Vandalism", catEvent: "Not applicable — attritional loss", status: "Open", paid: 2225999, caseReserve: 135386, incurred: 2361385, ibnr: 13539, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0016", locId: "MGF-006", location: "Boston, United States", lossDate: "2025-10-15", reportDate: "2025-10-19", peril: "Wind / Hail", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 2107854, caseReserve: 73428, incurred: 2181282, ibnr: 7343, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0021", locId: "MGF-007", location: "Dallas, United States", lossDate: "2025-11-15", reportDate: "2025-11-19", peril: "Water Damage / Pipe Burst", catEvent: "Not applicable — attritional loss", status: "Open", paid: 2166833, caseReserve: 63005, incurred: 2229838, ibnr: 6300, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0017", locId: "MGF-010", location: "London, United Kingdom", lossDate: "2025-12-08", reportDate: "2025-12-09", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 378748, caseReserve: 6388, incurred: 385136, ibnr: 639, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "MGF-CLM-0019", locId: "MGF-011", location: "Frankfurt, Germany", lossDate: "2025-12-10", reportDate: "2025-12-14", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Open", paid: 944669, caseReserve: 33627, incurred: 978296, ibnr: 3363, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
      ],
    },
  },
  "SUB-2026-1214": {
    focusNote: "Multi-territory CAT accumulation (US Gulf, Japan EQ, Continental Europe flood); Sao Paulo and Osaka CAT model re-run required before bind. Facultative referral required — TIV $11.2B exceeds $350M single-risk authority.",
    request: {
      perils: ["All Risk (AOP)", "Named Windstorm", "Earthquake", "Flood", "Wildfire", "Terrorism"],
      limitsSought: "$700M xs $50M",
      qbeLayer: "$175M xs $425M",
      towerPosition: "Layer 4 of 6 (High Excess, Panel Market)",
      leadCarriers: ["AIG Europe — $75M xs $50M (Lead)", "Allianz — $150M xs $125M", "AXA XL — $150M xs $275M", "Zurich — $175M xs $425M"],
      valuationMethod: "Reinstatement Value (RCV); business income on ALS basis; multi-currency (USD base)",
    },
    hazardByConstruction: "Mixed reinforced concrete and steel frame — moderate-to-elevated hazard; multi-peril CAT accumulation across 8 countries.",
    hazardByOccupancy: "Heavy industrial manufacturing — elevated ignition load and machinery breakdown exposure; 64% of TIV in manufacturing occupancy.",
    documents: [
      { name: "Application", received: true, date: "15 Aug 2026", needsReview: false },
      { name: "Primary Policy", received: true, date: "18 Aug 2026", needsReview: true, reviewReason: "Admitted fronting paper pending confirmation in Brazil and Japan — 2 of 3 fronting territories outstanding." },
      { name: "Risk Engineering Report", received: true, date: "22 Aug 2026", needsReview: true, reviewReason: "No survey on file for Sao Paulo or Osaka — required before bind." },
      { name: "Loss History", received: true, date: "15 Aug 2026", needsReview: false },
    ],
    sov: {
      modellingReady: false, completenessPct: 73,
      dataCleansingNote: "Per-peril sublimit schedule outstanding for 2 territories (Brazil, Japan); CAT model re-run required for Sao Paulo and Osaka portfolios before bind.",
      stats: { totalTIV: "$11.2B", locationCount: 312, topState: "US Gulf", avgHazard: 63 },
      buildingValue: "6,800,000,000", contentsValue: "2,200,000,000", biValue: "2,200,000,000",
      biIndemnityPeriod: "18 months", biWaitingPeriod: "72 hours", coinsurance: "90",
      yearBuiltRange: "1962–2022 across 312 locations",
      locations: PINNACLE_SOV_LOCATIONS,
    },
    lossHistory: {
      lossRatio: "0.22", lossRatioBand: "good", claimsYears: 5,
      claimsCount: 15, largestLoss: "9,400,000", netLosses: "$14.8M", grossLosses: "$16.1M", ibnr: "$1.9M",
      lossRunYears: "5 years: 2021–2025",
      summary: "5-year net loss ratio 0.22 — favorable. 15 claims across 8 countries. Losses are attritional with two CAT events (2022 Osaka EQ BI $9.4M; 2024 Rotterdam flood $2.6M). Both below the $50M attachment point. No layer-piercing events. Clean performance supports new business appetite.",
      topLocations: [
        { loc: "PGI-0044 — Osaka, Japan",               paid: "$9.4M", reportedNotPaid: "$0", count: 1 },
        { loc: "PGI-0102 — Rotterdam, Netherlands",     paid: "$3.0M", reportedNotPaid: "$0", count: 3 },
        { loc: "PGI-0210 — Johannesburg, South Africa", paid: "$0.7M", reportedNotPaid: "$0", count: 3 },
        { loc: "PGI-0185 — Newcastle, Australia",       paid: "$0.6M", reportedNotPaid: "$0", count: 3 },
        { loc: "PGI-0140 — Sao Paulo, Brazil",          paid: "$0.4M", reportedNotPaid: "$0", count: 1 },
        { loc: "PGI-0012 — Pittsburgh, United States",  paid: "$0.3M", reportedNotPaid: "$0", count: 1 },
        { loc: "PGI-0301 — Birmingham, United Kingdom", paid: "$0.2M", reportedNotPaid: "$0", count: 1 },
        { loc: "PGI-0077 — Duisburg, Germany",          paid: "$0.1M", reportedNotPaid: "$0", count: 1 },
        { loc: "PGI-0260 — Kobe, Japan",                paid: "$0.1M", reportedNotPaid: "$0", count: 1 },
      ],
      yearlyBreakdown: [
        { year: 2021, paid: "$0.9M" },
        { year: 2022, paid: "$9.4M" },
        { year: 2023, paid: "$1.1M" },
        { year: 2024, paid: "$2.6M" },
        { year: 2025, paid: "$0.8M" },
      ],
      layerPenetration: {
        attachmentPoint: "$50M",
        annualAggregateLimit: "$50M",
        claimsPiercingLayer: 0,
        yearsBreach: 0,
        largestLoss: "$9.4M (2022 — EQ business interruption, Osaka)",
        piercingEvents: [],
      },
      claims: [
        { claimId: "PGI-CLM-0007", locId: "PGI-0210", location: "Johannesburg, South Africa", lossDate: "2021-01-15", reportDate: "2021-01-17", peril: "Theft", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 140123, caseReserve: 1393, incurred: 141516, ibnr: 139, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0004", locId: "PGI-0185", location: "Newcastle, Australia", lossDate: "2021-01-28", reportDate: "2021-01-28", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 230776, caseReserve: 12155, incurred: 242931, ibnr: 1216, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: true, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0006", locId: "PGI-0102", location: "Rotterdam, Netherlands", lossDate: "2021-05-07", reportDate: "2021-05-11", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 220508, caseReserve: 8610, incurred: 229118, ibnr: 861, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0003", locId: "PGI-0260", location: "Kobe, Japan", lossDate: "2021-08-14", reportDate: "2021-08-19", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 102809, caseReserve: 5407, incurred: 108216, ibnr: 541, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0005", locId: "PGI-0210", location: "Johannesburg, South Africa", lossDate: "2021-12-26", reportDate: "2021-12-28", peril: "Lightning", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 205783, caseReserve: 1609, incurred: 207392, ibnr: 161, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0001", locId: "PGI-0044", location: "Osaka, Japan", lossDate: "2022-06-17", reportDate: "2022-06-18", peril: "Earthquake", catEvent: "Osaka Region Earthquake — June 2022", status: "Closed", paid: 9400000, caseReserve: 0, incurred: 9400000, ibnr: 0, deductible: "5% TIV / $1,000,000 min (EQ-JAPAN)", layerAttached: "Excess — Layer 4 ($175M xs $425M) monitoring event", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "High", reserveAdequacy: "Medium — final BI settlement completed; no further development expected", notes: "Magnitude 6.1 regional earthquake caused partial production-line outage and contingent business interruption at the Osaka plant; largest single loss on the account." },
        { claimId: "PGI-CLM-0010", locId: "PGI-0301", location: "Birmingham, United Kingdom", lossDate: "2023-02-03", reportDate: "2023-02-04", peril: "Equipment Breakdown", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 217850, caseReserve: 7544, incurred: 225394, ibnr: 754, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0008", locId: "PGI-0077", location: "Duisburg, Germany", lossDate: "2023-06-01", reportDate: "2023-06-02", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 113835, caseReserve: 2115, incurred: 115950, ibnr: 212, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0011", locId: "PGI-0140", location: "Sao Paulo, Brazil", lossDate: "2023-07-20", reportDate: "2023-07-21", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 355367, caseReserve: 17745, incurred: 373112, ibnr: 1774, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Charles Taylor Adjusting", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0009", locId: "PGI-0185", location: "Newcastle, Australia", lossDate: "2023-09-01", reportDate: "2023-09-06", peril: "Lightning", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 76438, caseReserve: 3641, incurred: 80079, ibnr: 364, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0012", locId: "PGI-0185", location: "Newcastle, Australia", lossDate: "2023-10-21", reportDate: "2023-10-23", peril: "Fire", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 336510, caseReserve: 11165, incurred: 347675, ibnr: 1116, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "In-House QBE Claims", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0002", locId: "PGI-0102", location: "Rotterdam, Netherlands", lossDate: "2024-01-08", reportDate: "2024-01-09", peril: "Flood", catEvent: "North Sea Storm Surge — January 2024", status: "Closed", paid: 2600000, caseReserve: 0, incurred: 2600000, ibnr: 0, deductible: "5% TIV / $500,000 min (FL-EUROPE)", layerAttached: "Primary / Underlying", adjuster: "GAB Robins", litigation: false, subrogationPotential: true, subrogationRecovered: 180000, reopened: false, complexity: "Medium", reserveAdequacy: "High — fully developed and closed", notes: "Storm-surge flooding to ground-floor warehouse and raw-materials stock; subrogation pursued against the regional flood-defense authority." },
        { claimId: "PGI-CLM-0015", locId: "PGI-0012", location: "Pittsburgh, United States", lossDate: "2025-01-16", reportDate: "2025-01-20", peril: "Vandalism", catEvent: "Not applicable — attritional loss", status: "Open", paid: 286053, caseReserve: 3170, incurred: 289223, ibnr: 317, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0013", locId: "PGI-0210", location: "Johannesburg, South Africa", lossDate: "2025-02-05", reportDate: "2025-02-08", peril: "Sprinkler Leakage", catEvent: "Not applicable — attritional loss", status: "Closed", paid: 342255, caseReserve: 10581, incurred: 352836, ibnr: 1058, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Crawford & Company", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
        { claimId: "PGI-CLM-0014", locId: "PGI-0102", location: "Rotterdam, Netherlands", lossDate: "2025-02-08", reportDate: "2025-02-09", peril: "Roof Collapse (Snow Load)", catEvent: "Not applicable — attritional loss", status: "Open", paid: 171692, caseReserve: 3708, incurred: 175400, ibnr: 371, deductible: "Per SOV schedule", layerAttached: "Primary / Underlying", adjuster: "Sedgwick Claims Management", litigation: false, subrogationPotential: false, subrogationRecovered: 0, reopened: false, complexity: "Low", reserveAdequacy: "High", notes: "Routine attritional claim; reserved to expected paid, no unusual development anticipated." },
      ],
    },
  },
};

/* ─────────────────────────── Derivation helpers — moved to ./SubmissionHelpers ─────────────────────────── */

const HAZARD_GRADE_CFG = {
  A: { label: "A", bg: "bg-[#EEF6FF]", text: "text-[#0076BC]", border: "border-[#C2DFF4]" },
  B: { label: "B", bg: "bg-[#F0FDF4]", text: "text-[#15803D]", border: "border-[#BBF7D0]" },
  C: { label: "C", bg: "bg-[#FFF7ED]", text: "text-[#C2410C]", border: "border-[#FED7AA]" },
  D: { label: "D", bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", border: "border-[#FECACA]" },
} as const;

function locHazardGrade(score: number): keyof typeof HAZARD_GRADE_CFG {
  if (score <= 50) return "A";
  if (score <= 65) return "B";
  if (score <= 75) return "C";
  return "D";
}

function occupancyHazardGrade(occupancyByTIV: { name: string; pct: number }[]): string | null {
  if (!occupancyByTIV || occupancyByTIV.length === 0) return null;
  const dominant = occupancyByTIV.reduce((a, b) => (b.pct > a.pct ? b : a), occupancyByTIV[0]);
  const name = dominant?.name?.toLowerCase() ?? "";
  if (name.includes("office") || name.includes("lab")) return "A";
  if (name.includes("data center") || name.includes("warehouse") || name.includes("distribution")) return "B";
  if (name.includes("mfg") || name.includes("manufacturing") || name.includes("hotel")) return "C";
  return "C";
}

function constructionHazardGrade(topClass: string, pct: number): string {
  const c = topClass.toLowerCase();
  if (c.includes("fire resist")) return "A";
  if (c.includes("steel") || (c.includes("masonry") && !c.includes("masonry nc"))) return "B";
  if (c.includes("masonry nc")) return "C";
  if (c.includes("frame") && pct >= 50) return "D";
  if (c.includes("frame")) return "C";
  return "B";
}

function territoryHazardGrade(territory: string): string {
  const states = territory.toUpperCase().split(/[,\s]+/).filter(Boolean);
  const hasFl = states.includes("FL");
  const hasCa = states.includes("CA");
  if (hasFl && hasCa) return "D";
  if (hasFl || hasCa) return "C";
  const moderateStates = ["TX", "OK", "LA", "MS", "AL", "GA", "SC", "NC"];
  if (states.some((s) => moderateStates.includes(s))) return "B";
  return "A";
}
/* ─────────────────────────── Workflow stepper ─────────────────────────── */
/* winBand, BAND_STYLE, parseTIV, parsePaidK, fmtTIV, fmtPaid, concentrationBand moved to ./SubmissionHelpers */
/* WORKFLOW_STEPS moved to ./SubmissionHelpers and imported above */

function statusStepIndex(ps: ProcessingStatus): number {
  const map: Record<ProcessingStatus, number> = {
    "not-processed": 1, "follow-up-required": 1, "ready-for-ops": 1,
    "ready-for-uw": 2, "uw-analysis": 3, "uw-review": 4, "customer-decision": 5,
  };
  return map[ps] ?? 1;
}

const CONSTRUCTION_COLORS: Record<string, string> = {
  "Frame":        "#F4A030",
  "Masonry NC":   "#0090DC",
  "Steel Frame":  "#0076BC",
  "Masonry":      "#20A8E0",
  "Fire Resist.": "#00205B",
  "Fire Resistive": "#00205B",
};
const STATE_PALETTE = ["#00205B","#0076BC","#0090DC","#20A8E0","#80CCF0","#E07010","#F4A030","#FAD090"];

type TivSlice = { name: string; pct: number; color: string };

function buildTivMix(
  locations: SovLocation[],
  key: "construction" | "state",
  colorMap?: Record<string, string>,
  palette?: string[],
): TivSlice[] {
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const loc of locations) {
    const tivVal = parseTIV(loc.tiv);
    const groupKey = key === "state" ? loc.state : loc.construction;
    totals[groupKey] = (totals[groupKey] ?? 0) + tivVal;
    grand += tivVal;
  }
  if (grand === 0) return [];
  const paletteRef = palette ?? STATE_PALETTE;
  let paletteIdx = 0;
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => ({
      name,
      pct: Math.round((val / grand) * 100),
      color: colorMap?.[name] ?? paletteRef[paletteIdx++ % paletteRef.length],
    }));
}

function TivMixBar({ label, slices }: { label: string; slices: TivSlice[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-[#9B9B98] mb-1" style={{ fontWeight: 700 }}>{label}</div>
      <div className="h-1.5 rounded-full overflow-hidden flex w-full">
        {slices.map((s) => (
          <div key={s.name} style={{ width: `${s.pct}%`, backgroundColor: s.color, flexShrink: 0 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] text-[#6B7280] whitespace-nowrap">{s.name} {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Key account facts, frozen above the stepper so they stay visible on every step. */
function AccountSummaryBar({ meta, idx, onClose }: {
  meta: SubmissionMeta;
  idx: SubmissionIndexEntry;
  onClose?: () => void;
}) {
  const router = useRouter();
  const facts = [
    { label: "Policy Start", value: meta.inceptionDate,                       Icon: MapPin    },
    { label: "TIV",          value: meta.tivFull,                              Icon: BarChart3 },
    { label: "Broker",       value: `${meta.broker}, ${meta.brokerageHouse}`,  Icon: Briefcase },
  ];
  return (
    <div className="flex-shrink-0 bg-white border-b border-[#E0E8FF] px-6 py-3 flex items-center gap-6">
      {/* Account identity */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #EEF6FF, #D8EDFC)", border: "1px solid #C2DFF4" }}>
          <Building2 style={{ width: 18, height: 18, color: "#00205B" }} />
        </div>
        <div>
          <div className="text-[14px] whitespace-nowrap" style={{ fontWeight: 700, color: "#0D1B2E" }}>{meta.accountName}</div>
          <div className="text-[10px] whitespace-nowrap" style={{ color: "#94A3B8" }}>{meta.id} · {meta.type} · {meta.coverageType}</div>
        </div>
      </div>

      {/* Push facts to the far right */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="self-stretch w-px flex-shrink-0" style={{ backgroundColor: "#E0E8FF" }} />

      {/* Facts */}
      <div className="flex items-start gap-8 flex-shrink-0">
        {facts.map(({ label, value, Icon }) => (
          <div key={label} className="flex-shrink-0">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon style={{ width: 11, height: 11, color: "#94A3B8", flexShrink: 0 }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ fontWeight: 700, color: "#94A3B8" }}>{label}</span>
            </div>
            <div className="text-[11px] whitespace-nowrap" style={{ fontWeight: 600, color: "#0D1B2E" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="self-stretch w-px flex-shrink-0" style={{ backgroundColor: "#E0E8FF" }} />

      {/* Close — far right */}
      <button
        onClick={() => onClose ? onClose() : router.back()}
        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
        style={{ color: "#6B7280", backgroundColor: "#F3F4F6" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#111827"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F3F4F6"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
        aria-label="Close">
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}

function StepperNav({ active, onChange, reachedStep }: {
  active: number; onChange: (i: number) => void; reachedStep: number;
}) {
  const bookmarkedStep = reachedStep;

  const stepMeta = (i: number): { status: "done" | "viewing" | "pending"; dotColor: string } => {
    const isDone = i < bookmarkedStep;
    const isViewing = i === active;
    if (isViewing) return { status: "viewing", dotColor: "#0076BC" };
    if (isDone)    return { status: "done",    dotColor: "#22C55E" };
    return                { status: "pending", dotColor: "#CBD5E1" };
  };

  return (
    <div className="bg-white border-b border-[#E0E8FF] flex-shrink-0 px-8 pt-3 pb-2">
      <div className="flex items-start">
        {WORKFLOW_STEPS.map((step, i) => {
          const { status, dotColor } = stepMeta(i);
          const isDone = status === "done";
          const isViewing = i === active;
          const StepIcon = step.icon;

          /* Connector line color */
          const lineColor = i < bookmarkedStep ? "#22C55E" : "#E0E8FF";

          const iconOpacity = (i > bookmarkedStep && !isViewing) ? 0.5 : 1;
          const ringColor = isDone ? "#22C55E" : isViewing ? "#0076BC" : "#CBD5E1";

          return (
            <div key={step.label} className="flex-1 flex flex-col items-center relative">
              {/* Left connector */}
              {i > 0 && (
                <div className="absolute h-px top-[12px]" style={{
                  left: 0, right: "50%",
                  backgroundColor: i <= bookmarkedStep ? "#22C55E" : "#E0E8FF",
                }} />
              )}
              {/* Right connector */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="absolute h-px top-[12px]" style={{
                  left: "50%", right: 0,
                  backgroundColor: lineColor,
                }} />
              )}

              {/* Full clickable area: icon + label */}
              {(() => {
                const isPending = i > bookmarkedStep;
                return (
                  <button
                    onClick={isPending ? undefined : () => onChange(i)}
                    disabled={isPending}
                    className={`relative z-10 flex flex-col items-center gap-0 transition-all group ${isPending ? "cursor-not-allowed" : "cursor-pointer"}`}
                    style={{ opacity: iconOpacity }}
                  >
                    {/* Icon with colored ring */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #0076BC, #00205B)",
                        boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${ringColor}`,
                      }}
                    >
                      <StepIcon className="w-3 h-3 text-white" />
                    </div>
                    {/* Step name */}
                    <div className="mt-1 text-center px-1">
                      <div className={`text-[10px] leading-snug transition-colors ${!isPending ? "group-hover:text-[#0076BC]" : ""}`}
                        style={{ fontWeight: isViewing ? 700 : 500, color: isViewing ? "#0076BC" : isDone ? "#0D1B2E" : "#94A3B8" }}>
                        {step.label}
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── L2 — inforce book (mock) ─────────────────────────── */

interface InforceAccount {
  account: string; industry: string; occupancy: string;
  hazardScore: number; tiv: number; decision: "Bound" | "Quoted" | "Declined"; outcome: string;
}

const INFORCE_BOOK: InforceAccount[] = [
  { account: "Ridgeline Metalworks", industry: "Manufacturing", occupancy: "Light Mfg", hazardScore: 71, tiv: 262, decision: "Bound", outcome: "Renewed 2× · LR 0.18" },
  { account: "Keystone Fabricators", industry: "Manufacturing", occupancy: "Light Mfg", hazardScore: 66, tiv: 198, decision: "Bound", outcome: "In-force · clean" },
  { account: "Summit Tooling Co.", industry: "Manufacturing", occupancy: "Manufacturing", hazardScore: 78, tiv: 310, decision: "Declined", outcome: "CAT deductible gap" },
  { account: "Harbor Steel Group", industry: "Manufacturing", occupancy: "Warehouse", hazardScore: 59, tiv: 240, decision: "Quoted", outcome: "Lost on price" },
  { account: "Cascade Data Systems", industry: "Technology", occupancy: "Data Center", hazardScore: 41, tiv: 185, decision: "Bound", outcome: "Renewed · LR 0.06" },
  { account: "Nimbus Cloud Campus", industry: "Technology", occupancy: "Office", hazardScore: 38, tiv: 220, decision: "Bound", outcome: "In-force · clean" },
  { account: "Vertex Compute", industry: "Technology", occupancy: "Data Center", hazardScore: 45, tiv: 165, decision: "Quoted", outcome: "Pending broker" },
  { account: "Seaboard Logistics", industry: "Logistics", occupancy: "Warehouse", hazardScore: 67, tiv: 230, decision: "Bound", outcome: "In-force · LR 0.22" },
  { account: "Gulf Coast DC Partners", industry: "Logistics", occupancy: "Warehouse", hazardScore: 82, tiv: 205, decision: "Declined", outcome: "Hurricane accumulation" },
  { account: "Meridian Freightways", industry: "Logistics", occupancy: "Warehouse", hazardScore: 61, tiv: 150, decision: "Bound", outcome: "Renewed · clean" },
  { account: "Coastline Resorts", industry: "Hospitality", occupancy: "Hotel", hazardScore: 73, tiv: 168, decision: "Quoted", outcome: "Lost on terms" },
  { account: "Bayview Hotel Group", industry: "Hospitality", occupancy: "Hotel", hazardScore: 69, tiv: 142, decision: "Bound", outcome: "In-force · LR 0.19" },
];

/* Current inforce book TIV by state ($M) */
const INFORCE_BY_STATE: Record<string, number> = {
  OH: 640, IN: 410, FL: 1180, GA: 520, SC: 300, NY: 890, NJ: 470, PA: 360,
  CA: 1340, TX: 980, NC: 410, OK: 190, IL: 560, WI: 240, OR: 210, WA: 320,
};
const INFORCE_TOTAL = Object.values(INFORCE_BY_STATE).reduce((s, v) => s + v, 0);

/* ─────────────────────────── Link Email Modal ─────────────────────────── */

const MOCK_INBOX_EMAILS = [
  { id: "e-001", from: "Jennifer Walsh", org: "Marsh McLennan", subject: "Westfield Manufacturing — Renewal Application", date: "Aug 15", tag: "new-request" as const, linked: false },
  { id: "e-002", from: "Marcus Chen", org: "Aon Risk Solutions", subject: "Atlantic Distribution — SOV Update Q3", date: "Aug 14", tag: "update-external" as const, linked: false },
  { id: "e-003", from: "Sarah Kim", org: "Willis Towers Watson", subject: "Pacific Coast Hotels — Loss Run Request", date: "Aug 12", tag: "update-external" as const, linked: false },
  { id: "e-004", from: "David Okonkwo", org: "Gallagher", subject: "TechNorth Data Centers — New Submission", date: "Aug 11", tag: "new-request" as const, linked: false },
  { id: "e-005", from: "Emily Ramirez", org: "Marsh McLennan", subject: "Westfield Manufacturing — Risk Engineering Report", date: "Aug 10", tag: "update-external" as const, linked: false },
  { id: "e-006", from: "Internal Routing", org: "QBE Operations", subject: "Auto-routed: Westfield renewal package", date: "Aug 09", tag: "update-internal" as const, linked: false },
  { id: "e-007", from: "Tom Eriksson", org: "HUB International", subject: "Ridgeline Metalworks — Quote Follow-up", date: "Aug 08", tag: "update-external" as const, linked: false },
];

const TAG_STYLE = {
  "new-request":     { label: "New Request",    bg: "#EEF6FF", color: "#0076BC", border: "#C2DFF4" },
  "update-external": { label: "Update External", bg: "#F0FDFA", color: "#0F766E", border: "#99F6E4" },
  "update-internal": { label: "Update Internal", bg: "#ECFEFF", color: "#0891B2", border: "#A5F3FC" },
  "not-relevant":    { label: "Not Relevant",   bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
} as const;

function LinkEmailModal({ submissionId, meta, onClose }: { submissionId: string; meta: SubmissionMeta; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  const filtered = MOCK_INBOX_EMAILS.filter(e =>
    search === "" ||
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.from.toLowerCase().includes(search.toLowerCase()) ||
    e.org.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setLinked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      toast.success(`${linked.size} email${linked.size !== 1 ? "s" : ""} linked to ${submissionId}`);
      onClose();
    }, 500);
  };

  const modal = (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,20,60,0.45)", backdropFilter: "blur(2px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl flex flex-col overflow-hidden"
        style={{ width: 580, maxHeight: "85vh", boxShadow: "0 24px 64px rgba(0,32,91,0.24)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8EDF5]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
            <Link className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: "#0D1B2E" }}>Link Email</div>
            <div className="text-[11px] truncate" style={{ color: "#6B7280" }}>
              Link inbox emails to <span className="font-semibold" style={{ color: "#00205B" }}>{meta.namedInsured}</span> — {submissionId}
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
            style={{ color: "#9CA3AF" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-[#F0F0EE]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
            <input
              type="text" placeholder="Search by sender, subject, or organisation…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12px] outline-none focus:ring-2"
              style={{ borderColor: "#E5E7EB", color: "#374151",
                       boxShadow: "none", "--tw-ring-color": "#0076BC" } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-2 bg-[#FAFBFF] border-b border-[#F0F0EE] flex items-center gap-4">
          <span className="text-[10px]" style={{ color: "#6B7280" }}>
            <span className="font-bold" style={{ color: "#0D1B2E" }}>{filtered.length}</span> emails in inbox
          </span>
          {linked.size > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: "#EEF6FF", color: "#0076BC", border: "1px solid #C2DFF4" }}>
              <CheckCircle2 className="w-3 h-3" />
              {linked.size} selected
            </span>
          )}
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-auto divide-y divide-[#F0F0EE]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Inbox className="w-8 h-8" style={{ color: "#CBD5E1" }} />
              <div className="text-[12px]" style={{ color: "#9CA3AF" }}>No emails match your search</div>
            </div>
          ) : filtered.map(email => {
            const isLinked = linked.has(email.id);
            const tagStyle = TAG_STYLE[email.tag];
            return (
              <div key={email.id}
                onClick={() => toggle(email.id)}
                className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
                style={{ backgroundColor: isLinked ? "#F0F9FF" : "transparent" }}
                onMouseEnter={e => { if (!isLinked) (e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isLinked) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>

                {/* Checkbox */}
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ borderColor: isLinked ? "#0076BC" : "#D1D5DB",
                           backgroundColor: isLinked ? "#0076BC" : "white" }}>
                  {isLinked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                  style={{ backgroundColor: isLinked ? "#0076BC" : "#94A3B8" }}>
                  {email.from.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold truncate" style={{ color: "#0D1B2E" }}>{email.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "#6B7280" }}>{email.from} · {email.org}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[9px]" style={{ color: "#9CA3AF" }}>{email.date}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}` }}>
                    {tagStyle.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[#E8EDF5] bg-[#FAFBFF]">
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors"
            style={{ borderColor: "#E5E7EB", color: "#374151", backgroundColor: "white" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={linked.size === 0 || saved}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "#00205B" }}
            onMouseEnter={e => { if (linked.size > 0) (e.currentTarget as HTMLElement).style.backgroundColor = "#001740"; }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#00205B"}>
            <Link className="w-3.5 h-3.5" />
            {saved ? "Linking…" : `Link ${linked.size > 0 ? `${linked.size} email${linked.size !== 1 ? "s" : ""}` : "Email"}`}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ─────────────────────────── Main screen ─────────────────────────── */

interface SubmissionAnalysisProps {
  submissionId?: string;
  onInsightChange?: (insight: StepInsight) => void;
  onActionsChange?: (actions: ActionItem[]) => void;
  onClose?: () => void;
}

export function SubmissionAnalysis({ submissionId, onInsightChange, onActionsChange, onClose }: SubmissionAnalysisProps = {}) {
  const params = useParams();
  const rawId = submissionId || params.id;
  const id: string | undefined = Array.isArray(rawId) ? rawId[0] : (rawId || undefined);
  const meta = id ? submissionData[id] : null;
  const idx: SubmissionIndexEntry | undefined = id ? SUBMISSION_INDEX[id] : undefined;

  const defaultStep = idx ? statusStepIndex(idx.processingStatus) : 0;
  const [activeStep, setActiveStep] = useState(defaultStep);
  const [reachedStep, setReachedStep] = useState(defaultStep);

  useEffect(() => {
    const s = idx ? statusStepIndex(idx.processingStatus) : 0;
    setActiveStep(s);
    setReachedStep(s);
  }, [id, idx]);
  const [stepActions, setStepActions] = useState<ActionItem[]>([]);
  useEffect(() => { onActionsChange?.(stepActions); }, [stepActions, onActionsChange]);
  const [takeActionOpen, setTakeActionOpen] = useState(false);
  const takeActionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!takeActionOpen) return;
    const close = (e: MouseEvent) => { if (takeActionRef.current && !takeActionRef.current.contains(e.target as Node)) setTakeActionOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [takeActionOpen]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const navigateToStep = useCallback((step: number) => {
    setActiveStep(step);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* Insight is computed in the render body (after meta/idx guard) and stashed
     here; this effect flushes it to the docked AI pane on step / submission change. */
  const insightRef = useRef<StepInsight | null>(null);
  useEffect(() => {
    if (onInsightChange && insightRef.current) onInsightChange(insightRef.current);
  }, [activeStep, id, onInsightChange]);

  /* Stable per-step callbacks — steps register their action buttons in an effect
     keyed on these, so recreating them each render would loop the registration. */
  const goToStep = useCallback((step: number) => () => navigateToStep(step), [navigateToStep]);
  const proceedTo = useMemo(
    () => WORKFLOW_STEPS.map((_, i) => () => {
      setReachedStep(prev => Math.max(prev, i));
      navigateToStep(i);
    }),
    [navigateToStep]
  );
  const stepActionsValue = useCallback((items: ActionItem[]) => setStepActions(items), []);

  if (!meta || !idx) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-[#F9F9F8]">
        <p className="text-sm text-[#9B9B98]">Select a submission to view insights.</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E8E6E1] text-[#6B7280] hover:bg-[#F5F4F1] transition-colors"
          >
            ← Go back
          </button>
        )}
      </div>
    );
  }

  const extras: SubmissionExtras = { ...DEFAULT_EXTRAS, ...(id ? submissionExtras[id] : {}) };
  const recommendation = deriveRecommendation(idx.industryClassification, idx.processingStatus);

  const triageChecks = {
    clearance: idx.clearance === "complete",
    ofac: true,
    appetite: idx.industryClassification !== "out-of-scope",
  };

  const keyScores: KeyScore[] = ([
    (() => {
      const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
      (extras.sov.locations ?? []).forEach(l => { gradeCounts[locHazardGrade(l.hazard)]++; });
      const subScores = (["A","B","C","D"] as const)
        .filter(g => gradeCounts[g] > 0)
        .map(g => ({ label: g, grade: `${gradeCounts[g]}` }));
      return { label: "Hazard Score", value: `${idx.hazardScore}/100`, band: hazardBand(idx.hazardScore), note: "Locations by hazard grade", subScores };
    })(),
    { label: "Success Propensity", value: `${idx.successPropensity}%`, band: winBand(idx.successPropensity), note: idx.successPropensityDrivers },
    (() => {
      const totalLocs = (extras.sov.locations ?? []).length || extras.sov.stats.locationCount;
      const lh = extras.lossHistory;
      const isFreq = (l: LossLocation) => l.count >= CLAIMS_HIGH_FREQ_THRESHOLD;
      const isSev  = (l: LossLocation) => parsePaidK(l.paid) >= CLAIMS_HIGH_SEV_THRESHOLD;
      const highFreq = lh.topLocations.filter(l => isFreq(l) && !isSev(l)).length;
      const highSev  = lh.topLocations.filter(l => isSev(l) && !isFreq(l)).length;
      const both     = lh.topLocations.filter(l => isFreq(l) && isSev(l)).length;
      const anyFlagged = highFreq + highSev + both;
      const claimsBand: Band = both > 0 ? "alert" : anyFlagged > 0 ? "watch" : "good";
      const totalK = (lh.yearlyBreakdown ?? []).reduce((s, y) => s + parsePaidK(y.paid), 0);
      return {
        label: "Loss History",
        value: fmtPaid(totalK),
        band: claimsBand,
        note: `5-yr total paid · ${lh.claimsYears} yrs of loss history`,
        yearlyPaid: lh.yearlyBreakdown ?? [],
      };
    })(),
    (() => {
      const lp = extras.lossHistory.layerPenetration;
      if (!lp) return null;
      const lpBand: Band = lp.yearsBreach > 0 ? "alert" : lp.claimsPiercingLayer > 0 ? "watch" : "good";
      const valueStr = lp.claimsPiercingLayer === 0 ? "Clean" : `${lp.claimsPiercingLayer} event${lp.claimsPiercingLayer > 1 ? "s" : ""}`;
      return {
        label: "Capacity Guidelines",
        value: valueStr,
        band: lpBand,
        note: `Claims vs ${lp.attachmentPoint} attachment · ${lp.annualAggregateLimit} annual aggregate`,
        layerPenetration: { ...lp, requestedPerils: extras.request.perils },
      };
    })(),
    { label: "SOV Data Completeness", value: `${extras.sov.completenessPct}%`, band: extras.sov.completenessPct >= 90 ? "good" : extras.sov.completenessPct >= 70 ? "watch" : "alert", note: extras.sov.modellingReady ? "Ready for CAT modelling" : "Cleanse before CAT modelling" },
    { label: "AI Priority Score", value: `${idx.aiPriorityScore}/100`, band: idx.aiPriorityScore >= 85 ? "good" : idx.aiPriorityScore >= 70 ? "watch" : "alert", note: "Composite triage priority" },
  ] as (KeyScore | null)[]).filter((s): s is KeyScore => s !== null);

  // Stash the current step's insight for the docked AI pane (flushed via effect)
  insightRef.current = buildStepInsight(
    id!, activeStep, meta, extras.focusNote,
    RECOMMENDATION_CONFIG[recommendation].label, keyScores,
  );

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
    <StepActionsCtx.Provider value={stepActionsValue}>
      <div className="h-full flex flex-col bg-[#F9FAFB] overflow-hidden">
        {/* Account details — frozen above the stepper, constant across every step */}
        <AccountSummaryBar meta={meta} idx={idx} onClose={onClose} />

        {/* Stepper nav */}
        <StepperNav active={activeStep} onChange={navigateToStep} reachedStep={reachedStep} />

        {/* UW Accountability strip + Take Action dropdown */}
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-1.5 border-b" style={{ backgroundColor: "#FAFBFF", borderColor: "#E8EFFF" }}>
          <ShieldCheck className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
          <p className="text-[10px] text-[#9B9B98] leading-none flex-1">
            <span style={{ fontWeight: 600 }}>UW Accountability —</span>{" "}
            AI provides processing support and recommendations only. You remain accountable and responsible for all outputs and final underwriting decisions.
          </p>
          {/* Take Action dropdown */}
          <div ref={takeActionRef} className="relative flex-shrink-0">
            <button
              onClick={() => setTakeActionOpen(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] transition-colors"
              style={{ fontWeight: 600, color: "white", borderColor: "#001740", backgroundColor: "#00205B" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#001740")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#00205B")}
            >
              <Sparkles className="w-3 h-3" />
              Take Action
              <ChevronRight className={`w-3 h-3 transition-transform ${takeActionOpen ? "rotate-90" : ""}`} />
            </button>
            {takeActionOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-[#E0E8FF] py-1 min-w-[220px]"
                style={{ boxShadow: "0 8px 24px rgba(0,32,91,0.12)" }}>
                {stepActions.map((item, i) => {
                  const Icon = item.icon;
                  const color = item.variant === "danger" ? "#DC2626" : item.variant === "primary" ? "#00205B" : "#0076BC";
                  return (
                    <button key={i}
                      onClick={() => { item.onClick?.(); setTakeActionOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F0F6FF] transition-colors text-left"
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Content area — scrolls while header + stepper stay frozen */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {activeStep === 0 ? (
            <div className="px-6 py-4">
              <AccountOverviewStep
                meta={meta} idx={idx} extras={extras}
                recommendation={recommendation} keyScores={keyScores} triage={triageChecks}
                onProceed={proceedTo[1]}
                onNavigate={navigateToStep}
              />
            </div>
          ) : (
            <>
              {activeStep === 1 && <IngestionStep meta={meta} idx={idx} extras={extras} onProceed={proceedTo[2]} />}
              {activeStep === 2 && <TriageStep meta={meta} idx={idx} extras={extras} onProceed={proceedTo[3]} />}
              {activeStep === 3 && <UWAnalysisStep meta={meta} idx={idx} extras={extras} onProceed={proceedTo[4]} />}
              {activeStep === 4 && <UWReviewStep meta={meta} idx={idx} extras={extras} onProceed={proceedTo[5]} />}
              {activeStep === 5 && <DecisionStep meta={meta} idx={idx} extras={extras} />}
            </>
          )}
        </div>
      </div>
      {showDocModal && (
        <DocumentCreationModal
          meta={meta} idx={idx} extras={extras}
          activeStepIndex={activeStep}
          onClose={() => setShowDocModal(false)}
        />
      )}
      {showLinkEmailModal && meta && (
        <LinkEmailModal submissionId={id ?? ""} meta={meta} onClose={() => setShowLinkEmailModal(false)} />
      )}
    </StepActionsCtx.Provider>
    </TooltipPrimitive.Provider>
  );
}

/* ActionBtn moved to ./SubmissionHelpers */

/* ── Step 0: Account Overview ── */

const INSIGHT_STEP: Record<string, number> = {
  "Documentation Received": 1,
  "Statement of Values (SOV)": 3,
  "SOV Data Completeness": 1,
  "AI Priority Score": 2,
  "Clearance": 2,
  "Hazard Score": 3,
  "Loss History": 3,
  "Capacity Guidelines": 3,
  "Success Propensity": 4,
  "Broker Bound Rate": 5,
};

interface InsightGroup {
  stepIndex: number;
  stepLabel: string;
  stepIcon: typeof Building2;
  cards: KeyScore[];
  checks?: { label: string; passed: boolean }[];
}

function AccountOverviewStep({ meta, idx, extras, recommendation, keyScores, triage, onProceed, onNavigate }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras;
  recommendation: Recommendation; keyScores: KeyScore[];
  triage: { clearance: boolean; ofac: boolean; appetite: boolean };
  onProceed: () => void;
  onNavigate: (step: number) => void;
}) {
  /* Documentation Received insight — keyed off EXPECTED_DOCS so counts match Step 1 */
  const docLookup = (name: string) => extras.documents.find(d => d.name === name);
  const expectedDocItems = EXPECTED_DOCS.map(name => ({
    name,
    received:     docLookup(name)?.received     ?? false,
    needsReview:  docLookup(name)?.needsReview  ?? false,
    reviewReason: docLookup(name)?.reviewReason,
    date:         docLookup(name)?.date,
  }));
  const docsReceived = expectedDocItems.filter(d => d.received).length;
  const docsTotal    = expectedDocItems.length;
  const docsPct      = Math.round((docsReceived / docsTotal) * 100);
  const docsBand: Band = docsPct === 100 ? "good" : docsPct >= 75 ? "watch" : "alert";

  /* Data Completeness insight — critical fields with an extracted value */
  const catalogFields = buildFieldCatalog(meta, idx, extras);
  const criticalFields = catalogFields.filter(f => f.critical === "Yes");
  const criticalWithValue = criticalFields.filter(f => f.value.trim() !== "");
  const dataPct = criticalFields.length ? Math.round((criticalWithValue.length / criticalFields.length) * 100) : 0;
  const dataBand: Band = dataPct === 100 ? "good" : dataPct >= 75 ? "watch" : "alert";

  /* Broker Bound Rate insight — brokerBoundRate is stored as a whole-number percentage (e.g. 68) */
  const bbrPct  = idx.brokerBoundRate;
  const bbrBand: Band = idx.brokerBoundRate >= 60 ? "good" : idx.brokerBoundRate >= 40 ? "watch" : "alert";
  const bbrTrendLabel = idx.brokerTrend === "up" ? "↑ trending up" : idx.brokerTrend === "down" ? "↓ trending down" : "→ stable";

  const handleScoreClick = (label: string) => {
    const step = INSIGHT_STEP[label];
    if (step !== undefined) onNavigate(step);
  };

  /* Statement of Values completeness insight — how many required CP SOV fields
     are encoded across the locations. Initially incomplete (roof age etc. blank). */
  const sovComp = sovFieldCompleteness(extras.sov.locations ?? []);
  const sovBand: Band = sovComp.pct >= 90 ? "good" : sovComp.pct >= 70 ? "watch" : "alert";

  const groups: InsightGroup[] = [
    {
      stepIndex: 1, stepLabel: "Ingestion", stepIcon: ClipboardList,
      cards: [
        { label: "Documentation Received", value: `${docsReceived}/${docsTotal} docs`, band: docsBand, note: `${dataPct}% of critical fields extracted`, docPills: expectedDocItems },
        { label: "Statement of Values (SOV)", value: `${sovComp.encoded}/${sovComp.total} fields`, band: sovBand, note: `${sovComp.pct}% of required CP SOV fields encoded`, docPills: sovComp.fieldItems },
      ],
    },
    {
      stepIndex: 2, stepLabel: "Triage", stepIcon: Target,
      cards: [keyScores.find((s) => s.label === "AI Priority Score")!],
      checks: [
        { label: "Clearance", passed: triage.clearance },
        { label: "OFAC Compliance", passed: triage.ofac },
        { label: "Appetite", passed: triage.appetite },
      ],
    },
    {
      stepIndex: 3, stepLabel: "UW Analysis", stepIcon: Sparkles,
      cards: [
        { ...keyScores.find((s) => s.label === "Loss History")!, tier: "L1" as const },
        (() => {
          const peers = INFORCE_BOOK.filter(
            (a) => a.industry === idx.accountIndustry &&
              Math.abs(a.tiv - parseTIV(meta.tiv)) / Math.max(parseTIV(meta.tiv), 1) <= 0.6,
          );
          const total = peers.length;
          const bound = peers.filter((a) => a.decision === "Bound").length;
          const bandVal: Band = total === 0 ? "watch" : bound / total >= 0.6 ? "good" : bound / total >= 0.3 ? "watch" : "alert";
          const submOccupancy = (extras.sov.locations ?? [])[0]?.occupancy ?? "";
          const occupancyMatch = peers.length > 0
            ? peers.filter(p => p.occupancy.toLowerCase().includes(submOccupancy.split(" ")[0].toLowerCase())).length / peers.length >= 0.5
            : true;
          const bands = [
            { label: "$0–150M",   count: peers.filter(p => p.tiv < 150).length },
            { label: "$150–250M", count: peers.filter(p => p.tiv >= 150 && p.tiv < 250).length },
            { label: "$250M+",    count: peers.filter(p => p.tiv >= 250).length },
          ].filter(b => b.count > 0);
          const topState = meta.territory.split(",")[0].trim();
          const topPeril = (extras.request.perils[0] ?? "All Risk").replace("All Risk (AOP)", "AOP");
          const boundPeers = peers.filter(a => a.decision === "Bound");
          const similarAccountNames = boundPeers.length > 0
            ? boundPeers.map(a => a.account)
            : peers.slice(0, 3).map(a => a.account);
          return {
            label: "Comparable Accounts",
            value: String(total),
            band: bandVal,
            note: `Based on occupancy, construction mix, TIV, CAT exposure, loss history, and participation structure — ${total} comparable ${idx.accountIndustry} account${total !== 1 ? "s" : ""} identified`,
            similarAccountNames,
            tier: "L2" as const,
          };
        })(),
      ],
    },
    {
      stepIndex: 4, stepLabel: "UW Review", stepIcon: Scale,
      cards: [
        (() => {
          const CAT_STATES = new Set(["FL","CA","TX","OK","LA","SC","GA","NC"]);
          // Count locations per state from this account's SOV
          const locsByState: Record<string, number> = {};
          (extras.sov.locations ?? []).forEach(l => {
            locsByState[l.state] = (locsByState[l.state] ?? 0) + 1;
          });
          const totalLocs = (extras.sov.locations ?? []).length || extras.sov.stats.locationCount || 1;
          // Top 3 states by location count
          const top3: AccumState[] = Object.entries(locsByState)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([state, locCount]) => ({
              state,
              locCount,
              locPct: Math.round((locCount / totalLocs) * 100),
              bookTIVM: INFORCE_BY_STATE[state] ?? 0,
              bookShare: INFORCE_BY_STATE[state] ? Math.round((INFORCE_BY_STATE[state] / INFORCE_TOTAL) * 100) : 0,
              isCATState: CAT_STATES.has(state),
            }));
          const hasCATOverlap = top3.some(s => s.isCATState);
          const hasHighBookOverlap = top3.some(s => s.bookShare >= 10);
          const bandVal: Band = (hasCATOverlap && hasHighBookOverlap) ? "alert" : (hasCATOverlap || hasHighBookOverlap) ? "watch" : "good";
          const topState = top3[0]?.state ?? extras.sov.stats.topState;
          return {
            label: "Accumulation Risk",
            value: topState,
            band: bandVal,
            note: `Top 3 states by locations · book overlap shown`,
            accumStates: top3,
            tier: "L2" as const,
          };
        })(),
      ],
    },
  ];

  useStepActions([
    { icon: ChevronRight, label: "Proceed to Ingestion", onClick: onProceed },
  ], [onProceed]);
  return (
    <>
      <RecommendationBanner meta={meta} idx={idx} extras={extras} recommendation={recommendation} status={idx.processingStatus} focusNote={extras.focusNote} triage={triage} />
      <div className="grid grid-cols-2 gap-4 mt-4" style={{ gridTemplateRows: "auto auto" }}>
        {/* Left column — stacked */}
        <div className="flex flex-col gap-4">
          <KeyInsightsPanel groups={groups} onNavigate={onNavigate} onScoreClick={handleScoreClick} navigableLabels={new Set(Object.keys(INSIGHT_STEP))} />
          <TivDistributionPanel idx={idx} extras={extras} />
        </div>
        {/* Right column — Account Details + Coverage Request stacked */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E8E6E1] rounded-md p-4">
            <AccountDetailsPanel meta={meta} idx={idx} extras={extras} />
          </div>
          <CoverageRequestPanel extras={extras} />
        </div>
      </div>
    </>
  );
}

/* FieldInfoTooltip moved to ./IngestionStep */
/* ── Step 1: Ingestion — moved to ./IngestionStep ── */

const METRIC_TOOLTIP_TEXT = "The tooltip text needs to be updated";

/* ⓘ metric help icon — shows common data-source tooltip on hover */
function MetricTooltip({ content = METRIC_TOOLTIP_TEXT }: { content?: string }) {
  return (
    <TooltipPrimitive.Root delayDuration={100}>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#C9C7C1] text-[#9B9B98] hover:border-[#0076BC] hover:text-[#0076BC] transition-colors flex-shrink-0"
          style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}
          aria-label="Metric explanation"
        >
          i
        </button>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top" align="center" sideOffset={6}
          className="z-[9999] max-w-[260px] px-3 py-2 rounded-lg text-[11px] leading-snug"
          style={{
            backgroundColor: "#fff",
            color: "#374151",
            fontWeight: 500,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
          }}
        >
          {content}
          <TooltipPrimitive.Arrow style={{ fill: "#E5E7EB" }} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* makePdfPages, Row, fieldKey, CitationModal, IngestionStep, IngestionActions moved to ./IngestionStep */

/* ── Step 2: Triage ── */

interface ClearanceRecord {
  found: boolean;
  sfRecordId?: string;
  sfAccountName?: string;
  sfOwner?: string;
  sfLastActivity?: string;
  sfStatus?: string;
  matchedFields?: Array<{ label: string; submission: string; salesforce: string; match: boolean }>;
  noRecordReason?: string;
}

const OFAC_SANCTIONED = new Set(["Cuba","Iran","North Korea","Russia","Syria","Belarus","Venezuela","Myanmar","Sudan","Zimbabwe"]);
const OFAC_WATCH = ["China","UAE","Saudi Arabia","Pakistan","Iraq","Libya","Yemen","Somalia"];
function buildOfacResult(homeOffice: string): { country: string; sanctioned: boolean; watchList: boolean } {
  const parts = homeOffice.split(",");
  const country = parts[parts.length - 1]?.trim() ?? homeOffice;
  const sanctioned = OFAC_SANCTIONED.has(country);
  const watchList = !sanctioned && OFAC_WATCH.includes(country);
  return { country, sanctioned, watchList };
}

const UW_AUTHORITY: Record<string, { region: string; authority: string; daRef: string }> = {
  "Mike Farrell":  { region: "Midwest / Great Lakes",      authority: "Up to $150M TIV, all classes",                   daRef: "DA-2024-MF-001" },
  "Priya Patel":   { region: "Northeast / Mid-Atlantic",   authority: "Up to $200M TIV, Technology & Manufacturing",    daRef: "DA-2024-PP-002" },
  "Jordan Lee":    { region: "Southeast / Gulf Coast",     authority: "Up to $100M TIV, excluding FL Wind",             daRef: "DA-2024-JL-003" },
  "Ashley Romero": { region: "West / Pacific",             authority: "Up to $175M TIV, EQ-exposed accounts",          daRef: "DA-2024-AR-004" },
  "Diego Alvarez": { region: "South Central / TX",         authority: "Up to $125M TIV, Energy & Logistics",           daRef: "DA-2024-DA-005" },
};

const INDUSTRY_BIND_RATE: Record<string, number> = {
  Manufacturing: 58, Technology: 71, Logistics: 54, Hospitality: 49, Healthcare: 62, Retail: 52,
};

function buildClearanceRecord(meta: SubmissionMeta, idx: SubmissionIndexEntry): ClearanceRecord {
  const found = idx.clearance === "complete";
  if (!found) {
    return {
      found: false,
      noRecordReason: "No existing Salesforce account record matching this named insured was found. This submission is cleared as new business — no conflicting in-flight submissions detected across all UW desks.",
    };
  }
  return {
    found: true,
    sfRecordId: `SF-ACC-${meta.id.replace("SUB-2026-", "7")}41`,
    sfAccountName: meta.namedInsured,
    sfOwner: idx.assignedUW || "Mike Farrell",
    sfLastActivity: meta.submissionDate,
    sfStatus: "Active — Prior Relationship",
    matchedFields: [
      { label: "Named Insured", submission: meta.namedInsured, salesforce: meta.namedInsured, match: true },
      { label: "NAICS Code", submission: meta.naics.split(" — ")[0], salesforce: meta.naics.split(" — ")[0], match: true },
      { label: "Home Office", submission: idx.homeOffice, salesforce: idx.homeOffice, match: true },
      { label: "Broker House", submission: meta.brokerageHouse, salesforce: meta.brokerageHouse, match: true },
      { label: "Submission Type", submission: meta.type, salesforce: meta.type === "Renewal" ? "Renewal" : "Prior New Business", match: meta.type === "Renewal" },
    ],
  };
}

function TriageStep({ meta, idx, extras, onProceed }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras; onProceed: () => void;
}) {
  const [assignedUW, setAssignedUW] = useState(idx.assignedUW || "Mike Farrell");
  const [activeCategory, setActiveCategory] = useState("clearance");

  const clearanceOk = idx.clearance === "complete";
  const clearanceRecord = buildClearanceRecord(meta, idx);
  const mismatches = clearanceRecord.matchedFields?.filter(f => !f.match) ?? [];

  const ofacResult = buildOfacResult(idx.homeOffice);
  const industryRate = INDUSTRY_BIND_RATE[meta.industry] ?? 55;
  const combinedPropensity = Math.round((idx.brokerBoundRate + industryRate) / 2);
  const propensityStatus: StepStatus = combinedPropensity >= 60 ? "good" : combinedPropensity >= 45 ? "watch" : "alert";
  const brokerStatus: StepStatus = idx.brokerBoundRate >= 65 ? "good" : idx.brokerBoundRate >= 45 ? "watch" : "alert";
  const uwAuth = UW_AUTHORITY[assignedUW] ?? UW_AUTHORITY["Mike Farrell"];

  const categories: StepCategory[] = [
    /* ── Clearance ── */
    {
      key: "clearance",
      icon: Database,
      title: "Clearance — Salesforce",
      metric: clearanceRecord.found ? "1 record matched" : "No record",
      status: clearanceOk ? "good" : "watch",
      statusLabel: clearanceOk ? "Cleared" : "In progress",
      headline: clearanceRecord.found
        ? `Matched to Salesforce record ${clearanceRecord.sfRecordId} (${clearanceRecord.sfAccountName}), owned by ${clearanceRecord.sfOwner}.`
        : "No conflicting record found in Salesforce — this account is not in flight with another desk.",
      context: clearanceRecord.found
        ? mismatches.length > 0
          ? `${mismatches.length} of ${clearanceRecord.matchedFields?.length} matched fields differ from the submission and need confirmation.`
          : "All matched fields agree with the submission data."
        : clearanceRecord.noRecordReason,
      sources: ["Salesforce", "Application"],
      summaryRows: clearanceRecord.found
        ? (clearanceRecord.matchedFields ?? []).map(f => ({
            key: f.label,
            label: f.label,
            value: f.submission,
            status: (f.match ? "good" : "watch") as StepStatus,
          }))
        : [{ key: "none", label: "Duplicate submissions", value: "0", status: "good" as StepStatus }],
      narrative: clearanceRecord.found
        ? `The clearance agent cross-referenced named insured, broker and NAICS against Salesforce and returned a single candidate. Confirm the ${mismatches.length > 0 ? "flagged" : "matched"} fields below before the account is assigned.`
        : "The clearance agent found no candidate records, so there is no ownership conflict to resolve. Clearance passes on a no-match basis.",
      groups: clearanceRecord.found
        ? [{
            title: "Salesforce Record",
            rows: [
              { label: "Record ID", value: clearanceRecord.sfRecordId },
              { label: "Account Name", value: clearanceRecord.sfAccountName },
              { label: "Record Owner", value: clearanceRecord.sfOwner },
              { label: "Last Activity", value: clearanceRecord.sfLastActivity },
              { label: "Salesforce Status", value: clearanceRecord.sfStatus },
            ],
          }]
        : [{
            title: "Search Result",
            rows: [
              { label: "Records found", value: "0", status: "good" },
              { label: "Basis", value: clearanceRecord.noRecordReason },
              { label: "Searched on", value: `${meta.namedInsured} · ${meta.broker} · NAICS ${meta.naics}` },
            ],
          }],
      table: clearanceRecord.found && clearanceRecord.matchedFields
        ? {
            columns: ["Field", "Submission", "Salesforce", "Result"],
            rows: clearanceRecord.matchedFields.map(f => ({
              key: f.label,
              highlight: !f.match,
              cells: [
                <span key="label" className="text-[#2D2D2D]" style={{ fontWeight: 500 }}>{f.label}</span>,
                f.submission,
                f.salesforce,
                <span key="result" className={`inline-flex items-center gap-1 text-[11px] ${f.match ? "text-emerald-700" : "text-amber-700"}`} style={{ fontWeight: 600 }}>
                  {f.match ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {f.match ? "Match" : "Differs"}
                </span>,
              ],
            })),
            caption: "Field-by-field comparison between the submission and the matched Salesforce record.",
          }
        : undefined,
    },

    /* ── OFAC Compliance ── */
    {
      key: "ofac",
      icon: ShieldCheck,
      title: "OFAC Compliance",
      metric: ofacResult.country,
      status: ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good",
      statusLabel: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Cleared",
      headline: ofacResult.sanctioned
        ? "HQ country is on the OFAC sanctions list — this submission cannot proceed."
        : ofacResult.watchList
          ? "HQ country is on the enhanced due-diligence watch list — manual review required."
          : "Headquarters country is not subject to OFAC sanctions — submission cleared.",
      context: `Headquarters: ${idx.homeOffice} · NAICS: ${meta.naics} · Submission: ${meta.id}`,
      sources: ["OFAC SDN List", "Application"],
      summaryRows: [
        { key: "country", label: "HQ Country", value: ofacResult.country, status: (ofacResult.sanctioned ? "alert" : "good") as StepStatus },
        { key: "sanctions", label: "Sanctions Status", value: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Clear", status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
        { key: "insured", label: "Named Insured", value: meta.namedInsured, status: "good" as StepStatus },
        { key: "date", label: "Submission Date", value: meta.submissionDate, status: "good" as StepStatus },
      ],
      narrative: "Sanctions screening is performed against the OFAC SDN and consolidated sanctions lists. The HQ country of the named insured is the primary screen; broker country is validated separately.",
      groups: [{
        title: "Sanctions Screening",
        rows: [
          { label: "HQ Country", value: ofacResult.country, status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
          { label: "OFAC Sanctions List", value: ofacResult.sanctioned ? "Match — Sanctioned" : ofacResult.watchList ? "Watch List — EDD Required" : "No Match — Clear", status: (ofacResult.sanctioned ? "alert" : ofacResult.watchList ? "watch" : "good") as StepStatus },
          { label: "NAICS Code", value: meta.naics },
          { label: "Submission Type", value: meta.type },
          { label: "Broker Country", value: "United States", status: "good" as StepStatus, note: "All domestic brokers — no secondary country screen required" },
        ],
      }],
    },

    /* ── Success Propensity ── */
    {
      key: "propensity",
      icon: TrendingUp,
      title: "Success Propensity",
      metric: `${combinedPropensity}%`,
      status: propensityStatus,
      statusLabel: combinedPropensity >= 60 ? "High" : combinedPropensity >= 45 ? "Moderate" : "Low",
      headline: `Combined bind likelihood ${combinedPropensity}% — ${meta.brokerageHouse} broker rate ${idx.brokerBoundRate}% (${idx.brokerTrend}) · ${meta.industry} industry rate ${industryRate}%.`,
      context: idx.successPropensityDrivers,
      sources: ["Broker History", "Industry Benchmarks"],
      summaryRows: [
        { key: "broker", label: "Broker Bind Rate", value: `${idx.brokerBoundRate}%`, status: brokerStatus },
        { key: "industry", label: "Industry Bind Rate", value: `${industryRate}%`, status: (industryRate >= 60 ? "good" : industryRate >= 45 ? "watch" : "alert") as StepStatus },
        { key: "combined", label: "Combined Likelihood", value: `${combinedPropensity}%`, status: propensityStatus },
      ],
      narrative: "Bind likelihood is the average of the broker's historical bind rate with QBE and the benchmark bind rate for this industry class. It signals the commercial probability of winning this account, independent of underwriting risk.",
      groups: [{
        title: "Bind Rate Inputs",
        rows: [
          { label: "Broker", value: meta.brokerageHouse, note: `${idx.brokerBoundRate}% bind rate with QBE`, status: brokerStatus },
          { label: "Broker Trend", value: idx.brokerTrend === "up" ? "Improving ↑" : idx.brokerTrend === "down" ? "Declining ↓" : "Stable →", status: (idx.brokerTrend === "up" ? "good" : idx.brokerTrend === "down" ? "alert" : "neutral") as StepStatus },
          { label: "Industry", value: meta.industry, note: `${industryRate}% QBE industry benchmark`, status: (industryRate >= 60 ? "good" : industryRate >= 45 ? "watch" : "alert") as StepStatus },
          { label: "Combined Likelihood", value: `${combinedPropensity}%`, note: "Average of broker and industry bind rates", status: propensityStatus },
        ],
      }],
    },

    /* ── UW Assignment ── */
    {
      key: "assignment",
      icon: UserCheck,
      title: "Underwriter Assignment",
      metric: assignedUW,
      status: "neutral",
      statusLabel: "Assigned",
      headline: `${assignedUW} is assigned under DA ${uwAuth.daRef}, covering ${uwAuth.region}.`,
      context: `${meta.type} · ${meta.coverageType} · ${meta.territory}.`,
      sources: ["Delegated Authority Letter", "Regional Coverage Map", "Submission Email"],
      summaryRows: [
        { key: "uw", label: "Assigned UW", value: assignedUW },
        { key: "da", label: "DA Reference", value: uwAuth.daRef },
        { key: "region", label: "Authorised Region", value: uwAuth.region },
      ],
      narrative: "Assignment is based on territorial coverage under the delegated authority letter, confirmed by the submission email routing. Override using the selector if a different UW holds regional authority.",
      groups: [
        {
          title: "Delegated Authority",
          rows: [
            { label: "DA Reference", value: uwAuth.daRef },
            { label: "Authorised Region", value: uwAuth.region },
            { label: "Authority Limit", value: uwAuth.authority },
            { label: "Assigned UW", value: assignedUW },
          ],
        },
        {
          title: "Submission Routing Basis",
          rows: [
            { label: "Territory", value: meta.territory },
            { label: "Named Insured", value: meta.namedInsured },
            { label: "Broker", value: `${meta.broker} — ${meta.brokerageHouse}` },
            { label: "Submission Type", value: meta.type },
            { label: "Submission Email", value: `Routed via ${meta.brokerageHouse} submission inbox`, note: "Direct email reference confirmed in submission record" },
          ],
        },
      ],
      custom: (
        <div className="rounded-md border border-[#E8E6E1] bg-white p-3">
          <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Reassign Underwriter</label>
          <select value={assignedUW} onChange={e => setAssignedUW(e.target.value)}
            className="mt-1 w-full text-[12px] px-3 py-2 rounded-md border border-[#E8E6E1] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#0076BC]">
            {["Mike Farrell", "Priya Patel", "Jordan Lee", "Ashley Romero", "Diego Alvarez"].map(uw => (
              <option key={uw}>{uw}</option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  const active = categories.find(c => c.key === activeCategory) ?? categories[0];

  return (
    <>
      <TriageActions onProceed={onProceed} />

      <StepShell
        scrollToSourceOn={activeCategory}
        summary={
          <div className="bg-white border border-[#E8E6E1] rounded-md">
            <div className="grid divide-x divide-[#E8E6E1]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[
                {
                  label: "Clearance",
                  value: clearanceOk ? "Cleared" : "In progress",
                  color: clearanceOk ? "#059669" : "#D97706",
                },
                {
                  label: "OFAC Compliance",
                  value: ofacResult.sanctioned ? "Sanctioned" : ofacResult.watchList ? "Watch List" : "Cleared",
                  color: ofacResult.sanctioned ? "#DC2626" : ofacResult.watchList ? "#D97706" : "#059669",
                },
                {
                  label: "Success Propensity",
                  value: `${combinedPropensity}%`,
                  color: combinedPropensity >= 60 ? "#059669" : combinedPropensity >= 45 ? "#D97706" : "#DC2626",
                },
                {
                  label: "Assigned UW",
                  value: assignedUW,
                  color: "#0D1B2E",
                },
              ].map(stat => (
                <div key={stat.label} className="px-3 py-1.5">
                  <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                  <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        }
        leftHeader={<PaneTitle title="Triage Rule Outcomes" hint="select a category for its full detail" />}
        left={
          <CategorySummaryList
            categories={categories}
            activeKey={active.key}
            onSelect={setActiveCategory}
          />
        }
        rightHeader={<PaneTitle title={active.title} hint="supporting evidence & criteria" />}
        right={<CategoryDetailView category={active} />}
      />
    </>
  );
}

function TriageActions({ onProceed }: { onProceed: () => void }) {
  useStepActions([
    { icon: Send, label: "Proceed to UW Analysis", onClick: onProceed },
  ], []);
  return null;
}

/* ── UW Analysis helpers ── */

/** Which summarised measure the underwriter drilled into, if any. */
type MeasureFilter = { category: string; rowKey: string } | null;

const DELTA_TREND: Record<BookDelta, Trend> = { under: "down", "in-line": "flat", over: "up" };
const DELTA_LABEL: Record<BookDelta, string> = { under: "under", "in-line": "in line with", over: "over" };

/** Where a measure sits against comparable bound business, as a display trend. */
function trendOf(subject: number, benchmark: number, tolerance?: number): Trend {
  return DELTA_TREND[bookDelta(subject, benchmark, tolerance)];
}

/** The SOV field each COPE category groups by — also the field a drill-in filters on. */
const CATEGORY_FIELD: Record<string, keyof Pick<SovLocation, "construction" | "occupancy" | "protectionCode" | "state">> = {
  construction: "construction",
  occupancy: "occupancy",
  protection: "protectionCode",
  exposure: "state",
};

// States with Named Windstorm CAT exposure
const NWS_STATES = new Set(["FL","TX","LA","SC","GA","NC","MS","AL","VA"]);
// States with meaningful Earthquake exposure
const EQ_STATES  = new Set(["CA","OR","WA","NV","AK","UT","ID"]);
// States with elevated Flood risk (coastal + river-basin)
const FLOOD_STATES = new Set(["FL","LA","TX","MS","AL","SC","NC","VA","NY","NJ"]);

function LossHistoryTable({
  lossHistory,
  submissionType,
}: {
  lossHistory: SubmissionExtras["lossHistory"];
  submissionType: "New Business" | "Renewal" | "Remarket";
}) {
  const breakdown = lossHistory.yearlyBreakdown ?? [];
  const totalK = breakdown.reduce((s, y) => s + parsePaidK(y.paid), 0);
  const lrBand = lossHistory.lossRatioBand;
  const lrColor = lrBand === "good" ? "#059669" : lrBand === "watch" ? "#D97706" : "#DC2626";
  const pierceYears = new Set(
    (lossHistory.layerPenetration?.piercingEvents ?? []).map(e => e.year)
  );
  const isRenewal = submissionType === "Renewal";

  // For renewal: sum of QBE layer losses across all years
  const totalLayerK = isRenewal
    ? breakdown.reduce((s, y) => s + (y.qbeLayerLoss ? parsePaidK(y.qbeLayerLoss) : 0), 0)
    : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Card 1 — Annual Loss Summary */}
      <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
        <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>
            Annual Loss Summary — Last {lossHistory.claimsYears} Years
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#9B9B98]">{lossHistory.claimsYears}-yr paid: {fmtPaid(totalK)}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
              fontWeight: 700, color: lrColor,
              backgroundColor: lrBand === "good" ? "#F0FDF4" : lrBand === "watch" ? "#FFFBEB" : "#FEF2F2",
              border: `1px solid ${lrBand === "good" ? "#BBF7D0" : lrBand === "watch" ? "#FDE68A" : "#FECACA"}`,
            }}>LR {lossHistory.lossRatio}</span>
          </div>
        </div>

        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#F0EFEC]">
              <th className="px-3 py-1.5 text-left text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Year</th>
              <th className="px-3 py-1.5 text-right text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Gross Paid</th>
              {isRenewal && (
                <th className="px-3 py-1.5 text-right text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>QBE Layer Loss</th>
              )}
              <th className="px-3 py-1.5 text-center text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>Layer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9F8F7]">
            {breakdown.map(y => {
              const k = parsePaidK(y.paid);
              const pierced = pierceYears.has(y.year);
              return (
                <tr key={y.year} className={pierced ? "bg-red-50/60" : "hover:bg-[#FAFAF9]"}>
                  <td className="px-3 py-1.5 text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{y.year}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: k === 0 ? "#C9C7C1" : "#0D1B2E" }}>
                    {k === 0 ? "—" : y.paid}
                  </td>
                  {isRenewal && (
                    <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: y.qbeLayerLoss ? "#0D1B2E" : "#C9C7C1" }}>
                      {y.qbeLayerLoss ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-center">
                    {pierced
                      ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200" style={{ fontWeight: 700 }}>Pierced</span>
                      : <span className="text-[9px] text-[#C9C7C1]">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E8E6E1] bg-[#FAFAF9]">
              <td className="px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>5-Yr Total</td>
              <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 700, color: "#0D1B2E" }}>{fmtPaid(totalK)}</td>
              {isRenewal && (
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 700, color: "#0D1B2E" }}>
                  {totalLayerK > 0 ? fmtPaid(totalLayerK) : "—"}
                </td>
              )}
              <td />
            </tr>
          </tfoot>
        </table>

        <div className="px-3 py-1.5 border-t border-[#F0EFEC] bg-[#FAFAF9]">
          <p className="text-[10px] text-[#6B7280] leading-snug">{lossHistory.summary}</p>
        </div>
      </div>

      {/* Card 2 — Individual Claims */}
      {(lossHistory.claims?.length ?? 0) > 0 && (
        <ClaimsTable claims={lossHistory.claims!} />
      )}
    </div>
  );
}

type ClaimRow = NonNullable<SubmissionExtras["lossHistory"]["claims"]>[number];
type ClaimSortKey = "lossDate" | "paid" | "incurred" | "status" | "peril" | "location";

function ClaimsTable({ claims }: { claims: ClaimRow[] }) {
  const [sortCol, setSortCol] = useState<ClaimSortKey>("lossDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeril, setFilterPeril] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const uniqueStatuses = useMemo(() => [...new Set(claims.map(c => c.status))].sort(), [claims]);
  const uniquePerils   = useMemo(() => [...new Set(claims.map(c => c.peril))].sort(), [claims]);

  function toggleSort(col: ClaimSortKey) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "lossDate" ? "desc" : "desc"); }
  }

  const sorted = [...claims].sort((a, b) => {
    let va: any, vb: any;
    if (sortCol === "lossDate") { va = a.lossDate; vb = b.lossDate; }
    else if (sortCol === "paid")     { va = a.paid;     vb = b.paid; }
    else if (sortCol === "incurred") { va = a.incurred; vb = b.incurred; }
    else if (sortCol === "status")   { va = a.status;   vb = b.status; }
    else if (sortCol === "peril")    { va = a.peril;    vb = b.peril; }
    else                             { va = a.location; vb = b.location; }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const filtered = sorted.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPeril  && c.peril  !== filterPeril)  return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (![c.claimId, c.location, c.peril, c.status].some(v => v.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const sortTh = (label: string, col: ClaimSortKey, right = false) => (
    <th onClick={() => toggleSort(col)}
      className={`px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98] cursor-pointer hover:text-[#0076BC] select-none whitespace-nowrap ${right ? "text-right" : "text-left"} ${sortCol === col ? "text-[#0076BC]" : ""}`}
      style={{ fontWeight: 700 }}>
      {label}{sortCol === col ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
    </th>
  );

  const statusCfg: Record<string, { bg: string; text: string; border: string }> = {
    Closed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Open:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  };
  const fmtAmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${Math.round(n/1_000)}K` : `$${n}`;

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      {/* Search bar */}
      <div className="px-3 py-1.5 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center gap-2">
        <Search className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search claims, location, peril…"
          className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#C4C2BE]"
          style={{ color: "#2D2D2D" }}
        />
        {searchQ && (
          <button onClick={() => setSearchQ("")} className="text-[#9B9B98] hover:text-[#5D5D5D]">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {/* Filters */}
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center gap-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Individual Claims — {claims.length} records</span>
        <div className="flex items-center gap-2 ml-auto">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className={`h-5 pl-2 pr-5 rounded border text-[9px] bg-white appearance-none cursor-pointer outline-none ${filterStatus ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
            style={{ fontWeight: filterStatus ? 700 : 500 }}>
            <option value="">Status</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPeril} onChange={e => setFilterPeril(e.target.value)}
            className={`h-5 pl-2 pr-5 rounded border text-[9px] bg-white appearance-none cursor-pointer outline-none max-w-[140px] ${filterPeril ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
            style={{ fontWeight: filterPeril ? 700 : 500 }}>
            <option value="">Peril</option>
            {uniquePerils.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterStatus || filterPeril) && (
            <button onClick={() => { setFilterStatus(""); setFilterPeril(""); }}
              className="text-[9px] text-[#0076BC] hover:text-[#005A8E] flex items-center gap-0.5" style={{ fontWeight: 600 }}>
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          )}
          <span className="text-[9px] text-[#9B9B98] tabular-nums">{filtered.length} shown</span>
        </div>
      </div>
      {/* Scrollable table — fixed height ~20 rows */}
      <div className="overflow-auto" style={{ maxHeight: "520px" }}>
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#F0EFEC] bg-[#FAFAF9]">
              {sortTh("Claim ID",    "location")}
              {sortTh("Location",    "location")}
              {sortTh("Loss Date",   "lossDate")}
              {sortTh("Peril",       "peril")}
              {sortTh("Status",      "status")}
              {sortTh("Paid",        "paid",     true)}
              {sortTh("Case Rsv",   "incurred", true)}
              {sortTh("Incurred",   "incurred", true)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9F8F7]">
            {filtered.map(c => {
              const sc = statusCfg[c.status] ?? statusCfg["Open"];
              const hasOpen = c.status === "Open";
              return (
                <tr key={c.claimId} className={`hover:bg-[#FAFAF9] ${hasOpen ? "bg-amber-50/30" : ""}`}>
                  <td className="px-3 py-1.5 tabular-nums text-[10px] text-[#6B7280] whitespace-nowrap" style={{ fontWeight: 600 }}>{c.claimId}</td>
                  <td className="px-3 py-1.5 max-w-[140px]"><span className="block truncate text-[#2D2D2D]">{c.location}</span></td>
                  <td className="px-3 py-1.5 tabular-nums text-[#4B5563] whitespace-nowrap">{c.lossDate}</td>
                  <td className="px-3 py-1.5 text-[#5D5D5D] max-w-[120px]"><span className="block truncate">{c.peril}</span></td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] ${sc.bg} ${sc.text} ${sc.border}`} style={{ fontWeight: 700 }}>{c.status}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: c.paid > 0 ? "#0D1B2E" : "#C9C7C1" }}>{c.paid > 0 ? fmtAmt(c.paid) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#6B7280]">{c.caseReserve > 0 ? fmtAmt(c.caseReserve) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontWeight: 600, color: "#0D1B2E" }}>{fmtAmt(c.incurred)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PerilSummaryStrip({ perils, sov, lossHistory, layer }: {
  perils: string[];
  sov: SubmissionExtras["sov"];
  lossHistory: SubmissionExtras["lossHistory"];
  layer: string;
}) {
  const sovLocs = sov.locations ?? [];
  const totalTIV = sovLocs.reduce((s, l) => s + parseTIV(l.tiv), 0);
  const modelledCount = sovLocs.filter(l => l.catModel === "Modelled").length;
  const totalClaimsPaidK = (lossHistory.yearlyBreakdown ?? []).reduce((s, y) => s + parsePaidK(y.paid), 0);
  const claimsPaid5yr = fmtPaid(totalClaimsPaidK);

  const perilData = perils.map(peril => {
    const isNWS   = /windstorm/i.test(peril);
    const isEQ    = /earthquake/i.test(peril);
    const isFlood = /flood/i.test(peril);
    const isAOP   = !isNWS && !isEQ && !isFlood;

    const exposed = isAOP   ? sovLocs
      : isNWS   ? sovLocs.filter(l => NWS_STATES.has(l.state))
      : isFlood ? sovLocs.filter(l => FLOOD_STATES.has(l.state))
      : isEQ    ? sovLocs.filter(l => EQ_STATES.has(l.state))
      : [];

    const exposedTIV = exposed.reduce((s, l) => s + parseTIV(l.tiv), 0);
    const exposedPct = totalTIV > 0 ? Math.round((exposedTIV / totalTIV) * 100) : 0;
    const avgHazard  = exposed.length
      ? Math.round(exposed.reduce((s, l) => s + l.hazard, 0) / exposed.length)
      : 0;

    // A/B vs C/D TIV split within exposed locations
    const abTIV = exposed.filter(l => locHazardGrade(l.hazard) === "A" || locHazardGrade(l.hazard) === "B")
      .reduce((s, l) => s + parseTIV(l.tiv), 0);
    const cdTIV = exposed.filter(l => locHazardGrade(l.hazard) === "C" || locHazardGrade(l.hazard) === "D")
      .reduce((s, l) => s + parseTIV(l.tiv), 0);
    const abPct = exposedTIV > 0 ? Math.round((abTIV / exposedTIV) * 100) : 0;
    const cdPct = exposedTIV > 0 ? Math.round((cdTIV / exposedTIV) * 100) : 0;

    // Sprinklered vs Not Sprinklered TIV (PC ≤ 3 = sprinklered)
    const spkldTIV    = exposed.filter(l => parsePC(l.protectionCode) <= 3).reduce((s, l) => s + parseTIV(l.tiv), 0);
    const notSpkldTIV = exposedTIV - spkldTIV;
    const spkldPct    = exposedTIV > 0 ? Math.round((spkldTIV / exposedTIV) * 100) : 0;
    const notSpkldPct = 100 - spkldPct;

    // top state by TIV within exposed
    const byState: Record<string, number> = {};
    exposed.forEach(l => { byState[l.state] = (byState[l.state] ?? 0) + parseTIV(l.tiv); });
    const topState = Object.entries(byState).sort((a, b) => b[1] - a[1])[0];

    const status: StepStatus = exposed.length === 0 ? "good"
      : avgHazard >= 70 ? "alert"
      : avgHazard >= 55 ? "watch"
      : "good";

    return { peril, exposedTIV, exposedPct, abTIV, cdTIV, abPct, cdPct, spkldTIV, notSpkldTIV, spkldPct, notSpkldPct, topState, exposed: exposed.length, status, isAOP };
  });

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Peril Summary</span>
        {modelledCount === 0 && !sov.modellingReady
          ? <span className="text-[9px] text-[#D97706]" style={{ fontWeight: 600 }}>Pending CAT &amp; HX Pricing Data</span>
          : <span className="text-[9px] text-[#9B9B98]">QBE layer: {layer} · {modelledCount}/{sov.stats?.locationCount ?? sovLocs.length} locations CAT modelled · 5-yr claims paid: {claimsPaid5yr}</span>
        }
      </div>
      <div className={`grid gap-0 divide-x divide-[#F0EFEC]`} style={{ gridTemplateColumns: `repeat(${perils.length}, 1fr)` }}>
        {perilData.map((p, i) => {
          const s = BAND_STYLE[p.status];
          return (
            <div key={i} className="px-4 py-3 space-y-2">
              {/* Peril name */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{p.peril}</span>
                <span className={`text-[9px] ${p.exposed === 0 ? "text-[#9B9B98]" : s.text}`} style={{ fontWeight: 600 }}>
                  {p.exposed === 0 ? "No exposure" : p.status === "alert" ? "Elevated" : p.status === "watch" ? "Monitor" : "In appetite"}
                </span>
              </div>
              {/* Key metrics */}
              {p.exposed > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9B9B98]">TIV</span>
                    <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{fmtTIV(p.exposedTIV)} <span className="text-[9px] text-[#9B9B98]">({p.exposedPct}%)</span></span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">A/B Hazard TIV</span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.abTIV)} <span className="text-[9px] text-[#9B9B98]">({p.abPct}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">C/D Hazard TIV</span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.cdTIV)} <span className="text-[9px] text-[#9B9B98]">({p.cdPct}%)</span>
                      </span>
                    </div>
                  </div>
                  {/* Sprinklered TIV breakout */}
                  <div className="pt-1 border-t border-[#F0EFEC] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
                        <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
                        Sprinklered TIV
                      </span>
                      <span className="text-[11px] tabular-nums text-[#2D2D2D]" style={{ fontWeight: 600 }}>
                        <span style={{ color: p.spkldPct >= 75 ? "#059669" : p.spkldPct >= 50 ? "#D97706" : "#DC2626" }}>{fmtTIV(p.spkldTIV)}</span>{" "}
                        <span className="text-[9px] text-[#9B9B98]">({p.spkldPct}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-[#9B9B98]">
                        <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#E0E8FF", border: "1px solid #CBD5E1" }} />
                        Not Sprinklered
                      </span>
                      <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>
                        {fmtTIV(p.notSpkldTIV)} <span className="text-[9px] text-[#9B9B98]">({p.notSpkldPct}%)</span>
                      </span>
                    </div>
                  </div>
                  {p.topState && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9B9B98]">Top State</span>
                      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{p.topState[0]} <span className="text-[9px] text-[#9B9B98]">{fmtTIV(p.topState[1])}</span></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9B9B98]">Claims Paid (5 yr)</span>
                    <span className="text-[11px] text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{claimsPaid5yr}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-[#C9C7C1] italic">No locations in {p.peril.toLowerCase()} exposure states</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HistoricDecision {
  account: string;
  hazard: number;
  topConstruction: string;
  constrPct: number;
  topOccupancy: string;
  lossRatio: string;
  layer: string;
  decision: "bound" | "referred" | "declined";
  premium?: string;
  note?: string;
}

const HISTORIC_DECISIONS: HistoricDecision[] = [
  { account: "Apex Industrial Group",   hazard: 38, topConstruction: "Frame",      constrPct: 44, topOccupancy: "Light Mfg",  lossRatio: "0.38", layer: "$8M xs $2M",  decision: "bound",    premium: "$1.18M" },
  { account: "Meridian Manufacturing",  hazard: 32, topConstruction: "Frame",      constrPct: 37, topOccupancy: "Light Mfg",  lossRatio: "0.44", layer: "$10M xs $3M", decision: "bound",    premium: "$980K" },
  { account: "Summit Holdings LLC",     hazard: 41, topConstruction: "Frame",      constrPct: 48, topOccupancy: "Warehouse",  lossRatio: "0.51", layer: "$10M xs $5M", decision: "referred", note: "Flood sublimit added" },
  { account: "River Valley Industries", hazard: 29, topConstruction: "Masonry NC",  constrPct: 39, topOccupancy: "Light Mfg",  lossRatio: "0.39", layer: "$15M xs $3M", decision: "bound",    premium: "$1.42M" },
  { account: "Crestline Fabricators",   hazard: 44, topConstruction: "Frame",      constrPct: 52, topOccupancy: "Light Mfg",  lossRatio: "0.58", layer: "$10M xs $3M", decision: "referred", note: "RE survey required before bind" },
];

const DECISION_STYLE = {
  bound:    { label: "Bound",    color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  referred: { label: "Referred", color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200" },
  declined: { label: "Declined", color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200" },
};

function PreRatingComparables({ decisions, subjectHazard, subjectLayer }: {
  decisions: HistoricDecision[];
  subjectHazard: number;
  subjectLayer: string;
}) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-[#F5F4F1] border-b border-[#E8E6E1] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-[#4B5563]" style={{ fontWeight: 700 }}>Pre-Rating Decision Comparables</span>
          <span className="text-[10px] text-[#9B9B98] ml-2">Similar COPE profile · Frame / Light Mfg · Excess layer · Loss ratio 0.35–0.55</span>
        </div>
        <span className="text-[9px] text-[#9B9B98]">Hazard {subjectHazard}/100 · {subjectLayer}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[#F0EFEC]">
              {["Account", "Hazard", "Top Construction", "Top Occupancy", "Loss Ratio", "QBE Layer", "Decision", "Premium / Note"].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#9B9B98] whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => {
              const ds = DECISION_STYLE[d.decision];
              const hazardDiff = d.hazard - subjectHazard;
              return (
                <tr key={i} className="border-b border-[#F0EFEC] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-3 py-2 text-[#2D2D2D]" style={{ fontWeight: 500 }}>{d.account}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <span className={`${d.hazard > subjectHazard ? "text-amber-600" : "text-emerald-600"}`} style={{ fontWeight: 600 }}>{d.hazard}</span>
                    <span className="text-[9px] text-[#9B9B98] ml-1">({hazardDiff > 0 ? "+" : ""}{hazardDiff})</span>
                  </td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.topConstruction} <span className="text-[#9B9B98]">{d.constrPct}%</span></td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.topOccupancy}</td>
                  <td className="px-3 py-2 tabular-nums text-[#4B5563]">{d.lossRatio}</td>
                  <td className="px-3 py-2 text-[#4B5563] whitespace-nowrap">{d.layer}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] border ${ds.bg} ${ds.color} ${ds.border}`} style={{ fontWeight: 700 }}>{ds.label}</span>
                  </td>
                  <td className="px-3 py-2 text-[#4B5563]">{d.premium ?? <span className="text-[#9B9B98] italic">{d.note}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Step 3: UW Analysis ── */
function UWAnalysisStep({ meta, idx, extras, onProceed }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras; onProceed: () => void;
}) {
  const [showFollowUpCat, setShowFollowUpCat] = useState(false);
  const [followUpCatDefaultTab, setFollowUpCatDefaultTab] = useState<UWFollowUpTab>("broker");
  const [measureFilter, setMeasureFilter] = useState<MeasureFilter>(null);

  const brokerDraft = `Dear ${meta.broker},\n\nFollowing our review of ${meta.namedInsured}'s submission, we have a few outstanding items requiring your attention:\n\nSubmission Reference: ${meta.id}\n\n• ${extras.sov.dataCleansingNote}\n${extras.documents.filter(d => !d.received).map(d => `• ${d.name} — not yet received, required for rating`).join("\n")}\n\nPlease provide the above at your earliest convenience to avoid SLA delays.\n\nBest regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const catDraft = `Dear CAT Modelling Team,\n\nPlease prioritise the CAT model run for the following account:\n\nAccount:       ${meta.namedInsured}\nSubmission ID: ${meta.id}\nTIV:           ${meta.tivFull}\n\nPlease model the following layers:\n\n  Primary $2.25B    $2.16M\n  Primary $1.5B     $2.56M\n  Primary $0.5B     $1.5M\n\nFull SOV and mapped submission are attached.\n\nAdditional UW Instructions:\n[Please add any specific modelling requirements here]\n\nRequired by: ${meta.inceptionDate}\nAssigned UW: ${idx.assignedUW || "Mike Farrell"}\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const declineDraft = `Dear ${meta.broker},\n\nThank you for presenting ${meta.namedInsured} for our consideration.\n\nSubmission Reference: ${meta.id}\n\nFollowing a careful review of the submission and underwriting analysis, we regret that we are unable to provide terms on this occasion.\n\nWe remain open to discussing alternative solutions and look forward to working with you on future opportunities.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const sov = extras.sov;

  const [locations, setLocations] = useState<SovLocation[]>(sov.locations ?? []);
  const [locationsLoading, setLocationsLoading] = useState(!!(sov.locationsLoader && !(sov.locations?.length)));
  useEffect(() => {
    if (sov.locationsLoader && !(sov.locations?.length)) {
      sov.locationsLoader().then(locs => { setLocations(locs); setLocationsLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const constructionGroups = groupByTIV(locations, (l) => l.construction);
  const occupancyGroups    = groupByTIV(locations, (l) => l.occupancy);
  const protectionGroups   = groupByTIV(locations, (l) => l.protectionCode);
  const exposureGroups     = groupByTIV(locations, (l) => l.state);

  const constrWorst   = [...constructionGroups].sort((a, b) => b.avgHazard - a.avgHazard)[0];
  const constrSubject = constructionGroups[0]?.avgHazard ?? idx.hazardScore;

  const occWorst   = [...occupancyGroups].sort((a, b) => b.avgHazard - a.avgHazard)[0];
  const occSubject = occupancyGroups[0]?.avgHazard ?? idx.hazardScore;

  const reDoc = extras.documents.find((d) => d.name === "Risk Engineering Report");
  const avgPC = locations.length
    ? locations.reduce((s, l) => s + parsePC(l.protectionCode), 0) / locations.length : 4;
  const protSubject = protectionScore(avgPC);
  const protFocus   = !reDoc?.received
    ? `No current risk engineering report on file — protection grades unverified across ${fmtTIV(protectionGroups.reduce((s, g) => s + g.tiv, 0))} of TIV.`
    : reDoc.needsReview && reDoc.reviewReason ? reDoc.reviewReason
    : `Protection confirmed by risk engineering; lead exposure at ${protectionGroups[0]?.key ?? "—"}.`;

  // Accumulation rows — account-level concentration by state
  const accumulationRows = exposureGroups.map((g) => {
    const locs = locations.filter(l => l.state === g.key);
    const catFlags: string[] = [];
    if (NWS_STATES.has(g.key))   catFlags.push("NWS");
    if (EQ_STATES.has(g.key))    catFlags.push("EQ");
    if (FLOOD_STATES.has(g.key)) catFlags.push("Flood");
    return { ...g, locCount: locs.length, catFlags };
  });
  const expTop = accumulationRows[0];

  const totalPaid  = extras.lossHistory.topLocations.reduce((s, l) => s + parseTIV(l.paid), 0);
  const lossLocSet = new Set(extras.lossHistory.topLocations.map((l) => l.loc));
  const lossLocMap = new Map(extras.lossHistory.topLocations.map((l) => [l.loc, l]));

  // Sprinklered = PC ≤ 3
  const spklTIV    = locations.filter(l => parsePC(l.protectionCode) <= 3).reduce((s, l) => s + parseTIV(l.tiv), 0);
  const totalSOVTIV = locations.reduce((s, l) => s + parseTIV(l.tiv), 0);
  const notSpklTIV = totalSOVTIV - spklTIV;
  const spklPct    = totalSOVTIV > 0 ? Math.round((spklTIV / totalSOVTIV) * 100) : 0;
  const notSpklPct = 100 - spklPct;

  // TIV by hazard grade for Construction header metric
  const gradeGroups = (["A", "B", "C", "D"] as const).map(grade => ({
    grade,
    tiv: locations.filter(l => locHazardGrade(l.hazard) === grade).reduce((s, l) => s + parseTIV(l.tiv), 0),
  }));
  const constrMetric = gradeGroups.map(g => `${g.grade} ${fmtTIV(g.tiv)}`).join(" · ");

  const categories: StepCategory[] = [
    /* ── Construction ── */
    {
      key: "construction",
      icon: Hammer,
      title: "Construction",
      metric: constrMetric,
      status: hazardBand(constrSubject),
      statusLabel: constrSubject >= 70 ? "High Hazard" : constrSubject >= 50 ? "Moderate Hazard" : "Low Hazard",
      headline: constrWorst
        ? `${constrWorst.key} drives the highest construction hazard (${constrWorst.avgHazard}/100) across ${fmtTIV(constrWorst.tiv)} — ${constrWorst.pct}% of TIV.`
        : "No construction data on file.",
      context: `Construction mix: ${constructionGroups.map(g => `${g.key} ${g.pct}%`).join(" · ")}`,
      summaryRows: constructionGroups.map((g) => ({
        key: g.key, label: g.key, value: fmtTIV(g.tiv), sub: `${g.pct}%`,
        status: g.band,
      })),
      groups: [
        {
          title: "Sprinkler Protection — TIV Breakout",
          rows: [
            {
              label: "Sprinklered TIV",
              value: `${fmtTIV(spklTIV)} (${spklPct}%)`,
              status: spklPct >= 75 ? "good" : spklPct >= 50 ? "watch" : "alert",
              note: "Locations with Protection Class ≤ 3 (sprinkler-protected)",
            },
            {
              label: "Not Sprinklered TIV",
              value: `${fmtTIV(notSpklTIV)} (${notSpklPct}%)`,
              status: notSpklPct > 50 ? "alert" : notSpklPct > 25 ? "watch" : "good",
              note: "Locations with Protection Class > 3 (unsprinklered or limited protection)",
            },
          ],
        },
      ],
    },

    /* ── Occupancy ── */
    {
      key: "occupancy",
      icon: Layers,
      title: "Occupancy",
      metric: `${occSubject}/100`,
      status: hazardBand(occSubject),
      statusLabel: occSubject >= 70 ? "High Hazard" : occSubject >= 50 ? "Moderate Hazard" : "Low Hazard",
      headline: occWorst
        ? `${occWorst.key} carries the heaviest ignition/severity load (${occWorst.avgHazard}/100) across ${fmtTIV(occWorst.tiv)} of TIV.`
        : "No occupancy data on file.",
      context: `Occupancy mix: ${occupancyGroups.map(g => `${g.key} ${g.pct}%`).join(" · ")}`,
      summaryRows: occupancyGroups.map((g) => ({
        key: g.key, label: g.key, value: fmtTIV(g.tiv), sub: `${g.pct}%`,
        status: g.band,
      })),
    },

    /* ── Protection ── */
    {
      key: "protection",
      icon: Shield,
      title: "Protection",
      metric: `${notSpklPct}% Non-Sprinklered`,
      status: reDoc?.received ? hazardBand(100 - protSubject) : "watch",
      statusLabel: reDoc?.received
        ? (spklPct >= 75 ? "Well Protected" : spklPct >= 50 ? "Partially Protected" : "Limited Protection")
        : "Unverified",
      headline: protFocus,
      context: `${spklPct}% of TIV in sprinkler-protected locations (PC ≤ 3). ${reDoc?.received ? "Risk engineering report on file." : "No risk engineering report on file — protection grades unconfirmed."}`,
      summaryRows: [
        {
          key: "sprinklered",
          label: "Sprinklered",
          value: fmtTIV(spklTIV),
          sub: `${spklPct}%`,
          status: (spklPct >= 75 ? "good" : spklPct >= 50 ? "watch" : "alert") as "good" | "watch" | "alert",
        },
        {
          key: "non-sprinklered",
          label: "Non-Sprinklered",
          value: fmtTIV(notSpklTIV),
          sub: `${notSpklPct}%`,
          status: (notSpklPct > 50 ? "alert" : notSpklPct > 25 ? "watch" : "good") as "good" | "watch" | "alert",
        },
      ],
    },

    /* ── Exposure Accumulation ── */
    {
      key: "exposure",
      icon: Globe2,
      title: "Exposure Accumulation",
      metric: expTop ? `${expTop.key} — ${expTop.pct}% of TIV` : undefined,
      status: expTop ? concentrationBand(expTop.pct) : "neutral",
      statusLabel: expTop
        ? `${expTop.locCount} location${expTop.locCount !== 1 ? "s" : ""}${expTop.catFlags.length ? " · CAT exposed" : ""}`
        : "No concentration",
      headline: expTop
        ? `${expTop.key} is the largest geographic concentration at ${fmtTIV(expTop.tiv)} (${expTop.pct}% of TIV) across ${expTop.locCount} location${expTop.locCount !== 1 ? "s" : ""}.`
        : "No geographic data on file.",
      context: accumulationRows.some(r => r.catFlags.length > 0)
        ? `CAT-exposed states: ${accumulationRows.filter(r => r.catFlags.length > 0).map(r => `${r.key} (${r.catFlags.join("/")})`).join(", ")}`
        : "No material CAT exposure by state.",
      summaryRows: accumulationRows.slice(0, 5).map((r) => ({
        key: r.key,
        label: r.key,
        value: fmtTIV(r.tiv),
        sub: `${r.pct}% · ${r.locCount} loc${r.locCount !== 1 ? "s" : ""}`,
        status: concentrationBand(r.pct),
      })),
      groups: [
        {
          title: "Accumulation by State",
          rows: accumulationRows.map(r => ({
            label: r.key,
            value: `${fmtTIV(r.tiv)} · ${r.pct}%`,
            status: concentrationBand(r.pct),
            note: `${r.locCount} location${r.locCount !== 1 ? "s" : ""}${r.catFlags.length ? ` — CAT exposed (${r.catFlags.join(", ")})` : ""}`,
          })),
        },
      ],
    },

  ];

  const proceedToCat = sov.modellingReady && sov.completenessPct >= 90;
  const missingDoc = extras.documents.find((d) => !d.received);
  const overallStatus: StepStatus = proceedToCat ? "good" : "watch";

  function handleRowSelect(categoryKey: string, rowKey: string) {
    setMeasureFilter(prev =>
      prev && prev.category === categoryKey && prev.rowKey === rowKey ? null : { category: categoryKey, rowKey });
  }

  /* Derive the building rows from active filter */
  const activeField = measureFilter ? CATEGORY_FIELD[measureFilter.category] : undefined;
  const filteredRows = locations.map((l) => {
    if (!measureFilter) return { loc: l, match: true };
    if (measureFilter.category === "loss") {
      return { loc: l, match: lossLocSet.has(l.loc) && l.loc === measureFilter.rowKey };
    }
    return { loc: l, match: activeField !== undefined && l[activeField] === measureFilter.rowKey };
  });
  const matchCount = filteredRows.filter((r) => r.match).length;

  return (
    <>
      <UWAnalysisActions
        onRequestInfo={() => { setFollowUpCatDefaultTab("broker");  setShowFollowUpCat(true); }}
        onRequestCat={() =>  { setFollowUpCatDefaultTab("cat");     setShowFollowUpCat(true); }}
        onDecline={() =>     { setFollowUpCatDefaultTab("decline"); setShowFollowUpCat(true); }}
        onProceed={onProceed} />

      <StepShell
        summary={
          <div className="space-y-3">
            {/* Stats bar */}
            <div className="bg-white border border-[#E8E6E1] rounded-md">
              <div className="grid grid-cols-5 divide-x divide-[#E8E6E1]">
                {[
                  { label: "Total TIV",        value: sov.stats.totalTIV,                                                              color: "#0D1B2E" },
                  { label: "Locations",         value: String(sov.stats.locationCount),                                                 color: "#0D1B2E" },
                  { label: "Avg Hazard",        value: `${sov.stats.avgHazard}/100`,                                                    color: sov.stats.avgHazard >= 70 ? "#DC2626" : sov.stats.avgHazard >= 50 ? "#D97706" : "#059669" },
                  { label: "Top Accumulation",  value: expTop ? `${expTop.key} ${expTop.pct}%` : "—",                                  color: expTop ? "#059669" : "#9B9B98" },
                  { label: "5-Yr Loss Ratio",   value: extras.lossHistory.lossRatio,                                                   color: extras.lossHistory.lossRatioBand === "good" ? "#059669" : extras.lossHistory.lossRatioBand === "watch" ? "#D97706" : "#DC2626" },
                ].map(stat => (
                  <div key={stat.label} className="px-3 py-1.5">
                    <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                    <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {showFollowUpCat && createPortal(
              <UWFollowUpCatModal
                broker={meta.broker}
                brokerageHouse={meta.brokerageHouse}
                accountName={meta.accountName}
                brokerDraft={brokerDraft}
                catDraft={catDraft}
                declineDraft={declineDraft}
                defaultTab={followUpCatDefaultTab}
                onClose={() => setShowFollowUpCat(false)}
              />,
              document.body
            )}
            <PerilSummaryStrip perils={extras.request.perils} sov={sov} lossHistory={extras.lossHistory} layer={extras.request.qbeLayer} />
            <LossHistoryTable lossHistory={extras.lossHistory} submissionType={meta.type} />
          </div>
        }
        leftHeader={<PaneTitle title="COPE Analysis" hint="select any measure to filter the building list →" />}
        left={
          <CategorySummaryList
            categories={categories}
            activeKey={categories[0].key}
            onSelect={() => {}}
            allExpanded
            globalActiveRow={measureFilter}
            onRowSelect={handleRowSelect}
          />
        }
        rightHeader={
          <>
            <MapPin className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
            <PaneTitle title="Statement of Values" hint={locationsLoading ? "Loading locations…" : measureFilter ? `${matchCount} of ${sov.stats.locationCount} locations` : `All ${locations.length} locations`} />
            {measureFilter && (
              <button onClick={() => setMeasureFilter(null)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#C2DFF4] border border-[#0076BC] text-[#0076BC] hover:bg-[#BEE3F8] transition-colors ml-auto" style={{ fontWeight: 600 }}>
                {measureFilter.rowKey} <X className="w-3 h-3" />
              </button>
            )}
          </>
        }
        right={
          locationsLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <div className="text-[11px] text-[#6B7280] font-medium mb-1">Loading {sov.stats.locationCount.toLocaleString()} locations…</div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-7 rounded bg-[#F0EFEC] animate-pulse" style={{ opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          ) : (
            <BuildingRoster
              rows={filteredRows}
              lossLocMap={lossLocMap}
              hasFilter={!!measureFilter}
              totalPaid={totalPaid}
              filterKey={measureFilter ? `${measureFilter.category}|${measureFilter.rowKey}` : null}
            />
          )
        }
      />
    </>
  );
}

const CAT_MODEL_CFG: Record<SovLocation["catModel"], { label: string; bg: string; text: string; border: string }> = {
  Modelled:  { label: "Modelled",  bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  Pending:   { label: "Pending",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  Required:  { label: "Required",  bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200"     },
};
const HEALTH_CHECK_CFG: Record<SovLocation["healthCheck"], { label: string; bg: string; text: string; border: string }> = {
  Pass:   { label: "Pass",   bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  Flag:   { label: "Flag",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  Review: { label: "Review", bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200"     },
};

/* ── UW Analysis — Statement of Values (expandable category columns) ── */
type SortKey = "tiv" | "hazard" | "state" | "construction" | "occupancy" | "loc";
interface SovField {
  label: string;
  sortKey?: SortKey;
  render: (l: SovLocation) => ReactNode;
}
interface SovCategory {
  key: string;
  label: string;
  summary: SovField;   // shown when the category is collapsed
  fields: SovField[];  // shown when the category is expanded
}

// Muted placeholder for CP SOV fields that have not been encoded yet
const naCell = <span className="text-[#C4C2BE] text-[11px]">— Not provided</span>;
function txt(v: string | number | undefined | null) {
  if (v === undefined || v === null || String(v).trim() === "") return naCell;
  return <span className="text-[#5D5D5D]">{v}</span>;
}
function hazardCell(l: SovLocation) {
  const hb = BAND_STYLE[hazardBand(l.hazard)];
  const g = HAZARD_GRADE_CFG[locHazardGrade(l.hazard)];
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-extrabold ${g.bg} ${g.text} ${g.border}`}>{locHazardGrade(l.hazard)}</span>
      <span className={`text-[11px] tabular-nums ${hb.text}`} style={{ fontWeight: 600 }}>{l.hazard}</span>
    </div>
  );
}
function badgeCell(cfg: { label: string; bg: string; text: string; border: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 600 }}>{cfg.label}</span>;
}

function BuildingRoster({ rows, lossLocMap, hasFilter, totalPaid, filterKey }: {
  rows: { loc: SovLocation; match: boolean }[];
  lossLocMap: Map<string, LossLocation>;
  hasFilter: boolean;
  totalPaid: number;
  filterKey?: string | null;
}) {
  const [sortCol, setSortCol] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["construction"]));
  const [visibleCount, setVisibleCount] = useState(20);
  const [colFilters, setColFilters] = useState({ state: "", construction: "", occupancy: "", catModel: "", healthCheck: "" });
  const [searchQ, setSearchQ] = useState("");
  const firstMatchRef = useRef<HTMLTableRowElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const uniqueStates        = useMemo(() => [...new Set(rows.map(r => r.loc.state))].sort(), [rows]);
  const uniqueConstructions = useMemo(() => [...new Set(rows.map(r => r.loc.construction))].sort(), [rows]);
  const uniqueOccupancies   = useMemo(() => [...new Set(rows.map(r => r.loc.occupancy))].sort(), [rows]);
  const hasColFilter = Object.values(colFilters).some(Boolean);

  useEffect(() => { setVisibleCount(20); }, [filterKey, sortCol, sortDir, colFilters, searchQ]);

  useEffect(() => {
    if (!filterKey) return;
    firstMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filterKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 50); },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length]);

  function toggleSort(col: SortKey) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }
  function toggleCat(key: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function setColFilter(key: keyof typeof colFilters, val: string) {
    setColFilters(prev => ({ ...prev, [key]: val }));
  }

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    if (sortCol === "tiv")    { const va = parseTIV(a.loc.tiv), vb = parseTIV(b.loc.tiv); return sortDir === "desc" ? vb - va : va - vb; }
    if (sortCol === "hazard") { return sortDir === "desc" ? b.loc.hazard - a.loc.hazard : a.loc.hazard - b.loc.hazard; }
    const va = String(a.loc[sortCol as keyof SovLocation] ?? "");
    const vb = String(b.loc[sortCol as keyof SovLocation] ?? "");
    return sortDir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
  });

  const displayed = sorted.filter(({ loc: l, match }) => {
    if (hasFilter && !match) return false;
    if (colFilters.state        && l.state        !== colFilters.state)        return false;
    if (colFilters.construction && l.construction !== colFilters.construction) return false;
    if (colFilters.occupancy    && l.occupancy    !== colFilters.occupancy)    return false;
    if (colFilters.catModel     && l.catModel     !== colFilters.catModel)     return false;
    if (colFilters.healthCheck  && l.healthCheck  !== colFilters.healthCheck)  return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (![l.loc, l.state, l.construction, l.occupancy].some(v => String(v ?? "").toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const categories: SovCategory[] = [
    {
      key: "construction", label: "Construction & Structure",
      summary: { label: "Construction", sortKey: "construction", render: l => <span className="text-[#5D5D5D]">{l.construction}</span> },
      fields: [
        { label: "Construction", sortKey: "construction" as SortKey, render: l => <span className="text-[#5D5D5D]">{l.construction}</span> },
        { label: "ISO Class",    render: l => txt(l.constructionClass) },
        { label: "Year Built",   render: l => txt(l.yearBuilt) },
        { label: "Roof Age",     render: l => txt(l.roofAge !== undefined ? `${l.roofAge} yrs` : undefined) },
        { label: "Roof Type",    render: l => txt(l.roofType) },
        { label: "Stories",      render: l => txt(l.stories) },
        { label: "Sq Ft",        render: l => txt(l.sqFt !== undefined ? l.sqFt.toLocaleString() : undefined) },
      ],
    },
    {
      key: "protection", label: "Protection",
      summary: { label: "Sprinkler", render: l => <span className="text-[#5D5D5D]">{parsePC(l.protectionCode) <= 3 ? "Sprinklered" : "Non-Sprinklered"}</span> },
      fields: [
        { label: "Sprinkler",   render: l => <span className="text-[#5D5D5D]">{parsePC(l.protectionCode) <= 3 ? "Sprinklered" : "Non-Sprinklered"}</span> },
        { label: "Spk Type",    render: l => txt(l.sprinklerType) },
        { label: "Protection",  render: l => <span className="text-[#5D5D5D]">{l.protectionCode}</span> },
        { label: "Health Check",render: l => badgeCell(HEALTH_CHECK_CFG[l.healthCheck]) },
      ],
    },
    {
      key: "valuation", label: "Occupancy & Valuation",
      summary: { label: "TIV", sortKey: "tiv", render: l => <span className="text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{l.tiv}</span> },
      fields: [
        { label: "Occupancy", sortKey: "occupancy" as SortKey, render: l => <span className="text-[#5D5D5D]">{l.occupancy}</span> },
        { label: "Building",    render: l => txt(l.buildingValue) },
        { label: "Contents",    render: l => txt(l.contentsValue) },
        { label: "BI",          render: l => txt(l.biValue) },
        { label: "TIV", sortKey: "tiv", render: l => <span className="text-[#2D2D2D] tabular-nums" style={{ fontWeight: 600 }}>{l.tiv}</span> },
      ],
    },
    {
      key: "cat", label: "CAT & Modeling",
      summary: { label: "Hazard", sortKey: "hazard", render: hazardCell },
      fields: [
        { label: "Flood Zone",   render: l => txt(l.floodZone) },
        { label: "Dist. Coast",  render: l => txt(l.distanceToCoast) },
        { label: "CAT Modeling", render: l => badgeCell(CAT_MODEL_CFG[l.catModel]) },
        { label: "Hazard", sortKey: "hazard", render: hazardCell },
      ],
    },
    {
      key: "loss", label: "Loss",
      summary: {
        label: "5yr Paid Loss",
        render: l => {
          const lossRec = lossLocMap.get(l.loc);
          return lossRec ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span className="text-amber-700" style={{ fontWeight: 600 }}>{lossRec.paid}</span>
              <span className="text-[10px] text-[#9B9B98]">{lossRec.count}×</span>
            </span>
          ) : <span className="text-[#C4C2BE]">—</span>;
        },
      },
      fields: [
        {
          label: "5yr Paid Loss",
          render: l => {
            const lossRec = lossLocMap.get(l.loc);
            return lossRec ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span className="text-amber-700" style={{ fontWeight: 600 }}>{lossRec.paid}</span>
                <span className="text-[10px] text-[#9B9B98]">{lossRec.count}×</span>
              </span>
            ) : <span className="text-[#C4C2BE]">—</span>;
          },
        },
      ],
    },
  ];

  // Visible field list per category based on expand state
  const visible = categories.map(c => ({
    cat: c,
    expanded: expandedCats.has(c.key),
    fields: expandedCats.has(c.key) ? c.fields : [c.summary],
  }));

  const renderFieldTh = (f: SovField, key: string) => {
    const isSortable = !!f.sortKey;
    const isActive = f.sortKey && sortCol === f.sortKey;
    return (
      <th key={key}
        onClick={isSortable ? () => toggleSort(f.sortKey!) : undefined}
        className={`text-left px-3 py-1.5 text-[9px] uppercase tracking-wide text-[#6B7280] border-b border-[#E8E6E1] whitespace-nowrap select-none ${isSortable ? "cursor-pointer hover:bg-[#EAE9E6]" : ""} ${isActive ? "text-[#0076BC]" : ""}`}
        style={{ fontWeight: 700 }}>
        {f.label}{isActive ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
      </th>
    );
  };

  const filterSelect = (label: string, value: string, options: string[], key: keyof typeof colFilters) => (
    <select
      value={value}
      onChange={e => setColFilter(key, e.target.value)}
      className={`h-6 pl-2 pr-6 rounded border text-[10px] bg-white appearance-none cursor-pointer outline-none transition-colors ${value ? "border-[#0076BC] text-[#0076BC]" : "border-[#E8E6E1] text-[#6B7280]"}`}
      style={{ fontWeight: value ? 700 : 500 }}>
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="overflow-x-auto">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF9] border-b border-[#E8E6E1]">
        <Search className="w-3 h-3 text-[#9B9B98] flex-shrink-0" />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search location, state, construction, occupancy…"
          className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#C4C2BE]"
          style={{ color: "#2D2D2D" }}
        />
        {searchQ && (
          <button onClick={() => setSearchQ("")} className="text-[#9B9B98] hover:text-[#5D5D5D]">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF9] border-b border-[#E8E6E1] flex-wrap">
        <span className="text-[9px] uppercase tracking-wider text-[#9B9B98] flex-shrink-0" style={{ fontWeight: 700 }}>Filter</span>
        {filterSelect("State", colFilters.state, uniqueStates, "state")}
        {filterSelect("Construction", colFilters.construction, uniqueConstructions, "construction")}
        {filterSelect("Occupancy", colFilters.occupancy, uniqueOccupancies, "occupancy")}
        {filterSelect("CAT Model", colFilters.catModel, ["Modelled", "Pending", "Required"], "catModel")}
        {filterSelect("Health Check", colFilters.healthCheck, ["Pass", "Flag", "Review"], "healthCheck")}
        {hasColFilter && (
          <button onClick={() => setColFilters({ state: "", construction: "", occupancy: "", catModel: "", healthCheck: "" })}
            className="ml-1 text-[10px] text-[#0076BC] hover:text-[#005A8E] flex items-center gap-0.5 transition-colors"
            style={{ fontWeight: 600 }}>
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-[#9B9B98] tabular-nums">{displayed.length} rows</span>
      </div>
      {!hasFilter && !hasColFilter && (
        <div className="px-4 py-2 bg-[#EEF6FF] border-b border-[#C2DFF4]">
          <p className="text-[10px] text-[#0076BC]">Expand a category header to reveal its fields, or select a measure on the left to filter this list.</p>
        </div>
      )}
      <table className="text-[12px] border-collapse" style={{ minWidth: "100%" }}>
        <thead className="sticky top-0 z-10">
          {/* Category group headers */}
          <tr className="bg-[#EDEBE7]">
            <th rowSpan={2}
              className="sticky left-0 z-30 bg-[#EDEBE7] text-left px-3 py-2 border-b border-r border-[#E0DDD7] whitespace-nowrap align-bottom"
              style={{ fontWeight: 700 }}>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleSort("loc")} className={`text-[10px] uppercase tracking-wide hover:text-[#0076BC] transition-colors ${sortCol === "loc" ? "text-[#0076BC]" : "text-[#4B5563]"}`} style={{ fontWeight: 700 }}>
                  Location{sortCol === "loc" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </button>
                <button onClick={() => toggleSort("state")} className={`text-[9px] uppercase tracking-wide hover:text-[#0076BC] transition-colors ${sortCol === "state" ? "text-[#0076BC]" : "text-[#9B9B98]"}`} style={{ fontWeight: 700 }}>
                  / State{sortCol === "state" ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </button>
              </div>
            </th>
            {visible.map(({ cat, expanded, fields }) => (
              <th key={cat.key} colSpan={fields.length}
                className="text-left px-3 py-1.5 border-b border-l border-[#E0DDD7] bg-[#EDEBE7]">
                <button onClick={() => toggleCat(cat.key)}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#334155] hover:text-[#0076BC] transition-colors select-none"
                  style={{ fontWeight: 700 }}>
                  <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                  {cat.label}
                </button>
              </th>
            ))}
          </tr>
          {/* Sub-field headers */}
          <tr className="bg-[#F5F4F1]">
            {visible.map(({ cat, fields }) =>
              fields.map((f, i) => renderFieldTh(f, `${cat.key}-${i}`)),
            )}
          </tr>
        </thead>
        <tbody>
          {displayed.slice(0, visibleCount).map(({ loc: l, match }, rowIdx) => {
            const highlight = hasFilter && match;
            const isFirstMatch = highlight && rowIdx === 0;
            const stickyBg = highlight ? "bg-[#F0F9FF]" : "bg-white";
            return (
              <tr key={l.loc}
                ref={isFirstMatch ? firstMatchRef : undefined}
                className={`border-b border-[#F0EFEC] last:border-b-0 transition-all group ${highlight ? "bg-[#F0F9FF]" : "hover:bg-[#FAFAF9]"}`}>
                <td className={`sticky left-0 z-20 px-3 py-2 align-middle whitespace-nowrap border-r border-[#EFEEE9] ${stickyBg} group-hover:bg-[#FAFAF9]`}
                  style={{ fontWeight: highlight ? 600 : 500 }}>
                  <div className="text-[#2D2D2D] leading-tight">{l.loc}</div>
                  <div className="text-[10px] text-[#9B9B98] tabular-nums">{l.state}</div>
                </td>
                {visible.map(({ cat, fields }) =>
                  fields.map((f, i) => (
                    <td key={`${cat.key}-${i}`} className="px-3 py-2 align-middle whitespace-nowrap">
                      {f.render(l)}
                    </td>
                  )),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {visibleCount < sorted.length && (
        <div className="px-4 py-2 text-[10px] text-[#9B9B98] border-t border-[#E8E6E1] bg-[#FAFAF9]">
          Showing {Math.min(visibleCount, sorted.length).toLocaleString()} of {sorted.length.toLocaleString()} locations — scroll to load more
        </div>
      )}
      {totalPaid > 0 && visibleCount >= sorted.length && (
        <div className="px-4 py-2 border-t border-[#E8E6E1] bg-[#FAFAF9]">
          <p className="text-[10px] text-[#9B9B98]">
            5yr paid loss shows incurred amounts from the loss runs for locations with reported claims. Blank = no claims. &ldquo;— Not provided&rdquo; marks SOV fields not yet encoded.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── CommModal — unified single-recipient email compose modal ── */
interface CommModalProps {
  title: string;
  stage: string;
  account: string;
  to: string;
  toEmail: string;
  cc?: string;
  subject: string;
  initialBody: string;
  attachment?: { filename: string };
  onClose: () => void;
}

function CommModal({ title, stage, account, to, toEmail, cc, subject, initialBody, attachment, onClose }: CommModalProps) {
  const [body, setBody] = useState(initialBody);

  const handleOpenDraft = () => {
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(toEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Draft opened — ${to}`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <Mail className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{title}</div>
              <div className="text-[10px] text-[#9B9B98]">{stage} · {account}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recipient + Subject */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#F0EFEC] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>To</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate" style={{ fontWeight: 600 }}>
              {to} &lt;{toEmail}&gt;
            </span>
          </div>
          {cc && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>CC</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate">{cc}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0 mt-1" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563]">{subject}</span>
          </div>
        </div>

        {/* Attachment chip */}
        {attachment && (
          <div className="px-4 py-2 flex-shrink-0 border-b border-[#F0EFEC]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F0F4FF] border border-[#C7D7F5] rounded-md w-fit max-w-full">
              <Paperclip className="w-3 h-3 text-[#4B6CB7] flex-shrink-0" />
              <span className="text-[11px] text-[#374151] font-medium truncate">{attachment.filename}</span>
              <span className="text-[9px] text-[#9B9B98] ml-1 flex-shrink-0">PDF</span>
            </div>
          </div>
        )}

        {/* Editable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            spellCheck
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">Cancel</button>
          <button onClick={handleOpenDraft}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
            style={{ fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" />
            Open Draft Email
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

type UWFollowUpTab = "broker" | "cat" | "decline";

const UW_FOLLOWUP_OPTIONS: { id: UWFollowUpTab; label: string; icon: typeof Mail }[] = [
  { id: "broker",  label: "Request Additional Information", icon: Mail },
  { id: "cat",     label: "CAT Modelling Request",          icon: BarChart3 },
  { id: "decline", label: "Decline to Quote",               icon: XCircle },
];

function UWFollowUpCatModal({ broker, brokerageHouse, accountName, brokerDraft, catDraft, declineDraft, defaultTab, onClose }: {
  broker: string; brokerageHouse: string; accountName: string;
  brokerDraft: string; catDraft: string; declineDraft: string;
  defaultTab?: UWFollowUpTab; onClose: () => void;
}) {
  const [tab, setTab] = useState<UWFollowUpTab>(defaultTab ?? "broker");
  const brokerEmail = `${broker.toLowerCase().replace(/\s+/g, ".")}@${brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;
  const catEmail = "cat.modelling@qbe.com";

  const subjects: Record<UWFollowUpTab, string> = {
    broker:  `[Action Required] Additional Information — ${accountName}`,
    cat:     `CAT Modelling Request — ${accountName}`,
    decline: `QBE — Decline to Quote — ${accountName}`,
  };
  const recipients: Record<UWFollowUpTab, { label: string; email: string }> = {
    broker:  { label: broker, email: brokerEmail },
    cat:     { label: "CAT Modelling Team", email: catEmail },
    decline: { label: broker, email: brokerEmail },
  };
  const [editedBodies, setEditedBodies] = useState<Record<UWFollowUpTab, string>>({
    broker:  brokerDraft,
    cat:     catDraft,
    decline: declineDraft,
  });

  const handleSend = () => {
    const { email, label } = recipients[tab];
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subjects[tab])}&body=${encodeURIComponent(editedBodies[tab])}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Draft opened — ${label}`);
    onClose();
  };

  const { label: toLabel, email: toEmail } = recipients[tab];

  const activeOpt = UW_FOLLOWUP_OPTIONS.find(o => o.id === tab)!;
  const ActiveIcon = activeOpt.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center border bg-[#EEF6FF] border-[#C2DFF4]">
              <ActiveIcon className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>{activeOpt.label}</div>
              <div className="text-[10px] text-[#9B9B98]">{broker} · {brokerageHouse} · {accountName}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* To + Subject */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#F0EFEC] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>To</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] border border-[#E8E6E1] text-[11px] truncate" style={{ fontWeight: 600 }}>
              {toLabel} &lt;{toEmail}&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#9B9B98] w-8 flex-shrink-0" style={{ fontWeight: 700 }}>Re</span>
            <span className="text-[11px] text-[#4B5563] truncate">{subjects[tab]}</span>
          </div>
        </div>

        {/* Editable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "cat" && (
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FFF7ED] border border-[#FED7AA]">
              <AlertTriangle className="w-3 h-3 text-[#EA580C] flex-shrink-0" />
              <span className="text-[10px] text-[#9A3412]" style={{ fontWeight: 600 }}>Internal email — recipient: CAT Modelling Team (cat.modelling@qbe.com)</span>
            </div>
          )}
          <textarea
            key={tab}
            value={editedBodies[tab]}
            onChange={e => setEditedBodies(prev => ({ ...prev, [tab]: e.target.value }))}
            rows={14}
            className="w-full rounded-lg border border-[#E8E6E1] bg-[#FAFAF9] px-3 py-2.5 text-[11px] text-[#374151] leading-relaxed resize-none outline-none focus:border-[#0076BC] focus:ring-1 focus:ring-[#0076BC]/20 transition-colors font-mono"
            spellCheck
          />
        </div>

        {/* Attachments (CAT tab only) */}
        {tab === "cat" && (
          <div className="px-4 py-2 flex-shrink-0 border-t border-[#F0EFEC] flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider text-[#9B9B98] flex-shrink-0" style={{ fontWeight: 700 }}>Attachments</span>
            {["2026 SOV Heartland_Submission", "2026 SOV Heartland_Mapped Submission"].map(name => (
              <a key={name} href="#" download={`${name}.xlsx`}
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F4F1] border border-[#E8E6E1] hover:bg-[#EEF6FF] hover:border-[#C2DFF4] transition-colors group">
                <FileText className="w-2.5 h-2.5 text-[#0076BC] flex-shrink-0" />
                <span className="text-[10px] text-[#374151]" style={{ fontWeight: 500 }}>{name}.xlsx</span>
                <Download className="w-2.5 h-2.5 text-[#9B9B98] group-hover:text-[#0076BC] transition-colors" />
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            Cancel
          </button>
          <button onClick={handleSend}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-[11px] transition-colors bg-[#0076BC] hover:bg-[#005A8E]"
            style={{ fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" />
            Open Draft Email
          </button>
        </div>
      </div>
    </div>
  );
}

function UWAnalysisActions({ onRequestInfo, onRequestCat, onDecline, onProceed }: {
  onRequestInfo: () => void; onRequestCat: () => void; onDecline: () => void; onProceed: () => void;
}) {
  useStepActions([
    { icon: Mail,      label: "Request Additional Information", variant: "secondary" as const, onClick: onRequestInfo },
    { icon: BarChart3, label: "CAT Modelling Request",          variant: "secondary" as const, onClick: onRequestCat },
    { icon: XCircle,   label: "Decline to Quote",               variant: "secondary" as const, onClick: onDecline },
    { icon: ChevronRight, label: "Advance to UW Review", onClick: onProceed },
  ], []);
  return null;
}

/* ── Step 4: UW Review — small helpers ── */

/** Split a "$285,000,000" TIV string into a plausible Property / BI value pair (~90/10). */
function splitTIV(tivFull: string): { property: string; bi: string; total: string } {
  const digits = parseFloat(tivFull.replace(/[^0-9.]/g, ""));
  if (!isFinite(digits) || digits <= 0) return { property: tivFull, bi: "—", total: tivFull };
  const property = Math.round(digits * 0.9);
  const bi = digits - property;
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return { property: fmt(property), bi: fmt(bi), total: fmt(digits) };
}

/** Parse a "$10M xs $3M" layer into a Capacity line: part / excess / (program limit). */
function parseCapacity(qbeLayer: string, limitsSought: string): string {
  const m = qbeLayer.match(/\$?\s*([\d.]+\s*[MB]?)\s*xs\s*\$?\s*([\d.]+\s*[MB]?)/i);
  if (!m) return `${qbeLayer} — part of ${limitsSought} excess of applicable deductibles`;
  const [, part, attach] = m;
  const norm = (s: string) => `$${s.replace(/\s+/g, "").toUpperCase()}`;
  return `${norm(part)} part of ${limitsSought} per occurrence excess of ${norm(attach)} per occurrence, excess of applicable deductibles`;
}

/** Stable field row — must live outside QuoteProposalPane to avoid remount on every keystroke */
function ProposalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2">
      <span className="text-[11px] text-[#00205B] w-36 flex-shrink-0" style={{ fontWeight: 700 }}>{label}</span>
      <div className="min-w-0 flex-1 text-[11px] text-[#2D2D2D] leading-relaxed">{children}</div>
    </div>
  );
}

/* ── Left pane: the proposed Commercial Property Proposal (quote) ── */
function QuoteProposalPane({ meta, extras, sov, idx, initPremium, initRate, onQuoteGenerated }: {
  meta: SubmissionMeta; extras: SubmissionExtras;
  sov: SubmissionExtras["sov"]; idx: SubmissionIndexEntry;
  initPremium: string; initRate: string; onQuoteGenerated?: () => void;
}) {
  const [premium, setPremium] = useState(initPremium);
  const [rate, setRate] = useState(initRate);
  const [showQuote, setShowQuote] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const primaryState = meta.territory.split(",")[0]?.trim() || "—";
  const houseSlug = meta.brokerageHouse.toLowerCase().replace(/[^a-z0-9]/g, "");
  const brokerEmail = `${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${houseSlug}.com`;
  const values = splitTIV(meta.tivFull);
  const capacity = parseCapacity(extras.request.qbeLayer, extras.request.limitsSought);
  const perils = extras.request.perils;
  const catPerils = perils.filter(p => /wind|flood|earth|quake|storm|hail/i.test(p));

  const catPerilStr = catPerils.length > 0 ? ` including ${catPerils.join(", ")}` : "";
  const quoteLetter = `QBE INSURANCE — FORMAL INDICATION\n${today}\n\nTo: ${meta.broker} — ${meta.brokerageHouse}\nRe: ${meta.namedInsured} (${meta.id})\n\nQBE is pleased to provide the following indication:\n\nLayer:    ${extras.request.qbeLayer}\nPremium:  ${premium}\nRate:     ${rate} (Rate on Line)\nPerils:   ${perils.join(", ")}\nTIV:      ${meta.tivFull}\nInception: ${meta.inceptionDate}\n\nThis indication is subject to:\n• Satisfactory CAT model results\n• Receipt of completed SOV (current completeness: ${sov.completenessPct}%)\n• Risk Engineering survey confirmation\n\nThis is a non-binding indication only.\n\nRegards,\n${idx.assignedUW || "Mike Farrell"} — QBE Underwriting`;

  const [fields, setFields] = useState({
    namedInsured: meta.namedInsured,
    mailingAddress: "100 Corporate Center Dr, " + primaryState + ", USA",
    reInsured: "N/A — Section A written on direct QBE paper",
    policyNumber: "Section A (Domestic) — TBD · QBE Specialty Insurance Company\nSection B (Fronted Int'l / Assumed Reinsurance) — TBD · QBE Insurance Corporation",
    companyRating: "\"AA-\" by Standard & Poor's and \"A\" (Excellent) by AM Best",
    nonAdmitted: "Please be advised that this insurance will be issued by a surplus lines insurer.",
    territory: "Section A (Domestic) — Insured locations within the United States of America (including its territories and possessions).\nSection B — Worldwide, except any jurisdiction prohibited or restricted under UN / EU / UK / US sanctions.",
    coverages: "Covered Property: Buildings, Contents, Business Interruption and Extra Expense.\nCovered Cause of Loss: All Risks of Direct Physical Loss or Damage" + catPerilStr + ", excluding Equipment Breakdown.",
    capacity,
  });
  const setField = (k: keyof typeof fields) => (v: string) => setFields(f => ({ ...f, [k]: v }));
  const inputCls = "w-full text-[11px] px-2 py-1 rounded border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC] bg-white leading-relaxed";

  return (
    <div className="p-4 space-y-4">
      {/* QBE brand bar + document title */}
      <div className="rounded-md border border-[#E8E6E1] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 text-white" style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
          <span className="text-[13px]" style={{ fontWeight: 800, letterSpacing: "0.06em" }}>QBE</span>
          <span className="text-[12px]" style={{ fontWeight: 600 }}>Commercial Property Proposal</span>
        </div>
        <p className="px-3 py-2 text-[10px] text-[#6B7280] leading-relaxed bg-[#FAFAF9]">
          We are pleased to present our quote. Please review the terms carefully as they may differ from what was
          requested in the coverage specifications sent with the submission.
        </p>
      </div>

      {/* Proposal fields — image order */}
      <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden divide-y divide-[#F0EFEC]">
        <ProposalField label="Date">{today}</ProposalField>
        <ProposalField label="Broker">
          <div>{meta.broker}</div>
          <div className="text-[#6B7280]">{meta.brokerageHouse}</div>
          <div className="text-[#6B7280]">1166 Avenue of the Americas, New York, {primaryState} 10036</div>
          <div className="text-[#6B7280]">(212) 555-0140 · {brokerEmail}</div>
        </ProposalField>
        <ProposalField label="Name of Insured">
          <input className={inputCls} value={fields.namedInsured} onChange={e => setField("namedInsured")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Mailing Address">
          <input className={inputCls} value={fields.mailingAddress} onChange={e => setField("mailingAddress")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Name of Re-Insured">
          <input className={inputCls} value={fields.reInsured} onChange={e => setField("reInsured")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Policy Number & Company Paper">
          <textarea className={inputCls} rows={2} value={fields.policyNumber} onChange={e => setField("policyNumber")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Company Rating">
          <input className={inputCls} value={fields.companyRating} onChange={e => setField("companyRating")(e.target.value)} />
        </ProposalField>
        <ProposalField label="Non-Admitted Provision">
          <textarea className={inputCls} rows={2} value={fields.nonAdmitted} onChange={e => setField("nonAdmitted")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Period of Insurance">
          From {meta.inceptionDate} &nbsp;To&nbsp; {extras.policyDetails.expirationDate}
          <div className="text-[#9B9B98]">Beginning and ending at 12:01am local standard time at the location of the property insured.</div>
        </ProposalField>
        <ProposalField label="Territory">
          <textarea className={inputCls} rows={3} value={fields.territory} onChange={e => setField("territory")(e.target.value)} style={{ resize: "none" }} />
        </ProposalField>
        <ProposalField label="Coverages">
          <div className="w-full overflow-x-auto -mx-0">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-[#F5F4F1]">
                  {["Coverage", "Status", "Limit / Sub-limit", "Deductible", "Notes"].map(h => (
                    <th key={h} className="border border-[#E8E6E1] px-1.5 py-1 text-left text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { cov: "All Risk Property", status: "Included", limit: extras.request.limitsSought, ded: "AOP per schedule", notes: "" },
                  { cov: "Named Windstorm", status: "Included", limit: "Sub-limit per schedule", ded: "5% TIV / min $250K", notes: "" },
                  { cov: "Flood", status: "Included", limit: "$15,000,000", ded: "5% / min $250K SFHA", notes: "" },
                  { cov: "Earthquake", status: "Included", limit: "$10,000,000", ded: "5% CA / 2% PNW", notes: "" },
                  { cov: "Business Interruption", status: "Included", limit: "Actual loss sustained", ded: "72-hr waiting period", notes: "" },
                  { cov: "Cyber / Electronic Data", status: "Excluded", limit: "—", ded: "—", notes: "LMA5401" },
                  { cov: "Terrorism (TRIA)", status: extras.policyDetails.certifiedTerrorism ? "Purchased" : "Declined", limit: "—", ded: "—", notes: "" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"}>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]" style={{ fontWeight: 600 }}>{row.cov}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] border ${row.status === "Included" || row.status === "Purchased" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : row.status === "Excluded" || row.status === "Declined" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`} style={{ fontWeight: 700 }}>{row.status}</span>
                    </td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]">{row.limit}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px]">{row.ded}</td>
                    <td className="border border-[#E8E6E1] px-1.5 py-1 text-[10px] text-[#9B9B98]">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ProposalField>
        <ProposalField label="Insurable Values">
          <div className="divide-y divide-[#F0EFEC] -my-1">
            <div className="flex justify-between py-1"><span>Property Values</span><span className="tabular-nums" style={{ fontWeight: 600 }}>{values.property}</span></div>
            <div className="flex justify-between py-1"><span>Business Interruption Values</span><span className="tabular-nums" style={{ fontWeight: 600 }}>{values.bi}</span></div>
            <div className="flex justify-between py-1"><span style={{ fontWeight: 700 }}>Total</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{values.total}</span></div>
          </div>
        </ProposalField>
        <ProposalField label="Capacity">
          <input className={inputCls} value={fields.capacity} onChange={e => setField("capacity")(e.target.value)} />
        </ProposalField>
      </div>

      {/* Indication — editable premium / rate */}
      <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
        <div className="px-3 py-1.5 bg-[#F5F4F1] border-b border-[#E8E6E1]">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#4B5563]" style={{ fontWeight: 700 }}>Indication</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Indicated Premium</label>
            <input value={premium} onChange={e => setPremium(e.target.value)}
              className="mt-1 w-full text-[13px] px-3 py-2 rounded-md border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC]" style={{ fontWeight: 600 }} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 700 }}>Rate on Line</label>
            <input value={rate} onChange={e => setRate(e.target.value)}
              className="mt-1 w-full text-[13px] px-3 py-2 rounded-md border border-[#E8E6E1] focus:outline-none focus:border-[#0076BC]" style={{ fontWeight: 600 }} />
          </div>
        </div>
      </div>

      {/* Generate quote document */}
      {!showQuote ? (
        <button onClick={() => { onQuoteGenerated?.(); setShowQuote(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0076BC] text-white text-[11px] hover:bg-[#005A8E] transition-colors"
          style={{ fontWeight: 600 }}>
          <FileText className="w-3 h-3" />
          Generate Quote Letter
        </button>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-emerald-800" style={{ fontWeight: 600 }}>
            Quote document ready — close this window and use Share Quote to send to broker.
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Right pane: the underwriter referral write-up ── */
function ReferralWriteUpPane({ meta, idx, extras, subjectivities, lrBand, bench, openSubjectivities, premium, rate }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras;
  subjectivities: { label: string; value: string; status?: StepStatus; note?: string }[];
  lrBand: Band; bench: PeerBenchmark; openSubjectivities: number; premium: string; rate: string;
}) {
  const sov = extras.sov;
  const loss = extras.lossHistory;
  const yearly = loss.yearlyBreakdown ?? [];
  const lossVals = yearly.map(y => parseFloat(y.paid.replace(/[^0-9.]/g, "")) || 0);
  const total5 = lossVals.reduce((a, b) => a + b, 0);
  const avg5 = yearly.length > 0 ? Math.round(total5 / yearly.length) : 0;
  const fmt$ = (n: number) => `$${n.toLocaleString("en-US")}`;
  const BROKER_TARGET_PRICES: Record<string, string> = {
    "SUB-2026-0843": "$168,500",
    "SUB-2026-1103": "$214,000",
    "SUB-2026-1214": "$198,750",
  };
  const brokerTargetPrice = BROKER_TARGET_PRICES[meta.id] ?? "$142,000";
  const withinAuthority = openSubjectivities === 0 && lrBand !== "alert";
  const recVerb = lrBand === "alert" ? "Recommend to quote subject to conditions"
    : idx.successPropensity >= 60 ? "Recommend to quote" : "Recommend to quote selectively";

  /** Section block: heading + arbitrary body. */
  const Section = ({ title, children, accent }: { title: string; children: ReactNode; accent?: boolean }) => (
    <div className="rounded-md border border-[#E8E6E1] bg-white overflow-hidden">
      <div className={`px-3 py-1.5 border-b border-[#E8E6E1] ${accent ? "bg-[#EEF6FF]" : "bg-[#F5F4F1]"}`}>
        <span className={`text-[10px] uppercase tracking-[0.08em] ${accent ? "text-[#0076BC]" : "text-[#4B5563]"}`} style={{ fontWeight: 700 }}>{title}</span>
      </div>
      <div className="px-3 py-2 text-[11px] text-[#2D2D2D] leading-relaxed space-y-1">{children}</div>
    </div>
  );
  const KV = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="flex items-start gap-3">
      <span className="text-[#6B7280] w-36 flex-shrink-0">{k}</span>
      <span className="min-w-0 flex-1" style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      <Section title="Broker"><KV k="Producing Broker" v={`${meta.broker} · ${meta.brokerageHouse}`} /></Section>

      <Section title="Bound Details">
        <KV k="QBE Layer" v={extras.request.qbeLayer} />
        <KV k="Tower Position" v={extras.request.towerPosition} />
        <KV k="Indicated Premium" v={premium} />
        <KV k="Rate on Line" v={rate} />
        <KV k="Requested Layer Limit" v={extras.request.limitsSought} />
        <KV k="Perils Bound" v={extras.request.perils.join(", ")} />
      </Section>

      <Section title="New or Renewal"><KV k="Business Type" v={meta.type} /></Section>

      <Section title="Account Overview"><p>{meta.summary}</p></Section>

      <Section title="Total Insurable Values">
        <KV k="TIV $" v={meta.tivFull} />
        <KV k="Break out of TIV per entity" v={`${meta.namedInsured} — ${meta.tivFull} across ${meta.locations}`} />
      </Section>

      <Section title="Recommendation" accent>
        <p>
          {recVerb}. The account presents a {lrBand === "good" ? "clean" : lrBand === "watch" ? "manageable" : "elevated"} risk
          profile with a 5-yr loss ratio of {loss.lossRatio} against a {bench.lossRatio.toFixed(2)} book average for {idx.accountIndustry},
          and a {idx.successPropensity}% success propensity ({idx.successPropensityDrivers.toLowerCase()}).
          {openSubjectivities > 0 ? ` Terms remain non-binding pending ${openSubjectivities} outstanding condition${openSubjectivities === 1 ? "" : "s"}.` : " All conditions precedent are satisfied."}
        </p>
      </Section>

      <Section title="Construction / Occupancy">
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{extras.hazardByConstruction}</li>
          <li>{extras.hazardByOccupancy}</li>
          <li>Portfolio average hazard {sov.stats.avgHazard}/100 across {sov.stats.locationCount} locations; top concentration {sov.stats.topState}.</li>
          <li>Predominant construction class: {idx.topConstructionClass} ({idx.constructionClassPct}% of TIV).</li>
        </ul>
      </Section>

      <Section title="ITVs">
        <p>
          Values reported on a {extras.request.valuationMethod.toLowerCase()} basis and considered adequate.
          RCV supported by broker-provided appraisals; no material insurance-to-value shortfall identified at bind.
        </p>
      </Section>

      <Section title="Main Sublimits & Deductibles">
        <KV k="AOP Deductible" v={extras.policyDetails.aopDeductible} />
        {subjectivities.filter(s => /deductible/i.test(s.label)).map(s => (
          <KV key={s.label} k={s.label} v={`${s.value}${s.note ? ` (${s.note})` : ""}`} />
        ))}
        <KV k="Flood / Earthquake" v="Per-occurrence sublimit $10M; separate CAT deductible applies" />
      </Section>

      <Section title="Loss History (Minimum 5 Years)">
        <p className="text-red-600" style={{ fontWeight: 600 }}>
          Below is historical experience net of the applicable per-occurrence deductible. Under the proposed
          {" "}{extras.request.qbeLayer} attachment there would be no net losses to the QBE layer in recent history.
        </p>
        <div className="divide-y divide-[#F0EFEC] mt-1">
          {yearly.map(y => (
            <div key={y.year} className="flex justify-between py-1">
              <span className="text-[#6B7280]">{y.year}</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>{y.paid}</span>
            </div>
          ))}
          {yearly.length === 0 && <div className="py-1 text-[#9B9B98]">No yearly loss detail on file.</div>}
        </div>
        {yearly.length > 0 && (
          <div className="mt-1 pt-1 border-t border-[#E8E6E1] space-y-0.5">
            <div className="flex justify-between"><span className="text-[#6B7280]">{yearly.length}-yr Total</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{fmt$(total5)}</span></div>
            <div className="flex justify-between"><span className="text-[#6B7280]">{yearly.length}-yr Average</span><span className="tabular-nums" style={{ fontWeight: 700 }}>{fmt$(avg5)}</span></div>
          </div>
        )}
        <p className="text-[#6B7280] mt-1">{loss.summary}</p>
      </Section>

      <Section title="Modeling Results">
        <KV k="Modelled 250-yr PML" v={`${(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * 0.018 / 1e6).toFixed(1)}M (≈1.8% of TIV)`} />
        <KV k="Average Annual Loss (AAL)" v={fmt$(Math.round(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * 0.0006))} />
        <KV k="CAT Model" v={sov.modellingReady ? "RMS v23 — results in appetite" : "Pending — required before bind"} />
        <p className="text-[#9B9B98] italic mt-0.5">Rater screen output attached in file.</p>
      </Section>

      <Section title="Non CAT / Attrition Analysis">
        <p>
          Attritional loss pick derived from the {loss.lossRatio} 5-yr loss ratio, trended for exposure growth.
          Non-CAT experience is {lrBand === "good" ? "favourable and well within" : lrBand === "watch" ? "in line with" : "above"} the
          {" "}{bench.lossRatio.toFixed(2)} portfolio benchmark for {idx.accountIndustry}.
        </p>
      </Section>

      <Section title="Pricing Methodology">
        <p>
          Technical premium built from modelled AAL plus attritional load, expenses and target margin, then benchmarked to the
          indicated {rate} rate on line. Priced against {meta.tivFull} of TIV.
        </p>
        <KV k="Indicated Premium" v={premium} />
        <KV k="Rate on Line" v={rate} />
        <KV k="Broker Requested Target Price" v={brokerTargetPrice} />
      </Section>

      <Section title="Metrics">
        <KV k="Hazard Score" v={`${idx.hazardScore}/100 (Grade ${idx.hazardGrade})`} />
        <KV k="AI Priority Score" v={`${idx.aiPriorityScore}/100`} />
        <KV k="Success Propensity" v={`${idx.successPropensity}%`} />
        <KV k="5-Yr Loss Ratio" v={loss.lossRatio} />
      </Section>

      <Section title="EP Curve">
        <div className="divide-y divide-[#F0EFEC]">
          {[
            { rp: "100-yr", pct: 0.012 },
            { rp: "250-yr", pct: 0.018 },
            { rp: "500-yr", pct: 0.026 },
          ].map(r => (
            <div key={r.rp} className="flex justify-between py-1">
              <span className="text-[#6B7280]">{r.rp} return period</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>{fmt$(Math.round(parseFloat(meta.tivFull.replace(/[^0-9.]/g, "")) * r.pct))}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Marginal Impact">
        <p>
          Adding this {extras.request.qbeLayer} layer is broadly diversifying against the existing
          {" "}{idx.accountIndustry} book, with primary accumulation in {sov.stats.topState}.
          Marginal capital load is modest given the excess attachment and CAT deductible structure.
        </p>
      </Section>

      <Section title="Policy Form & Review">
        <KV k="Form" v="QBE Commercial Property All-Risk (Manuscript)" />
        <KV k="Equipment Breakdown" v={extras.policyDetails.equipmentBreakdown ? "Included" : "Excluded"} />
        <KV k="Certified Terrorism (TRIA)" v={extras.policyDetails.certifiedTerrorism ? "Purchased" : "Declined"} />
      </Section>

      <Section title="Within Authority (Y / N — approved?)" accent>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${withinAuthority ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`} style={{ fontWeight: 700 }}>
            <span className={`w-1.5 h-1.5 rounded-full ${withinAuthority ? "bg-emerald-500" : "bg-amber-400"}`} />
            {withinAuthority ? "Y — Within authority, approved" : "N — Referral required"}
          </span>
        </div>
        <p className="text-[#6B7280] mt-1">
          {withinAuthority
            ? `${idx.assignedUW || "Mike Farrell"} confirms the risk sits within delegated underwriting authority; cleared to release the quote.`
            : `Escalation to line management required: ${openSubjectivities > 0 ? `${openSubjectivities} open subjectivit${openSubjectivities === 1 ? "y" : "ies"}` : "loss experience above appetite"}.`}
        </p>
      </Section>
    </div>
  );
}

/* ── Step 4: UW Review — Proposed Quote Modal ── */
function ProposedQuoteModal({ meta, extras, sov, idx, initPremium, initRate, onQuoteGenerated, onClose }: {
  meta: SubmissionMeta; extras: SubmissionExtras;
  sov: SubmissionExtras["sov"]; idx: SubmissionIndexEntry;
  initPremium: string; initRate: string; onQuoteGenerated?: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EEF6FF] border border-[#C2DFF4] flex items-center justify-center">
              <FileText className="w-3 h-3 text-[#0076BC]" />
            </div>
            <div>
              <div className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 700 }}>Proposed Quote</div>
              <div className="text-[10px] text-[#9B9B98]">{meta.namedInsured} · {meta.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B98] hover:text-[#4B5563] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <QuoteProposalPane
            meta={meta} extras={extras} sov={sov} idx={idx}
            initPremium={initPremium} initRate={initRate}
            onQuoteGenerated={onQuoteGenerated}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: UW Review ── */
function UWReviewStep({ meta, idx, extras, onProceed }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras; onProceed: () => void;
}) {
  const INIT_PREMIUM = "$142,000";
  const INIT_RATE = "0.0499%";

  const lrBand = extras.lossHistory.lossRatioBand;
  const bench = benchmarkFor(idx.accountIndustry);
  const lossSubject = parseFloat(extras.lossHistory.lossRatio) || 0;
  const lossDelta = bookDelta(lossSubject, bench.lossRatio);
  const sov = extras.sov;
  const missingDocs = extras.documents.filter(d => !d.received);
  const subjectivities = [
    { label: "CAT model results", value: "Confirmed", status: "good" as StepStatus, note: "Modelled PML confirmed within appetite." },
    { label: "Completed SOV", value: `${sov.completenessPct}% complete`, status: "good" as StepStatus, note: sov.dataCleansingNote },
    { label: "Risk Engineering survey", value: "On file", status: "good" as StepStatus },
    { label: "Named Windstorm deductible", value: "5% of TIV per occurrence", note: "Minimum $500K" },
  ];
  const openSubjectivities = subjectivities.filter(s => s.status === "watch").length;
  const [showProposedQuote, setShowProposedQuote] = useState(false);
  const [showLeadCarrier, setShowLeadCarrier] = useState(false);
  const [showShareQuote, setShowShareQuote] = useState(false);
  const [showUWRDecline, setShowUWRDecline] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const brokerEmail = `${meta.broker.toLowerCase().replace(/\s+/g, ".")}@${meta.brokerageHouse.toLowerCase().replace(/\s+/g, "")}.com`;

  const shareQuoteBody = `Dear ${meta.broker},\n\nPlease find attached our formal indication for ${meta.namedInsured}.\n\nAccount:           ${meta.namedInsured}\nSubmission ID:     ${meta.id}\nInception Date:    ${meta.inceptionDate}\nLayer:             ${extras.request.qbeLayer}\nLimits Sought:     ${extras.request.limitsSought}\nPerils:            ${extras.request.perils.join(", ")}\nIndicated Premium: ${INIT_PREMIUM}\nRate on Line:      ${INIT_RATE}\n\nThis indication is subject to our standard terms and subjectivities. Please review the attached quote document and revert with any questions.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const leadCarrierBody = `Dear ${meta.broker},\n\nAs part of our review of ${meta.namedInsured}, we require the following information to progress our underwriting assessment:\n\nSubmission Reference: ${meta.id}\n\n  • Primary policy terms and conditions (current / proposed)\n  • Lead carrier identity and capacity\n  • Current policy wording and endorsements\n  • Any co-insurance or treaty arrangements applicable to this risk\n\nPlease provide the above at your earliest convenience.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  const uwrDeclineBody = `Dear ${meta.broker},\n\nThank you for presenting ${meta.namedInsured} for our consideration.\n\nSubmission Reference: ${meta.id}\n\nFollowing a careful review of the submission, referral, and underwriting analysis, we regret that we are unable to provide terms on this occasion.\n\nWe remain open to discussing alternative solutions and look forward to working with you on future submissions.\n\nKind regards,\n${idx.assignedUW || "Mike Farrell"} — QBE\n\n---\nPlease do not modify the submission reference (${meta.id}) when replying to this email. It is used to track correspondence against this account.`;

  return (
    <>
      <UWReviewActions
        onLeadCarrier={() => setShowLeadCarrier(true)}
        onGenQuote={() => setShowProposedQuote(true)}
        onShareQuote={() => setShowShareQuote(true)}
        onDecline={() => setShowUWRDecline(true)}
        onProceed={onProceed}
        quoteGenerated={quoteGenerated}
        openSubjectivities={openSubjectivities} />

      {showProposedQuote && createPortal(
        <ProposedQuoteModal
          meta={meta} extras={extras} sov={sov} idx={idx}
          initPremium={INIT_PREMIUM} initRate={INIT_RATE}
          onQuoteGenerated={() => { setQuoteGenerated(true); setShowProposedQuote(false); }}
          onClose={() => setShowProposedQuote(false)}
        />,
        document.body
      )}

      {showLeadCarrier && (
        <CommModal
          title="Request Primary Policy / Lead Carrier Information"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`[Action Required] Lead Carrier Information Required — ${meta.namedInsured}`}
          initialBody={leadCarrierBody}
          onClose={() => setShowLeadCarrier(false)}
        />
      )}

      {showShareQuote && (
        <CommModal
          title="Share Quote with Broker"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`QBE Formal Indication — ${meta.namedInsured} (${meta.id})`}
          attachment={{ filename: `QBE_Quote_${meta.accountName.replace(/\s+/g, "_")}.pdf` }}
          initialBody={shareQuoteBody}
          onClose={() => setShowShareQuote(false)}
        />
      )}

      {showUWRDecline && (
        <CommModal
          title="Decline to Quote"
          stage="UW Review"
          account={meta.accountName}
          to={meta.broker}
          toEmail={brokerEmail}
          subject={`QBE — Decline to Quote — ${meta.namedInsured} (${meta.id})`}
          initialBody={uwrDeclineBody}
          onClose={() => setShowUWRDecline(false)}
        />
      )}

      <StepShell
        summary={
          <div className="bg-white border border-[#E8E6E1] rounded-md">
            <div className="grid divide-x divide-[#E8E6E1]" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr" }}>
              {[
                { label: "Layer",                value: extras.request.qbeLayer,           color: "#0D1B2E" },
                { label: "Indicated Premium",    value: INIT_PREMIUM,                       color: "#0D1B2E" },
                { label: "Rate on Line",         value: INIT_RATE,                          color: "#0D1B2E" },
                { label: "5-Yr Loss Ratio",      value: extras.lossHistory.lossRatio,       color: lrBand === "good" ? "#059669" : lrBand === "watch" ? "#D97706" : "#DC2626" },
                { label: "Success Propensity",   value: `${idx.successPropensity}%`,        color: "#0D1B2E" },
                { label: "Open Subjectivities",  value: String(openSubjectivities),         color: openSubjectivities > 0 ? "#D97706" : "#059669" },
              ].map(stat => (
                <div key={stat.label} className="px-3 py-1.5">
                  <div className="text-[8px] uppercase tracking-wide" style={{ fontWeight: 700, color: "#9B9B98" }}>{stat.label}</div>
                  <div className="text-[11px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        }
        leftHeader={<PaneTitle title="UW Referral Write-Up" hint="AI-generated review for approval" />}
        left={
          <ReferralWriteUpPane
            meta={meta} idx={idx} extras={extras}
            subjectivities={subjectivities}
            lrBand={lrBand} bench={bench}
            openSubjectivities={openSubjectivities}
            premium={INIT_PREMIUM} rate={INIT_RATE}
          />
        }
      />
    </>
  );
}

function UWReviewActions({ onLeadCarrier, onGenQuote, onShareQuote, onDecline, onProceed, quoteGenerated, openSubjectivities }: {
  onLeadCarrier: () => void; onGenQuote: () => void; onShareQuote: () => void;
  onDecline: () => void; onProceed: () => void; quoteGenerated: boolean; openSubjectivities: number;
}) {
  useStepActions([
    { icon: Mail, label: "Request Lead Carrier Info", variant: "secondary" as const, onClick: onLeadCarrier },
    { icon: FileText, label: "Generate Quote", variant: "secondary" as const, onClick: onGenQuote },
    { icon: Send, label: "Share Quote", variant: "secondary" as const, onClick: onShareQuote },
    { icon: XCircle, label: "Decline to Quote", variant: "secondary" as const, onClick: onDecline },
    ...(openSubjectivities > 0 ? [{ icon: AlertTriangle, label: `Clear ${openSubjectivities} open subjectiv${openSubjectivities === 1 ? "y" : "ies"}`, onClick: () => {} }] : []),
    { icon: ChevronRight, label: "Advance to Customer Decision", onClick: onProceed },
  ], [quoteGenerated, openSubjectivities]);
  return null;
}

/* DecisionStep and DecisionActions moved to ./DecisionStep */

/* ─────────────────────────── A. Recommendation banner ─────────────────────────── */

function buildUwAlignmentSentence(idx: SubmissionIndexEntry, extras: SubmissionExtras): string {
  const hazardLabel = idx.hazardScore <= 50
    ? "within the preferred band"
    : idx.hazardScore <= 70
      ? "in the elevated band — enhanced scrutiny warranted"
      : "above appetite threshold";
  const lrNum = parseFloat(extras.lossHistory.lossRatio);
  const lrLabel = isNaN(lrNum) ? extras.lossHistory.lossRatio
    : lrNum <= 0.25 ? "favourable"
    : lrNum <= 0.45 ? "moderate"
    : "elevated";
  const classLabel = idx.industryClassification === "in-scope"
    ? "fully within appetite"
    : idx.industryClassification === "limited"
      ? "Limited appetite — senior UW sign-off required"
      : "outside current appetite";
  return `Hazard ${idx.hazardScore}/100 is ${hazardLabel}; top construction class ${idx.topConstructionClass} represents ${idx.constructionClassPct}% of TIV. Five-year loss ratio of ${extras.lossHistory.lossRatio} is ${lrLabel}. Industry ${classLabel} for QBE Commercial Property.`;
}

function buildSimilarAccountsSentence(idx: SubmissionIndexEntry, meta: SubmissionMeta): string {
  const subjectTivM = parseTIV(meta.tiv);
  const peers = INFORCE_BOOK.filter(
    (a) => a.industry === idx.accountIndustry && Math.abs(a.tiv - subjectTivM) / Math.max(subjectTivM, 1) <= 0.6,
  );
  if (peers.length === 0)
    return `No comparable ${idx.accountIndustry} accounts found in the inforce book within a similar TIV range.`;
  const bound   = peers.filter((a) => a.decision === "Bound");
  const quoted  = peers.filter((a) => a.decision === "Quoted");
  const declined = peers.filter((a) => a.decision === "Declined");
  const parts: string[] = [];
  if (bound.length)   parts.push(`${bound.length} bound (${bound.map((a) => `${a.account}: ${a.outcome}`).join("; ")})`);
  if (quoted.length)  parts.push(`${quoted.length} quoted (${quoted.map((a) => a.account).join(", ")})`);
  if (declined.length) parts.push(`${declined.length} declined (${declined.map((a) => `${a.account}: ${a.outcome}`).join("; ")})`);
  const lo = Math.round(subjectTivM * 0.5);
  const hi = Math.round(subjectTivM * 1.5);
  return `${peers.length} comparable ${idx.accountIndustry} account${peers.length !== 1 ? "s" : ""} in the $${lo}M–$${hi}M TIV range: ${parts.join("; ")}.`;
}

function RecommendationBanner({ meta, idx, extras, recommendation, status, focusNote, triage }: {
  meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras;
  recommendation: Recommendation; status?: ProcessingStatus; focusNote: string;
  triage: { clearance: boolean; ofac: boolean; appetite: boolean };
}) {
  const rec = RECOMMENDATION_CONFIG[recommendation];

  const triageChecks = [
    { label: "Clearance",        passed: triage.clearance },
    { label: "OFAC Compliance",  passed: triage.ofac },
    { label: "Appetite",         passed: triage.appetite },
  ];

  const sentences: { label: string; text: string }[] = [
    {
      label: "Triage",
      text: "Clearance, OFAC, and Appetite requirements met for proceeding with UW analysis.",
    },
    {
      label: "UW Guidelines Alignment",
      text: buildUwAlignmentSentence(idx, extras),
    },
    {
      label: "Similar Account Profiles",
      text: buildSimilarAccountsSentence(idx, meta),
    },
  ];

  return (
    <div className={`rounded-xl border ${rec.border} ${rec.bg} p-5`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full ${rec.dot} flex-shrink-0`} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-0.5" style={{ fontWeight: 700 }}>
              Overall Recommendation
            </div>
            <div className={`text-[22px] ${rec.color}`} style={{ fontWeight: 700 }}>{rec.label}</div>
            <div className="text-[12px] text-[#5D5D5D] mt-0.5 truncate">
              {meta.accountName} · {meta.id} · {meta.type} · {meta.coverageType}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {triageChecks.map(({ label, passed }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] ${
                  passed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
                style={{ fontWeight: 600 }}
              >
                {passed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {label}
              </span>
            ))}
            {(() => {
              const pct = idx.brokerBoundRate;
              const style = pct >= 75
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : pct >= 60
                ? "bg-[#EEF6FF] border-[#C2DFF4] text-[#0076BC]"
                : "bg-amber-50 border-amber-200 text-amber-700";
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] ${style}`} style={{ fontWeight: 600 }}>
                  <TrendingUp className="w-3 h-3" />
                  Broker Bind Rate: {pct}%
                </span>
              );
            })()}
          </div>
          <InsightFeedback id="recommendation-banner" compact />
        </div>
      </div>

      {/* Three insight sentences */}
      <div className="mt-2 pt-2 border-t border-current/10 flex flex-col gap-1">
        {sentences.map(({ label, text }, i) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="text-[9px] text-[#9B9B98] tabular-nums flex-shrink-0" style={{ fontWeight: 700 }}>{i + 1}.</span>
            <p className="text-[11px] text-[#4B5563] leading-snug">
              <span className="text-[9px] uppercase tracking-wide text-[#9B9B98] mr-1" style={{ fontWeight: 700 }}>{label} —</span>{text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── B. Upper-left — Key Insights ─────────────────────────── */

function KeyInsightsPanel({ groups, onNavigate, onScoreClick, navigableLabels }: {
  groups: InsightGroup[];
  onNavigate: (step: number) => void;
  onScoreClick: (label: string) => void;
  navigableLabels: Set<string>;
}) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={Gauge} title="Key Insights" subtitle="Grouped by workflow step — click any insight to navigate" />
      <div className="divide-y divide-[#F0EFEC] flex-1 overflow-auto">
        {groups.map((g) => {
          const StepIcon = g.stepIcon;
          /* Aggregate band across cards: alert > watch > good */
          const worstBand: Band = g.cards.some((c) => c.band === "alert") ? "alert"
            : g.cards.some((c) => c.band === "watch") ? "watch" : "good";
          const bs = BAND_STYLE[worstBand];
          return (
            <div key={g.stepLabel} className="border-b border-[#F0EFEC] last:border-b-0">
              {g.cards.map((s, cardIdx) => {
                const cardBs = BAND_STYLE[s.band];
                const isFirst = cardIdx === 0;
                return (
                  <div
                    key={s.label}
                    onClick={() => navigableLabels.has(s.label) && onScoreClick(s.label)}
                    className={`flex items-stretch transition-colors border-b border-[#F0EFEC] last:border-b-0${navigableLabels.has(s.label) ? " cursor-pointer hover:bg-[#EEF6FF]" : " cursor-default"}${s.label === "AI Priority Score" ? " hidden" : ""}`}
                    title={`Go to ${g.stepLabel} — ${s.label}`}
                  >
                    {/* Left column: step label + Go link — first card only; connector line on subsequent cards */}


                    {/* Label + note / sub-scores */}
                    <div className="min-w-0 flex-1 py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[11px] text-[#6B7280]" style={{ fontWeight: 600 }}>{s.label}</div>
                        <MetricTooltip />
                      </div>
                      {s.accumStates ? (
                        <p className="text-[10px] leading-snug mt-1" style={{ color: "#4B5563" }}>
                          {s.accumStates.map((st, i) => (
                            <span key={st.state}>
                              {i > 0 && ", "}
                              <span style={{ fontWeight: 600, color: "#1E3A5F" }}>{st.state}</span>
                              {" "}({st.locCount} loc{st.locCount !== 1 ? "s" : ""}, {st.locPct}% of account{st.isCATState ? ", CAT" : ""})
                            </span>
                          ))}
                          {s.accumStates.length > 0 && "."}
                        </p>
                      ) : s.layerPenetration ? (
                        <div className="flex flex-col gap-1 mt-0.5">
                          {s.layerPenetration.claimsPiercingLayer === 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151] self-start" style={{ fontWeight: 600 }}>
                              Clean · no claims pierced {s.layerPenetration.attachmentPoint} attachment
                            </span>
                          ) : (
                            <>
                              {(s.layerPenetration.piercingEvents ?? []).map((ev, ei) => (
                                <div key={ei} className="flex items-center gap-1.5 px-2 py-1 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]" style={{ fontWeight: 600 }}>
                                  <span className="shrink-0 px-1 py-px rounded text-[8px] bg-[#E8E6E1] text-[#374151]" style={{ fontWeight: 700 }}>
                                    {ev.peril}
                                  </span>
                                  <span className="flex-1 text-[#6B7280]">{ev.amount} · {ev.location} · {ev.year}</span>
                                  {ev.breachedAnnualAgg && (
                                    <span className="shrink-0 text-[8px] bg-[#E8E6E1] text-[#374151] px-1 py-px rounded" style={{ fontWeight: 700 }}>Agg breach</span>
                                  )}
                                </div>
                              ))}
                              {s.layerPenetration.yearsBreach > 0 && !(s.layerPenetration.piercingEvents ?? []).some(e => e.breachedAnnualAgg) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151] self-start" style={{ fontWeight: 600 }}>
                                  {s.layerPenetration.yearsBreach} yr{s.layerPenetration.yearsBreach > 1 ? "s" : ""} annual aggregate breached
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : s.yearlyPaid && s.yearlyPaid.length > 0 ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {s.yearlyPaid.map(y => (
                            <span key={y.year} className="inline-flex flex-col items-center px-1.5 py-1 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[#374151]" style={{ fontWeight: 600, minWidth: 38 }}>
                              <span className="text-[8px] text-[#9B9B98] leading-none">{y.year}</span>
                              <span className="text-[9px] tabular-nums leading-tight mt-0.5">{y.paid}</span>
                            </span>
                          ))}
                        </div>
                      ) : s.claimsBreakdown ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {(() => {
                            const { totalLocs, highFreq, highSev, both } = s.claimsBreakdown;
                            const pct = (n: number) => totalLocs ? Math.round((n / totalLocs) * 100) : 0;
                            const pills = [
                              both > 0 && { label: "High Freq + Sev", count: both },
                              highFreq > 0 && { label: "High Frequency", count: highFreq },
                              highSev > 0  && { label: "High Severity",  count: highSev },
                            ].filter(Boolean) as { label: string; count: number }[];
                            if (pills.length === 0) return (
                              <span className="text-[9px] text-[#6B7280]" style={{ fontWeight: 600 }}>No high-frequency or high-severity locations</span>
                            );
                            return pills.map(p => (
                              <span key={p.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]" style={{ fontWeight: 600 }}>
                                {p.count}/{totalLocs} bldgs ({pct(p.count)}%) · {p.label}
                              </span>
                            ));
                          })()}
                        </div>
                      ) : s.similarAccountNames && s.similarAccountNames.length > 0 ? (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {s.similarAccountNames.map((name, i) => (
                            <span key={name} className="text-[10px] leading-snug" style={{ color: "#1E3A5F", fontWeight: 500 }}>
                              {i + 1}. {name}
                            </span>
                          ))}
                        </div>
                      ) : s.docPills ? (
                        (() => {
                          const outstanding = s.docPills.filter((doc) => !doc.received || doc.needsReview);
                          if (outstanding.length === 0) {
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px]" style={{ fontWeight: 600 }}>
                                  <span className="text-[8px] text-emerald-500">✓</span>
                                  All received
                                </span>
                              </div>
                            );
                          }
                          return (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="text-[9px] text-[#9B9B98]" style={{ fontWeight: 600 }}>Missing:</span>
                          {outstanding.map((doc) => {
                            const short = doc.name
                              .replace("Risk Engineering Report", "Risk Eng.")
                              .replace("Primary Policy", "Policy")
                              .replace("Loss History", "Loss Runs");
                            const received = doc.received;
                            const symbol = received ? (doc.needsReview ? "⚠" : "✓") : null;
                            return (
                              <span key={doc.name}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] ${
                                  received
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-[#E8E6E1] bg-[#FAFAF9] text-[#9B9B98]"
                                }`}
                                style={{ fontWeight: 600 }}>
                                {symbol && <span className="text-[8px] text-emerald-500">{symbol}</span>}
                                {short}
                              </span>
                            );
                          })}
                        </div>
                          );
                        })()
                      ) : s.subScores ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {s.subScores.map((ss) => (
                            <span key={ss.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E6E1] bg-[#F5F5F4] text-[9px] text-[#374151]">
                              <span className="text-[#9B9B98]">{ss.label}</span>
                              <span style={{ fontWeight: 700 }}>{ss.grade}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#9B9B98] truncate">{s.note}</div>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0 px-4 py-2 flex flex-col items-end gap-1">
                      <div className="text-[14px] text-[#0076BC] tabular-nums" style={{ fontWeight: 700 }}>{s.value}</div>
                    </div>
                  </div>
                );
              })}

            </div>
          );
        })}
      </div>
    </div>
  );
}

function TriageTick({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-2 ${passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      {passed
        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        : <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      <span className={`text-[11px] ${passed ? "text-emerald-800" : "text-amber-800"}`} style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────── B. Upper-right — Account Details ─────────────────────────── */

function AccountDetailsPanel({ meta, idx, extras }: { meta: SubmissionMeta; idx: SubmissionIndexEntry; extras: SubmissionExtras }) {
  const pd = extras.policyDetails;
  const FlatField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{label}</div>
      <div className="text-[12px] font-semibold" style={{ color: "#0D1B2E" }}>{value}</div>
    </div>
  );
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0076BC" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Account Details</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <FlatField label="Insured Name"           value={meta.namedInsured} />
        {meta.type === "Renewal" && <FlatField label="Policy Number" value={pd.policyNumber} />}
        <FlatField label="Effective Date"         value={meta.inceptionDate} />
        <FlatField label="Expiration Date"        value={pd.expirationDate} />
        <FlatField label="Underwriter"            value={idx.assignedUW} />
        <FlatField label="New / Renewal"          value={meta.type} />
        <FlatField label="Proposed Commission"     value={pd.commission} />
        <FlatField label="AOP Deductible"         value={pd.aopDeductible} />
        <FlatField label="TIV"                    value={meta.tivFull} />
        <FlatField label="Contents Limit"         value={pd.contentsLimit} />
        <FlatField label="Business Limit"         value={pd.businessLimit} />
        <FlatField label="Equipment Breakdown"    value={pd.equipmentBreakdown ? "Yes" : "No"} />
        <FlatField label="Certified Terrorism"    value={pd.certifiedTerrorism ? "Purchased" : "Declined"} />
      </div>
    </div>
  );
}

function CoverageRequestPanel({ extras }: { extras: SubmissionExtras }) {
  const qbeLayerNum = parseInt(extras.request.towerPosition.match(/Layer (\d+)/)?.[1] ?? "1", 10);
  const others = extras.request.leadCarriers;
  const tower: Array<{ type: "carrier" | "qbe"; label: string; layerNum: number }> = [];
  let otherIdx = 0;
  for (let l = 1; l <= others.length + 1; l++) {
    if (l === qbeLayerNum) {
      tower.push({ type: "qbe", label: extras.request.qbeLayer, layerNum: l });
    } else {
      tower.push({ type: "carrier", label: others[otherIdx] ?? "", layerNum: l });
      otherIdx++;
    }
  }
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={Target} title="Coverage Request" subtitle="Perils, limits, and program tower" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="rounded-md border border-[#C2DFF4] bg-[#EEF6FF] p-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {extras.request.perils.map((p) => (
              <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white border border-[#C2DFF4] text-[#00205B]" style={{ fontWeight: 600 }}>{p}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-1">
            <RequestRow label="Requested Layer Limit" value={extras.request.limitsSought} />
            <RequestRow label="Valuation Method" value={extras.request.valuationMethod} />
          </div>
        </div>
        <div className="flex-1 rounded-md border border-[#E8E6E1] p-3 flex flex-col">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#0076BC] mb-2">Program Tower</p>
          <div className="flex flex-col gap-1">
            {tower.map((row, i) =>
              row.type === "qbe" ? (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] bg-[#00205B] border border-[#00205B] text-white" style={{ fontWeight: 600 }}>
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold bg-[#0076BC] text-white shrink-0">Q</span>
                  <span className="flex-1 truncate">QBE — {row.label}</span>
                  <span className="text-[8px] opacity-60 shrink-0 ml-1">L{row.layerNum}</span>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] bg-white border border-[#E2EDF7] text-[#374151]" style={{ fontWeight: 500 }}>
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold bg-[#E8EFF7] text-[#5B7FA6] shrink-0">{row.layerNum}</span>
                  <span className="flex-1 truncate">{row.label}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TivDistributionPanel({ idx, extras }: { idx: SubmissionIndexEntry; extras: SubmissionExtras }) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md h-full flex flex-col">
      <PanelHeader icon={BarChart2} title="TIV Distribution" subtitle="Occupancy · Construction · State exposure" />
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <TivMixBar
          label="Occupancy"
          slices={idx.occupancyByTIV.map((s) => ({ name: s.name, pct: s.pct, color: s.color }))}
        />
        <div className="h-px bg-[#F0EFEC]" />
        <TivMixBar
          label="Construction Class"
          slices={buildTivMix(extras.sov.locations ?? [], "construction", CONSTRUCTION_COLORS)}
        />
        <div className="h-px bg-[#F0EFEC]" />
        <TivMixBar
          label="Exposure by State"
          slices={buildTivMix(extras.sov.locations ?? [], "state", undefined, STATE_PALETTE)}
        />
      </div>
    </div>
  );
}

function RequestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-[#6B7280] w-28 flex-shrink-0" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-[#9B9B98]" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────── B. Documentation checklist ─────────────────────────── */

function DocumentChecklist({ documents }: { documents: DocItem[] }) {
  const received = documents.filter((d) => d.received).length;
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-md">
      <div className="px-4 py-2.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
          <FileText className="w-4 h-4 text-[#0076BC]" /> Documentation Received
        </span>
        <span className="text-[11px] text-[#6B7280]" style={{ fontWeight: 600 }}>{received} of {documents.length} received</span>
      </div>
      <div className="p-3 space-y-1.5">
        {documents.map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-md border border-[#E8E6E1] px-3 py-2">
            {d.received
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              : <Circle className="w-4 h-4 text-[#C9C7C1] flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <span className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 500 }}>{d.name}</span>
              {d.needsReview && d.reviewReason && (
                <div className={`text-[10px] italic mt-0.5 ${d.received ? "text-amber-700" : "text-red-600"}`}>{d.reviewReason}</div>
              )}
            </div>
            <span className="text-[10px] text-[#9B9B98] flex-shrink-0">{d.received ? d.date : "Not received"}</span>
            {d.needsReview && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0" style={{ fontWeight: 700 }}>
                <AlertTriangle className="w-2.5 h-2.5" /> REVIEW
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── C. UW Analysis — shared tile shell ─────────────────────────── */


/* PeerBenchmark, PEER_BENCHMARK, DEFAULT_BENCHMARK, benchmarkFor, parsePC, CopeGroup,
   groupByTIV, BookDelta, bookDelta, protectionScore — moved to ./SubmissionHelpers */

/* ─────────────────────────── Shared small primitives ─────────────────────────── */

function PanelHeader({ icon: Icon, title, subtitle }: { icon: typeof Building2; title: string; subtitle?: string }) {
  return (
    <div className="px-4 py-2.5 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center gap-2 min-w-0 overflow-hidden">
      <Icon className="w-4 h-4 text-[#0076BC] flex-shrink-0" />
      <span className="text-[13px] text-[#2D2D2D] flex-shrink-0" style={{ fontWeight: 600 }}>{title}</span>
      {subtitle && <span className="text-[11px] text-[#9B9B98] truncate min-w-0">— {subtitle}</span>}
    </div>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#6B7280]" style={{ fontWeight: 600 }}>
      {children}
    </span>
  );
}

function MiniField({ label, value }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-md border border-[#E8E6E1] p-2">
      <div className="text-[9px] uppercase tracking-wide text-[#6B7280] mb-0.5" style={{ fontWeight: 600 }}>{label}</div>
      <div className="text-[11px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}



