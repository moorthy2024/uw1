"use client";
import { useState } from "react";
import { MessageCircle, Send, X, Sparkles, TrendingUp } from "lucide-react";

interface AIChatProps {
  currentScreen: "submissions" | "submission-detail" | "dashboard" | "portfolio";
  screenContext?: any;
}

export function AIChat({ currentScreen, screenContext }: AIChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'assistant', message: string, agents?: string[] }>>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', message: chatMessage }]);

    // Simulate agent processing
    const simulatedAgents = ["Orchestration Agent", "Intelligence & Reasoning Agent", "Document Summarization Agent"];
    setActiveAgents(simulatedAgents);

    // Simulate response after delay
    setTimeout(() => {
      const response = generateContextualResponse(chatMessage, currentScreen);
      setChatHistory(prev => [...prev, {
        type: 'assistant',
        message: response,
        agents: simulatedAgents
      }]);
      setActiveAgents([]);
    }, 2000);

    setChatMessage("");
  };

  const generateContextualResponse = (question: string, screen: string): string => {
    const lowerQuestion = question.toLowerCase();

    // Contextual responses based on screen and question
    if (screen === "submission-detail") {
      if (lowerQuestion.includes("risk") || lowerQuestion.includes("driver")) {
        return "Based on SUB-2026-0847 (Westfield Manufacturing), the primary risk drivers are: (1) Earthquake exposure - 65% of TIV in seismic zone 4, PML $18.2M at 1-in-250 year, (2) Wildfire - LA facility within 2 miles of high-risk zone, (3) Aging equipment - fire pump at LA facility requires replacement within 12 months. The multi-jurisdiction structure (67% domestic, 33% international) adds complexity to coverage terms and regulatory compliance.";
      } else if (lowerQuestion.includes("engineering") || lowerQuestion.includes("recommendation")) {
        return "The Risk Engineering report identifies 3 priority items: (1) CRITICAL - Replace 18-year-old fire pump at LA facility within 12 months, (2) Install seismic bracing for storage racks at San Diego facility (NFPA 13 compliant), (3) Add wildfire ember-resistant vents at LA facility. Overall risk quality is rated 'Good' with excellent protection at Sacramento and San Diego, but LA facility needs attention. Implementing recommendations could reduce loss potential by 15-20%.";
      } else if (lowerQuestion.includes("pricing") || lowerQuestion.includes("strategy")) {
        return "For SUB-2026-0847, I recommend a segmented pricing approach: Domestic portion ($325k premium) should price at 0.92 rate on line based on loss-adjusted TIV and CAT loading. International portion ($162.5k premium) requires higher rate (1.15 ROL) due to limited loss history and regulatory uncertainty. Success propensity is 78%, but consider offering 12-month rate lock to secure the bind given strong accretiveness score (94). Key negotiation points: require fire pump replacement as binding condition, consider earthquake sublimit if accumulation is concern.";
      } else if (lowerQuestion.includes("compare") || lowerQuestion.includes("similar")) {
        return "I found 3 comparable accounts in your portfolio: (1) Pacific Manufacturing Corp - similar TIV ($110M), same territory (CA), bound at 0.89 ROL with CAT loading, (2) Northern Industrial Group - higher TIV ($180M), better risk quality, 0.76 ROL, (3) Coastal Distribution LLC - similar CAT exposure, 0.95 ROL but includes flood coverage. Westfield's risk quality sits between Pacific and Coastal. Based on comparables, target rate of 0.90-0.95 ROL is competitive and profitable.";
      }
      return "Based on SUB-2026-0847, the coastal concentration in San Diego represents 65% of the total CAT exposure. Primary risk drivers are earthquake (PML $18.2M at 1-in-250) and wildfire exposure across 8 high-risk zones. The processing pattern is High Touch due to complex manuscript terms and multi-jurisdiction structure.";
    } else if (screen === "submissions") {
      if (lowerQuestion.includes("priority") || lowerQuestion.includes("today")) {
        return "Your top 3 priority submissions today: (1) SUB-2026-0847 (Westfield Manufacturing) - AI score 94, High Touch, 3 blockers, 1d 14h until SLA breach, (2) SUB-2026-0845 (Atlantic Distribution) - AI score 92, High Touch, CAT modeling in progress, strong success propensity 65%, (3) SUB-2026-0850 (TechCorp renewal) - AI score 91, upcoming 05/01 deadline, 3 pending renewals to consolidate. Focus on Westfield first - highest score and tightest timeline.";
      } else if (lowerQuestion.includes("high touch") || lowerQuestion.includes("attention")) {
        return "You have 3 High Touch submissions requiring detailed UW review: (1) SUB-2026-0847 (Westfield Manufacturing) - Complex multi-jurisdiction structure with international component, manuscript terms, 3 active blockers, (2) SUB-2026-0845 (Atlantic Distribution) - Large TIV ($300M+), CAT exposure in Florida, pending accumulation review, (3) SUB-2026-0843 (Pacific Hotels) - Special form coverage in Hawaii, high CAT concentration, awaiting final CAT results. All three have strong accretiveness scores but require your expertise for proper risk assessment.";
      } else if (lowerQuestion.includes("renewal") || lowerQuestion.includes("deadline")) {
        return "Upcoming renewals in next 30 days: (1) TechCorp Solutions - Renewal date 05/01/2026 (15 days), $200M-$300M TIV, currently has 3 pending renewals (SUB-2026-0851, 0852, 0853) that should be consolidated into renewal quote, (2) Global Tech Industries - Quoted renewal SUB-2026-0846, expiring soon, 85% success propensity, (3) Pacific Hotels - New business but replacing expiring incumbent carrier. Recommend prioritizing TechCorp - existing customer with high success propensity (88%) and strong relationship.";
      } else if (lowerQuestion.includes("win") || lowerQuestion.includes("propensity")) {
        return "Success propensity analysis across your queue: Highest - TechCorp renewals at 90-92% (existing customer, simple additions), Global Tech renewal at 88% (strong relationship, competitive pricing), Midwest Manufacturing at 88% (renewal with no issues). Moderate - Westfield Manufacturing at 78% (new business but strong fit), Pacific Hotels at 72% (competitive market, CAT pricing sensitive). Lowest - Atlantic Distribution at 65% (aggressive market, broker shopping), Southeast Industrial at 35% (declined for appetite mismatch). Focus efforts on high-propensity opportunities while ensuring proper risk selection on marginal submissions.";
      }
      return "Your current queue shows 12 submissions across 7 customers. Westfield Manufacturing (SUB-2026-0847) requires the most UW attention due to High Touch processing pattern and 3 active blockers. TechCorp Solutions has an upcoming renewal on 05/01/2026 with 3 pending renewals.";
    } else if (screen === "portfolio") {
      if (lowerQuestion.includes("accumulation") || lowerQuestion.includes("cat") || lowerQuestion.includes("hot spot")) {
        return "CAT accumulation hot spots: (1) LA Metro Earthquake Zone - 92% of limit ($184M exposed of $200M limit), recommend declining new large risks in this zone, (2) San Diego EQ Zone - 78% of limit ($156M of $200M), approaching threshold, new submissions require senior UW approval, (3) Florida Coastal Hurricane - 65% of limit, within appetite but monitor closely. Manufacturing sector concentration at 42% - consider diversification targets for next quarter.";
      }
    }

    return "I've analyzed your question. How can I help you with underwriting decisions today?";
  };

  const getScreenInsights = () => {
    switch (currentScreen) {
      case "submissions":
        return {
          title: "Submissions Dashboard Insights",
          insights: [
            "You have 3 High Touch submissions requiring detailed UW review",
            "TechCorp Solutions renewal deadline is in 15 days (05/01/2026)",
            "2 submissions are pending CAT modeling results",
            "Westfield Manufacturing has 3 active blockers in Risk Assessment",
          ],
          quickActions: [
            "What are my highest priority submissions today?",
            "Show all High Touch submissions requiring UW attention",
            "Which renewals are coming up in the next 30 days?",
            "Compare success propensity across my queue",
          ],
        };
      case "submission-detail":
        return {
          title: "Risk Assessment Insights",
          insights: [
            "Multi-jurisdiction policy: 67% domestic ($325k), 33% international ($162.5k)",
            "Processing Pattern: High Touch - complex manuscript terms require detailed review",
            "Risk Engineering: Fire pump replacement critical at LA facility (12 mo timeline)",
            "CAT Exposure: 65% coastal concentration, earthquake PML $18.2M (1-in-250)",
          ],
          quickActions: [
            "What are the key risk drivers for this submission?",
            "Compare this risk to similar accounts in my portfolio",
            "What's the recommended pricing strategy?",
            "Explain the Risk Engineering recommendations",
          ],
        };
      case "portfolio":
        return {
          title: "Portfolio Insights",
          insights: [
            "San Diego EQ zone at 78% of accumulation limit",
            "Manufacturing sector at 42% concentration - monitor new submissions",
            "LA Metro earthquake accumulation at 92% of limit",
          ],
          quickActions: [
            "Show my CAT accumulation hot spots",
            "Analyze sector concentration trends",
            "Which zones are approaching limits?",
          ],
        };
      default:
        return {
          title: "AI UW Agent",
          insights: [
            "I can help analyze submissions and provide underwriting guidance",
            "Ask me about risk assessment, pricing, or portfolio insights",
            "I have context on your current queue and portfolio positions",
          ],
          quickActions: [
            "Show today's priority submissions",
            "Analyze portfolio concentration",
            "Review pending HITL gates",
          ],
        };
    }
  };

  const screenInsights = getScreenInsights();

  const handleQuickAction = (action: string) => {
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', message: action }]);

    // Simulate agent processing
    const simulatedAgents = ["Orchestration Agent", "Intelligence & Reasoning Agent", "Document Summarization Agent"];
    setActiveAgents(simulatedAgents);

    // Simulate response after delay
    setTimeout(() => {
      const response = generateContextualResponse(action, currentScreen);
      setChatHistory(prev => [...prev, {
        type: 'assistant',
        message: response,
        agents: simulatedAgents
      }]);
      setActiveAgents([]);
    }, 2000);
  };

  return (
    <>
      {/* Chat Bubble - Bottom Left */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-[#F9760A] to-[#00205B] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask AI UW Agent
          </div>
        </button>
      )}

      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] flex flex-col z-50">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#F9760A] to-[#00205B] text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">AI UW Agent</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-blue-100">{screenInsights.title}</p>
          </div>

          {/* Context Insights */}
          {chatHistory.length === 0 && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="space-y-2 mb-3">
                {screenInsights.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 text-[#0076BC] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#4B5563]">{insight}</p>
                  </div>
                ))}
              </div>

              {/* Quick Action Chips */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#111827] mb-2">Quick Actions:</div>
                {screenInsights.quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-[#111827] hover:bg-blue-100 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {chatHistory.map((chat, idx) => (
              <div key={idx}>
                {chat.type === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-[#0076BC] text-white rounded-lg px-3 py-2 max-w-[85%]">
                      <div className="text-sm">{chat.message}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {chat.agents && (
                      <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                        <div className="text-xs text-[#4B5563] mb-1">Agents consulted:</div>
                        <div className="flex flex-wrap gap-1">
                          {chat.agents.map((agent, i) => (
                            <span key={i} className="text-xs font-medium text-[#0076BC] bg-white px-2 py-0.5 rounded">
                              {agent}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg px-3 py-2 max-w-[85%] border border-[#E5E7EB]">
                        <div className="text-sm text-[#111827]">{chat.message}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Active Processing */}
            {activeAgents.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs font-semibold text-[#111827] mb-2">Processing your question...</div>
                {activeAgents.map((agent, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2 last:mb-0">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <span className="text-xs font-medium text-[#0076BC]">{agent}</span>
                    <span className="text-xs text-[#4B5563]">analyzing...</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F7F8FA] rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0076BC] bg-white"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="px-3 py-2 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

