import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  UNIVERSITY,
  dataPt,
  fees,
  findFee,
  findStudent,
  mzn,
  payments,
  students,
  type Payment,
  type Student,
} from "./uni-data";
import {
  generateQRCodeDataUrl,
  buildVerificationUrl,
  computeDocumentIntegrityHash,
} from "./qrcode-service";
import { recordDocumentDownload } from "./document-analytics-tracker";

const INK: [number, number, number] = [22, 58, 50];
const GOLD: [number, number, number] = [186, 138, 48];
const GREY: [number, number, number] = [110, 118, 114];

function header(doc: jsPDF, subtitulo: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...INK);
  doc.rect(0, 0, w, 30, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 30, w, 2.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text(UNIVERSITY.nome, 18, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(214, 224, 219);
  doc.text(`${UNIVERSITY.morada}  ·  ${UNIVERSITY.contacto}`, 18, 22);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(subtitulo.toUpperCase(), 18, 44);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(18, 47, w - 18, 47);
  doc.setFont("helvetica", "normal");
}

function footer(doc: jsPDF, nota: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(18, h - 20, w - 18, h - 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...GREY);
  doc.text(nota, 18, h - 14);
  doc.text(`NUIT ${UNIVERSITY.nuit}`, w - 18, h - 14, { align: "right" });
}

/* ---------------- Recibos com QR Code de Autenticidade ---------------- */

export async function downloadReceipt(p: Payment) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const est = findStudent(p.studentId);
  const fee = findFee(p.feeId);
  const code = p.recibo || p.id;

  header(doc, `Recibo de Pagamento nº ${code}`);

  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  const linhas: { k: string; v: string }[] = [
    { k: "Estudante", v: `${est?.nome ?? "—"} (${p.studentId})` },
    { k: "Curso / Ano", v: `${est?.curso ?? "—"} · ${est?.ano ?? "—"}º ano` },
    { k: "Referência", v: p.id },
    { k: "Data", v: dataPt(p.data) },
    { k: "Método", v: p.metodo },
  ];
  let y = 58;
  linhas.forEach(({ k, v }) => {
    doc.setTextColor(...GREY);
    doc.text(k, 18, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(v, 60, y);
    doc.setFont("helvetica", "normal");
    y += 7;
  });

  autoTable(doc, {
    startY: y + 4,
    head: [["Descrição", "Tipo", "Valor devido", "Valor pago"]],
    body: [
      [
        fee?.designacao ?? "—",
        fee?.tipo === "propina" ? "Propina" : "Taxa",
        mzn(fee?.valor ?? 0),
        mzn(p.valorPago),
      ],
    ],
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 3.5, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255, fontStyle: "bold" },
    margin: { left: 18, right: 18 },
  });

  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const saldo = Math.max((fee?.valor ?? 0) - p.valorPago, 0);

  // Remainder balance box
  doc.setFillColor(245, 243, 235);
  doc.rect(w - 96, endY + 6, 78, 20, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text("Saldo remanescente", w - 92, endY + 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(mzn(saldo), w - 92, endY + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text(`Estado do pagamento: ${p.estado.toUpperCase()}`, 18, endY + 14);
  doc.text("Documento com autenticação criptográfica e selo de segurança.", 18, endY + 20);

  // Generate QR Code URL & DataUrl
  const qrVerificationUrl = buildVerificationUrl(code, "RECIBO");
  const integrityHash = computeDocumentIntegrityHash(code, p.studentId, p.valorPago, p.data);

  try {
    const qrDataUrl = await generateQRCodeDataUrl(qrVerificationUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#163a32", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    // Verification Box with QR Code in PDF
    const qrBoxY = endY + 30;
    const qrBoxHeight = 44;
    doc.setFillColor(248, 250, 249);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "F");
    doc.setDrawColor(210, 222, 216);
    doc.setLineWidth(0.4);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "S");

    // Add QR Code Image
    doc.addImage(qrDataUrl, "PNG", 22, qrBoxY + 3, 38, 38);

    // QR Verification Info Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text("VALIDAÇÃO OFICIAL POR QR CODE", 64, qrBoxY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("Aponte a câmara do seu smartphone ou utilize o Verificador do Portal", 64, qrBoxY + 16);
    doc.text("para confirmar a autenticidade deste recibo perante os serviços centrais.", 64, qrBoxY + 21);

    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(`Código: ${code}  ·  Selo: UL-REC-${integrityHash.substring(2, 12)}`, 64, qrBoxY + 28);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(`URL de Verificação: ${qrVerificationUrl}`, 64, qrBoxY + 34);

    doc.setFillColor(230, 246, 235);
    doc.roundedRect(64, qrBoxY + 37, 46, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(20, 110, 55);
    doc.text("✓ ASSINADO DIGITALMENTE", 66, qrBoxY + 40.5);
  } catch (err) {
    console.error("Failed to embed QR code into receipt:", err);
  }

  // Signature lines
  const sigY = endY + 84;
  if (sigY < h - 28) {
    doc.setDrawColor(...GREY);
    doc.line(w - 96, sigY, w - 18, sigY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    doc.text("Direcção dos Serviços Financeiros", w - 96, sigY + 6);
  }

  footer(doc, "Recibo emitido electronicamente pela Direcção de Finanças · Conservar para efeitos de comprovação.");
  doc.save(`${p.recibo || p.id}.pdf`);
  
  try {
    const student = findStudent(p.studentId);
    const fee = findFee(p.feeId);
    recordDocumentDownload(
      "RECIBO_PROPINA",
      fee?.designacao || "Recibo Oficial de Pagamento",
      p.studentId,
      student?.nome || "Estudante",
      student?.curso || "Licenciatura",
      "Portal do Estudante",
      "PDF",
      145
    );
  } catch (e) {
    // Non-blocking log
  }
}

/* ---------------- Papel timbrado ---------------- */

export type LetterheadVariant = "geral" | "financas" | "declaracao";

const VARIANTS: Record<LetterheadVariant, { titulo: string; corpo: string[] }> = {
  geral: {
    titulo: "Papel Timbrado · Uso Geral",
    corpo: [
      "Exmo(a). Senhor(a),",
      "",
      "[ Corpo da comunicação ]",
      "",
      "Sem outro assunto de momento, subscrevemo-nos com elevada consideração.",
    ],
  },
  financas: {
    titulo: "Papel Timbrado · Direcção de Finanças",
    corpo: [
      "Assunto: Notificação de propinas e taxas em dívida",
      "",
      "Exmo(a). Estudante,",
      "",
      "Vimos por este meio informar que consta no sistema de gestão de pagamentos",
      "um saldo em dívida referente a [ propina / taxa ], com vencimento em",
      "[ data ]. Solicitamos a regularização no prazo de 15 dias úteis.",
      "",
      "A Direcção de Finanças",
    ],
  },
  declaracao: {
    titulo: "Papel Timbrado · Declaração de Quitação",
    corpo: [
      "DECLARAÇÃO",
      "",
      "Declara-se, para os devidos efeitos, que o(a) estudante [ nome ], com o número",
      "[ nº de estudante ], matriculado(a) no curso de [ curso ], tem a sua situação",
      "financeira regularizada junto desta instituição até à presente data.",
      "",
      "Maputo, ____ de ____________ de 20____",
    ],
  },
};

export function downloadLetterhead(variant: LetterheadVariant) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const v = VARIANTS[variant];
  header(doc, v.titulo);

  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Ref.ª ____________ / 20____", w - 18, 58, { align: "right" });
  doc.text(`Maputo, ${dataPt(new Date().toISOString())}`, w - 18, 64, { align: "right" });

  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  let y = 82;
  v.corpo.forEach((linha) => {
    doc.text(linha, 18, y);
    y += 7.5;
  });

  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...GREY);
  doc.line(18, h - 46, 88, h - 46);
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text("Assinatura e carimbo", 18, h - 40);

  footer(doc, `${UNIVERSITY.sigla} · modelo institucional de papel timbrado`);
  doc.save(`papel-timbrado-${variant}.pdf`);
}

/* ---------------- Plano do sistema ---------------- */

export function downloadSystemPlan() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  header(doc, "Plano do Sistema · Módulo de Pagamentos");

  const par = (texto: string, y: number, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const linhas = doc.splitTextToSize(texto, w - 36) as string[];
    doc.text(linhas, 18, y);
    return y + linhas.length * (size * 0.45) + 4;
  };
  const titulo = (texto: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    doc.text(texto, 18, y);
    doc.setDrawColor(...GOLD);
    doc.line(18, y + 2, 40, y + 2);
    return y + 9;
  };

  let y = 58;
  y = par(
    "Sistema de Gestão Universitária centrado no módulo financeiro: pagamentos, propinas, taxas, estado dos pagamentos e recibos. O documento descreve âmbito funcional, modelo de dados e faseamento de implementação.",
    y,
  );
  y += 2;

  y = titulo("1. Âmbito funcional", y);
  const mods: { k: string; d: string }[] = [
    { k: "Pagamentos", d: "Pagamento online por cartão, mobile money e transferência bancária; registo seguro da transacção e reconciliação." },
    { k: "Propinas", d: "Estrutura de propinas por semestre/ano lectivo, diferenciada por curso e programa." },
    { k: "Taxas", d: "Encargos adicionais configuráveis pelo administrador (biblioteca, laboratório, inscrição, certificações)." },
    { k: "Estado dos pagamentos", d: "Painel com pendentes, liquidados e vencidos; lembretes automáticos para saldos em dívida." },
    { k: "Recibos", d: "Emissão de recibo digital após liquidação, com descarga e impressão em PDF." },
  ];
  mods.forEach(({ k, d }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`• ${k}`, 22, y);
    y = par(d, y + 5, 9.5) + 1;
  });

  y = titulo("2. Modelo de dados", y + 2);
  autoTable(doc, {
    startY: y,
    head: [["Tabela", "Campos principais", "Finalidade"]],
    body: [
      ["Students", "student_id, nome, curso, ano, email", "Dados do estudante"],
      ["Fees", "fee_id, tipo (propina/taxa), valor, vencimento, curso", "Definição das estruturas de custos"],
      ["Payments", "payment_id, student_id, fee_id, valor_pago, data, método, estado", "Registo e seguimento das transacções"],
      ["Receipts", "receipt_id, payment_id, student_id, pdf_link", "Armazenamento e descarga de recibos"],
    ],
    theme: "grid",
    styles: { fontSize: 8.8, cellPadding: 3, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 } },
    margin: { left: 18, right: 18 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  y = titulo("3. Fluxos de utilização", y);
  y = par(
    "Estudante: autenticação - painel pessoal com saldo e vencimentos - selecção do encargo - pagamento - recibo em PDF.",
    y,
    9.5,
  );
  y = par(
    "Administrador: configuração de propinas e taxas - monitorização do estado dos pagamentos - emissão de notificações - relatórios de cobrança.",
    y,
    9.5,
  );

  footer(doc, "Plano do sistema · documento de trabalho");
  doc.addPage();
  header(doc, "Plano do Sistema · Faseamento");
  y = titulo("4. Faseamento", 58);
  autoTable(doc, {
    startY: y,
    head: [["Fase", "Entregável", "Duração estimada"]],
    body: [
      ["Fase 1", "Cadastro de estudantes, propinas e taxas", "2 semanas"],
      ["Fase 2", "Registo de pagamentos e estado dos pagamentos", "3 semanas"],
      ["Fase 3", "Integração de pagamento online e conciliação", "3 semanas"],
      ["Fase 4", "Recibos em PDF, notificações e relatórios", "2 semanas"],
      ["Fase 5", "Extensões: notas, horários, matrículas", "a definir"],
    ],
    theme: "striped",
    styles: { fontSize: 8.8, cellPadding: 3, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    margin: { left: 18, right: 18 },
  });
  footer(doc, "Plano do sistema · documento de trabalho");

  // Página 2 — dados actuais
  doc.addPage();
  header(doc, "Anexo · Configuração actual");
  autoTable(doc, {
    startY: 58,
    head: [["Código", "Designação", "Tipo", "Curso", "Valor", "Vencimento"]],
    body: fees.map((f) => [
      f.id,
      f.designacao,
      f.tipo === "propina" ? "Propina" : "Taxa",
      f.curso,
      mzn(f.valor),
      dataPt(f.vencimento),
    ]),
    theme: "grid",
    styles: { fontSize: 8.2, cellPadding: 2.6, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    margin: { left: 18, right: 18 },
  });
  let y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: y2,
    head: [["Estudante", "Curso", "Ano", "Encargos", "Em dívida"]],
    body: students.map((s) => {
      const meus = payments.filter((p) => p.studentId === s.id);
      const divida = meus.reduce(
        (a, p) => a + Math.max((findFee(p.feeId)?.valor ?? 0) - p.valorPago, 0),
        0,
      );
      return [s.nome, s.curso, `${s.ano}º`, String(meus.length), mzn(divida)];
    }),
    theme: "grid",
    styles: { fontSize: 8.2, cellPadding: 2.6, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    margin: { left: 18, right: 18 },
  });
  y2 = 0;
  footer(doc, "Anexo gerado a partir dos dados do sistema");

  doc.save("plano-do-sistema-ul.pdf");
}

/* ---------------- Declaração de Situação Financeira / Quitação com QR Code ---------------- */

export async function downloadClearanceCertificate(
  student: Student,
  stats: { totalInvoiced: number; totalPaid: number; totalOutstanding: number },
  payments: Payment[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  header(doc, "Declaração de Situação Financeira");

  const isFullyPaid = stats.totalOutstanding === 0;
  const certNumber = `DECL-UL-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString("pt-MZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Title Box
  doc.setFillColor(247, 243, 233);
  doc.rect(18, 52, w - 36, 24, "F");
  doc.setDrawColor(...GOLD);
  doc.rect(18, 52, w - 36, 24, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  const mainTitle = isFullyPaid
    ? "DECLARAÇÃO DE QUITAÇÃO TOTAL DE PROPINAS"
    : "DECLARAÇÃO DE SITUAÇÃO FINANCEIRA E EXTRATO";
  doc.text(mainTitle, w / 2, 63, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text(`Ref.ª Oficial: ${certNumber} · Emitido a ${dateStr}`, w / 2, 70, { align: "center" });

  // Body Paragraph
  let y = 84;
  doc.setFontSize(10);
  doc.setTextColor(...INK);

  const textBody = `A Direcção dos Serviços Financeiros e Académicos da ${UNIVERSITY.nome} (${UNIVERSITY.sigla}) declara para os devidos efeitos que o(a) estudante abaixo identificado(a) encontra-se devidamente matriculado(a) no presente Ano Lectivo de 2026.`;
  const splitText = doc.splitTextToSize(textBody, w - 36);
  doc.text(splitText, 18, y);
  y += splitText.length * 4.8 + 4;

  // Student details table
  autoTable(doc, {
    startY: y,
    head: [["Atributo Académico", "Informação do Estudante"]],
    body: [
      ["Nome Completo", student.nome],
      ["N.º de Estudante", student.id],
      ["Doc. Identificação / NUIT", student.docId || "Não registado"],
      ["Endereço de E-mail", student.email],
      ["Curso Académico", student.curso],
      ["Ano Curricular", `${student.ano}º Ano`],
      [
        "Estado Financeiro",
        isFullyPaid ? "SITUAÇÃO REGULARIZADA (QUITAÇÃO TOTAL)" : "PENDÊNCIA DE PAGAMENTO REGISTADA",
      ],
    ],
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.8, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: 18, right: 18 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Summary of Financial Account
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("Resumo de Propinas & Liquidações", 18, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Total Facturado", "Total Liquidado", "Saldo em Dívida", "Situação"]],
    body: [
      [
        mzn(stats.totalInvoiced),
        mzn(stats.totalPaid),
        mzn(stats.totalOutstanding),
        isFullyPaid ? "REGULARIZADO" : "PENDENTE",
      ],
    ],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3, textColor: INK, halign: "center" },
    headStyles: { fillColor: INK, textColor: 255, halign: "center" },
    margin: { left: 18, right: 18 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Final Certification Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);

  const certStatement = isFullyPaid
    ? "Mais se declara que o(a) estudante cumpriu integralmente com todas as obrigações financeiras e propinas até à presente data, não constando quaisquer encargos em atraso perante a universidade. Esta declaração confere acesso irrestrito a exames e matrículas."
    : "Conforme registado no extrato acima, o(a) estudante possui um saldo remanescente em dívida. Solicita-se a regularização junto dos canais autorizados da universidade.";

  const splitStatement = doc.splitTextToSize(certStatement, w - 36);
  doc.text(splitStatement, 18, y);
  y += splitStatement.length * 4.2 + 6;

  // QR Code Generation & Embedding
  const certVerificationUrl = buildVerificationUrl(certNumber, "CERTIFICADO_QUITACAO");
  const integrityHash = computeDocumentIntegrityHash(certNumber, student.id, stats.totalPaid, dateStr);

  try {
    const qrDataUrl = await generateQRCodeDataUrl(certVerificationUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#163a32", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    const qrBoxY = y;
    const qrBoxHeight = 36;
    doc.setFillColor(248, 250, 249);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "F");
    doc.setDrawColor(210, 222, 216);
    doc.setLineWidth(0.4);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "S");

    // Add QR Code
    doc.addImage(qrDataUrl, "PNG", 22, qrBoxY + 3, 30, 30);

    // Text details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("VERIFICAÇÃO OFICIAL DE QUITAÇÃO POR QR CODE", 56, qrBoxY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text("Aponte a câmara para validar a autenticidade e conformidade desta certidão no Portal Oficial.", 56, qrBoxY + 15);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(`Ref: ${certNumber}  ·  Selo: UL-CERT-${integrityHash.substring(2, 12)}`, 56, qrBoxY + 22);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.8);
    doc.setTextColor(...GREY);
    doc.text(`Link: ${certVerificationUrl}`, 56, qrBoxY + 28);
  } catch (err) {
    console.error("Failed to embed QR code into clearance certificate:", err);
  }

  // Signatures
  doc.setDrawColor(...GREY);
  doc.line(18, h - 38, 85, h - 38);
  doc.line(125, h - 38, w - 18, h - 38);

  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("Direcção dos Serviços Financeiros", 18, h - 33);
  doc.text("O(A) Chefe da Secretaria Académica", 125, h - 33);

  doc.setFontSize(7);
  doc.text(`Autenticado digitalmente · Código QR: ${certNumber}`, 18, h - 26);

  footer(doc, `${UNIVERSITY.sigla} · Declaração Oficial de Situação Financeira`);
  doc.save(`declaracao-financeira-${student.id}.pdf`);

  try {
    recordDocumentDownload(
      "DECLARACAO_QUITACAO",
      "Declaração Oficial de Quitação de Propinas",
      student.id,
      student.nome,
      student.curso,
      "Secretaria Presencial",
      "PDF",
      210
    );
  } catch (e) {
    // Non-blocking
  }
}

/* ---------------- Certificado de Matrícula & Frequência com QR Code ---------------- */

export async function downloadEnrollmentCertificate(student: Student, anoLectivo = "2026") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  header(doc, "Certificado de Matrícula e Frequência");

  const certNumber = `CERT-MATR-${student.id}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString("pt-MZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Certificate Header Banner
  doc.setFillColor(247, 243, 233);
  doc.rect(18, 52, w - 36, 26, "F");
  doc.setDrawColor(...GOLD);
  doc.rect(18, 52, w - 36, 26, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("CERTIDÃO OFICIAL DE MATRÍCULA E FREQUÊNCIA", w / 2, 64, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text(`Registo Académico N.º ${certNumber} · Ano Lectivo ${anoLectivo}`, w / 2, 72, { align: "center" });

  // Body text
  let y = 88;
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);

  const introText = `A Direcção do Registo Académico da ${UNIVERSITY.nome} (${UNIVERSITY.sigla}), instituição de ensino superior sediada em Maputo, certifica para os devidos efeitos e a pedido do(a) interessado(a) que:`;
  const splitIntro = doc.splitTextToSize(introText, w - 36);
  doc.text(splitIntro, 18, y);
  y += splitIntro.length * 5 + 6;

  // Student details table
  autoTable(doc, {
    startY: y,
    head: [["Informação Registada", "Dados Oficiais do Estudante"]],
    body: [
      ["Nome Completo", student.nome],
      ["N.º de Estudante", student.id],
      ["Documento de Identificação", student.docId || "Não registado"],
      ["Curso de Licenciatura", student.curso],
      ["Ano Curricular", `${student.ano}º Ano Lectivo`],
      ["Regime de Estudos", "Presencial / Integral"],
      ["Situação de Matrícula", "MATRICULADO(A) E REGULAR"],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3.2, textColor: INK },
    headStyles: { fillColor: INK, textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 18, right: 18 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const conclusionText = `Mais se certifica que o(a) estudante supramencionado(a) frequenta com assiduidade regular as unidades curriculares correspondentes ao presente plano de estudos, encontrando-se habilitado(a) a todos os actos académicos e civis decorrentes do seu estatuto.\n\nPor ser verdade e ter sido solicitada, mandou-se passar a presente certidão que vai assinada e autenticada com o selo institucional.`;
  const splitConclusion = doc.splitTextToSize(conclusionText, w - 36);
  doc.text(splitConclusion, 18, y);
  y += splitConclusion.length * 4.8 + 6;

  // Embed QR Code
  const qrUrl = buildVerificationUrl(certNumber, "CERTIFICADO_MATRICULA");
  const integrityHash = computeDocumentIntegrityHash(certNumber, student.id, 0, dateStr);

  try {
    const qrDataUrl = await generateQRCodeDataUrl(qrUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#163a32", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    const qrBoxY = y;
    const qrBoxHeight = 36;
    doc.setFillColor(248, 250, 249);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "F");
    doc.setDrawColor(210, 222, 216);
    doc.setLineWidth(0.4);
    doc.rect(18, qrBoxY, w - 36, qrBoxHeight, "S");

    doc.addImage(qrDataUrl, "PNG", 22, qrBoxY + 3, 30, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("AUTENTICAÇÃO ACADÉMICA POR QR CODE", 56, qrBoxY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text("Valide a integridade e veracidade deste certificado digital apontando a câmara ou via portal.", 56, qrBoxY + 15);

    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(`Certificado: ${certNumber}  ·  Selo: UL-CERT-${integrityHash.substring(2, 12)}`, 56, qrBoxY + 22);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.8);
    doc.setTextColor(...GREY);
    doc.text(`Portal: ${qrUrl}`, 56, qrBoxY + 28);
  } catch (err) {
    console.error("Failed to embed QR code into enrollment cert:", err);
  }

  // Signatures
  doc.setDrawColor(...GREY);
  doc.line(18, h - 38, 85, h - 38);
  doc.line(125, h - 38, w - 18, h - 38);

  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("O(A) Director(a) Pedagógico(a)", 18, h - 33);
  doc.text("O(A) Chefe do Registo Académico", 125, h - 33);

  footer(doc, `${UNIVERSITY.sigla} · Certificado Oficial de Matrícula e Frequência`);
  doc.save(`certificado-matricula-${student.id}.pdf`);

  try {
    recordDocumentDownload(
      "CERTIFICADO_MATRICULA",
      "Certidão Oficial de Matrícula e Frequência",
      student.id,
      student.nome,
      student.curso,
      "Portal do Estudante",
      "PDF",
      245
    );
  } catch (e) {
    // Non-blocking
  }
}


