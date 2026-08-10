import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";

/** Portuguese source string -> English translation. */
const EN: Record<string, string> = {
  // navigation / chrome
  "Painel": "Dashboard",
  "Estudantes": "Students",
  "Propinas & Taxas": "Tuition & Fees",
  "Pagamentos": "Payments",
  "Recibos": "Receipts",
  "Documentos": "Documents",
  "Sistema de Gestão · Módulo Financeiro": "Management System · Finance Module",
  "Universidade Politécnica de Maputo": "Maputo Polytechnic University",
  "Portal do estudante": "Student portal",
  "Apoio financeiro": "Financial support",
  "Contactos": "Contact us",
  "Idioma": "Language",
  "Português": "Portuguese",
  "Inglês": "English",
  "Candidaturas abertas para o ano lectivo 2026": "Applications open for the 2026 academic year",
  "Saiba mais": "Find out more",
  "Ligações rápidas": "Quick links",
  "Todos os direitos reservados.": "All rights reserved.",

  // dashboard
  "Painel de Pagamentos": "Payments Dashboard",
  "Visão consolidada de propinas, taxas e estado de cobrança do ano lectivo corrente.":
    "A consolidated view of tuition, fees and collection status for the current academic year.",
  "Total facturado": "Total invoiced",
  "Recebido": "Received",
  "Pendente": "Pending",
  "Vencido": "Overdue",
  "encargos lançados": "charges issued",
  "da facturação": "of invoiced value",
  "aguarda liquidação": "awaiting settlement",
  "requer notificação": "requires notification",
  "Taxa de cobrança": "Collection rate",
  "Saldos por regularizar": "Outstanding balances",
  "Ver todos os pagamentos": "View all payments",
  "Estudante": "Student",
  "Encargo": "Charge",
  "Vencimento": "Due date",
  "Em dívida": "Outstanding",
  "Estado": "Status",
  "Cobrança por curso": "Collection by programme",
  "O plano do sistema e os modelos de papel timbrado estão disponíveis para descarga em PDF.":
    "The system plan and letterhead templates are available to download as PDF.",
  "Abrir documentos": "Open documents",
  "Vida no campus": "Campus life",
  "Apoio ao estudante": "Student support",
  "Serviços financeiros": "Financial services",
  "Uma universidade construída à volta dos seus estudantes.":
    "A university built around its students.",
  "Gestão transparente de propinas, taxas e recibos — tudo num só portal.":
    "Transparent management of tuition, fees and receipts — all in one portal.",

  // students
  "Registo académico e situação financeira de cada estudante matriculado.":
    "Academic record and financial position of every enrolled student.",
  "estudantes matriculados": "enrolled students",
  "Nº de estudante": "Student no.",
  "Nome": "Name",
  "Curso": "Programme",
  "Ano": "Year",
  "Email": "Email",

  // fees
  "Configuração dos encargos lectivos: propinas por semestre e taxas administrativas adicionais.":
    "Configuration of academic charges: tuition per semester and additional administrative fees.",
  "Propinas": "Tuition",
  "Taxas": "Fees",
  "registos": "records",
  "Código": "Code",
  "Designação": "Description",
  "Abrangência": "Applies to",
  "Valor": "Amount",

  // payments
  "Estado dos Pagamentos": "Payment Status",
  "Registo de todas as transacções, método de pagamento e saldo remanescente por encargo.":
    "A record of every transaction, payment method and remaining balance per charge.",
  "todos": "all",
  "pago": "paid",
  "pendente": "pending",
  "vencido": "overdue",
  "transacções": "transactions",
  "Referência": "Reference",
  "Data": "Date",
  "Método": "Method",
  "Pago": "Paid",
  "Recibo": "Receipt",
  "Cartão": "Card",
  "Mobile Money": "Mobile Money",
  "Transferência Bancária": "Bank Transfer",

  // receipts
  "Comprovativos emitidos automaticamente após a liquidação de uma propina ou taxa.":
    "Proof of payment issued automatically once a tuition charge or fee is settled.",
  "recibos emitidos": "receipts issued",
  "Descarregar PDF": "Download PDF",

  // documents
  "Plano do sistema e modelos institucionais de papel timbrado, gerados em PDF no navegador.":
    "System plan and institutional letterhead templates, generated as PDF in your browser.",
  "Plano do sistema": "System plan",
  "Papel timbrado": "Letterhead",
  "Documento de três páginas com âmbito funcional dos módulos (Pagamentos, Propinas, Taxas, Estado dos pagamentos, Recibos), modelo de dados, fluxos de utilização, faseamento de implementação e um anexo com a configuração actual de encargos e estudantes.":
    "A three-page document covering the functional scope of each module (Payments, Tuition, Fees, Payment status, Receipts), the data model, user flows, implementation phases and an appendix with the current charge and student configuration.",
  "Descarregar plano em PDF": "Download plan as PDF",
  "Papel timbrado · Uso geral": "Letterhead · General use",
  "Cabeçalho institucional, referência, data e zona de assinatura.":
    "Institutional header, reference, date and signature area.",
  "Papel timbrado · Direcção de Finanças": "Letterhead · Finance Directorate",
  "Modelo de notificação de propinas e taxas em dívida.":
    "Template for notifying outstanding tuition and fees.",
  "Papel timbrado · Declaração de quitação": "Letterhead · Clearance statement",
  "Declaração de situação financeira regularizada.":
    "Statement confirming a settled financial position.",

  // courses
  "Engenharia Informática": "Computer Engineering",
  "Gestão de Empresas": "Business Management",
  "Direito": "Law",
  "Medicina": "Medicine",
  "Arquitectura": "Architecture",
  "Todos": "All",

  // fee designations
  "Propina · 1º Semestre": "Tuition · Semester 1",
  "Propina · 2º Semestre": "Tuition · Semester 2",
  "Propina Clínica (acréscimo)": "Clinical tuition (supplement)",
  "Taxa de Inscrição Anual": "Annual registration fee",
  "Taxa de Biblioteca": "Library fee",
  "Taxa de Laboratório": "Laboratory fee",
  "Taxa de Certificação de Documentos": "Document certification fee",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (pt: string) => string };

const LangContext = createContext<Ctx>({ lang: "pt", setLang: () => {}, t: (s) => s });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = window.localStorage.getItem("upm-lang");
    if (saved === "en" || saved === "pt") setLangState(saved);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        window.localStorage.setItem("upm-lang", l);
      },
      t: (pt) => (lang === "en" ? (EN[pt] ?? pt) : pt),
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}
