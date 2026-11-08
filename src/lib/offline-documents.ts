import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UNIVERSITY, dataPt, mzn } from "./uni-data";

export type AcademicDocCategory =
  | "declaracao"
  | "certificado"
  | "recibo"
  | "plano_curricular"
  | "guiao_estudo"
  | "cartao"
  | "outro";

export interface AcademicDocument {
  id: string;
  title: string;
  category: AcademicDocCategory;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  mimeType: string;
  dateCached: string;
  studentId: string;
  studentName: string;
  course: string;
  year: number;
  summary: string;
  verificationHash: string;
  contentData: string; // Rich text / structured markdown / json representation
  pdfGeneratorType?:
    | "declaration"
    | "clearance"
    | "receipt"
    | "system_plan"
    | "student_card"
    | "curriculum"
    | "exam_guide"
    | "custom";
  pdfPayload?: any;
  isOfficial: boolean;
  isSecured: boolean;
  qrPayload?: string;
}

export interface StorageTelemetry {
  usedBytes: number;
  usedFormatted: string;
  quotaBytes: number;
  quotaFormatted: string;
  percent: number;
  documentCount: number;
}

const STORAGE_KEY = "ul_app_offline_academic_docs_v1";
const SIMULATED_OFFLINE_KEY = "ul_app_simulated_offline_mode";

// Helper for formatting file size
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Generate realistic SHA-256 style verification hash
export function generateVerificationHash(id: string, date: string): string {
  let hash = 0;
  const str = `${id}-${date}-UPM-MOZ-SECURE-2026`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex}7f8d9a4b2c1e63a9f0e1d2c3b4a59687`.substring(0, 42);
}

// Pre-seeded standard academic documents generator for a student
export function getStandardAcademicDocuments(studentId = "EST-2024-001", studentName = "Leonardo Júnior Nhantumbo", course = "Licenciatura em Engenharia Informática"): AcademicDocument[] {
  const now = new Date().toISOString().split("T")[0];
  
  return [
    {
      id: `DOC-DECL-${studentId}`,
      title: "Declaração de Matrícula e Frequência 2026",
      category: "declaracao",
      fileName: `Declaracao_Matricula_${studentId}.pdf`,
      fileSizeFormatted: "248 KB",
      fileSizeBytes: 253952,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Documento oficial autenticado que atesta o estatuto de estudante regular matriculado no 3º ano do ano lectivo 2026.",
      verificationHash: generateVerificationHash(`DECL-${studentId}`, now),
      contentData: `REPÚBLICA DE MOÇAMBIQUE\nMINISTÉRIO DA CIÊNCIA, TECNOLOGIA E ENSINO SUPERIOR\n${UNIVERSITY.nome.toUpperCase()}\n\nDECLARAÇÃO DE MATRÍCULA E FREQUÊNCIA\n\nPara os devidos efeitos, a Direcção do Registo Académico da ${UNIVERSITY.nome} certifica que ${studentName}, portador do código de estudante ${studentId}, encontra-se devidamente matriculado(a) e a frequentar o 3º Ano do curso de ${course}, em regime diurno e presencial, no ano lectivo de 2026.\n\nA situação académica e financeira encontra-se em conformidade com as disposições do Regulamento Pedagógico Geral da Universidade.\n\nPor ser verdade e ter sido solicitada, mandou-se passar a presente declaração que vai assinada e autenticada com o selo branco oficial.\n\nMaputo, aos ${dataPt(now)}.\n\nO Director do Registo Académico\nProf. Doutor Zacarias C. Munguambe`,
      pdfGeneratorType: "declaration",
      isOfficial: true,
      isSecured: true,
      qrPayload: `UPM:DECLARACAO:ID=${studentId}:HASH=${generateVerificationHash(`DECL-${studentId}`, now)}:DATE=${now}`,
    },
    {
      id: `DOC-CERT-QUIT-${studentId}`,
      title: "Certificado de Quitação de Propinas & Regularidade Financeira",
      category: "certificado",
      fileName: `Certificado_Quitacao_${studentId}.pdf`,
      fileSizeFormatted: "312 KB",
      fileSizeBytes: 319488,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Comprovativo de liquidação integral de todas as mensalidades, taxas de matrícula e emolumentos emitido pela Direcção Financeira.",
      verificationHash: generateVerificationHash(`QUIT-${studentId}`, now),
      contentData: `${UNIVERSITY.nome.toUpperCase()}\nDIRECÇÃO DE FINANÇAS E TESOURARIA CENTRAL\n\nCERTIFICADO DE QUITAÇÃO FINANCEIRA Nº TES-2026/089\n\nCertifica-se formalmente que o(a) estudante ${studentName}, com o número de registo ${studentId}, do curso de ${course}, tem a sua situação financeira plenamente regularizada e sem quaisquer dívidas pendentes relativas a propinas, taxas de inscrição, taxas de exame ou emolumentos no exercício de 2026.\n\nO estudante está apto e autorizado para submissão de monografia, realização de exames finais e obtenção de certidões académicas.\n\nSecretaria Financeira & Tesouraria Central\nDr. Alberto Cossa — Tesoureiro Geral`,
      pdfGeneratorType: "clearance",
      isOfficial: true,
      isSecured: true,
      qrPayload: `UPM:QUITACAO:ID=${studentId}:STATUS=REGULARIZADO:HASH=${generateVerificationHash(`QUIT-${studentId}`, now)}`,
    },
    {
      id: `DOC-MATRIZ-CURRICULAR-${studentId}`,
      title: "Matriz Curricular & Plano de Estudos 2024–2028 (240 ECTS)",
      category: "plano_curricular",
      fileName: `Matriz_Curricular_${course.replace(/\s+/g, "_")}.pdf`,
      fileSizeFormatted: "485 KB",
      fileSizeBytes: 496640,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Grade curricular completa de 4 anos com ementas, cargas horárias, créditos ECTS e pré-requisitos pedagógicos.",
      verificationHash: generateVerificationHash(`CURR-${studentId}`, now),
      contentData: `PLANO CURRICULAR — ${course.toUpperCase()}\n\n1º ANO:\n• Algoritmos e Estruturas de Dados (6 ECTS) — Aprovado\n• Análise Matemática I e II (12 ECTS) — Aprovado\n• Álgebra Linear e Geometria Analítica (6 ECTS) — Aprovado\n• Arquitetura de Computadores (6 ECTS) — Aprovado\n• Fundamentos de Programação Web (6 ECTS) — Aprovado\n\n2º ANO:\n• Redes de Computadores e Protocolos (6 ECTS) — Aprovado\n• Sistemas Operativos e Concorrência (6 ECTS) — Aprovado\n• Bases de Dados Relacionais & NoSQL (6 ECTS) — Aprovado\n• Engenharia de Software I (6 ECTS) — Aprovado\n• Inteligência Artificial e Aprendizagem Automática (6 ECTS) — Aprovado\n\n3º ANO (Em curso):\n• Criptografia e Segurança em Redes (6 ECTS) — Em Frequência\n• Desenvolvimento Full-Stack Cloud Native (6 ECTS) — Em Frequência\n• Sistemas Distribuídos e Blockchain (6 ECTS) — Em Frequência\n• Metodologia de Investigação Científica (6 ECTS) — Em Frequência\n\n4º ANO:\n• Gestão de Projetos de TI (6 ECTS)\n• Estágio Profissional Curricular (18 ECTS)\n• Trabalho de Fim de Curso / Monografia (24 ECTS)`,
      pdfGeneratorType: "curriculum",
      isOfficial: true,
      isSecured: false,
      qrPayload: `UPM:PLANO_CURRICULAR:${course}:CREDITOS=240`,
    },
    {
      id: `DOC-GUIAO-EXAMES-2026`,
      title: "Guião Oficial de Exames, Prazos & Regulamento de Avaliação 2026",
      category: "guiao_estudo",
      fileName: "Guiao_Oficial_Exames_UPM_2026.pdf",
      fileSizeFormatted: "380 KB",
      fileSizeBytes: 389120,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Calendário institucional de épocas normais, recurso e especial, critérios de ponderação e regulamento de faltas.",
      verificationHash: generateVerificationHash("GUIAO-EXAMES-2026", now),
      contentData: `REGULAMENTO PEDAGÓGICO E GUIA DE AVALIAÇÃO CONTINUA — ANO LECTIVO 2026\n\n1. CRITÉRIOS DE DISPENSA E APROVAÇÃO:\n- A média de frequência (MF) igual ou superior a 14 valores dispensa o estudante do exame final na época normal.\n- Nota de frequência entre 10 e 13 valores confere acesso obrigatório à Época Normal de Exames.\n- Nota de frequência inferior a 10 valores implica reprovação ou acesso condicionado a Época de Recurso.\n\n2. CALENDÁRIO DAS ÉPOCAS DE EXAME:\n- Época Normal: 15 de Outubro a 05 de Novembro de 2026.\n- Época de Recurso: 15 de Novembro a 30 de Novembro de 2026 (Taxa de inscrição: 1.250 MT).\n- Época Especial de Finalistas: 10 de Dezembro a 22 de Dezembro de 2026.\n\n3. REGIME DE ASSIDUIDADE:\n- É exigida frequência mínima de 75% das aulas práticas e laboratoriais ministradas.`,
      pdfGeneratorType: "exam_guide",
      isOfficial: true,
      isSecured: false,
      qrPayload: "UPM:GUIAO_EXAMES_2026:REGULAMENTO_OFICIAL",
    },
    {
      id: `DOC-RECIBO-SET-2026-${studentId}`,
      title: "Recibo Oficial de Pagamento de Propina (Agosto/2026)",
      category: "recibo",
      fileName: `Recibo_Propina_Ago2026_${studentId}.pdf`,
      fileSizeFormatted: "192 KB",
      fileSizeBytes: 196608,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Comprovativo de liquidação da propina mensal com carimbo digital da tesouraria e referência M-Pesa / EMIS.",
      verificationHash: generateVerificationHash(`REC-AGO-${studentId}`, now),
      contentData: `RECIBO DE PAGAMENTO Nº 2026/08-9412\n\nEstudante: ${studentName} (${studentId})\nCurso: ${course}\nDescrição: Propina Mensal — Agosto/2026\nValor Pago: 8.500,00 MT (Oito Mil e Quinhentos Meticais)\nMétodo: M-Pesa / Pagamento Eletrónico Directo\nReferência de Transacção: MPESA-84291884210\nData da Liquidação: ${dataPt(now)}\nNUIT da Instituição: ${UNIVERSITY.nuit}\n\nEmitido por via do Módulo Financeiro Integrado da Universidade Leonardo.`,
      pdfGeneratorType: "receipt",
      pdfPayload: {
        reciboNum: "2026/08-9412",
        valor: 8500,
        metodo: "M-Pesa Moçambique",
        mes: "Agosto 2026",
      },
      isOfficial: true,
      isSecured: true,
      qrPayload: `UPM:RECIBO:NUM=2026/08-9412:VALOR=8500MZN:EST=${studentId}`,
    },
    {
      id: `DOC-CARTAO-DIGITAL-${studentId}`,
      title: "Cartão de Estudante Digital (Credencial Criptográfica Offline)",
      category: "cartao",
      fileName: `Cartao_Digital_${studentId}.pdf`,
      fileSizeFormatted: "150 KB",
      fileSizeBytes: 153600,
      mimeType: "application/pdf",
      dateCached: now,
      studentId,
      studentName,
      course,
      year: 3,
      summary: "Cartão de identidade académica oficial com código de barras, NFC virtual e assinatura criptográfica da Reitoria.",
      verificationHash: generateVerificationHash(`CARD-${studentId}`, now),
      contentData: `CARTÃO DE IDENTIFICAÇÃO DO ESTUDANTE — UPM 2026\n\nNome: ${studentName}\nID de Estudante: ${studentId}\nCurso: ${course}\nAno Curricular: 3º Ano\nValidade: 31 de Dezembro de 2026\nSede: Campus Central Universitário, Maputo — Moçambique\nContacto de Emergência: ${UNIVERSITY.contacto}`,
      pdfGeneratorType: "student_card",
      isOfficial: true,
      isSecured: true,
      qrPayload: `UPM:ESTUDANTE:ID=${studentId}:NOME=${studentName}:VALIDADE=2026-12-31:HASH=${generateVerificationHash(`CARD-${studentId}`, now)}`,
    },
  ];
}

// Register the Service Worker in public/sw.js
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.info("[SW] Service Workers não suportados neste navegador.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[SW] Service Worker registado com sucesso com scope:", registration.scope);
    return registration;
  } catch (err) {
    console.warn("[SW] Falha ao registar o Service Worker (modo fallback ativo):", err);
    return null;
  }
}

// Generate PDF binary or download using jsPDF for offline exports
export function generateAcademicPdfOffline(doc: AcademicDocument): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  const INK: [number, number, number] = [22, 58, 50];
  const GOLD: [number, number, number] = [186, 138, 48];
  const GREY: [number, number, number] = [110, 118, 114];

  // Header
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, w, 32, "F");
  pdf.setFillColor(...GOLD);
  pdf.rect(0, 32, w, 2.5, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  pdf.text(UNIVERSITY.nome, 18, 14);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(214, 224, 219);
  pdf.text(`${UNIVERSITY.morada}  ·  ${UNIVERSITY.contacto}  ·  NUIT ${UNIVERSITY.nuit}`, 18, 22);

  // Offline Verification Badge on PDF
  pdf.setFillColor(235, 245, 240);
  pdf.roundedRect(w - 65, 8, 50, 16, 2, 2, "F");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(w - 65, 8, 50, 16, 2, 2, "D");
  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text("VERIFICADO OFFLINE", w - 40, 14, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.text("Service Worker Cache", w - 40, 19, { align: "center" });

  // Document Title
  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(doc.title.toUpperCase(), 18, 46);

  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.5);
  pdf.line(18, 49, w - 18, 49);

  // Metadata Panel
  pdf.setFillColor(248, 250, 249);
  pdf.rect(18, 53, w - 36, 26, "F");
  pdf.setDrawColor(220, 230, 225);
  pdf.rect(18, 53, w - 36, 26, "D");

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...GREY);
  pdf.text("Estudante:", 22, 60);
  pdf.text("ID / Matrícula:", 22, 67);
  pdf.text("Curso / Ano:", 22, 74);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...INK);
  pdf.text(`${doc.studentName}`, 55, 60);
  pdf.text(`${doc.studentId}`, 55, 67);
  pdf.text(`${doc.course}  ·  ${doc.year}º Ano`, 55, 74);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...GREY);
  pdf.text("Data Emissão / Cache:", w / 2 + 10, 60);
  pdf.text("Hash Criptográfica:", w / 2 + 10, 67);
  pdf.text("Estado de Autenticidade:", w / 2 + 10, 74);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...INK);
  pdf.text(`${dataPt(doc.dateCached)}`, w - 22, 60, { align: "right" });
  pdf.setFont("courier", "bold");
  pdf.setFontSize(7.5);
  pdf.text(`${doc.verificationHash.substring(0, 18)}...`, w - 22, 67, { align: "right" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(22, 120, 60);
  pdf.text("AUTÊNTICO & SELADO", w - 22, 74, { align: "right" });

  // Main Content Body
  pdf.setTextColor(...INK);
  pdf.setFont("times", "normal");
  pdf.setFontSize(10.5);

  const lines = pdf.splitTextToSize(doc.contentData, w - 36);
  let currentY = 88;

  lines.forEach((line: string) => {
    if (currentY > h - 35) {
      pdf.addPage();
      currentY = 30;
    }
    if (line.includes(":") && !line.startsWith("•")) {
      pdf.setFont("times", "bold");
      pdf.text(line, 18, currentY);
      pdf.setFont("times", "normal");
    } else {
      pdf.text(line, 18, currentY);
    }
    currentY += 6;
  });

  // Footer & Security Seal
  const footerY = h - 22;
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.4);
  pdf.line(18, footerY, w - 18, footerY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...GREY);
  pdf.text(
    `Documento gerado através do Cache Service Worker da ${UNIVERSITY.nome} · Válido para todos os efeitos legais.`,
    18,
    footerY + 6
  );
  pdf.text(`Hash: ${doc.verificationHash}`, w - 18, footerY + 6, { align: "right" });
  pdf.text(`Emissão Criptográfica: UPM-SEC-${doc.id}`, 18, footerY + 11);
  pdf.text(`Página 1 de 1`, w - 18, footerY + 11, { align: "right" });

  // Save the PDF file
  pdf.save(doc.fileName || `${doc.id}.pdf`);
}

// Hook to manage Service Worker Academic Documents Cache and offline state
export function useOfflineDocuments(studentId = "EST-2024-001", studentName = "Leonardo Júnior Nhantumbo", course = "Licenciatura em Engenharia Informática") {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === "true";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<AcademicDocument | null>(null);

  // Initialize and load cached documents
  useEffect(() => {
    // 1. Register Service Worker
    registerServiceWorker().then((reg) => {
      if (reg) setSwRegistered(true);
    });

    // 2. Setup online / offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 3. Load cached documents from LocalStorage / Cache
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDocuments(parsed);
        } else {
          // Pre-seed default documents
          const initial = getStandardAcademicDocuments(studentId, studentName, course);
          setDocuments(initial);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
      } catch (e) {
        console.error("Failed to parse cached academic docs", e);
        const initial = getStandardAcademicDocuments(studentId, studentName, course);
        setDocuments(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } else {
      const initial = getStandardAcademicDocuments(studentId, studentName, course);
      setDocuments(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [studentId, studentName, course]);

  // Handle simulated offline toggle
  const toggleSimulatedOffline = (simulate: boolean) => {
    setSimulatedOffline(simulate);
    localStorage.setItem(SIMULATED_OFFLINE_KEY, simulate ? "true" : "false");
  };

  // Cache a new or updated document
  const saveDocument = useCallback(
    async (doc: AcademicDocument): Promise<boolean> => {
      const updated = [...documents.filter((d) => d.id !== doc.id), doc];
      setDocuments(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Push to Cache API if available
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open("ul-academic-v1-docs");
          const url = `/api/academic-docs/${doc.id}`;
          const response = new Response(JSON.stringify(doc), {
            headers: {
              "Content-Type": "application/json",
              "X-Document-Id": doc.id,
              "X-Cached-At": new Date().toISOString(),
            },
          });
          await cache.put(new Request(url), response);
        } catch (e) {
          console.warn("[OfflineDocs] Cache API write fallback", e);
        }
      }
      return true;
    },
    [documents]
  );

  // Remove a document from cache
  const removeDocument = useCallback(
    async (docId: string): Promise<boolean> => {
      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open("ul-academic-v1-docs");
          await cache.delete(new Request(`/api/academic-docs/${docId}`));
        } catch (e) {
          console.warn("[OfflineDocs] Cache API delete fallback", e);
        }
      }
      return true;
    },
    [documents]
  );

  // Cache all standard student documents with progress animation
  const cacheAllStudentDocuments = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(10);

    const standardDocs = getStandardAcademicDocuments(studentId, studentName, course);

    for (let i = 0; i < standardDocs.length; i++) {
      await new Promise((res) => setTimeout(res, 180));
      setSyncProgress(Math.round(((i + 1) / standardDocs.length) * 100));
    }

    setDocuments(standardDocs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(standardDocs));

    // Save to Cache API
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const cache = await caches.open("ul-academic-v1-docs");
        for (const doc of standardDocs) {
          const url = `/api/academic-docs/${doc.id}`;
          const response = new Response(JSON.stringify(doc), {
            headers: {
              "Content-Type": "application/json",
              "X-Document-Id": doc.id,
              "X-Cached-At": new Date().toISOString(),
            },
          });
          await cache.put(new Request(url), response);
        }
      } catch (e) {
        console.warn("[OfflineDocs] Batch Cache API write fallback", e);
      }
    }

    setIsSyncing(false);
    setSyncProgress(100);
  }, [studentId, studentName, course]);

  // Clear all cached documents
  const clearAllOfflineCache = useCallback(async () => {
    setDocuments([]);
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        await caches.delete("ul-academic-v1-docs");
      } catch (e) {}
    }
  }, []);

  // Compute storage usage telemetry
  const totalSizeBytes = documents.reduce((acc, curr) => acc + (curr.fileSizeBytes || 250000), 0);
  const estimatedQuotaBytes = 50 * 1024 * 1024; // 50 MB simulated quota
  const storageTelemetry: StorageTelemetry = {
    usedBytes: totalSizeBytes,
    usedFormatted: formatBytes(totalSizeBytes),
    quotaBytes: estimatedQuotaBytes,
    quotaFormatted: "50 MB",
    percent: Math.min(100, Math.round((totalSizeBytes / estimatedQuotaBytes) * 100) || 1),
    documentCount: documents.length,
  };

  // Effective online status (accounts for simulated offline)
  const effectiveOnline = isOnline && !simulatedOffline;

  return {
    documents,
    isOnline: effectiveOnline,
    rawIsOnline: isOnline,
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
    generatePdf: generateAcademicPdfOffline,
    activePreviewDoc,
    setActivePreviewDoc,
  };
}
