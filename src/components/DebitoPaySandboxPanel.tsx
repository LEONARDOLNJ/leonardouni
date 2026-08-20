import React, { useState, useEffect } from "react";
import { ShieldCheck, Zap, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Copy, Terminal, Send, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface WebhookLog {
  id: string;
  event: string;
  reference: string;
  verified: boolean;
  signature: string;
  payload: any;
  timestamp: string;
}

interface DebitoPaySandboxPanelProps {
  initialReference?: string;
  initialAmount?: number;
  initialCurrency?: string;
  studentId?: string;
  onPaymentSuccess?: () => void;
}

export function DebitoPaySandboxPanel({
  initialReference,
  initialAmount = 2500,
  initialCurrency = "ZAR",
  studentId = "EST-2024-001",
  onPaymentSuccess,
}: DebitoPaySandboxPanelProps) {
  const { t } = useI18n();
  const [testAmount, setTestAmount] = useState<number>(initialAmount);
  const [testCurrency, setTestCurrency] = useState<string>(initialCurrency);
  const [testReference, setTestReference] = useState<string>(
    initialReference || `DEBITO-TEST-${Date.now().toString().slice(-6)}`
  );
  const [simulating, setSimulating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [activeTab, setActiveTab] = useState<"quick" | "inspector" | "logs">("quick");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/webhooks/debitopay/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.warn("Failed to fetch webhook logs:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const runSimulation = async (
    eventType: "payment.success" | "payment.failed" | "payment.pending",
    invalidSignature: boolean = false
  ) => {
    setSimulating(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/webhooks/debitopay/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventType,
          reference: testReference,
          amount: testAmount,
          currency: testCurrency,
          studentId,
          invalidSignature,
        }),
      });

      const data = await res.json();
      setLastResult({
        status: res.status,
        ok: res.ok,
        data,
      });

      await fetchLogs();

      if (res.ok && eventType === "payment.success" && !invalidSignature) {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (err: any) {
      setLastResult({
        status: 500,
        ok: false,
        data: { error: err.message || "Erro de conexão ao simular webhook." },
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-4 text-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>Debito Pay Sandbox Testing Panel</span>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-mono text-purple-400">
                v1 REST & HMAC
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Simulação de eventos assíncronos e validação de assinatura HMAC-SHA256
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
              activeTab === "quick"
                ? "bg-purple-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Simulador Rápido
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("logs");
              fetchLogs();
            }}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "logs"
                ? "bg-purple-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Histórico Webhooks</span>
            {logs.length > 0 && (
              <span className="rounded-full bg-purple-400/20 px-1.5 text-[9px] font-bold">
                {logs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "quick" && (
        <div className="space-y-3">
          {/* Gateway Credentials Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded bg-muted/40 border border-border text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px]">Merchant ID:</span>
              <code className="font-mono font-semibold text-foreground">debito_merch_sandbox_mz_2026</code>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">API Sandbox Base URL:</span>
              <code className="font-mono text-purple-500">https://debitopay.com</code>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Webhook Listener:</span>
              <code className="font-mono text-emerald-500">POST /api/webhooks/debitopay</code>
            </div>
          </div>

          {/* Test parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                Referência da Sessão:
              </label>
              <input
                type="text"
                value={testReference}
                onChange={(e) => setTestReference(e.target.value)}
                className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                Valor do Teste:
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                Moeda:
              </label>
              <select
                value={testCurrency}
                onChange={(e) => setTestCurrency(e.target.value)}
                className="w-full rounded border border-input bg-card px-2.5 py-1.5 text-xs text-foreground font-mono"
              >
                <option value="ZAR">ZAR - Rand Sul-Africano</option>
                <option value="MZN">MZN - Metical Moçambicano</option>
                <option value="USD">USD - Dólar Americano</option>
              </select>
            </div>
          </div>

          {/* Simulation Trigger Buttons */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">
              Disparar Eventos Webhook com Assinatura HMAC-SHA256:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={simulating}
                onClick={() => runSimulation("payment.success", false)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {simulating ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>Simular Sucesso (200 OK)</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={() => runSimulation("payment.failed", false)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {simulating ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="size-3.5" />
                )}
                <span>Simular Falha de Pagamento</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={() => runSimulation("payment.success", true)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {simulating ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Lock className="size-3.5" />
                )}
                <span>Testar Assinatura Adulterada (401)</span>
              </button>
            </div>
          </div>

          {/* Last Simulation Result View */}
          {lastResult && (
            <div
              className={`rounded-md p-3 border text-[11px] font-mono space-y-2 ${
                lastResult.ok
                  ? "bg-emerald-950/20 border-emerald-500/30 text-foreground"
                  : "bg-rose-950/20 border-rose-500/30 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold flex items-center gap-1.5">
                  {lastResult.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                  <span>
                    Status HTTP: <strong>{lastResult.status}</strong> {lastResult.ok ? "OK" : "Unauthorized"}
                  </span>
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    lastResult.data?.signatureValid
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  HMAC: {lastResult.data?.signatureValid ? "VÁLIDA (SHA256 Match)" : "REJEITADA (Mismatch)"}
                </span>
              </div>

              <div className="space-y-1 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span>Assinatura Usada:</span>
                  <span className="truncate max-w-[220px] text-foreground font-mono">
                    {lastResult.data?.signatureUsed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assinatura Esperada:</span>
                  <span className="truncate max-w-[220px] text-foreground font-mono">
                    {lastResult.data?.expectedSignature}
                  </span>
                </div>
              </div>

              <div className="bg-background/80 p-2 rounded text-[10px] max-h-28 overflow-y-auto">
                <pre>{JSON.stringify(lastResult.data?.webhookResponse || lastResult.data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground">
              Eventos Recebidos por <code className="text-purple-400 font-mono">/api/webhooks/debitopay</code>:
            </span>
            <button
              type="button"
              onClick={fetchLogs}
              className="text-[10px] text-primary flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="size-3" />
              <span>Actualizar</span>
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground italic text-[11px]">
              Nenhum webhook recebido nesta sessão. Dispare uma simulação acima.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded border border-border bg-card p-2.5 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-bold flex items-center gap-1.5">
                      {log.verified ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="size-3.5 text-rose-500" />
                      )}
                      <span className="font-mono text-xs text-foreground">{log.event}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Ref: {log.reference}</span>
                    <span
                      className={`px-1.5 rounded text-[9px] ${
                        log.verified
                          ? "bg-emerald-500/10 text-emerald-400 font-bold"
                          : "bg-rose-500/10 text-rose-400 font-bold"
                      }`}
                    >
                      {log.verified ? "HMAC Validada" : "HMAC Inválida"}
                    </span>
                  </div>

                  <div className="bg-muted/40 p-1.5 rounded text-[10px] font-mono text-muted-foreground truncate">
                    <code>Sig: {log.signature}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
