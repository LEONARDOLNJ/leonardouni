export type DocumentTypeKey =
  | "RECIBO_PROPINA"
  | "DECLARACAO_QUITACAO"
  | "CERTIFICADO_MATRICULA"
  | "EXTRACTO_FINANCEIRO"
  | "MATRIZ_CURRICULAR"
  | "DECLARACAO_EXAME"
  | "CERTIFICADO_NOTAS";

export interface DocumentDownloadEvent {
  id: string;
  documentType: DocumentTypeKey;
  documentTitle: string;
  studentId: string;
  studentName: string;
  curso: string;
  timestamp: string; // ISO string
  fileSizeKb: number;
  format: "PDF" | "CSV" | "PNG";
  channel: "Portal do Estudante" | "App Mobile" | "Secretaria Presencial" | "Validador QR";
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeKey, { label: string; color: string; fill: string }> = {
  RECIBO_PROPINA: { label: "Recibo de Propina", color: "#10b981", fill: "#10b981" },
  DECLARACAO_QUITACAO: { label: "Declaração de Quitação", color: "#6366f1", fill: "#6366f1" },
  CERTIFICADO_MATRICULA: { label: "Certidão de Matrícula", color: "#f59e0b", fill: "#f59e0b" },
  EXTRACTO_FINANCEIRO: { label: "Extracto Financeiro", color: "#3b82f6", fill: "#3b82f6" },
  MATRIZ_CURRICULAR: { label: "Matriz Curricular", color: "#8b5cf6", fill: "#8b5cf6" },
  DECLARACAO_EXAME: { label: "Declaração p/ Exames", color: "#ec4899", fill: "#ec4899" },
  CERTIFICADO_NOTAS: { label: "Histórico / Notas", color: "#14b8a6", fill: "#14b8a6" },
};

const STORAGE_KEY = "leonardo_uni_document_downloads_v1";

// Seed realistic download logs for the academic calendar
function generateSeedLogs(): DocumentDownloadEvent[] {
  const studentsSeed = [
    { id: "EST-2024-001", name: "Leonardo Júnior Nhantumbo", curso: "Engenharia Informática" },
    { id: "EST-2024-002", name: "Ana Maria Cossa", curso: "Medicina" },
    { id: "EST-2024-003", name: "Carlos Macuácua", curso: "Direito" },
    { id: "EST-2024-004", name: "Fátima Matusse", curso: "Economia & Gestão" },
    { id: "EST-2024-005", name: "Inácio Tembe", curso: "Engenharia Civil" },
    { id: "EST-2024-006", name: "Helena Mondlane", curso: "Arquitectura & Urbanismo" },
    { id: "EST-2024-007", name: "Dário Zandamela", curso: "Contabilidade & Auditoria" },
    { id: "EST-2024-008", name: "Marta Sitoe", curso: "Medicina Dentária" },
    { id: "EST-2024-009", name: "Rui Chissano", curso: "Engenharia Informática" },
    { id: "EST-2024-010", name: "Beatriz Langa", curso: "Psicologia Clínica" },
  ];

  const typesSeed: { type: DocumentTypeKey; title: string; size: number }[] = [
    { type: "RECIBO_PROPINA", title: "Recibo Oficial de Pagamento", size: 142 },
    { type: "DECLARACAO_QUITACAO", title: "Declaração Oficial de Quitação de Propinas", size: 210 },
    { type: "CERTIFICADO_MATRICULA", title: "Certidão Oficial de Matrícula e Frequência", size: 245 },
    { type: "EXTRACTO_FINANCEIRO", title: "Extracto de Conta Corrente Académica", size: 178 },
    { type: "MATRIZ_CURRICULAR", title: "Matriz Curricular & Plano de Estudos", size: 310 },
    { type: "DECLARACAO_EXAME", title: "Guia de Admissão a Exame de Época Especial", size: 125 },
    { type: "CERTIFICADO_NOTAS", title: "Certidão de Notas e Aproveitamento", size: 280 },
  ];

  const channels: ("Portal do Estudante" | "App Mobile" | "Secretaria Presencial" | "Validador QR")[] = [
    "Portal do Estudante",
    "App Mobile",
    "Secretaria Presencial",
    "Validador QR",
  ];

  const logs: DocumentDownloadEvent[] = [];
  const now = new Date();

  // Generate 140 realistic logs spanning the last 14 days
  for (let i = 0; i < 140; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 14);
    const hour = Math.floor(8 + Math.random() * 12); // Between 8:00 and 20:00
    const minute = Math.floor(Math.random() * 60);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    date.setHours(hour, minute, Math.floor(Math.random() * 60));

    const st = studentsSeed[Math.floor(Math.random() * studentsSeed.length)];
    // Weighted selection: Recibos and Quitações are downloaded most often
    const weightRandom = Math.random();
    let selectedTypeObj = typesSeed[0];
    if (weightRandom < 0.38) selectedTypeObj = typesSeed[0]; // RECIBO
    else if (weightRandom < 0.62) selectedTypeObj = typesSeed[1]; // QUITACAO
    else if (weightRandom < 0.78) selectedTypeObj = typesSeed[2]; // MATRICULA
    else if (weightRandom < 0.88) selectedTypeObj = typesSeed[3]; // EXTRACTO
    else if (weightRandom < 0.94) selectedTypeObj = typesSeed[4]; // MATRIZ
    else selectedTypeObj = typesSeed[5];

    logs.push({
      id: `DL-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${(i + 1).toString().padStart(4, "0")}`,
      documentType: selectedTypeObj.type,
      documentTitle: selectedTypeObj.title,
      studentId: st.id,
      studentName: st.name,
      curso: st.curso,
      timestamp: date.toISOString(),
      fileSizeKb: selectedTypeObj.size + Math.floor(Math.random() * 20 - 10),
      format: "PDF",
      channel: channels[Math.floor(Math.random() * channels.length)],
    });
  }

  // Sort descending by timestamp
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getDocumentDownloadLogs(): DocumentDownloadEvent[] {
  if (typeof window === "undefined") return generateSeedLogs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = generateSeedLogs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load document download logs:", err);
    return generateSeedLogs();
  }
}

export function recordDocumentDownload(
  documentType: DocumentTypeKey,
  documentTitle: string,
  studentId: string = "EST-2024-001",
  studentName: string = "Leonardo Júnior Nhantumbo",
  curso: string = "Engenharia Informática",
  channel: "Portal do Estudante" | "App Mobile" | "Secretaria Presencial" | "Validador QR" = "Portal do Estudante",
  format: "PDF" | "CSV" | "PNG" = "PDF",
  sizeKb: number = 180
): DocumentDownloadEvent {
  const currentLogs = getDocumentDownloadLogs();
  const newEvent: DocumentDownloadEvent = {
    id: `DL-${Date.now().toString(36).toUpperCase()}`,
    documentType,
    documentTitle,
    studentId,
    studentName,
    curso,
    timestamp: new Date().toISOString(),
    fileSizeKb: sizeKb,
    format,
    channel,
  };

  const updated = [newEvent, ...currentLogs];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 300))); // Keep last 300
      // Dispatch storage event or custom event for reactive dashboard updates
      window.dispatchEvent(new CustomEvent("document-download-recorded", { detail: newEvent }));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }
  return newEvent;
}
