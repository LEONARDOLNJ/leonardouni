import React, { useState, useMemo } from "react";
import { Panel, Shell } from "@/components/Shell";
import { downloadReceipt } from "@/lib/pdf";
import { useUniStore } from "@/lib/uni-store";
import { dataPt, mzn, type Payment } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { ReceiptPreviewModal } from "@/components/ReceiptPreviewModal";
import { ReceiptVerificationModal } from "@/components/ReceiptVerificationModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import { SecretaryPushDispatcherModal } from "@/components/SecretaryPushDispatcherModal";
import { useRouter } from "@/lib/router";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";
import {
  Search,
  Download,
  Eye,
  ShieldCheck,
  Filter,
  CreditCard,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  User,
  ArrowUpDown,
  Building2,
  QrCode,
  Camera,
  Bell,
  BellRing,
} from "lucide-react";

export function Recibos() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { payments, students, fees } = useUniStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [qrModalDoc, setQrModalDoc] = useState<any | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushStudentId, setPushStudentId] = useState<string | undefined>(undefined);
  const [pushReceiptNo, setPushReceiptNo] = useState<string | undefined>(undefined);

  const emitidos = useMemo(() => {
    return payments.filter((p) => p.estado === "pago");
  }, [payments]);

  const findStudentInStore = (id: string) => students.find((s) => s.id === id);
  const findFeeInStore = (id: string) => fees.find((f) => f.id === id);

  // Financial statistics
  const totalArrecadado = useMemo(() => {
    return emitidos.reduce((acc, curr) => acc + (curr.valorPago || 0), 0);
  }, [emitidos]);

  const mpesaTotal = useMemo(() => {
    return emitidos
      .filter((p) => p.metodo.toLowerCase().includes("m-pesa") || p.metodo.toLowerCase().includes("mpesa"))
      .reduce((acc, curr) => acc + (curr.valorPago || 0), 0);
  }, [emitidos]);

  const debitoTotal = useMemo(() => {
    return emitidos
      .filter((p) => p.metodo.toLowerCase().includes("debito") || p.metodo.toLowerCase().includes("cartão"))
      .reduce((acc, curr) => acc + (curr.valorPago || 0), 0);
  }, [emitidos]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return emitidos.filter((p) => {
      const student = findStudentInStore(p.studentId);
      const fee = findFeeInStore(p.feeId);
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        (p.recibo && p.recibo.toLowerCase().includes(query)) ||
        p.id.toLowerCase().includes(query) ||
        p.studentId.toLowerCase().includes(query) ||
        (student?.nome && student.nome.toLowerCase().includes(query)) ||
        (fee?.designacao && fee.designacao.toLowerCase().includes(query));

      const matchesMethod =
        selectedMethod === "all" ||
        (selectedMethod === "mpesa" &&
          (p.metodo.toLowerCase().includes("m-pesa") || p.metodo.toLowerCase().includes("mpesa"))) ||
        (selectedMethod === "debito" && p.metodo.toLowerCase().includes("debito")) ||
        (selectedMethod === "card" && p.metodo.toLowerCase().includes("cartão"));

      return matchesSearch && matchesMethod;
    });
  }, [emitidos, searchTerm, selectedMethod, students, fees]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Recibo", "ID Pagamento", "ID Estudante", "Nome Estudante", "Emolumento", "Valor (MZN)", "Metodo", "Data"];
    const rows = filteredReceipts.map((p) => {
      const s = findStudentInStore(p.studentId);
      const f = findFeeInStore(p.feeId);
      return [
        p.recibo || p.id,
        p.id,
        p.studentId,
        `"${s?.nome || p.studentId}"`,
        `"${f?.designacao || p.feeId}"`,
        p.valorPago,
        `"${p.metodo}"`,
        p.data,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `recibos_universidade_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Shell
      titulo={t("Recibos & Comprovativos")}
      descricao={t("Arquivo oficial de comprovativos digitais emitidos após a liquidação de propinas e taxas académicas.")}
      imagem={studentSupportImg}
    >
      <div className="space-y-6">
        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t("Total Arrecadado")}</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold font-display text-foreground">
              {mzn(totalArrecadado)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {emitidos.length} {t("comprovativos registados")}
            </p>
          </div>

          <div className="bg-card border border-border/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t("Volume M-Pesa C2B")}</span>
              <Phone className="size-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {mzn(mpesaTotal)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("Liquidação instantânea via Vodacom")}
            </p>
          </div>

          <div className="bg-card border border-border/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t("Volume DebitoPay / Cartão")}</span>
              <CreditCard className="size-4 text-blue-500" />
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold font-display text-foreground">
              {mzn(debitoTotal)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("Passagem multimoeda (MZN / ZAR / USD)")}
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <ShieldCheck className="size-4" />
                <span>{t("Verificação Oficial")}</span>
              </div>
              <p className="mt-1 text-xs text-white/80">
                {t("Valide o selo criptográfico e autenticidade de qualquer recibo.")}
              </p>
            </div>
            <button
              onClick={() => {
                setVerificationCode("");
                setIsVerifying(true);
              }}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white text-primary text-xs font-bold hover:bg-white/90 transition cursor-pointer shadow-xs"
            >
              <ShieldCheck className="size-3.5" />
              <span>{t("Validar Código")}</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Filtering Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Pesquisar por recibo, estudante, ID ou emolumento...")}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: t("Todos") },
              { id: "mpesa", label: "M-Pesa" },
              { id: "debito", label: "DebitoPay" },
              { id: "card", label: t("Cartão") },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedMethod === m.id
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-muted text-foreground hover:bg-muted/80 border border-border/60"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* QR Scanner & Verifier Quick Launcher */}
          <button
            onClick={() => navigate("/verificar")}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            title={t("Scanner & Validador de QR Code")}
          >
            <QrCode className="size-3.5" />
            <span>{t("Scanner & Validador QR")}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-medium transition cursor-pointer"
            title={t("Exportar CSV")}
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span className="hidden md:inline">{t("Exportar CSV")}</span>
          </button>
        </div>

        {/* Receipts List Table Panel */}
        <Panel titulo={`${filteredReceipts.length} ${t("comprovativos emitidos")}`}>
          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <p>{t("Nenhum recibo encontrado com os critérios actuais.")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filteredReceipts.map((p) => {
                const student = findStudentInStore(p.studentId);
                const fee = findFeeInStore(p.feeId);
                const receiptNum = p.recibo || p.id;

                return (
                  <li
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-muted/15 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground text-xs sm:text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {receiptNum}
                        </span>
                        <span className="font-medium text-foreground text-sm">
                          {student?.nome || p.studentId}
                        </span>
                        <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono">
                          ({p.studentId})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>{t(fee?.designacao ?? "")}</span>
                        <span>·</span>
                        <span>{dataPt(p.data)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          {t(p.metodo)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-display text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {mzn(p.valorPago)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Preview on Screen */}
                        <button
                          onClick={() => setPreviewPayment(p)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition cursor-pointer"
                          title={t("Pré-visualizar Recibo")}
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {/* View QR Code Modal */}
                        <button
                          onClick={() => {
                            setQrModalDoc({
                              code: receiptNum,
                              title: `Recibo de Pagamento ${receiptNum}`,
                              type: "RECIBO",
                              studentId: p.studentId,
                              studentName: student?.nome,
                              course: student?.curso,
                              amount: p.valorPago,
                              date: p.data,
                              status: p.estado,
                              onDownloadPdf: () => downloadReceipt(p),
                            });
                          }}
                          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition cursor-pointer"
                          title={t("Gerar & Ver QR Code de Autenticidade")}
                        >
                          <QrCode className="size-3.5" />
                        </button>

                        {/* Verify Authenticity */}
                        <button
                          onClick={() => {
                            setVerificationCode(receiptNum);
                            setIsVerifying(true);
                          }}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                          title={t("Verificar Autenticidade")}
                        >
                          <ShieldCheck className="size-3.5" />
                        </button>

                        {/* Push Notification Alert to Student */}
                        <button
                          onClick={() => {
                            setPushStudentId(p.studentId);
                            setPushReceiptNo(receiptNum);
                            setShowPushModal(true);
                          }}
                          className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition cursor-pointer"
                          title={t("Notificar Aluno via Push (Service Worker)")}
                        >
                          <Bell className="size-3.5" />
                        </button>

                        {/* Download PDF with embedded QR Code */}
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 cursor-pointer shadow-xs"
                          title={t("Descarregar PDF com QR Code")}
                        >
                          <Download className="size-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Interactive Modal: Receipt Preview */}
      {previewPayment && (
        <ReceiptPreviewModal
          payment={previewPayment}
          studentName={findStudentInStore(previewPayment.studentId)?.nome}
          studentCurso={findStudentInStore(previewPayment.studentId)?.curso}
          feeTitle={findFeeInStore(previewPayment.feeId)?.designacao}
          onClose={() => setPreviewPayment(null)}
        />
      )}

      {/* Interactive Modal: QR Code Preview */}
      {qrModalDoc && (
        <QRCodeModal
          isOpen={!!qrModalDoc}
          documentData={qrModalDoc}
          onClose={() => setQrModalDoc(null)}
        />
      )}

      {/* Interactive Modal: Receipt Verification */}
      {isVerifying && (
        <ReceiptVerificationModal
          initialCode={verificationCode}
          onClose={() => setIsVerifying(false)}
        />
      )}

      {/* Push Notification Dispatcher Modal */}
      {showPushModal && (
        <SecretaryPushDispatcherModal
          isOpen={showPushModal}
          onClose={() => setShowPushModal(false)}
          defaultCategory="new_receipt"
          defaultStudentId={pushStudentId}
          defaultReceiptNo={pushReceiptNo}
        />
      )}
    </Shell>
  );
}
