import React, { useState } from "react";
import { Panel, Shell } from "@/components/Shell";
import { useUniStore } from "@/lib/uni-store";
import { mzn, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { AddStudentModal } from "@/components/AddStudentModal";
import { StudentProfileModal } from "@/components/StudentProfileModal";
import studentsImg from "@/assets/students.jpg";
import { UserPlus, Search, Eye, CreditCard, Shield, Mail } from "lucide-react";

export function Estudantes() {
  const { t } = useI18n();
  const { students, getStudentStats } = useUniStore();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nome.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.docId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.curso.toLowerCase().includes(q)
    );
  });

  return (
    <Shell
      titulo="Registo de Estudantes"
      descricao="Gestão do cadastro académico, consulta de documento de identificação/NUIT, histórico de pagamentos e liquidação de propinas."
      imagem={studentsImg}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Pesquisar por Nº de estudante, Nome, Doc. ID / NUIT, Email...")}
            className="w-full rounded-sm border border-input bg-card pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Add Student Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 shrink-0"
        >
          <UserPlus className="size-4" />
          <span>{t("Adicionar Estudante")}</span>
        </button>
      </div>

      <Panel
        titulo={`${filteredStudents.length} ${t("estudantes registados")}`}
        acao={
          <span className="text-xs text-muted-foreground">
            {t("Clique num estudante para ver o histórico e efectuar pagamentos.")}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium">{t("Nº de estudante")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Nome")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Doc. ID / NUIT")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Curso / Ano")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Email")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("Em dívida")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("Acção")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    {t("Nenhum estudante encontrado para a pesquisa.")}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const stats = getStudentStats(s.id);
                  const divida = stats.totalOutstanding;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/20 cursor-pointer transition"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-bold text-foreground">
                        {s.id}
                      </td>
                      <td className="px-5 py-3 font-semibold text-foreground">{s.nome}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="size-3 text-muted-foreground/60" />
                          <span>{s.docId || "N/A"}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {t(s.curso)} · {s.ano}º
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3 text-muted-foreground/60" />
                          <span>{s.email}</span>
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-bold ${
                          divida > 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {mzn(divida)}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary transition"
                        >
                          {divida > 0 ? (
                            <>
                              <CreditCard className="size-3.5 text-primary" />
                              <span>{t("Pagar / Histórico")}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="size-3.5" />
                              <span>{t("Ver Ficha")}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onStudentAdded={(newStudent) => {
            setShowAddModal(false);
            setSelectedStudent(newStudent);
          }}
        />
      )}

      {/* Student Profile & Payment History Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </Shell>
  );
}
