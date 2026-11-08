import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useUniStore } from "@/lib/uni-store";
import { dispatchPushNotification, type PushCategory } from "@/lib/push-notifications";
import { mzn } from "@/lib/uni-data";
import {
  BellRing,
  Send,
  Sparkles,
  Receipt,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  User,
  Radio,
  X,
  Smartphone,
  Check,
} from "lucide-react";

export interface SecretaryPushDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: PushCategory;
  defaultStudentId?: string;
  defaultReceiptNo?: string;
}

export function SecretaryPushDispatcherModal({
  isOpen,
  onClose,
  defaultCategory = "fee_deadline",
  defaultStudentId,
  defaultReceiptNo,
}: SecretaryPushDispatcherModalProps) {
  const { t } = useI18n();
  const { students, fees } = useUniStore();

  const [category, setCategory] = useState<PushCategory>(defaultCategory);
  const [targetAudience, setTargetAudience] = useState<"all" | "debtors" | "specific">("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId || (students[0]?.id || "EST-2024-001"));
  const [title, setTitle] = useState<string>("⏰ Aviso de Vencimento: Propina Mensal");
  const [body, setBody] = useState<string>("Informamos que o prazo para pagamento da propina mensal termina nos próximos 5 dias. Regularize para evitar multas.");
  const [receiptNo, setReceiptNo] = useState<string>(defaultReceiptNo || "REC-2026/08-9412");
  const [amount, setAmount] = useState<number>(8500);
  const [dueDate, setDueDate] = useState<string>("2026-09-05");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Preset templates
  const applyPreset = (type: PushCategory) => {
    setCategory(type);
    if (type === "fee_deadline") {
      setTitle("⏰ Aviso de Vencimento: Propina de Setembro");
      setBody("Lembramos que o prazo limite para liquidação da propina sem encargos de mora termina em 05/09/2026.");
    } else if (type === "new_receipt") {
      setTitle("📄 Novo Recibo Emitido pela Secretaria");
      setBody(`O seu recibo oficial nº ${receiptNo || "2026/08-9412"} foi autenticado pela Tesouraria e está disponível para download.`);
    } else if (type === "clearance") {
      setTitle("🎓 Declaração de Regularidade Financeira Emitida");
      setBody("A sua declaração de quitação e histórico financeiro 2026 foi aprovada pela Direcção Financeira.");
    } else {
      setTitle("🏛️ Comunicado Oficial da Secretaria Financeira");
      setBody("O período de renegociação de planos de pagamento e candidaturas a bolsas de estudo está aberto.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const studentObj = students.find((s) => s.id === selectedStudentId);

    await dispatchPushNotification({
      title,
      body,
      category,
      studentId: targetAudience === "specific" ? selectedStudentId : "all",
      studentName: targetAudience === "specific" ? studentObj?.nome : undefined,
      receiptNo: category === "new_receipt" ? receiptNo : undefined,
      amount: Number(amount) || undefined,
      dueDate: category === "fee_deadline" ? dueDate : undefined,
      url: category === "new_receipt" ? "/recibos" : category === "fee_deadline" ? "/propinas" : "/portal",
    });

    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Radio className="size-5 text-emerald-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{t("Disparo de Notificações Push")}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Service Worker API
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("Enviar alerta instantâneo para dispositivos de estudantes")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-5 space-y-4 overflow-y-auto">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t("Modelos Rápidos de Mensagem")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "fee_deadline", label: "Prazo Propina", icon: Calendar },
                { id: "new_receipt", label: "Novo Recibo", icon: Receipt },
                { id: "clearance", label: "Quitação", icon: CheckCircle2 },
                { id: "secretary_alert", label: "Comunicado", icon: AlertTriangle },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                      category === p.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span className="text-[11px]">{t(p.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t("Público-Alvo")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "Todos os Alunos", icon: Users },
                { id: "debtors", label: "Alunos c/ Dívida", icon: AlertTriangle },
                { id: "specific", label: "Aluno Específico", icon: User },
              ].map((aud) => {
                const Icon = aud.icon;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      targetAudience === aud.id
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{t(aud.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Student Select */}
          {targetAudience === "specific" && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {t("Seleccionar Estudante")}
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nome} ({st.id}) — {st.curso}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              {t("Título da Notificação Push")}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none font-semibold"
              placeholder="Ex: Alerta de Vencimento de Propina..."
            />
          </div>

          {/* Body Content */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              {t("Mensagem / Corpo")}
            </label>
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed"
              placeholder="Digite a mensagem informativa para o aluno..."
            />
          </div>

          {/* Context Fields */}
          <div className="grid grid-cols-2 gap-3">
            {category === "new_receipt" && (
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {t("Nº do Recibo")}
                </label>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono"
                  placeholder="Ex: REC-2026/08-9412"
                />
              </div>
            )}

            {category === "fee_deadline" && (
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  {t("Data Limite")}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {t("Montante de Referência (MZN)")}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono"
              />
            </div>
          </div>

          {/* Real-time Push Preview Mockup */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Smartphone className="size-3.5 text-primary" />
                {t("Pré-visualização do Push no Dispositivo")}
              </span>
              <span className="text-[10px] font-mono">ServiceWorker.showNotification</span>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="size-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-foreground truncate">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{body}</p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-primary font-semibold">
                  <span>{t("Toque para abrir no Portal Académico")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer"
            >
              {t("Cancelar")}
            </button>

            <button
              type="submit"
              disabled={isSending || sentSuccess}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              {sentSuccess ? (
                <>
                  <Check className="size-4 text-emerald-300" />
                  <span>{t("Notificação Disparada!")}</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>{isSending ? t("A enviar...") : t("Disparar Push aos Alunos")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
