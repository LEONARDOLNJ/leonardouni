import React, { useState } from "react";
import { useUniStore } from "@/lib/uni-store";
import { downloadReceipt } from "@/lib/pdf";
import { mzn, type Method, type Payment, type Fee, type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { useWeb3 } from "@/lib/web3-base";
import { X, CheckCircle2, CreditCard, Smartphone, Building2, Download, ArrowRight, ShieldCheck, Coins, ExternalLink, Zap, Lock, Sparkles } from "lucide-react";
import { DebitoPaySandboxPanel } from "./DebitoPaySandboxPanel";

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
  const { address, payWithBase, signInWithBase, receivingAddress, error: web3Error, balanceEth, balanceUsdc } = useWeb3();

  const [method, setMethod] = useState<Method>("Debito Pay");
  const [payTokenType, setPayTokenType] = useState<"ETH" | "USDC">("ETH");
  const [phoneNumber, setPhoneNumber] = useState("+258 84 ");
  const [cardNumber, setCardNumber] = useState("");
  const [dpoCompanyToken, setDpoCompanyToken] = useState("B3F59BE7-0756-420E-BB88-1D98E7A6B040");
  const [dpoServiceType, setDpoServiceType] = useState("54841");
  const [dpoServiceId, setDpoServiceId] = useState("85325");
  const [dpoEndpoint, setDpoEndpoint] = useState("https://secure.3gdirectpay.com/API/v6/");
  
  // Debito Pay Specific States
  const [debitoCurrency, setDebitoCurrency] = useState<"ZAR" | "MZN" | "USD">("ZAR");
  const [debitoEmail, setDebitoEmail] = useState<string>(student.email || `${student.id.toLowerCase()}@ul.ac.mz`);
  const [debitoReference, setDebitoReference] = useState<string>(`DEBITO-${student.id}-${Date.now().toString().slice(-4)}`);
  const [debitoHostedUrl, setDebitoHostedUrl] = useState<string | null>(null);
  const [debitoPaymentToken, setDebitoPaymentToken] = useState<string | null>(null);
  const [showDebitoTester, setShowDebitoTester] = useState<boolean>(true);

  const [amountToPay, setAmountToPay] = useState<number>(dueAmount);
  const [processing, setProcessing] = useState(false);
  const [stkPushMessage, setStkPushMessage] = useState<string | null>(null);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Phone number operator detection
  const getOperatorName = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.includes("84") || clean.includes("85")) return "Vodacom M-Pesa";
    if (clean.includes("86") || clean.includes("87")) return "Movitel e-Mola";
    if (clean.includes("82") || clean.includes("83")) return "Tmcel mKesh";
    return "Mobile Money Moçambique";
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToPay <= 0 || processing) return;

    setProcessing(true);
    setStkPushMessage(null);
    setPaymentError(null);

    if (method === "Debito Pay") {
      try {
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountToPay,
            currency: debitoCurrency,
            customerEmail: debitoEmail,
            reference: debitoReference,
            studentId: student.id,
            feeTitle: fee.designacao,
            redirectUrl: `${window.location.origin}/pagamentos?status=success&ref=${debitoReference}`,
            cancelUrl: `${window.location.origin}/pagamentos?status=cancel&ref=${debitoReference}`,
          }),
        });

        const checkoutData = await checkoutRes.json();
        console.log("Debito Pay Checkout Response:", checkoutData);

        if (checkoutData.checkout_url) {
          setDebitoHostedUrl(checkoutData.checkout_url);
          setDebitoPaymentToken(checkoutData.payment_token);
        }

        setTimeout(() => {
          let res: { success: boolean; payment?: Payment };
          if (payment) {
            res = processPayment(payment.id, amountToPay, "Debito Pay");
          } else {
            res = payInvoiceDirect(student.id, fee.id, amountToPay, "Debito Pay");
          }
          setProcessing(false);
          if (res.success && res.payment) {
            setCompletedPayment(res.payment);
          }
        }, 1500);
      } catch (err: any) {
        console.error("Debito Pay API Error:", err);
        setProcessing(false);
        setPaymentError(err.message || "Falha ao comunicar com o gateway Debito Pay.");
      }
      return;
    }

    if (method === "Base Pay (USDC)") {
      const baseResult = await payWithBase({
        amountMzn: amountToPay,
        feeTitle: fee.designacao,
        studentId: student.id,
        payTokenType,
      });

      if (baseResult.success) {
        setLastTxHash(baseResult.txHash || null);
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
      } else {
        setProcessing(false);
        setPaymentError(baseResult.error || "Failed to process Base Pay transaction");
      }
      return;
    }

    if (method === "Mobile Money") {
      setStkPushMessage(`📲 Pedido C2B enviado para ${phoneNumber}... À espera da introdução do PIN no telemóvel.`);
      try {
        const mpesaRes = await fetch("/api/payments/m-pesa/c2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber,
            amount: amountToPay,
            reference: `${student.id}-${fee.id}`,
            studentId: student.id,
            feeTitle: fee.designacao,
          }),
        });
        const mpesaData = await mpesaRes.json();
        console.log("M-Pesa API Response:", mpesaData);
      } catch (err) {
        console.error("M-Pesa API Error:", err);
      }

      setTimeout(() => {
        let res: { success: boolean; payment?: Payment };
        if (payment) {
          res = processPayment(payment.id, amountToPay, "Mobile Money");
        } else {
          res = payInvoiceDirect(student.id, fee.id, amountToPay, "Mobile Money");
        }
        setProcessing(false);
        setStkPushMessage(null);
        if (res.success && res.payment) {
          setCompletedPayment(res.payment);
        }
      }, 2000);
      return;
    }

    if (method === "DPO Sandbox Pay") {
      try {
        const cardRes = await fetch("/api/payments/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber: cardNumber || "5436 8862 6984 8367",
            amount: amountToPay,
            studentId: student.id,
            feeTitle: fee.designacao,
            email: `${student.id.toLowerCase()}@universidade.ac.mz`,
            companyToken: dpoCompanyToken,
            serviceType: dpoServiceType,
          }),
        });
        const cardData = await cardRes.json();
        console.log("Dedicated DPO Sandbox Pay API v6 Response:", cardData);
      } catch (err) {
        console.error("DPO Sandbox Pay API Error:", err);
      }

      setTimeout(() => {
        let res: { success: boolean; payment?: Payment };
        if (payment) {
          res = processPayment(payment.id, amountToPay, "DPO Sandbox Pay");
        } else {
          res = payInvoiceDirect(student.id, fee.id, amountToPay, "DPO Sandbox Pay");
        }
        setProcessing(false);
        if (res.success && res.payment) {
          setCompletedPayment(res.payment);
        }
      }, 1500);
      return;
    }

    if (method === "Cartão") {
      const selectEl = document.getElementById("dpo-account-select") as HTMLSelectElement;
      const companyToken = selectEl ? selectEl.value : "B3F59BE7-0756-420E-BB88-1D98E7A6B040";

      try {
        const cardRes = await fetch("/api/payments/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber,
            amount: amountToPay,
            studentId: student.id,
            feeTitle: fee.designacao,
            email: `${student.id.toLowerCase()}@universidade.ac.mz`,
            companyToken,
          }),
        });
        const cardData = await cardRes.json();
        console.log("DPO Pay API v6 Response:", cardData);
      } catch (err) {
        console.error("DPO Pay API Error:", err);
      }

      setTimeout(() => {
        let res: { success: boolean; payment?: Payment };
        if (payment) {
          res = processPayment(payment.id, amountToPay, "Cartão");
        } else {
          res = payInvoiceDirect(student.id, fee.id, amountToPay, "Cartão");
        }
        setProcessing(false);
        if (res.success && res.payment) {
          setCompletedPayment(res.payment);
        }
      }, 1500);
      return;
    }

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
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("Debito Pay")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "Debito Pay"
                        ? "border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold shadow-xs ring-1 ring-purple-500"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Zap className="size-4 text-purple-500" />
                    <span className="text-[11px] font-bold">Debito Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Base Pay (USDC)")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "Base Pay (USDC)"
                        ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Coins className="size-4 text-blue-500" />
                    <span className="text-[11px]">Base Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Mobile Money")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "Mobile Money"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Smartphone className="size-4" />
                    <span className="text-[11px]">M-Pesa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Cartão")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "Cartão"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <CreditCard className="size-4" />
                    <span className="text-[11px]">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("DPO Sandbox Pay")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "DPO Sandbox Pay"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span className="text-[11px]">DPO Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Transferência Bancária")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-sm border p-2 text-center transition cursor-pointer ${
                      method === "Transferência Bancária"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Building2 className="size-4" />
                    <span className="text-[11px]">Banco / NIB</span>
                  </button>
                </div>
              </div>

              {/* Debito Pay Method Specific Fields */}
              {method === "Debito Pay" && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-950/15 p-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <Zap className="size-4 text-purple-400" />
                      <span>Debito Pay Gateway · v1 REST & Hosted Checkout</span>
                    </p>
                    <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                      Endpoint: https://debitopay.com
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                        Moeda do Checkout:
                      </label>
                      <select
                        value={debitoCurrency}
                        onChange={(e) => setDebitoCurrency(e.target.value as "ZAR" | "MZN" | "USD")}
                        className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                      >
                        <option value="ZAR">ZAR (Rand Sul-Africano)</option>
                        <option value="MZN">MZN (Metical Moçambicano)</option>
                        <option value="USD">USD (Dólar Americano)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                        Email do Aluno:
                      </label>
                      <input
                        type="email"
                        value={debitoEmail}
                        onChange={(e) => setDebitoEmail(e.target.value)}
                        className="w-full rounded border border-input bg-card px-2.5 py-1.5 text-xs text-foreground"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                        Referência Debito Pay:
                      </label>
                      <input
                        type="text"
                        value={debitoReference}
                        onChange={(e) => setDebitoReference(e.target.value)}
                        className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded bg-background/60 p-2.5 border border-border/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px]">Valor da Cobrança:</span>
                      <p className="font-bold text-foreground font-mono">
                        {amountToPay.toLocaleString("pt-MZ")} {debitoCurrency}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">
                        Autenticação & Webhook:
                      </span>
                      <span className="text-[10px] font-mono text-purple-400 font-semibold">
                        HMAC-SHA256 & Bearer Auth
                      </span>
                    </div>
                  </div>

                  {debitoHostedUrl && (
                    <div className="rounded border border-purple-500/40 bg-purple-950/30 p-2.5 flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[280px] font-mono text-purple-300">
                        Token: {debitoPaymentToken}
                      </span>
                      <a
                        href={debitoHostedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Abrir Checkout</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}

                  {/* Toggle Sandbox Panel */}
                  <div className="border-t border-purple-500/20 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-muted-foreground text-[11px] flex items-center gap-1">
                        <Sparkles className="size-3.5 text-purple-400" />
                        Painel de Testes Sandbox (Disparar Webhooks & Testar HMAC)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDebitoTester(!showDebitoTester)}
                        className="text-[10px] text-primary hover:underline cursor-pointer"
                      >
                        {showDebitoTester ? "Minimizar" : "Expandir"}
                      </button>
                    </div>

                    {showDebitoTester && (
                      <DebitoPaySandboxPanel
                        initialReference={debitoReference}
                        initialAmount={amountToPay}
                        initialCurrency={debitoCurrency}
                        studentId={student.id}
                        onPaymentSuccess={() => {
                          let res: { success: boolean; payment?: Payment };
                          if (payment) {
                            res = processPayment(payment.id, amountToPay, "Debito Pay");
                          } else {
                            res = payInvoiceDirect(student.id, fee.id, amountToPay, "Debito Pay");
                          }
                          if (res.success && res.payment) {
                            setCompletedPayment(res.payment);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Method specific fields */}
              {method === "DPO Sandbox Pay" && (
                <div className="rounded-sm border border-emerald-500/30 bg-emerald-950/10 p-3.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-500" />
                      <span>DPO Pay Sandbox (API v6) · Credentials & Endpoint</span>
                    </p>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                      Dedicated Tab Active
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                      Seleccionar Conta de Teste DPO (ou editar chaves):
                    </label>
                    <select
                      value={dpoCompanyToken}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDpoCompanyToken(val);
                        if (val === "B3F59BE7-0756-420E-BB88-1D98E7A6B040") { setDpoServiceType("54841"); setDpoServiceId("85325"); }
                        else if (val === "C40E4138-3DF7-4A56-A6D1-375A49407A1C") { setDpoServiceType("54842"); setDpoServiceId("86275"); }
                        else if (val === "8BB9CF9A-6E89-4E78-828F-088D5A000269") { setDpoServiceType("54843"); setDpoServiceId("86277"); }
                        else if (val === "732CDD7C-34B3-4506-ACF6-B03F94FB44C8") { setDpoServiceType("54844"); setDpoServiceId("86278"); }
                        else if (val === "8E0F3AD8-B254-419A-80DF-6D9C280A5130") { setDpoServiceType("54845"); setDpoServiceId("86280"); }
                        else if (val === "8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3") { setDpoServiceType("3854"); setDpoServiceId("5525"); }
                      }}
                      className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-mono text-foreground"
                    >
                      <option value="B3F59BE7-0756-420E-BB88-1D98E7A6B040">Conta 1 · Token: B3F59BE7... (Service: 54841)</option>
                      <option value="C40E4138-3DF7-4A56-A6D1-375A49407A1C">Conta 2 · Token: C40E4138... (Service: 54842)</option>
                      <option value="8BB9CF9A-6E89-4E78-828F-088D5A000269">Conta 3 · Token: 8BB9CF9A... (Service: 54843)</option>
                      <option value="732CDD7C-34B3-4506-ACF6-B03F94FB44C8">Conta 4 · Token: 732CDD7C... (Service: 54844)</option>
                      <option value="8E0F3AD8-B254-419A-80DF-6D9C280A5130">Conta 5 · Token: 8E0F3AD8... (Service: 54845)</option>
                      <option value="8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3">Conta 6 · Token: 8D3DA73D... (Service: 3854)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">DPO Company Token:</label>
                      <input
                        type="text"
                        value={dpoCompanyToken}
                        onChange={(e) => setDpoCompanyToken(e.target.value)}
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">API v6 Base URL:</label>
                      <input
                        type="text"
                        value={dpoEndpoint}
                        onChange={(e) => setDpoEndpoint(e.target.value)}
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-[11px] text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">Service Type ID:</label>
                      <input
                        type="text"
                        value={dpoServiceType}
                        onChange={(e) => setDpoServiceType(e.target.value)}
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">Service Service ID:</label>
                      <input
                        type="text"
                        value={dpoServiceId}
                        onChange={(e) => setDpoServiceId(e.target.value)}
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                      Cartão de Teste DPO Sandbox:
                    </label>
                    <div className="flex gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => setCardNumber("5436 8862 6984 8367")}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Mastercard
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardNumber("4012 8888 8888 1881")}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Visa
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardNumber("3456 7890 1234 564")}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Amex
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="5436 8862 6984 8367"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-sm border border-input bg-card px-3 py-1.5 font-mono text-xs text-foreground"
                      required
                    />
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    🔗 Endpoint <code className="font-mono text-emerald-500">{dpoEndpoint}</code> com tokenização DPO API v6 e persistência automática no histórico do utilizador.
                  </p>
                </div>
              )}

              {/* Method specific fields */}
              {method === "Base Pay (USDC)" && (
                <div className="rounded-sm border border-blue-500/30 bg-blue-950/20 p-3.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-blue-400">
                      <Coins className="size-4" />
                      <span>{t("Base Blockchain Pay (Base Sepolia)")}</span>
                    </div>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                      Base Sepolia (84532)
                    </span>
                  </div>

                  <div className="rounded border border-blue-500/20 bg-background/60 p-2.5 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("Valor MZN")}:</span>
                      <span className="font-bold text-foreground">{mzn(amountToPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("Equivalente USD/USDC")}:</span>
                      <span className="font-bold text-blue-400">
                        ~${(amountToPay / 63.8).toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1 text-[10px]">
                      <span className="text-muted-foreground">{t("Endereço de Destino")}:</span>
                      <span className="font-bold text-amber-300 truncate max-w-[200px]" title={receivingAddress}>
                        {receivingAddress.slice(0, 10)}...{receivingAddress.slice(-6)}
                      </span>
                    </div>
                  </div>

                  {/* Token selector: ETH vs USDC */}
                  <div className="flex items-center justify-between rounded bg-muted/40 p-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Token de Pagamento:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPayTokenType("ETH")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                          payTokenType === "ETH"
                            ? "bg-blue-600 text-white"
                            : "bg-background text-muted-foreground border border-border"
                        }`}
                      >
                        ETH (Base Sepolia)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayTokenType("USDC")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                          payTokenType === "USDC"
                            ? "bg-blue-600 text-white"
                            : "bg-background text-muted-foreground border border-border"
                        }`}
                      >
                        USDC (Base Sepolia)
                      </button>
                    </div>
                  </div>

                  {!address ? (
                    <div className="flex items-center justify-between gap-2 rounded bg-amber-500/10 border border-amber-500/30 p-2.5 text-amber-200">
                      <span className="text-[11px]">{t("Conecte a sua Base Account ou Wallet primeiro.")}</span>
                      <button
                        type="button"
                        onClick={() => signInWithBase()}
                        className="rounded bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500 shrink-0"
                      >
                        Sign in with Base
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        Saldo: {balanceEth} ETH / ${balanceUsdc} USDC
                      </span>
                    </div>
                  )}

                  {paymentError && (
                    <div className="rounded bg-red-500/10 border border-red-500/30 p-2 text-[11px] font-semibold text-red-300">
                      ⚠️ {paymentError}
                    </div>
                  )}
                </div>
              )}

              {method === "Mobile Money" && (
                <div className="rounded-sm border border-border bg-background p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {t("M-Pesa C2B / e-Mola / mKesh")}
                    </p>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                      {getOperatorName(phoneNumber)}
                    </span>
                  </div>
                  <label className="block text-muted-foreground">
                    {t("Número de Telefone Moçambique (+258)")}:
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("O gateway enviará uma notificação C2B directamente ao seu telemóvel para autorização com o código PIN M-Pesa.")}
                  </p>

                  {stkPushMessage && (
                    <div className="mt-2 rounded bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-700 dark:text-amber-300 font-semibold animate-pulse">
                      {stkPushMessage}
                    </div>
                  )}
                </div>
              )}

              {method === "Cartão" && (
                <div className="rounded-sm border border-border bg-background p-3.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="size-4 text-blue-500" />
                      <span>DPO Pay Sandbox (API v6 - Cartões)</span>
                    </p>
                    <span className="rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">
                      Test Mode Active
                    </span>
                  </div>

                  {/* Account Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                      Conta de Teste DPO (Company Token):
                    </label>
                    <select
                      id="dpo-account-select"
                      defaultValue="B3F59BE7-0756-420E-BB88-1D98E7A6B040"
                      className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-mono text-foreground"
                    >
                      <option value="B3F59BE7-0756-420E-BB88-1D98E7A6B040">Conta 1 (Token: B3F59BE7... | Service 54841)</option>
                      <option value="C40E4138-3DF7-4A56-A6D1-375A49407A1C">Conta 2 (Token: C40E4138... | Service 54842)</option>
                      <option value="8BB9CF9A-6E89-4E78-828F-088D5A000269">Conta 3 (Token: 8BB9CF9A... | Service 54843)</option>
                      <option value="732CDD7C-34B3-4506-ACF6-B03F94FB44C8">Conta 4 (Token: 732CDD7C... | Service 54844)</option>
                      <option value="8E0F3AD8-B254-419A-80DF-6D9C280A5130">Conta 5 (Token: 8E0F3AD8... | Service 54845)</option>
                      <option value="8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3">Conta 6 (Token: 8D3DA73D... | Service 3854)</option>
                    </select>
                  </div>

                  {/* Quick test card buttons */}
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground mb-1">
                      ⚡ Preenchimento Rápido com Cartões de Teste DPO:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber("5436 8862 6984 8367");
                        }}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Card 1 (Mastercard)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber("4012 8888 8888 1881");
                        }}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Card 2 (Visa)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber("3456 7890 1234 564");
                        }}
                        className="rounded bg-muted px-2 py-1 text-[10px] font-mono hover:bg-muted/80 text-foreground border border-border"
                      >
                        Card 3 (Amex)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Número do Cartão:
                    </label>
                    <input
                      type="text"
                      placeholder="5436 8862 6984 8367"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-xs text-foreground"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-0.5">Validade (MM/AA):</label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        placeholder="12/28"
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-0.5">CVV (Código):</label>
                      <input
                        type="password"
                        defaultValue="123"
                        placeholder="123"
                        maxLength={4}
                        className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    🔗 Os pagamentos utilizam o endpoint seguro <code className="font-mono text-blue-500">https://secure.3gdirectpay.com/API/v6/</code> com simulação sandbox 3D Secure.
                  </p>
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
              {completedPayment.metodo === "Base Pay (USDC)" && (
                <div className="mt-2 rounded bg-blue-500/10 border border-blue-500/30 p-2.5 text-[11px] space-y-1 font-mono">
                  <div className="flex items-center justify-between text-blue-400 font-bold">
                    <span>Base Sepolia Blockchain Proof</span>
                    <Coins className="size-3.5" />
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1">
                    <p className="text-muted-foreground">
                      Recebedor: <span className="text-amber-300 font-bold">{receivingAddress}</span>
                    </p>
                    <p className="text-muted-foreground break-all">
                      Hash: <span className="text-blue-300">{lastTxHash || "0x14a34..."}</span>
                    </p>
                  </div>
                  <a
                    href={lastTxHash ? `https://sepolia.basescan.org/tx/${lastTxHash}` : "https://sepolia.basescan.org"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline font-bold text-[10px] mt-1"
                  >
                    <span>Verificar no BaseScan Sepolia</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
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
