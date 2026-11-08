import React, { useState } from "react";
import { type AcademicDocument, generateAcademicPdfOffline } from "@/lib/offline-documents";
import { useI18n } from "@/lib/i18n";
import { UNIVERSITY, dataPt } from "@/lib/uni-data";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Award,
  QrCode,
  HardDrive,
  CheckCircle2,
  Calendar,
  Lock,
  GraduationCap,
  Sparkles,
  WifiOff,
} from "lucide-react";

interface OfflineDocumentViewerModalProps {
  document: AcademicDocument | null;
  onClose: () => void;
}

export function OfflineDocumentViewerModal({
  document: doc,
  onClose,
}: OfflineDocumentViewerModalProps) {
  const { t } = useI18n();
  const [copiedHash, setCopiedHash] = useState(false);

  if (!doc) return null;

  const handleCopyHash = () => {
    if (doc.verificationHash) {
      navigator.clipboard?.writeText(doc.verificationHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Institutional Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                {doc.category === "certificado" ? (
                  <Award className="size-6" />
                ) : doc.category === "cartao" ? (
                  <GraduationCap className="size-6" />
                ) : (
                  <FileText className="size-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <WifiOff className="size-3" />
                    <span>{t("Disponível Sem Internet")}</span>
                  </span>
                  <span className="text-[11px] text-white/70 font-mono">
                    {doc.fileSizeFormatted}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-display font-extrabold text-white mt-1">
                  {doc.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="size-8 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Security & Verification Banner */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              {t("Documento Autenticado em Cache Service Worker")}
            </span>
            <span className="text-[10px] opacity-75">· {doc.id}</span>
          </div>

          <button
            onClick={handleCopyHash}
            className="inline-flex items-center gap-1 text-[11px] font-mono hover:underline cursor-pointer opacity-90"
            title="Copiar Hash SHA-256"
          >
            {copiedHash ? (
              <>
                <Check className="size-3 text-emerald-500" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Hash: {doc.verificationHash.substring(0, 16)}...</span>
              </>
            )}
          </button>
        </div>

        {/* Document Content Paper Layout */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-muted/20 print:bg-white print:p-0">
          <div className="bg-background border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Paper Header */}
            <div className="border-b-2 border-primary/20 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
                  {UNIVERSITY.sigla} · República de Moçambique
                </span>
                <h2 className="text-lg sm:text-xl font-display font-black text-foreground">
                  {UNIVERSITY.nome}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {UNIVERSITY.morada} · NUIT {UNIVERSITY.nuit}
                </p>
              </div>

              <div className="text-right sm:self-center shrink-0">
                <span className="inline-block px-3 py-1 rounded-md bg-muted text-[11px] font-mono font-bold text-foreground border border-border">
                  {doc.id}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Emitido em: {dataPt(doc.dateCached)}
                </p>
              </div>
            </div>

            {/* Student & Document Summary Meta Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 rounded-lg p-3.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Titular do Documento
                </span>
                <strong className="text-foreground text-sm font-display block">
                  {doc.studentName}
                </strong>
                <span className="text-muted-foreground">
                  Código: <strong className="font-mono text-foreground">{doc.studentId}</strong>
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Curso & Ano Curricular
                </span>
                <strong className="text-foreground text-xs block">{doc.course}</strong>
                <span className="text-muted-foreground">
                  Nível: <strong>{doc.year}º Ano</strong>
                </span>
              </div>
            </div>

            {/* Main Document Body */}
            <div className="space-y-3 font-serif text-sm leading-relaxed text-foreground whitespace-pre-line border-y border-border/60 py-5">
              {doc.contentData}
            </div>

            {/* Paper Footer with Seals */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-bold font-mono text-xs">
                  UPM
                </div>
                <div className="text-[11px] leading-tight">
                  <p className="font-semibold text-foreground">Selo Branco Digital</p>
                  <p className="text-muted-foreground">Assinatura Certificada Offline</p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-[10px] font-mono text-muted-foreground">
                  Criptografia: SHA-256 / ChaCha20
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center sm:justify-end gap-1">
                  <CheckCircle2 className="size-3" /> Estado: Documento Válido & Selado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDrive className="size-4 text-primary" />
            <span>{t("Ficheiro guardado no dispositivo via Cache Storage")}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Printer className="size-4" />
              <span>{t("Imprimir")}</span>
            </button>

            <button
              onClick={() => generateAcademicPdfOffline(doc)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <Download className="size-4" />
              <span>{t("Descarregar PDF Offline")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
