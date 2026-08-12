import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { useWeb3 } from "@/lib/web3-base";
import { SignInWithBaseButton } from "@/components/SignInWithBaseButton";
import { Shell, Panel } from "@/components/Shell";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { UniversityLogo } from "@/components/UniversityLogo";
import { students, UNIVERSITY } from "@/lib/uni-data";
import {
  LogIn,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck,
  Globe,
  Sparkles,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import heroImg from "@/assets/campus-hero.jpg";

export function Login() {
  const { user, login, logout, resetModalOpen, setResetModalOpen } = useAuth();
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { signInWithBase, signInWithEthereum } = useWeb3();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("ul2026");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(t("Por favor introduza o seu email ou número de estudante."));
      return;
    }

    const res = login(identifier, password);
    if (res.success) {
      setError("");
      navigate("/portal");
    } else {
      setError(res.error || t("Falha na autenticação. Verifique os seus dados."));
    }
  };

  const handleDemoSelect = (stId: string) => {
    const st = students.find((s) => s.id === stId);
    if (st) {
      login(st.id, "ul2026");
      navigate("/portal");
    }
  };

  return (
    <Shell
      titulo="Portal de Autenticação do Estudante"
      descricao="Aceda à sua conta pessoal para consultar propinas, descarregar declarações, gerir pagamentos e visualizar o seu extrato financeiro."
      imagem={heroImg}
    >
      <div className="mx-auto max-w-4xl space-y-8">
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
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  <GraduationCap className="size-4" />
                  <span>{t("Ir para o Meu Portal do Estudante")}</span>
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="rounded-sm border border-border px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition"
                >
                  {t("Encerrar Sessão (Sair)")}
                </button>
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Login Form */}
            <div className="lg:col-span-7">
              <Panel titulo={t("Autenticação de Estudante")}>
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
                        className="text-[11px] font-semibold text-primary hover:underline"
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
                        className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs"
                  >
                    <LogIn className="size-4" />
                    <span>{t("Entrar no Portal do Estudante")}</span>
                  </button>

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

                  <div className="pt-2 text-center text-[11px] text-muted-foreground">
                    {t("Precisa de apoio com o seu registo?")} {" "}
                    <a href={`mailto:${UNIVERSITY.contacto}`} className="text-primary underline font-medium">
                      {t("Contactar Secretaria Geral")}
                    </a>
                  </div>
                </form>
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
                  <button
                    onClick={() => handleDemoSelect("EST-2024-001")}
                    className="w-full flex items-center justify-between rounded-sm border border-border bg-card p-3 text-left hover:border-primary transition group"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground group-hover:text-primary">
                        Leonardo Matsinhe
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        EST-2024-001 · Eng. Informática (Nacional)
                      </p>
                    </div>
                    <UserCheck className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </button>

                  <button
                    onClick={() => handleDemoSelect("EST-2024-006")}
                    className="w-full flex items-center justify-between rounded-sm border border-border bg-card p-3 text-left hover:border-primary transition group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-foreground group-hover:text-primary">
                          Jean-Luc Dubois
                        </p>
                        <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 text-[9px] font-semibold">
                          FR
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        EST-2024-006 · Eng. Informática (França)
                      </p>
                    </div>
                    <Globe className="size-4 text-blue-500 shrink-0" />
                  </button>

                  <button
                    onClick={() => handleDemoSelect("EST-2024-007")}
                    className="w-full flex items-center justify-between rounded-sm border border-border bg-card p-3 text-left hover:border-primary transition group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-foreground group-hover:text-primary">
                          Maria Sofia Garcia
                        </p>
                        <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.2 text-[9px] font-semibold">
                          ES
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        EST-2024-007 · Gestão de Empresas (Espanha)
                      </p>
                    </div>
                    <Globe className="size-4 text-red-500 shrink-0" />
                  </button>
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

      <ForgotPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </Shell>
  );
}
