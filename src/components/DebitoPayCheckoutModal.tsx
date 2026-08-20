import React, { useState } from "react";
import { X, ShieldCheck, ArrowRight, ExternalLink, RefreshCw, CheckCircle2, Lock, Sparkles, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUniStore } from "@/lib/uni-store";
import { mzn, type Fee, type Student, type Payment } from "@/lib/uni-data";
import { DebitoPaySandboxPanel } from "./DebitoPaySandboxPanel";

interface DebitoPayCheckoutModalProps {
  student: Student;
  fee?: Fee;
  payment?: Payment;
  defaultAmount?: number;
  onClose: () => void;
  onSuccess?: (payment: Payment) => void;
}

export function DebitoPayCheckoutModal({
  student,
  fee,
  payment,
  defaultAmount = 2500,
  onClose,
  onSuccess,
}: DebitoPayCheckoutModalProps) {
  const { t } = useI18n();
  const { processPayment, payInvoiceDirect } = useUniStore();

  const [amount, setAmount] = useState<number>(defaultAmount);
  const [currency, setCurrency] = useState<"ZAR" | "MZN" | "USD">("ZAR");
  const [customerEmail, setCustomerEmail] = useState<string>(student.email || `${student.id.toLowerCase()}@ul.ac.mz`);
  const [reference, setReference] = useState<string>(`DEBITO-${student.id}-${Date.now().toString().slice(-4)}`);
  
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSandboxPanel, setShowSandboxPanel] = useState<boolean>(true);

  // Conversion rate estimations for display
  const getExchangeNote = () => {
    if (currency === "ZAR") {
      const approxMzn = (amount * 3.45).toFixed(2);
      return `≈ ${approxMzn} MZN (Taxa de Câmbio de Referência Debito Pay: 1 ZAR ≈ 3.45 MZN)`;
    }
    if (currency === "USD") {
      const approxMzn = (amount * 63.8).toFixed(2);
      return `≈ ${approxMzn} MZN (1 USD ≈ 63.80 MZN)`;
    }
    return `Moeda directa: Metical Moçambicano (MZN)`;
  };

  const handleInitializeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // POST to backend checkout endpoint
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          customerEmail,
          reference,
          studentId: student.id,
          feeTitle: fee?.designacao || "Propina Leonardo University",
          redirectUrl: `${window.location.origin}/pagamentos?status=success&ref=${reference}`,
          cancelUrl: `${window.location.origin}/pagamentos?status=cancel&ref=${reference}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Não foi possível iniciar a sessão com o Debito Pay.");
      }

      setCheckoutUrl(data.checkout_url);
      setPaymentToken(data.payment_token);
      setSessionId(data.session_id);
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMsg(err.message || "Erro de conexão ao Debito Pay.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSimulation = () => {
    setCompleted(true);
    let res: { success: boolean; payment?: Payment };
    if (payment) {
      res = processPayment(payment.id, amount, "Debito Pay");
    } else if (fee) {
      res = payInvoiceDirect(student.id, fee.id, amount, "Debito Pay");
    } else {
      res = { success: true };
    }

    if (res.payment && onSuccess) {
      onSuccess(res.payment);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl text-foreground my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Debito Pay Gateway</span>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                  v1 REST API
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Pagamento seguro e liquidação automatizada via Debito Pay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Invoice Summary Banner */}
          <div className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Propina / Taxa a liquidar:</span>
              <p className="font-bold text-foreground text-sm">
                {fee?.designacao || "Propina Leonardo University"}
              </p>
              <span className="text-xs text-muted-foreground">
                Estudante: {student.nome} ({student.id})
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Valor Selecionado:</span>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                {amount.toLocaleString("pt-MZ")} {currency}
              </p>
              <span className="text-[10px] text-muted-foreground block">{getExchangeNote()}</span>
            </div>
          </div>

          {!checkoutUrl && !completed ? (
            /* Checkout Form */
            <form onSubmit={handleInitializeCheckout} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Valor a Pagar:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-semibold font-mono text-foreground focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Moeda do Gateway:
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as "ZAR" | "MZN" | "USD")}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground focus:border-purple-500 focus:outline-none"
                  >
                    <option value="ZAR">ZAR - Rand Sul-Africano (Nativo)</option>
                    <option value="MZN">MZN - Metical Moçambicano</option>
                    <option value="USD">USD - Dólar Americano</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Email do Pagador:
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Referência da Transacção:
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs font-mono text-foreground focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-md border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-sm transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Inicializando Sessão no Debito Pay...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      <span>Pagar Agora com Debito Pay ({amount.toLocaleString("pt-MZ")} {currency})</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-muted-foreground">
                🔒 Autenticação Bearer REST com Merchant ID e Webhook HMAC-SHA256
              </p>
            </form>
          ) : checkoutUrl && !completed ? (
            /* Hosted Checkout Active State */
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-5 space-y-4 text-center">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 mb-1">
                <ShieldCheck className="size-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Sessão de Checkout Criada com Sucesso!
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                A sessão de pagamento Debito Pay está ativa na Sandbox. Pode abrir a página de checkout hospedada ou simular a confirmação imediata do Webhook.
              </p>

              <div className="rounded-lg bg-card p-3 border border-border text-left font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Sessão:</span>
                  <span className="text-foreground">{sessionId}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Token de Pagamento:</span>
                  <span className="text-foreground truncate max-w-[200px]">{paymentToken}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Hosted Checkout URL:</span>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline flex items-center gap-1 truncate max-w-[220px]"
                  >
                    <span>{checkoutUrl}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 text-xs transition cursor-pointer"
                >
                  <ExternalLink className="size-4" />
                  <span>Abrir Debito Pay Hosted Checkout</span>
                </a>

                <button
                  type="button"
                  onClick={handleCompleteSimulation}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Aprovar Pagamento na Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            /* Completed State */
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center space-y-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Pagamento Debito Pay Liquidado com Sucesso!
              </h4>
              <p className="text-xs text-muted-foreground">
                A transacção foi confirmada, assinada via HMAC e gravada no histórico de pagamentos do estudante.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2 text-xs transition cursor-pointer"
              >
                Fechar e Ver Recibo
              </button>
            </div>
          )}

          {/* Collapsible Sandbox Testing Panel */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-purple-400" />
                Painel de Testes do Gateway Debito Pay
              </span>
              <button
                type="button"
                onClick={() => setShowSandboxPanel(!showSandboxPanel)}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {showSandboxPanel ? "Ocultar Painel" : "Mostrar Painel"}
              </button>
            </div>

            {showSandboxPanel && (
              <DebitoPaySandboxPanel
                initialReference={reference}
                initialAmount={amount}
                initialCurrency={currency}
                studentId={student.id}
                onPaymentSuccess={handleCompleteSimulation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
