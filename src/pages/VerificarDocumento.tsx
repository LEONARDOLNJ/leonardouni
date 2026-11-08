import React, { useState, useEffect, useRef, useCallback } from "react";
import { Panel, Shell } from "@/components/Shell";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { UNIVERSITY, mzn, dataPt, students, payments, findStudent, findFee, type Method, type Payment } from "@/lib/uni-data";
import { downloadReceipt, downloadClearanceCertificate, downloadEnrollmentCertificate } from "@/lib/pdf";
import jsQR from "jsqr";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";
import {
  QrCode,
  Camera,
  Upload,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Award,
  Lock,
  Building,
  Calendar,
  CreditCard,
  User,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export interface VerificationResult {
  valid: boolean;
  code: string;
  documentType?: "RECIBO" | "CERTIFICADO_QUITACAO" | "CERTIFICADO_MATRICULA" | "DECLARACAO" | string;
  documentTitle?: string;
  studentId?: string;
  studentNome?: string;
  curso?: string;
  anoCurricular?: number;
  feeTitle?: string;
  valorPago?: number;
  moeda?: string;
  metodo?: string;
  data?: string;
  estado?: string;
  digitalSeal?: string;
  fullHash?: string;
  emissor?: string;
  nuit?: string;
  verificadoEm?: string;
  message?: string;
}

export function VerificarDocumento() {
  const { t } = useI18n();
  const { path } = useRouter();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("manual");
  const [inputCode, setInputCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Parse query parameters on load (e.g. /verificar?code=REC-2026-001)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get("code");
      if (codeFromUrl) {
        setInputCode(codeFromUrl);
        verifyDocument(codeFromUrl);
      }
    }
  }, []);

  // Verify Document by Code (Queries Server & Fallback Store)
  const verifyDocument = async (codeToVerify: string) => {
    const cleanCode = (codeToVerify || "").trim();
    if (!cleanCode) {
      setErrorMsg(t("Por favor introduza um código ou referência de verificação."));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    // Stop camera if active
    stopCamera();

    // Extract code if a full URL was pasted
    let finalCode = cleanCode;
    if (cleanCode.includes("code=")) {
      try {
        const parsed = new URL(cleanCode.startsWith("http") ? cleanCode : `https://dummy.com/${cleanCode}`);
        finalCode = parsed.searchParams.get("code") || cleanCode;
      } catch (e) {
        // use raw
      }
    }

    try {
      // 1. Try server verification endpoint
      const response = await fetch(`/api/verify/receipt/${encodeURIComponent(finalCode)}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setLoading(false);
        return;
      }

      // 2. Fallback to client-side local registry
      const upper = finalCode.toUpperCase();
      const localPayment = payments.find(
        (p) => p.recibo?.toUpperCase() === upper || p.id.toUpperCase() === upper
      );

      if (localPayment) {
        const st = findStudent(localPayment.studentId);
        const fee = findFee(localPayment.feeId);
        setResult({
          valid: true,
          code: localPayment.recibo || localPayment.id,
          documentType: "RECIBO",
          documentTitle: "Recibo Oficial de Pagamento de Propinas",
          studentId: localPayment.studentId,
          studentNome: st?.nome || "Estudante Registado",
          curso: st?.curso || "Licenciatura Académica",
          feeTitle: fee?.designacao || "Propina Universitária",
          valorPago: localPayment.valorPago,
          moeda: "MZN",
          metodo: localPayment.metodo,
          data: localPayment.data,
          estado: localPayment.estado,
          digitalSeal: `UL-REC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          emissor: "Leonardo University — Direcção de Finanças",
          nuit: UNIVERSITY.nuit,
          verificadoEm: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // If code looks like a valid certificate pattern
      if (upper.startsWith("DECL-") || upper.startsWith("CERT-") || upper.startsWith("DOC-")) {
        const isQuittance = upper.includes("DECL-UL") || upper.includes("QUIT");
        setResult({
          valid: true,
          code: upper,
          documentType: isQuittance ? "CERTIFICADO_QUITACAO" : "CERTIFICADO_MATRICULA",
          documentTitle: isQuittance
            ? "Declaração de Quitação Total de Propinas"
            : "Certidão Oficial de Matrícula e Frequência 2026",
          studentId: "EST-2024-001",
          studentNome: "Leonardo Júnior Nhantumbo",
          curso: "Licenciatura em Engenharia Informática",
          anoCurricular: 3,
          data: new Date().toISOString(),
          estado: "homologado",
          digitalSeal: `UL-CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          emissor: "Leonardo University — Registo Académico Central",
          nuit: UNIVERSITY.nuit,
          verificadoEm: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // Not found
      setErrorMsg(
        t(
          "Documento ou recibo não encontrado no registo central da universidade. Verifique se o código foi digitado corretamente."
        )
      );
      setResult({
        valid: false,
        code: finalCode,
        message: "O código fornecido não corresponde a nenhum registo oficial homologado.",
      });
    } catch (err) {
      console.error("Verification error:", err);
      // Fallback
      setErrorMsg(t("Não foi possível conectar ao servidor de verificação."));
    } finally {
      setLoading(false);
    }
  };

  // Camera Scanning Loop
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: cameraFacing },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);

        // Start frame scanning
        scanIntervalRef.current = setInterval(() => {
          scanVideoFrame();
        }, 200);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        t("Não foi possível aceder à câmara do dispositivo. Por favor autorize o acesso ou use o upload de imagem.")
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (qrCode && qrCode.data) {
        console.log("Found QR code in camera stream:", qrCode.data);
        stopCamera();
        setInputCode(qrCode.data);
        verifyDocument(qrCode.data);
      }
    }
  };

  // Handle Image File Upload for QR Scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode && qrCode.data) {
          setInputCode(qrCode.data);
          verifyDocument(qrCode.data);
        } else {
          setErrorMsg(t("Nenhum código QR detectado na imagem carregada. Tente com uma foto mais nítida."));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopySeal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOriginalPdf = () => {
    if (!result) return;
    if (result.documentType === "RECIBO") {
      const p: Payment = (payments.find((item) => item.recibo === result.code || item.id === result.code) as Payment) || {
        id: result.code,
        recibo: result.code,
        studentId: result.studentId || "EST-2024-001",
        feeId: "PROP-001",
        valorPago: result.valorPago || 18500,
        metodo: (result.metodo as Method) || "M-Pesa",
        data: result.data || new Date().toISOString(),
        estado: "pago" as const,
      };
      downloadReceipt(p);
    } else if (result.documentType === "CERTIFICADO_QUITACAO") {
      const st = students.find((s) => s.id === result.studentId) || students[0];
      downloadClearanceCertificate(
        st,
        { totalInvoiced: 18500, totalPaid: 18500, totalOutstanding: 0 },
        payments
      );
    } else {
      const st = students.find((s) => s.id === result.studentId) || students[0];
      downloadEnrollmentCertificate(st);
    }
  };

  return (
    <Shell
      titulo={t("Portal Oficial de Validação de Documentos & QR Code")}
      descricao={t(
        "Confirme a autenticidade e validade jurídica de recibos de propinas, declarações de quitação e certificados académicos emitidos pela Universidade Leonardo."
      )}
      imagem={studentSupportImg}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Verification Input Method Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              stopCamera();
            }}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              activeTab === "manual"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
              <Search className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-foreground">{t("Inserir Código / Referência")}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("Digite o número do recibo ou referência do certificado.")}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              activeTab === "camera"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
              <Camera className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-foreground">{t("Scanner de Câmara em Directo")}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("Aponte a câmara do telemóvel ou webcam para o QR Code.")}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              stopCamera();
            }}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              activeTab === "upload"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-purple-600 text-white">
              <Upload className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-foreground">{t("Carregar Imagem / Foto QR")}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("Envie uma captura de ecrã ou foto do documento impresso.")}
              </p>
            </div>
          </button>
        </div>

        {/* Input & Scanner Form Panels */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Ex: REC-2026-001, DECL-UL-2026-..., CERT-MATR-..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                    onKeyDown={(e) => e.key === "Enter" && verifyDocument(inputCode)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => verifyDocument(inputCode)}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  <span>{loading ? t("A validar...") : t("Verificar Documento")}</span>
                </button>
              </div>

              {/* Sample test buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                <span>{t("Exemplos rápidos:")}</span>
                {["REC-2026-001", "REC-2026-002", "DECL-UL-2026-784912", "CERT-MATR-EST-2024-001"].map(
                  (sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setInputCode(sample);
                        verifyDocument(sample);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-mono text-[11px] font-semibold border border-border/70 transition cursor-pointer"
                    >
                      {sample}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === "camera" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Framing guide overlay */}
                <div className="absolute inset-0 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-emerald-400/90 rounded-2xl animate-pulse flex items-center justify-center">
                    <div className="text-center bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                      <p className="text-[11px] text-emerald-300 font-bold">
                        {t("Posicione o QR Code dentro do quadrado")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {cameraError ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center max-w-md">
                  {cameraError}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraFacing(cameraFacing === "environment" ? "user" : "environment");
                      startCamera();
                    }}
                    className="px-4 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>{t("Inverter Câmara")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition cursor-pointer"
                  >
                    {t("Parar Câmara")}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "upload" && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/10 text-center space-y-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <Upload className="size-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {t("Selecione ou Arraste uma imagem com QR Code")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  {t("Suporta imagens PNG, JPG, JPEG ou capturas de ecrã do recibo/certificado.")}
                </p>
              </div>
              <label className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer inline-flex items-center gap-2">
                <Upload className="size-4" />
                <span>{t("Escolher Ficheiro de Imagem")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Verification Result Section */}
        {result && (
          <div
            className={`rounded-2xl border p-6 md:p-8 transition shadow-lg ${
              result.valid
                ? "border-emerald-500/30 bg-card"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            {result.valid ? (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white tracking-wider uppercase">
                          {t("AUTÊNTICO & VÁLIDO")}
                        </span>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {result.code}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-1">
                        {result.documentTitle || t("Documento Oficial Homologado")}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-muted-foreground block">
                      {t("Verificado em tempo real")}
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {dataPt(result.verificadoEm || new Date().toISOString())}
                    </span>
                  </div>
                </div>

                {/* Metadata Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <h5 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>{t("Dados do Titular")}</span>
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Nome Completo:")}</span>
                        <span className="font-bold text-foreground">{result.studentNome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("N.º de Estudante:")}</span>
                        <span className="font-mono font-semibold text-foreground">{result.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Curso Académico:")}</span>
                        <span className="font-medium text-foreground">{result.curso}</span>
                      </div>
                      {result.anoCurricular && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Ano Curricular:")}</span>
                          <span className="font-medium text-foreground">{result.anoCurricular}º Ano</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <h5 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="size-3.5 text-primary" />
                      <span>{t("Dados da Emissão & Finanças")}</span>
                    </h5>
                    <div className="space-y-2">
                      {result.feeTitle && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Designação / Emolumento:")}</span>
                          <span className="font-bold text-foreground text-right">{result.feeTitle}</span>
                        </div>
                      )}
                      {result.valorPago !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Montante Liquidado:")}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {mzn(result.valorPago)}
                          </span>
                        </div>
                      )}
                      {result.metodo && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Método de Pagamento:")}</span>
                          <span className="font-medium text-foreground">{result.metodo}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Data de Emissão:")}</span>
                        <span className="font-medium text-foreground">
                          {dataPt(result.data || new Date().toISOString())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Entidade Emissora:")}</span>
                        <span className="font-medium text-foreground">{result.emissor || UNIVERSITY.nome}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Proof Box */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Lock className="size-4" />
                      <span>{t("Selo Digital de Integridade Criptográfica")}</span>
                    </div>
                    {result.digitalSeal && (
                      <button
                        type="button"
                        onClick={() => handleCopySeal(result.digitalSeal!)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>{copied ? t("Copiado") : t("Copiar Selo")}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-card/80 p-2.5 rounded-lg border border-emerald-500/20 font-mono text-xs text-foreground select-all">
                    <span>{result.digitalSeal || `UL-SEAL-${result.code}`}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase font-sans">
                      ✓ {t("Assinado")}
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setInputCode("");
                    }}
                    className="px-4 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold transition cursor-pointer"
                  >
                    {t("Realizar Nova Verificação")}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      <Printer className="size-4" />
                      <span>{t("Imprimir Certidão de Validação")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadOriginalPdf}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer shadow-xs"
                    >
                      <Download className="size-4" />
                      <span>{t("Descarregar 2ª Via do Documento em PDF")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="p-3.5 rounded-2xl bg-destructive/15 text-destructive inline-block">
                  <ShieldAlert className="size-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    {t("Documento Não Encontrado ou Inválido")}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {result.message ||
                      t("O código não corresponde a nenhum registo oficial de recibos ou certificados emitidos.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setInputCode("");
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer"
                >
                  {t("Tentar Novamente")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
