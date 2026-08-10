import React from "react";
import { Link } from "@/lib/router";
import { UNIVERSITY } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import heroDefault from "@/assets/campus-hero.jpg";

const NAV = [
  { to: "/", label: "Painel" },
  { to: "/orientador", label: "Orientador IA" },
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
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-xs">
          <div className="flex flex-wrap gap-4 opacity-85">
            <span>{t("Portal do estudante")}</span>
            <span>{t("Apoio financeiro")}</span>
            <span>{t("Contactos")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 opacity-70">{t("Idioma")}:</span>
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-sm px-2 py-0.5 uppercase transition ${
                  lang === l
                    ? "bg-primary-foreground font-semibold text-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center bg-primary font-display text-lg font-bold text-primary-foreground">
              {UNIVERSITY.sigla.slice(0, 2)}
            </span>
            <div>
              <p className="font-display text-base leading-tight font-bold text-primary">
                {t(UNIVERSITY.nome)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Sistema de Gestão · Módulo Financeiro")}
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                exact={n.to === "/"}
                className="border-b-2 border-transparent px-3 py-2 text-foreground/75 transition hover:border-accent hover:text-primary"
                activeClassName="border-accent text-primary font-semibold"
              >
                {t(n.label)}
              </Link>
            ))}
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
