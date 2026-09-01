"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import {
  LayoutGrid, FileText, UserCircle,
  Sparkles, ArrowUp, X,
  MessageSquareDot, Minus, Maximize2, Minimize2, BookOpen,
  PanelLeftClose, Pin, Bot,
} from "lucide-react";
import { RoleSelection } from "./RoleSelection";
import { RoleContext } from "./RoleContext";
import { motion, AnimatePresence } from "motion/react";
const qbeLogo = "/assets/qbe-logo.png";

// Context so child pages can signal Root that a detail panel is open
export const DetailOpenCtx = createContext<(open: boolean) => void>(() => {});
export function useDetailOpen(open: boolean) {
  const set = useContext(DetailOpenCtx);
  useEffect(() => { set(open); return () => set(false); }, [open, set]);
}
export function useDetailOpenSetter() {
  return useContext(DetailOpenCtx);
}

const navigation = [
  { name: "Underwriting HUB", path: "/", icon: LayoutGrid, activePaths: ["/", "/inbox", "/actions", "/hub-portfolio"] },
  { name: "Customer", path: "/customer", icon: FileText, activePaths: ["/customer", "/submission"] },
  { name: "Performance", path: "/performance", icon: UserCircle, activePaths: ["/performance"] },
  { name: "Guidelines", path: "/guidelines", icon: BookOpen, activePaths: ["/guidelines"] },
];

const recentThreads = [
  { id: "t1", title: "Westfield Manufacturing", sub: "SUB-2026-0847", time: "2m" },
  { id: "t2", title: "Atlantic Distribution", sub: "SUB-2026-0845", time: "14m" },
  { id: "t3", title: "TechCorp Renewal", sub: "SUB-2026-0850", time: "1h" },
];

type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

const chatConversations: Record<string, ChatMsg[]> = {
  t1: [
    { id: "u1", role: "user", content: "Summarize the Westfield Manufacturing submission." },
    { id: "a1", role: "assistant", content: "Westfield Manufacturing (SUB-2026-0847) is a New Business Commercial Property submission. $285M TIV across 8 locations in OH, IN, and FL. Currently in UW Analysis with AI priority score 94/100.\n\nKey highlights:\n• Hazard score 74/100 — driven by Frame construction (58% TIV) and Tampa FL location\n• 5-yr loss ratio 0.21 — favorable, no losses over $250K\n• SOV is 82% complete — 2 locations missing protection class codes\n• Risk Engineering Report received but FL (Tampa) survey outstanding\n\nRecommendation: Focus COPE review before CAT modelling." },
  ],
  t2: [
    { id: "u1", role: "user", content: "What's missing from Atlantic Distribution?" },
    { id: "a1", role: "assistant", content: "Atlantic Distribution (SUB-2026-0845) has three outstanding items blocking triage completion:\n\n1. **Clearance** — Salesforce clearance still in progress. Cannot finalize until complete.\n2. **Risk Engineering Report** — No report on file. Required for protection code verification across all 12 locations, particularly the 2 sites with unconfirmed ESFR sprinkler status.\n3. **Loss Verification** — 5-yr loss runs submitted but not independently verified.\n\nRecommend: Follow up with Jennifer Blake (WTW) for RE report, expedite clearance." },
  ],
};


const CHAT_DEFAULT_HEIGHT = 520;
const CHAT_MAX_HEIGHT = 760;
const CHAT_WIDTH = 520;

export function RootLayout({ children }: { children: React.ReactNode }) {
  // Landing page hidden — initialize as logged in; restore by setting useState(false)
  const [loggedIn, setLoggedIn] = useState(true);
  if (!loggedIn) return <RoleSelection onSelectRole={() => setLoggedIn(true)} />;
  return <MainWorkbench>{children}</MainWorkbench>;
}

function MainWorkbench({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);
  const [chatHeight, setChatHeight] = useState(CHAT_DEFAULT_HEIGHT);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatThreadActive, setChatThreadActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(CHAT_DEFAULT_HEIGHT);
  const isResizing = useRef(false);

  // Draggable bot button — starts at bottom-right via CSS, switches to left/top after first drag
  const [botDragged, setBotDragged] = useState(false);
  const botPosRef = useRef({ x: 0, y: 0 });
  const [botPos, setBotPos] = useState({ x: 0, y: 0 });
  const botDragOffset = useRef({ x: 0, y: 0 });
  const botIsDragging = useRef(false);
  const botMoved = useRef(false);

  const handleBotMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Capture current rendered position before first drag
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    botPosRef.current = { x: rect.left, y: rect.top };
    botIsDragging.current = true;
    botMoved.current = false;
    botDragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const onMove = (ev: MouseEvent) => {
      if (!botIsDragging.current) return;
      botMoved.current = true;
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - 52, ev.clientX - botDragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 52, ev.clientY - botDragOffset.current.y)),
      };
      botPosRef.current = newPos;
      setBotDragged(true);
      setBotPos({ ...newPos });
    };
    const onUp = () => {
      botIsDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  const handleBotClick = useCallback(() => {
    if (botMoved.current) return;
    setChatOpen(prev => {
      if (prev) {
        setChatMinimized(false);
        return false;
      }
      setChatMinimized(false);
      setChatThreadActive(true);
      setChatMessages([]);
      setTimeout(() => inputRef.current?.focus(), 260);
      return true;
    });
  }, []);

  const isSubmissionDetail = detailOpen;

  useEffect(() => {
    if (isSubmissionDetail) {
      setSidebarExpanded(false);
      setSidebarHover(false);
    } else {
      setSidebarExpanded(true);
    }
  }, [isSubmissionDetail]);

  const compact = (!sidebarExpanded && !sidebarHover) || (isSubmissionDetail && !sidebarHover);
  const sidebarW = compact ? 56 : 240;

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setChatMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setChatOpen(true);
    setChatMinimized(false);
    setInputValue("");
    setIsThinking(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: "assistant",
        content: "Here is what I found relevant to your question. I have kept your current view alongside this response so you can keep working — feel free to ask a follow-up.",
      }]);
      setIsThinking(false);
    }, 1200);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStartY.current = e.clientY;
    resizeStartH.current = chatHeight;
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = resizeStartY.current - ev.clientY;
      setChatHeight(Math.max(280, Math.min(CHAT_MAX_HEIGHT, resizeStartH.current + delta)));
    };
    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  const openThread = (t: typeof recentThreads[0]) => {
    setChatOpen(true);
    setChatMinimized(false);
    setChatThreadActive(true);
    setChatMessages(chatConversations[t.id] ?? []);
  };

  const startNewThread = () => {
    setChatOpen(true);
    setChatMinimized(false);
    setChatThreadActive(true);
    setChatMessages([]);
    setTimeout(() => inputRef.current?.focus(), 260);
  };

  return (
    <div className="flex h-screen relative" style={{ background: "#F9FAFB" }}>
      <Toaster position="bottom-right" richColors />

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className="h-full flex flex-col overflow-hidden flex-shrink-0 relative z-20"
        style={{ backgroundColor: "#0D1B2E", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Top bar */}
        <div
          className={`h-14 flex items-center flex-shrink-0 ${compact ? "justify-center px-2" : "px-4 gap-2.5"}`}
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {compact ? (
            /* Collapsed: QBE logo as the expand affordance */
            <button
              onClick={() => { setSidebarExpanded(true); setSidebarHover(false); }}
              title="Expand sidebar"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.16)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"; }}
            >
              <Image src={qbeLogo} alt="QBE" width={20} height={20} className="w-5 h-5 object-contain" />
            </button>
          ) : (
            <>
              <Image src={qbeLogo} alt="QBE" width={28} height={28} className="w-7 h-7 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.92)" }}>QBE UW</div>
                <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Commercial Property</div>
              </div>
              {/* Pinned → collapse button; hovering in non-detail → pin button; detail view hover → nothing */}
              {sidebarExpanded ? (
                <button
                  onClick={() => { setSidebarExpanded(false); setSidebarHover(false); }}
                  title="Collapse sidebar"
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              ) : !isSubmissionDetail ? (
                <button
                  onClick={() => { setSidebarExpanded(true); setSidebarHover(false); }}
                  title="Pin sidebar open"
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* Nav */}
        <div className={`flex-shrink-0 pt-3 pb-2 ${compact ? "px-1.5" : "px-3"}`}>
          {!compact && (
            <div className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Workbench</div>
          )}
          <nav className="space-y-0.5">
            {navigation.map(item => {
              const isActive = item.activePaths
                ? item.activePaths.some(p => p === "/" ? pathname === "/" : pathname.startsWith(p))
                : pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    if (compact) { setSidebarExpanded(true); setSidebarHover(false); }
                    if (pathname === item.path || pathname.startsWith(item.path + "/")) {
                      e.preventDefault();
                      if (detailOpen) {
                        window.dispatchEvent(new CustomEvent("closeDetailView"));
                      } else {
                        router.push(item.path);
                      }
                    }
                  }}
                  title={compact ? item.name : undefined}
                  className={`flex items-center rounded-xl transition-all text-sm ${
                    compact ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 px-2.5 py-2"
                  }`}
                  style={isActive
                    ? { backgroundColor: "#0076BC", color: "#FFFFFF" }
                    : { color: "rgba(255,255,255,0.52)" }
                  }
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!compact && (
                    <span className="flex-1 truncate text-[13px]" style={{ fontWeight: isActive ? 600 : 450 }}>{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Recent threads hidden — enabled in next release */}
        <div className="flex-1" />


        {/* User footer */}
        <div className={`flex-shrink-0 ${compact ? "py-3 flex flex-col items-center gap-2" : "px-3 py-3"}`} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {compact ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }} title="Mike Farrell">
              MF
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #0076BC, #00205B)" }}>
                MF
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>Mike Farrell</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>Underwriter</div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar — hidden on submission detail and pages with their own HubPageHeader */}
        {!isSubmissionDetail && pathname !== "/inbox" && pathname !== "/actions" && pathname !== "/hub-portfolio" && (
          <div className="h-11 flex items-center px-5 flex-shrink-0 bg-white" style={{ borderBottom: "1px solid #E0E8FF" }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-semibold truncate" style={{ color: "#00205B" }}>
                {navigation.find(n => n.path === pathname)?.name ??
                  (pathname.startsWith("/submission") ? "Submissions" : "")}
              </span>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto relative isolate" style={{ backgroundColor: "#F9FAFB" }}>
          <RoleContext.Provider value="underwriter">
            <DetailOpenCtx.Provider value={setDetailOpen}>
              {children}
            </DetailOpenCtx.Provider>
          </RoleContext.Provider>
        </div>

        {/* AI Assistant floating trigger hidden — enabled in next release */}

        {/* Floating chat panel */}
        <AnimatePresence>
          {chatOpen && !isSubmissionDetail && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed z-50 flex flex-col rounded-2xl border border-[#E8E6E1] bg-white shadow-2xl overflow-hidden"
              style={{
                bottom: 24, right: 32,
                width: chatMaximized ? "min(820px, calc(100vw - 64px))" : CHAT_WIDTH,
                height: chatMinimized ? 52 : (chatMaximized ? "min(760px, calc(100vh - 48px))" : chatHeight),
                transition: "width 0.2s, height 0.2s",
              }}
            >
              {/* Resize handle */}
              {!chatMinimized && !chatMaximized && (
                <div onMouseDown={handleResizeStart} className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 group">
                  <div className="mx-auto mt-0.5 w-8 h-1 rounded-full bg-[#D9D7D2] group-hover:bg-[#0076BC] transition-colors" />
                </div>
              )}

              {/* Chat header */}
              <div className="flex items-center gap-2.5 px-4 flex-shrink-0 bg-white border-b border-[#F2F1EE]" style={{ height: 52 }}>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#1A1A1A]">AI UW Agent</div>
                  {!chatMinimized && <div className="text-[10px] text-[#9B9B98]">QBE NA Commercial Property</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setChatMinimized(m => !m); setChatMaximized(false); }}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setChatMaximized(m => !m); setChatMinimized(false); }}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  >
                    {chatMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setChatOpen(false); setChatMinimized(false); setChatMaximized(false); setChatThreadActive(false); setChatMessages([]); }}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat body */}
              {!chatMinimized && (
                <>
                  <div className="flex-1 overflow-auto px-4 py-4 space-y-3 min-h-0">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        {chatThreadActive ? (
                          <>
                            <div className="text-sm font-bold text-[#1A1A1A] mb-1">How can I help?</div>
                            <div className="text-[12px] text-[#9B9B98] max-w-[240px] mx-auto leading-relaxed">Ask about submissions, risks, pricing, or portfolio insights.</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-[#1A1A1A] mb-1">Select a thread</div>
                            <div className="text-[12px] text-[#9B9B98] max-w-[240px] mx-auto leading-relaxed">Use Recent in the sidebar or start a new thread to begin.</div>
                          </>
                        )}
                      </div>
                    )}
                    {chatMessages.map(m => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[#00205B] text-white rounded-br-sm"
                            : "bg-[#F3F3F1] text-[#2D2D2D] rounded-bl-sm"
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-[#F3F3F1] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2.5" style={{ minWidth: 140 }}>
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold" style={{ color: "#0076BC" }}>Thinking</span>
                              <span className="flex items-end gap-0.5" style={{ paddingBottom: 1 }}>
                                {[0, 180, 360].map(d => (
                                  <span key={d} className="block w-1 h-1 rounded-full bg-[#0076BC] animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: "1.1s" }} />
                                ))}
                              </span>
                            </div>
                            <div className="text-[9px]" style={{ color: "#94A3B8" }}>Analysing submission data</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-[#F2F1EE] bg-[#FAFAF9]">
                    <div className={`relative bg-white rounded-xl border transition-all ${
                      chatThreadActive
                        ? "border-[#E8E6E1] hover:border-[#C0BFBB] focus-within:border-[#0076BC] focus-within:shadow-sm"
                        : "border-[#F2F1EE] opacity-60 cursor-not-allowed"
                    }`}>
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={chatThreadActive ? "Ask the AI UW Agent anything…" : "Select a thread to start…"}
                        disabled={!chatThreadActive}
                        rows={1}
                        className="w-full resize-none px-3 pt-3 pb-2 bg-transparent text-[13px] text-[#2D2D2D] placeholder:text-[#C0BFBB] focus:outline-none disabled:cursor-not-allowed"
                        style={{ minHeight: "40px", maxHeight: "100px" }}
                      />
                      <div className="flex items-center justify-between px-2 pb-2">
                        <div className="flex items-center gap-1" />
                        <button
                          onClick={handleSend}
                          disabled={!chatThreadActive || !inputValue.trim()}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                            chatThreadActive && inputValue.trim()
                              ? "bg-[#00205B] text-white hover:bg-[#001740]"
                              : "bg-[#F2F1EE] text-[#C0BFBB] cursor-not-allowed"
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-1.5">
                      <span className="text-[9px] text-[#C0BFBB]">AI may produce inaccurate information. Verify critical UW decisions.</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Floating draggable AI bot button — hidden when chat is open or in
          submission detail (docked AI UW Agent pane replaces it there) */}
      {!chatOpen && !isSubmissionDetail && (
        <div
          className="fixed z-[60] select-none"
          style={botDragged
            ? { left: botPos.x, top: botPos.y, cursor: "grab" }
            : { right: 24, bottom: 24, cursor: "grab" }
          }
          onMouseDown={handleBotMouseDown}
          onClick={handleBotClick}
          title="AI Assistant — drag to move"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0076BC 0%, #00205B 100%)",
              boxShadow: "0 4px 20px rgba(0, 118, 188, 0.45), 0 1px 4px rgba(0,0,0,0.18)",
            }}
          >
            <Bot className="w-5 h-5 text-white pointer-events-none" />
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: "#22C55E" }}
          />
        </div>
      )}
    </div>
  );
}

