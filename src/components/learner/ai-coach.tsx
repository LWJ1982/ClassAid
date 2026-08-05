"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "../providers";
import { apiClient } from "@/lib/api-client";
import type { CoachMessage, CoachCategory, GroundingLevel, Citation } from "@/lib/domain/types";

interface Props {
  onProceedToAssessment: () => void;
  onBack: () => void;
}

export function AICoach({ onProceedToAssessment, onBack }: Props) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I\u2019m your AI Coach for this module. I can help you understand concepts about digital multimeter measurement, connection procedures, safety rules, and common errors.\n\nI answer based on approved module material and will always cite my sources. I cannot reveal assessment answers, but I can explain underlying concepts.\n\nWhat would you like to know?",
      category: "CONCEPT",
      grounding: "SUPPORTED",
      citations: [],
      escalate: false,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: CoachMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await apiClient.chat({
        moduleId: "module-1",
        message: trimmed,
        conversationId,
        learnerId: currentUser.id,
      });

      setConversationId(response.conversationId);

      const assistantMsg: CoachMessage = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: response.answer,
        category: response.category as CoachCategory,
        grounding: response.grounding as GroundingLevel,
        citations: response.citations as Citation[],
        escalate: response.escalate,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: CoachMessage = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "I encountered an issue processing your question. Please try again or consult the responsible instructor.",
        category: "OUT_OF_SCOPE",
        grounding: "INSUFFICIENT",
        citations: [],
        escalate: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const groundingBadge = (grounding?: GroundingLevel) => {
    if (!grounding) return null;
    const styles: Record<GroundingLevel, string> = {
      SUPPORTED: "bg-green-50 text-green-700 border-green-200",
      PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
      INSUFFICIENT: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${styles[grounding]}`}>
        {grounding}
      </span>
    );
  };

  const categoryBadge = (category?: CoachCategory) => {
    if (!category) return null;
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Activity
        </button>
        <button
          onClick={onProceedToAssessment}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Proceed to Assessment
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Chat area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "60vh" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3" : "bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3"}`}>
                <p className={`text-sm whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-slate-700"}`}>
                  {msg.content}
                </p>
                {msg.role === "assistant" && (
                  <div className="mt-2 space-y-2">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {groundingBadge(msg.grounding)}
                      {categoryBadge(msg.category)}
                      {msg.escalate && (
                        <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-medium">
                          \u26A0\uFE0F Consult Instructor
                        </span>
                      )}
                    </div>
                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <p className="text-xs font-medium text-slate-500 mb-1">Sources:</p>
                        {msg.citations.map((c, i) => (
                          <p key={i} className="text-xs text-slate-400">
                            \uD83D\uDCC4 {c.sourceTitle} \u2014 {c.section}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about measurement concepts, procedures, or safety..."
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Responses are grounded in approved module material only. The coach cannot reveal assessment answers.
          </p>
        </div>
      </div>

      {/* Suggested questions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-medium text-slate-500 mb-3">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Why is voltage measured in parallel?",
            "How do I connect probes for current measurement?",
            "What are the critical safety rules?",
            "Why can't I measure resistance in a live circuit?",
            "What does OL mean on the display?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
