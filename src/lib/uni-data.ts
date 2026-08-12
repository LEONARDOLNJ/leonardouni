export type FeeKind = "propina" | "taxa";
export type PaymentStatus = "pago" | "pendente" | "vencido";
export type Method = "Cartão" | "Mobile Money" | "Transferência Bancária" | "Base Pay (USDC)";

export interface Student {
  id: string;
  nome: string;
  docId: string; // BI / NUIT / Passaporte / DIRE
  tipoDocumento?: "BI" | "Passaporte" | "DIRE";
  curso: string;
  ano: number;
  email: string;
  nacionalidade?: string;
  isInternational?: boolean;
  foto?: string;
}

export interface Fee {
  id: string;
  tipo: FeeKind;
  designacao: string;
  curso: string | "Todos";
  valor: number;
  vencimento: string;
  aplicaInternacional?: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  feeId: string;
  valorPago: number;
  data: string;
  metodo: Method;
  estado: PaymentStatus;
  recibo: string;
}

export const UNIVERSITY = {
  nome: "Leonardo University",
  sigla: "UL",
  slogan: "Inovação, Ciência & Humanismo",
  morada: "Av. 24 de Julho, nº 1250, Maputo, Moçambique",
  contacto: "+258 21 000 000 · financas@ul.ac.mz",
  nuit: "400 123 456",
};

export const CURSOS = [
  "Engenharia Informática",
  "Gestão de Empresas",
  "Direito",
  "Medicina",
  "Arquitectura",
];

export const students: Student[] = [
  { id: "EST-2024-001", nome: "Leonardo Matsinhe", docId: "110100452930B", tipoDocumento: "BI", curso: "Engenharia Informática", ano: 3, email: "leonardo.m@ul.ac.mz", nacionalidade: "Moçambique", isInternational: false, foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-002", nome: "Ana Cristina Mabjaia", docId: "110200384910C", tipoDocumento: "BI", curso: "Gestão de Empresas", ano: 2, email: "ana.mabjaia@ul.ac.mz", nacionalidade: "Moçambique", isInternational: false, foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-003", nome: "Jorge Nhamirre", docId: "110300918230D", tipoDocumento: "BI", curso: "Direito", ano: 4, email: "jorge.n@ul.ac.mz", nacionalidade: "Moçambique", isInternational: false, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-004", nome: "Fátima Sitoe", docId: "110400561280E", tipoDocumento: "BI", curso: "Medicina", ano: 1, email: "fatima.sitoe@ul.ac.mz", nacionalidade: "Moçambique", isInternational: false, foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-005", nome: "Rui Bila", docId: "110500129840F", tipoDocumento: "BI", curso: "Arquitectura", ano: 5, email: "rui.bila@ul.ac.mz", nacionalidade: "Moçambique", isInternational: false, foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-006", nome: "Jean-Luc Dubois", docId: "FR-9920184710", tipoDocumento: "Passaporte", curso: "Engenharia Informática", ano: 2, email: "jeanluc.dubois@ul.ac.mz", nacionalidade: "França (França)", isInternational: true, foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80" },
  { id: "EST-2024-007", nome: "Maria Sofia Garcia", docId: "ES-482019385", tipoDocumento: "Passaporte", curso: "Gestão de Empresas", ano: 1, email: "maria.garcia@ul.ac.mz", nacionalidade: "Espanha (Espanha)", isInternational: true, foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80" },
];

export const fees: Fee[] = [
  { id: "PROP-01", tipo: "propina", designacao: "Propina · 1º Semestre", curso: "Todos", valor: 18500, vencimento: "2026-03-15" },
  { id: "PROP-02", tipo: "propina", designacao: "Propina · 2º Semestre", curso: "Todos", valor: 18500, vencimento: "2026-08-15" },
  { id: "PROP-03", tipo: "propina", designacao: "Propina Clínica (acréscimo)", curso: "Medicina", valor: 9500, vencimento: "2026-03-15" },
  { id: "TAX-01", tipo: "taxa", designacao: "Taxa de Inscrição Anual", curso: "Todos", valor: 3200, vencimento: "2026-02-01" },
  { id: "TAX-02", tipo: "taxa", designacao: "Taxa de Biblioteca", curso: "Todos", valor: 850, vencimento: "2026-02-28" },
  { id: "TAX-03", tipo: "taxa", designacao: "Taxa de Laboratório", curso: "Engenharia Informática", valor: 2400, vencimento: "2026-04-10" },
  { id: "TAX-04", tipo: "taxa", designacao: "Taxa de Certificação de Documentos", curso: "Todos", valor: 500, vencimento: "2026-06-30" },
  { id: "TAX-05", tipo: "taxa", designacao: "Taxa de Visto e Validação Internacional", curso: "Todos", valor: 4500, vencimento: "2026-02-15", aplicaInternacional: true },
];

export const payments: Payment[] = [
  { id: "PAG-1001", studentId: "EST-2024-001", feeId: "PROP-01", valorPago: 18500, data: "2026-03-02", metodo: "Mobile Money", estado: "pago", recibo: "REC-1001" },
  { id: "PAG-1002", studentId: "EST-2024-001", feeId: "TAX-01", valorPago: 3200, data: "2026-01-28", metodo: "Cartão", estado: "pago", recibo: "REC-1002" },
  { id: "PAG-1003", studentId: "EST-2024-001", feeId: "TAX-03", valorPago: 0, data: "2026-04-10", metodo: "Transferência Bancária", estado: "pendente", recibo: "" },
  { id: "PAG-1004", studentId: "EST-2024-002", feeId: "PROP-01", valorPago: 18500, data: "2026-03-11", metodo: "Transferência Bancária", estado: "pago", recibo: "REC-1003" },
  { id: "PAG-1005", studentId: "EST-2024-002", feeId: "TAX-02", valorPago: 0, data: "2026-02-28", metodo: "Cartão", estado: "vencido", recibo: "" },
  { id: "PAG-1006", studentId: "EST-2024-003", feeId: "PROP-01", valorPago: 9250, data: "2026-03-14", metodo: "Mobile Money", estado: "pendente", recibo: "" },
  { id: "PAG-1007", studentId: "EST-2024-004", feeId: "PROP-03", valorPago: 9500, data: "2026-03-05", metodo: "Cartão", estado: "pago", recibo: "REC-1004" },
  { id: "PAG-1008", studentId: "EST-2024-004", feeId: "TAX-01", valorPago: 0, data: "2026-02-01", metodo: "Mobile Money", estado: "vencido", recibo: "" },
  { id: "PAG-1009", studentId: "EST-2024-005", feeId: "PROP-01", valorPago: 18500, data: "2026-03-09", metodo: "Transferência Bancária", estado: "pago", recibo: "REC-1005" },
  { id: "PAG-1010", studentId: "EST-2024-006", feeId: "PROP-01", valorPago: 18500, data: "2026-03-01", metodo: "Cartão", estado: "pago", recibo: "REC-1007" },
  { id: "PAG-1011", studentId: "EST-2024-006", feeId: "TAX-05", valorPago: 4500, data: "2026-02-10", metodo: "Transferência Bancária", estado: "pago", recibo: "REC-1008" },
  { id: "PAG-1012", studentId: "EST-2024-007", feeId: "PROP-01", valorPago: 0, data: "2026-03-15", metodo: "Cartão", estado: "pendente", recibo: "" },
];

export const MZN_USD_RATE = 63.8;
export const MZN_EUR_RATE = 69.5;

export const mzn = (v: number) =>
  new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN", minimumFractionDigits: 2 }).format(v);

export const formatCurrency = (amountMzn: number, currency: "MZN" | "USD" | "EUR" = "MZN") => {
  if (currency === "USD") {
    const val = amountMzn / MZN_USD_RATE;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(val);
  }
  if (currency === "EUR") {
    const val = amountMzn / MZN_EUR_RATE;
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(val);
  }
  return mzn(amountMzn);
};

export const dataPt = (iso: string) =>
  new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export const findStudent = (id: string) => students.find((s) => s.id === id);
export const findFee = (id: string) => fees.find((f) => f.id === id);

export function feeDue(p: Payment) {
  const fee = findFee(p.feeId);
  return Math.max((fee?.valor ?? 0) - p.valorPago, 0);
}

export const totals = () => {
  const cobrado = payments.reduce((a, p) => a + (findFee(p.feeId)?.valor ?? 0), 0);
  const recebido = payments.reduce((a, p) => a + p.valorPago, 0);
  const vencido = payments.filter((p) => p.estado === "vencido").reduce((a, p) => a + feeDue(p), 0);
  const pendente = payments.filter((p) => p.estado === "pendente").reduce((a, p) => a + feeDue(p), 0);
  return { cobrado, recebido, vencido, pendente };
};
