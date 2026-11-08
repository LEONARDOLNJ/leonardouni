import React, { useState } from "react";
import { Panel, Shell } from "@/components/Shell";
import { useUniStore } from "@/lib/uni-store";
import { useRole, WorkerOnly, StudentOnly } from "@/lib/role";
import { mzn, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { AddStudentModal } from "@/components/AddStudentModal";
import { StudentProfileModal } from "@/components/StudentProfileModal";
import { CoursePaymentComparisonWidget } from "@/components/CoursePaymentComparisonWidget";
import studentsImg from "@/assets/images/campus_life_1786439382297.jpg";
import { UserPlus, Search, Eye, CreditCard, Shield, Mail, Globe, Briefcase, Filter, X } from "lucide-react";

export function Estudantes() {
  const { t } = useI18n();
  const { students, getStudentStats } = useUniStore();
  const { isWorker } = useRole();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "national" | "international" | "debt" | "paid" | "partial">("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.nome.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.docId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.curso.toLowerCase().includes(q) ||
      (s.nacionalidade && s.nacionalidade.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Course filter from chart
    if (selectedCourseFilter !== "all" && s.curso !== selectedCourseFilter) {
      return false;
    }

    if (categoryFilter === "national") return !s.isInternational;
    if (categoryFilter === "international") return !!s.isInternational;
    if (categoryFilter === "debt") {
      const stats = getStudentStats(s.id);
      return stats.totalOutstanding > 0;
    }
    if (categoryFilter === "paid") {
      const stats = getStudentStats(s.id);
      return stats.totalOutstanding === 0;
    }
    if (categoryFilter === "partial") {
      const stats = getStudentStats(s.id);
      return stats.totalPaid > 0 && stats.totalOutstanding > 0;
    }

    return true;
  });

  return (
    <Shell
      titulo="Registo de Estudantes"
      descricao="Gestão do cadastro académico de estudantes nacionais e internacionais, consulta de documento de identificação/passaporte e histórico de liquidações."
      imagem={studentsImg}
    >
      {/* Secretary Comparison Analytics Widget (Recharts) */}
      <CoursePaymentComparisonWidget
        students={students}
        getStudentStats={getStudentStats}
        selectedCourseFilter={selectedCourseFilter}
        onFilterCourse={(curso) => setSelectedCourseFilter(curso)}
        onFilterStatus={(status) => {
          if (status === "all") setCategoryFilter("all");
          else if (status === "paid") setCategoryFilter("paid");
          else if (status === "debt") setCategoryFilter("debt");
          else if (status === "partial") setCategoryFilter("partial");
        }}
      />

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Pesquisar por Nº de estudante, Nome, Passaporte / NUIT, Nacionalidade...")}
              className="w-full rounded-sm border border-input bg-card pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Add Student Button (Only visible for workers / administrative staff) */}
          <WorkerOnly>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 shrink-0 cursor-pointer"
            >
              <UserPlus className="size-4" />
              <span>{t("Adicionar Estudante (Staff)")}</span>
            </button>
          </WorkerOnly>
        </div>

        {/* Filter Tabs & Active Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium mr-1">{t("Filtrar por")}:</span>
            {[
              { id: "all", label: "Todos os Estudantes" },
              { id: "paid", label: "100% Regularizados" },
              { id: "partial", label: "Parcialmente Pagos" },
              { id: "debt", label: "Com Saldo Pendente" },
              { id: "national", label: "Nacionais" },
              { id: "international", label: "Internacionais" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`rounded-xs px-3 py-1 font-semibold transition cursor-pointer ${
                  categoryFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/* Active Course Filter Chip */}
          {(selectedCourseFilter !== "all" || categoryFilter !== "all" || search) && (
            <div className="flex items-center gap-2">
              {selectedCourseFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                  <span>{t("Curso")}: {selectedCourseFilter}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCourseFilter("all")}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseFilter("all");
                  setCategoryFilter("all");
                  setSearch("");
                }}
                className="text-xs text-muted-foreground hover:text-destructive font-semibold underline cursor-pointer"
              >
                {t("Limpar todos os filtros")}
              </button>
            </div>
          )}
        </div>
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
                <th className="px-5 py-2.5 font-medium">{t("Doc. ID / Passaporte")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Curso / Ano")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Email & Origem")}</th>
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
                      <td className="px-5 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center font-bold text-xs text-primary">
                            {s.foto ? (
                              <img
                                src={s.foto}
                                alt={s.nome}
                                referrerPolicy="no-referrer"
                                className="size-full object-cover"
                              />
                            ) : (
                              s.nome.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{s.nome}</span>
                              {s.isInternational && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.2 text-[10px] font-semibold">
                                  <Globe className="size-3" />
                                  INT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
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
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3 text-muted-foreground/60" />
                            <span>{s.email}</span>
                          </span>
                          {s.nacionalidade && (
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {s.nacionalidade}
                            </p>
                          )}
                        </div>
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
