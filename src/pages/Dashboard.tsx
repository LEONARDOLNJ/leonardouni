import { Link } from "@/lib/router";
import { Panel, Shell, StatusBadge } from "@/components/Shell";
import { useUniStore } from "@/lib/uni-store";
import { dataPt, mzn, type Payment, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { AcademicCalendar } from "@/components/AcademicCalendar";
import studentsImg from "@/assets/students.jpg";
import financeImg from "@/assets/finance.jpg";
import graduationImg from "@/assets/graduation.jpg";

export function Dashboard() {
  const { t: tr } = useI18n();
  const { payments, students, fees } = useUniStore();

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
    { label: tr("Total facturado"), valor: mzn(cobrado), nota: `${payments.length} ${tr("encargos lançados")}` },
    { label: tr("Recebido"), valor: mzn(recebido), nota: `${taxaCobranca}% ${tr("da facturação")}` },
    { label: tr("Pendente"), valor: mzn(pendente), nota: tr("aguarda liquidação") },
    { label: tr("Vencido"), valor: mzn(vencido), nota: tr("requer notificação") },
  ];

  const destaques = [
    { img: studentsImg, titulo: "Vida no campus", texto: "Uma universidade construída à volta dos seus estudantes." },
    { img: financeImg, titulo: "Serviços financeiros", texto: "Gestão transparente de propinas, taxas e recibos — tudo num só portal." },
    { img: graduationImg, titulo: "Apoio ao estudante", texto: "Candidaturas abertas para o ano lectivo 2026" },
  ];

  return (
    <Shell
      titulo="Painel de Pagamentos"
      descricao="Visão consolidada de propinas, taxas e estado de cobrança do ano lectivo corrente."
    >
      {/* AI Guidance Callout Banner */}
      <div className="mb-6 overflow-hidden rounded-sm border border-primary/20 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground bg-accent/20 px-2.5 py-0.5 rounded-sm">
            <span>✨ {tr("Novo Recurso IA")}</span>
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {tr("Orientador IA do Estudante · Guia de Escolhas")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {tr("Obtenha simulações de custos, opções de parcelamento de propinas e aconselhamento financeiro personalizado segundo o seu curso e escolhas.")}
          </p>
        </div>
        <Link
          to="/orientador"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 shrink-0"
        >
          <span>{tr("Abrir Orientador IA")}</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-sm border border-border bg-card p-5">
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{c.label}</p>
            <p className="mt-3 font-display text-2xl font-semibold text-foreground">{c.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.nota}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-sm border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{tr("Taxa de cobrança")}</p>
          <p className="font-display text-lg font-semibold">{taxaCobranca}%</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${taxaCobranca}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {destaques.map((d) => (
          <article key={d.titulo} className="overflow-hidden rounded-sm border border-border bg-card">
            <img
              src={d.img}
              alt={tr(d.titulo)}
              width={1200}
              height={800}
              loading="lazy"
              className="h-40 w-full object-cover"
            />
            <div className="border-t-2 border-accent p-5">
              <h2 className="font-display text-base font-bold text-primary">{tr(d.titulo)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tr(d.texto)}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Academic & Financial Milestone Calendar */}
      <div className="mt-8">
        <AcademicCalendar />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          titulo={tr("Saldos por regularizar")}
          acao={
            <Link to="/pagamentos" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              {tr("Ver todos os pagamentos")}
            </Link>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium">{tr("Estudante")}</th>
                <th className="px-5 py-2.5 font-medium">{tr("Encargo")}</th>
                <th className="px-5 py-2.5 font-medium">{tr("Vencimento")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{tr("Em dívida")}</th>
                <th className="px-5 py-2.5 font-medium">{tr("Estado")}</th>
              </tr>
            </thead>
            <tbody>
              {emAtraso.map((p) => {
                const fee = findFeeInStore(p.feeId);
                const student = findStudentInStore(p.studentId);
                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-medium">{student?.nome || p.studentId}</td>
                    <td className="px-5 py-3 text-muted-foreground">{tr(fee?.designacao ?? "")}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dataPt(fee?.vencimento ?? p.data)}</td>
                    <td className="px-5 py-3 text-right font-medium text-destructive">{mzn(calcFeeDue(p))}</td>
                    <td className="px-5 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel titulo={tr("Cobrança por curso")}>
            <ul className="divide-y divide-border/60">
              {[...new Set(students.map((s) => s.curso))].map((curso) => {
                const ids = students.filter((s) => s.curso === curso).map((s) => s.id);
                const divida = payments
                  .filter((p) => ids.includes(p.studentId))
                  .reduce((a, p) => a + calcFeeDue(p), 0);
                return (
                  <li key={curso} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{tr(curso)}</span>
                    <span className="font-medium">{mzn(divida)}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel titulo={tr("Documentos")}>
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="text-muted-foreground">
                {tr("O plano do sistema e os modelos de papel timbrado estão disponíveis para descarga em PDF.")}
              </p>
              <Link
                to="/documentos"
                className="inline-flex rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {tr("Abrir documentos")}
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
