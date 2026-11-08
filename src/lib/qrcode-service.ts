import QRCode from "qrcode";
import { UNIVERSITY } from "./uni-data";

export interface QRCodeGenerateOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface DocumentVerificationData {
  code: string;
  type: "RECIBO" | "CERTIFICADO_MATRICULA" | "CERTIFICADO_QUITACAO" | "CERTIDAO_NOTAS" | "DECLARACAO" | "PLANO_SISTEMA" | "DOCUMENTO";
  studentId?: string;
  studentName?: string;
  course?: string;
  amountMzn?: number;
  date?: string;
  issuer?: string;
  hash?: string;
}

/**
 * Builds the canonical verification URL for any document
 */
export function buildVerificationUrl(code: string, type?: string): string {
  let baseUrl = "https://leonardo-university.ac.mz";
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    baseUrl = window.location.origin;
  }

  const cleanCode = (code || "").trim().toUpperCase();
  const params = new URLSearchParams();
  params.set("code", cleanCode);
  if (type) {
    params.set("type", type);
  }

  return `${baseUrl}/verificar?${params.toString()}`;
}

/**
 * Computes a deterministic SHA-256-like integrity hash for client verification
 */
export function computeDocumentIntegrityHash(code: string, studentId = "", amount = 0, date = ""): string {
  const seed = `${code}|${studentId}|${amount}|${date}|UPM-MOZAMBIQUE-2026-SEAL`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < seed.length; i++) {
    ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hexPart = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");
  return `0x${hexPart}8f4e92a1c0d7b3e5`.substring(0, 34).toUpperCase();
}

/**
 * Generates a PNG Data URL for a given text or verification payload
 */
export async function generateQRCodeDataUrl(
  textOrPayload: string | DocumentVerificationData,
  options?: QRCodeGenerateOptions
): Promise<string> {
  const text = typeof textOrPayload === "string" 
    ? textOrPayload 
    : buildVerificationUrl(textOrPayload.code, textOrPayload.type);

  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    width: options?.width || 300,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark || "#163a32", // Institutional INK color
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: options?.errorCorrectionLevel || "H", // High redundancy for reliable scanning on paper/PDF
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error("Error generating QR Code DataURL:", err);
    // Fallback simple QR generation
    return await QRCode.toDataURL(text);
  }
}

/**
 * Generates an SVG string representation of the QR Code
 */
export async function generateQRCodeSvg(
  textOrPayload: string | DocumentVerificationData,
  options?: QRCodeGenerateOptions
): Promise<string> {
  const text = typeof textOrPayload === "string" 
    ? textOrPayload 
    : buildVerificationUrl(textOrPayload.code, textOrPayload.type);

  const defaultOptions: QRCode.QRCodeToStringOptions = {
    type: "svg",
    width: options?.width || 300,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark || "#163a32",
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: options?.errorCorrectionLevel || "H",
  };

  try {
    return await QRCode.toString(text, defaultOptions);
  } catch (err) {
    console.error("Error generating QR Code SVG:", err);
    return await QRCode.toString(text, { type: "svg" });
  }
}

/**
 * Pre-computes receipt verification metadata for QR generation
 */
export function getReceiptQRData(paymentId: string, receiptNo: string, studentId: string, studentName: string, amount: number, date: string) {
  const code = receiptNo || paymentId;
  const verificationUrl = buildVerificationUrl(code, "RECIBO");
  const integrityHash = computeDocumentIntegrityHash(code, studentId, amount, date);

  return {
    code,
    type: "RECIBO" as const,
    studentId,
    studentName,
    amountMzn: amount,
    date,
    issuer: UNIVERSITY.nome,
    verificationUrl,
    integrityHash,
    digitalSeal: `UL-REC-${integrityHash.substring(2, 14)}`,
  };
}

/**
 * Pre-computes certificate verification metadata for QR generation
 */
export function getCertificateQRData(certCode: string, studentId: string, studentName: string, course: string, certType: "CERTIFICADO_MATRICULA" | "CERTIFICADO_QUITACAO" | "CERTIDAO_NOTAS" | "DECLARACAO", date: string) {
  const verificationUrl = buildVerificationUrl(certCode, certType);
  const integrityHash = computeDocumentIntegrityHash(certCode, studentId, 0, date);

  return {
    code: certCode,
    type: certType,
    studentId,
    studentName,
    course,
    date,
    issuer: UNIVERSITY.nome,
    verificationUrl,
    integrityHash,
    digitalSeal: `UL-CERT-${integrityHash.substring(2, 14)}`,
  };
}
