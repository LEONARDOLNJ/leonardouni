import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/role";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { useWeb3 } from "@/lib/web3-base";
import { SignInWithBaseButton } from "@/components/SignInWithBaseButton";
import { Shell, Panel } from "@/components/Shell";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { BiometricVerificationModal } from "@/components/BiometricVerificationModal";
import { AdvancedWorkerLoginForm } from "@/components/AdvancedWorkerLoginForm";
import { UniversityLogo } from "@/components/UniversityLogo";
import { isWebAuthnSupported } from "@/lib/biometrics";
import { students, UNIVERSITY } from "@/lib/uni-data";
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck,
  Globe,
  Sparkles,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Building,
  Briefcase,
  Lock,
} from "lucide-react";
import heroImg from "@/assets/campus-hero.jpg";

export function Login() {
  const { user, login, signup, logout, resetModalOpen, setResetModalOpen } = useAuth();
  const { isWorker, workerProfile, setRole } = useRole();
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { signInWithBase, signInWithEthereum } = useWeb3();

  // Target Portal View: 'student' or 'worker'
  const [activePortal, setActivePortal] = useState<"student" | "worker">("student");

  // Mode within student portal: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Biometric modal state
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [targetBioStudentId, setTargetBioStudentId] = useState<string | undefined>(undefined);

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("ul2026");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("ul2026");
  const [signupCurso, setSignupCurso] = useState("Engenharia Informática");
  const [signupAno, setSignupAno] = useState(1);
  const [signupDocId, setSignupDocId] = useState("");
  const [signupDocType, setSignupDocType] = useState<"BI" | "Passaporte" | "DIRE">("BI");
  const [signupNacionalidade, setSignupNacionalidade] = useState("Moçambique");
  const [signupIsIntl, setSignupIsIntl] = useState(false);
  const [signupWallet, setSignupWallet] = useState("");

  // MongoDB status
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; databaseName?: string; error?: string; collections?: any } | null>(null);

  useEffect(() => {
    fetch("/api/db/status")
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.warn("DB status check error:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(t("Por favor introduza o seu email ou número de estudante."));
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      setRole("student");
      navigate("/portal");
    } else {
      setError(res.error || t("Falha na autenticação. Verifique os seus dados."));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) {
      setError(t("Por favor preencha todos os campos obrigatórios (Nome e Email)."));
      return;
    }

    setLoading(true);
    setError("");

    const res = await signup({
      nome: signupName,
      email: signupEmail,
      password: signupPassword,
      curso: signupCurso,
      ano: Number(signupAno),
      docId: signupDocId || `${Math.floor(10000000 + Math.random() * 90000000)}M`,
      tipoDocumento: signupDocType,
      nacionalidade: signupNacionalidade,
      isInternational: signupIsIntl,
      walletAddress: signupWallet || undefined,
    });

    setLoading(false);

    if (res.success) {
      navigate("/portal");
    } else {
      setError(res.error || t("Erro ao criar a conta no MongoDB. Tente novamente."));
    }
  };

  const handleDemoSelect = async (stId: string) => {
    const st = students.find((s) => s.id === stId);
    if (st) {
      await login(st.id, "ul2026");
      navigate("/portal");
    }
  };

  return (
    <Shell
      titulo={
        activePortal === "worker"
          ? t("Portal de Acesso para Secretários & Staff")
          : t("Portal de Autenticação do Estudante")
      }
      descricao={
        activePortal === "worker"
          ? t("Gabinete institucional para secretários financeiros, tesoureiros, oficiais de cobrança e administradores.")
          : t("Aceda à sua conta pessoal para consultar propinas, descarregar declarações, gerir pagamentos e visualizar o seu extrato financeiro.")
      }
      imagem={heroImg}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Dual Portal Switcher Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-muted/60 border border-border shadow-xs max-w-md w-full">
            <button
              type="button"
              onClick={() => setActivePortal("student")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                activePortal === "student"
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="size-4 text-primary" />
              <span>{t("Portal do Estudante")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortal("worker")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                activePortal === "worker"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building className="size-4" />
              <span>{t("Secretaria & Staff")}</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
                MFA
              </span>
            </button>
          </div>
        </div>

        {/* WORKER PORTAL VIEW */}
        {activePortal === "worker" ? (
          <AdvancedWorkerLoginForm
            onSuccess={() => {
              navigate("/painel-funcionario");
            }}
          />
        ) : (
          /* STUDENT PORTAL VIEW */
          <div className="space-y-6">
            {/* MongoDB Status Banner */}
            <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-foreground">Base de Dados MongoDB Backend: </span>
                  {dbStatus?.isConnected ? (
                    <span className="text-emerald-500 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 inline" /> Ligado ({dbStatus.databaseName || "unileonardo_db"}) · {dbStatus.collections?.users || 0} Estudantes Registados
                    </span>
                  ) : (
                    <span className="text-amber-500 font-semibold inline-flex items-center gap-1">
                      <AlertCircle className="size-3.5 inline" /> Modo Local Fallback (MongoDB a aguardar string MONGODB_URI)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  fetch("/api/db/status").then((r) => r.json()).then(setDbStatus);
                }}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>Atualizar Status</span>
              </button>
            </div>

            {user ? (
              <Panel titulo={t("Sessão Activa")}>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 rounded-md border border-primary/20 bg-primary/5 p-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary font-display font-bold text-lg text-primary-foreground">
                      {user.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-base leading-tight">
                          {user.nome}
                        </p>
                        {user.isInternational && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                            <Globe className="size-3" />
                            {t("Internacional")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {user.id} · {user.curso} ({user.ano}º Ano) · {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate("/portal")}
                      className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer"
                    >
                      <GraduationCap className="size-4" />
                      <span>{t("Ir para o Meu Portal do Estudante")}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      onClick={logout}
                      className="rounded-sm border border-border px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    >
                      {t("Encerrar Sessão (Sair)")}
                    </button>
                  </div>
                </div>
              </Panel>
            ) : (
              <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Form Box */}
            <div className="lg:col-span-7">
              <Panel
                titulo={authMode === "login" ? t("Autenticação de Estudante") : "Nova Inscrição Académica"}
                acao={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setAuthMode("login"); setError(""); }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        authMode === "login"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LogIn className="size-3 inline mr-1" />
                      {t("Entrar")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signup"); setError(""); }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        authMode === "signup"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <UserPlus className="size-3 inline mr-1" />
                      {t("Registar")}
                    </button>
                  </div>
                }
              >
                {authMode === "login" ? (
                  /* LOGIN FORM */
                  <form onSubmit={handleLogin} className="p-6 space-y-5">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                      <UniversityLogo size="md" />
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground">
                          {UNIVERSITY.nome}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {t("Insira as suas credenciais académicas para aceder")}
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        {t("Email Académico ou Nº de Estudante")}
                      </label>

                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="ex: leonardo.m@ul.ac.mz ou EST-2024-001"
                        className="w-full rounded-sm border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">
                          {t("Senha de Acesso")}
                        </label>
                        <button
                          type="button"
                          onClick={() => setResetModalOpen(true)}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {t("Esqueceu a Senha?")}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-sm border border-input bg-background pr-9 pl-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                        <span>{t("Entrar com Senha de Estudante")}</span>
                      </button>

                      {/* Biometric Instant Login Option */}
                      <button
                        type="button"
                        onClick={() => {
                          // If identifier matches an existing student ID or email, pre-select it
                          const matched = students.find(
                            (s) =>
                              s.id.toLowerCase() === identifier.trim().toLowerCase() ||
                              s.email.toLowerCase() === identifier.trim().toLowerCase()
                          );
                          setTargetBioStudentId(matched ? matched.id : "EST-2024-001");
                          setBiometricModalOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 transition shadow-xs cursor-pointer group"
                      >
                        <Fingerprint className="size-4 text-emerald-500 group-hover:scale-110 transition" />
                        <span>{t("Entrar com Biometria (Touch ID / Face ID / Passkey)")}</span>
                      </button>
                    </div>

                    {/* Web3 / Base Sign in divider & buttons */}
                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Ou Entrar com Web3 / Base Blockchain
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <SignInWithBaseButton
                        onClick={async () => {
                          const ok = await signInWithBase();
                          if (ok) navigate("/portal");
                        }}
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await signInWithEthereum();
                          if (ok) navigate("/portal");
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 p-2 text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <span>Ethereum (MetaMask)</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* SIGNUP FORM */
                  <form onSubmit={handleSignup} className="p-6 space-y-4">
                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <UniversityLogo size="md" />
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground">
                          Nova Inscrição Académica
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Criar conta de estudante gravada na base de dados MongoDB
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="ex: Marta Silva Cossa"
                        className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Email Académico / Pessoal *</label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="marta.cossa@gmail.com"
                          className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Senha de Acesso</label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Curso Escolhido</label>
                        <select
                          value={signupCurso}
                          onChange={(e) => setSignupCurso(e.target.value)}
                          className="w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="Engenharia Informática">Engenharia Informática</option>
                          <option value="Medicina Geral">Medicina Geral</option>
                          <option value="Gestão de Empresas">Gestão de Empresas</option>
                          <option value="Direito & Relações Internacionais">Direito & Relações Internacionais</option>
                          <option value="Arquitectura e Urbanismo">Arquitectura e Urbanismo</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Ano de Estudo</label>
                        <select
                          value={signupAno}
                          onChange={(e) => setSignupAno(Number(e.target.value))}
                          className="w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value={1}>1º Ano</option>
                          <option value={2}>2º Ano</option>
                          <option value={3}>3º Ano</option>
                          <option value={4}>4º Ano</option>
                          <option value={5}>5º Ano</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Documento (BI / Passaporte)</label>
                        <input
                          type="text"
                          value={signupDocId}
                          onChange={(e) => setSignupDocId(e.target.value)}
                          placeholder="110293847M"
                          className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Nacionalidade</label>
                        <input
                          type="text"
                          value={signupNacionalidade}
                          onChange={(e) => setSignupNacionalidade(e.target.value)}
                          placeholder="Moçambique"
                          className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">Carteira Web3 / Base Address (Opcional)</label>
                      <input
                        type="text"
                        value={signupWallet}
                        onChange={(e) => setSignupWallet(e.target.value)}
                        placeholder="0x..."
                        className="w-full rounded-sm border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? <RefreshCw className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                      <span>Criar Conta & Registar no MongoDB</span>
                    </button>
                  </form>
                )}
              </Panel>
            </div>

            {/* Quick Demo Access & International Student Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-sm border border-accent/30 bg-accent/5 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-accent-foreground uppercase tracking-wider">
                  <Sparkles className="size-4 text-accent" />
                  <span>{t("Acesso de Teste Rápido (Demonstração)")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("Clique num dos perfis de estudante abaixo para simular o login imediato no sistema da Leonardo University:")}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDemoSelect("EST-2024-001")}
                      className="flex-1 flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left hover:border-primary transition group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground group-hover:text-primary">
                            Leonardo Nhantumbo
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Touch ID
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          EST-2024-001 · Eng. Informática
                        </p>
                      </div>
                      <UserCheck className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                    <button
                      type="button"
                      title={t("Testar Verificação Biométrica")}
                      onClick={() => {
                        setTargetBioStudentId("EST-2024-001");
                        setBiometricModalOpen(true);
                      }}
                      className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer shrink-0"
                    >
                      <Fingerprint className="size-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDemoSelect("EST-2024-002")}
                      className="flex-1 flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left hover:border-primary transition group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground group-hover:text-primary">
                            Amina Abdala
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Face ID
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          EST-2024-002 · Medicina Geral
                        </p>
                      </div>
                      <UserCheck className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                    <button
                      type="button"
                      title={t("Testar Verificação Biométrica Facial")}
                      onClick={() => {
                        setTargetBioStudentId("EST-2024-002");
                        setBiometricModalOpen(true);
                      }}
                      className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition cursor-pointer shrink-0"
                    >
                      <ScanFace className="size-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <KeyRound className="size-4 text-primary" />
                  <span>{t("Recuperação de Senha de Acesso")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("Se esqueceu da sua senha, clique em 'Esqueceu a Senha?' para receber o link de recuperação no seu e-mail de estudante registrado na universidade.")}
                </p>
              </div>
            </div>
          </div>
            )}
          </div>
        )}
      </div>

      <ForgotPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />

      <BiometricVerificationModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        targetStudentId={targetBioStudentId}
      />
    </Shell>
  );
}
