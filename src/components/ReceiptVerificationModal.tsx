import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { mzn, dataPt } from "@/lib/uni-data";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  X,
  QrCode,
  Building2,
  Calendar,
  CreditCard,
  User,
  Hash,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface VerificationResult {
  valid: boolean;
  recibo?: string;
  paymentId?: string;
  studentId?: string;
  studentNome?: string;
  curso?: string;
  feeTitle?: string;
  valorPago?: number;
  moeda?: string;
  metodo?: string;
  data?: string;
  estado?: string;
  digitalSeal?: string;
  fullHash?: string;
  emissor?: string;
  nuit?: string;
  verificadoEm?: string;
  message?: string;
}

interface ReceiptVerificationModalProps {
  initialCode?: string;
  onClose: () => void;
}

export function ReceiptVerificationModal({ initialCode = "", onClose }: ReceiptVerificationModalProps) {
  const { t } = useI18n();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = async (codeToVerify?: string) => {
    const target = (codeToVerify || code).trim().toUpperCase();
    if (!target) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/verify/receipt/${encodeURIComponent(target)}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        valid: false,
        message: "Erro de comunicação ao validar registo nos servidores centrais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySeal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/15 text-amber-300">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-white">
                  {t("Verificador de Autenticidade")}
                </h3>
                <p className="text-[10px] text-white/80">
                  {t("Validação criptográfica de recibos e certidões")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-semibold text-foreground">
                {t("Número do Recibo ou Código de Verificação")}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex.: REC-2026-001 ou PAG-001"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!code.trim() || loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold hover:bg-primary/95 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  <span>{t("Verificar")}</span>
                </button>
              </div>

              {/* Sample quick buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{t("Exemplos rápidos")}:</span>
                {["REC-2026-001", "REC-2026-002", "REC-2026-003"].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setCode(sample);
                      handleVerify(sample);
                    }}
                    className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-mono text-[10px] border border-border cursor-pointer transition"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  result.valid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.valid ? (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="size-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1 text-xs">
                    <div>
                      <h4 className="font-bold text-sm">
                        {result.valid
                          ? t("Recibo Autêntico & Válido")
                          : t("Recibo Não Reconhecido")}
                      </h4>
                      <p className="text-[11px] opacity-80">
                        {result.message ||
                          (result.valid
                            ? t("Documento registado com sucesso no livro central de tesouraria.")
                            : t("O código introduzido não coincide com nenhum registo liquidado."))}
                      </p>
                    </div>

                    {result.valid && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-foreground font-sans">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Nº do Recibo")}:</span>
                          <strong className="font-mono">{result.recibo}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Estudante")}:</span>
                          <strong>{result.studentNome} ({result.studentId})</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Emolumento")}:</span>
                          <span className="truncate max-w-[200px]">{result.feeTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Valor Liquidado")}:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-display">
                            {mzn(result.valorPago || 0)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Forma de Pagamento")}:</span>
                          <span>{t(result.metodo || "")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Data de Liquidação")}:</span>
                          <span className="font-mono">{dataPt(result.data || "")}</span>
                        </div>

                        {/* Digital Seal */}
                        {result.digitalSeal && (
                          <div className="mt-3 p-2.5 rounded-lg bg-background/80 border border-border/80 flex items-center justify-between gap-2">
                            <div className="truncate">
                              <span className="block text-[9px] uppercase font-mono text-muted-foreground">
                                {t("Selo de Segurança Criptográfico")}
                              </span>
                              <code className="text-[10px] font-mono text-primary font-bold">
                                {result.digitalSeal}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => copySeal(result.digitalSeal || "")}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                              title={t("Copiar Selo")}
                            >
                              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
