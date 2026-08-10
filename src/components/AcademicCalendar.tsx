import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, FileSpreadsheet, ChevronRight } from "lucide-react";

interface Milestone {
  id: string;
  data: string;
  dia: string;
  mes: string;
  titulo: string;
  descricao: string;
  categoria: "propina" | "matricula" | "exame" | "evento";
  diasResta: number;
  urgente?: boolean;
}

const MILESTONES: Milestone[] = [
  {
    id: "m1",
    data: "2026-03-10",
    dia: "10",
    mes: "MAR",
    titulo: "Vencimento da 1.ª Propina Lectiva (Semestre I)",
    descricao: "Data limite para liquidação da 1.ª parcela sem agravamento de taxa de mora.",
    categoria: "propina",
    diasResta: 14,
    urgente: true,
  },
  {
    id: "m2",
    data: "2026-03-20",
    dia: "20",
    mes: "MAR",
    titulo: "Encerramento das Inscrições Disciplinares",
    descricao: "Validação final das turmas e regularização administrativa de matrículas.",
    categoria: "matricula",
    diasResta: 24,
  },
  {
    id: "m3",
    data: "2026-04-15",
    dia: "15",
    mes: "ABR",
    titulo: "Verificação de Situação Financeira p/ Testes I",
    descricao: "Emissão de guias e declarações de quitação para admissão aos primeiros testes.",
    categoria: "exame",
    diasResta: 50,
  },
  {
    id: "m4",
    data: "2026-05-10",
    dia: "10",
    mes: "MAI",
    titulo: "Vencimento da 2.ª Propina Lectiva",
    descricao: "Segunda parcela lectiva do 1.º Semestre para estudantes inscritos.",
    categoria: "propina",
    diasResta: 75,
  },
  {
    id: "m5",
    data: "2026-06-25",
    dia: "25",
    mes: "JUN",
    titulo: "Época Normal de Exames de Fim do Semestre I",
    descricao: "Obrigatoriedade de ter a situação financeira integralmente regularizada.",
    categoria: "exame",
    diasResta: 120,
  },
];

export function AcademicCalendar() {
  const { t } = useI18n();
  const [filterCat, setFilterCat] = useState<string>("todos");

  const filtered = MILESTONES.filter(
    (m) => filterCat === "todos" || m.categoria === filterCat
  );

  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <CalendarIcon className="size-3.5" />
            <span>{t("Calendário Académico & Financeiro 2026")}</span>
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("Próximos Milestones & Datas Limite de Pagamento")}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["todos", "propina", "matricula", "exame"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`rounded-sm border px-3 py-1 font-medium capitalize transition ${
                filterCat === cat
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filtered.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border p-4 transition ${
              m.urgente
                ? "border-accent/60 bg-accent/5"
                : "border-border bg-card hover:bg-muted/10"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Date Badge */}
              <div
                className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-sm font-display font-bold ${
                  m.urgente
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <span className="text-base leading-none">{m.dia}</span>
                <span className="text-[10px] uppercase tracking-wider leading-none mt-0.5">
                  {m.mes}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    {t(m.titulo)}
                  </h3>
                  {m.urgente && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      <AlertCircle className="size-3" />
                      <span>{t("Data Próxima")}</span>
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {t(m.descricao)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60 shrink-0">
              <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                <Clock className="size-3.5 text-primary" />
                <span>
                  {m.diasResta} {t("dias restantes")}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
