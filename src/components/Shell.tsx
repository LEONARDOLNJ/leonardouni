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
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-4 opacity-85">
            <Link to="/portal" className="hover:underline flex items-center gap-1">
              <GraduationCap className="size-3.5" />
              <span>{t("Portal do Estudante")}</span>
            </Link>
            <span>{t("Apoio financeiro")}</span>
            <span>{t("Contactos")}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 rounded-sm bg-primary-foreground/10 px-2 py-0.5 hover:bg-primary-foreground/20 transition text-xs"
              title={theme === "dark" ? t("Modo Claro") : t("Modo Escuro")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="size-3.5 text-amber-300" />
                  <span className="text-[11px] font-medium">{t("Claro")}</span>
                </>
              ) : (
                <>
                  <Moon className="size-3.5 text-blue-200" />
                  <span className="text-[11px] font-medium">{t("Escuro")}</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <Globe className="size-3.5 opacity-70 mr-0.5" />
              {(["pt", "en", "fr", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l as Lang)}
                  aria-pressed={lang === l}
                  className={`rounded-sm px-1.5 py-0.5 uppercase text-[11px] transition ${
                    lang === l
                      ? "bg-primary-foreground font-semibold text-primary"
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
            <div className="flex items-center gap-2 border-l border-primary-foreground/20 pl-2 sm:pl-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/portal"
                    className="flex items-center gap-1.5 rounded-sm bg-primary-foreground/10 px-2 py-0.5 hover:bg-primary-foreground/20 transition text-xs font-semibold"
                  >
                    <User className="size-3.5" />
                    <span className="truncate max-w-[110px]">{user.nome.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title={t("Sair")}
                    className="opacity-70 hover:opacity-100 transition p-0.5"
                  >
                    <LogOut className="size-3.5 text-red-300" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 font-semibold hover:underline mr-1"
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

      <header className="border-b border-border bg-card shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <UniversityLogo size="md" />
            <div>
              <p className="font-display text-base leading-tight font-bold text-primary group-hover:text-accent transition">
                {t(UNIVERSITY.nome)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Sistema de Gestão · Módulo Financeiro")}
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                exact={n.to === "/"}
                className="border-b-2 border-transparent px-2.5 py-2 text-foreground/75 transition hover:border-accent hover:text-primary"
                activeClassName="border-accent text-primary font-semibold"
              >
                {t(n.label)}
              </Link>
            ))}
            <Link
              to="/login"
              className="border-b-2 border-transparent px-2.5 py-2 text-primary font-semibold transition hover:border-accent"
              activeClassName="border-accent text-primary font-bold"
            >
              {t("Portal do Estudante")}
            </Link>

            {/* Sign in with Base Button in Main Header Nav */}
            <div className="ml-1 sm:ml-2 shrink-0">
              <SignInWithBaseButton variant="header" />
            </div>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img
          src={imagem ?? heroDefault}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 size-full object-cover opacity-30"
        />
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-bold tracking-tight">
            {t(titulo)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90">{t(descricao)}</p>
        </div>
        <div className="h-1 bg-accent" />
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

      <footer className="mt-12 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2">
          <div>
            <p className="font-display text-base font-bold">{t(UNIVERSITY.nome)}</p>
            <p className="mt-2 text-xs opacity-80">{UNIVERSITY.morada}</p>
            <p className="mt-1 text-xs opacity-80">
              {UNIVERSITY.contacto} · NUIT {UNIVERSITY.nuit}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-70">
              {t("Ligações rápidas")}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="opacity-85 transition hover:opacity-100 hover:underline">
                    {t(n.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/15 py-4 text-center text-xs opacity-70">
          © {new Date().getFullYear()} {UNIVERSITY.sigla} · {t("Todos os direitos reservados.")}
        </div>
      </footer>
    </div>
  );
}

export function StatusBadge({ estado }: { estado: "pago" | "pendente" | "vencido" }) {
  const { t } = useI18n();
  const map = {
    pago: "bg-success/12 text-success border-success/30",
    pendente: "bg-warning/15 text-warning-foreground border-warning/40",
    vencido: "bg-destructive/10 text-destructive border-destructive/30",
  } as const;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[estado]}`}
    >
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
    <section className="rounded-sm border border-border bg-card">
      {(titulo || acao) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          {titulo && (
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
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
