import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { CURSOS, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, UserPlus, Check, Sparkles } from "lucide-react";

interface AddStudentModalProps {
  onClose: () => void;
  onStudentAdded?: (student: Student) => void;
}

export function AddStudentModal({ onClose, onStudentAdded }: AddStudentModalProps) {
  const { t } = useI18n();
  const { addStudent } = useUniStore();

  const [studentId, setStudentId] = useState(`EST-${new Date().getFullYear()}-007`);
  const [nome, setNome] = useState("");
  const [docId, setDocId] = useState("");
  const [email, setEmail] = useState("");
  const [curso, setCurso] = useState(CURSOS[0]);
  const [ano, setAno] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !docId.trim() || !email.trim()) return;

    const newStudent = addStudent({
      id: studentId,
      nome,
      docId,
      email,
      curso,
      ano,
    });

    setCreatedStudent(newStudent);
    setSubmitted(true);
    if (onStudentAdded) {
      onStudentAdded(newStudent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="border-b border-border pb-4 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <UserPlus className="size-3.5" />
                <span>{t("Registo de Estudantes · UPM")}</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                {t("Adicionar Novo Estudante")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Preencha o número de estudante, documento de identificação/NUIT, e-mail e curso.")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Nº de Estudante")} *
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Ex: EST-2026-007"
                    className="w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Doc. Identificação / NUIT")} *
                  </label>
                  <input
                    type="text"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    placeholder="Ex: 110100452930B"
                    className="w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Nome Completo")} *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mateus Fernando Sitoe"
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Endereço de E-mail")} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: mateus.sitoe@upm.ac.mz"
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Curso Académico")}
                  </label>
                  <select
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CURSOS.map((c) => (
                      <option key={c} value={c}>
                        {t(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Ano Curricular")}
                  </label>
                  <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5].map((a) => (
                      <option key={a} value={a}>
                        {a}º {t("Ano")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-sm border border-accent/30 bg-accent/10 p-3 text-xs text-foreground flex items-start gap-2">
                <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
                <span>
                  {t(
                    "Ao cadastrar o estudante, as propinas e taxas padrão do curso (Ex: Propina 1º e 2º Semestre, Inscrição, Biblioteca) serão automaticamente lançadas no portal financeiro."
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-sm border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  className="rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                >
                  {t("Cadastrar Estudante")}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-8" />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {t("Estudante Cadastrado com Sucesso!")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {createdStudent?.nome} ({createdStudent?.id}) {t("está registado no sistema.")}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-muted/40 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Nº de Estudante")}:</span>
                <span className="font-mono font-bold text-foreground">{createdStudent?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Doc. Identificação")}:</span>
                <span className="font-mono text-foreground">{createdStudent?.docId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("E-mail")}:</span>
                <span className="text-foreground">{createdStudent?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Curso / Ano")}:</span>
                <span className="text-foreground">
                  {createdStudent?.curso} · {createdStudent?.ano}º Ano
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("Ver Lista de Estudantes")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
