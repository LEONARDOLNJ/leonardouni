import { Panel, Shell } from "@/components/Shell";
import { downloadReceipt } from "@/lib/pdf";
import { useUniStore } from "@/lib/uni-store";
import { dataPt, mzn } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";

export function Recibos() {
  const { t } = useI18n();
  const { payments, students, fees } = useUniStore();

  const emitidos = payments.filter((p) => p.estado === "pago");

  const findStudentInStore = (id: string) => students.find((s) => s.id === id);
  const findFeeInStore = (id: string) => fees.find((f) => f.id === id);

  return (
    <Shell
      titulo="Recibos"
      descricao="Comprovativos emitidos automaticamente após a liquidação de uma propina ou taxa."
      imagem={studentSupportImg}
    >
      <Panel titulo={`${emitidos.length} ${t("recibos emitidos")}`}>
        <ul className="divide-y divide-border/60">
          {emitidos.map((p) => {
            const student = findStudentInStore(p.studentId);
            const fee = findFeeInStore(p.feeId);

            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-muted/10 transition">
                <div>
                  <p className="font-medium font-mono text-foreground">
                    {p.recibo || p.id} · {student?.nome || p.studentId}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(fee?.designacao ?? "")} · {dataPt(p.data)} · {t(p.metodo)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg font-bold text-success">{mzn(p.valorPago)}</span>
                  <button
                    onClick={() => downloadReceipt(p)}
                    className="rounded-sm bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    {t("Descarregar PDF")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </Shell>
  );
}
