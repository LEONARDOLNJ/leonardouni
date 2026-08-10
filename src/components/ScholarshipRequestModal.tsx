import React, { useState } from "react";
import { type Student, mzn } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, Award, FileText, CheckCircle2, ShieldCheck, Upload, Send, Clock, AlertCircle } from "lucide-react";

interface ScholarshipRequestModalProps {
  student: Student;
  onClose: () => void;
}

export function ScholarshipRequestModal({ student, onClose }: ScholarshipRequestModalProps) {
  const { t } = useI18n();

  const [requestType, setRequestType] = useState<
    "merit" | "social" | "family" | "extension"
  >("merit");

  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const protocol = `PROT-${Math.floor(100000 + Math.random() * 900000)}`;
    setProtocolNumber(protocol);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="border-b border-border pb-4">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                <Award className="size-3.5" />
                {t("Serviço de Acção Social & Tesouraria")}
              </span>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                {t("Solicitação de Bolsa / Prorrogação de Propina")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {student.nome} ({student.id}) · {t(student.curso)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("Tipo de Pedido")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType("merit")}
                    className={`rounded-sm border p-3 text-left transition ${
                      requestType === "merit"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    <Award className="size-4 mb-1" />
                    <p className="font-semibold text-foreground text-xs">{t("Bolsa Mérito Académico")}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{t("Até 50% de redução na propina")}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType("social")}
                    className={`rounded-sm border p-3 text-left transition ${
                      requestType === "social"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    <ShieldCheck className="size-4 mb-1" />
                    <p className="font-semibold text-foreground text-xs">{t("Apoio Social Universitário")}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{t("Plano especial de carência")}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType("family")}
                    className={`rounded-sm border p-3 text-left transition ${
                      requestType === "family"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    <FileText className="size-4 mb-1" />
                    <p className="font-semibold text-foreground text-xs">{t("Desconto Familiar / Irmãos")}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{t("15% de desconto bonificado")}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType("extension")}
                    className={`rounded-sm border p-3 text-left transition ${
                      requestType === "extension"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    <Clock className="size-4 mb-1" />
                    <p className="font-semibold text-foreground text-xs">{t("Prorrogação de Prazo")}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{t("Adiar data limite de pagamento")}</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Fundamentação / Justificativo do Pedido")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("Descreva detalhadamente as razões do seu pedido (ex: média académica superior a 16 valores, situação financeira familiar, etc)...")}
                  className="w-full rounded-sm border border-input bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Upload simulation */}
              <div className="rounded-sm border border-dashed border-border bg-muted/30 p-3 text-center">
                <Upload className="mx-auto size-5 text-muted-foreground mb-1" />
                <p className="font-medium text-foreground text-xs">
                  {t("Anexar Documentação Comprovativa (Opcional)")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t("Declaração de rendimentos, boletim de notas ou comprovativo de agregado familiar (PDF/JPG)")}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-sm border border-border px-4 py-2 font-semibold text-muted-foreground hover:bg-muted"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-5 py-2 font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs"
                >
                  <Send className="size-3.5" />
                  <span>{t("Submeter Pedido Oficial")}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation state */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-foreground">
                {t("Solicitação Submetida com Sucesso!")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("O seu pedido deu entrada na Secretaria Geral de Acção Social da Leonardo University.")}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-muted/40 p-4 text-xs text-left max-w-sm mx-auto space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">{t("Nº de Protocolo")}:</span>
                <span className="font-bold text-primary">{protocolNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Estudante")}:</span>
                <span className="font-semibold text-foreground">{student.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Prazo de Resposta")}:</span>
                <span className="font-semibold text-foreground">3 a 5 dias úteis</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="rounded-sm bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                {t("Concluído")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
