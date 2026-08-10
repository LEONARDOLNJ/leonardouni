import { useState } from "react";
import { Panel, Shell, StatusBadge } from "@/components/Shell";
import { downloadReceipt } from "@/lib/pdf";
import { useUniStore } from "@/lib/uni-store";
import { dataPt, mzn, type PaymentStatus, type Payment, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { PayInvoiceModal } from "@/components/PayInvoiceModal";
import { SmsNotificationModal } from "@/components/SmsNotificationModal";
import financeImg from "@/assets/finance.jpg";
import { DollarSign, Download, CreditCard, Bell } from "lucide-react";

const FILTROS = ["todos", "pago", "pendente", "vencido"] as const;

export function Pagamentos() {
  const { t } = useI18n();
  const { payments, students, fees } = useUniStore();

  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todos");
  const [selectedPayTarget, setSelectedPayTarget] = useState<{
    student: Student;
    fee: Fee;
    payment: Payment;
    dueAmount: number;
  } | null>(null);

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [targetSmsStudent, setTargetSmsStudent] = useState<Student | undefined>(undefined);

  const lista = payments.filter((p) => filtro === "todos" || p.estado === (filtro as PaymentStatus));

  const findStudentInStore = (studentId: string) => students.find((s) => s.id === studentId);
  const findFeeInStore = (feeId: string) => fees.find((f) => f.id === feeId);

  const calcDue = (p: Payment) => {
    const fee = findFeeInStore(p.feeId);
    return Math.max((fee?.valor ?? 0) - p.valorPago, 0);
  };

  const handleOpenSms = (st?: Student) => {
    setTargetSmsStudent(st);
    setShowSmsModal(true);
  };

  return (
    <Shell
      titulo="Estado dos Pagamentos"
      descricao="Registo de todas as transacções, método de pagamento, liquidação directa e saldo remanescente por encargo."
      imagem={financeImg}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-sm border px-3.5 py-1.5 text-sm capitalize transition ${
                filtro === f
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleOpenSms()}
          className="inline-flex items-center gap-2 rounded-sm bg-accent/20 border border-accent/40 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/30 transition"
        >
          <Bell className="size-3.5" />
          <span>{t("Disparar Lembrete SMS / M-Pesa")}</span>
        </button>
      </div>

      <Panel titulo={`${lista.length} ${t("transacções registadas")}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium">{t("Referência")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Estudante")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Encargo")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Data")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Método")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("Pago")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("Em dívida")}</th>
                <th className="px-5 py-2.5 font-medium">{t("Estado")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("Acção / Recibo")}</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const student = findStudentInStore(p.studentId);
                const fee = findFeeInStore(p.feeId);
                const dueAmount = calcDue(p);

                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-foreground">{p.recibo || p.id}</td>
                    <td className="px-5 py-3 font-medium">
                      {student?.nome || p.studentId}
                      <span className="block text-xs font-mono text-muted-foreground">{p.studentId}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{t(fee?.designacao ?? "")}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dataPt(p.data)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t(p.metodo)}</td>
                    <td className="px-5 py-3 text-right font-medium">{mzn(p.valorPago)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${dueAmount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {mzn(dueAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.estado === "pago" ? (
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="inline-flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition"
                        >
                          <Download className="size-3" />
                          <span>PDF</span>
                        </button>
                      ) : (
                        student && fee && (
                          <button
                            onClick={() =>
                              setSelectedPayTarget({
                                student,
                                fee,
                                payment: p,
                                dueAmount,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-sm bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs transition"
                          >
                            <CreditCard className="size-3" />
                            <span>{t("Pagar Agora")}</span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Embedded Pay Modal if triggered */}
      {selectedPayTarget && (
        <PayInvoiceModal
          student={selectedPayTarget.student}
          fee={selectedPayTarget.fee}
          payment={selectedPayTarget.payment}
          dueAmount={selectedPayTarget.dueAmount}
          onClose={() => setSelectedPayTarget(null)}
        />
      )}

      {/* Embedded SMS Modal if triggered */}
      {showSmsModal && (
        <SmsNotificationModal
          initialStudent={targetSmsStudent}
          onClose={() => {
            setShowSmsModal(false);
            setTargetSmsStudent(undefined);
          }}
        />
      )}
    </Shell>
  );
}
