"use client";
import { useState } from "react";
import { CheckCircle2, Clock, Zap, Brain, FileText, TrendingUp } from "lucide-react";

const agents = [
  {
    id: "orchestration",
    name: "Orchestration Agent",
    scope: "Coordinator",
    type: "Coordinator",
    color: "#0076BC",
    inputs: ["Submission intake events", "Agent status signals", "HITL gate responses"],
    actions: [
      "Coordinate the entire workflow",
      "Route submissions",
      "Manage state and hand-offs",
      "Coordinate change scenarios",
    ],
    guidelineRefs: ["Overall Appetite", "HITL Gate Rules"],
    inferredLogic: ["Single authority on what happens next", "Optimal parallelism patterns from throughput data"],
    outputs: ["Workflow state", "Next agent assignment", "UI progress updates"],
    workflowSteps: "1 – 7 (all)",
    consolidates: "R1 Core routing · R2 + Memory · R3 Unified UI",
    techStack: "QBE.ai · Azure AI Foundry · Cosmos DB",
  },
  {
    id: "ingestion",
    name: "Ingestion Agent",
    scope: "CAT Prep & SOV",
    type: "Front-door Agent",
    color: "#1696D2",
    inputs: ["Email", "Broker portals", "ACORD forms", "SOV", "Loss runs", "Supporting documents"],
    actions: [
      "Monitor email / broker portals",
      "Extract ACORD, SOV, loss runs, supporting documents",
      "Normalize SOV",
      "Ping AI geocoding",
      "Format RMS / CatNet payload",
    ],
    guidelineRefs: ["OED Schema Standards", "Capacity by Peril"],
    inferredLogic: ["Field extraction confidence thresholds learned from validation feedback", "Document format patterns from 10k+ processed submissions"],
    outputs: ["Canonical submission context object consumed by all downstream agents"],
    workflowSteps: "1 – 3",
    consolidates: "SOV normalization + CAT prep + RMS / CatNet payload formatting (previously split across multiple sub-agents)",
    techStack: "Ping AI · Outlook · GDrive · Salesforce · Majesco",
  },
  {
    id: "intelligence",
    name: "Intelligence & Reasoning Agent",
    scope: "Risk Analysis",
    type: "Knowledge-Based Reasoning",
    color: "#177E89",
    inputs: ["Submission documents", "Loss history", "COPE data", "Geocoded locations", "In-force book", "Portfolio analytics"],
    actions: [
      "L1–L2 risk score & exposure summary",
      "Portfolio accumulation check",
      "Unified risk synopsis builder",
      "Drive one decision-ready document for UW at the HITL gate",
    ],
    guidelineRefs: ["Occupancy Classification", "Capacity by Peril", "Overall Appetite"],
    inferredLogic: ["Synthesizes deal-level (L1), risk-level (L2), and portfolio-level (L3) views into one decision-ready document"],
    outputs: ["Unified risk synopsis", "Accumulation alerts", "Portfolio strategy view"],
    workflowSteps: "4 – 6",
    consolidates: "Risk Read + Accumulation Super + Portfolio Strategy (previously 3 separate sub-agents)",
    techStack: "QBE.ai · Azure AI Foundry · Cosmos DB · Hyperexponential (R2+)",
  },
  {
    id: "drafting",
    name: "Document Summarization Agent",
    scope: "Pricing Guidance",
    type: "Drafting & Pricing",
    color: "#5F6B7A",
    inputs: ["CAT analysis", "Risk analysis", "Pricing guidance"],
    actions: [
      "Rate guidance",
      "Synthesize CAT + Risk analysis into pricing view",
      "Draft quote documents",
      "Negotiation briefs",
      "Reporting scenarios",
      "Generate binder & policy documents",
      "Downstream finance / reporting / analytics sync",
    ],
    guidelineRefs: ["Pricing & Commission", "Coverage Forms & Endorsements"],
    inferredLogic: ["Communication templates", "Form selection from state compliance database"],
    outputs: ["Quote documents", "Binder", "Policy manuscript", "Downstream system updates"],
    workflowSteps: "5 – 12",
    consolidates: "Pricing & CAT + Broker Drafting + Issuance Utility (previously 3 separate sub-agents)",
    techStack: "Majesco · Salesforce · IGEN · Adobe · Hyperexponential",
  },
];

export function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="flex">
      {/* Main Agent Tiles */}
      <div className="flex-1 p-8">
        <div className="bg-[#EEF6FF] border border-[#C2DFF4] rounded-xl p-4 mb-6">
          <p className="text-[13px]" style={{ color: "#00205B" }}>
            Static view — displays the scope of each agent action for Release 1 across the workflow steps, with the corresponding input and output for the user or workflow.
          </p>
        </div>

        {/* Agent Tiles Grid */}
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent, index) => {
            return (
              <div
                key={agent.id}
                className={`bg-white rounded-xl border transition-all cursor-pointer ${
                  selectedAgent === agent.id
                    ? "border-[#0076BC] border-2 shadow-lg"
                    : "border-[#E5E7EB] hover:border-[#0076BC]"
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                {/* Agent Header */}
                <div className="p-4 border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      ></div>
                      <div className="text-xs font-semibold text-[#4B5563]">AGENT {index + 1} · {agent.type.toUpperCase()}</div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-[#111827]">
                    {agent.name} <span className="text-[#4B5563] font-normal">({agent.scope})</span>
                  </h4>
                </div>

                {/* Agent Details */}
                <div className="p-4 space-y-3">
                  {/* Scope / Actions */}
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#111827] mb-1">
                      <Zap className="w-3 h-3 text-[#0076BC]" />
                      Scope
                    </div>
                    <div className="space-y-1">
                      {agent.actions.slice(0, 3).map((action, idx) => (
                        <div key={idx} className="text-xs text-[#4B5563] pl-4">• {action}</div>
                      ))}
                      {agent.actions.length > 3 && (
                        <div className="text-xs text-[#0076BC] pl-4">+ {agent.actions.length - 3} more</div>
                      )}
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#111827] mb-1">
                      <Clock className="w-3 h-3 text-[#0076BC]" />
                      Workflow steps
                    </div>
                    <div className="text-xs text-[#4B5563] pl-4">{agent.workflowSteps}</div>
                  </div>

                  {/* Consolidates */}
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#111827] mb-1">
                      <Brain className="w-3 h-3 text-[#0076BC]" />
                      Consolidates prior focus
                    </div>
                    <div className="text-xs text-[#4B5563] pl-4">{agent.consolidates}</div>
                  </div>

                  {/* Tech stack */}
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#111827] mb-1">
                      <FileText className="w-3 h-3 text-[#0076BC]" />
                      Tech stack
                    </div>
                    <div className="text-xs text-[#4B5563] pl-4">{agent.techStack}</div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#111827] mb-1">
                      <TrendingUp className="w-3 h-3 text-[#0076BC]" />
                      Outputs
                    </div>
                    <div className="space-y-1">
                      {agent.outputs.slice(0, 2).map((output, idx) => (
                        <div key={idx} className="text-xs text-[#4B5563] pl-4">• {output}</div>
                      ))}
                      {agent.outputs.length > 2 && (
                        <div className="text-xs text-[#0076BC] pl-4">+ {agent.outputs.length - 2} more</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

