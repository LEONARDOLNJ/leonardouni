import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { mzn, CURSOS, type Student } from "@/lib/uni-data";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  Filter,
  Layers,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Download,
  Info,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface CoursePaymentComparisonWidgetProps {
  students: Student[];
  getStudentStats: (studentId: string) => {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  selectedCourseFilter?: string;
  onFilterCourse?: (curso: string) => void;
  onFilterStatus?: (status: "all" | "debt" | "paid" | "partial") => void;
}

export type DepartmentKey = "FCT" | "FEG" | "FCS" | "FDIR" | "OUTROS";

export const FACULTIES_MAP: Record<string, { dept: DepartmentKey; deptName: string; short: string }> = {
  "Engenharia Informática": { dept: "FCT", deptName: "Faculdade de Ciências e Tecnologias", short: "FCT" },
  "Arquitectura": { dept: "FCT", deptName: "Faculdade de Ciências e Tecnologias", short: "FCT" },
  "Engenharia Civil": { dept: "FCT", deptName: "Faculdade de Ciências e Tecnologias", short: "FCT" },
  "Gestão de Empresas": { dept: "FEG", deptName: "Faculdade de Economia e Gestão", short: "FEG" },
  "Economia & Gestão": { dept: "FEG", deptName: "Faculdade de Economia e Gestão", short: "FEG" },
  "Contabilidade & Auditoria": { dept: "FEG", deptName: "Faculdade de Economia e Gestão", short: "FEG" },
  "Medicina": { dept: "FCS", deptName: "Faculdade de Ciências da Saúde", short: "FCS" },
  "Medicina Dentária": { dept: "FCS", deptName: "Faculdade de Ciências da Saúde", short: "FCS" },
  "Psicologia Clínica": { dept: "FCS", deptName: "Faculdade de Ciências da Saúde", short: "FCS" },
  "Direito": { dept: "FDIR", deptName: "Faculdade de Direito", short: "FDIR" },
};

export function CoursePaymentComparisonWidget({
  students,
  getStudentStats,
  selectedCourseFilter,
  onFilterCourse,
  onFilterStatus,
}: CoursePaymentComparisonWidgetProps) {
  const { t } = useI18n();
  const [viewMetric, setViewMetric] = useState<"students_count" | "financial_amount" | "collection_rate">("students_count");
  const [groupBy, setGroupBy] = useState<"courses" | "departments">("courses");
  const [chartLayout, setChartLayout] = useState<"stacked" | "grouped">("stacked");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compute detailed financial and student count metrics per course
  const courseComparisonData = useMemo(() => {
    // Collect all distinct courses present in students or standard CURSOS
    const courseNames = Array.from(new Set([...CURSOS, ...students.map((s) => s.curso)])).filter(Boolean);

    return courseNames.map((curso) => {
      const courseStudents = students.filter((s) => s.curso === curso);
      const totalStudents = courseStudents.length;

      let regularizados = 0; // 100% paid
      let parciais = 0;      // partial
      let emDivida = 0;      // not paid at all or in full debt
      let totalFacturado = 0;
      let totalPago = 0;
      let totalPendente = 0;

      courseStudents.forEach((st) => {
        const stats = getStudentStats(st.id);
        totalFacturado += stats.totalInvoiced;
        totalPago += stats.totalPaid;
        totalPendente += stats.totalOutstanding;

        if (stats.totalOutstanding === 0 && stats.totalInvoiced > 0) {
          regularizados += 1;
        } else if (stats.totalPaid > 0 && stats.totalOutstanding > 0) {
          parciais += 1;
        } else if (stats.totalOutstanding > 0) {
          emDivida += 1;
        } else {
          regularizados += 1;
        }
      });

      const taxaAdimplencia = totalFacturado > 0 ? Math.round((totalPago / totalFacturado) * 100) : 100;
      const deptInfo = FACULTIES_MAP[curso] || { dept: "OUTROS", deptName: "Outras Unidades", short: "OUT" };

      // Short display name for chart ticks
      let shortName = curso;
      if (curso === "Engenharia Informática") shortName = "Eng. Informática";
      else if (curso === "Gestão de Empresas") shortName = "Gestão Emp.";
      else if (curso === "Contabilidade & Auditoria") shortName = "Contab. & Audit.";
      else if (curso === "Economia & Gestão") shortName = "Economia";

      return {
        curso,
        shortName,
        dept: deptInfo.dept,
        deptName: deptInfo.deptName,
        deptShort: deptInfo.short,
        totalStudents,
        regularizados,
        parciais,
        emDivida,
        totalFacturado,
        totalPago,
        totalPendente,
        taxaAdimplencia,
      };
    }).filter((c) => c.totalStudents > 0 || CURSOS.includes(c.curso));
  }, [students, getStudentStats]);

  // Aggregate by Department/Faculty if needed
  const departmentComparisonData = useMemo(() => {
    const deptMap: Record<string, {
      dept: string;
      deptName: string;
      totalStudents: number;
      regularizados: number;
      parciais: number;
      emDivida: number;
      totalFacturado: number;
      totalPago: number;
      totalPendente: number;
    }> = {};

    courseComparisonData.forEach((c) => {
      if (!deptMap[c.deptShort]) {
        deptMap[c.deptShort] = {
          dept: c.deptShort,
          deptName: c.deptName,
          totalStudents: 0,
          regularizados: 0,
          parciais: 0,
          emDivida: 0,
          totalFacturado: 0,
          totalPago: 0,
          totalPendente: 0,
        };
      }
      const d = deptMap[c.deptShort];
      d.totalStudents += c.totalStudents;
      d.regularizados += c.regularizados;
      d.parciais += c.parciais;
      d.emDivida += c.emDivida;
      d.totalFacturado += c.totalFacturado;
      d.totalPago += c.totalPago;
      d.totalPendente += c.totalPendente;
    });

    return Object.values(deptMap).map((d) => ({
      ...d,
      shortName: d.dept,
      curso: d.deptName,
      taxaAdimplencia: d.totalFacturado > 0 ? Math.round((d.totalPago / d.totalFacturado) * 100) : 100,
    }));
  }, [courseComparisonData]);

  const activeData = groupBy === "courses" ? courseComparisonData : departmentComparisonData;

  // Global KPIs across all courses
  const globalSummary = useMemo(() => {
    const totalStudents = students.length;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalRegular = 0;
    let totalPartial = 0;
    let totalDebt = 0;

    courseComparisonData.forEach((c) => {
      totalInvoiced += c.totalFacturado;
      totalPaid += c.totalPago;
      totalOutstanding += c.totalPendente;
      totalRegular += c.regularizados;
      totalPartial += c.parciais;
      totalDebt += c.emDivida;
    });

    const globalRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

    // Course with highest collection rate
    const sortedByRate = [...courseComparisonData].filter(c => c.totalStudents > 0).sort((a, b) => b.taxaAdimplencia - a.taxaAdimplencia);
    const bestCourse = sortedByRate[0];

    // Course with highest outstanding debt
    const sortedByDebt = [...courseComparisonData].sort((a, b) => b.totalPendente - a.totalPendente);
    const highestDebtCourse = sortedByDebt[0];

    return {
      totalStudents,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalRegular,
      totalPartial,
      totalDebt,
      globalRate,
      bestCourse,
      highestDebtCourse,
    };
  }, [students, courseComparisonData]);

  // Export CSV report of course fee stats
  const handleExportCSV = () => {
    const headers = "Curso / Departamento,Faculdade,Total Estudantes,Regularizados (100%),Parcialmente Pagos,Em Dívida Total,Total Facturado (MZN),Total Arrecadado (MZN),Saldo Pendente (MZN),Taxa de Cumprimento (%)\n";
    const rows = courseComparisonData
      .map(
        (c) =>
          `"${c.curso}","${c.deptName}",${c.totalStudents},${c.regularizados},${c.parciais},${c.emDivida},${c.totalFacturado},${c.totalPago},${c.totalPendente},${c.taxaAdimplencia}%`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparativo_propinas_cursos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all mb-6">
      {/* Header Bar */}
      <div className="p-5 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {t("Secretaria Financeira · Recharts Analytics")}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t("Comparativo por Curso & Faculdade")}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mt-0.5 flex items-center gap-2">
              {t("Distribuição do Estado de Pagamento de Propinas")}
            </h3>
          </div>
        </div>

        {/* Controls Ribbon */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group By Toggle */}
          <div className="flex items-center bg-background p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setGroupBy("courses")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                groupBy === "courses"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Por Cursos")}
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("departments")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                groupBy === "departments"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Por Faculdades")}
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center bg-background p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setViewMetric("students_count")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMetric === "students_count"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("Contagem de Estudantes por Estado de Propina")}
            >
              <Users className="size-3.5 inline mr-1" />
              <span>{t("Estudantes")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMetric("financial_amount")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMetric === "financial_amount"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("Montantes Financeiros (MZN Pago vs Pendente)")}
            >
              <DollarSign className="size-3.5 inline mr-1" />
              <span>{t("Valores (MZN)")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMetric("collection_rate")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMetric === "collection_rate"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("Taxa de Cumprimento & Quitação (%)")}
            >
              <TrendingUp className="size-3.5 inline mr-1" />
              <span>{t("% Quitação")}</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
            title={t("Exportar Relatório Comparativo em CSV")}
          >
            <Download className="size-4" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1: Global Collection Rate */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                {t("Taxa Global de Quitação")}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-foreground font-display">
                  {globalSummary.globalRate}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({mzn(globalSummary.totalPaid)})
                </span>
              </div>
            </div>

            {/* KPI 2: Fully Paid Students */}
            <div
              onClick={() => onFilterStatus && onFilterStatus("paid")}
              className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                <span className="text-foreground">{t("100% Regularizados")}</span>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-foreground">
                {globalSummary.totalRegular}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {globalSummary.totalStudents} {t("alunos")}
                </span>
              </p>
            </div>

            {/* KPI 3: Students in Debt */}
            <div
              onClick={() => onFilterStatus && onFilterStatus("debt")}
              className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 hover:bg-destructive/15 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-destructive">
                <span>{t("Com Saldo Pendente")}</span>
                <AlertTriangle className="size-3.5 text-destructive" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-destructive">
                {globalSummary.totalDebt + globalSummary.totalPartial}{" "}
                <span className="text-xs font-normal text-destructive/80">
                  ({mzn(globalSummary.totalOutstanding)})
                </span>
              </p>
            </div>

            {/* KPI 4: Best Performing Course */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary block truncate">
                {t("Maior Adimplência")}
              </span>
              <p className="mt-1 text-sm font-bold text-foreground truncate">
                {globalSummary.bestCourse?.curso || "N/A"}
              </p>
              <span className="text-[11px] text-primary font-mono font-bold block">
                {globalSummary.bestCourse?.taxaAdimplencia || 100}% {t("liquidado")}
              </span>
            </div>
          </div>

          {/* Recharts Chart Canvas */}
          <div className="rounded-xl border border-border/70 bg-background/60 p-4">
            {/* Chart Subheader with Legend & Layout switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-border/50 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="size-3.5 text-primary" />
                <span>
                  {viewMetric === "students_count"
                    ? t("Contagem de alunos categorizados por quitação de propinas e taxas")
                    : viewMetric === "financial_amount"
                    ? t("Comparação entre o volume arrecadado e o valor ainda em aberto (MZN)")
                    : t("Percentual de cumprimento do plano de propinas por área científica")}
                </span>
              </div>

              {viewMetric === "students_count" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground text-[11px]">{t("Disposição")}:</span>
                  <button
                    type="button"
                    onClick={() => setChartLayout("stacked")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                      chartLayout === "stacked"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("Empilhado")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartLayout("grouped")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                      chartLayout === "grouped"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("Lado a Lado")}
                  </button>
                </div>
              )}
            </div>

            {/* CHART 1: STUDENTS COUNT (STACKED / GROUPED BAR) */}
            {viewMetric === "students_count" && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0] && onFilterCourse) {
                        const clicked = e.activePayload[0].payload;
                        if (clicked.curso && groupBy === "courses") {
                          onFilterCourse(clicked.curso);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: "var(--color-foreground, #cbd5e1)" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={35}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-foreground, #cbd5e1)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(150,150,150,0.08)" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[200px]">
                            <p className="font-bold text-foreground border-b border-border pb-1">
                              {data.curso}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{data.deptName}</p>
                            <div className="space-y-1 pt-1 font-mono">
                              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                <span>{t("Regularizados (100%)")}:</span>
                                <span className="font-bold">{data.regularizados}</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-500">
                                <span>{t("Parcialmente Pagos")}:</span>
                                <span className="font-bold">{data.parciais}</span>
                              </div>
                              <div className="flex items-center justify-between text-destructive">
                                <span>{t("Em Dívida Total")}:</span>
                                <span className="font-bold">{data.emDivida}</span>
                              </div>
                              <div className="flex items-center justify-between text-foreground pt-1 border-t border-border font-bold">
                                <span>{t("Total Alunos")}:</span>
                                <span>{data.totalStudents}</span>
                              </div>
                              <div className="flex items-center justify-between text-primary font-bold">
                                <span>{t("Taxa de Quitação")}:</span>
                                <span>{data.taxaAdimplencia}%</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic pt-1 text-center">
                              {t("Clique para filtrar a tabela de estudantes")}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(val) => <span className="text-foreground text-xs">{val}</span>}
                    />
                    <Bar
                      dataKey="regularizados"
                      name={t("100% Regularizado")}
                      fill="#10b981"
                      stackId={chartLayout === "stacked" ? "a" : undefined}
                      radius={chartLayout === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="parciais"
                      name={t("Parcialmente Pago")}
                      fill="#f59e0b"
                      stackId={chartLayout === "stacked" ? "a" : undefined}
                      radius={chartLayout === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="emDivida"
                      name={t("Em Dívida Total")}
                      fill="#ef4444"
                      stackId={chartLayout === "stacked" ? "a" : undefined}
                      radius={chartLayout === "stacked" ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 2: FINANCIAL AMOUNTS (MZN PAID VS OUTSTANDING WITH COMPOSED LINE) */}
            {viewMetric === "financial_amount" && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={activeData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: "var(--color-foreground, #cbd5e1)" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={35}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: "var(--color-foreground, #cbd5e1)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "var(--color-foreground, #cbd5e1)" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[220px]">
                            <p className="font-bold text-foreground border-b border-border pb-1">
                              {data.curso}
                            </p>
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                <span>{t("Arrecadado / Liquidado")}:</span>
                                <span className="font-mono font-bold">{mzn(data.totalPago)}</span>
                              </div>
                              <div className="flex items-center justify-between text-destructive">
                                <span>{t("Saldo em Dívida")}:</span>
                                <span className="font-mono font-bold">{mzn(data.totalPendente)}</span>
                              </div>
                              <div className="flex items-center justify-between text-foreground pt-1 border-t border-border font-bold">
                                <span>{t("Total Facturado")}:</span>
                                <span className="font-mono">{mzn(data.totalFacturado)}</span>
                              </div>
                              <div className="flex items-center justify-between text-primary font-bold">
                                <span>{t("Taxa de Arrecadação")}:</span>
                                <span className="font-mono">{data.taxaAdimplencia}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar
                      yAxisId="left"
                      dataKey="totalPago"
                      name={t("Arrecadado (MZN)")}
                      fill="#163a32"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="totalPendente"
                      name={t("Pendente / Em Dívida (MZN)")}
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="taxaAdimplencia"
                      name={t("% Quitação")}
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#f59e0b" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 3: COLLECTION RATE % */}
            {viewMetric === "collection_rate" && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="shortName"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1 min-w-[180px]">
                            <p className="font-bold text-foreground">{data.curso}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                              {data.taxaAdimplencia}% {t("liquidado")}
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              {mzn(data.totalPago)} {t("de")} {mzn(data.totalFacturado)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="taxaAdimplencia"
                      name={t("Taxa de Quitação (%)")}
                      radius={[0, 6, 6, 0]}
                    >
                      {activeData.map((entry, index) => {
                        const color =
                          entry.taxaAdimplencia >= 80
                            ? "#10b981"
                            : entry.taxaAdimplencia >= 50
                            ? "#f59e0b"
                            : "#ef4444";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Interactive Course Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Filter className="size-3.5 text-primary" />
              <span>{t("Filtrar Tabela por Curso")}:</span>
            </span>
            <button
              type="button"
              onClick={() => onFilterCourse && onFilterCourse("all")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                !selectedCourseFilter || selectedCourseFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              {t("Todos os Cursos")} ({students.length})
            </button>
            {courseComparisonData.map((c) => (
              <button
                key={c.curso}
                type="button"
                onClick={() => onFilterCourse && onFilterCourse(c.curso)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCourseFilter === c.curso
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                <span>{c.shortName}</span>
                <span
                  className={`size-2 rounded-full ${
                    c.taxaAdimplencia >= 80
                      ? "bg-emerald-500"
                      : c.taxaAdimplencia >= 50
                      ? "bg-amber-500"
                      : "bg-destructive"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
