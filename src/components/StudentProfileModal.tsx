import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { downloadReceipt, downloadClearanceCertificate } from "@/lib/pdf";
import { dataPt, mzn, type Fee, type Payment, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "@/components/Shell";
import { PayInvoiceModal } from "./PayInvoiceModal";
import { X, User, CreditCard, History, AlertCircle, CheckCircle, Download, DollarSign, Mail, Shield, FileText } from "lucide-react";

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

export function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  const { t } = useI18n();
  const { getStudentPayments, getStudentOutstandingInvoices, getStudentStats } = useUniStore();

  const [activeTab, setActiveTab] = useState<"outstanding" | "history">("outstanding");

  // State for paying an invoice
  const [selectedInvoice, setSelectedInvoice] = useState<{
    fee: Fee;
    payment?: Payment;
    dueAmount: number;
  } | null>(null);

  const payments = getStudentPayments(student.id);
  const outstandingInvoices = getStudentOutstandingInvoices(student.id);
  const stats = getStudentStats(student.id);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>

          {/* Student Header */}
          <div className="border-b border-border pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {student.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {student.nome}
                  </h2>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center mt-0.5">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded-sm text-foreground">
                      {student.id}
                    </span>
                    <span>·</span>
                    <span>{t(student.curso)}</span>
                    <span>·</span>
                    <span>{student.ano}º {t("Ano")}</span>
                  </p>
                </div>
              </div>

              {stats.totalOutstanding > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive">
                  <AlertCircle className="size-3.5" />
                  <span>{t("Em dívida")}: {mzn(stats.totalOutstanding)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-semibold text-success">
                  <CheckCircle className="size-3.5" />
                  <span>{t("Situação Regularizada")}</span>
                </span>
              )}
            </div>

            {/* Document ID & Contact Meta */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/30 border border-border/60 p-3 rounded-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4 text-primary shrink-0" />
                <span>{t("Doc. Identificação / NUIT")}:</span>
                <strong className="font-mono text-foreground">{student.docId || "N/A"}</strong>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 text-primary shrink-0" />
                <span>{t("E-mail")}:</span>
                <strong className="text-foreground">{student.email}</strong>
              </div>
            </div>
          </div>

          {/* Financial Overview Stats Bar */}
          <div className="my-5 grid grid-cols-3 gap-3">
            <div className="rounded-sm border border-border bg-muted/20 p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Total Cobrado")}</p>
              <p className="font-display text-lg font-bold text-foreground mt-1">{mzn(stats.totalInvoiced)}</p>
            </div>
            <div className="rounded-sm border border-border bg-muted/20 p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Total Liquidado")}</p>
              <p className="font-display text-lg font-bold text-success mt-1">{mzn(stats.totalPaid)}</p>
            </div>
            <div className="rounded-sm border border-border bg-muted/20 p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Saldo em Dívida")}</p>
              <p className={`font-display text-lg font-bold mt-1 ${stats.totalOutstanding > 0 ? "text-destructive" : "text-foreground"}`}>
                {mzn(stats.totalOutstanding)}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border mb-4 text-sm font-medium">
            <button
              onClick={() => setActiveTab("outstanding")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
                activeTab === "outstanding"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="size-4" />
              <span>{t("Facturas & Propinas Pendentes")} ({outstandingInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
                activeTab === "history"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="size-4" />
              <span>{t("Histórico de Pagamentos")} ({payments.length})</span>
            </button>
          </div>

          {/* Tab 1: Outstanding Invoices */}
          {activeTab === "outstanding" && (
            <div className="space-y-3">
              {outstandingInvoices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-sm border border-dashed border-border p-6">
                  <CheckCircle className="mx-auto size-10 text-success mb-2" />
                  <p className="font-semibold text-foreground">{t("Sem propinas ou taxas pendentes!")}</p>
                  <p className="text-xs mt-1">
                    {t("Todas as propinas e encargos administrativos deste estudante encontram-se totalmente liquidados.")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">{t("Encargo")}</th>
                        <th className="px-4 py-2.5 font-medium">{t("Vencimento")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Valor Total")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Pago")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Em Dívida")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Acção")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {outstandingInvoices.map((inv) => (
                        <tr key={inv.fee.id} className="hover:bg-muted/10 transition">
                          <td className="px-4 py-3 font-medium">
                            {t(inv.fee.designacao)}
                            <span className="block text-xs font-mono text-muted-foreground">{inv.fee.id}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {dataPt(inv.fee.vencimento)}
                          </td>
                          <td className="px-4 py-3 text-right">{mzn(inv.fee.valor)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {mzn(inv.fee.valor - inv.dueAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-destructive">
                            {mzn(inv.dueAmount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                            >
                              <DollarSign className="size-3.5" />
                              <span>{t("Pagar Agora")}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Payment History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-sm border border-dashed border-border p-6">
                  <History className="mx-auto size-10 text-muted-foreground/50 mb-2" />
                  <p className="font-semibold text-foreground">{t("Nenhum registo transaccional encontrado")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">{t("Ref.ª / Recibo")}</th>
                        <th className="px-4 py-2.5 font-medium">{t("Data")}</th>
                        <th className="px-4 py-2.5 font-medium">{t("Método")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Valor Pago")}</th>
                        <th className="px-4 py-2.5 font-medium">{t("Estado")}</th>
                        <th className="px-4 py-2.5 text-right font-medium">{t("Comprovativo")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/10 transition">
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="font-bold text-foreground">{p.recibo || p.id}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{dataPt(p.data)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{t(p.metodo)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">{mzn(p.valorPago)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge estado={p.estado} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => downloadReceipt(p)}
                              disabled={p.estado !== "pago"}
                              className="inline-flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-xs font-medium transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Download className="size-3" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
            <button
              onClick={() => downloadClearanceCertificate(student, stats, payments)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-muted border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition"
            >
              <FileText className="size-4 text-primary" />
              <span>{t("Emitir Declaração de Situação Financeira (PDF)")}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-sm border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              {t("Fechar Ficha")}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Pay Modal if triggered */}
      {selectedInvoice && (
        <PayInvoiceModal
          student={student}
          fee={selectedInvoice.fee}
          payment={selectedInvoice.payment}
          dueAmount={selectedInvoice.dueAmount}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
}
