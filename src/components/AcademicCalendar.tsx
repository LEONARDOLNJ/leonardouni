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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
            <CalendarIcon className="size-3.5" />
            <span>{t("Calendário Académico & Financeiro 2026")}</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-foreground">
            {t("Próximos Milestones & Datas Limite de Pagamento")}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
          {["todos", "propina", "matricula", "exame"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`rounded-lg px-3 py-1.5 font-bold capitalize transition-all cursor-pointer ${
                filterCat === cat
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="grid gap-3 sm:grid-cols-1">
        {filtered.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-xs ${
              m.urgente
                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                : "border-border/80 bg-card hover:bg-muted/20 hover:border-primary/30"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Date Badge */}
              <div
                className={`flex size-13 shrink-0 flex-col items-center justify-center rounded-xl font-display font-black border shadow-2xs ${
                  m.urgente
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                <span className="text-lg leading-none">{m.dia}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider leading-none mt-1">
                  {m.mes}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-foreground">
                    {t(m.titulo)}
                  </h3>
                  {m.urgente && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="size-3" />
                      <span>{t("Data Próxima")}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  {t(m.descricao)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60 shrink-0">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-lg border border-border/60">
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
