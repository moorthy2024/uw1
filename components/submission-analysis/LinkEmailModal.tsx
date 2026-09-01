"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, X, Search, Inbox, CheckCircle2, Check } from "lucide-react";
import { toast } from "sonner";
import { MOCK_INBOX_EMAILS, TAG_STYLE } from "./mock-data";
import { useSubmissionCtx } from "./SubmissionContext";

export function LinkEmailModal({ submissionId, onClose }: { submissionId: string; onClose: () => void }) {
  const { meta } = useSubmissionCtx();
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
