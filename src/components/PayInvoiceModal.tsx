import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { downloadReceipt } from "@/lib/pdf";
import { mzn, type Method, type Payment, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, CheckCircle2, CreditCard, Smartphone, Building2, Download, ArrowRight, ShieldCheck } from "lucide-react";

interface PayInvoiceModalProps {
  student: Student;
  fee: Fee;
  payment?: Payment;
  dueAmount: number;
  onClose: () => void;
}

export function PayInvoiceModal({ student, fee, payment, dueAmount, onClose }: PayInvoiceModalProps) {
  const { t } = useI18n();
  const { processPayment, payInvoiceDirect } = useUniStore();

  const [method, setMethod] = useState<Method>("Mobile Money");
  const [phoneNumber, setPhoneNumber] = useState("+258 84 ");
  const [cardNumber, setCardNumber] = useState("");
  const [amountToPay, setAmountToPay] = useState<number>(dueAmount);
  const [processing, setProcessing] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToPay <= 0 || processing) return;

    setProcessing(true);

    setTimeout(() => {
      let res: { success: boolean; payment?: Payment };

      if (payment) {
        res = processPayment(payment.id, amountToPay, method);
      } else {
        res = payInvoiceDirect(student.id, fee.id, amountToPay, method);
      }

      setProcessing(false);
      if (res.success && res.payment) {
        setCompletedPayment(res.payment);
      }
    }, 800);
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

        {!completedPayment ? (
          <div>
            <div className="border-b border-border pb-4">
              <div className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                <ShieldCheck className="size-3.5" />
                <span>{t("Portal de Pagamentos Seguros UPM")}</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-foreground">
                {t("Liquidação de Propinas & Taxas")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {student.nome} ({student.id}) · {t(student.curso)}
              </p>
            </div>

            {/* Fee Summary Box */}
            <div className="my-4 rounded-sm border border-border bg-muted/40 p-4 text-sm space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">{t("Encargo")}:</span>
                <span className="text-foreground">{t(fee.designacao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Valor total do encargo")}:</span>
                <span className="font-semibold">{mzn(fee.valor)}</span>
              </div>
              <div className="flex justify-between text-xs text-destructive">
                <span>{t("Saldo remanescente em dívida")}:</span>
                <span className="font-bold">{mzn(dueAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-4 text-sm">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Valor a Pagar (MZN)")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    max={dueAmount}
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(Number(e.target.value))}
                    className="w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-base font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmountToPay(dueAmount)}
                    className="absolute right-2 top-2 text-xs font-semibold text-primary hover:underline"
                  >
                    {t("Pagar Total")}
                  </button>
                </div>
              </div>

              {/* Method Selection Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t("Selecione o Método de Pagamento")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("Mobile Money")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-3 text-center transition ${
                      method === "Mobile Money"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Smartphone className="size-5" />
                    <span className="text-xs">Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Cartão")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-3 text-center transition ${
                      method === "Cartão"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <CreditCard className="size-5" />
                    <span className="text-xs">Cartão Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Transferência Bancária")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-3 text-center transition ${
                      method === "Transferência Bancária"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Building2 className="size-5" />
                    <span className="text-xs">Banco / NIB</span>
                  </button>
                </div>
              </div>

              {/* Method specific fields */}
              {method === "Mobile Money" && (
                <div className="rounded-sm border border-border bg-background p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">
                    {t("M-Pesa / e-Mola / mKesh (Moçambique)")}
                  </p>
                  <label className="block text-muted-foreground">
                    {t("Número de Telefone para confirmação PIN")}:
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full rounded-sm border border-input bg-card px-3 py-1.5 font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("Receberá uma notificação no telemóvel para autorizar com o seu código PIN.")}
                  </p>
                </div>
              )}

              {method === "Cartão" && (
                <div className="rounded-sm border border-border bg-background p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">{t("Cartão Visa / Mastercard / SIMO")}</p>
                  <input
                    type="text"
                    placeholder="Número do Cartão (4532 **** **** 1234)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-sm border border-input bg-card px-3 py-1.5 font-mono text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="rounded-sm border border-input bg-card px-3 py-1.5 font-mono text-sm"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      maxLength={4}
                      className="rounded-sm border border-input bg-card px-3 py-1.5 font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {method === "Transferência Bancária" && (
                <div className="rounded-sm border border-border bg-background p-3 space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground">{t("Coordenadas Bancárias UPM")}</p>
                  <p className="text-muted-foreground">
                    Banco: <strong className="text-foreground">Millennium BIM</strong>
                  </p>
                  <p className="text-muted-foreground">
                    NIB: <strong className="font-mono text-foreground">0001 0000 0012 3456 7891 2</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Referência: <strong className="font-mono text-foreground">{student.id}</strong>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || amountToPay <= 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer mt-2"
              >
                {processing ? (
                  <span>{t("A processar liquidação...")}</span>
                ) : (
                  <>
                    <span>
                      {t("Confirmar & Pagar")} {mzn(amountToPay)}
                    </span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Payment Success View */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {t("Pagamento Efectuado com Sucesso!")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("A sua propina/taxa foi liquidada e o comprovativo já foi emitido.")}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-muted/40 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Recibo Nº")}:</span>
                <span className="font-bold font-mono text-foreground">{completedPayment.recibo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Estudante")}:</span>
                <span className="font-medium text-foreground">{student.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Valor Pago")}:</span>
                <span className="font-bold text-success">{mzn(completedPayment.valorPago)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Método")}:</span>
                <span className="font-medium text-foreground">{completedPayment.metodo}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => downloadReceipt(completedPayment)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Download className="size-4" />
                <span>{t("Descarregar Recibo PDF")}</span>
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-sm border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {t("Concluído")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
