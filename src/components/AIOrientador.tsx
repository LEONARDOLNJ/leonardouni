import React, { useState } from "react";
import Markdown from "react-markdown";
import { useI18n } from "@/lib/i18n";
import { CURSOS, UNIVERSITY } from "@/lib/uni-data";
import { Sparkles, Bot, Send, RefreshCw, HelpCircle, CheckCircle2, DollarSign, Calendar, Lightbulb, ChevronRight } from "lucide-react";

export function AIOrientador() {
  const { t, lang } = useI18n();

  // Choice Simulator States
  const [curso, setCurso] = useState(CURSOS[0]);
  const [ano, setAno] = useState("1");
  const [situacao, setSituacao] = useState("Pagamento parcelado por semestre");
  const [metodo, setMetodo] = useState("Mobile Money");
  const [questao, setQuestao] = useState("");
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<string | null>(null);

  // Chatbot States
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; content: string }>>([
    {
      role: "model",
      content:
        lang === "en"
          ? `Hello! I am the **Leonardo University AI Student Advisor**. Select your course and preferences above, or ask me any question about tuition fees, deadlines, or payment plans.`
          : `Olá! Sou o **Orientador IA do Estudante da Leonardo University**. Seleccione o seu curso e preferências acima para gerar o seu plano personalizado ou faça-me qualquer pergunta sobre propinas, prazos e métodos de pagamento.`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  // Handle Choice-Based Guidance Submission
  const handleGenerateGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGuidance(true);
    setGuidanceResult(null);

    try {
      const res = await fetch("/api/ai/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso,
          ano,
          situacao,
          metodo,
          questaoPersonalizada: questao,
          lang,
        }),
      });

      const data = await res.json();
      if (data.advice) {
        setGuidanceResult(data.advice);
      } else if (data.error) {
        setGuidanceResult(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setGuidanceResult(
        lang === "en"
          ? "Failed to connect to the AI service. Please try again."
          : "Não foi possível ligar ao serviço de IA. Por favor tente novamente.",
      );
    } finally {
      setLoadingGuidance(false);
    }
  };

  // Handle Interactive Chat Submission
  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputMsg;
    if (!msg.trim() || loadingChat) return;

    const newMessages = [...messages, { role: "user" as const, content: msg }];
    setMessages(newMessages);
    if (!textToSend) setInputMsg("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          lang,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            lang === "en"
              ? "Sorry, an error occurred while connecting to the AI Advisor."
              : "Desculpe, ocorreu um erro ao contactar o Orientador IA.",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const presetQuestions = [
    lang === "en"
      ? "What are all mandatory fees for 1st year Computer Engineering?"
      : "Quais as taxas obrigatórias para o 1º ano de Engenharia Informática?",
    lang === "en"
      ? "How can I request a payment plan extension or installment agreement?"
      : "Como posso negociar um plano de pagamento em prestações para o 1º semestre?",
    lang === "en"
      ? "Are there clinical fee supplements for Medicine students?"
      : "Quais são as propinas clínicas adicionais para estudantes de Medicina?",
    lang === "en"
      ? "How do I pay using M-Pesa or e-Mola safely?"
      : "Como realizar o pagamento por M-Pesa ou e-Mola e obter recibo?",
  ];

  return (
    <div className="space-y-8">
      {/* AI Header Hero Section */}
      <div className="relative overflow-hidden rounded-sm border border-primary/20 bg-gradient-to-r from-primary via-primary/95 to-primary/90 p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Sparkles className="size-3.5 text-accent-foreground" />
              <span>{t("Orientador IA do Estudante · Leonardo University")}</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {t("Guia de Escolhas & Orientação Financeira Inteligente")}
            </h2>
            <p className="text-sm opacity-90 leading-relaxed">
              {t(
                "Insira o seu curso, ano lectivo e preferências financeiras para receber recomendações personalizadas, estimativa de encargos, alertas de prazo e estratégias de pagamento.",
              )}
            </p>
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-md transition hover:bg-accent/90 shrink-0"
          >
            <Bot className="size-4" />
            <span>{chatOpen ? t("Fechar Assistente IA") : t("Conversar com Orientador IA")}</span>
          </button>
        </div>
      </div>

      {/* Choice Simulator Form + Output Card */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form Controls */}
        <div className="lg:col-span-5 rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
            <Lightbulb className="size-5 text-accent" />
            <h3 className="font-display text-base font-bold text-foreground">
              {t("Configure as suas Escolhas")}
            </h3>
          </div>

          <form onSubmit={handleGenerateGuidance} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("Curso Académico")}
              </label>
              <select
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CURSOS.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("Ano de Estudo")}
                </label>
                <select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {["1", "2", "3", "4", "5"].map((a) => (
                    <option key={a} value={a}>
                      {a}º {t("Ano")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("Método de Pagamento")}
                </label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Mobile Money">Mobile Money (M-Pesa / e-Mola)</option>
                  <option value="Cartão">Cartão de Débito/Crédito</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("Preferência / Situação Financeira")}
              </label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Pagamento parcelado por semestre">
                  {t("Pagamento parcelado por semestre (18.500 MZN/semestre)")}
                </option>
                <option value="Pagamento integral único com desconto">
                  {t("Pagamento integral anual único")}
                </option>
                <option value="Necessidade de plano de extensão ou apoio por dificuldades">
                  {t("Pedido de extensão de prazo / Necessidade de apoio")}
                </option>
                <option value="Combinado de Propinas e Taxas laboratoriais/clínicas">
                  {t("Ajuste para Propinas + Taxas específicas do curso")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("Dúvida ou Nota Adicional (Opcional)")}
              </label>
              <textarea
                value={questao}
                onChange={(e) => setQuestao(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "e.g., I work full-time or need to apply for a scholarship..."
                    : "Ex: Trabalho durante o dia, gostaria de solicitar apoio financeiro..."
                }
                rows={3}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loadingGuidance}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {loadingGuidance ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>{t("A analisar opções com IA...")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{t("Gerar Orientação Personalizada IA")}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Output Display Panel */}
        <div className="lg:col-span-7 rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <h3 className="font-display text-base font-bold text-foreground">
                {t("Plano & Orientação Recomendada")}
              </h3>
            </div>
            {guidanceResult && (
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-sm">
                Gemini 3.6 Flash
              </span>
            )}
          </div>

          <div className="flex-1">
            {loadingGuidance ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <RefreshCw className="size-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">
                  {t("A processar e estruturar o plano financeiro na Leonardo University...")}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {t("Analisando prazos de propinas, taxas do curso e melhores formas de liquidação.")}
                </p>
              </div>
            ) : guidanceResult ? (
              <div className="rounded-sm bg-muted/30 border border-border/80 p-5 font-sans text-sm text-foreground space-y-3 leading-relaxed">
                <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                  <Markdown>{guidanceResult}</Markdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/80 rounded-sm p-6 bg-muted/10">
                <Sparkles className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {t("Nenhum plano gerado ainda")}
                </p>
                <p className="text-xs text-muted-foreground max-w-md mt-1">
                  {t(
                    "Seleccione o seu curso e preferências à esquerda e clique em 'Gerar Orientação Personalizada IA' para receber um plano financeiro detalhado.",
                  )}
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left w-full max-w-lg">
                  <div className="p-3 bg-card border border-border rounded-sm">
                    <DollarSign className="size-4 text-accent mb-1" />
                    <p className="text-xs font-semibold text-foreground">{t("Custos Precisos")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("Propinas e taxas por curso")}</p>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-sm">
                    <Calendar className="size-4 text-primary mb-1" />
                    <p className="text-xs font-semibold text-foreground">{t("Prazos Alertas")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("Evite multas de mora")}</p>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-sm">
                    <CheckCircle2 className="size-4 text-success mb-1" />
                    <p className="text-xs font-semibold text-foreground">{t("Métodos Locais")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("M-Pesa, e-Mola, Bancos")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Chat Drawer / Modal */}
      {chatOpen && (
        <div className="rounded-sm border border-primary/30 bg-card p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <h3 className="font-display text-base font-bold text-foreground">
                {t("Conversa em Tempo Real com Orientador IA")}
              </h3>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("Fechar")}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">
              {t("Dúvidas frequentes")}:
            </span>
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border px-2.5 py-1 rounded-sm text-left transition flex items-center gap-1"
              >
                <span>{q}</span>
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="max-h-96 overflow-y-auto space-y-3 p-4 bg-muted/20 border border-border rounded-sm text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "model" && (
                  <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-1">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-sm px-4 py-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground shadow-xs"
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <RefreshCw className="size-3 animate-spin text-primary" />
                <span>{t("O Orientador IA está a escrever...")}</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                lang === "en"
                  ? "Ask any question regarding your Leonardo University studies and fees..."
                  : "Escreva a sua dúvida sobre propinas, prazos ou cursos na Leonardo University..."
              }
              className="flex-1 rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loadingChat || !inputMsg.trim()}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <Send className="size-4" />
              <span>{t("Enviar")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
