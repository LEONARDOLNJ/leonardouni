import React, { useState } from "react";
import { Link } from "@/lib/router";
import { UNIVERSITY } from "@/lib/uni-data";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { UniversityLogo } from "@/components/UniversityLogo";
import { Web3AuthButtons } from "@/components/Web3AuthButtons";
import { SignInWithBaseButton } from "@/components/SignInWithBaseButton";
import { AIVoiceAssistant } from "@/components/AIVoiceAssistant";
import {
  Sun,
  Moon,
  User,
  LogIn,
  LogOut,
  Globe,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Zap,
  CreditCard,
} from "lucide-react";
import heroDefault from "@/assets/campus-hero.jpg";

const NAV = [
  { to: "/", label: "Painel" },
  { to: "/analytics", label: "Analytics GPA" },
  { to: "/hub", label: "Hub & Certificados" },
  { to: "/orientador", label: "Orientador IA" },
  { to: "/subscricoes", label: "Subscrições" },
  { to: "/estudantes", label: "Estudantes" },
  { to: "/propinas", label: "Propinas & Taxas" },
  { to: "/pagamentos", label: "Pagamentos" },
  { to: "/recibos", label: "Recibos" },
  { to: "/documentos", label: "Documentos" },
] as const;

export function Shell({
  titulo,
  descricao,
  imagem,
  children,
}: {
  titulo: string;
  descricao: string;
  imagem?: string;
  children: React.ReactNode;
}) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20 flex flex-col font-sans">
      {/* Top Academic Utility Bar */}
      <div className="bg-primary text-primary-foreground border-b border-white/10 shadow-xs relative z-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2 text-xs">
          <div className="flex items-center gap-4 text-[11px] font-medium opacity-90">
            <Link
              to="/portal"
              className="hover:opacity-100 transition flex items-center gap-1.5 font-semibold text-accent-foreground bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-xs"
            >
              <GraduationCap className="size-3.5 text-amber-300" />
              <span>{t("Portal do Estudante")}</span>
            </Link>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden md:inline hover:text-white transition cursor-pointer">
              {t("Apoio financeiro & Propinas")}
            </span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden lg:inline text-emerald-300 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Base Network · On-Chain L2
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition text-xs font-medium cursor-pointer backdrop-blur-xs border border-white/10"
              title={theme === "dark" ? t("Modo Claro") : t("Modo Escuro")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="size-3.5 text-amber-300" />
                  <span className="text-[11px]">{t("Claro")}</span>
                </>
              ) : (
                <>
                  <Moon className="size-3.5 text-blue-200" />
                  <span className="text-[11px]">{t("Escuro")}</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-0.5 bg-white/10 rounded-full p-0.5 border border-white/10">
              <Globe className="size-3 opacity-70 ml-1.5 mr-0.5" />
              {(["pt", "en", "fr", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l as Lang)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2 py-0.5 uppercase text-[10px] font-bold transition cursor-pointer ${
                    lang === l
                      ? "bg-white text-primary shadow-xs"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* AI Voice Command Assistant */}
            <AIVoiceAssistant variant="header" />

            {/* Auth Profile / Login & Sign in with Base */}
            <div className="flex items-center gap-2 border-l border-white/20 pl-2.5">
              {user ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/portal"
                    className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 hover:bg-white/25 transition text-xs font-semibold border border-white/15"
                  >
                    {user.foto ? (
                      <img
                        src={user.foto}
                        alt=""
                        className="size-4.5 rounded-full object-cover ring-1 ring-white/30"
                      />
                    ) : (
                      <User className="size-3.5" />
                    )}
                    <span className="truncate max-w-[100px]">{user.nome.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title={t("Sair da conta")}
                    className="opacity-75 hover:opacity-100 hover:bg-white/10 rounded-full transition p-1 cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-300" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 font-semibold hover:opacity-100 opacity-90 transition mr-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs border border-white/10"
                >
                  <LogIn className="size-3.5" />
                  <span>{t("Login")}</span>
                </Link>
              )}

              {/* Sign in with Base Button */}
              <SignInWithBaseButton variant="header" />
            </div>

            {/* Web3 Status */}
            <Web3AuthButtons showBaseButton={false} />
          </div>
        </div>
      </div>

      {/* Main Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md shadow-xs transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <Link to="/" className="group flex items-center gap-3.5 shrink-0">
            <UniversityLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-base sm:text-lg leading-tight font-extrabold text-foreground group-hover:text-primary transition tracking-tight">
                  {t(UNIVERSITY.nome)}
                </p>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[10px] font-bold">
                  {UNIVERSITY.sigla}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <span>{t("Sistema de Gestão Académica & Financeira")}</span>
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                exact={n.to === "/"}
                className="rounded-lg px-2.5 py-2 text-muted-foreground transition hover:bg-muted/80 hover:text-foreground font-semibold text-[12px]"
                activeClassName="bg-primary/10 text-primary font-bold shadow-2xs"
              >
                {t(n.label)}
              </Link>
            ))}
            <Link
              to={user ? "/portal" : "/login"}
              className="rounded-lg px-3 py-2 text-primary font-bold transition hover:bg-primary/10 flex items-center gap-1.5 ml-1 border border-primary/20"
              activeClassName="bg-primary text-primary-foreground font-bold shadow-xs border-transparent"
            >
              <GraduationCap className="size-3.5" />
              <span>{user ? t("Perfil & Histórico") : t("Portal Estudante")}</span>
            </Link>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              to={user ? "/portal" : "/login"}
              className="rounded-lg px-2.5 py-1.5 bg-primary/10 text-primary font-bold text-xs flex items-center gap-1 border border-primary/20"
            >
              <User className="size-3.5" />
              <span>{user ? "Perfil" : "Entrar"}</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-border bg-card p-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-border">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  exact={n.to === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground font-semibold flex items-center justify-between"
                  activeClassName="bg-primary/10 text-primary font-bold"
                >
                  <span>{t(n.label)}</span>
                  <ChevronRight className="size-3 text-muted-foreground/60" />
                </Link>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-between">
              <Link
                to="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                {user ? "Aceder ao Portal do Estudante" : "Iniciar Sessão de Estudante"}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero / Page Section Banner */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-slate-900 text-primary-foreground shadow-md">
        <img
          src={imagem ?? heroDefault}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 size-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15 mb-4 text-white">
            <Sparkles className="size-3.5 text-amber-300" />
            <span>Leonardo University · Gestão Financeira & Académica</span>
          </div>

          <h1 className="max-w-3xl font-display text-3xl sm:text-4xl md:text-5xl leading-tight font-extrabold tracking-tight drop-shadow-xs">
            {t(titulo)}
          </h1>
          <p className="mt-3.5 max-w-2xl text-sm sm:text-base opacity-90 leading-relaxed font-normal text-slate-100">
            {t(descricao)}
          </p>
        </div>
        <div className="h-1 bg-gradient-to-r from-accent via-emerald-400 to-amber-400" />
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex-1 w-full">{children}</main>

      {/* Premium Footer */}
      <footer className="mt-20 border-t border-border bg-card text-card-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <UniversityLogo size="sm" />
              <div>
                <p className="font-display text-base font-bold text-foreground">{t(UNIVERSITY.sigla)}</p>
                <p className="text-[11px] text-muted-foreground">{UNIVERSITY.nome}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">{UNIVERSITY.morada}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {UNIVERSITY.contacto} · NUIT {UNIVERSITY.nuit}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-primary" />
              <span>{t("Plataforma Académica")}</span>
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/portal" className="hover:text-primary transition flex items-center gap-1"><span>{t("Portal do Estudante")}</span></Link></li>
              <li><Link to="/orientador" className="hover:text-primary transition flex items-center gap-1"><span>{t("Orientador IA Académico")}</span></Link></li>
              <li><Link to="/subscricoes" className="hover:text-primary transition flex items-center gap-1"><span>{t("Planos & Subscrições")}</span></Link></li>
              <li><Link to="/analytics" className="hover:text-primary transition flex items-center gap-1"><span>{t("Analytics GPA")}</span></Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-emerald-500" />
              <span>{t("Finanças & Pagamentos")}</span>
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/propinas" className="hover:text-primary transition"><span>{t("Propinas & Emolumentos")}</span></Link></li>
              <li><Link to="/pagamentos" className="hover:text-primary transition"><span>{t("Gateway M-Pesa & Cartão")}</span></Link></li>
              <li><Link to="/recibos" className="hover:text-primary transition"><span>{t("Validação de Recibos & Faturas")}</span></Link></li>
              <li><Link to="/documentos" className="hover:text-primary transition"><span>{t("Certificados & Declarações")}</span></Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-blue-500" />
              <span>{t("Segurança & Web3")}</span>
            </p>
            <p className="mt-3.5 text-xs text-muted-foreground leading-relaxed">
              {t("Infraestrutura descentralizada na Base Network (Chain 84532) com persistência segura em MongoDB e suporte a pagamentos em Meticais (MZN) e USDC.")}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-mono text-muted-foreground border border-border">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SSL 256-bit Encriptado</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/80 py-4 px-4 sm:px-6 text-center text-xs text-muted-foreground bg-muted/20">
          © {new Date().getFullYear()} {UNIVERSITY.nome} · {t("Todos os direitos reservados.")}
        </div>
      </footer>
    </div>
  );
}

export function StatusBadge({ estado }: { estado: "pago" | "pendente" | "vencido" }) {
  const { t } = useI18n();
  const map = {
    pago: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold",
    pendente: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold",
    vencido: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25 font-bold",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs capitalize shadow-2xs ${map[estado]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t(estado)}
    </span>
  );
}

export function Panel({
  titulo,
  acao,
  children,
}: {
  titulo?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all duration-200 hover:shadow-sm">
      {(titulo || acao) && (
        <div className="flex items-center justify-between gap-4 border-b border-border/80 bg-muted/40 px-5 sm:px-6 py-3.5">
          {titulo && (
            <h2 className="text-xs font-bold tracking-wider text-foreground uppercase font-display">
              {t(titulo)}
            </h2>
          )}
          {acao}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

