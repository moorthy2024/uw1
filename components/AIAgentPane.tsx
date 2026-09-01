"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, ArrowUp, X,
  Minus, Maximize2, Minimize2, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { StepInsight } from "./SubmissionAnalysis";
import type { ActionItem } from "./SubmissionTypes";

type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

interface AIAgentPaneProps {
  insight: StepInsight | null;
  stepActions?: ActionItem[];
}

const CHAT_DEFAULT_HEIGHT = 520;
const CHAT_MAX_HEIGHT = 760;
const CHAT_WIDTH = 520;

export function AIAgentPane({ insight, stepActions = [] }: AIAgentPaneProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);
  const [chatHeight, setChatHeight] = useState(CHAT_DEFAULT_HEIGHT);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgSeq = useRef(0);
  const prevInsightKey = useRef<string | null>(null);
  const isResizing = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(CHAT_DEFAULT_HEIGHT);

  // Draggable bot button
  const [botDragged, setBotDragged] = useState(false);
  const [botPos, setBotPos] = useState({ x: 0, y: 0 });
  const botPosRef = useRef({ x: 0, y: 0 });
  const botDragOffset = useRef({ x: 0, y: 0 });
  const botIsDragging = useRef(false);
  const botMoved = useRef(false);

  // Mark unread badge when insight changes while closed
  useEffect(() => {
    if (!insight) return;
    if (insight.key !== prevInsightKey.current) {
      prevInsightKey.current = insight.key;
      if (!chatOpen) setHasUnread(true);
    }
  }, [insight, chatOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      setTimeout(() => inputRef.current?.focus(), 260);
      setHasUnread(false);
    }
  }, [chatOpen, chatMinimized]);

  // Scroll to latest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const runInsight = useCallback(() => {
    if (!insight) return;
    const uid = `u-${insight.key}-${msgSeq.current++}`;
    const aid = `a-${insight.key}-${msgSeq.current++}`;
    setMessages(prev => [...prev, { id: uid, role: "user", content: insight.prompt }]);
    setIsThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: aid, role: "assistant", content: insight.message }]);
      setIsThinking(false);
    }, 900);
  }, [insight]);

  const handleActionClick = useCallback((action: ActionItem) => {
    action.onClick?.();
    setChatOpen(false);
    setChatMinimized(false);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setInputValue("");
    setIsThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: "assistant",
        content: "Here is what I found relevant to your question. I have kept your current view alongside this response so you can keep working — feel free to ask a follow-up.",
      }]);
      setIsThinking(false);
    }, 1200);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Resize handle drag
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

  // Bot button drag
  const botDownPos = useRef({ x: 0, y: 0 });

  const handleBotMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    botPosRef.current = { x: rect.left, y: rect.top };
    botIsDragging.current = true;
    botMoved.current = false;
    botDownPos.current = { x: e.clientX, y: e.clientY };
    botDragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const onMove = (ev: MouseEvent) => {
      if (!botIsDragging.current) return;
      const dx = ev.clientX - botDownPos.current.x;
      const dy = ev.clientY - botDownPos.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        botMoved.current = true;
      }
      if (!botMoved.current) return;
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
      if (!botMoved.current) {
        setChatOpen(prev => {
          if (prev) { setChatMinimized(false); return false; }
          setChatMinimized(false);
          setTimeout(() => inputRef.current?.focus(), 260);
          return true;
        });
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  const closeChat = () => {
    setChatOpen(false);
    setChatMinimized(false);
    setChatMaximized(false);
    setMessages([]);
  };

  return (
    <>
      {/* ── Floating chat panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="agent-chat"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 flex flex-col rounded-2xl border border-[#E8E6E1] bg-white shadow-2xl overflow-hidden"
            style={{
              bottom: 24,
              right: 32,
              width: chatMaximized ? "min(820px, calc(100vw - 64px))" : CHAT_WIDTH,
              height: chatMinimized
                ? 52
                : chatMaximized
                ? "min(760px, calc(100vh - 48px))"
                : chatHeight,
              transition: "width 0.2s, height 0.2s",
            }}
          >
            {/* Resize handle */}
            {!chatMinimized && !chatMaximized && (
              <div
                onMouseDown={handleResizeStart}
                className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 group"
              >
                <div className="mx-auto mt-0.5 w-8 h-1 rounded-full bg-[#D9D7D2] group-hover:bg-[#0076BC] transition-colors" />
              </div>
            )}

            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 flex-shrink-0 bg-white border-b border-[#F2F1EE]"
              style={{ height: 52 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#1A1A1A]">AI UW Agent</div>
                {!chatMinimized && (
                  <div className="text-[10px] text-[#9B9B98]">QBE NA Commercial Property</div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Minimize */}
                <button
                  onClick={() => { setChatMinimized(m => !m); setChatMaximized(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  title={chatMinimized ? "Restore" : "Minimise"}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                {/* Maximize / restore */}
                <button
                  onClick={() => { setChatMaximized(m => !m); setChatMinimized(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  title={chatMaximized ? "Restore" : "Maximise"}
                >
                  {chatMaximized
                    ? <Minimize2 className="w-3.5 h-3.5" />
                    : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                {/* Close */}
                <button
                  onClick={closeChat}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F1EE] text-[#B0AEA9] transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body — hidden when minimized */}
            {!chatMinimized && (
              <>
                <div className="flex-1 overflow-auto px-4 py-4 space-y-3 min-h-0">
                  {messages.length === 0 && !isThinking && (
                    <div className="text-center py-10">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-sm font-bold text-[#1A1A1A] mb-1">How can I help?</div>
                      <div className="text-[12px] text-[#9B9B98] max-w-[260px] mx-auto leading-relaxed">
                        Use the quick chips below or ask me anything about this submission.
                      </div>
                    </div>
                  )}

                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && (
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#0076BC] to-[#00205B] flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
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

                {/* Compact prompt chips — AI insight + stage actions in one wrapping row */}
                {(insight || stepActions.length > 0) && (
                  <div className="flex-shrink-0 px-3 py-2 bg-[#FAFAF9] border-t border-[#F2F1EE]">
                    <div className="flex flex-wrap gap-1.5">
                      {/* AI insight chip */}
                      {insight && (
                        <button
                          onClick={runInsight}
                          disabled={isThinking}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "#EEF6FF", borderColor: "#C2DFF4", color: "#0076BC" }}
                        >
                          <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
                          {insight.stepLabel} Insights
                        </button>
                      )}
                      {/* Take Action chips */}
                      {stepActions.map((action, i) => {
                        const Icon = action.icon;
                        const isDanger = action.variant === "danger";
                        const isPrimary = action.variant === "primary";
                        return (
                          <button
                            key={i}
                            onClick={() => handleActionClick(action)}
                            disabled={isThinking}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: isDanger ? "#FEF2F2" : isPrimary ? "#F0FDF4" : "#F5F4F1",
                              borderColor: isDanger ? "#FECACA" : isPrimary ? "#BBF7D0" : "#E4E2DE",
                              color: isDanger ? "#B91C1C" : isPrimary ? "#15803D" : "#374151",
                            }}
                          >
                            <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-[#F2F1EE] bg-[#FAFAF9]">
                  <div className="relative bg-white rounded-xl border border-[#E8E6E1] hover:border-[#C0BFBB] focus-within:border-[#0076BC] focus-within:shadow-sm transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask the AI UW Agent anything…"
                      rows={1}
                      className="w-full resize-none px-3 pt-3 pb-2 bg-transparent text-[13px] text-[#2D2D2D] placeholder:text-[#C0BFBB] focus:outline-none"
                      style={{ minHeight: "40px", maxHeight: "100px" }}
                    />
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex items-center gap-1" />
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                          inputValue.trim()
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

      {/* ── Draggable bot trigger button ── */}
      {!chatOpen && (
        <div
          className="fixed z-[60] select-none"
          style={
            botDragged
              ? { left: botPos.x, top: botPos.y, cursor: "grab" }
              : { right: 24, bottom: 24, cursor: "grab" }
          }
          onMouseDown={handleBotMouseDown}
          title="AI UW Agent — drag to move"
        >
          {/* Ping ring */}
          <span
            className="absolute inset-0 rounded-2xl animate-ping opacity-20 pointer-events-none"
            style={{ background: "linear-gradient(135deg, #0076BC, #00205B)", animationDuration: "2s" }}
          />
          {hasUnread && (
            <span
              className="absolute inset-0 rounded-2xl animate-ping opacity-30 pointer-events-none"
              style={{ background: "linear-gradient(135deg, #F97316, #0076BC)", animationDuration: "0.9s" }}
            />
          )}

          <div
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0076BC 0%, #00205B 100%)",
              boxShadow: "0 4px 20px rgba(0,118,188,0.45), 0 1px 4px rgba(0,0,0,0.18)",
            }}
          >
            <Bot className="w-5 h-5 text-white pointer-events-none" />
          </div>

          {/* Orange dot — shown until chat is opened */}
          {hasUnread && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white z-10"
              style={{ backgroundColor: "#F97316" }}
            />
          )}
          {/* Green online dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white z-10"
            style={{ backgroundColor: "#22C55E" }}
          />
        </div>
      )}
    </>
  );
}

