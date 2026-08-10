import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { mzn, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, Smartphone, Copy, Check, ShieldCheck, ArrowRight, DollarSign } from "lucide-react";

interface MobileMoneyRefModalProps {
  fee?: Fee;
  student?: Student;
  onClose: () => void;
}

export function MobileMoneyRefModal({ fee, student, onClose }: MobileMoneyRefModalProps) {
  const { t } = useI18n();
  const { fees, students } = useUniStore();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    student?.id || students[0]?.id || ""
  );
  const [selectedFeeId, setSelectedFeeId] = useState<string>(
    fee?.id || fees[0]?.id || ""
  );
  const [copied, setCopied] = useState(false);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || student || students[0];
  const activeFee = fees.find((f) => f.id === selectedFeeId) || fee || fees[0];

  const entidade = "88888";
  const referencia = `${activeStudent?.id || "EST-001"}-${activeFee?.id.replace(/[^0-9]/g, "") || "01"}`;
  const ussdCode = `*150# -> 6. Pagamentos -> 1. Propinas -> Entidade ${entidade}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Entidade: ${entidade} | Referência: ${referencia} | Valor: ${activeFee?.valor} MZN`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-border pb-4 mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            <Smartphone className="size-3.5" />
            <span>{t("M-Pesa · e-Mola · mKesh")}</span>
          </div>
          <h2 className="mt-2 font-display text-xl font-bold text-foreground">
            {t("Gerar Referência Mobile Money")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Obtenha os dados para liquidação de propinas via USSD no seu telemóvel.")}
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("Estudante Beneficiário")}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("Encargo / Propina a Pagar")}
            </label>
            <select
              value={selectedFeeId}
              onChange={(e) => setSelectedFeeId(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {fees.map((f) => (
                <option key={f.id} value={f.id}>
                  {t(f.designacao)} — {mzn(f.valor)}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Display Box */}
          <div className="rounded-sm border border-primary/20 bg-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Dados do Pagamento")}
              </span>
              <span className="font-display font-bold text-primary text-sm">
                {mzn(activeFee?.valor || 0)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-sm bg-card border border-border p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">{t("Entidade UL")}</p>
                <p className="font-mono text-base font-bold text-foreground mt-0.5">{entidade}</p>
              </div>
              <div className="rounded-sm bg-card border border-border p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">{t("Referência")}</p>
                <p className="font-mono text-base font-bold text-primary mt-0.5">{referencia}</p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span className="text-success">{t("Referência Copiada!")}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-primary" />
                  <span>{t("Copiar Entidade & Referência")}</span>
                </>
              )}
            </button>
          </div>

          {/* USSD Steps */}
          <div className="space-y-2 rounded-sm border border-border bg-card p-3.5 text-xs">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <span>📱 {t("Passo-a-passo no M-Pesa (*150#)")}:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
              <li>{t("Marque *150# no seu telemóvel e prima chamar.")}</li>
              <li>{t("Seleccione a Opção 6 (Pagamentos de Serviços).")}</li>
              <li>{t("Insira a Entidade:")} <strong className="font-mono text-foreground">{entidade}</strong></li>
              <li>{t("Insira a Referência:")} <strong className="font-mono text-primary">{referencia}</strong></li>
              <li>{t("Confirme com o seu PIN M-Pesa para receber o comprovativo instantâneo.")}</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("Entendido & Fechar")}
          </button>
        </div>
      </div>
    </div>
  );
}
