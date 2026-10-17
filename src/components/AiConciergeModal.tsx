import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendAiMessage } from '../lib/api';
import { AiChatMessage } from '../types';
import Markdown from 'react-markdown';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  MapPin,
  ExternalLink,
  Compass,
  ArrowRight,
  Globe,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const AiConciergeModal: React.FC = () => {
  const {
    isAiConciergeOpen,
    setIsAiConciergeOpen,
    aiInitialPrompt,
    userLocation,
    setSelectedHotelBooking,
    hotels,
    showToast,
    userProfile,
    openAuthModal,
    updateUserPoints
  } = useApp();

  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "✨ Welcome to **TripNest VIP Concierge** — your all-in-one AI travel guide and financial budget planner.\n\nI can answer **any question** about destinations worldwide, craft detailed **day-by-day itineraries**, calculate **cost & budget breakdowns**, recommend 5-star hotels & authentic dining, or give local tips with real-world distances.\n\nHow may I help you plan your journey today?",
      timestamp: new Date().toISOString()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialPromptHandled = useRef<string | null>(null);

  useEffect(() => {
    if (isAiConciergeOpen && userProfile && aiInitialPrompt && initialPromptHandled.current !== aiInitialPrompt) {
      initialPromptHandled.current = aiInitialPrompt;
      handleSendMessage(aiInitialPrompt);
    }
  }, [isAiConciergeOpen, userProfile, aiInitialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiConciergeOpen) {
      scrollToBottom();
    }
  }, [isAiConciergeOpen, aiMessages, isLoading]);

  if (!isAiConciergeOpen) return null;

  // Secondary security gate: if not signed in, show luxury lock dialog
  if (!userProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E2C076]/40 bg-gradient-to-b from-[#0E1726] to-[#070B14] p-6 sm:p-8 text-center shadow-2xl shadow-black/80">
          <button
            onClick={() => setIsAiConciergeOpen(false)}
            className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E2C076]/10 border border-[#E2C076]/30 text-[#E2C076]">
            <Bot className="h-8 w-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-[#E2C076]/15 border border-[#E2C076]/30 text-[10px] font-bold tracking-widest text-[#E2C076] uppercase mb-3">
            AUTHENTICATION REQUIRED
          </span>

          <h3 className="text-xl font-bold text-white mb-2">
            Sign In to Access AI Concierge
          </h3>

          <p className="text-xs text-neutral-300 leading-relaxed mb-6">
            The 24/7 AI Tourism Concierge, radius-verified recommendations, and customized itineraries are reserved exclusively for registered TripNest members.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsAiConciergeOpen(false);
                openAuthModal('login');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold px-4 py-3 text-xs uppercase tracking-wider shadow-lg shadow-[#D4A853]/25 transition-all"
            >
              <span>SIGN IN / CREATE ACCOUNT</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsAiConciergeOpen(false)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white px-4 py-2.5 text-xs font-semibold transition-all"
            >
              Continue Browsing Destinations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputText.trim();
    if (!textToSend || isLoading) return;

    setInputText('');

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...aiMessages, userMsg];
    setAiMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await sendAiMessage(textToSend, newHistory, {
        userLocation: userLocation ? { lat: userLocation.lat, lng: userLocation.lng, city: userLocation.name } : undefined,
        userEmail: userProfile?.email,
        userName: userProfile?.name
      });

      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toISOString(),
        sources: response.sources
      };

      setAiMessages((prev) => [...prev, aiMsg]);

      // Deduct 200 points per AI chat interaction
      const currentPts = typeof userProfile?.points === 'number' ? userProfile.points : 25000;
      const respAny = response as any;
      const remaining = respAny?.remainingPoints !== undefined
        ? respAny.remainingPoints
        : Math.max(0, currentPts - 200);

      updateUserPoints(remaining);
      showToast('AI Concierge: 200 Points deducted per chat', 'info');
    } catch (err) {
      console.error('Failed to get AI concierge response:', err);
      showToast('Concierge temporarily in fallback mode', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setAiMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'ai',
        text: "✨ Hello! I am your **TripNest 24/7 AI Travel Concierge**.\n\nAsk me about any destination, comprehensive budget planning, customized itineraries, hotel bookings, flight tips, and sightseeing. How may I assist you?",
        timestamp: new Date().toISOString()
      }
    ]);
    showToast('Conversation history cleared', 'info');
  };

  const samplePrompts = [
    'Plan a comprehensive 7-day budget breakdown for Switzerland for 2 travelers',
    'Curate a 3-day luxury itinerary for Bali with private villa & activities',
    'Best scenic viewpoint, dining, and estimated costs in Paris & Tokyo',
    'How should I allocate budget for accommodation, food, and transport in Kashmir?'
  ];

  return (
    <div
      id="ai-concierge-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsAiConciergeOpen(false)}
    >
      <div
        id="ai-concierge-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[90vh] max-h-[820px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#D4A853]/40 bg-[#111827] shadow-2xl shadow-black"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B0F19] px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E293B] to-[#111827] border border-[#D4A853]/50 shadow-md">
              <Bot className="h-5 w-5 text-[#D4A853]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-serif">
                  TripNest AI Concierge
                </h3>
                <span className="rounded-full bg-[#D4A853]/20 px-2 py-0.5 text-[10px] font-bold text-[#E2C076] border border-[#D4A853]/30">
                  Global Travel & Budget AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Globe className="h-3 w-3 text-[#D4A853]" />
                <span>Global Travel Intelligence, Itinerary & Financial Budget Planning</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {userProfile && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E2C076]/10 border border-[#E2C076]/30 text-xs shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-[#E2C076]" />
                <span className="font-bold text-[#E2C076]">{(userProfile.points ?? 25000).toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-medium">pts (-200/chat)</span>
              </div>
            )}
            <button
              onClick={handleClearHistory}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#1E293B] text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsAiConciergeOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#1E293B] text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0B0F19]/50">
          {aiMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E293B] border border-[#D4A853]/40">
                    <Sparkles className="h-4 w-4 text-[#D4A853]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-[#D4A853] to-[#B38936] text-[#0B0F19] font-medium rounded-tr-none font-sans'
                      : 'border border-slate-800 bg-[#111827] text-slate-200 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-2 leading-relaxed">
                        <Markdown>{msg.text}</Markdown>
                      </div>

                      {/* Google Search Grounding Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                          <span className="font-semibold text-[#D4A853] flex items-center space-x-1 mb-1">
                            <Globe className="h-3 w-3" />
                            <span>Verified Grounding Sources:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 rounded-md bg-[#1E293B] px-2 py-0.5 text-[10px] text-slate-300 hover:text-[#D4A853] hover:border-[#D4A853] border border-slate-700 transition-colors"
                              >
                                <span className="max-w-[160px] truncate">{src.title}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <span
                    className={`block mt-1 text-[9px] ${
                      isUser ? 'text-[#0B0F19]/70 text-right' : 'text-slate-500 text-left'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E293B] border border-[#D4A853]/40">
                <Loader2 className="h-4 w-4 animate-spin text-[#D4A853]" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-[#111827] p-4 text-xs text-slate-300 flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-[#D4A853] animate-ping"></span>
                <span className="font-semibold">
                  Analyzing distance & Google Search grounding...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-800/80 bg-[#111827] px-4 py-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Suggestions:
            </span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-slate-700 bg-[#0B0F19] px-3 py-1 text-[11px] font-medium text-slate-300 hover:border-[#D4A853] hover:text-[#D4A853] transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-800 bg-[#0B0F19] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for 5-star stays, activities strictly 3-40 km away, driving times..."
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-slate-700 bg-[#111827] px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#D4A853] focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#D4A853] to-[#B38936] text-[#0B0F19] shadow-lg shadow-[#D4A853]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
