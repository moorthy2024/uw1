"use client";
import { useRouter } from "next/navigation";
import { Mail, ChevronRight } from "lucide-react";

const TILE = "bg-white rounded-2xl border border-[#E8EDF5] flex flex-col transition-all";
const TILE_SHADOW = { boxShadow: "0 1px 4px rgba(0,32,91,0.05), 0 4px 12px rgba(0,32,91,0.03)" } as const;

type EmailCategory = "new-business" | "renewal" | "follow-up" | "internal" | "broker-response" | "unclassified";
type ActionClass = "new-request" | "update-external" | "update-internal" | "not-relevant";

const ACTION_CLASS_CFG: Record<ActionClass, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "new-request":     { label: "New Request",    color: "#0076BC", bg: "#EEF6FF", border: "#C2DFF4", dot: "#0076BC" },
  "update-external": { label: "Update External", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", dot: "#0F766E" },
  "update-internal": { label: "Update Internal", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", dot: "#0891B2" },
  "not-relevant":    { label: "Not Relevant",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF" },
};

function defaultActionClass(emailCategory: EmailCategory): ActionClass {
  switch (emailCategory) {
    case "new-business":
    case "renewal":         return "new-request";
    case "follow-up":
    case "broker-response": return "update-external";
    case "internal":        return "update-internal";
    default:                return "not-relevant";
  }
}

const AVATAR_PALETTES = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#EDE9FE", color: "#5B21B6" },
  { bg: "#FCE7F3", color: "#9D174D" },
  { bg: "#E0F2FE", color: "#0369A1" },
];

function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

function senderInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface InboxEmail {
  id: string;
  from: string;
  subject: string;
  time: string;
  unread?: boolean;
  emailCategory: EmailCategory;
}

const inboxEmails: InboxEmail[] = [
  { id: "gm-1", from: "Sarah Mitchell",   subject: "Westfield Manufacturing — updated SOV + engineering report", time: "14m ago", unread: true,  emailCategory: "broker-response" },
  { id: "gm-2", from: "distribution@qbe.com", subject: "New submission — Atlantic Distribution renewal",           time: "1h ago",  unread: true,  emailCategory: "renewal" },
  { id: "pm-2", from: "Michael Torres",   subject: "Atlantic Distribution — loss run clarification",               time: "01 Apr",  unread: true,  emailCategory: "follow-up" },
  { id: "gm-3", from: "David Park",       subject: "Re: Pacific Coast Hotels — NWS deductible question",           time: "24 Mar",  unread: false, emailCategory: "unclassified" },
];

export function TileInbox() {
  const router = useRouter();
  const unreadCount = inboxEmails.filter(e => e.unread).length;
  const topUnread = inboxEmails.filter(e => e.unread).slice(0, 3);

  return (
    <div className={TILE} style={TILE_SHADOW}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>
          <Mail style={{ width: 10, height: 10, color: "white" }} />
        </div>
        <span className="text-[12px] font-extrabold tracking-tight" style={{ color: "#0D1B2E" }}>Inbox</span>
        {unreadCount > 0 && (
          <span className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00205B, #0076BC)" }}>{unreadCount}</span>
        )}
      </div>
      <div className="px-3 pb-2.5 flex flex-col flex-1">
        {topUnread.map((email, idx) => {
          const pal = avatarPalette(email.from);
          const ac = defaultActionClass(email.emailCategory);
          const acCfg = ACTION_CLASS_CFG[ac];
          return (
            <div key={email.id}
              className={`flex items-start gap-1.5 py-1.5 cursor-pointer rounded hover:bg-[#F4F6FF] transition-colors ${idx < topUnread.length - 1 ? "border-b border-[#F4F6FF]" : ""}`}
              onClick={() => { sessionStorage.setItem("inboxEmailId", email.id); router.push("/inbox"); }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
                style={{ backgroundColor: pal.bg, color: pal.color }}>
                {senderInitials(email.from)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-bold truncate flex-1 min-w-0" style={{ color: "#0D1B2E" }}>{email.from}</span>
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold px-1 py-0.5 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: acCfg.bg, color: acCfg.color, borderColor: acCfg.border }}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: acCfg.dot }} />
                    {acCfg.label}
                  </span>
                  <span className="text-[8px] flex-shrink-0" style={{ color: "#94A3B8" }}>{email.time}</span>
                </div>
                <div className="text-[10px] truncate" style={{ color: "#0076BC", fontWeight: 600 }}>
                  {email.subject}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-[#F0F4FF] cursor-pointer hover:bg-[#F8FBFF] rounded-b-2xl transition-colors"
        onClick={() => router.push("/inbox")}>
        <span className="text-[10px] font-semibold" style={{ color: "#0076BC" }}>Go to Inbox</span>
        <ChevronRight style={{ width: 12, height: 12, color: "#0076BC" }} />
      </div>
    </div>
  );
}
