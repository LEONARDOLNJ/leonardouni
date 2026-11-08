import React, { useState } from "react";
import {
  useOfflineDocuments,
  type AcademicDocument,
  type AcademicDocCategory,
  generateVerificationHash,
  formatBytes,
} from "@/lib/offline-documents";
import { OfflineDocumentViewerModal } from "./OfflineDocumentViewerModal";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  HardDrive,
  Wifi,
  WifiOff,
  ShieldCheck,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Database,
  Smartphone,
  Check,
  HelpCircle,
  X,
  Upload,
} from "lucide-react";

interface OfflineDocumentsHubProps {
  initialFilter?: AcademicDocCategory | "todos";
  compact?: boolean;
}

export function OfflineDocumentsHub({
  initialFilter = "todos",
  compact = false,
}: OfflineDocumentsHubProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const studentId = user?.id || "EST-2024-001";
  const studentName = user?.nome || "Leonardo Júnior Nhantumbo";
  const course = user?.curso || "Licenciatura em Engenharia Informática";

  const {
    documents,
    isOnline,
    rawIsOnline,
    simulatedOffline,
    toggleSimulatedOffline,
    isSyncing,
    syncProgress,
    swRegistered,
    storageTelemetry,
    saveDocument,
    removeDocument,
    cacheAllStudentDocuments,
    clearAllOfflineCache,
    generatePdf,
    activePreviewDoc,
    setActivePreviewDoc,
  } = useOfflineDocuments(studentId, studentName, course);

  const [selectedCategory, setSelectedCategory] = useState<AcademicDocCategory | "todos">(
    initialFilter
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Doc Form State
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<AcademicDocCategory>("outro");
  const [customContent, setCustomContent] = useState("");
  const [customSummary, setCustomSummary] = useState("");

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    const now = new Date().toISOString().split("T")[0];
    const newDocId = `DOC-CUSTOM-${Date.now().toString().slice(-6)}`;

    const newDoc: AcademicDocument = {
      id: newDocId,
      title: customTitle.trim(),
      category: customCategory,
      fileName: `${customTitle.replace(/\s+/g, "_")}.pdf`,
      fileSizeFormatted: formatBytes(customContent.length * 2 + 1024),
      fileSizeBytes: customContent.length * 2 + 1024,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: user?.ano || 3,
      summary: customSummary.trim() || "Documento académico personalizado armazenado no cache local.",
      verificationHash: generateVerificationHash(newDocId, now),
      contentData: customContent.trim(),
      pdfGeneratorType: "custom",
      isOfficial: false,
      isSecured: true,
    };

    saveDocument(newDoc);
    setShowAddCustomModal(false);
    setCustomTitle("");
    setCustomContent("");
    setCustomSummary("");
  };

  // Filtered documents list
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "todos" ? true : doc.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: AcademicDocCategory) => {
    switch (category) {
      case "certificado":
        return <Award className="size-4 text-amber-500" />;
      case "declaracao":
        return <FileText className="size-4 text-primary" />;
      case "recibo":
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "cartao":
        return <GraduationCap className="size-4 text-purple-500" />;
      case "plano_curricular":
      case "guiao_estudo":
        return <BookOpen className="size-4 text-blue-500" />;
      default:
        return <Layers className="size-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: AcademicDocCategory | "todos") => {
    switch (category) {
      case "todos":
        return t("Todos os Ficheiros");
      case "declaracao":
        return t("Declarações");
      case "certificado":
        return t("Certificados");
      case "recibo":
        return t("Recibos & Propinas");
      case "plano_curricular":
        return t("Plano Curricular");
      case "guiao_estudo":
        return t("Guiões & Exames");
      case "cartao":
        return t("Cartão Estudante");
      case "outro":
        return t("Outros Documentos");
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Worker Telemetry & Offline Control Hub */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
              <HardDrive className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-display font-extrabold text-foreground">
                  {t("Cache Service Worker para Documentos Académicos")}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Check className="size-3" /> SW Activo
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "Os ficheiros abaixo estão sincronizados no seu navegador para acesso imediato sem ligação à internet."
                )}
              </p>
            </div>
          </div>

          {/* Quick Simulation Mode Switch */}
          <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-xl border border-border/80 self-start md:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="size-3.5" /> {t("Online")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <WifiOff className="size-3.5" /> {t("Modo Offline")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleSimulatedOffline(!simulatedOffline)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs ${
                simulatedOffline
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
              title="Permite testar o comportamento do portal sem conexão de rede"
            >
              {simulatedOffline ? t("Desactivar Simulação Offline") : t("Testar Sem Internet")}
            </button>
          </div>
        </div>

        {/* Storage Bar & Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/60">
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span>{t("Espaço em Cache Utilizado:")}</span>
                <strong className="text-primary font-mono">{storageTelemetry.usedFormatted}</strong>
                <span className="text-muted-foreground">({storageTelemetry.documentCount} {t("ficheiros")})</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {storageTelemetry.percent}% de {storageTelemetry.quotaFormatted}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, storageTelemetry.percent)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cacheAllStudentDocuments}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? `${syncProgress}% ${t("A Sincronizar...")}` : t("Sincronizar Tudo")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <PlusCircle className="size-3.5 text-primary" />
              <span>{t("Novo")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(
            [
              "todos",
              "declaracao",
              "certificado",
              "recibo",
              "plano_curricular",
              "guiao_estudo",
              "cartao",
            ] as const
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/50"
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Pesquisar documentos offline...")}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Document Cards Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <FileText className="size-10 text-muted-foreground/50 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">
            {t("Nenhum documento encontrado neste filtro")}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t(
              "Clique em 'Sincronizar Tudo' para restaurar os documentos institucionais no cache local do Service Worker."
            )}
          </p>
          <button
            onClick={cacheAllStudentDocuments}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>{t("Restaurar Documentos Padrão")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border/60">
                    {getCategoryIcon(doc.category)}
                    <span>{getCategoryLabel(doc.category)}</span>
                  </span>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {doc.fileSizeFormatted}
                  </span>
                </div>

                {/* Title & summary */}
                <div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-normal">
                    {doc.summary}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <WifiOff className="size-3" /> Offline Ready
                  </span>
                  <span className="font-mono">{doc.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewDoc(doc)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-border bg-muted/30 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>{t("Visualizar")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => generatePdf(doc)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Document Viewer Modal */}
      {activePreviewDoc && (
        <OfflineDocumentViewerModal
          document={activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}

      {/* Add Custom Document Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-display font-extrabold text-foreground">
                <PlusCircle className="size-5 text-primary" />
                <span>{t("Guardar Novo Ficheiro em Cache Offline")}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomDoc} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{t("Título do Documento")}</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="ex: Apontamentos de Redes / Ementa de Inteligência Artificial"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{t("Categoria")}</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as AcademicDocCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="declaracao">{t("Declaração")}</option>
                    <option value="certificado">{t("Certificado")}</option>
                    <option value="recibo">{t("Recibo / Finanças")}</option>
                    <option value="plano_curricular">{t("Plano Curricular")}</option>
                    <option value="guiao_estudo">{t("Guião / Exames")}</option>
                    <option value="outro">{t("Outro")}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{t("Resumo Breve")}</label>
                  <input
                    type="text"
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    placeholder="Descrição para consulta rápida"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {t("Conteúdo do Documento / Ementa Académica")}
                </label>
                <textarea
                  rows={5}
                  required
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Introduza os tópicos, ementas, minutas ou anotações académicas para guardar no Service Worker..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t("Cancelar")}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  {t("Guardar no Cache Offline")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
