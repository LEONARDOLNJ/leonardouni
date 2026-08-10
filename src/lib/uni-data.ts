export type FeeKind = "propina" | "taxa";
export type PaymentStatus = "pago" | "pendente" | "vencido";
export type Method = "Cartão" | "Mobile Money" | "Transferência Bancária";

export interface Student {
  id: string;
  nome: string;
  docId: string; // BI / NUIT / Documento de Identificação
  curso: string;
  ano: number;
  email: string;
}

export interface Fee {
  id: string;
  tipo: FeeKind;
  designacao: string;
  curso: string | "Todos";
  valor: number;
  vencimento: string;
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
  { id: "EST-2024-001", nome: "Leonardo Matsinhe", docId: "110100452930B", curso: "Engenharia Informática", ano: 3, email: "leonardo.m@ul.ac.mz" },
  { id: "EST-2024-002", nome: "Ana Cristina Mabjaia", docId: "110200384910C", curso: "Gestão de Empresas", ano: 2, email: "ana.mabjaia@ul.ac.mz" },
  { id: "EST-2024-003", nome: "Jorge Nhamirre", docId: "110300918230D", curso: "Direito", ano: 4, email: "jorge.n@ul.ac.mz" },
  { id: "EST-2024-004", nome: "Fátima Sitoe", docId: "110400561280E", curso: "Medicina", ano: 1, email: "fatima.sitoe@ul.ac.mz" },
  { id: "EST-2024-005", nome: "Rui Bila", docId: "110500129840F", curso: "Arquitectura", ano: 5, email: "rui.bila@ul.ac.mz" },
  { id: "EST-2024-006", nome: "Célia Mucavele", docId: "110600783420G", curso: "Engenharia Informática", ano: 2, email: "celia.m@ul.ac.mz" },
];

export const fees: Fee[] = [
  { id: "PROP-01", tipo: "propina", designacao: "Propina · 1º Semestre", curso: "Todos", valor: 18500, vencimento: "2026-03-15" },
  { id: "PROP-02", tipo: "propina", designacao: "Propina · 2º Semestre", curso: "Todos", valor: 18500, vencimento: "2026-08-15" },
  { id: "PROP-03", tipo: "propina", designacao: "Propina Clínica (acréscimo)", curso: "Medicina", valor: 9500, vencimento: "2026-03-15" },
  { id: "TAX-01", tipo: "taxa", designacao: "Taxa de Inscrição Anual", curso: "Todos", valor: 3200, vencimento: "2026-02-01" },
  { id: "TAX-02", tipo: "taxa", designacao: "Taxa de Biblioteca", curso: "Todos", valor: 850, vencimento: "2026-02-28" },
  { id: "TAX-03", tipo: "taxa", designacao: "Taxa de Laboratório", curso: "Engenharia Informática", valor: 2400, vencimento: "2026-04-10" },
  { id: "TAX-04", tipo: "taxa", designacao: "Taxa de Certificação de Documentos", curso: "Todos", valor: 500, vencimento: "2026-06-30" },
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
  { id: "PAG-1010", studentId: "EST-2024-006", feeId: "TAX-02", valorPago: 850, data: "2026-02-20", metodo: "Mobile Money", estado: "pago", recibo: "REC-1006" },
  { id: "PAG-1011", studentId: "EST-2024-006", feeId: "PROP-01", valorPago: 0, data: "2026-03-15", metodo: "Cartão", estado: "pendente", recibo: "" },
];

export const mzn = (v: number) =>
  new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN", minimumFractionDigits: 2 }).format(v);

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
