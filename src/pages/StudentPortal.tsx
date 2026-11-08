import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { useWeb3 } from "@/lib/web3-base";
import { useSubscription } from "@/lib/subscription-store";
import { Shell, Panel, StatusBadge } from "@/components/Shell";
import { MobileMoneyRefModal } from "@/components/MobileMoneyRefModal";
import { StudentCardModal } from "@/components/StudentCardModal";
import { ScholarshipRequestModal } from "@/components/ScholarshipRequestModal";
import { PayInvoiceModal } from "@/components/PayInvoiceModal";
import { StudentActivityTrackerModal } from "@/components/StudentActivityTrackerModal";
import { StudentProfileEditModal } from "@/components/StudentProfileEditModal";
import { BiometricVerificationModal } from "@/components/BiometricVerificationModal";
import {
  BiometricSecuritySettingsModal,
  BiometricSecuritySettingsView,
} from "@/components/BiometricSecuritySettingsModal";
import { OfflineDocumentsHub } from "@/components/OfflineDocumentsHub";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { useUniStore } from "@/lib/uni-store";
import {
  fees,
  formatCurrency,
  dataPt,
  mzn,
  type Payment,
  type Fee,
  type Student,
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
  Database,
  MapPin,
  Activity,
  History,
  FileText,
  Layers,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Edit3,
  Calendar,
  Zap,
  Phone,
  Check,
  ChevronRight,
  Shield,
  HelpCircle,
  Fingerprint,
  ScanFace,
  HardDrive,
  WifiOff,
} from "lucide-react";
import heroImg from "@/assets/campus-hero.jpg";

interface AcademicRequest {
  id: string;
  protocol: string;
  studentId: string;
  studentName: string;
  requestType: string;
  category: string;
  title: string;
  reason: string;
  description?: string;
  status: "Submetido" | "Em Análise" | "Aprovado" | "Pendente";
  aiEvaluation?: {
    eligible: boolean;
    score: number;
    discountPercent: number;
    recommendation: string;
  };
  createdAt: string;
}

interface GeneratedDocRecord {
  id: string;
  docType: string;
  title: string;
  fileName: string;
  reference: string;
  generatedAt: string;
}

export function StudentPortal() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { address, walletType, balanceUsdc, networkName, signInWithBase } = useWeb3();
  const { subscription } = useSubscription();
  const { getStudentPayments, getStudentOutstandingInvoices, getStudentStats } = useUniStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "generated" | "offline_docs" | "requests" | "activity" | "security"
  >("overview");

  const [selectedCurrency, setSelectedCurrency] = useState<"MZN" | "USD" | "EUR" | "ZAR">("MZN");
  const [mobileModalPayment, setMobileModalPayment] = useState<Payment | null>(null);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showBiometricSecurityModal, setShowBiometricSecurityModal] = useState(false);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<{
    fee: Fee;
    payment?: Payment;
    dueAmount: number;
  } | null>(null);

  // Filters & State
  const [paymentFilterMethod, setPaymentFilterMethod] = useState<string>("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [serverActivities, setServerActivities] = useState<any[]>([]);
  const [serverLocations, setServerLocations] = useState<any[]>([]);
  const [serverRequests, setServerRequests] = useState<AcademicRequest[]>([]);
  const [serverGeneratedDocs, setServerGeneratedDocs] = useState<GeneratedDocRecord[]>([]);
  const [loadingServerData, setLoadingServerData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Fetch full student history from backend
  const fetchStudentFullHistory = async () => {
    if (!user?.id) return;
    setLoadingServerData(true);
    try {
      // 1. Fetch Profile & Activities & Payments from MongoDB
      const resProfile = await fetch(`/api/user/profile?studentId=${encodeURIComponent(user.id)}`);
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.activities && Array.isArray(data.activities)) {
          setServerActivities(data.activities);
        }
        if (data.locations && Array.isArray(data.locations)) {
          setServerLocations(data.locations);
        }
      }

      // 2. Fetch Academic Requests
      const resReq = await fetch(`/api/requests?studentId=${encodeURIComponent(user.id)}`);
      if (resReq.ok) {
        const data = await resReq.json();
        if (data.requests && Array.isArray(data.requests)) {
          setServerRequests(data.requests);
        }
      }

      // 3. Fetch Generated Documents History
      const resDocs = await fetch(`/api/documents/history?studentId=${encodeURIComponent(user.id)}`);
      if (resDocs.ok) {
        const data = await resDocs.json();
        if (data.documents && Array.isArray(data.documents)) {
          setServerGeneratedDocs(data.documents);
        }
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Failed to fetch full student history:", err);
    } finally {
      setLoadingServerData(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStudentFullHistory();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <Shell
        titulo="Perfil & Portal do Estudante"
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
            {t("Por favor efectue o login para ter acesso ao seu perfil pessoal, histórico completo de pagamentos, solicitações e itens gerados.")}
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

  // Handle Log and Download of Clearance Certificate
  const handleDownloadClearance = async () => {
    downloadClearanceCertificate(
      user,
      { totalInvoiced, totalPaid, totalOutstanding },
      studentPayments
    );
    try {
      await fetch("/api/documents/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          docType: isFullySettled ? "DECLARACAO_QUITACAO_PDF" : "EXTRATO_FINANCEIRO_PDF",
          title: isFullySettled ? "Declaração de Quitação Financeira" : "Extrato Financeiro Global",
          fileName: `${isFullySettled ? "declaracao_quitacao" : "extrato_financeiro"}_${user.id}.pdf`,
          reference: `DECL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });
      fetchStudentFullHistory();
    } catch (e) {
      console.warn(e);
    }
  };

  // Handle Log and Download of Student Card
  const handleDownloadStudentCard = async () => {
    setShowStudentCard(true);
    try {
      await fetch("/api/documents/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          docType: "CARTAO_ESTUDANTE_QR",
          title: "Cartão Digital de Estudante com QR Code",
          fileName: `cartao_estudante_${user.id}.pdf`,
          reference: `CRD-${user.id}`,
        }),
      });
      fetchStudentFullHistory();
    } catch (e) {
      console.warn(e);
    }
  };

  // Filtered Payments List
  const filteredPayments = paidPayments.filter((p) => {
    const matchesMethod =
      paymentFilterMethod === "all" ||
      (paymentFilterMethod === "mpesa" && (p.metodo.toLowerCase().includes("m-pesa") || p.metodo.toLowerCase().includes("mobile"))) ||
      (paymentFilterMethod === "card" && (p.metodo.toLowerCase().includes("cartão") || p.metodo.toLowerCase().includes("card") || p.metodo.toLowerCase().includes("dpo"))) ||
      (paymentFilterMethod === "crypto" && (p.metodo.toLowerCase().includes("crypto") || p.metodo.toLowerCase().includes("base") || p.metodo.toLowerCase().includes("usdc"))) ||
      (paymentFilterMethod === "debitopay" && p.metodo.toLowerCase().includes("debito"));

    const fee = fees.find((f) => f.id === p.feeId);
    const searchTarget = `${p.recibo} ${fee?.designacao || ""} ${p.metodo}`.toLowerCase();
    const matchesSearch = !paymentSearch || searchTarget.includes(paymentSearch.toLowerCase());

    return matchesMethod && matchesSearch;
  });

  // Count combined generated items
  const totalGeneratedCount =
    paidPayments.length +
    serverGeneratedDocs.length +
    (isFullySettled ? 1 : 0) +
    1; // 1 for student card

  return (
    <Shell
      titulo={`Perfil & Histórico · ${user.nome}`}
      descricao={`Painel centralizado de perfil, histórico de atividades, pagamentos e itens gerados de ${user.nome} (${user.id}).`}
      imagem={heroImg}
    >
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* TOP PROFILE CARD */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="relative group">
                <div className="flex size-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-primary/90 to-accent font-display font-bold text-2xl text-primary-foreground shadow-md overflow-hidden border-2 border-primary/40">
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
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  title={t("Editar Fotografia")}
                  className="absolute -bottom-1 -right-1 rounded-xl bg-foreground text-background p-1.5 shadow-md hover:scale-105 transition cursor-pointer"
                >
                  <Edit3 className="size-3" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground leading-tight tracking-tight">
                    {user.nome}
                  </h1>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
                    {user.id}
                  </span>

                  {user.isInternational ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Globe className="size-3.5" />
                      {t("Estudante Internacional")} ({user.nacionalidade || "Internacional"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      {t("Estudante Nacional")} ({user.nacionalidade || "Moçambique"})
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Sparkles className="size-3 text-amber-500" />
                    {subscription.planName}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-foreground">{user.curso}</span>
                  <span>·</span>
                  <span className="font-medium">{user.ano}º Ano Académico</span>
                  <span>·</span>
                  <span>
                    {user.tipoDocumento || "BI / Passaporte"}:{" "}
                    <strong className="font-mono text-foreground font-bold">{user.docId}</strong>
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Mail className="size-3.5 text-primary" />
                    <span>{user.email}</span>
                  </div>

                  {(user as any).telefone && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone className="size-3.5 text-emerald-500" />
                      <span>{(user as any).telefone}</span>
                    </div>
                  )}

                  {(user as any).endereco && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="size-3.5 text-amber-500" />
                      <span className="truncate max-w-[220px]">{(user as any).endereco}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Profile Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition shadow-2xs cursor-pointer"
              >
                <Edit3 className="size-3.5 text-primary" />
                <span>{t("Editar Perfil")}</span>
              </button>

              <button
                onClick={handleDownloadStudentCard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition shadow-2xs cursor-pointer"
              >
                <QrCode className="size-3.5" />
                <span>{t("Cartão Digital QR")}</span>
              </button>

              <button
                onClick={() => setShowScholarshipModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition shadow-2xs cursor-pointer"
              >
                <Award className="size-3.5" />
                <span>{t("Solicitar Bolsa")}</span>
              </button>

              <button
                onClick={() => setShowBiometricSecurityModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>{t("Configurar Biometria")}</span>
              </button>

              {/* Currency Selector */}
              <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted/40 p-1 text-xs">
                <span className="px-1.5 text-[11px] font-bold text-muted-foreground">
                  <DollarSign className="size-3.5 inline mr-0.5 text-primary" />
                </span>
                {(["MZN", "USD", "EUR", "ZAR"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`rounded-lg px-2.5 py-1 font-extrabold text-[11px] transition cursor-pointer ${
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition cursor-pointer"
                title={t("Terminar Sessão")}
              >
                <LogOut className="size-3.5" />
                <span>{t("Sair")}</span>
              </button>
            </div>
          </div>

          {/* Web3 & Base Account Integration Status Strip */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/25 via-blue-900/15 to-transparent p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0 shadow-xs">
                <Globe className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">
                    Base Blockchain (Ethereum L2)
                  </span>
                  {address && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      <Check className="size-2.5" />
                      Carteira Conectada
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {address
                    ? `Endereço: ${address.slice(0, 8)}...${address.slice(-6)} · Protocolo: ${walletType === "base" ? "Base Account" : "Web3 Standard"}`
                    : "Conecte a sua Base Account para pagamentos sem taxas de propinas em USDC e certificações on-chain."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {address ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block font-bold">
                      Saldo USDC (Base)
                    </span>
                    <span className="font-mono text-sm font-extrabold text-blue-400">
                      ${balanceUsdc} USDC
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 p-2 transition shadow-xs"
                    title="Ver no Basescan"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => signInWithBase()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  <span>Conectar Base Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Biometric Credentials & Passkey Status Strip */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-emerald-900/10 to-transparent p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-xs">
                <Fingerprint className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                    {t("Autenticação Biométrica & Passkey WebAuthn")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-2.5" />
                    {t("Dispositivo Verificado")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Protegido por Touch ID / Face ID / TPM 2.0. Pode autenticar-se no portal sem necessidade de memorizar senhas.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBiometricSecurityModal(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ScanFace className="size-4" />
                <span>{t("Registar Rosto / Digital")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBiometricModal(true)}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Fingerprint className="size-4 text-emerald-400" />
                <span>{t("Testar Verificação")}</span>
              </button>
            </div>
          </div>

          {/* Service Worker Push Notifications Banner */}
          <PushNotificationBanner />

          {/* Key Metric KPIs Grid */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs hover:shadow-xs transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t("Total Facturado")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-foreground">
                {formatCurrency(totalInvoiced, selectedCurrency)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1 shadow-2xs hover:shadow-xs transition">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {t("Total Liquidado")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPaid, selectedCurrency)}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 space-y-1 shadow-2xs hover:shadow-xs transition ${
                totalOutstanding > 0
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-foreground">
                <Clock className="size-3 text-amber-500" />
                {t("Saldo em Dívida")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-foreground">
                {formatCurrency(totalOutstanding, selectedCurrency)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs hover:shadow-xs transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                <FileText className="size-3 text-primary" />
                {t("Itens & Documentos")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-foreground">
                {totalGeneratedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs hover:shadow-xs transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                <Award className="size-3 text-amber-500" />
                {t("Solicitações / Bolsas")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-foreground">
                {serverRequests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-2xs hover:shadow-xs transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                <Zap className="size-3 text-purple-500" />
                {t("IA Prompts Restantes")}
              </span>
              <p className="text-base sm:text-lg font-extrabold font-display text-foreground">
                {subscription.promptsRemaining} / {subscription.totalPromptsQuota}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE NAVIGATION TABS */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/50 p-1.5 rounded-2xl border border-border/80">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-4" />
              <span>{t("Visão Geral & Resumo")}</span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "payments"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="size-4" />
              <span>{t("Histórico de Pagamentos")}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                {paidPayments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("generated")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "generated"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4" />
              <span>{t("Itens Gerados & Documentos")}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground">
                {totalGeneratedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("offline_docs")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "offline_docs"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="size-4 text-emerald-500" />
              <span>{t("Cache Offline (SW)")}</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-0.5">
                <WifiOff className="size-2.5" />
                <span>PWA</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "requests"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="size-4" />
              <span>{t("Solicitações & Bolsas")}</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                {serverRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "activity"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="size-4" />
              <span>{t("Atividades & Auditoria")}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {serverActivities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>{t("Segurança & Biometria")}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                FIDO2
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <button
              onClick={fetchStudentFullHistory}
              disabled={loadingServerData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Sincronizar dados com MongoDB"
            >
              <RefreshCw className={`size-3.5 ${loadingServerData ? "animate-spin text-primary" : ""}`} />
              <span>{loadingServerData ? t("A Sincronizar...") : t("Sincronizar")}</span>
            </button>
            {lastSyncTime && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
                {lastSyncTime}
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & QUICK HUB */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Clearance or Outstanding Banner */}
            {isFullySettled ? (
              <div className="rounded-sm border border-success/30 bg-success/10 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-success/20 text-success">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {t("Situação Financeira Totalmente Regularizada")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("Todas as propinas e taxas académicas encontram-se liquidadas. Pode descarregar a sua Declaração de Quitação oficial em PDF.")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadClearance}
                  className="inline-flex items-center gap-2 rounded-sm bg-success px-4 py-2 text-xs font-semibold text-success-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
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
                      {t("Possui um saldo pendente de ")}
                      <strong className="font-bold text-foreground">{formatCurrency(totalOutstanding, selectedCurrency)}</strong>
                      {t(". Regularize para manter o acesso às avaliações.")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadClearance}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <FileCheck className="size-4 text-primary" />
                  <span>{t("Descarregar Extrato Financeiro PDF")}</span>
                </button>
              </div>
            )}

            {/* Quick Action Center Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <QrCode className="size-4" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Activo</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{t("Cartão Digital de Estudante")}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("Cartão oficial com QR Code e código de barras para acesso ao campus.")}</p>
                </div>
                <button
                  onClick={handleDownloadStudentCard}
                  className="w-full rounded-sm border border-border bg-muted/40 hover:bg-muted py-1.5 text-xs font-semibold text-foreground transition cursor-pointer"
                >
                  {t("Ver & Descarregar")}
                </button>
              </div>

              <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Award className="size-4" />
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase">IA Avaliador</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{t("Bolsas & Apoio Social")}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("Submeta pedidos de bolsa de mérito, desconto familiar ou prorrogação.")}</p>
                </div>
                <button
                  onClick={() => setShowScholarshipModal(true)}
                  className="w-full rounded-sm border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition cursor-pointer"
                >
                  {t("Submeter Pedido")}
                </button>
              </div>

              <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FileText className="size-4" />
                  </span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase">Oficial</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{t("Declarações & Certificados")}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("Emissão imediata de extratos, recibos autenticados e quitações.")}</p>
                </div>
                <button
                  onClick={() => setActiveTab("generated")}
                  className="w-full rounded-sm border border-border bg-muted/40 hover:bg-muted py-1.5 text-xs font-semibold text-foreground transition cursor-pointer"
                >
                  {t("Ver Documentos")}
                </button>
              </div>

              <div className="rounded-sm border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="size-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="text-[10px] font-bold text-purple-500 uppercase">Gemini 3.6</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{t("Orientador IA Universitário")}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("Consulte orientações académicas, planos de pagamento e tutoria.")}</p>
                </div>
                <button
                  onClick={() => navigate("/orientador")}
                  className="w-full rounded-sm border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition cursor-pointer"
                >
                  {t("Abrir Orientador")}
                </button>
              </div>
            </div>

            {/* Pending Charges Table */}
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
                              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
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
                              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
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

            {/* Recent Activity Snapshot */}
            <Panel titulo={t("Actividade Recente no Portal")}>
              {serverActivities.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {t("Nenhum registo de atividade recente.")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {serverActivities.slice(0, 5).map((act, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          <Activity className="size-4 text-primary" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{act.actionType || "Acção do Utilizador"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {act.details ? JSON.stringify(act.details).slice(0, 70) : "Sessão activa"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PAYMENTS & SUBSCRIPTIONS HISTORY */}
        {/* ========================================================================= */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <Panel titulo={t("Histórico Completo de Pagamentos & Transações")}>
              {/* Payment Filter & Search Toolbar */}
              <div className="border-b border-border p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Filter className="size-3.5" />
                    {t("Filtrar por Método")}:
                  </span>
                  {[
                    { key: "all", label: "Todos" },
                    { key: "mpesa", label: "Vodacom M-Pesa" },
                    { key: "card", label: "Cartão / DPO" },
                    { key: "crypto", label: "Base Pay (Crypto/USDC)" },
                    { key: "debitopay", label: "Debito Pay" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setPaymentFilterMethod(f.key)}
                      className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        paymentFilterMethod === f.key
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("Pesquisar recibo ou encargo...")}
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="rounded-sm border border-input bg-card pl-8 pr-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <CreditCard className="size-8 mx-auto opacity-40 mb-1" />
                  <p className="font-semibold text-foreground">{t("Nenhum pagamento encontrado com os filtros actuais.")}</p>
                  <p>{t("Todos os pagamentos efectuados via M-Pesa, Cartão ou Base Pay são registados aqui em tempo real.")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">{t("Recibo / Ref")}</th>
                        <th className="px-4 py-3">{t("Encargo / Descrição")}</th>
                        <th className="px-4 py-3">{t("Data")}</th>
                        <th className="px-4 py-3">{t("Canal de Pagamento")}</th>
                        <th className="px-4 py-3">{t("Valor Pago")}</th>
                        <th className="px-4 py-3">{t("Estado")}</th>
                        <th className="px-4 py-3 text-right">{t("Comprovativo")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPayments.map((p) => {
                        const fee = fees.find((f) => f.id === p.feeId);
                        const isMpesa = p.metodo.toLowerCase().includes("m-pesa") || p.metodo.toLowerCase().includes("mobile");
                        const isCrypto = p.metodo.toLowerCase().includes("crypto") || p.metodo.toLowerCase().includes("base") || p.metodo.toLowerCase().includes("usdc");
                        const isCard = p.metodo.toLowerCase().includes("cartão") || p.metodo.toLowerCase().includes("card") || p.metodo.toLowerCase().includes("dpo");
                        const isDebito = p.metodo.toLowerCase().includes("debito");

                        return (
                          <tr key={p.id} className="hover:bg-muted/20 transition">
                            <td className="px-4 py-3.5 font-mono font-bold text-primary">
                              {p.recibo || "REC-2026-AUT"}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground">
                              {fee?.designacao || "Propina Leonardo University"}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {dataPt(p.data)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold border ${
                                  isMpesa
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                    : isCrypto
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                    : isCard
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : isDebito
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {isMpesa && <Smartphone className="size-3" />}
                                {isCrypto && <Globe className="size-3" />}
                                {isCard && <CreditCard className="size-3" />}
                                {isDebito && <Zap className="size-3" />}
                                {p.metodo}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-bold font-display text-foreground">
                              {formatCurrency(p.valorPago, selectedCurrency)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/30 px-2 py-0.5 text-[10px] font-bold text-success">
                                <Check className="size-2.5" />
                                {t("Liquidado")}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => downloadReceipt(p)}
                                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
                              >
                                <Download className="size-3.5" />
                                <span>{t("Recibo PDF")}</span>
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GENERATED ITEMS & DOCUMENTS */}
        {/* ========================================================================= */}
        {activeTab === "generated" && (
          <div className="space-y-6">
            <Panel titulo={t("Itens Gerados & Documentação Oficial do Estudante")}>
              <div className="p-4 bg-muted/20 border-b border-border text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
                <p>
                  {t("Consulte e volte a descarregar todos os certificados, cartões, declarações e extratos emitidos para")} <strong>{user.nome}</strong>.
                </p>
                <button
                  onClick={handleDownloadClearance}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
                >
                  <PlusCircle className="size-3.5" />
                  <span>{t("Gerar Nova Declaração")}</span>
                </button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* 1. Student Digital Card */}
                <div className="rounded-sm border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <QrCode className="size-5" />
                    </span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Emitido
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{t("Cartão Digital de Estudante")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Identificação com foto, QR Code de segurança e código de barras institucional.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground font-mono">Ref: CRD-{user.id}</span>
                    <button
                      onClick={handleDownloadStudentCard}
                      className="inline-flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>{t("Descarregar")}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Clearance / Regularization Declaration */}
                <div className="rounded-sm border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {isFullySettled ? "Autenticado" : "Extrato"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {isFullySettled ? t("Declaração de Quitação") : t("Extrato Financeiro Global")}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isFullySettled
                        ? "Comprovativo oficial de ausência de dívidas e autorização para exames."
                        : "Extrato oficial detalhado com histórico de propinas e valores em aberto."}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground font-mono">Ref: DECL-{user.id}</span>
                    <button
                      onClick={handleDownloadClearance}
                      className="inline-flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>{t("Descarregar")}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Official Receipts Package */}
                <div className="rounded-sm border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <FileCheck className="size-5" />
                    </span>
                    <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {paidPayments.length} Recibos
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{t("Recibos de Propinas Emitidos")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recibos assinados pela Direcção Financeira com NUIT e selo de autenticidade.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground">{paidPayments.length} comprovativos</span>
                    <button
                      onClick={() => {
                        if (paidPayments.length > 0) downloadReceipt(paidPayments[0]);
                      }}
                      className="inline-flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>{t("Último Recibo")}</span>
                    </button>
                  </div>
                </div>

                {/* 4. AI Structured Academic Plan */}
                <div className="rounded-sm border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Sparkles className="size-5" />
                    </span>
                    <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      IA Gemini
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{t("Plano de Pagamento & Estudo IA")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cronograma e recomendações personalizadas geradas pelo Orientador Universitário.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground font-mono">Orientador IA</span>
                    <button
                      onClick={() => navigate("/orientador")}
                      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                      <span>{t("Consultar IA")}</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. Institutional Letterhead Template */}
                <div className="rounded-sm border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <BookOpen className="size-5" />
                    </span>
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Papel Timbrado
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{t("Modelos de Requerimento")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minutas oficiais da Leonardo University para requerimentos à Reitoria.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground font-mono">Minuta Geral</span>
                    <button
                      onClick={() => navigate("/documentos")}
                      className="inline-flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
                    >
                      <span>{t("Ver Modelos")}</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: OFFLINE DOCUMENTS & SERVICE WORKER CACHE */}
        {/* ========================================================================= */}
        {activeTab === "offline_docs" && (
          <div className="space-y-6">
            <OfflineDocumentsHub />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ACADEMIC REQUESTS & SCHOLARSHIP APPLICATIONS */}
        {/* ========================================================================= */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <Panel titulo={t("Solicitações, Bolsas de Estudo & Pedidos Académicos")}>
              <div className="p-4 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{t("Histórico de Pedidos Submetidos à Secretaria e Tesouraria")}</p>
                  <p className="text-muted-foreground text-[11px]">{t("Acompanhe o estado de aprovação, protocolos emitidos e o parecer preliminar da IA.")}</p>
                </div>
                <button
                  onClick={() => setShowScholarshipModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
                >
                  <PlusCircle className="size-3.5" />
                  <span>{t("Nova Solicitação / Bolsa")}</span>
                </button>
              </div>

              {serverRequests.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
                  <Award className="size-8 mx-auto opacity-40" />
                  <h4 className="font-bold text-foreground text-sm">{t("Nenhuma solicitação submetida até ao momento")}</h4>
                  <p className="max-w-md mx-auto">
                    {t("Pode submeter pedidos de Bolsa de Mérito, Apoio Social Universitário, Desconto Familiar ou Prorrogação de Prazo com avaliação em tempo real.")}
                  </p>
                  <button
                    onClick={() => setShowScholarshipModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition cursor-pointer"
                  >
                    <Award className="size-3.5" />
                    <span>{t("Submeter Pedido Agora")}</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {serverRequests.map((req, idx) => (
                    <div key={idx} className="p-5 flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm">
                            {req.protocol || req.id}
                          </span>
                          <h4 className="font-bold text-sm text-foreground">
                            {req.title || req.category}
                          </h4>
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {req.status || "Em Análise"}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <strong>Justificativo:</strong> {req.reason || req.description}
                        </p>

                        {req.aiEvaluation && (
                          <div className="rounded-sm border border-blue-500/30 bg-blue-950/15 p-2.5 text-xs text-blue-300 space-y-1">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="flex items-center gap-1 text-blue-400">
                                <Sparkles className="size-3" />
                                Parecer Preliminar da IA Orientadora
                              </span>
                              <span className="font-mono font-bold text-blue-200">
                                Pontuação: {req.aiEvaluation.score}/100 (Bonificação: {req.aiEvaluation.discountPercent}%)
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {req.aiEvaluation.recommendation}
                            </p>
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          Submetido em: {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => {
                            alert(`Protocolo nº ${req.protocol}\nEstado: ${req.status}\nConsulte a Secretaria ou Tesouraria para mais detalhes.`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                        >
                          <FileText className="size-3.5" />
                          <span>{t("Ver Detalhes")}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIT & ACTIVITY HISTORY */}
        {/* ========================================================================= */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <Panel titulo={t("Histórico Completo de Atividades & Registo de Auditoria")}>
              <div className="p-4 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{t("Auditoria Segura de Ações do Estudante")}</p>
                  <p className="text-muted-foreground text-[11px]">{t("Todos os acessos, pagamentos e alterações de dados são gravados no MongoDB.")}</p>
                </div>
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
                >
                  <Database className="size-3.5" />
                  <span>{t("Abrir Monitor MongoDB")}</span>
                </button>
              </div>

              {serverActivities.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <Activity className="size-8 mx-auto opacity-40 mb-2" />
                  {t("Ainda não existem registos de atividade gravados para este utilizador.")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {serverActivities.map((act, idx) => {
                    const isLogin = act.actionType === "LOGIN" || act.actionType === "SIGNUP";
                    const isPayment = act.actionType.includes("PAYMENT") || act.actionType.includes("MPESA") || act.actionType.includes("DPO");
                    const isDoc = act.actionType.includes("DOCUMENT");
                    const isReq = act.actionType.includes("REQUEST");

                    return (
                      <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/20 transition text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={`size-8 rounded-full flex items-center justify-center shrink-0 border ${
                              isLogin
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : isPayment
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : isDoc
                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                : isReq
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {isLogin && <User className="size-4" />}
                            {isPayment && <CreditCard className="size-4" />}
                            {isDoc && <FileText className="size-4" />}
                            {isReq && <Award className="size-4" />}
                            {!isLogin && !isPayment && !isDoc && !isReq && <Activity className="size-4" />}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{act.actionType}</span>
                              {act.ip && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  IP: {act.ip}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {act.details ? JSON.stringify(act.details) : "Acção de utilizador autenticado"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: BIOMETRIC SECURITY & GEOLOCATION ACCESS LOGS */}
        {/* ========================================================================= */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Primary Biometric Configuration & Registration Panel */}
            <BiometricSecuritySettingsView
              studentId={user.id}
              studentName={user.nome}
              isModal={false}
            />

            {/* Geolocation & Campus Audit Log */}
            <Panel titulo={t("Geolocalização & Segurança de Acesso à Conta")}>
              <div className="p-4 bg-muted/20 border-b border-border text-xs text-muted-foreground">
                <p>
                  {t("Registos de auditoria geográfica e IP para garantia de integridade da conta de estudante.")}
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-sm border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <h4 className="font-bold text-xs text-foreground">{t("Localização Registada no Campus")}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Maputo, Moçambique</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coordenadas padrão: Latitude -25.9692, Longitude 32.5732 (Maputo, Campus Central da Leonardo University).
                  </p>
                </div>

                {serverLocations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    {t("Nenhum histórico de geolocalização sincronizado ainda.")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">{t("Cidade / País")}</th>
                          <th className="px-4 py-3">{t("Coordenadas")}</th>
                          <th className="px-4 py-3">{t("Endereço IP")}</th>
                          <th className="px-4 py-3">{t("Data e Hora")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {serverLocations.map((loc, idx) => (
                          <tr key={idx} className="hover:bg-muted/20 transition">
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {loc.city || "Maputo"}, {loc.country || "Moçambique"}
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {loc.ip || "127.0.0.1"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(loc.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}

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
          onRequestCreated={() => {
            fetchStudentFullHistory();
          }}
        />
      )}

      {showActivityModal && (
        <StudentActivityTrackerModal
          studentId={user.id}
          studentName={user.nome}
          onClose={() => setShowActivityModal(false)}
        />
      )}

      {showEditProfileModal && (
        <StudentProfileEditModal
          student={user}
          onClose={() => setShowEditProfileModal(false)}
          onSave={(updated) => {
            updateUser(updated);
            fetchStudentFullHistory();
          }}
        />
      )}

      {selectedPayInvoice && (
        <PayInvoiceModal
          student={user}
          fee={selectedPayInvoice.fee}
          payment={selectedPayInvoice.payment}
          dueAmount={selectedPayInvoice.dueAmount}
          onClose={() => {
            setSelectedPayInvoice(null);
            fetchStudentFullHistory();
          }}
        />
      )}

      {showBiometricModal && (
        <BiometricVerificationModal
          isOpen={showBiometricModal}
          onClose={() => setShowBiometricModal(false)}
          targetStudentId={user.id}
        />
      )}

      {showBiometricSecurityModal && (
        <BiometricSecuritySettingsModal
          isOpen={showBiometricSecurityModal}
          onClose={() => setShowBiometricSecurityModal(false)}
          studentId={user.id}
          studentName={user.nome}
        />
      )}
    </Shell>
  );
}
