import { Link } from "@/lib/router";
import { Panel, Shell, StatusBadge } from "@/components/Shell";
import { useUniStore } from "@/lib/uni-store";
import { useRole, WorkerOnly, StudentOnly } from "@/lib/role";
import { dataPt, mzn, type Payment, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { AcademicCalendar } from "@/components/AcademicCalendar";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  CreditCard,
  FileText,
  Building,
  Briefcase,
} from "lucide-react";
import campusLifeImg from "@/assets/images/campus_life_1786439382297.jpg";
import financeServicesImg from "@/assets/images/financial_services_1786439400478.jpg";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";

export function Dashboard() {
  const { t: tr } = useI18n();
  const { payments, students, fees } = useUniStore();
  const { isWorker, isStudent, workerProfile } = useRole();

  const findStudentInStore = (id: string) => students.find((s) => s.id === id);
  const findFeeInStore = (id: string) => fees.find((f) => f.id === id);

  const calcFeeDue = (p: Payment) => {
    const fee = findFeeInStore(p.feeId);
    return Math.max((fee?.valor ?? 0) - p.valorPago, 0);
  };

  const cobrado = payments.reduce((a, p) => a + (findFeeInStore(p.feeId)?.valor ?? 0), 0);
  const recebido = payments.reduce((a, p) => a + p.valorPago, 0);
  const vencido = payments.filter((p) => p.estado === "vencido").reduce((a, p) => a + calcFeeDue(p), 0);
  const pendente = payments.filter((p) => p.estado === "pendente").reduce((a, p) => a + calcFeeDue(p), 0);

  const emAtraso = payments.filter((p) => p.estado !== "pago");
  const taxaCobranca = cobrado > 0 ? Math.round((recebido / cobrado) * 100) : 100;

  const cards = [
    {
      label: tr("Total Facturado"),
      valor: mzn(cobrado),
      nota: `${payments.length} ${tr("encargos lançados")}`,
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: tr("Recebido / Liquidado"),
      valor: mzn(recebido),
      nota: `${taxaCobranca}% ${tr("da facturação total")}`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: tr("Pendente"),
      valor: mzn(pendente),
      nota: tr("A aguardar liquidação"),
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: tr("Vencido em Mora"),
      valor: mzn(vencido),
      nota: tr("Requer notificação académica"),
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  ];

  const destaques = [
    {
      img: campusLifeImg,
      badge: "Vida Académica",
      titulo: "Vida no Campus Universitário",
      texto: "Infraestrutura moderna e ecossistema de aprendizagem construído à volta do sucesso dos estudantes.",
    },
    {
      img: financeServicesImg,
      badge: "Serviços Digitais",
      titulo: "Serviços Financeiros & Web3",
      texto: "Gestão transparente de propinas, taxas, M-Pesa e recibos certificados num só portal integrado.",
    },
    {
      img: studentSupportImg,
      badge: "Apoio & Mentoria",
      titulo: "Orientação Inteligente IA",
      texto: "Bolsas de mérito, parcelamento flexível e aconselhamento personalizado com inteligência artificial.",
    },
  ];

  return (
    <Shell
      titulo="Painel de Gestão Financeira & Pagamentos"
      descricao="Visão executiva e consolidada de propinas, taxas, liquidação e estado financeiro institucional."
    >
      {/* Role-tailored Action Banners */}
      {isWorker ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-slate-900/40 to-card p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              <Briefcase className="size-3.5 text-amber-500" />
              <span>{tr("Área de Trabalho Administrativa (Funcionário)")}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {tr("Gabinete de Tesouraria, Emissão de Quitações & Notificações")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {tr("Sessão autenticada para o funcionário")} <strong>{workerProfile.name}</strong> ({workerProfile.cargo}). {tr("Aceda a ferramentas de fecho de caixa, aprovação de isenções e disparador de SMS.")}
            </p>
          </div>
          <Link
            to="/painel-funcionario"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Building className="size-4" />
            <span>{tr("Abrir Painel de Funcionário")}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/5 to-card p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary/15 border border-primary/20 px-3 py-1 rounded-full">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>{tr("Novo Orientador Inteligente")}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {tr("Orientador IA do Estudante · Guia de Escolhas & Custos")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {tr(
                "Obtenha simulações de custos, opções de parcelamento de propinas e aconselhamento financeiro personalizado segundo o seu curso e escolhas.",
              )}
            </p>
          </div>
          <Link
            to="/orientador"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <span>{tr("Abrir Orientador IA")}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {c.label}
                </span>
                <div className={`size-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center ${c.color}`}>
                  <Icon className="size-5" />
                </div>
              </div>

              <div className="mt-4">
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {c.valor}
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-medium">
                  {c.nota}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection Efficiency Progress Bar */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">
              {tr("Taxa Global de Liquidação Financeira")}
            </h3>
            <p className="text-xs text-muted-foreground">
              Percentagem de receita arrecadada vs. total facturado no período corrente
            </p>
          </div>
          <span className="font-display text-xl font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
            {taxaCobranca}%
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 border border-border/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-emerald-500 transition-all duration-500"
            style={{ width: `${taxaCobranca}%` }}
          />
        </div>
      </div>

      {/* Campus Destaques Cards */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {destaques.map((d) => (
          <article
            key={d.titulo}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-all flex flex-col"
          >
            <div className="relative overflow-hidden h-44 w-full">
              <img
                src={d.img}
                alt={tr(d.titulo)}
                width={1200}
                height={800}
                loading="lazy"
                className="size-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                {d.badge}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition">
                  {tr(d.titulo)}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{tr(d.texto)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Academic & Financial Milestone Calendar */}
      <div className="mt-8">
        <AcademicCalendar />
      </div>

      {/* Tables Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          titulo={tr("Saldos e Propinas por Regularizar")}
          acao={
            <Link
              to="/pagamentos"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>{tr("Ver todos os pagamentos")}</span>
              <ArrowRight className="size-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">{tr("Estudante")}</th>
                  <th className="py-3 px-4">{tr("Encargo / Propina")}</th>
                  <th className="py-3 px-4">{tr("Vencimento")}</th>
                  <th className="py-3 px-4 text-right">{tr("Em Dívida")}</th>
                  <th className="py-3 px-4 text-center">{tr("Estado")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {emAtraso.map((p) => {
                  const fee = findFeeInStore(p.feeId);
                  const student = findStudentInStore(p.studentId);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition">
                      <td className="py-3.5 px-5 font-bold text-foreground">
                        <div>{student?.nome || p.studentId}</div>
                        <div className="text-[10px] text-muted-foreground font-mono font-normal">{student?.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{tr(fee?.designacao ?? "")}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">{dataPt(fee?.vencimento ?? p.data)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-destructive font-mono">{mzn(calcFeeDue(p))}</td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge estado={p.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel titulo={tr("Cobrança por Curso")}>
            <ul className="divide-y divide-border/60 -mx-5 -my-5">
              {[...new Set(students.map((s) => s.curso))].map((curso) => {
                const ids = students.filter((s) => s.curso === curso).map((s) => s.id);
                const divida = payments
                  .filter((p) => ids.includes(p.studentId))
                  .reduce((a, p) => a + calcFeeDue(p), 0);
                return (
                  <li key={curso} className="flex items-center justify-between px-5 py-3.5 text-xs hover:bg-muted/30 transition">
                    <span className="font-semibold text-foreground">{tr(curso)}</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                      {mzn(divida)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel titulo={tr("Documentação & Certificados")}>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr("O plano do sistema, modelos de papel timbrado e declarações com validação criptográfica estão disponíveis para download imediato em formato PDF.")}
              </p>
              <Link
                to="/documentos"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 shadow-xs"
              >
                <FileText className="size-3.5" />
                <span>{tr("Aceder a Documentos")}</span>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
