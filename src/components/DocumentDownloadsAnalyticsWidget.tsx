import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { UNIVERSITY, CURSOS, students, dataPt } from "@/lib/uni-data";
import {
  getDocumentDownloadLogs,
  recordDocumentDownload,
  DOCUMENT_TYPE_LABELS,
  type DocumentDownloadEvent,
  type DocumentTypeKey,
} from "@/lib/document-analytics-tracker";
import {
  FileText,
  Download,
  TrendingUp,
  Clock,
  Building,
  Filter,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Globe,
  HardDrive,
  Users,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Search,
} from "lucide-react";

export interface DocumentDownloadsAnalyticsWidgetProps {
  variant?: "full" | "compact" | "card";
  onViewDetailedReports?: () => void;
}

export function DocumentDownloadsAnalyticsWidget({
  variant = "full",
  onViewDetailedReports,
}: DocumentDownloadsAnalyticsWidgetProps) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<DocumentDownloadEvent[]>([]);
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "year">("7d");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [activeChartTab, setActiveChartTab] = useState<"frequency" | "types" | "faculty" | "hourly">("frequency");
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  // Load logs and listen to reactive events
  const loadData = () => {
    setLogs(getDocumentDownloadLogs());
  };

  useEffect(() => {
    loadData();

    const handleNewDownload = (e: any) => {
      if (e?.detail) {
        setLogs((prev) => [e.detail, ...prev]);
      } else {
        loadData();
      }
    };

    window.addEventListener("document-download-recorded", handleNewDownload);
    window.addEventListener("storage", handleNewDownload);
    return () => {
      window.removeEventListener("document-download-recorded", handleNewDownload);
      window.removeEventListener("storage", handleNewDownload);
    };
  }, []);

  // Filter logs according to time range, document type, and course
  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      
      // Time Filter
      if (timeRange === "today") {
        const isSameDay =
          logDate.getFullYear() === now.getFullYear() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getDate() === now.getDate();
        if (!isSameDay) return false;
      } else if (timeRange === "7d") {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (timeRange === "30d") {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      // Type Filter
      if (selectedTypeFilter !== "all" && log.documentType !== selectedTypeFilter) {
        return false;
      }

      // Course Filter
      if (selectedCourseFilter !== "all" && log.curso !== selectedCourseFilter) {
        return false;
      }

      return true;
    });
  }, [logs, timeRange, selectedTypeFilter, selectedCourseFilter]);

  // Aggregate: Frequency Over Time (Daily)
  const dailyFrequencyData = useMemo(() => {
    const map: Record<string, { date: string; displayDate: string; total: number; recibos: number; declaracoes: number; certificados: number; outros: number }> = {};
    
    // Default days span based on range
    const daysCount = timeRange === "today" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 60;
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const display = d.toLocaleDateString("pt-MZ", { day: "numeric", month: "short" });
      map[key] = { date: key, displayDate: display, total: 0, recibos: 0, declaracoes: 0, certificados: 0, outros: 0 };
    }

    filteredLogs.forEach((log) => {
      const key = log.timestamp.split("T")[0];
      if (!map[key]) {
        const d = new Date(log.timestamp);
        map[key] = {
          date: key,
          displayDate: d.toLocaleDateString("pt-MZ", { day: "numeric", month: "short" }),
          total: 0,
          recibos: 0,
          declaracoes: 0,
          certificados: 0,
          outros: 0,
        };
      }
      map[key].total += 1;
      if (log.documentType === "RECIBO_PROPINA") map[key].recibos += 1;
      else if (log.documentType === "DECLARACAO_QUITACAO") map[key].declaracoes += 1;
      else if (log.documentType === "CERTIFICADO_MATRICULA" || log.documentType === "CERTIFICADO_NOTAS") map[key].certificados += 1;
      else map[key].outros += 1;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredLogs, timeRange]);

  // Aggregate: Distribution by Document Type
  const typeDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      counts[log.documentType] = (counts[log.documentType] || 0) + 1;
    });

    const result = (Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTypeKey[]).map((key) => {
      const count = counts[key] || 0;
      const pct = filteredLogs.length > 0 ? Math.round((count / filteredLogs.length) * 100) : 0;
      return {
        key,
        name: t(DOCUMENT_TYPE_LABELS[key].label),
        value: count,
        percentage: pct,
        color: DOCUMENT_TYPE_LABELS[key].color,
      };
    });

    return result.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredLogs, t]);

  // Aggregate: Distribution by Faculty / Course
  const facultyDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      counts[log.curso] = (counts[log.curso] || 0) + 1;
    });

    return CURSOS.map((curso) => {
      const count = counts[curso] || 0;
      return {
        curso,
        downloads: count,
      };
    }).sort((a, b) => b.downloads - a.downloads);
  }, [filteredLogs]);

  // Aggregate: Hourly distribution (08h - 20h)
  const hourlyDistributionData = useMemo(() => {
    const hoursMap: Record<number, number> = {};
    for (let h = 7; h <= 21; h++) hoursMap[h] = 0;

    filteredLogs.forEach((log) => {
      const h = new Date(log.timestamp).getHours();
      if (hoursMap[h] !== undefined) {
        hoursMap[h] += 1;
      }
    });

    return Object.keys(hoursMap).map((hStr) => {
      const h = Number(hStr);
      return {
        hour: `${h.toString().padStart(2, "0")}:00`,
        downloads: hoursMap[h],
      };
    });
  }, [filteredLogs]);

  // Aggregate: Channel distribution
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {
      "Portal do Estudante": 0,
      "App Mobile": 0,
      "Secretaria Presencial": 0,
      "Validador QR": 0,
    };
    filteredLogs.forEach((l) => {
      if (counts[l.channel] !== undefined) counts[l.channel] += 1;
      else counts[l.channel] = 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: filteredLogs.length > 0 ? Math.round((count / filteredLogs.length) * 100) : 0,
    }));
  }, [filteredLogs]);

  // KPI Metrics
  const totalDownloads = filteredLogs.length;
  const mostDownloadedType = typeDistributionData[0] || { name: t("Nenhum"), percentage: 0 };
  const totalVolumeKb = filteredLogs.reduce((sum, l) => sum + l.fileSizeKb, 0);
  const totalVolumeMb = (totalVolumeKb / 1024).toFixed(1);

  // Peak Hour
  const peakHour = useMemo(() => {
    let max = { hour: "10:00", downloads: 0 };
    hourlyDistributionData.forEach((item) => {
      if (item.downloads > max.downloads) max = item;
    });
    return max;
  }, [hourlyDistributionData]);

  // Live Simulator Trigger
  const handleSimulateDownload = () => {
    setIsSimulating(true);
    const types: DocumentTypeKey[] = [
      "RECIBO_PROPINA",
      "DECLARACAO_QUITACAO",
      "CERTIFICADO_MATRICULA",
      "EXTRACTO_FINANCEIRO",
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    
    const titles: Record<DocumentTypeKey, string> = {
      RECIBO_PROPINA: "Recibo de Propina Mensal (Fevereiro 2026)",
      DECLARACAO_QUITACAO: "Declaração de Quitação Total",
      CERTIFICADO_MATRICULA: "Certidão de Matrícula e Frequência",
      EXTRACTO_FINANCEIRO: "Extracto de Conta Corrente",
      MATRIZ_CURRICULAR: "Plano de Estudos & Matriz",
      DECLARACAO_EXAME: "Guia de Admissão a Exame",
      CERTIFICADO_NOTAS: "Histórico Académico",
    };

    setTimeout(() => {
      recordDocumentDownload(
        randomType,
        titles[randomType],
        randomStudent.id,
        randomStudent.nome,
        randomStudent.curso,
        "Portal do Estudante",
        "PDF",
        Math.floor(150 + Math.random() * 100)
      );
      setIsSimulating(false);
    }, 400);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = "ID,Tipo de Documento,Título,Estudante ID,Nome,Curso,Data e Hora,Tamanho (KB),Canal\n";
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.documentType}","${l.documentTitle}","${l.studentId}","${l.studentName}","${l.curso}","${l.timestamp}",${l.fileSizeKb},"${l.channel}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estatisticas_downloads_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Table Records
  const tableLogs = useMemo(() => {
    if (!searchTableQuery.trim()) return filteredLogs;
    const q = searchTableQuery.toLowerCase();
    return filteredLogs.filter(
      (l) =>
        l.documentTitle.toLowerCase().includes(q) ||
        l.studentName.toLowerCase().includes(q) ||
        l.studentId.toLowerCase().includes(q) ||
        l.curso.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [filteredLogs, searchTableQuery]);

  const paginatedLogs = tableLogs.slice((auditPage - 1) * 8, auditPage * 8);

  // If in card/compact mode (for overview embed)
  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {t("Estatísticas de Downloads Académicos")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("Monitorização em tempo real de emissão e descarga de recibos e certidões")}
              </p>
            </div>
          </div>
          {onViewDetailedReports && (
            <button
              type="button"
              onClick={onViewDetailedReports}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              <span>{t("Ver Métricas Completas")}</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-muted/20 border border-border">
            <span className="text-[11px] text-muted-foreground block">{t("Total Descarregado")}</span>
            <span className="text-lg font-extrabold text-foreground">{totalDownloads} {t("docs")}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">{t("Mais Emitido")}</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate block">
              {mostDownloadedType.name} ({mostDownloadedType.percentage}%)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 border border-border">
            <span className="text-[11px] text-muted-foreground block">{t("Pico Horário")}</span>
            <span className="text-base font-bold text-foreground">{peakHour.hour} ({peakHour.downloads} req)</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 border border-border">
            <span className="text-[11px] text-muted-foreground block">{t("Volume Digital")}</span>
            <span className="text-base font-bold text-foreground">{totalVolumeMb} MB</span>
          </div>
        </div>

        {/* Recharts Mini Area Chart */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyFrequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotalDownloads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#163a32" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#163a32" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card, #1e293b)",
                  borderColor: "var(--color-border, #334155)",
                  borderRadius: "0.75rem",
                  fontSize: "11px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name={t("Downloads")}
                stroke="#163a32"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotalDownloads)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Full interactive analytics dashboard
  return (
    <div className="space-y-6">
      {/* Header & Controls Ribbon */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {t("Secretaria Financeira & Auditoria")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("Relatório Analítico de Fluxo Documental")}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-1">
            {t("Frequência & Tipologia de Documentos Descarregados")}
          </h3>
        </div>

        {/* Filter controls toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            {[
              { id: "today", label: t("Hoje") },
              { id: "7d", label: t("7 Dias") },
              { id: "30d", label: t("30 Dias") },
              { id: "year", label: t("Ano 2026") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id as any)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  timeRange === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Simulate Action */}
          <button
            type="button"
            onClick={handleSimulateDownload}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
            title={t("Simula um estudante a descarregar um recibo ou certidão em directo")}
          >
            <Sparkles className={`size-3.5 text-amber-500 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? t("A emitir...") : t("Simular Download")}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span>{t("Exportar CSV")}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Volume */}
        <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-primary">
              {t("Total Descarregado")}
            </span>
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <Download className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold font-display text-foreground">
            {totalDownloads} <span className="text-sm font-normal text-muted-foreground">{t("documentos")}</span>
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="size-3.5" />
            <span>+18.4% {t("vs período anterior")}</span>
          </div>
        </div>

        {/* Tile 2: Most Popular Document */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("Documento Líder")}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground truncate">
            {mostDownloadedType.name}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("Quota no volume total")}:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {mostDownloadedType.percentage}%
            </span>
          </div>
        </div>

        {/* Tile 3: Peak Download Hour */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t("Pico de Operação")}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold font-display text-foreground">
            {peakHour.hour}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("Volume no pico")}:</span>
            <span className="font-bold text-foreground">{peakHour.downloads} {t("solicitações")}</span>
          </div>
        </div>

        {/* Tile 4: Digital Volume & Bandwidth */}
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {t("Volume Digital Poupado")}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <HardDrive className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold font-display text-foreground">
            {totalVolumeMb} <span className="text-sm font-normal text-muted-foreground">MB</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("Papel e custos poupados")}:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">~100% {t("Zero Papel")}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Column: Temporal Frequency & Faculty Distribution (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            {/* Chart Sub-tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <h4 className="font-bold text-sm text-foreground">
                  {activeChartTab === "frequency"
                    ? t("Frequência de Downloads ao Longo do Tempo")
                    : activeChartTab === "faculty"
                    ? t("Volume de Downloads por Faculdade / Curso")
                    : t("Distribuição por Horário do Dia (07h às 21h)")}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("frequency")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeChartTab === "frequency"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Evolução Temporal")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("faculty")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeChartTab === "faculty"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Por Curso")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("hourly")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeChartTab === "hourly"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Por Hora")}
                </button>
              </div>
            </div>

            {/* TAB 1: Temporal Multi-Area / Stacked Bar Frequency */}
            {activeChartTab === "frequency" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRecibos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradDeclaracoes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradCertificados" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card, #1e293b)",
                        borderColor: "var(--color-border, #334155)",
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="recibos"
                      name={t("Recibos de Propina")}
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradRecibos)"
                      stackId="1"
                    />
                    <Area
                      type="monotone"
                      dataKey="declaracoes"
                      name={t("Declarações de Quitação")}
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradDeclaracoes)"
                      stackId="1"
                    />
                    <Area
                      type="monotone"
                      dataKey="certificados"
                      name={t("Certificados de Matrícula")}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradCertificados)"
                      stackId="1"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* TAB 2: Faculty BarChart */}
            {activeChartTab === "faculty" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={facultyDistributionData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="curso" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card, #1e293b)",
                        borderColor: "var(--color-border, #334155)",
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="downloads"
                      name={t("Downloads Realizados")}
                      fill="#163a32"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* TAB 3: Hourly BarChart */}
            {activeChartTab === "hourly" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyDistributionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card, #1e293b)",
                        borderColor: "var(--color-border, #334155)",
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="downloads"
                      name={t("Frequência de Downloads")}
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Document Types Donut & Channels (1 col) */}
        <div className="space-y-6">
          {/* Donut Chart: Typology of Documents */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <PieIcon className="size-4 text-primary" />
                <h4 className="font-bold text-sm text-foreground">
                  {t("Tipologia de Documentos")}
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {typeDistributionData.length} {t("categorias")}
              </span>
            </div>

            <div className="relative h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card, #1e293b)",
                      borderColor: "var(--color-border, #334155)",
                      borderRadius: "0.75rem",
                      fontSize: "11px",
                    }}
                  />
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Central Stat Inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-extrabold text-foreground">{totalDownloads}</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("Total")}
                </span>
              </div>
            </div>

            {/* List breakdown of types */}
            <div className="space-y-2 pt-2 border-t border-border/60 max-h-48 overflow-y-auto pr-1">
              {typeDistributionData.map((tItem) => (
                <div
                  key={tItem.key}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tItem.color }}
                    />
                    <span className="text-foreground font-medium truncate">{tItem.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-foreground">{tItem.value}</span>
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                      {tItem.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channels breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h5 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              <span>{t("Canais de Descarga")}</span>
            </h5>
            <div className="space-y-2">
              {channelData.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {c.name.includes("Mobile") ? (
                        <Smartphone className="size-3 text-purple-500" />
                      ) : c.name.includes("QR") ? (
                        <ShieldCheck className="size-3 text-emerald-500" />
                      ) : (
                        <Globe className="size-3 text-blue-500" />
                      )}
                      <span>{c.name}</span>
                    </span>
                    <span className="font-bold text-foreground">
                      {c.count} ({c.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(c.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Downloads Audit Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {t("Registo Cronológico de Downloads Emitidos")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("Auditoria forense de documentos salvos em PDF ou visualizados por estudantes")}
            </p>
          </div>

          {/* Table Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => {
                setSearchTableQuery(e.target.value);
                setAuditPage(1);
              }}
              placeholder={t("Pesquisar estudante, doc, ID...")}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground uppercase text-[10px] tracking-wider bg-muted/20">
                <th className="py-3 px-3.5 font-bold">{t("ID Evento")}</th>
                <th className="py-3 px-3.5 font-bold">{t("Documento")}</th>
                <th className="py-3 px-3.5 font-bold">{t("Estudante / Titular")}</th>
                <th className="py-3 px-3.5 font-bold">{t("Curso")}</th>
                <th className="py-3 px-3.5 font-bold">{t("Canal")}</th>
                <th className="py-3 px-3.5 font-bold">{t("Data e Hora")}</th>
                <th className="py-3 px-3.5 font-bold text-right">{t("Tamanho")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((item) => {
                  const typeMeta = DOCUMENT_TYPE_LABELS[item.documentType] || {
                    label: item.documentType,
                    color: "#64748b",
                  };
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-muted-foreground">
                        {item.id}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: typeMeta.color }}
                          />
                          <span className="font-semibold text-foreground truncate max-w-xs">
                            {item.documentTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-foreground block">{item.studentName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.studentId}</span>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">{item.curso}</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border/70">
                          {item.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground font-mono text-[11px]">
                        {dataPt(item.timestamp)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-muted-foreground">
                        {item.fileSizeKb} KB
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    {t("Nenhum registo de download encontrado para os filtros selecionados.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {tableLogs.length > 8 && (
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
            <span className="text-muted-foreground">
              {t("A mostrar")} {(auditPage - 1) * 8 + 1} - {Math.min(auditPage * 8, tableLogs.length)} {t("de")}{" "}
              {tableLogs.length} {t("eventos")}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={auditPage === 1}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                {t("Anterior")}
              </button>
              <span className="px-2 py-1 font-mono text-xs font-bold text-foreground">
                {auditPage} / {Math.ceil(tableLogs.length / 8)}
              </span>
              <button
                type="button"
                disabled={auditPage >= Math.ceil(tableLogs.length / 8)}
                onClick={() => setAuditPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                {t("Seguinte")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
