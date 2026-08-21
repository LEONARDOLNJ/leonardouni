import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { UNIVERSITY, dataPt, mzn, type Payment } from "@/lib/uni-data";
import { downloadReceipt } from "@/lib/pdf";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building2,
  Calendar,
  CreditCard,
  User,
  Hash,
} from "lucide-react";

interface ReceiptPreviewModalProps {
  payment: Payment | null;
  studentName?: string;
  studentCurso?: string;
  feeTitle?: string;
  onClose: () => void;
}

export function ReceiptPreviewModal({
  payment,
  studentName,
  studentCurso,
  feeTitle,
  onClose,
}: ReceiptPreviewModalProps) {
  const { t } = useI18n();

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNo = payment.recibo || payment.id;
  const hashSeed = `${receiptNo}-${payment.studentId}-${payment.valorPago}-ULMZ2026`;
  const checksum = `SHA256:${Array.from(hashSeed).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0).toString(16).toUpperCase()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Action Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-300" />
              <h3 className="font-display font-bold text-sm sm:text-base text-white">
                {t("Comprovativo Oficial de Pagamento")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                title={t("Imprimir Recibo")}
              >
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">{t("Imprimir")}</span>
              </button>
              <button
                onClick={() => downloadReceipt(payment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Download className="size-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Paper Container */}
          <div className="p-6 sm:p-8 bg-background text-foreground space-y-6 print:p-0">
            {/* Institution Brand Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono">
                  Moçambique · {t("Ensino Superior")}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-foreground tracking-tight">
                  {UNIVERSITY.nome}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {UNIVERSITY.morada} · {UNIVERSITY.contacto}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  NUIT: {UNIVERSITY.nuit} · Registo Académico Central
                </p>
              </div>

              <div className="text-right sm:self-center bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="size-3.5" />
                  {t("LIQUIDADO / REGULARIZADO")}
                </span>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {dataPt(payment.data)}
                </div>
              </div>
            </div>

            {/* Receipt Number & Student Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/60 text-xs">
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  <span>{t("Nº do Recibo")}:</span>
                  <strong className="text-foreground font-mono">{receiptNo}</strong>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  <span>{t("Estudante")}:</span>
                  <strong className="text-foreground">{studentName || payment.studentId}</strong>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  <span>{t("Código ID")}:</span>
                  <strong className="text-foreground font-mono">{payment.studentId}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                {studentCurso && (
                  <div className="text-muted-foreground">
                    <span>{t("Curso")}: </span>
                    <strong className="text-foreground">{studentCurso}</strong>
                  </div>
                )}
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-primary" />
                  <span>{t("Forma de Liquidação")}: </span>
                  <strong className="text-foreground">{t(payment.metodo)}</strong>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>{t("Data de Emissão")}: </span>
                  <strong className="text-foreground font-mono">{dataPt(payment.data)}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Line Table */}
            <div className="border border-border/80 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-2.5">{t("Descrição do Emolumento / Encargo")}</th>
                    <th className="px-4 py-2.5 text-center">{t("Qtd")}</th>
                    <th className="px-4 py-2.5 text-right">{t("Total Pago")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{feeTitle || t("Propina / Taxa Académica")}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">Ref: {payment.feeId || payment.id}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">1</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      {mzn(payment.valorPago)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-primary/5 border-t border-border/80 font-bold text-xs">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-foreground">
                      {t("Total Liquidado")}:
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base text-primary">
                      {mzn(payment.valorPago)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Security Digital Seal & Barcode Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/70 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center bg-muted rounded-lg border border-border">
                  <QrCode className="size-8 text-foreground" />
                </div>
                <div>
                  <p className="font-mono font-bold text-foreground">SELO DIGITAL AUTÊNTICO</p>
                  <p className="font-mono text-[9px] break-all">{checksum}</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Validado nos servidores centrais da Leonardo University
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="italic">{t("Processado por computador nos termos do regulamento em vigor.")}</p>
                <p className="font-mono text-[9px]">DIRECÇÃO DE TESOURARIA · MAPUTO</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
