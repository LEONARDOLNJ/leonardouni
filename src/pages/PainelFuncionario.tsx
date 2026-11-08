import React, { useState } from "react";
import { Panel, Shell } from "@/components/Shell";
import { useUniStore } from "@/lib/uni-store";
import { useRole } from "@/lib/role";
import { useI18n } from "@/lib/i18n";
import {
  mzn,
  dataPt,
  CURSOS,
  type Student,
  type Fee,
  type Payment,
  type Method,
  findFee,
  findStudent,
  formatCurrency,
  type CurrencyCode,
} from "@/lib/uni-data";
import { downloadReceipt, downloadClearanceCertificate, downloadLetterhead } from "@/lib/pdf";
import { PaymentCredentialsModal } from "@/components/PaymentCredentialsModal";
import { SmsNotificationModal } from "@/components/SmsNotificationModal";
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Users,
  DollarSign,
  FileCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  Bell,
  Download,
  Key,
  RefreshCw,
  Clock,
  Sparkles,
  TrendingUp,
  CreditCard,
  Smartphone,
  PlusCircle,
  Receipt,
  FileText,
  Filter,
  UserCheck,
  ArrowRight,
  Printer,
  ChevronRight,
  Layers,
  Zap,
  Palette,
  QrCode,
  BarChart3,
} from "lucide-react";
import financeImg from "@/assets/images/financial_services_1786439400478.jpg";
import { DarkModePaletteSelector } from "@/components/DarkModePaletteSelector";
import { QRCodeModal } from "@/components/QRCodeModal";
import { DocumentDownloadsAnalyticsWidget } from "@/components/DocumentDownloadsAnalyticsWidget";
import { SecretaryPushDispatcherModal } from "@/components/SecretaryPushDispatcherModal";
import { dispatchPushNotification } from "@/lib/push-notifications";

export function PainelFuncionario() {
  const { t } = useI18n();
  const { workerProfile } = useRole();
  const {
    payments,
    students,
    fees,
    addStudent,
    payInvoiceDirect,
    recordServerPayment,
    getStudentStats,
    getStudentOutstandingInvoices,
  } = useUniStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "invoicing" | "cashier" | "treasury" | "debtors" | "approvals" | "certificates" | "gateways" | "palette_settings" | "doc_analytics"
  >("overview");

  const [currency, setCurrency] = useState<CurrencyCode>("MZN");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("Todos");

  // Modals state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushCategory, setPushCategory] = useState<"fee_deadline" | "new_receipt" | "clearance" | "secretary_alert">("fee_deadline");
  const [selectedStudentForSms, setSelectedStudentForSms] = useState<Student | undefined>(undefined);
  const [selectedStudentForPush, setSelectedStudentForPush] = useState<string | undefined>(undefined);
  const [qrModalDoc, setQrModalDoc] = useState<any | null>(null);

  // New Invoice / Charge State
  const [invoiceStudentId, setInvoiceStudentId] = useState(students[0]?.id || "EST-2024-001");
  const [invoiceFeeType, setInvoiceFeeType] = useState<"propina" | "taxa">("propina");
  const [invoiceDesignacao, setInvoiceDesignacao] = useState("Propina Complementar · Mês Corrente");
  const [invoiceValor, setInvoiceValor] = useState(18500);
  const [invoiceVencimento, setInvoiceVencimento] = useState("2026-09-15");
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);

  // Manual Cashier Payment State
  const [cashierStudentId, setCashierStudentId] = useState(students[0]?.id || "EST-2024-001");
  const [cashierFeeId, setCashierFeeId] = useState(fees[0]?.id || "PROP-01");
  const [cashierAmount, setCashierAmount] = useState(18500);
  const [cashierMethod, setCashierMethod] = useState<Method>("Mobile Money");
  const [cashierNotes, setCashierNotes] = useState("");
  const [cashierSuccess, setCashierSuccess] = useState<Payment | null>(null);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all_debtors");
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Approvals state
  const [approvalRequests, setApprovalRequests] = useState([
    {
      id: "REQ-2026-089",
      studentId: "EST-2024-001",
      studentName: "Leonardo Matsinhe",
      tipo: "Bolsa de Mérito Académico",
      curso: "Engenharia Informática · 3º Ano",
      data: "2026-08-18",
      score: "94% Elegível (GPA: 17.8/20)",
      desconto: "35% de Redução em Propinas",
      status: "Pendente de Assinatura",
    },
    {
      id: "REQ-2026-092",
      studentId: "EST-2024-006",
      studentName: "Jean-Luc Dubois",
      tipo: "Extensão de Prazo · Propina 2º Semestre",
      curso: "Engenharia Informática · 2º Ano (Internacional)",
      data: "2026-08-20",
      score: "85% Justificado (Transferência Cambial)",
      desconto: "Extensão até 30 de Setembro de 2026",
      status: "Em Análise",
    },
    {
      id: "REQ-2026-104",
      studentId: "EST-2024-004",
      studentName: "Fátima Sitoe",
      tipo: "Isenção de Taxa de Inscrição Anual",
      curso: "Medicina · 1º Ano",
      data: "2026-08-21",
      score: "90% Situação Socioeconómica Comprovada",
      desconto: "100% de Isenção na Taxa TAX-01",
      status: "Pendente de Despacho",
    },
  ]);

  // Calculations for institutional financial secretary metrics
  const calcFeeDue = (p: Payment) => {
    const fee = fees.find((f) => f.id === p.feeId);
    return Math.max((fee?.valor ?? 0) - (p.valorPago || 0), 0);
  };

  // 1. Total Facturado: Sum of all fees assigned / charged
  const totalFacturado = payments.reduce((acc, p) => {
    const f = fees.find((fee) => fee.id === p.feeId);
    return acc + (f?.valor ?? 0);
  }, 0);

  // 2. Recebido / Liquidado: Sum of settled payments
  const totalLiquidado = payments.reduce((acc, p) => acc + (p.valorPago || 0), 0);

  // 3. Pendente: Sum of unpaid amounts on pending payments
  const totalPendente = payments
    .filter((p) => p.estado === "pendente")
    .reduce((acc, p) => acc + calcFeeDue(p), 0);

  // 4. Vencido em Mora: Sum of unpaid amounts on overdue payments
  const totalVencido = payments
    .filter((p) => p.estado === "vencido")
    .reduce((acc, p) => acc + calcFeeDue(p), 0);

  // Compliance / Settlement Rate
  const taxaLiquidacao = totalFacturado > 0 ? Math.round((totalLiquidado / totalFacturado) * 100) : 100;

  // Debtors calculations
  const devedoresList = students
    .map((st) => {
      const stats = getStudentStats(st.id);
      const outstanding = getStudentOutstandingInvoices(st.id);
      const overdueCount = payments.filter((p) => p.studentId === st.id && p.estado === "vencido").length;
      return {
        student: st,
        stats,
        outstanding,
        overdueCount,
        hasDebt: stats.totalOutstanding > 0,
      };
    })
    .filter((d) => d.hasDebt);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const st = students.find((s) => s.id === p.studentId);
    const matchesSearch =
      !searchQuery ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.recibo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st?.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse =
      selectedCourseFilter === "Todos" || st?.curso === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  // Handle manual invoice launch
  const handleLaunchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newFeeId = `PROP-${Date.now().toString().slice(-4)}`;
    
    // Direct payment record creation in pending state
    recordServerPayment({
      id: `PAG-${Date.now()}`,
      studentId: invoiceStudentId,
      feeId: newFeeId,
      valorPago: 0,
      data: new Date().toISOString().split("T")[0],
      metodo: "Mobile Money",
      estado: "pendente",
      recibo: "",
    });

    // Proactively dispatch Push notification to student about the new fee/invoice
    const targetStudent = students.find((s) => s.id === invoiceStudentId);
    dispatchPushNotification({
      title: "⏰ Novo Lançamento de Propina / Taxa",
      body: `Foi lançada a cobrança de ${formatCurrency(invoiceValor, currency)} (${invoiceDesignacao}) com vencimento a ${invoiceVencimento}.`,
      category: "fee_deadline",
      studentId: invoiceStudentId,
      studentName: targetStudent?.nome,
      amount: invoiceValor,
      dueDate: invoiceVencimento,
      url: "/propinas",
    });

    setInvoiceSuccess(true);
    setTimeout(() => setInvoiceSuccess(false), 4000);
  };

  // Handle cashier counter payment & instant receipt push alert
  const handleCashierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const res = payInvoiceDirect(
      cashierStudentId,
      cashierFeeId,
      Number(cashierAmount),
      cashierMethod
    );

    if (res.success && res.payment) {
      setCashierSuccess(res.payment);

      // Instantly dispatch Service Worker push notification to the student
      const st = students.find((s) => s.id === cashierStudentId);
      dispatchPushNotification({
        title: "📄 Novo Recibo Emitido pela Secretaria",
        body: `O seu recibo oficial nº ${res.payment.recibo} (${formatCurrency(res.payment.valorPago, "MZN")}) foi liquidado e está disponível no Portal.`,
        category: "new_receipt",
        studentId: cashierStudentId,
        studentName: st?.nome,
        receiptNo: res.payment.recibo,
        amount: res.payment.valorPago,
        url: "/recibos",
      });

      setTimeout(() => setCashierSuccess(null), 6000);
    }
  };

  // Handle broadcast submission with Push Notifications
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    // Dispatch broadcast Push Notification
    dispatchPushNotification({
      title: "🏛️ Comunicado da Secretaria Financeira",
      body: broadcastMessage,
      category: "secretary_alert",
      studentId: broadcastTarget === "all_debtors" ? "debtors" : "all",
      url: "/portal",
    });

    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage("");
    }, 4000);
  };

  // Handle approval decision
  const handleApproval = (id: string, action: "deferir" | "indeferir") => {
    setApprovalRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: action === "deferir" ? "Deferido & Homologado" : "Indeferido",
            }
          : req
      )
    );
  };

  return (
    <Shell
      titulo={t("Gabinete do Secretário Financeiro")}
      descricao={t("Centro de comando financeiro, facturação institucional, tesouraria, fecho diário de caixa e controlo de liquidações.")}
      imagem={financeImg}
    >
      <div className="space-y-6">
        {/* Financial Secretary Identity & Authority Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
              <Building className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  {t("Gabinete de Finanças & Tesouraria")}
                </span>
                <span className="text-xs text-white/60">ID: {workerProfile.id}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-white mt-0.5">
                {workerProfile.name} · {t("Secretário Financeiro & Tesoureiro")}
              </h2>
              <p className="text-xs text-white/80">{workerProfile.department} · Leonardo University</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dark Mode Palette Selector in Header */}
            <div className="hidden lg:flex">
              <DarkModePaletteSelector variant="compact" />
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
              <span className="text-[11px] text-white/70 font-semibold">{t("Moeda")}:</span>
              {(["MZN", "USD", "EUR", "ZAR"] as CurrencyCode[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    currency === c
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Push Notifications Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setPushCategory("fee_deadline");
                setSelectedStudentForPush(undefined);
                setShowPushModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 text-xs font-bold transition cursor-pointer shadow-xs"
              title={t("Disparar notificações push do Service Worker para alunos")}
            >
              <Bell className="size-3.5 text-amber-300 animate-pulse" />
              <span>{t("Notificações Push (SW)")}</span>
            </button>

            {/* API Keys Shortcut */}
            <button
              type="button"
              onClick={() => setShowCredentialsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Key className="size-3.5 text-blue-300" />
              <span>{t("Chaves de API")}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Quick Palette Bar */}
        <div className="lg:hidden flex justify-end">
          <DarkModePaletteSelector variant="compact" />
        </div>

        {/* PRIMARY 4 METRIC CARDS FOR FINANCIAL SECRETARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: TOTAL FACTURADO */}
          <div className="bg-card border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-card to-card p-5 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("Total Facturado")}
              </span>
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <DollarSign className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold font-display text-foreground">
              {formatCurrency(totalFacturado, currency)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
              <span>{payments.length} {t("encargos lançados")}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">100% {t("Volume")}</span>
            </div>
          </div>

          {/* CARD 2: RECEBIDO / LIQUIDADO */}
          <div className="bg-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("Recebido / Liquidado")}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalLiquidado, currency)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
              <span>{payments.filter((p) => p.estado === "pago").length} {t("recibos emitidos")}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{taxaLiquidacao}% {t("Arrecadado")}</span>
            </div>
          </div>

          {/* CARD 3: PENDENTE */}
          <div className="bg-card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t("Pendente")}
              </span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold font-display text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPendente, currency)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
              <span>{payments.filter((p) => p.estado === "pendente").length} {t("em prazo regular")}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {totalFacturado > 0 ? Math.round((totalPendente / totalFacturado) * 100) : 0}% {t("do Total")}
              </span>
            </div>
          </div>

          {/* CARD 4: VENCIDO EM MORA */}
          <div className="bg-card border border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-card p-5 rounded-2xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-bold uppercase tracking-wider text-destructive">
                {t("Vencido em Mora")}
              </span>
              <div className="p-2 rounded-xl bg-destructive/15 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold font-display text-destructive">
              {formatCurrency(totalVencido, currency)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
              <span>{devedoresList.length} {t("alunos em atraso")}</span>
              <span className="font-bold text-destructive">
                {totalFacturado > 0 ? Math.round((totalVencido / totalFacturado) * 100) : 0}% {t("em Mora")}
              </span>
            </div>
          </div>
        </div>

        {/* FINANCIAL SECRETARY NAVIGATION TABS (ALL TRANSPORTED FEATURES) */}
        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: t("Visão Executiva"), icon: Building },
            { id: "doc_analytics", label: t("Estatísticas de Downloads"), icon: BarChart3 },
            { id: "palette_settings", label: t("Paletas Dark & Ergonomia"), icon: Palette },
            { id: "invoicing", label: t("Facturação & Lançar Guia"), icon: PlusCircle },
            { id: "cashier", label: t("Caixa de Balcão"), icon: Receipt },
            { id: "treasury", label: t("Tesouraria & Fecho Diário"), icon: DollarSign },
            { id: "debtors", label: t("Lista de Devedores & SMS"), icon: Bell },
            { id: "approvals", label: t("Isenções & Bolsas"), icon: FileCheck },
            { id: "certificates", label: t("Declarações de Quitação"), icon: ShieldCheck },
            { id: "gateways", label: t("Gateways & Chaves API"), icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: VISÃO EXECUTIVA & BALANÇO GERAL */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Operational Dispatch Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab("invoicing")}
                className="bg-card border border-border/80 hover:border-primary p-5 rounded-2xl shadow-xs transition cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition">
                    <PlusCircle className="size-5" />
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary">
                  {t("Lançar Facturação / Nova Guia")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("Emita encargos de propina semestral, multas de mora ou taxas de laboratório para estudantes.")}
                </p>
              </div>

              <div
                onClick={() => setActiveTab("cashier")}
                className="bg-card border border-border/80 hover:border-emerald-500 p-5 rounded-2xl shadow-xs transition cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
                    <Receipt className="size-5" />
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-500">
                  {t("Caixa de Balcão & Recebimentos")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("Registe pagamentos presenciais em numerário, POS ou transferência com recibo imediato.")}
                </p>
              </div>

              <div
                onClick={() => setActiveTab("debtors")}
                className="bg-card border border-border/80 hover:border-destructive p-5 rounded-2xl shadow-xs transition cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-destructive/10 text-destructive group-hover:scale-110 transition">
                    <Bell className="size-5" />
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-destructive" />
                </div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-destructive">
                  {t("Centro de Cobrança & Alertas SMS")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("Dispare notificações automáticas de mora e referências M-Pesa para os")} {devedoresList.length} {t("devedores registados.")}
                </p>
              </div>
            </div>

            {/* Revenue breakdown by course */}
            <Panel titulo={t("Facturação & Arrecadação por Faculdade / Curso")}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CURSOS.map((curso) => {
                    const cursoStudents = students.filter((s) => s.curso === curso);
                    const cursoPayments = payments.filter((p) => {
                      const st = students.find((s) => s.id === p.studentId);
                      return st?.curso === curso;
                    });
                    const cursoFacturado = cursoPayments.reduce((acc, p) => {
                      const f = fees.find((fee) => fee.id === p.feeId);
                      return acc + (f?.valor ?? 0);
                    }, 0);
                    const cursoArrecadado = cursoPayments.reduce((acc, p) => acc + (p.valorPago || 0), 0);
                    const cursoPct = cursoFacturado > 0 ? Math.round((cursoArrecadado / cursoFacturado) * 100) : 100;

                    return (
                      <div key={curso} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-foreground truncate">{curso}</h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {cursoStudents.length} {t("alunos")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("Liquidado")}:</span>
                          <span className="font-bold font-display text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(cursoArrecadado, currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("Facturado")}:</span>
                          <span className="font-bold font-display text-foreground">
                            {formatCurrency(cursoFacturado, currency)}
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(cursoPct, 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-right text-muted-foreground font-semibold">
                          {cursoPct}% {t("de cobrança regularizada")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            {/* Document Downloads Analytics Overview Card */}
            <DocumentDownloadsAnalyticsWidget
              variant="card"
              onViewDetailedReports={() => setActiveTab("doc_analytics")}
            />

            {/* Ergonomia & Paleta de Cores Card in Overview */}
            <DarkModePaletteSelector variant="card" />
          </div>
        )}

        {/* TAB: ESTATÍSTICAS & ANALYTICS DE DOWNLOADS DE DOCUMENTOS */}
        {activeTab === "doc_analytics" && (
          <DocumentDownloadsAnalyticsWidget variant="full" />
        )}

        {/* TAB 2: FACTURAÇÃO & LANÇAMENTO DE GUIAS */}
        {activeTab === "invoicing" && (
          <Panel titulo={t("Emissão & Lançamento de Guias de Cobrança Institucional")}>
            <div className="p-6 space-y-6">
              <p className="text-xs text-muted-foreground">
                {t("Crie e atribua novas obrigações de propinas, taxas de matrícula, exames ou emolumentos para estudantes no razão institucional.")}
              </p>

              <form onSubmit={handleLaunchInvoice} className="space-y-4 max-w-2xl bg-muted/20 p-5 rounded-2xl border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Estudante Destinatário")}</label>
                    <select
                      value={invoiceStudentId}
                      onChange={(e) => setInvoiceStudentId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.nome} · {st.id} ({st.curso})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Tipo de Encargo")}</label>
                    <select
                      value={invoiceFeeType}
                      onChange={(e) => setInvoiceFeeType(e.target.value as any)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="propina">{t("Propina Lectiva Semestral / Mensal")}</option>
                      <option value="taxa">{t("Taxa Administrativa / Emolumento")}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t("Designação do Encargo")}</label>
                  <input
                    type="text"
                    value={invoiceDesignacao}
                    onChange={(e) => setInvoiceDesignacao(e.target.value)}
                    placeholder="Ex.: Propina Complementar de 2º Semestre"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Valor Devido (MZN)")}</label>
                    <input
                      type="number"
                      value={invoiceValor}
                      onChange={(e) => setInvoiceValor(Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Data Limite de Vencimento")}</label>
                    <input
                      type="date"
                      value={invoiceVencimento}
                      onChange={(e) => setInvoiceVencimento(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  <PlusCircle className="size-4" />
                  <span>{t("Emitir e Lançar Guia de Pagamento")}</span>
                </button>

                {invoiceSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{t("Guia de cobrança lançada com sucesso no razão do estudante!")}</span>
                  </div>
                )}
              </form>
            </div>
          </Panel>
        )}

        {/* TAB 3: CAIXA DE BALCÃO / REGISTO MANUAL */}
        {activeTab === "cashier" && (
          <Panel titulo={t("Módulo de Caixa de Balcão & Recebimento Presencial")}>
            <div className="p-6 space-y-6">
              <p className="text-xs text-muted-foreground">
                {t("Efectue o registo imediato de pagamentos recebidos ao balcão em numerário, cartão no terminal POS ou depósito directo.")}
              </p>

              <form onSubmit={handleCashierPayment} className="space-y-4 max-w-2xl bg-muted/20 p-5 rounded-2xl border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Estudante")}</label>
                    <select
                      value={cashierStudentId}
                      onChange={(e) => setCashierStudentId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.nome} · {st.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Encargo a Liquidar")}</label>
                    <select
                      value={cashierFeeId}
                      onChange={(e) => {
                        setCashierFeeId(e.target.value);
                        const f = fees.find((fee) => fee.id === e.target.value);
                        if (f) setCashierAmount(f.valor);
                      }}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {fees.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.designacao} ({mzn(f.valor)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Valor Pago (MZN)")}</label>
                    <input
                      type="number"
                      value={cashierAmount}
                      onChange={(e) => setCashierAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">{t("Canal / Método de Caixa")}</label>
                    <select
                      value={cashierMethod}
                      onChange={(e) => setCashierMethod(e.target.value as any)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Mobile Money">Vodacom M-Pesa / Mobile Money</option>
                      <option value="Cartão">Cartão Bancário (POS Balcão)</option>
                      <option value="Transferência Bancária">Transferência Bancária (BIM / BCI)</option>
                      <option value="Debito Pay">Debito Pay Express</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Receipt className="size-4" />
                  <span>{t("Registar Recebimento & Emitir Recibo")}</span>
                </button>

                {cashierSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{t("Pagamento validado e conciliado no caixa!")}</span>
                    </div>
                    <p className="text-[11px]">
                      {t("Recibo:")} <strong>{cashierSuccess.recibo || cashierSuccess.id}</strong> · {t("Valor:")} <strong>{mzn(cashierSuccess.valorPago)}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => downloadReceipt(cashierSuccess)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>{t("Descarregar Recibo Oficial (PDF)")}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </Panel>
        )}

        {/* TAB 4: TESOURARIA & FECHO DIÁRIO */}
        {activeTab === "treasury" && (
          <Panel titulo={t("Fecho de Caixa Diário & Reconciliação Bancária")}>
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {t("Relatório Diário de Liquidações —")} {new Date().toLocaleDateString("pt-MZ")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t("Reconciliação automática de pagamentos Vodacom M-Pesa C2B, DebitoPay e Transferências.")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8,ID,Estudante,Encargo,Valor,Metodo,Data\n" +
                      payments
                        .filter((p) => p.estado === "pago")
                        .map((p) => `${p.id},${p.studentId},${p.feeId},${p.valorPago},${p.metodo},${p.data}`)
                        .join("\n");
                    const encoded = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encoded);
                    link.setAttribute("download", `fecho_caixa_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>{t("Descarregar Fecho de Caixa (CSV)")}</span>
                </button>
              </div>

              {/* Transactions in treasury */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left uppercase text-muted-foreground tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Recibo</th>
                      <th className="py-2.5 px-3">Estudante</th>
                      <th className="py-2.5 px-3">Canal</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3 text-right">Valor Arrecadado</th>
                      <th className="py-2.5 px-3 text-center">Acção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {payments
                      .filter((p) => p.estado === "pago")
                      .map((p) => {
                        const st = students.find((s) => s.id === p.studentId);
                        return (
                          <tr key={p.id} className="hover:bg-muted/20 transition">
                            <td className="py-3 px-3 font-mono font-bold text-foreground">
                              {p.recibo || p.id}
                            </td>
                            <td className="py-3 px-3 font-medium">
                              {st?.nome || p.studentId}
                              <span className="block text-[10px] text-muted-foreground">
                                {p.studentId}
                              </span>
                            </td>
                            <td className="py-3 px-3">{p.metodo}</td>
                            <td className="py-3 px-3 text-muted-foreground">{dataPt(p.data)}</td>
                            <td className="py-3 px-3 text-right font-display font-bold text-emerald-600 dark:text-emerald-400">
                              {mzn(p.valorPago)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => downloadReceipt(p)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                <Download className="size-3" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        )}

        {/* TAB 5: GESTÃO DE DEVEDORES & NOTIFICAÇÕES SMS */}
        {activeTab === "debtors" && (
          <div className="space-y-6">
            <Panel titulo={`${devedoresList.length} ${t("Estudantes com Propinas / Encargos em Atraso")}`}>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {t("Lista consolidada de estudantes com saldo devedor ou prestações em mora.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForSms(undefined);
                      setShowSmsModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Bell className="size-3.5" />
                    <span>{t("Disparar Lembrete SMS para Todos")}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left uppercase text-muted-foreground tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Estudante</th>
                        <th className="py-2.5 px-3">Curso & Ano</th>
                        <th className="py-2.5 px-3 text-right">Total Facturado</th>
                        <th className="py-2.5 px-3 text-right">Saldo em Dívida</th>
                        <th className="py-2.5 px-3 text-center">Acções de Cobrança</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {devedoresList.map(({ student: st, stats, overdueCount }) => (
                        <tr key={st.id} className="hover:bg-muted/20 transition">
                          <td className="py-3 px-3">
                            <span className="font-bold text-foreground block">{st.nome}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{st.id}</span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {st.curso} · {st.ano}º ano
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {mzn(stats.totalInvoiced)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-destructive font-display">
                            {mzn(stats.totalOutstanding)}
                            {overdueCount > 0 && (
                              <span className="block text-[10px] text-destructive/80 font-normal">
                                ({overdueCount} {t("em mora")})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForSms(st);
                                  setShowSmsModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition cursor-pointer"
                              >
                                <Send className="size-3" />
                                <span>{t("SMS")}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCashierStudentId(st.id);
                                  setActiveTab("cashier");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition cursor-pointer"
                              >
                                <Receipt className="size-3" />
                                <span>{t("Liquidar")}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* TAB 6: ISENÇÕES, BOLSAS & EXTENSÕES */}
        {activeTab === "approvals" && (
          <Panel titulo={t("Mesa de Análise de Isenções, Bolsas & Extensões de Prazo")}>
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                {t("Processos submetidos pelos estudantes a aguardar despacho formal da Direcção Académica ou Tesouraria.")}
              </p>

              <div className="space-y-3">
                {approvalRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {req.id}
                        </span>
                        <h4 className="font-bold text-sm text-foreground">{req.tipo}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          req.status.includes("Deferido")
                            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                            : req.status.includes("Indeferido")
                            ? "bg-destructive/15 text-destructive border border-destructive/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("Requerente")}: <strong className="text-foreground">{req.studentName}</strong> · {req.curso}
                      </p>
                      <p className="text-[11px] text-primary flex items-center gap-1 font-semibold">
                        <Sparkles className="size-3" />
                        <span>{t("Avaliação IA")}: {req.score} — {req.desconto}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproval(req.id, "deferir")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        {t("Deferir / Homologar")}
                      </button>
                      <button
                        onClick={() => handleApproval(req.id, "indeferir")}
                        className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition cursor-pointer"
                      >
                        {t("Indeferir")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* TAB 7: DECLARAÇÕES DE QUITAÇÃO TOTAL */}
        {activeTab === "certificates" && (
          <Panel titulo={t("Emissão de Declarações de Quitação & Minutas Timbradas")}>
            <div className="p-6 space-y-6">
              <p className="text-xs text-muted-foreground">
                {t("Emita declarações oficiais de quitação de propinas com selo digital e código QR para estudantes regularizados.")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((st) => {
                  const stats = getStudentStats(st.id);
                  const isClean = stats.totalOutstanding === 0;
                  return (
                    <div key={st.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-foreground">{st.nome}</h5>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isClean
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/15 text-amber-600 border border-amber-500/20"
                          }`}>
                            {isClean ? t("Quitação Total") : t("Pendente")}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {st.id} · {st.curso}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const certRef = `DECL-UL-2026-${st.id.replace(/[^0-9]/g, "") || "784912"}`;
                            setQrModalDoc({
                              code: certRef,
                              title: `Declaração de Quitação · ${st.nome}`,
                              type: "CERTIFICADO_QUITACAO",
                              studentId: st.id,
                              studentName: st.nome,
                              course: st.curso,
                              amount: stats.totalPaid,
                              date: new Date().toISOString(),
                              status: isClean ? "Regularizado" : "Pendente",
                              onDownloadPdf: () => downloadClearanceCertificate(st, stats, payments),
                            });
                          }}
                          className="p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                          title={t("Gerar QR Code de Validação")}
                        >
                          <QrCode className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadClearanceCertificate(st, stats, payments)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer shrink-0"
                        >
                          <Download className="size-3.5" />
                          <span>{t("Emitir PDF")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-foreground">{t("Modelos Timbrados Institucionais:")}</span>
                <button
                  type="button"
                  onClick={() => downloadLetterhead("financas")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold transition cursor-pointer"
                >
                  {t("Papel Timbrado · Finanças")}
                </button>
                <button
                  type="button"
                  onClick={() => downloadLetterhead("declaracao")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold transition cursor-pointer"
                >
                  {t("Papel Timbrado · Declaração")}
                </button>
              </div>
            </div>
          </Panel>
        )}

        {/* TAB 8: GATEWAYS DE PAGAMENTO & CHAVES API */}
        {activeTab === "gateways" && (
          <Panel titulo={t("Gateways de Pagamento & Configuração de Chaves de API")}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-700 dark:text-purple-300">
                    <Zap className="size-4 text-purple-500" />
                    <span>Debito Pay Gateway</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Gateway instantâneo para pagamentos em Moçambique com M-Pesa, e-Mola e cartões.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCredentialsModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer pt-1"
                  >
                    <span>{t("Configurar Chaves DebitoPay")}</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                    <Smartphone className="size-4 text-emerald-500" />
                    <span>Vodacom M-Pesa C2B API</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Integração directa de Shortcode, Consumer Key e Push USSD C2B da Vodacom Moçambique.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCredentialsModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer pt-1"
                  >
                    <span>{t("Configurar Shortcode 171717")}</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-300">
                    <CreditCard className="size-4 text-blue-500" />
                    <span>Base Pay & On-Chain L2</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Liquidação internacional descentralizada em USDC na rede Base sem spread cambial.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCredentialsModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-1"
                  >
                    <span>{t("Verificar Smart Contracts")}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-foreground">{t("Painel Completo de Credenciais")}</h5>
                  <p className="text-xs text-muted-foreground">
                    {t("Abra a consola modal de chaves para editar merchant tokens, chaves públicas e webhooks.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  {t("Abrir Gestor de Chaves")}
                </button>
              </div>
            </div>
          </Panel>
        )}

        {/* TAB 9: PALETAS DARK MODE & ERGONOMIA VISUAL */}
        {activeTab === "palette_settings" && (
          <div className="space-y-6">
            <DarkModePaletteSelector variant="card" />

            {/* Practical preview cards with realistic financial data to test readability */}
            <Panel titulo={t("Teste de Acessibilidade & Contraste em Tempo Real")}>
              <div className="p-6 space-y-5">
                <p className="text-xs text-muted-foreground">
                  {t("Veja como os recibos, tabelas financeiras, gráficos e alertas aparecem com a paleta selecionada:")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sample 1: Financial Balance Card */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        {t("Liquidação Global")}
                      </span>
                      <span className="text-emerald-500 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        +14.8% vs 2025
                      </span>
                    </div>
                    <p className="text-xl font-extrabold font-display text-foreground">
                      {formatCurrency(totalLiquidado, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("Total arrecadado em propinas regulares.")}
                    </p>
                  </div>

                  {/* Sample 2: Alert / Notice Card */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <AlertTriangle className="size-4" />
                      <span>{t("Notificação de Vencimento")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("Exemplo de contraste em caixas de aviso e termos de cobrança.")}
                    </p>
                    <div className="text-[11px] font-mono text-foreground font-semibold">
                      REC-2026-0891 · Mês Corrente
                    </div>
                  </div>

                  {/* Sample 3: Actionable Button & Input */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{t("Interação de Balcão")}</span>
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value="EST-2024-001 · Leonardo Matsinhe"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground font-mono"
                    />
                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs"
                    >
                      {t("Simular Emissão de Recibo")}
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showCredentialsModal && (
        <PaymentCredentialsModal onClose={() => setShowCredentialsModal(false)} />
      )}

      {showSmsModal && (
        <SmsNotificationModal
          initialStudent={selectedStudentForSms}
          onClose={() => setShowSmsModal(false)}
        />
      )}

      {showPushModal && (
        <SecretaryPushDispatcherModal
          isOpen={showPushModal}
          onClose={() => setShowPushModal(false)}
          defaultCategory={pushCategory}
          defaultStudentId={selectedStudentForPush}
        />
      )}

      {qrModalDoc && (
        <QRCodeModal
          isOpen={!!qrModalDoc}
          documentData={qrModalDoc}
          onClose={() => setQrModalDoc(null)}
        />
      )}
    </Shell>
  );
}
