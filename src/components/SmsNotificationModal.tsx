import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { mzn, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, Send, Smartphone, CheckCircle, MessageSquare, Bell, AlertTriangle } from "lucide-react";

interface SmsNotificationModalProps {
  initialStudent?: Student;
  onClose: () => void;
}

export function SmsNotificationModal({ initialStudent, onClose }: SmsNotificationModalProps) {
  const { t } = useI18n();
  const { students, getStudentStats, getStudentOutstandingInvoices } = useUniStore();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudent?.id || students[0]?.id || ""
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const stats = selectedStudent ? getStudentStats(selectedStudent.id) : null;
  const outstanding = selectedStudent ? getStudentOutstandingInvoices(selectedStudent.id) : [];

  const [customMsg, setCustomMsg] = useState<string>(
    `Leonardo University Alerta Propinas: Estimado(a) ${selectedStudent?.nome || "Estudante"}, lembramos que tem um valor pendente de ${mzn(
      stats?.totalOutstanding || 18500
    )} MZN. Pague por M-Pesa (Entidade: 88888, Ref: ${selectedStudent?.id || "EST-001"}) para regularizar a sua situação escolar.`
  );

  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const st = students.find((s) => s.id === id);
    const stStats = st ? getStudentStats(st.id) : null;
    setCustomMsg(
      `Leonardo University Alerta Propinas: Estimado(a) ${st?.nome || "Estudante"}, lembramos que tem um valor pendente de ${mzn(
        stStats?.totalOutstanding || 18500
      )} MZN. Pague por M-Pesa (Entidade: 88888, Ref: ${st?.id || "EST-001"}) para regularizar a sua situação escolar.`
    );
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {!sentSuccess ? (
          <div>
            <div className="border-b border-border pb-4 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                <Bell className="size-3.5" />
                <span>{t("Notificações Automáticas & M-Pesa SMS")}</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                {t("Enviar Lembrete de Pagamento")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Envie um SMS e notificação no telemóvel com referência M-Pesa para regularização de propinas.")}
              </p>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Selecione o Estudante")}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {students.map((s) => {
                    const st = getStudentStats(s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.id}) — Dívida: {mzn(st.totalOutstanding)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedStudent && (
                <div className="rounded-sm border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Contacto Telefónico M-Pesa")}:</span>
                    <span className="font-mono font-semibold text-foreground">+258 84 123 4567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Encargos Pendentes")}:</span>
                    <span className="font-medium text-foreground">{outstanding.length} factura(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Saldo Total em Dívida")}:</span>
                    <span className="font-bold text-destructive">{mzn(stats?.totalOutstanding || 0)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Mensagem SMS (Personalizável)")}
                </label>
                <textarea
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  rows={4}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 font-sans text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>

              {/* Mobile Phone Mockup Preview */}
              <div className="rounded-sm border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Smartphone className="size-4" />
                  <span>{t("Pré-visualização do SMS no Telemóvel do Estudante")}</span>
                </div>
                <div className="rounded-sm bg-card border border-border p-3 text-xs text-foreground shadow-xs font-sans">
                  <p className="font-semibold text-primary mb-1">UL INFO (M-Pesa Alert)</p>
                  <p className="leading-relaxed opacity-90">{customMsg}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-sm border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {sending ? (
                    <span>{t("A disparar SMS...")}</span>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>{t("Disparar Lembrete SMS")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle className="size-8" />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {t("SMS Notificação Enviada!")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("O lembrete de pagamento com referência M-Pesa foi disparado com sucesso para")} {selectedStudent?.nome}.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("Concluído")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
