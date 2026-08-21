import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "@/lib/router";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useUniStore } from "@/lib/uni-store";
import { UNIVERSITY } from "@/lib/uni-data";
import {
  MessageSquare,
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  suggestedActions?: Array<{ label: string; action: string }>;
}

export function AIChatbot() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { path, navigate } = useRouter();
  const { getStudentOutstandingInvoices, getStudentStats } = useUniStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "model",
      content:
        lang === "en"
          ? `👋 **Hello! I am your Leonardo University AI Virtual Advisor.**\n\nI can help you with:\n* 💳 **Tuition & Fees**: Check balances, deadlines, and M-Pesa / DebitoPay payments.\n* 📄 **Official Documents**: How to request certificates and grade transcripts.\n* 🎓 **Scholarships & Aid**: Financial support and payment installment plans.\n\nHow can I assist your academic journey today?`
          : `👋 **Olá! Sou o Orientador Virtual IA da Leonardo University.**\n\nEstou disponível 24/7 para ajudar com:\n* 💳 **Propinas & Pagamentos**: Consulta de valores, prazos e pagamento via M-Pesa / DebitoPay.\n* 📄 **Documentos & Certificados**: Emissão de declarações de matrícula e certidões.\n* 🎓 **Bolsas & Descontos**: Candidatura a bolsas de mérito e planos de prestações.\n\nEm que posso ajudar hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        { label: lang === "en" ? "Check Tuition Fees" : "Consultar Propinas", action: "/propinas" },
        { label: lang === "en" ? "M-Pesa Payment" : "Pagar por M-Pesa", action: "/pagamentos" },
        { label: lang === "en" ? "Academic Portal" : "Portal do Estudante", action: "/portal" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Map app lang to Web Speech locale
  const langLocales: Record<Lang, string> = {
    pt: "pt-PT",
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
  };

  // Initialize Speech Recognition for Voice Input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langLocales[lang] || "pt-PT";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputMsg(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        lang === "en"
          ? "Speech recognition is not supported in this browser. Please type your message."
          : "O reconhecimento de voz não é suportado neste navegador. Por favor escreva a sua mensagem."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech start error:", err);
      }
    }
  };

  // Text-to-Speech (TTS)
  const speakMessage = (text: string) => {
    if (voiceMuted || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    // Clean markdown syntax for speech
    const cleanText = text.replace(/[*#_`]/g, "").substring(0, 350);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langLocales[lang] || "pt-PT";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Send message to server AI
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsgObj: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...messages, userMsgObj];
    setMessages(nextHistory);
    if (!customText) setInputMsg("");
    setLoading(true);

    // Prepare student context
    const studentStats = user ? getStudentStats(user.id) : null;
    const outstanding = user ? getStudentOutstandingInvoices(user.id) : [];

    const studentContext = user
      ? {
          id: user.id,
          nome: user.nome,
          curso: user.curso,
          ano: user.ano,
          propinaStatus: outstanding.length > 0 ? `com ${outstanding.length} factura(s) pendente(s)` : "regularizado",
          balance: studentStats?.totalOutstanding || 0,
          currentRoute: path,
        }
      : {
          id: "VISITOR",
          nome: "Visitante",
          currentRoute: path,
        };

    try {
      const formattedForApi = nextHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedForApi,
          lang,
          studentContext,
        }),
      });

      const data = await res.json();
      const reply = data.reply || (lang === "en" ? "I am here to assist you." : "Estou aqui para ajudar.");

      const aiMsgObj: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: data.suggestedActions || [],
      };

      setMessages((prev) => [...prev, aiMsgObj]);

      // Speak if not muted
      if (!voiceMuted) {
        speakMessage(reply);
      }
    } catch (err) {
      console.error("AIChatbot communication error:", err);
      const fallbackAiMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "model",
        content:
          lang === "en"
            ? "I am temporarily experiencing connection latency. You can navigate directly to **Propinas & Taxas** or **Pagamentos** using the main menu."
            : "Estou temporariamente com latência de ligação. Pode consultar as suas propinas no menu **Propinas & Taxas** ou efectuar pagamentos em **Pagamentos**.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: [
          { label: "Propinas & Taxas", action: "/propinas" },
          { label: "Pagamentos", action: "/pagamentos" },
        ],
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-cleared",
        role: "model",
        content:
          lang === "en"
            ? "Chat history cleared. How can I help you now?"
            : "Histórico limpo. Como posso ajudar com a sua vida académica e propinas?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const starterPrompts = [
    {
      label: lang === "en" ? "📱 Pay with M-Pesa" : "📱 Como pagar por M-Pesa",
      prompt:
        lang === "en"
          ? "How do I pay my tuition with M-Pesa step-by-step?"
          : "Como posso pagar as minhas propinas com M-Pesa passo a passo?",
    },
    {
      label: lang === "en" ? "🎓 Merit Scholarships" : "🎓 Bolsas de Mérito",
      prompt:
        lang === "en"
          ? "What are the criteria to apply for a Merit Scholarship or discount?"
          : "Quais são os critérios para solicitar Bolsa de Mérito ou desconto?",
    },
    {
      label: lang === "en" ? "📄 Issue Transcript" : "📄 Pedir Declaração",
      prompt:
        lang === "en"
          ? "How do I request an official Enrolment Declaration and Grade Transcript?"
          : "Como solicito uma Declaração de Matrícula e Certificado de Notas?",
    },
    {
      label: lang === "en" ? "💳 DebitoPay / Card" : "💳 Pagamento com Cartão",
      prompt:
        lang === "en"
          ? "Can I pay using my bank debit card or DebitoPay?"
          : "Posso pagar com cartão de débito bancário ou DebitoPay?",
    },
    {
      label: lang === "en" ? "📅 Fee Deadlines" : "📅 Prazos de Propinas",
      prompt:
        lang === "en"
          ? "What are the semester tuition payment deadlines for 2026?"
          : "Quais são os prazos de vencimento das propinas para o ano lectivo de 2026?",
    },
  ];

  return (
    <>
      {/* Floating Capsule Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3"
          >
            <button
              onClick={() => setIsOpen(true)}
              id="ai-chatbot-launcher-btn"
              aria-label={t("Abrir Chatbot IA")}
              className="group relative flex items-center gap-2.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-xl hover:shadow-2xl px-4 py-3 rounded-full border border-white/20 transition-all duration-200 cursor-pointer backdrop-blur-md active:scale-95"
            >
              {/* Outer pulsing ring */}
              <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping opacity-75 duration-1000" />

              <div className="relative flex items-center justify-center size-8 rounded-full bg-white/15 text-amber-300">
                <Bot className="size-5 transition-transform group-hover:scale-110" />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-display tracking-tight text-white">
                    {t("Assistente IA")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 border border-emerald-400/30">
                    2.5 / 3.7
                  </span>
                </div>
                <p className="text-[10px] text-white/80 leading-none">
                  {lang === "en" ? "Ask about tuition & fees" : "Dúvidas, propinas e suporte"}
                </p>
              </div>

              {unreadCount > 0 && (
                <span className="relative flex size-5 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            id="ai-chatbot-window"
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 ${
              isExpanded
                ? "w-[95vw] sm:w-[680px] h-[88vh] max-h-[850px]"
                : "w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-3.5 border-b border-white/10 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-9 items-center justify-center rounded-xl bg-white/15 text-amber-300 border border-white/15 shadow-inner">
                  <Bot className="size-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold font-display tracking-tight text-white">
                      {t("Orientador IA · Leonardo University")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Gemini 3.7 Flash On-Line</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice Synthesis Mute Toggle */}
                <button
                  onClick={() => {
                    const newMuted = !voiceMuted;
                    setVoiceMuted(newMuted);
                    if (newMuted && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  title={voiceMuted ? t("Activar Voz") : t("Silenciar Voz")}
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  {voiceMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-amber-300" />}
                </button>

                {/* Clear Chat History */}
                <button
                  onClick={clearChat}
                  title={t("Limpar Conversa")}
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                </button>

                {/* Expand / Minimize Window */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? t("Tamanho Padrão") : t("Expandir")}
                  className="hidden sm:inline-flex rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title={t("Fechar Chat")}
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Student Context Bar */}
            {user && (
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="font-semibold text-primary">{user.nome}</span>
                  <span className="text-muted-foreground">· {user.curso} ({user.ano}º Ano)</span>
                </div>
                <span className="text-[10px] font-mono bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                  {user.id}
                </span>
              </div>
            )}

            {/* Conversation Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 selection:bg-primary/20">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-end gap-2 max-w-[88%]">
                      {!isUser && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs shadow-2xs mb-1">
                          <Bot className="size-4 text-primary" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-xs font-normal"
                            : "bg-card text-card-foreground border border-border/80 rounded-bl-xs"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="markdown-body space-y-2 prose prose-xs dark:prose-invert max-w-none text-foreground font-sans">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        )}

                        {/* Read Aloud Audio button for Bot */}
                        {!isUser && (
                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {msg.timestamp}
                            </span>
                            <button
                              onClick={() => speakMessage(msg.content)}
                              className="hover:text-primary transition flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer font-medium"
                              title={t("Ouvir resposta")}
                            >
                              <Volume2 className="size-3 text-primary" />
                              <span>{t("Ouvir")}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suggested Direct Action Chips */}
                    {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2 pl-9 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              navigate(act.action);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-[11px] font-semibold transition-all hover:scale-102 cursor-pointer shadow-2xs"
                          >
                            <span>{act.label}</span>
                            <ArrowUpRight className="size-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-end gap-2 max-w-[88%]">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs mb-1">
                    <Bot className="size-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-bl-xs bg-card border border-border px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-2 rounded-full bg-primary animate-bounce" />
                      <span className="text-xs text-muted-foreground ml-2 font-medium">
                        {lang === "en" ? "Consulting Leonardo University AI..." : "A processar com Orientador IA..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Chips */}
            <div className="bg-card border-t border-border/60 p-2 overflow-x-auto flex gap-1.5 no-scrollbar">
              {starterPrompts.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(st.prompt)}
                  disabled={loading}
                  className="whitespace-nowrap shrink-0 rounded-full bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium px-3 py-1 border border-border/60 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Input Bar & Controls */}
            <div className="p-3 bg-card border-t border-border/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <div className="relative flex-1 rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      lang === "en"
                        ? "Ask about tuition fees, M-Pesa, scholarships..."
                        : "Escreva a sua dúvida sobre propinas, M-Pesa, bolsas..."
                    }
                    rows={1}
                    className="w-full resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-24 min-h-[38px]"
                  />
                </div>

                {/* Voice input button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? t("A ouvir...") : t("Falar com microfone")}
                  className={`size-9 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white border-red-600 animate-pulse"
                      : "bg-muted text-foreground hover:bg-muted/80 border-border"
                  }`}
                >
                  {isListening ? <MicOff className="size-4" /> : <Mic className="size-4 text-primary" />}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || loading}
                  aria-label={t("Enviar")}
                  className="size-9 shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                >
                  <Send className="size-4" />
                </button>
              </form>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-500" />
                  {t("IA Oficial · Leonardo University")}
                </span>
                <span>{lang.toUpperCase()} · Enter ↵</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
