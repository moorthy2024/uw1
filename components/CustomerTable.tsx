"use client";
import { useState } from "react";
import {
  ArrowUpDown, ChevronDown, CheckCircle2, Clock,
  Lock, UserCog,
  AlertTriangle, MapPin, Mail, Globe, FileText, Zap, SlidersHorizontal
} from "lucide-react";
import { CustomerGrid } from "./customer/CustomerGrid";

interface CustomerTableProps {
  onSubmissionSelect?: (id: string) => void;
  selectedId?: string | null;
  filterType?: "all" | "new-business" | "renewals";
  hideControls?: boolean;
  externalSearch?: string;
  externalBroker?: string;
  externalStatus?: string;
  externalUwView?: "all" | "mine";
  externalAccount?: string;
  externalStageStatuses?: ProcessingStatus[];
  externalSubItemKey?: string;
}

type SortField =
  | "account" | "broker" | "brokerContact"
  | "receivedDate" | "inceptionDate" | "needByDate"
  | "processingPattern" | "aiPriorityScore" | "successPropensity"
  | "processingStatus" | "dataStatus" | "accountIndustry"
  | "sprinkleredPct" | "paidClaims5yr" | "assignedUW" | "clearance"
  | "occupancyInScopePct" | "totalTIVm";
type SortDirection = "asc" | "desc";
export type WorkflowStatus = "complete" | "in-progress" | "pending" | "not-started";

// New processing status — two phases
export type ProcessingStatus =
  | "not-processed"
  | "follow-up-required"
  | "ready-for-ops"
  | "ready-for-uw"
  | "uw-analysis"
  | "uw-review"
  | "customer-decision";

export type DataStatus = "Received" | "Processing" | "Ready";

export type IndustryClass = "in-scope" | "limited" | "out-of-scope";
type BrokerTrendDir = "up" | "down" | "flat";
export type CommunicationChannel = "Email" | "Broker Portal" | "ACORD EDI" | "API";

export interface OccupancySlice { name: string; pct: number; color: string }
export interface AppetiteSlice { bucket: "Limited" | "In Scope" | "Out of Scope"; pct: number }

interface Submission {
  id: string;
  account: string;
  homeOffice: string;
  accountIndustry: string;
  industryClassification: IndustryClass;
  broker: string;
  brokerContact: string;
  brokerBoundRate: number;
  brokerTrend: BrokerTrendDir;
  brokerTrendPct: number;
  submissionType: "New Business" | "Renewal" | "Remarket";
  processingStatus: ProcessingStatus;
  receivedDate: string;
  needByDate: string;
  inceptionDate: string;
  processingPattern: "Low Touch" | "Medium Touch" | "High Touch";
  occupancyByTIV: OccupancySlice[];
  hazardScore: number;
  hazardGrade: "A" | "B" | "C" | "D";
  totalTIVm: number;
  topConstructionClass: string;
  constructionClassPct: number;
  sprinkleredPct: number;
  aiPriorityScore: number;
  successPropensity: number;
  successPropensityDrivers: string;
  accretiveness: "High" | "Medium" | "Low";
  assignedUW: string;
  clearance: "complete" | "in-progress";
  dataStatus: DataStatus;
  occupancyAppetite: AppetiteSlice[];
  constructionAppetite: AppetiteSlice[];
  paidClaims5yr: string;
  communicationChannel: CommunicationChannel;
  communicationReceivedAt: string;
  ingested: WorkflowStatus;
  processed: WorkflowStatus;
  triaged: WorkflowStatus;
  uwAnalysis: WorkflowStatus;
  modellingReady: WorkflowStatus;
  raterGenerated: WorkflowStatus;
  quoteReady: WorkflowStatus;
  quoted: WorkflowStatus;
  formManuscript: WorkflowStatus;
  book: WorkflowStatus;
  bind: WorkflowStatus;
  issue: WorkflowStatus;
}

const CURRENT_USER = "Mike Farrell";
const TEAM_UWS = ["Mike Farrell", "Priya Patel", "Jordan Lee", "Diego Alvarez"];

export const INTERACTIVE_ACCOUNTS = new Set([
  "Pacific Coast Hotels & Resorts",
  "Heartland Industrial Holdings LLC",
  "Pinnacle Global Industries plc",
  "Westfield Manufacturing Corp",
]);

export const SORT_PRIORITY: Record<string, number> = {
  "Pacific Coast Hotels & Resorts": 0,
  "Heartland Industrial Holdings LLC": 1,
  "Pinnacle Global Industries plc": 2,
  "Westfield Manufacturing Corp": 3,
};

function fmtTIV(m: number): string {
  return m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.round(m)}M`;
}

function parseClaims(v: string): number {
  const n = parseFloat(v.replace(/[$,]/g, ""));
  if (v.includes("M")) return n * 1_000_000;
  if (v.includes("K")) return n * 1_000;
  return n;
}

const STATUS_ORDER: Record<string, number> = {
  "not-processed": 0, "follow-up-required": 1, "ready-for-ops": 2,
  "ready-for-uw": 3, "uw-analysis": 4, "uw-review": 5, "customer-decision": 6,
};
const DATA_STATUS_ORDER: Record<string, number> = { "Received": 0, "Processing": 1, "Ready": 2 };

const submissions: Submission[] = [
  {
    id: "SUB-2026-0847",
    account: "Westfield Manufacturing Corp",
    homeOffice: "Columbus, OH",
    accountIndustry: "Manufacturing",
    industryClassification: "in-scope",
    broker: "Marsh",
    brokerContact: "Sarah Mitchell",
    brokerBoundRate: 68,
    brokerTrend: "up",
    brokerTrendPct: 5,
    submissionType: "New Business",
    processingStatus: "uw-analysis",
    receivedDate: "2026-08-05",
    needByDate: "2026-08-27",
    inceptionDate: "2026-11-01",
    processingPattern: "High Touch",
    occupancyByTIV: [
      { name: "Manufacturing", pct: 62, color: "#0076BC" },
      { name: "Warehouse", pct: 28, color: "#0090DC" },
      { name: "Office", pct: 10, color: "#F4A030" },
    ],
    hazardScore: 74,
    hazardGrade: "D",
    totalTIVm: 850,
    topConstructionClass: "Frame",
    constructionClassPct: 58,
    sprinkleredPct: 42,
    aiPriorityScore: 94,
    successPropensity: 78,
    successPropensityDrivers: "Broker 68% bound · In-scope industry",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 62 }, { bucket: "Limited", pct: 28 }, { bucket: "Out of Scope", pct: 10 }],
    constructionAppetite: [{ bucket: "Out of Scope", pct: 58 }, { bucket: "Limited", pct: 30 }, { bucket: "In Scope", pct: 12 }],
    paidClaims5yr: "$2.1M",
    communicationChannel: "Email",
    communicationReceivedAt: "2026-08-05 · 09:14 AM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "in-progress", modellingReady: "pending", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0846",
    account: "Global Tech Industries LLC",
    homeOffice: "Austin, TX",
    accountIndustry: "Technology",
    industryClassification: "limited",
    broker: "AON",
    brokerContact: "Michael Torres",
    brokerBoundRate: 72,
    brokerTrend: "up",
    brokerTrendPct: 8,
    submissionType: "Renewal",
    processingStatus: "uw-review",
    receivedDate: "2026-07-29",
    needByDate: "2026-09-01",
    inceptionDate: "2026-10-01",
    processingPattern: "Low Touch",
    occupancyByTIV: [
      { name: "Office", pct: 70, color: "#0076BC" },
      { name: "Data Center", pct: 20, color: "#0076BC" },
      { name: "Lab", pct: 10, color: "#0090DC" },
    ],
    hazardScore: 42,
    hazardGrade: "A",
    totalTIVm: 620,
    topConstructionClass: "Fire Resistive",
    constructionClassPct: 70,
    sprinkleredPct: 88,
    aiPriorityScore: 88,
    successPropensity: 85,
    successPropensityDrivers: "Renewal · AON 72% bound rate",
    accretiveness: "Medium",
    assignedUW: "Priya Patel",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "Limited", pct: 70 }, { bucket: "In Scope", pct: 20 }, { bucket: "Out of Scope", pct: 10 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 70 }, { bucket: "Limited", pct: 25 }, { bucket: "Out of Scope", pct: 5 }],
    paidClaims5yr: "$480K",
    communicationChannel: "Broker Portal",
    communicationReceivedAt: "2026-07-29 · 02:30 PM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "complete", raterGenerated: "complete",
    quoteReady: "complete", quoted: "complete", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0845",
    account: "Atlantic Distribution Centers",
    homeOffice: "Newark, NJ",
    accountIndustry: "Logistics",
    industryClassification: "in-scope",
    broker: "Willis",
    brokerContact: "Jennifer Blake",
    brokerBoundRate: 55,
    brokerTrend: "down",
    brokerTrendPct: 4,
    submissionType: "New Business",
    processingStatus: "ready-for-uw",
    receivedDate: "2026-08-08",
    needByDate: "2026-09-05",
    inceptionDate: "2026-10-15",
    processingPattern: "High Touch",
    occupancyByTIV: [
      { name: "Warehouse", pct: 75, color: "#0076BC" },
      { name: "Distribution", pct: 20, color: "#0090DC" },
      { name: "Office", pct: 5, color: "#F4A030" },
    ],
    hazardScore: 68,
    hazardGrade: "D",
    totalTIVm: 735,
    topConstructionClass: "Masonry",
    constructionClassPct: 62,
    sprinkleredPct: 35,
    aiPriorityScore: 92,
    successPropensity: 65,
    successPropensityDrivers: "Willis 55% bound ↓ · First submission",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "in-progress",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 75 }, { bucket: "Limited", pct: 20 }, { bucket: "Out of Scope", pct: 5 }],
    constructionAppetite: [{ bucket: "Limited", pct: 62 }, { bucket: "In Scope", pct: 28 }, { bucket: "Out of Scope", pct: 10 }],
    paidClaims5yr: "$890K",
    communicationChannel: "Email",
    communicationReceivedAt: "2026-08-08 · 11:47 AM",
    ingested: "complete", processed: "complete", triaged: "in-progress",
    uwAnalysis: "pending", modellingReady: "not-started", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0844",
    account: "Northeast Logistics Group",
    homeOffice: "Boston, MA",
    accountIndustry: "Logistics",
    industryClassification: "in-scope",
    broker: "CRC",
    brokerContact: "David Park",
    brokerBoundRate: 81,
    brokerTrend: "flat",
    brokerTrendPct: 1,
    submissionType: "Renewal",
    processingStatus: "uw-analysis",
    receivedDate: "2026-08-04",
    needByDate: "2026-08-25",
    inceptionDate: "2026-10-15",
    processingPattern: "Medium Touch",
    occupancyByTIV: [
      { name: "Warehouse", pct: 55, color: "#0076BC" },
      { name: "Logistics Hub", pct: 30, color: "#0090DC" },
      { name: "Office", pct: 15, color: "#F4A030" },
    ],
    hazardScore: 58,
    hazardGrade: "C",
    totalTIVm: 540,
    topConstructionClass: "Steel Frame",
    constructionClassPct: 70,
    sprinkleredPct: 61,
    aiPriorityScore: 76,
    successPropensity: 90,
    successPropensityDrivers: "CRC 81% bound · Renewal",
    accretiveness: "Medium",
    assignedUW: "Jordan Lee",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 55 }, { bucket: "Limited", pct: 35 }, { bucket: "Out of Scope", pct: 10 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 70 }, { bucket: "Limited", pct: 25 }, { bucket: "Out of Scope", pct: 5 }],
    paidClaims5yr: "$1.4M",
    communicationChannel: "ACORD EDI",
    communicationReceivedAt: "2026-08-04 · 08:00 AM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "in-progress", modellingReady: "in-progress", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0850",
    account: "TechCorp Solutions Inc",
    homeOffice: "Seattle, WA",
    accountIndustry: "Technology",
    industryClassification: "limited",
    broker: "AON",
    brokerContact: "Lisa Rodriguez",
    brokerBoundRate: 72,
    brokerTrend: "up",
    brokerTrendPct: 8,
    submissionType: "Renewal",
    processingStatus: "ready-for-uw",
    receivedDate: "2026-08-11",
    needByDate: "2026-09-08",
    inceptionDate: "2026-11-15",
    processingPattern: "Medium Touch",
    occupancyByTIV: [
      { name: "Office", pct: 60, color: "#0076BC" },
      { name: "R&D Lab", pct: 25, color: "#0076BC" },
      { name: "Storage", pct: 15, color: "#0090DC" },
    ],
    hazardScore: 38,
    hazardGrade: "B",
    totalTIVm: 680,
    topConstructionClass: "Fire Resistive",
    constructionClassPct: 80,
    sprinkleredPct: 94,
    aiPriorityScore: 91,
    successPropensity: 88,
    successPropensityDrivers: "Renewal · AON 72% bound rate ↑",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "complete",
    dataStatus: "Processing",
    occupancyAppetite: [{ bucket: "Limited", pct: 60 }, { bucket: "In Scope", pct: 30 }, { bucket: "Out of Scope", pct: 10 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 80 }, { bucket: "Limited", pct: 15 }, { bucket: "Out of Scope", pct: 5 }],
    paidClaims5yr: "$320K",
    communicationChannel: "Broker Portal",
    communicationReceivedAt: "2026-08-11 · 10:05 AM",
    ingested: "complete", processed: "complete", triaged: "in-progress",
    uwAnalysis: "pending", modellingReady: "not-started", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0851",
    account: "TechCorp Solutions Inc",
    homeOffice: "Seattle, WA",
    accountIndustry: "Technology",
    industryClassification: "limited",
    broker: "AON",
    brokerContact: "Lisa Rodriguez",
    brokerBoundRate: 72,
    brokerTrend: "up",
    brokerTrendPct: 8,
    submissionType: "Renewal",
    processingStatus: "customer-decision",
    receivedDate: "2026-07-10",
    needByDate: "2026-08-12",
    inceptionDate: "2026-09-01",
    processingPattern: "Low Touch",
    occupancyByTIV: [
      { name: "Office", pct: 65, color: "#0076BC" },
      { name: "R&D Lab", pct: 20, color: "#0076BC" },
      { name: "Storage", pct: 15, color: "#0090DC" },
    ],
    hazardScore: 35,
    hazardGrade: "A",
    totalTIVm: 680,
    topConstructionClass: "Fire Resistive",
    constructionClassPct: 82,
    sprinkleredPct: 91,
    aiPriorityScore: 82,
    successPropensity: 92,
    successPropensityDrivers: "Existing relationship · Renewal",
    accretiveness: "Medium",
    assignedUW: "Diego Alvarez",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "Limited", pct: 65 }, { bucket: "In Scope", pct: 25 }, { bucket: "Out of Scope", pct: 10 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 82 }, { bucket: "Limited", pct: 13 }, { bucket: "Out of Scope", pct: 5 }],
    paidClaims5yr: "$215K",
    communicationChannel: "API",
    communicationReceivedAt: "2026-07-10 · 03:22 PM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "complete", raterGenerated: "complete",
    quoteReady: "complete", quoted: "complete", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0843",
    account: "Pacific Coast Hotels & Resorts",
    homeOffice: "Los Angeles, CA",
    accountIndustry: "Hospitality",
    industryClassification: "in-scope",
    broker: "Marsh",
    brokerContact: "Sarah Mitchell",
    brokerBoundRate: 68,
    brokerTrend: "up",
    brokerTrendPct: 5,
    submissionType: "New Business",
    processingStatus: "uw-analysis",
    receivedDate: "2026-08-01",
    needByDate: "2026-08-29",
    inceptionDate: "2026-10-01",
    processingPattern: "Medium Touch",
    occupancyByTIV: [
      { name: "Hotel", pct: 80, color: "#0076BC" },
      { name: "Restaurant", pct: 12, color: "#F4A030" },
      { name: "Retail", pct: 8, color: "#0090DC" },
    ],
    hazardScore: 62,
    hazardGrade: "C",
    totalTIVm: 1200,
    topConstructionClass: "Masonry Non-Combustible",
    constructionClassPct: 55,
    sprinkleredPct: 48,
    aiPriorityScore: 90,
    successPropensity: 72,
    successPropensityDrivers: "Marsh 68% bound · CAT exposure risk",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 80 }, { bucket: "Limited", pct: 12 }, { bucket: "Out of Scope", pct: 8 }],
    constructionAppetite: [{ bucket: "Limited", pct: 55 }, { bucket: "In Scope", pct: 35 }, { bucket: "Out of Scope", pct: 10 }],
    paidClaims5yr: "$3.8M",
    communicationChannel: "Email",
    communicationReceivedAt: "2026-08-01 · 08:53 AM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "in-progress", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-0842",
    account: "Midwest Manufacturing Inc",
    homeOffice: "Detroit, MI",
    accountIndustry: "Manufacturing",
    industryClassification: "in-scope",
    broker: "AON",
    brokerContact: "Michael Torres",
    brokerBoundRate: 72,
    brokerTrend: "flat",
    brokerTrendPct: 0,
    submissionType: "Renewal",
    processingStatus: "follow-up-required",
    receivedDate: "2026-08-06",
    needByDate: "2026-09-03",
    inceptionDate: "2026-11-01",
    processingPattern: "Low Touch",
    occupancyByTIV: [
      { name: "Manufacturing", pct: 70, color: "#0076BC" },
      { name: "Warehouse", pct: 22, color: "#0090DC" },
      { name: "Office", pct: 8, color: "#F4A030" },
    ],
    hazardScore: 66,
    hazardGrade: "C",
    totalTIVm: 510,
    topConstructionClass: "Frame",
    constructionClassPct: 52,
    sprinkleredPct: 29,
    aiPriorityScore: 72,
    successPropensity: 88,
    successPropensityDrivers: "Renewal · AON 72% stable",
    accretiveness: "Low",
    assignedUW: "Priya Patel",
    clearance: "complete",
    dataStatus: "Received",
    occupancyAppetite: [{ bucket: "In Scope", pct: 70 }, { bucket: "Limited", pct: 22 }, { bucket: "Out of Scope", pct: 8 }],
    constructionAppetite: [{ bucket: "Out of Scope", pct: 52 }, { bucket: "Limited", pct: 30 }, { bucket: "In Scope", pct: 18 }],
    paidClaims5yr: "$1.7M",
    communicationChannel: "ACORD EDI",
    communicationReceivedAt: "2026-08-06 · 01:11 PM",
    ingested: "complete", processed: "in-progress", triaged: "not-started",
    uwAnalysis: "not-started", modellingReady: "not-started", raterGenerated: "not-started",
    quoteReady: "not-started", quoted: "not-started", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-1103",
    account: "Heartland Industrial Holdings LLC",
    homeOffice: "Indianapolis, IN",
    accountIndustry: "Manufacturing",
    industryClassification: "in-scope",
    broker: "Aon",
    brokerContact: "Nicole Baxter",
    brokerBoundRate: 61,
    brokerTrend: "flat",
    brokerTrendPct: 0,
    submissionType: "New Business",
    processingStatus: "uw-review",
    receivedDate: "2026-08-03",
    needByDate: "2026-08-28",
    inceptionDate: "2026-09-01",
    processingPattern: "High Touch",
    occupancyByTIV: [
      { name: "Manufacturing", pct: 71, color: "#0076BC" },
      { name: "Warehouse", pct: 22, color: "#0090DC" },
      { name: "Office", pct: 7, color: "#F4A030" },
    ],
    hazardScore: 58,
    hazardGrade: "C",
    totalTIVm: 13000,
    topConstructionClass: "Steel Frame",
    constructionClassPct: 35,
    sprinkleredPct: 68,
    aiPriorityScore: 98,
    successPropensity: 71,
    successPropensityDrivers: "Broker 61% bound · Facultative referral required",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 78 }, { bucket: "Limited", pct: 19 }, { bucket: "Out of Scope", pct: 3 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 65 }, { bucket: "Limited", pct: 31 }, { bucket: "Out of Scope", pct: 4 }],
    paidClaims5yr: "$26.2M",
    communicationChannel: "Email",
    communicationReceivedAt: "2026-08-03 · 09:14 AM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "pending", raterGenerated: "complete",
    quoteReady: "complete", quoted: "complete", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-1287",
    account: "Meridian Global Financial Group",
    homeOffice: "New York, NY",
    accountIndustry: "Financial Institutions",
    industryClassification: "limited",
    broker: "Marsh",
    brokerContact: "James Whitfield",
    brokerBoundRate: 74,
    brokerTrend: "up",
    brokerTrendPct: 4,
    submissionType: "Renewal",
    processingStatus: "uw-review",
    receivedDate: "2026-09-01",
    needByDate: "2026-10-15",
    inceptionDate: "2026-11-01",
    processingPattern: "High Touch",
    occupancyByTIV: [
      { name: "Office", pct: 87, color: "#0076BC" },
      { name: "Data Processing", pct: 8, color: "#0090DC" },
      { name: "Other", pct: 5, color: "#F4A030" },
    ],
    hazardScore: 31,
    hazardGrade: "B",
    totalTIVm: 1850,
    topConstructionClass: "Fire Resistive",
    constructionClassPct: 74,
    sprinkleredPct: 94,
    aiPriorityScore: 89,
    successPropensity: 82,
    successPropensityDrivers: "Renewal · Marsh 74% bound · Loss-affected",
    accretiveness: "Medium",
    assignedUW: "Elena Vasquez",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 95 }, { bucket: "Limited", pct: 5 }, { bucket: "Out of Scope", pct: 0 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 94 }, { bucket: "Limited", pct: 6 }, { bucket: "Out of Scope", pct: 0 }],
    paidClaims5yr: "$143.5M",
    communicationChannel: "Broker Portal",
    communicationReceivedAt: "2026-09-01 · 02:47 PM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "complete", raterGenerated: "complete",
    quoteReady: "complete", quoted: "complete", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
  {
    id: "SUB-2026-1214",
    account: "Pinnacle Global Industries plc",
    homeOffice: "London, United Kingdom",
    accountIndustry: "Manufacturing",
    industryClassification: "in-scope",
    broker: "Willis",
    brokerContact: "Isabelle Duarte",
    brokerBoundRate: 58,
    brokerTrend: "flat",
    brokerTrendPct: 0,
    submissionType: "New Business",
    processingStatus: "uw-review",
    receivedDate: "2026-08-15",
    needByDate: "2026-09-20",
    inceptionDate: "2026-10-01",
    processingPattern: "High Touch",
    occupancyByTIV: [
      { name: "Manufacturing", pct: 64, color: "#0076BC" },
      { name: "Warehouse", pct: 18, color: "#0090DC" },
      { name: "Office", pct: 18, color: "#F4A030" },
    ],
    hazardScore: 63,
    hazardGrade: "C",
    totalTIVm: 11200,
    topConstructionClass: "Reinforced Concrete",
    constructionClassPct: 41,
    sprinkleredPct: 71,
    aiPriorityScore: 96,
    successPropensity: 58,
    successPropensityDrivers: "Broker 58% bound · New business · Multi-territory",
    accretiveness: "High",
    assignedUW: "Mike Farrell",
    clearance: "complete",
    dataStatus: "Ready",
    occupancyAppetite: [{ bucket: "In Scope", pct: 82 }, { bucket: "Limited", pct: 15 }, { bucket: "Out of Scope", pct: 3 }],
    constructionAppetite: [{ bucket: "In Scope", pct: 60 }, { bucket: "Limited", pct: 34 }, { bucket: "Out of Scope", pct: 6 }],
    paidClaims5yr: "$14.8M",
    communicationChannel: "Email",
    communicationReceivedAt: "2026-08-15 · 11:05 AM",
    ingested: "complete", processed: "complete", triaged: "complete",
    uwAnalysis: "complete", modellingReady: "pending", raterGenerated: "complete",
    quoteReady: "complete", quoted: "complete", formManuscript: "not-started",
    book: "not-started", bind: "not-started", issue: "not-started",
  },
];

// ── Shared submission index (consumed by the submission detail screen) ──
export interface SubmissionIndexEntry {
  occupancyByTIV: OccupancySlice[];
  hazardScore: number;
  hazardGrade: "A" | "B" | "C" | "D";
  totalTIVm: number;
  topConstructionClass: string;
  constructionClassPct: number;
  sprinkleredPct: number;
  successPropensity: number;
  successPropensityDrivers: string;
  industryClassification: IndustryClass;
  processingStatus: ProcessingStatus;
  clearance: "complete" | "in-progress";
  homeOffice: string;
  accountIndustry: string;
  brokerBoundRate: number;
  brokerTrend: BrokerTrendDir;
  aiPriorityScore: number;
  processingPattern: "Low Touch" | "Medium Touch" | "High Touch";
  needByDate: string;
  inceptionDate: string;
  assignedUW: string;
}

export const SUBMISSION_INDEX: Record<string, SubmissionIndexEntry> = submissions.reduce(
  (acc, s) => {
    acc[s.id] = {
      occupancyByTIV: s.occupancyByTIV,
      hazardScore: s.hazardScore,
      hazardGrade: s.hazardGrade,
      totalTIVm: s.totalTIVm,
      topConstructionClass: s.topConstructionClass,
      constructionClassPct: s.constructionClassPct,
      sprinkleredPct: s.sprinkleredPct,
      successPropensity: s.successPropensity,
      successPropensityDrivers: s.successPropensityDrivers,
      industryClassification: s.industryClassification,
      processingStatus: s.processingStatus,
      clearance: s.clearance,
      homeOffice: s.homeOffice,
      accountIndustry: s.accountIndustry,
      brokerBoundRate: s.brokerBoundRate,
      brokerTrend: s.brokerTrend,
      aiPriorityScore: s.aiPriorityScore,
      processingPattern: s.processingPattern,
      needByDate: s.needByDate,
      inceptionDate: s.inceptionDate,
      assignedUW: s.assignedUW,
    };
    return acc;
  },
  {} as Record<string, SubmissionIndexEntry>,
);

// ── Flat submission list for grid/other views ──
export interface SubmissionCard {
  id: string;
  account: string;
  homeOffice: string;
  accountIndustry: string;
  industryClassification: IndustryClass;
  broker: string;
  brokerContact: string;
  brokerBoundRate: number;
  submissionType: "New Business" | "Renewal" | "Remarket";
  processingStatus: ProcessingStatus;
  receivedDate: string;
  needByDate: string;
  inceptionDate: string;
  hazardScore: number;
  hazardGrade: "A" | "B" | "C" | "D";
  totalTIVm: number;
  topConstructionClass: string;
  constructionClassPct: number;
  sprinkleredPct: number;
  successPropensity: number;
  successPropensityDrivers: string;
  occupancyByTIV: OccupancySlice[];
  assignedUW: string;
  aiPriorityScore: number;
  clearance: "complete" | "in-progress";
  dataStatus: DataStatus;
  occupancyAppetite: AppetiteSlice[];
  constructionAppetite: AppetiteSlice[];
  paidClaims5yr: string;
  ingested: WorkflowStatus;
  processed: WorkflowStatus;
  triaged: WorkflowStatus;
  uwAnalysis: WorkflowStatus;
  modellingReady: WorkflowStatus;
  raterGenerated: WorkflowStatus;
  quoteReady: WorkflowStatus;
  quoted: WorkflowStatus;
  formManuscript: WorkflowStatus;
  bind: WorkflowStatus;
  issue: WorkflowStatus;
}

export const SUBMISSION_CARDS: SubmissionCard[] = submissions.map(s => ({
  id: s.id, account: s.account, homeOffice: s.homeOffice,
  accountIndustry: s.accountIndustry, industryClassification: s.industryClassification,
  broker: s.broker, brokerContact: s.brokerContact, brokerBoundRate: s.brokerBoundRate,
  submissionType: s.submissionType, processingStatus: s.processingStatus,
  receivedDate: s.receivedDate, needByDate: s.needByDate, inceptionDate: s.inceptionDate,
  hazardScore: s.hazardScore, hazardGrade: s.hazardGrade, totalTIVm: s.totalTIVm, topConstructionClass: s.topConstructionClass,
  constructionClassPct: s.constructionClassPct, sprinkleredPct: s.sprinkleredPct,
  successPropensity: s.successPropensity, successPropensityDrivers: s.successPropensityDrivers,
  occupancyByTIV: s.occupancyByTIV, assignedUW: s.assignedUW,
  aiPriorityScore: s.aiPriorityScore, clearance: s.clearance, dataStatus: s.dataStatus,
  occupancyAppetite: s.occupancyAppetite, constructionAppetite: s.constructionAppetite,
  paidClaims5yr: s.paidClaims5yr,
  ingested: s.ingested, processed: s.processed, triaged: s.triaged,
  uwAnalysis: s.uwAnalysis, modellingReady: s.modellingReady, raterGenerated: s.raterGenerated,
  quoteReady: s.quoteReady, quoted: s.quoted, formManuscript: s.formManuscript,
  bind: s.bind, issue: s.issue,
}));

// ── Stage rollup: real-time book snapshot derived from the submission records ──
export interface StageRollup { total: number; items: { label: string; count: number }[] }

const countBy = (pred: (s: Submission) => boolean) => submissions.filter(pred).length;

export const STAGE_ROLLUP: Record<"ingestion" | "triage" | "analysis" | "review" | "decision", StageRollup> = {
  ingestion: {
    total: countBy(s => s.processingStatus === "not-processed" || s.processingStatus === "follow-up-required" || s.processingStatus === "ready-for-ops"),
    items: [
      { label: "Received",       count: countBy(s => s.ingested === "complete") },
      { label: "Data Extracted", count: countBy(s => s.processed === "complete") },
    ],
  },
  triage: {
    total: countBy(s => s.processingStatus === "ready-for-uw"),
    items: [
      { label: "Awaiting Triage", count: countBy(s => s.triaged === "in-progress" || s.triaged === "pending") },
      { label: "Cleared",         count: countBy(s => s.triaged === "complete") },
    ],
  },
  analysis: {
    total: countBy(s => s.processingStatus === "uw-analysis"),
    items: [
      { label: "In Analysis",        count: countBy(s => s.uwAnalysis === "in-progress") },
      { label: "In CAT Modelling",   count: countBy(s => s.modellingReady === "in-progress") },
      { label: "Modelling Returned", count: countBy(s => s.modellingReady === "complete") },
      { label: "In Rating",          count: countBy(s => s.raterGenerated === "in-progress") },
    ],
  },
  review: {
    total: countBy(s => s.processingStatus === "uw-review"),
    items: [
      { label: "Quote Ready", count: countBy(s => s.quoteReady === "complete" && s.quoted !== "complete") },
      { label: "Quoted",      count: countBy(s => s.quoted === "complete") },
      { label: "Manuscript",  count: countBy(s => s.formManuscript === "in-progress" || s.formManuscript === "complete") },
    ],
  },
  decision: {
    total: countBy(s => s.processingStatus === "customer-decision"),
    items: [
      { label: "Awaiting Issuance",  count: countBy(s => s.bind === "complete" && s.issue !== "complete") },
      { label: "Issued",             count: countBy(s => s.issue === "complete") },
    ],
  },
};

export const TABLE_SUBITEM_PREDS: Record<string, (s: Submission) => boolean> = {
  "ingestion|Received":          s => s.ingested === "complete",
  "ingestion|Data Extracted":    s => s.processed === "complete",
  "triage|Awaiting Triage":      s => s.triaged === "in-progress" || s.triaged === "pending",
  "triage|Cleared":              s => s.triaged === "complete",
  "analysis|In Analysis":        s => s.uwAnalysis === "in-progress",
  "analysis|In CAT Modelling":   s => s.modellingReady === "in-progress",
  "analysis|Modelling Returned": s => s.modellingReady === "complete",
  "analysis|In Rating":          s => s.raterGenerated === "in-progress",
  "review|Quote Ready":          s => s.quoteReady === "complete" && s.quoted !== "complete",
  "review|Quoted":               s => s.quoted === "complete",
  "review|Manuscript":           s => s.formManuscript === "in-progress" || s.formManuscript === "complete",
  "decision|Awaiting Issuance":  s => s.bind === "complete" && s.issue !== "complete",
  "decision|Issued":             s => s.issue === "complete",
};

// ── Processing Status ──
export const PROCESSING_STATUS_CONFIG: Record<ProcessingStatus, { label: string; phase: "prep" | "uw"; color: string; bg: string; border: string }> = {
  "not-processed":       { label: "Not Processed",      phase: "prep", color: "text-[#94A3B8]",   bg: "bg-[#EEF4FF]",    border: "border-[#E0E8FF]" },
  "follow-up-required":  { label: "Follow Up Required",  phase: "prep", color: "text-amber-700",   bg: "bg-amber-50",     border: "border-amber-200" },
  "ready-for-ops":       { label: "Ready for Ops",       phase: "prep", color: "text-sky-700",     bg: "bg-sky-50",       border: "border-sky-200" },
  "ready-for-uw":        { label: "Ready for UW",        phase: "uw",   color: "text-[#005A8F]",   bg: "bg-[#E8F4FC]",    border: "border-[#B3D6EE]" },
  "uw-analysis":         { label: "UW Analysis",         phase: "uw",   color: "text-[#0076BC]",   bg: "bg-[#EEF6FF]",    border: "border-[#C2DFF4]" },
  "uw-review":           { label: "UW Review",           phase: "uw",   color: "text-[#00205B]",   bg: "bg-[#E6EBF5]",    border: "border-[#B0BDD9]" },
  "customer-decision":   { label: "Customer Decision",   phase: "uw",   color: "text-emerald-700", bg: "bg-emerald-50",   border: "border-emerald-200" },
};

function ProcessingStatusBadge({ status }: { status: ProcessingStatus }) {
  const cfg = PROCESSING_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

// ── Industry Classification ──
function IndustryClassBadge({ cls: _cls, industry }: { cls: IndustryClass; industry: string }) {
  return (
    <span className="text-[12px] text-[#1E3A5F] truncate max-w-[120px]" style={{ fontWeight: 500 }}>{industry}</span>
  );
}

// ── Broker Cell ──
function BrokerageCell({ name, boundRate }: { name: string; boundRate: number }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-[#0D1B2E] truncate max-w-[100px]" style={{ fontWeight: 600 }}>{name}</div>
      <div className="mt-0.5">
        <span className="text-[10px] text-[#94A3B8]">{boundRate}% bound</span>
      </div>
    </div>
  );
}

function BrokerContactCell({ contact }: { contact: string }) {
  return (
    <div className="text-[12px] text-[#0D1B2E] truncate max-w-[130px]" style={{ fontWeight: 500 }}>{contact}</div>
  );
}

// ── Data Status Badge ──
export const DATA_STATUS_CFG: Record<DataStatus, { label: string; color: string; bg: string; border: string }> = {
  "Received":   { label: "Received",   color: "text-[#94A3B8]", bg: "bg-[#F8FAFC]",  border: "border-[#E2E8F0]" },
  "Processing": { label: "Processing", color: "text-amber-700", bg: "bg-amber-50",   border: "border-amber-200" },
  "Ready":      { label: "Ready",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function DataStatusBadge({ status }: { status: DataStatus }) {
  const cfg = DATA_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

// ── Date + Urgency ──
function urgencyDays(needBy: string): number {
  return Math.ceil((new Date(needBy).getTime() - Date.now()) / 86400000);
}

function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DateCell({ date }: { date: string }) {
  return (
    <div className="text-[12px] text-[#1E3A5F]" style={{ fontWeight: 500 }}>
      {fmtFullDate(date)}
    </div>
  );
}

// ── Appetite Bucket Bar (shared by Occupancy % TIV and Construction Hazard % TIV) ──
const APPETITE_CFG: Record<AppetiteSlice["bucket"], { color: string; label: string }> = {
  "In Scope":     { color: "#16A34A", label: "In Scope" },
  "Limited":      { color: "#F4A030", label: "Limited" },
  "Out of Scope": { color: "#DC2626", label: "Out of Scope" },
};

export function AppetiteBucketBar({ slices, inline = false }: { slices: AppetiteSlice[]; inline?: boolean }) {
  return (
    <div className="min-w-[110px]">
      <div className="flex h-2 rounded-full overflow-hidden w-full mb-1.5">
        {slices.map(s => (
          <div key={s.bucket} style={{ width: `${s.pct}%`, backgroundColor: APPETITE_CFG[s.bucket].color }} />
        ))}
      </div>
      {inline ? (
        <div className="flex items-center gap-2.5 flex-wrap">
          {slices.map(s => (
            <span key={s.bucket} className="inline-flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: APPETITE_CFG[s.bucket].color }} />
              <span style={{ color: "#4A6080" }}>{s.bucket}</span>
              <span style={{ color: "#1E3A5F", fontWeight: 600 }}>{s.pct}%</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {slices.map(s => (
            <div key={s.bucket} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: APPETITE_CFG[s.bucket].color }} />
              <span className="text-[10px] text-[#4A6080] truncate">{s.bucket}</span>
              <span className="text-[10px] text-[#1E3A5F] ml-auto" style={{ fontWeight: 600 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TIV / Construction ──
const HAZARD_GRADE_CFG: Record<"A" | "B" | "C" | "D", { color: string; textColor: string; borderColor: string }> = {
  A: { color: "#EEF6FF", textColor: "#0076BC", borderColor: "#C2DFF4" },
  B: { color: "#F0FDF4", textColor: "#15803D", borderColor: "#BBF7D0" },
  C: { color: "#FFF7ED", textColor: "#C2410C", borderColor: "#FED7AA" },
  D: { color: "#FEF2F2", textColor: "#DC2626", borderColor: "#FECACA" },
};

function HazardCell({ totalTIVm, sprinkleredPct }: { grade: "A" | "B" | "C" | "D"; constClass: string; constPct: number; totalTIVm: number; sprinkleredPct: number }) {
  const notPct = 100 - sprinkleredPct;
  return (
    <div className="flex flex-col gap-1.5 min-w-[150px]">
      {/* Two-segment bar */}
      <div className="flex h-2 rounded-full overflow-hidden w-full">
        <div style={{ width: `${sprinkleredPct}%`, backgroundColor: "#0076BC" }} />
        <div style={{ width: `${notPct}%`, backgroundColor: "#E0E8FF" }} />
      </div>
      {/* Labels */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#0076BC" }} />
            <span style={{ color: "#94A3B8" }}>Sprinklered</span>
          </span>
          <span style={{ color: "#1E3A5F", fontWeight: 600 }}>{sprinkleredPct}%</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: "#E0E8FF", border: "1px solid #CBD5E1" }} />
            <span style={{ color: "#94A3B8" }}>Not Sprinklered</span>
          </span>
          <span style={{ color: "#1E3A5F", fontWeight: 600 }}>{notPct}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Success Propensity ──
function SuccessPropensityCell({ pct }: { pct: number; drivers?: string }) {
  const color = pct >= 75 ? "#22C55E" : pct >= 55 ? "#F59E0B" : "#EF4444";
  const circumference = 2 * Math.PI * 14;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-10 h-10">
        <svg width="40" height="40" className="-rotate-90">
          <circle cx="20" cy="20" r="14" fill="none" stroke="#E0E8FF" strokeWidth="3" />
          <circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ fontWeight: 700, color }}>
          <span style={{ fontSize: 8 }}>{pct}</span><span style={{ fontSize: 6 }}>%</span>
        </span>
      </div>
    </div>
  );
}

// ── UW Assignment ──
function uwInitials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}
function uwColor(name: string) {
  const palette = ["#0076BC", "#0090DC", "#20A8E0", "#E07010", "#F4A030", "#00205B"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}

function UWAssignmentCell({ submission, isMine, onReassign }: {
  submission: Submission; isMine: boolean; onReassign: (id: string, uw: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = submission.assignedUW;
  const color = uwColor(name);
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); if (isMine) setOpen(o => !o); }}
        disabled={!isMine}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
          isMine ? "border-[#E0E8FF] bg-white hover:bg-[#F8FBFF]" : "border-[#E8F0FF] bg-[#F0F5FF] cursor-not-allowed"
        }`}
        title={isMine ? "Click to re-assign" : `Locked — ${name}`}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0"
          style={{ backgroundColor: color, fontWeight: 700 }}>{uwInitials(name)}</div>
        <div className="text-left min-w-0">
          <div className={`text-[11px] truncate max-w-[80px] ${isMine ? "text-[#0D1B2E]" : "text-[#6B81A0]"}`} style={{ fontWeight: 600 }}>{name}</div>
        </div>
        {isMine ? <ChevronDown className="w-3 h-3 text-[#6B81A0]" /> : <Lock className="w-3 h-3 text-[#94A3B8]" />}
      </button>
      {open && isMine && (
        <div className="absolute top-full left-0 mt-1 z-20 w-48 bg-white border border-[#E0E8FF] rounded-lg shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}>
          <div className="px-3 py-1.5 text-[10px] text-[#94A3B8] uppercase tracking-wider" style={{ fontWeight: 700 }}>Re-assign to</div>
          {TEAM_UWS.filter(u => u !== name).map(u => (
            <button key={u} onClick={() => { onReassign(submission.id, u); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#1E3A5F] hover:bg-[#F8FBFF]">
              <UserCog className="w-3.5 h-3.5 text-[#0076BC]" />
              <span>{u}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClearanceBadge({ status }: { status: "complete" | "in-progress" }) {
  if (status === "complete") {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Salesforce clearance complete">
        <CheckCircle2 className="w-3 h-3" />
        <span className="text-[10px]" style={{ fontWeight: 600 }}>Cleared</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3 animate-pulse" />
      <span className="text-[10px]" style={{ fontWeight: 600 }}>Clearing</span>
    </div>
  );
}

// ── Communications Received ──
const CHANNEL_CFG: Record<CommunicationChannel, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  "Email":         { icon: Mail,     label: "Email",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  "Broker Portal": { icon: Globe,    label: "Broker Portal", color: "text-[#005A8F]",   bg: "bg-[#E8F4FC]",  border: "border-[#B3D6EE]" },
  "ACORD EDI":     { icon: FileText, label: "ACORD EDI",     color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  "API":           { icon: Zap,      label: "API",           color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function CommChannelCell({ channel, receivedAt }: { channel: CommunicationChannel; receivedAt: string }) {
  const cfg = CHANNEL_CFG[channel];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col gap-1.5 min-w-[110px]">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] w-fit ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
      <span className="text-[10px] text-[#94A3B8] leading-tight">{receivedAt}</span>
    </div>
  );
}

// ── Submission type badge ──
function SubTypeBadge({ type }: { type: Submission["submissionType"] }) {
  const nb = type === "New Business" || type === "Remarket";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${nb ? "bg-[#EEF6FF] text-[#0076BC] border-[#C2DFF4]" : "bg-[#E6EBF5] text-[#00205B] border-[#B0BDD9]"}`}
      style={{ fontWeight: 600 }}>{type}</span>
  );
}

// ── SortHeader helper ──
function SortHeader({ field, current, dir, onSort, children }: {
  field: SortField; current: SortField; dir: SortDirection; onSort: (f: SortField) => void; children: React.ReactNode;
}) {
  return (
    <button onClick={() => onSort(field)}
      className="flex items-center gap-1 text-[10px] text-[#6B81A0] uppercase tracking-wider hover:text-[#0D1B2E] whitespace-nowrap"
      style={{ fontWeight: 700 }}>
      {children}
      <ArrowUpDown className={`w-3 h-3 ${current === field ? "text-[#0076BC]" : ""}`} />
    </button>
  );
}

// ── Compact card for sidebar mode ──
function CompactSubmissionCard({ sub, isSelected, onClick }: {
  sub: Submission; isSelected: boolean; onClick: () => void;
}) {
  const cfg = PROCESSING_STATUS_CONFIG[sub.processingStatus];
  const days = urgencyDays(sub.needByDate);
  const urgColor = days <= 3 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-[#94A3B8]";
  const urgLabel = days === 0 ? "Due today" : `${days}d`;
  const bindColor = sub.brokerBoundRate >= 75 ? "#22C55E" : sub.brokerBoundRate >= 60 ? "#0076BC" : "#F59E0B";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-[#EEF2FF] transition-colors ${
        isSelected ? "bg-[#EEF6FF] border-l-2 border-l-[#0076BC]" : "hover:bg-[#F8FBFF]"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {/* Bind Rate ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
          <div className="w-9 h-9 relative">
            <svg width="36" height="36" className="-rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E0E8FF" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={bindColor} strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - sub.brokerBoundRate / 100)}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px]" style={{ fontWeight: 700, color: bindColor }}>{sub.brokerBoundRate}</span>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "#C0CEDC" }}>Bind Rate</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[#0D1B2E] truncate leading-snug mb-0.5" style={{ fontWeight: 600 }}>{sub.account}</div>
          <div className="text-[10px] text-[#94A3B8] mb-1.5">{sub.id} · {sub.submissionType}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] ${cfg.bg} ${cfg.color} ${cfg.border}`} style={{ fontWeight: 600 }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main export ──
export function CustomerTable({
  onSubmissionSelect, selectedId, filterType = "all",
  hideControls, externalSearch, externalBroker, externalStatus, externalUwView, externalAccount,
  externalStageStatuses, externalSubItemKey,
}: CustomerTableProps = {}) {
  const [sortField, setSortField] = useState<SortField>("inceptionDate");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [search, setSearch] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [view, setView] = useState<"all" | "mine">("all");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const perPage = 10;

  const searchVal  = hideControls ? (externalSearch  ?? "") : search;
  const brokerVal  = hideControls ? (externalBroker  ?? "all") : brokerFilter;
  const statusVal  = hideControls ? (externalStatus  ?? "all") : statusFilter;
  const accountVal = hideControls ? (externalAccount ?? "all") : accountFilter;
  const viewVal    = hideControls ? (externalUwView  ?? "all") : view;

  const handleReassign = (id: string, uw: string) => setAssignments(p => ({ ...p, [id]: uw }));
  const getUW = (s: Submission) => assignments[s.id] ?? s.assignedUW;

  const isReady = (s: Submission) => s.dataStatus === "Ready";

  let rows = submissions.filter(s => {
    if (filterType === "new-business") return isReady(s) && (s.submissionType === "New Business" || s.submissionType === "Remarket");
    if (filterType === "renewals") return isReady(s) && s.submissionType === "Renewal";
    return true;
  });

  if (searchVal) rows = rows.filter(s =>
    s.account.toLowerCase().includes(searchVal.toLowerCase()) ||
    s.id.toLowerCase().includes(searchVal.toLowerCase()) ||
    s.broker.toLowerCase().includes(searchVal.toLowerCase())
  );
  if (accountVal !== "all") rows = rows.filter(s => s.account === accountVal);
  if (brokerVal !== "all") rows = rows.filter(s => s.broker === brokerVal);
  if (statusVal !== "all") rows = rows.filter(s => s.processingStatus === statusVal);
  if (viewVal === "mine") rows = rows.filter(s => getUW(s) === CURRENT_USER);
  if (hideControls && externalStageStatuses?.length) rows = rows.filter(s => externalStageStatuses!.includes(s.processingStatus));
  if (hideControls && externalSubItemKey && TABLE_SUBITEM_PREDS[externalSubItemKey]) rows = rows.filter(TABLE_SUBITEM_PREDS[externalSubItemKey]);

  const isDateField = sortField === "receivedDate" || sortField === "inceptionDate" || sortField === "needByDate";

  const sorted = [...rows].sort((a, b) => {
    // Interactive (fully rendered) rows always sort above non-interactive grayed rows
    const aInteractive = INTERACTIVE_ACCOUNTS.has(a.account) ? 0 : 1;
    const bInteractive = INTERACTIVE_ACCOUNTS.has(b.account) ? 0 : 1;
    if (aInteractive !== bInteractive) return aInteractive - bInteractive;

    let av: any;
    let bv: any;
    if (sortField === "paidClaims5yr") {
      av = parseClaims(a.paidClaims5yr); bv = parseClaims(b.paidClaims5yr);
    } else if (sortField === "processingStatus") {
      av = STATUS_ORDER[a.processingStatus] ?? 0; bv = STATUS_ORDER[b.processingStatus] ?? 0;
    } else if (sortField === "dataStatus") {
      av = DATA_STATUS_ORDER[a.dataStatus] ?? 0; bv = DATA_STATUS_ORDER[b.dataStatus] ?? 0;
    } else if (sortField === "occupancyInScopePct") {
      av = a.occupancyAppetite.find(x => x.bucket === "In Scope")?.pct ?? 0;
      bv = b.occupancyAppetite.find(x => x.bucket === "In Scope")?.pct ?? 0;
    } else {
      av = a[sortField as keyof Submission];
      bv = b[sortField as keyof Submission];
      if (isDateField) {
        av = av ? new Date(av as string).getTime() : 0;
        bv = bv ? new Date(bv as string).getTime() : 0;
      }
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
    setPage(1);
  };

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  const uniqueBrokers = Array.from(new Set(submissions.map(s => s.broker)));
  const uniqueAccounts = Array.from(new Set(submissions.map(s => s.account))).sort();
  const isCompressed = !!selectedId;

  // Compact card list for sidebar mode
  if (isCompressed) {
    return (
      <CustomerGrid
        sorted={sorted}
        search={search}
        onSearchChange={setSearch}
        selectedId={selectedId}
        onSubmissionSelect={onSubmissionSelect}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Controls — hidden when parent drives filters */}
      {!hideControls && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search accounts, IDs, brokers…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#E0E8FF] rounded-xl text-[12px] w-96 focus:outline-none focus:ring-2 focus:ring-[#0076BC] bg-white placeholder:text-[#C0CEDC]"
          />
          <select value={accountFilter} onChange={e => { setAccountFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-[#E0E8FF] rounded-xl text-[12px] text-[#4A6080]">
            <option value="all">All Accounts</option>
            {uniqueAccounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={brokerFilter} onChange={e => { setBrokerFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-[#E0E8FF] rounded-xl text-[12px] text-[#4A6080]">
            <option value="all">All Brokers</option>
            {uniqueBrokers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-[#E0E8FF] rounded-xl text-[12px] text-[#4A6080]">
            <option value="all">All Statuses</option>
            {Object.entries(PROCESSING_STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <div className="ml-auto inline-flex rounded-xl border border-[#E0E8FF] bg-white p-0.5">
            <button onClick={() => { setView("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === "all" ? "bg-[#00205B] text-white" : "text-[#4A6080] hover:bg-[#F8FBFF]"}`}
              style={{ fontWeight: 600 }}>
              All UWs ({submissions.length})
            </button>
            <button onClick={() => { setView("mine"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === "mine" ? "bg-[#00205B] text-white" : "text-[#4A6080] hover:bg-[#F8FBFF]"}`}
              style={{ fontWeight: 600 }}>
              Mine ({submissions.filter(s => getUW(s) === CURRENT_USER).length})
            </button>
          </div>
        </div>
      )}

      {/* Empty state — hide table entirely when no results */}
      {sorted.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E0E8FF] flex flex-col items-center justify-center py-20 gap-4" style={{ boxShadow: "0 2px 8px rgba(0,32,91,0.05)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
            <SlidersHorizontal className="w-6 h-6" style={{ color: "#0076BC" }} />
          </div>
          <div className="text-center max-w-xs">
            <div className="text-[15px] font-semibold mb-1.5" style={{ color: "#0D1B2E" }}>No submissions found</div>
            <div className="text-[13px] leading-relaxed" style={{ color: "#6B81A0" }}>
              No submissions match your current filters. Try switching to <strong>All UWs</strong>, clearing the search, or adjusting the status or broker filters.
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {sorted.length > 0 && (
      <div className="bg-white rounded-xl border border-[#E0E8FF] overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,32,91,0.05), 0 1px 2px rgba(0,32,91,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: "1820px" }}>
            <thead className="bg-[#F8FBFF] border-b border-[#E0E8FF]">
              <tr>
                <th className="px-4 py-3">
                  <SortHeader field="account" current={sortField} dir={sortDir} onSort={handleSort}>Account</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="processingStatus" current={sortField} dir={sortDir} onSort={handleSort}>Workflow Status</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="dataStatus" current={sortField} dir={sortDir} onSort={handleSort}>Data Status</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="broker" current={sortField} dir={sortDir} onSort={handleSort}>Brokerage</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="brokerContact" current={sortField} dir={sortDir} onSort={handleSort}>Broker</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="inceptionDate" current={sortField} dir={sortDir} onSort={handleSort}>Inception Date</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="receivedDate" current={sortField} dir={sortDir} onSort={handleSort}>Received Date</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="accountIndustry" current={sortField} dir={sortDir} onSort={handleSort}>Occupancy</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="totalTIVm" current={sortField} dir={sortDir} onSort={handleSort}>TIV</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="occupancyInScopePct" current={sortField} dir={sortDir} onSort={handleSort}>Occupancy % TIV</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="paidClaims5yr" current={sortField} dir={sortDir} onSort={handleSort}>5-Yr Paid Claims</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="sprinkleredPct" current={sortField} dir={sortDir} onSort={handleSort}>Sprinkler</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="assignedUW" current={sortField} dir={sortDir} onSort={handleSort}>Assigned UW</SortHeader>
                </th>
                <th className="px-4 py-3">
                  <SortHeader field="clearance" current={sortField} dir={sortDir} onSort={handleSort}>Clearance</SortHeader>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2FF]">
              {paged.map(sub => {
                const uw = getUW(sub);
                const isClickable = INTERACTIVE_ACCOUNTS.has(sub.account);

                if (!isClickable) {
                  return (
                    <tr key={sub.id} className="bg-[#F8FAFB] cursor-not-allowed">
                      {/* Account — name, location, type; no submission ID */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5 items-start">
                          <div className="text-[12px] text-[#9BA8B8] leading-snug" style={{ fontWeight: 600 }}>{sub.account}</div>
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#B8C4D0" }}>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {sub.homeOffice}
                          </div>
                        </div>
                      </td>
                      {/* Workflow Status — blank */}
                      <td />
                      {/* Data Status */}
                      <td className="px-4 py-3 align-middle">
                        <DataStatusBadge status={sub.dataStatus} />
                      </td>
                      {/* All remaining columns — blank */}
                      <td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td />
                    </tr>
                  );
                }

                return (
                  <tr
                    key={sub.id}
                    onClick={() => onSubmissionSelect?.(sub.id)}
                    className="transition-colors hover:bg-[#F2F8FE] cursor-pointer"
                  >
                    {/* Account */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 min-w-[160px]">
                        <div className="text-[12px] text-[#0D1B2E] leading-snug" style={{ fontWeight: 600 }}>{sub.account}</div>
                        <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {sub.homeOffice}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <SubTypeBadge type={sub.submissionType} />
                          <span className="text-[10px] text-[#0076BC]" style={{ fontWeight: 600 }}>{sub.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Workflow Status */}
                    <td className="px-4 py-3 align-top">
                      <ProcessingStatusBadge status={sub.processingStatus} />
                    </td>

                    {/* Data Status */}
                    <td className="px-4 py-3 align-top">
                      <DataStatusBadge status={sub.dataStatus} />
                    </td>

                    {/* Brokerage */}
                    <td className="px-4 py-3 align-top">
                      <BrokerageCell name={sub.broker} boundRate={sub.brokerBoundRate} />
                    </td>

                    {/* Broker */}
                    <td className="px-4 py-3 align-top">
                      <BrokerContactCell contact={sub.brokerContact} />
                    </td>

                    {/* Inception Date */}
                    <td className="px-4 py-3 align-top">
                      <DateCell date={sub.inceptionDate} />
                    </td>

                    {/* Received Date */}
                    <td className="px-4 py-3 align-top">
                      <DateCell date={sub.receivedDate} />
                    </td>

                    {/* Occupancy — top 3 from SOV */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {sub.occupancyByTIV.slice(0, 3).map(slice => (
                          <div key={slice.name} className="flex items-center justify-between gap-2 min-w-[120px]">
                            <span className="text-[11px] truncate" style={{ color: "#1E3A5F", fontWeight: 500 }}>{slice.name}</span>
                            <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "#94A3B8" }}>{slice.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* TIV */}
                    <td className="px-4 py-3 align-top">
                      <div className="text-[13px] font-bold tabular-nums" style={{ color: "#00205B" }}>
                        {fmtTIV(sub.totalTIVm)}
                      </div>
                    </td>

                    {/* Occupancy % TIV */}
                    <td className="px-4 py-3 align-top">
                      <AppetiteBucketBar slices={sub.occupancyAppetite} />
                    </td>

                    {/* 5-Yr Paid Claims */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[9px] uppercase tracking-wide" style={{ color: "#94A3B8", fontWeight: 700 }}>5-Year History</div>
                        <div className="text-[15px] font-extrabold tabular-nums" style={{ color: "#00205B" }}>{sub.paidClaims5yr}</div>
                        <div className="text-[9px]" style={{ color: "#94A3B8" }}>total paid claims</div>
                      </div>
                    </td>

                    {/* TIV / Construction */}
                    <td className="px-4 py-3 align-top">
                      <HazardCell grade={sub.hazardGrade} constClass={sub.topConstructionClass} constPct={sub.constructionClassPct} totalTIVm={sub.totalTIVm} sprinkleredPct={sub.sprinkleredPct} />
                    </td>

                    {/* Assigned UW */}
                    <td className="px-4 py-3 align-top">
                      <UWAssignmentCell
                        submission={{ ...sub, assignedUW: uw }}
                        isMine={uw === CURRENT_USER}
                        onReassign={handleReassign}
                      />
                    </td>

                    {/* Clearance */}
                    <td className="px-4 py-3 align-top">
                      <ClearanceBadge status={sub.clearance} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pagination — count left, buttons centered, above legend */}
      {sorted.length > 0 && (
      <div className={`mt-4 ${totalPages > 1 ? "grid grid-cols-3 items-center" : ""}`}>
        <span className="text-[12px]" style={{ color: "#94A3B8" }}>
          Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of {sorted.length} submissions
        </span>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E8FF] bg-white text-[12px] font-semibold hover:bg-[#F0F4FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "#94A3B8" }}
            >&#8249;</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-colors"
                style={p === page
                  ? { backgroundColor: "#00205B", color: "white" }
                  : { backgroundColor: "white", color: "#94A3B8", border: "1px solid #E0E8FF" }}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E8FF] bg-white text-[12px] font-semibold hover:bg-[#F0F4FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "#94A3B8" }}
            >&#8250;</button>
          </div>
        )}
      </div>
      )}

      {/* Legend */}
      <div className="mt-4 p-4 bg-white rounded-xl border border-[#E0E8FF]" style={{ boxShadow: "0 2px 8px rgba(0,32,91,0.04)" }}>
        <div className="text-[10px] uppercase tracking-wider text-[#00205B] mb-3" style={{ fontWeight: 800, letterSpacing: "0.08em" }}>
          Workflow Status Pipeline
        </div>
        <div className="grid grid-cols-3 gap-6 items-start">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-2" style={{ fontWeight: 700 }}>Prep Stages</div>
            <div className="flex flex-wrap gap-1.5">
              {(["not-processed","follow-up-required","ready-for-ops"] as ProcessingStatus[]).map(s => (
                <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${PROCESSING_STATUS_CONFIG[s].bg} ${PROCESSING_STATUS_CONFIG[s].color} ${PROCESSING_STATUS_CONFIG[s].border}`} style={{ fontWeight: 600 }}>
                  {PROCESSING_STATUS_CONFIG[s].label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-2" style={{ fontWeight: 700 }}>UW Stages</div>
            <div className="flex flex-wrap gap-1.5">
              {(["ready-for-uw","uw-analysis","uw-review","customer-decision"] as ProcessingStatus[]).map(s => (
                <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${PROCESSING_STATUS_CONFIG[s].bg} ${PROCESSING_STATUS_CONFIG[s].color} ${PROCESSING_STATUS_CONFIG[s].border}`} style={{ fontWeight: 600 }}>
                  {PROCESSING_STATUS_CONFIG[s].label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-2" style={{ fontWeight: 700 }}>Data Status</div>
            <div className="flex flex-wrap gap-1.5">
              {(["Received","Processing","Ready"] as DataStatus[]).map(s => (
                <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${DATA_STATUS_CFG[s].bg} ${DATA_STATUS_CFG[s].color} ${DATA_STATUS_CFG[s].border}`} style={{ fontWeight: 600 }}>
                  {DATA_STATUS_CFG[s].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

