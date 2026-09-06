"use client";
import { useRouter } from "next/navigation";
import { Building2, MapPin, BarChart3, Briefcase, X } from "lucide-react";
import { WORKFLOW_STEPS } from "../SubmissionHelpers";
import { useSubmissionCtx } from "./SubmissionContext";

/* ── AccountSummaryBar ── */

export function AccountSummaryBar({ onClose }: { onClose?: () => void }) {
  const { meta, idx } = useSubmissionCtx();
  const router = useRouter();
  const facts = [
    { label: "Policy Start", value: meta.inceptionDate,                       Icon: MapPin    },
    { label: "TIV",          value: meta.tivFull,                              Icon: BarChart3 },
    { label: "Broker",       value: meta.brokerageHouse === "[Static Data]" ? meta.broker : `${meta.broker}, ${meta.brokerageHouse}`, Icon: Briefcase },
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
            {value === "[Static Data]"
              ? <div className="text-[11px] whitespace-nowrap italic" style={{ color: "#9CA3AF" }}>[Static Data]</div>
              : <div className="text-[11px] whitespace-nowrap" style={{ fontWeight: 600, color: "#0D1B2E" }}>{value}</div>
            }
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

/* ── StepperNav ── */

export function StepperNav({ active, onChange, reachedStep }: {
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
