import React, { useState } from "react";
import { Shell, Panel } from "@/components/Shell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Calculator, Award, TrendingUp, BookOpen, CheckCircle, Sparkles, Target, BarChart3 } from "lucide-react";

export function AcademicAnalytics() {
  const { t } = useI18n();
  const { user } = useAuth();

  // GPA Simulator state
  const [courses, setCourses] = useState([
    { id: 1, name: "Arquitetura de Sistemas Distribuídos", credits: 6, grade: 16 },
    { id: 2, name: "Inteligência Artificial & Machine Learning", credits: 6, grade: 18 },
    { id: 3, name: "Segurança de Redes & Criptografia", credits: 5, grade: 15 },
    { id: 4, name: "Gestão de Projetos Tecnológicos", credits: 4, grade: 17 },
    { id: 5, name: "Trabalho de Fim de Curso (TFC I)", credits: 10, grade: 18 },
  ]);

  const [newCourseName, setNewCourseName] = useState("");
  const [newCredits, setNewCredits] = useState(5);
  const [newGrade, setNewGrade] = useState(14);

  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    setCourses([
      ...courses,
      { id: Date.now(), name: newCourseName, credits: Number(newCredits), grade: Number(newGrade) },
    ]);
    setNewCourseName("");
  };

  const removeCourse = (id: number) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  // Calculations (Moçambique 0-20 scale)
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const weightedSum = courses.reduce((acc, c) => acc + c.credits * c.grade, 0);
  const currentGPA = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";
  const numGPA = parseFloat(currentGPA);

  const classification =
    numGPA >= 18
      ? "Excelente com Distinção (Summa Cum Laude)"
      : numGPA >= 16
      ? "Muito Bom (Magna Cum Laude)"
      : numGPA >= 14
      ? "Bom"
      : numGPA >= 10
      ? "Suficiente (Aprovado)"
      : "Insuficiente";

  return (
    <Shell
      titulo={t("Analytics Académico & Simulador de Média")}
      descricao={t("Simule notas futuras, calcule a sua média ponderada em tempo real (Escala 0-20) e analise o seu progresso curricular na Universidade Leonardo.")}
    >
      <div className="space-y-8">
        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
              <TrendingUp className="size-16" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Média Ponderada Atual")}</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground">{currentGPA}</span>
              <span className="text-sm font-semibold text-muted-foreground">/ 20.00</span>
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="size-3.5" /> {classification}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
              <BookOpen className="size-16" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Total de Créditos (ECTS)")}</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground">{totalCredits}</span>
              <span className="text-sm font-semibold text-muted-foreground">{t("Créditos")}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {courses.length} {t("unidades curriculares contabilizadas no semestre.")}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-accent/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
              <Award className="size-16" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("Elegibilidade para Bolsa")}</span>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-foreground">
                {numGPA >= 14 ? t("Elegível 🌟") : t("Em Progresso")}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {numGPA >= 14
                ? t("A sua média cumpre os critérios para apoio financeiro e isenção parcial.")
                : t("Aumente a sua média para 14.0 para desbloquear bolsas de mérito.")}
            </p>
          </div>
        </div>

        {/* GPA Simulator Table & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel
              titulo={t("Unidades Curriculares & Simulador de Notas")}
              acao={
                <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-mono text-muted-foreground">
                  {t("Escala de 0 a 20 valores")}
                </span>
              }
            >
              <div className="p-6 space-y-4">
                <div className="divide-y divide-border">
                  {courses.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{t("Créditos ECTS: ")}{c.credits}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono text-base font-extrabold text-primary">{c.grade} / 20</span>
                          <span className="text-[10px] text-muted-foreground block">{t("Ponderação: ")}{c.credits * c.grade}</span>
                        </div>
                        <button
                          onClick={() => removeCourse(c.id)}
                          className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                          title={t("Remover")}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new course form */}
                <form onSubmit={addCourse} className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Nome da Disciplina")}</label>
                    <input
                      type="text"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder={t("Ex: Computação em Nuvem")}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Créditos (ECTS)")}</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newCredits}
                      onChange={(e) => setNewCredits(Number(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Nota Esperada (0-20)")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={newGrade}
                        onChange={(e) => setNewGrade(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition shrink-0 cursor-pointer"
                      >
                        {t("+ Adicionar")}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel titulo={t("Metas Académicas & Recomendações IA")}>
              <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-3 bg-muted/30 p-3.5 rounded-lg border border-border">
                  <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">{t("Análise Inteligente")}</p>
                    <p className="mt-1">
                      {t("Com uma média de")} <span className="font-bold text-primary">{currentGPA}</span>{t(", o seu desempenho situa-se no top 10% da turma de")} {user?.curso || "Engenharia Informática"}.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Target className="size-4 text-emerald-500" />
                    <span>{t("Próximo Objetivo")}</span>
                  </p>
                  <p>
                    {t("Para alcançar a menção de")} <strong>Excelente (17.0+)</strong>{t(", mantenha notas acima de 17 nas unidades curriculares de TFC e Inteligência Artificial.")}
                  </p>
                </div>

                <div className="pt-2 border-t border-border">
                  <a
                    href="/orientador"
                    className="block w-full text-center bg-primary/10 text-primary font-bold py-2.5 rounded-lg hover:bg-primary/20 transition"
                  >
                    {t("Consultar Orientador IA ➔")}
                  </a>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Shell>
  );
}
