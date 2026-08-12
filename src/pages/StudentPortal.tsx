import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { useWeb3 } from "@/lib/web3-base";
import { Shell, Panel, StatusBadge } from "@/components/Shell";
import { MobileMoneyRefModal } from "@/components/MobileMoneyRefModal";
import { StudentCardModal } from "@/components/StudentCardModal";
import { ScholarshipRequestModal } from "@/components/ScholarshipRequestModal";
import { PayInvoiceModal } from "@/components/PayInvoiceModal";
import { useUniStore } from "@/lib/uni-store";
import {
  payments as initialPayments,
  fees,
  formatCurrency,
  dataPt,
  UNIVERSITY,
  type Payment,
  type Fee,
} from "@/lib/uni-data";
import { downloadReceipt, downloadClearanceCertificate } from "@/lib/pdf";
import {
  User,
  GraduationCap,
  CreditCard,
  Download,
  Globe,
  DollarSign,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  LogOut,
  Mail,
  ShieldCheck,
  BookOpen,
  QrCode,
  Award,
  Sparkles,
} from "lucide-react";
import heroImg from "@/assets/campus-hero.jpg";

export function StudentPortal() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { address, walletType, balanceUsdc, networkName, signInWithBase } = useWeb3();
  const { getStudentPayments, getStudentOutstandingInvoices, getStudentStats } = useUniStore();

  const [selectedCurrency, setSelectedCurrency] = useState<"MZN" | "USD" | "EUR">("MZN");
  const [mobileModalPayment, setMobileModalPayment] = useState<Payment | null>(null);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<{
    fee: Fee;
    payment?: Payment;
    dueAmount: number;
  } | null>(null);

  if (!user) {
    return (
      <Shell
        titulo="Portal do Estudante"
        descricao="Área reservada aos estudantes matriculados na Leonardo University."
        imagem={heroImg}
      >
        <div className="mx-auto max-w-lg py-12 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-7" />
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">
            {t("Nenhuma Sessão Iniciada")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("Por favor efectue o login para ter acesso ao seu portal de propinas, declarações e pagamentos.")}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs"
          >
            <User className="size-4" />
            <span>{t("Ir para a Página de Login")}</span>
          </button>
        </div>
      </Shell>
    );
  }

  // Filter payments for logged in student using uni store
  const studentPayments = getStudentPayments(user.id);
  const stats = getStudentStats(user.id);
  const outstandingInvoices = getStudentOutstandingInvoices(user.id);

  const totalInvoiced = stats.totalInvoiced;
  const totalPaid = stats.totalPaid;
  const totalOutstanding = stats.totalOutstanding;

  const pendingPayments = studentPayments.filter((p) => p.estado !== "pago");
  const paidPayments = studentPayments.filter((p) => p.estado === "pago");

  const isFullySettled = totalOutstanding === 0;

  return (
    <Shell
      titulo={`Portal Pessoal · ${user.nome}`}
      descricao={`Painel académico e financeiro de ${user.nome} (${user.id}) · Leonardo University.`}
      imagem={heroImg}
    >
      <div className="space-y-8">
        {/* Student Profile & Currency Selector Header */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex size-14 items-center justify-center rounded-full bg-primary font-display font-bold text-2xl text-primary-foreground shadow-xs overflow-hidden border border-border">
                {user.foto ? (
                  <img
                    src={user.foto}
                    alt={user.nome}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                ) : (
                  user.nome.charAt(0)
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                    {user.nome}
                  </h1>
                  {user.isInternational ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <Globe className="size-3.5" />
                      {t("Estudante Internacional")} ({user.nacionalidade})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {t("Estudante Nacional")}
                    </span>
                  )}

                  {address && walletType === "base" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/30 px-2.5 py-0.5 text-xs font-extrabold text-[#0052FF] dark:text-blue-400">
                      <ShieldCheck className="size-3.5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      <span>Autenticado com Base Account</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Nº {user.id} · {user.curso} ({user.ano}º Ano) · {user.tipoDocumento || "BI/Passaporte"}: {user.docId}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Currency selector, Actions & Logout */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowStudentCard(true)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition shadow-xs"
              >
                <QrCode className="size-3.5" />
                <span>{t("Cartão Digital")}</span>
              </button>

              <button
                onClick={() => setShowScholarshipModal(true)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition shadow-xs"
              >
                <Award className="size-3.5" />
                <span>{t("Solicitar Bolsa / Apoio")}</span>
              </button>

              <div className="flex items-center gap-1 rounded-sm border border-border bg-muted/30 p-1 text-xs">
                <span className="px-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <DollarSign className="size-3" />
                  {t("Moeda")}:
                </span>
                {(["MZN", "USD", "EUR"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`rounded-xs px-2 py-1 font-bold text-[11px] transition ${
                      selectedCurrency === curr
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="size-3.5" />
                <span>{t("Sair")}</span>
              </button>
            </div>
          </div>

          {/* Base Blockchain & Base Pay Integration Card */}
          <div className="rounded-sm border border-blue-500/30 bg-blue-950/15 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Globe className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Base Blockchain & Base Pay
                  </h3>
                  <a
                    href="https://docs.base.org/get-started/base"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-300 hover:underline flex items-center gap-0.5"
                  >
                    <span>docs.base.org</span>
                    <Sparkles className="size-2.5" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {address
                    ? `Conectado via ${walletType === "base" ? "Base Account" : "Ethereum Wallet"}: ${address.slice(0, 6)}...${address.slice(-4)}`
                    : "Pague propinas em dólar digital (USDC) sem taxas através da rede Base (L2 de Ethereum)."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {address ? (
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                    Saldo USDC (Base)
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-400">
                    ${balanceUsdc} USDC
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => signInWithBase()}
                  className="rounded-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                >
                  Conectar Base Account
                </button>
              )}
            </div>
          </div>

          {/* Student Financial Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-border bg-muted/20 p-4 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                {t("Total Facturado")}
              </span>
              <p className="text-lg font-bold font-display text-foreground">
                {formatCurrency(totalInvoiced, selectedCurrency)}
              </p>
            </div>

            <div className="rounded-sm border border-success/30 bg-success/10 p-4 space-y-1">
              <span className="text-[11px] font-semibold text-success uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                {t("Total Liquidado")}
              </span>
              <p className="text-lg font-bold font-display text-foreground">
                {formatCurrency(totalPaid, selectedCurrency)}
              </p>
            </div>

            <div
              className={`rounded-sm border p-4 space-y-1 ${
                totalOutstanding > 0
                  ? "border-warning/40 bg-warning/10"
                  : "border-success/30 bg-success/10"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider block flex items-center gap-1 text-foreground">
                <Clock className="size-3.5" />
                {t("Saldo Pendente / Em Dívida")}
              </span>
              <p className="text-lg font-bold font-display text-foreground">
                {formatCurrency(totalOutstanding, selectedCurrency)}
              </p>
            </div>
          </div>
        </div>

        {/* Clearance Certificate or Outstanding Notification Banner */}
        {isFullySettled ? (
          <div className="rounded-sm border border-success/30 bg-success/10 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-success/20 text-success">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("Situação Financeira Regularizada")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("Não possui propinas nem taxas pendentes na Leonardo University. Pode obter a sua Declaração de Quitação em PDF.")}
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadClearanceCertificate(user, { totalInvoiced, totalPaid, totalOutstanding }, studentPayments)}
              className="inline-flex items-center gap-2 rounded-sm bg-success px-4 py-2 text-xs font-semibold text-success-foreground hover:opacity-90 transition shadow-xs"
            >
              <Download className="size-4" />
              <span>{t("Descarregar Declaração de Quitação PDF")}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-sm border border-warning/40 bg-warning/10 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("Propinas Pendentes de Regularização")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("Regularize o seu saldo pendente para manter o acesso às avaliações e exames da época.")}
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadClearanceCertificate(user, { totalInvoiced, totalPaid, totalOutstanding }, studentPayments)}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              <FileCheck className="size-4 text-primary" />
              <span>{t("Descarregar Extrato Financeiro PDF")}</span>
            </button>
          </div>
        )}

        {/* Pending Charges Section */}
        {pendingPayments.length > 0 && (
          <Panel titulo={t("Propinas & Taxas a Regularizar")}>
            <div className="divide-y divide-border">
              {pendingPayments.map((p) => {
                const fee = fees.find((f) => f.id === p.feeId);
                const dueAmount = (fee?.valor ?? 0) - p.valorPago;
                return (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {fee?.designacao}
                        </span>
                        <StatusBadge estado={p.estado} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("Vencimento")}: {dataPt(fee?.vencimento || p.data)} · {t("Método preferencial")}: {p.metodo}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block uppercase">
                          {t("Valor a Pagar")}
                        </span>
                        <span className="text-base font-bold text-foreground font-display">
                          {formatCurrency(dueAmount, selectedCurrency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMobileModalPayment(p)}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                        >
                          <Smartphone className="size-3.5" />
                          <span>{t("Ver Referência M-Pesa")}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (fee) {
                              setSelectedPayInvoice({
                                fee,
                                payment: p,
                                dueAmount,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs"
                        >
                          <CreditCard className="size-3.5" />
                          <span>{t("Pagar Agora")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Settled Receipts Section */}
        <Panel titulo={t("Histórico de Pagamentos & Recibos Emitidos")}>
          {paidPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {t("Ainda não foram emitidos recibos para esta conta de estudante.")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">{t("Recibo")}</th>
                    <th className="px-4 py-3">{t("Encargo")}</th>
                    <th className="px-4 py-3">{t("Data")}</th>
                    <th className="px-4 py-3">{t("Método")}</th>
                    <th className="px-4 py-3">{t("Valor Pago")}</th>
                    <th className="px-4 py-3 text-right">{t("Acção")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paidPayments.map((p) => {
                    const fee = fees.find((f) => f.id === p.feeId);
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition">
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {p.recibo || "REC-AUT"}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {fee?.designacao}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {dataPt(p.data)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.metodo}
                        </td>
                        <td className="px-4 py-3 font-bold font-display text-foreground">
                          {formatCurrency(p.valorPago, selectedCurrency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => downloadReceipt(p)}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition"
                          >
                            <Download className="size-3.5" />
                            <span>{t("Descarregar Recibo PDF")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Guidance for International Students */}
        {user.isInternational && (
          <div className="rounded-sm border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Globe className="size-4" />
              <span>{t("Guia do Estudante Internacional · Leonardo University")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("Como estudante internacional registado com passaporte")} <strong>{user.docId}</strong>, {t("pode efectuar a liquidação das suas propinas em Meticais (MZN), Dólares (USD) ou Euros (EUR) via Transferência Bancária SWIFT ou Cartão de Crédito/Débito Internacional.")}
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="rounded-sm border border-border bg-card p-3 space-y-1">
                <span className="font-semibold text-foreground block">{t("Conta SWIFT / IBAN Internacional")}:</span>
                <p className="text-muted-foreground font-mono text-[11px]">BIM: MZ59 0001 0000 0012 3456 7890 1</p>
                <p className="text-muted-foreground font-mono text-[11px]">SWIFT Code: BIMOMZMA</p>
              </div>
              <div className="rounded-sm border border-border bg-card p-3 space-y-1">
                <span className="font-semibold text-foreground block">{t("Validação de Visto de Estudante")}:</span>
                <p className="text-muted-foreground text-[11px]">{t("A declaração de quitação servirá de comprovativo para renovação do DIRE junto dos serviços de migração.")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {mobileModalPayment && (
        <MobileMoneyRefModal
          fee={fees.find((f) => f.id === mobileModalPayment.feeId)}
          student={user}
          onClose={() => setMobileModalPayment(null)}
        />
      )}

      {showStudentCard && (
        <StudentCardModal
          student={user}
          onClose={() => setShowStudentCard(false)}
        />
      )}

      {showScholarshipModal && (
        <ScholarshipRequestModal
          student={user}
          onClose={() => setShowScholarshipModal(false)}
        />
      )}

      {selectedPayInvoice && (
        <PayInvoiceModal
          student={user}
          fee={selectedPayInvoice.fee}
          payment={selectedPayInvoice.payment}
          dueAmount={selectedPayInvoice.dueAmount}
          onClose={() => setSelectedPayInvoice(null)}
        />
      )}
    </Shell>
  );
}

