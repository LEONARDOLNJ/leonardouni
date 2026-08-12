import React, { useRef } from "react";
import { type Student, UNIVERSITY } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { UniversityLogo } from "@/components/UniversityLogo";
import { X, Download, QrCode, ShieldCheck, Globe, GraduationCap, Printer } from "lucide-react";

interface StudentCardModalProps {
  student: Student;
  onClose: () => void;
}

export function StudentCardModal({ student, onClose }: StudentCardModalProps) {
  const { t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              {t("Identificação Académica Oficial")}
            </span>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground">
              {t("Cartão Digital de Estudante")}
            </h2>
          </div>
        </div>

        {/* Printable Physical Card Layout */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl transition-all"
        >
          {/* Subtle Watermark Background */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-amber-500/10 blur-2xl" />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <UniversityLogo size="md" />
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-200">
                  {UNIVERSITY.nome}
                </h3>
                <p className="text-[10px] text-slate-300 font-medium tracking-tight">
                  {UNIVERSITY.slogan}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-xs bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                2026 / 2027
              </span>
            </div>
          </div>

          {/* Main Card Body */}
          <div className="mt-5 grid grid-cols-12 gap-4 items-center">
            {/* Avatar Photo */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="relative flex size-24 items-center justify-center rounded-xl bg-slate-700/80 border-2 border-amber-400/40 font-display font-bold text-3xl text-amber-200 shadow-md overflow-hidden">
                {student.foto ? (
                  <img
                    src={student.foto}
                    alt={student.nome}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="select-none">{student.nome.slice(0, 2).toUpperCase()}</span>
                )}
                {student.isInternational && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-blue-600 p-1 text-[9px] text-white shadow-xs z-10">
                    <Globe className="size-3" />
                  </span>
                )}
              </div>
              <span className="mt-2 font-mono text-[10px] font-bold text-amber-300/80 uppercase">
                ESTUDANTE
              </span>
            </div>

            {/* Student Details */}
            <div className="col-span-8 space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                  {t("Nome do Estudante")}
                </span>
                <span className="font-display font-bold text-base text-white leading-tight block truncate">
                  {student.nome}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">
                    {t("Nº de Estudante")}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {student.id}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">
                    {t("Doc. Identidade")}
                  </span>
                  <span className="font-mono text-slate-200 truncate block">
                    {student.docId}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase text-slate-400 block">
                  {t("Curso Académico")}
                </span>
                <span className="font-semibold text-slate-100 truncate block">
                  {t(student.curso)} ({student.ano}º Ano)
                </span>
              </div>
            </div>
          </div>

          {/* Footer Barcode & QR Code */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-sm text-slate-900">
                <QrCode className="size-8" />
              </div>
              <div>
                <p className="font-mono text-[9px] text-slate-400">VAL-LU-2026-{student.id}</p>
                <p className="text-[9px] text-amber-400/90 font-medium">
                  {student.isInternational ? `${t("Estudante Internacional")} (${student.nacionalidade || "Estrangeiro"})` : t("Nacional Moçambicano")}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-mono tracking-widest text-[11px] text-slate-300">
                |||| || ||||| |||| |||
              </p>
              <p className="text-[8px] text-slate-400">{t("Válido em todo o campus universitário")}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            * {t("Apresente este cartão digital na biblioteca, refeitório e exames académicos.")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              <Printer className="size-3.5" />
              <span>{t("Imprimir")}</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              <span>{t("Fechar")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
