import React from "react";
import { Link } from "@/lib/router";
import { UNIVERSITY } from "@/lib/uni-data";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { UniversityLogo } from "@/components/UniversityLogo";
import { Web3AuthButtons } from "@/components/Web3AuthButtons";
import { SignInWithBaseButton } from "@/components/SignInWithBaseButton";
import { AIVoiceAssistant } from "@/components/AIVoiceAssistant";
import { Sun, Moon, User, LogIn, LogOut, Globe, GraduationCap } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20">
      <div className="bg-primary text-primary-foreground border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-5 opacity-90">
            <Link to="/portal" className="hover:opacity-100 transition flex items-center gap-1.5 font-medium">
              <GraduationCap className="size-4 text-accent" />
              <span>{t("Portal do Estudante")}</span>
            </Link>
            <span className="opacity-70">|</span>
            <span className="hover:opacity-100 cursor-pointer transition">{t("Apoio financeiro")}</span>
            <span className="opacity-70">|</span>
            <span className="hover:opacity-100 cursor-pointer transition">{t("Contactos")}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 hover:bg-primary-foreground/20 transition text-xs font-medium cursor-pointer backdrop-blur-xs"
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
            <div className="flex items-center gap-1 bg-primary-foreground/10 rounded-full px-2 py-0.5">
              <Globe className="size-3.5 opacity-70 ml-1" />
              {(["pt", "en", "fr", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l as Lang)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2 py-0.5 uppercase text-[10px] font-bold transition cursor-pointer ${
                    lang === l
                      ? "bg-primary-foreground text-primary shadow-xs"
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
            <div className="flex items-center gap-2 border-l border-primary-foreground/20 pl-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/portal"
                    className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 hover:bg-primary-foreground/25 transition text-xs font-semibold"
                  >
                    <User className="size-3.5" />
                    <span className="truncate max-w-[110px]">{user.nome.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title={t("Sair")}
                    className="opacity-75 hover:opacity-100 transition p-1 cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-300" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 font-semibold hover:opacity-100 opacity-90 transition mr-1"
                >
                  <LogIn className="size-3.5" />
                  <span>{t("Login")}</span>
                </Link>
              )}

              {/* Sign in with Base Button - ALWAYS VISIBLE RIGHT NEXT TO LOGIN / PROFILE */}
              <SignInWithBaseButton variant="header" />
            </div>

            {/* Base Pay Prompts & MetaMask Web3 Status */}
            <Web3AuthButtons showBaseButton={false} />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md shadow-xs transition-all">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="group flex items-center gap-3.5">
            <UniversityLogo size="md" />
            <div>
              <p className="font-display text-base leading-tight font-bold text-foreground group-hover:text-primary transition">
                {t(UNIVERSITY.nome)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {t("Sistema de Gestão Académica & Web3")}
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                exact={n.to === "/"}
                className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground font-medium"
                activeClassName="bg-primary/10 text-primary font-bold shadow-2xs"
              >
                {t(n.label)}
              </Link>
            ))}
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-primary font-semibold transition hover:bg-primary/10"
              activeClassName="bg-primary text-primary-foreground font-bold shadow-xs"
            >
              {t("Portal do Estudante")}
            </Link>

            {/* Sign in with Base Button in Main Header Nav */}
            <div className="ml-2 shrink-0">
              <SignInWithBaseButton variant="header" />
            </div>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-accent/85 text-primary-foreground">
        <img
          src={imagem ?? heroDefault}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 size-full object-cover opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent -z-10" />
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl sm:text-5xl leading-tight font-extrabold tracking-tight drop-shadow-sm">
            {t(titulo)}
          </h1>
          <p className="mt-4 max-w-2xl text-base opacity-95 leading-relaxed font-normal">
            {t(descricao)}
          </p>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-accent via-emerald-400 to-primary" />
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12">{children}</main>

      <footer className="mt-20 border-t border-border bg-card text-card-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UniversityLogo size="sm" />
              <p className="font-display text-base font-bold text-foreground">{t(UNIVERSITY.sigla)}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{UNIVERSITY.morada}</p>
            <p className="text-xs text-muted-foreground">
              {UNIVERSITY.contacto} · NUIT {UNIVERSITY.nuit}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground">
              {t("Plataforma")}
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/portal" className="hover:text-primary transition">{t("Portal do Estudante")}</Link></li>
              <li><Link to="/orientador" className="hover:text-primary transition">{t("Orientador IA Académico")}</Link></li>
              <li><Link to="/subscricoes" className="hover:text-primary transition">{t("Planos & Subscrições")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground">
              {t("Finanças & Pagamentos")}
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/propinas" className="hover:text-primary transition">{t("Propinas & Emolumentos")}</Link></li>
              <li><Link to="/pagamentos" className="hover:text-primary transition">{t("Gateway M-Pesa & Base Pay")}</Link></li>
              <li><Link to="/recibos" className="hover:text-primary transition">{t("Validação de Recibos")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-foreground">
              {t("Segurança & Web3")}
            </p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Infraestrutura descentralizada na Base Network (Chain 84532) com persistência segura em MongoDB.
            </p>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {UNIVERSITY.nome} · {t("Todos os direitos reservados.")}
        </div>
      </footer>
    </div>
  );
}

export function StatusBadge({ estado }: { estado: "pago" | "pendente" | "vencido" }) {
  const { t } = useI18n();
  const map = {
    pago: "bg-success/15 text-success border-success/30 font-semibold",
    pendente: "bg-warning/15 text-warning-foreground border-warning/40 font-semibold",
    vencido: "bg-destructive/15 text-destructive border-destructive/30 font-semibold",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize shadow-2xs ${map[estado]}`}
    >
      <span className="size-1.5 rounded-full bg-current animate-pulse" />
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
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {(titulo || acao) && (
        <div className="flex items-center justify-between gap-4 border-b border-border/80 bg-muted/30 px-6 py-4">
          {titulo && (
            <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
              {titulo}
            </h2>
          )}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

