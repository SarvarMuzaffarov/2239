import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Lightbulb,
  GraduationCap,
  BookOpen,
  Trophy,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { sendAiChatMessage, ChatMessage } from '../services/aiChatService';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: GraduationCap,
    label: 'Ilmiy rahbar tanlash',
    prompt: 'Menga yo‘nalishimga mos ilmiy rahbar tanlash bo‘yicha maslahat bering. Qanday mezonlarga qarashim kerak?',
  },
  {
    icon: BookOpen,
    label: 'IMRAD maqola rejasi',
    prompt: 'IMRAD standarti bo‘yicha ilmiy maqola tuzilmasi qanday bo‘ladi va annotatsiya (abstract) qanday yoziladi?',
  },
  {
    icon: Lightbulb,
    label: 'Startap g‘oyasi tahlili',
    prompt: 'Startap loyihasi uchun MVP yaratish va Pitch Deck taqdimotini tayyorlash bo‘yicha tavsiyalar bering.',
  },
  {
    icon: Trophy,
    label: 'Sertifikat & Ballar',
    prompt: 'Platformada til sertifikatlari va ilmiy yutuqlar uchun ballar qanday tartibda hisoblanadi?',
  },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text: `Assalomu alaykum! Men **Iqtidor AI** — TKTI Yangiyer filiali iqtidorli talabalari va yosh olimlarining ilmiy-innovatsion maslahatchisiman. 🎓

Sizga quyidagi yo‘nalishlarda yordam bera olaman:
* 📝 **Ilmiy maqolalar:** IMRAD talablari, OAK va Scopus jurnallari, annotatsiya yozish.
* 💡 **Startap va loyihalar:** Innovatsion g‘oyalar, MVP va taqdimot (Pitch deck) tayyorlash.
* 🏛 **Platforma bo‘yicha:** 18 ta ta'lim yo‘nalishi, ilmiy rahbar tanlash, sertifikat va ballar tartibi.

Qanday savolingiz bor? Quyidagi tayyor savollardan birini tanlashingiz yoki o‘zingiz yozishingiz mumkin!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('iqtidor_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clean out any historical error messages
          const cleanHistory = parsed.filter(
            (m: ChatMessage) =>
              !m.isError &&
              !m.text?.includes("vaqtinchalik muammo") &&
              !m.text?.includes("xatolik yuz berdi") &&
              !m.text?.includes("Ulanish xatosi")
          );

          // Deduplicate consecutive identical user messages
          const deduped: ChatMessage[] = [];
          for (const item of cleanHistory) {
            const prev = deduped[deduped.length - 1];
            if (prev && prev.role === 'user' && item.role === 'user' && prev.text === item.text) {
              continue;
            }
            deduped.push(item);
          }

          if (deduped.length > 0) return deduped;
        }
      }
    } catch {}
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save clean messages to localStorage (excluding error messages)
  useEffect(() => {
    try {
      const cleanMessages = messages.filter(
        m => !m.isError && !m.text?.includes("vaqtinchalik muammo")
      );
      localStorage.setItem('iqtidor_ai_chat_history', JSON.stringify(cleanMessages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Avoid stacking identical consecutive unreplied user prompts
    setMessages(prev => {
      const clean = prev.filter(m => !m.isError);
      const last = clean[clean.length - 1];
      if (last && last.role === 'user' && last.text === text) {
        return [...clean.slice(0, -1), userMsg];
      }
      return [...clean, userMsg];
    });

    setInput('');
    setIsLoading(true);

    try {
      const reply = await sendAiChatMessage(text, messages);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev.filter(m => !m.isError), botMsg]);
    } catch (_err: any) {
      // In case of any unexpected exception, provide an instant helpful answer
      const fallbackReply = `Assalomu alaykum! Savolingiz qabul qilindi.

TKTI Yangiyer filiali iqtidorli talabalar va yosh olimlar portalida ilmiy loyihalar, startaplar va maqolalar bo‘yicha to‘liq metodik qo‘llanmalar mavjud. Qaysi yo‘nalish yoki mavzu bo‘yicha qo‘shimcha ma’lumot kerak bo‘lsa, yozishingiz mumkin!`;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev.filter(m => !m.isError), botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (errIndex: number) => {
    let targetQuestion = '';
    for (let i = errIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        targetQuestion = messages[i].text;
        break;
      }
    }
    setMessages(prev => prev.filter((_, idx) => idx !== errIndex));
    if (targetQuestion) {
      handleSend(targetQuestion);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Suhbat tarixini tozalashni xohlaysizmi?")) {
      setMessages([INITIAL_MESSAGE]);
      try {
        localStorage.removeItem('iqtidor_ai_chat_history');
      } catch {}
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col h-[92vh] sm:h-[85vh] max-h-[800px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200">
        {/* Mobile handle indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center bg-slate-900">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-blue-950 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 fill-amber-900/20" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-blue-950 rounded-full" title="Onlayn" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  Iqtidor AI
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/15 text-amber-300 rounded-full border border-white/20">
                  Ilmiy Yordamchi
                </span>
              </div>
              <p className="text-xs text-blue-200 truncate">
                TKTI Yangiyer filiali rasmiy sun’iy intellekti
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Suhbatni tozalash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Yopish (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-2">
          {QUICK_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-950 whitespace-nowrap transition-all shadow-2xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-blue-800" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isErrorMsg = !!msg.isError;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[82%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs shadow-2xs ${
                    isUser
                      ? 'bg-blue-900 text-white font-bold'
                      : isErrorMsg
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-gradient-to-tr from-amber-400 to-amber-200 text-blue-950'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : isErrorMsg ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1.5 min-w-0">
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                      isUser
                        ? 'bg-blue-900 text-white rounded-tr-xs'
                        : isErrorMsg
                        ? 'bg-rose-50/90 border border-rose-200 text-rose-900 rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words space-y-1">
                      {msg.text.split('\n').map((line, lIdx) => {
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={lIdx} className={line.startsWith('* ') ? 'pl-2 text-slate-700 font-medium' : ''}>
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return (
                                  <strong
                                    key={pIdx}
                                    className={isUser ? 'font-bold' : isErrorMsg ? 'font-bold text-rose-950' : 'font-bold text-slate-900'}
                                  >
                                    {p.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return p;
                            })}
                          </p>
                        );
                      })}
                    </div>

                    {!isUser && !isErrorMsg && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Nusxa olish"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Retry button for error message */}
                    {isErrorMsg && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200/70 flex items-center justify-between">
                        <span className="text-[11px] text-rose-700 font-medium">Ulanish xatosi</span>
                        <button
                          type="button"
                          onClick={() => handleRetry(idx)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Qayta urinish</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span
                    className={`block text-[10px] text-slate-400 px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-blue-950 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Iqtidor AI javob tayyorlamoqda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-2">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Savolingizni yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
                rows={1}
                className="w-full resize-none max-h-32 min-h-[46px] px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="min-h-[46px] px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Yuborish</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 font-medium">
            Iqtidor AI TKTI Yangiyer filiali ma’lumotlari asosida javob beradi. Muhim ilmiy qarorlarni ilmiy rahbaringiz bilan kelishing.
          </p>
        </div>
      </div>
    </div>
  );
};
