import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { UNIVERSITY, mzn, dataPt } from "@/lib/uni-data";
import {
  generateQRCodeDataUrl,
  generateQRCodeSvg,
  buildVerificationUrl,
  computeDocumentIntegrityHash,
  type DocumentVerificationData,
} from "@/lib/qrcode-service";
import { useRouter } from "@/lib/router";
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  X,
  Sparkles,
  Share2,
  Printer,
} from "lucide-react";

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: {
    code: string;
    title: string;
    type: "RECIBO" | "CERTIFICADO_MATRICULA" | "CERTIFICADO_QUITACAO" | "CERTIDAO_NOTAS" | "DECLARACAO" | "DOCUMENTO";
    studentId?: string;
    studentName?: string;
    course?: string;
    amount?: number;
    date?: string;
    status?: string;
    onDownloadPdf?: () => void;
  } | null;
}

export function QRCodeModal({ isOpen, onClose, documentData }: QRCodeModalProps) {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"qr" | "details">("qr");

  useEffect(() => {
    if (!isOpen || !documentData) return;

    setLoading(true);
    const verificationUrl = buildVerificationUrl(documentData.code, documentData.type);

    generateQRCodeDataUrl(verificationUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#163a32", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        setQrDataUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to generate QR code data URL", err);
        setLoading(false);
      });
  }, [isOpen, documentData]);

  if (!isOpen || !documentData) return null;

  const verificationUrl = buildVerificationUrl(documentData.code, documentData.type);
  const integrityHash = computeDocumentIntegrityHash(
    documentData.code,
    documentData.studentId || "",
    documentData.amount || 0,
    documentData.date || new Date().toISOString()
  );
  const digitalSeal = `UL-${documentData.type.substring(0, 4)}-${integrityHash.substring(2, 14)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QRCode_${documentData.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenVerifier = () => {
    onClose();
    navigate(`/verificar?code=${encodeURIComponent(documentData.code)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <QrCode className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("QR Code de Validação Oficial")}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {documentData.code} · {UNIVERSITY.sigla}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-border px-6 pt-2 gap-4 bg-muted/10">
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "qr"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Código QR & Imagem")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Selo Digital & Metadados")}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === "qr" ? (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* QR Code Presentation Frame */}
              <div className="relative p-4 rounded-2xl bg-white border-2 border-emerald-900/10 shadow-lg flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-800">
                    {UNIVERSITY.nome} · Validação Oficial
                  </span>
                </div>

                {loading ? (
                  <div className="size-52 flex items-center justify-center">
                    <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${documentData.code}`}
                    className="size-52 object-contain rounded-lg"
                  />
                )}

                <div className="mt-2 pt-2 border-t border-slate-200 w-full text-center">
                  <p className="text-[11px] font-mono font-bold text-slate-900">
                    {documentData.code}
                  </p>
                  <p className="text-[9px] text-slate-500 font-sans">
                    {t("Aponte a câmara para autenticação instantânea")}
                  </p>
                </div>
              </div>

              {/* Document Summary Pill */}
              <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/80 text-left space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("Documento:")}</span>
                  <span className="font-bold text-foreground">{documentData.title}</span>
                </div>
                {documentData.studentName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("Titular:")}</span>
                    <span className="font-medium text-foreground">
                      {documentData.studentName} {documentData.studentId ? `(${documentData.studentId})` : ""}
                    </span>
                  </div>
                )}
                {documentData.amount !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("Valor Liquidado:")}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {mzn(documentData.amount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">{t("Estado de Autenticidade:")}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3.5" />
                    <span>{t("HOMOLOGADO NO REGISTO CENTRAL")}</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQrImage}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Download className="size-4 text-primary" />
                  <span>{t("Descarregar Imagem PNG")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-emerald-600" />
                      <span className="text-emerald-600">{t("Link Copiado!")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 text-muted-foreground" />
                      <span>{t("Copiar Link de Validação")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="size-4" />
                  <span>{t("Assinatura Criptográfica SHA-256")}</span>
                </div>
                <p className="text-[11px] opacity-90">
                  {t(
                    "Este documento está assinado digitalmente com chaves de integridade da Direcção Académica da Universidade Leonardo."
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div>
                  <span className="text-muted-foreground text-[11px] block">{t("Selo Digital Institucional:")}</span>
                  <span className="font-mono font-bold text-xs text-foreground select-all">
                    {digitalSeal}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] block">{t("Hash Completo de Integridade:")}</span>
                  <span className="font-mono text-[10px] text-muted-foreground break-all select-all block bg-card p-2 rounded border border-border/60">
                    {integrityHash}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] block">{t("URL Oficial de Validação:")}</span>
                  <span className="font-mono text-[10px] text-primary break-all select-all block bg-card p-2 rounded border border-border/60">
                    {verificationUrl}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block">{t("Entidade Emissora")}</span>
                  <span className="font-semibold text-foreground">{UNIVERSITY.nome}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block">{t("NUIT da Instituição")}</span>
                  <span className="font-semibold text-foreground">{UNIVERSITY.nuit}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={handleOpenVerifier}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <ExternalLink className="size-4" />
            <span>{t("Testar Verificação no Portal")}</span>
          </button>

          <div className="flex items-center gap-2">
            {documentData.onDownloadPdf && (
              <button
                type="button"
                onClick={() => {
                  documentData.onDownloadPdf?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer shadow-xs"
              >
                <Download className="size-3.5" />
                <span>{t("Descarregar PDF com QR")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition cursor-pointer"
            >
              {t("Fechar")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
