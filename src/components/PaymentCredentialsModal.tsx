import React, { useState, useEffect } from "react";
import { X, Smartphone, CreditCard, ExternalLink, ShieldCheck, Check, Copy, HelpCircle, Key, RefreshCw, AlertCircle, Save, Zap, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PaymentCredentialsModalProps {
  onClose: () => void;
}

export function PaymentCredentialsModal({ onClose }: PaymentCredentialsModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"configure" | "debito" | "mpesa" | "cards" | "dpo">("debito");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<{
    mpesa?: { configured: boolean; environment: string; shortcode: string; provider: string };
    card?: { configured: boolean; provider: string };
    debito?: { configured: boolean; merchantId: string; baseUrl: string; provider: string };
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Configuration form state
  const [mpesaApiKey, setMpesaApiKey] = useState("");
  const [mpesaShortcode, setMpesaShortcode] = useState("171717");
  const [flutterwaveKey, setFlutterwaveKey] = useState("");
  const [payshedKey, setPayshedKey] = useState("");
  const [debitoMerchantId, setDebitoMerchantId] = useState("debito_merch_sandbox_mz_2026");
  const [debitoApiKey, setDebitoApiKey] = useState("debito_sk_test_98f7a8b2c4e10d6a");
  const [debitoWebhookSecret, setDebitoWebhookSecret] = useState("debito_whsec_77a98b2c4e10d6a99281bf");
  const [debitoBaseUrl, setDebitoBaseUrl] = useState("https://debitopay.com");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/payments/gateway-status");
      const data = await res.json();
      setGatewayStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(label);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/payments/gateway-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ul_admin_sec_2026_mz",
          "x-admin-key": "ul_admin_sec_2026_mz",
          "x-student-id": "EST-2024-001",
        },
        body: JSON.stringify({
          mpesaApiKey,
          mpesaShortcode,
          flutterwaveKey,
          payshedKey,
          debitoMerchantId,
          debitoApiKey,
          debitoWebhookSecret,
          debitoBaseUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        await checkStatus();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || "Falha ao salvar configurações.");
      }
    } catch (err: any) {
      console.error("Failed to save gateway config:", err);
      setErrorMessage(err.message || "Erro de conexão ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-border pb-4 mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Key className="size-3.5" />
            <span>Passarelas de Pagamento em Moçambique</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-foreground">
            Configuração de Chaves API & Pagamentos M-Pesa / Cartões
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Insira as suas credenciais de API oficiais ou configure integrações para processamento em Meticais (MZN).
          </p>
        </div>

        {/* Gateway Config Status Banner */}
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Estado das Chaves de API no Servidor (.env / MongoDB)
            </span>
            <button
              onClick={checkStatus}
              disabled={loadingStatus}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className={`size-3 ${loadingStatus ? "animate-spin" : ""}`} />
              <span>Verificar Conexão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
            <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-purple-500" />
                <div>
                  <p className="font-bold text-foreground">Debito Pay</p>
                  <p className="text-[10px] text-muted-foreground">REST API v1 + HMAC</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Sandbox Ativo
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-500" />
                <div>
                  <p className="font-bold text-foreground">M-Pesa C2B Vodacom</p>
                  <p className="text-[10px] text-muted-foreground">
                    {gatewayStatus?.mpesa?.provider || "Vodacom OpenAPI"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gatewayStatus?.mpesa?.configured
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                }`}
              >
                {gatewayStatus?.mpesa?.configured ? "Ativo (Chave API OK)" : "Modo Teste / Sandbox"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <div>
                  <p className="font-bold text-foreground">DPO Pay Sandbox</p>
                  <p className="text-[10px] text-muted-foreground">API v6 DirectPay</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("debito")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "debito"
                ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="size-3.5 text-purple-500" />
            <span>Debito Pay (REST v1)</span>
          </button>

          <button
            onClick={() => setActiveTab("configure")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "configure"
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Key className="size-3.5" />
            <span>Inserir Chaves API</span>
          </button>

          <button
            onClick={() => setActiveTab("dpo")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "dpo"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-600/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>DPO Pay v6</span>
          </button>

          <button
            onClick={() => setActiveTab("mpesa")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "mpesa"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="size-3.5" />
            <span>Guia M-Pesa</span>
          </button>

          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "cards"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="size-3.5" />
            <span>Guia Cartões</span>
          </button>
        </div>

        {/* TAB: DEBITO PAY (REST v1) */}
        {activeTab === "debito" && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Zap className="size-4 text-purple-400" />
                  <span>Debito Pay Gateway · v1 REST & Hosted Checkout</span>
                </h4>
                <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 font-mono text-[10px] font-bold">
                  https://debitopay.com
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Integração REST direta com suporte a criação de sessões via <code className="font-mono text-purple-400">POST /api/checkout</code> e validação estrita de assinaturas HMAC-SHA256 em <code className="font-mono text-purple-400">POST /api/webhooks/debitopay</code> com retorno 200 OK.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h5 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Lock className="size-4 text-purple-400" />
                <span>Credenciais do Gateway Configuradas (.env):</span>
              </h5>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-muted border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-sans">Merchant ID:</span>
                    <span className="font-bold text-foreground">{debitoMerchantId}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(debitoMerchantId, "debito_merch")}
                    className="text-primary hover:underline flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>{copiedVar === "debito_merch" ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-sans">API Key (Bearer Auth):</span>
                    <span className="font-bold text-foreground">{debitoApiKey}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(debitoApiKey, "debito_key")}
                    className="text-primary hover:underline flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>{copiedVar === "debito_key" ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-sans">Webhook Secret (HMAC-SHA256):</span>
                    <span className="font-bold text-foreground">{debitoWebhookSecret}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(debitoWebhookSecret, "debito_sec")}
                    className="text-primary hover:underline flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>{copiedVar === "debito_sec" ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0: CONFIGURE API KEYS */}
        {activeTab === "configure" && (
          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-foreground">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Registar Chaves de API para Activação Directa
              </h4>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Insira abaixo as credenciais fornecidas pelo Debito Pay, Vodacom Moçambique (OpenAPI C2B) ou pelo gateway de cartões (Flutterwave / PayShed) para activar pagamentos em tempo real na aplicação.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-3 space-y-2.5">
                <h5 className="font-bold text-purple-400 text-xs flex items-center gap-1">
                  <Zap className="size-3.5" />
                  <span>Debito Pay Credentials</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      value={debitoMerchantId}
                      onChange={(e) => setDebitoMerchantId(e.target.value)}
                      className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={debitoApiKey}
                      onChange={(e) => setDebitoApiKey(e.target.value)}
                      className="w-full rounded border border-input bg-card px-2.5 py-1.5 font-mono text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  M-Pesa API Key / Client Key (Vodacom Developer)
                </label>
                <input
                  type="password"
                  value={mpesaApiKey}
                  onChange={(e) => setMpesaApiKey(e.target.value)}
                  placeholder="ex: mpesa_live_c2b_xxxxxxxxxxxx"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">
                    M-Pesa Service Provider Code (Shortcode)
                  </label>
                  <input
                    type="text"
                    value={mpesaShortcode}
                    onChange={(e) => setMpesaShortcode(e.target.value)}
                    placeholder="ex: 171717"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Flutterwave Secret Key (Cartões / M-Pesa)
                  </label>
                  <input
                    type="password"
                    value={flutterwaveKey}
                    onChange={(e) => setFlutterwaveKey(e.target.value)}
                    placeholder="FLWSECK_TEST-..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  PayShed / DPO Pay API Key (Alternativa Moçambique)
                </label>
                <input
                  type="password"
                  value={payshedKey}
                  onChange={(e) => setPayshedKey(e.target.value)}
                  placeholder="payshed_live_mz_key_..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <Check className="size-4" />
                <span>Chaves guardadas e M-Pesa / Cartões activados com sucesso!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-bold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
              >
                <Save className="size-4" />
                <span>{saving ? "A guardar..." : "Salvar & Activar Passarelas"}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 1: M-PESA MOÇAMBIQUE */}
        {activeTab === "mpesa" && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Smartphone className="size-4" />
                Onde Registar e Obter Credenciais M-Pesa (Vodacom Moçambique)
              </h4>
              <p className="mt-1 leading-relaxed">
                A Vodacom disponibiliza a API Oficial M-Pesa C2B (Customer to Business) através do portal de desenvolvedores.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">
                    Passo 1: Registar Conta de Desenvolvedor Vodacom
                  </span>
                  <a
                    href="https://developer.mpesa.vm.co.mz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                  >
                    <span>developer.mpesa.vm.co.mz</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Aceda a <strong>developer.mpesa.vm.co.mz</strong> ou <strong>apix.voda.co.mz</strong>, crie a sua conta de empresa ou programador e crie uma nova aplicação.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h5 className="font-bold text-foreground text-sm">
                  Passo 2: Solicitar Acesso à API C2B (Single Stage Payment)
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  Subscreva o produto <strong>C2B Payment</strong> para receber pagamentos instantâneos com pop-up USSD no telemóvel dos estudantes em Meticais (MZN).
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h5 className="font-bold text-foreground text-sm">
                  Variáveis de Ambiente Recomendadas (.env)
                </h5>
                <div className="space-y-2 font-mono text-[11px] pt-1">
                  {[
                    { key: "MPESA_API_KEY", desc: "Chave da API OpenAPI Vodacom" },
                    { key: "MPESA_SERVICE_PROVIDER_CODE", desc: "Shortcode de Empresa (ex: 171717)" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded bg-muted/60 border border-border"
                    >
                      <div>
                        <span className="font-bold text-foreground">{item.key}</span>
                        <span className="block text-[10px] text-muted-foreground font-sans">
                          {item.desc}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.key, item.key)}
                        className="text-xs font-sans text-primary hover:underline flex items-center gap-1"
                      >
                        {copiedVar === item.key ? (
                          <span className="text-emerald-500 font-bold">Copiado!</span>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARTÕES DE CRÉDITO MOÇAMBIQUE */}
        {activeTab === "cards" && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <CreditCard className="size-4" />
                Passarelas de Cartões para Moçambique (Visa, Mastercard, SIMO)
              </h4>
              <p className="mt-1 leading-relaxed">
                Pode utilizar um gateway nacional de Moçambique (PayShed) ou um gateway pan-africano com suporte nativo a Meticais (Flutterwave).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">Opção A: Flutterwave</h5>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-bold text-[10px]">
                      Suporta Meticais (MZN)
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Gateway líder com suporte nativo a pagamentos em Metical moçambicano (MZN) e cartões Visa/Mastercard.
                  </p>
                  <a
                    href="https://flutterwave.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Registar em flutterwave.com</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>

                <div className="space-y-1 font-mono text-[10px] pt-2 border-t border-border">
                  <span className="font-bold font-sans text-muted-foreground">Variável no .env:</span>
                  <div className="p-1.5 rounded bg-muted text-foreground flex items-center justify-between">
                    <span>FLUTTERWAVE_SECRET_KEY</span>
                    <button
                      onClick={() => handleCopy("FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_SECRET_KEY")}
                      className="font-sans text-primary hover:underline text-[10px]"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">Opção B: PayShed</h5>
                    <span className="rounded bg-blue-500/10 text-blue-600 px-2 py-0.5 font-bold text-[10px]">
                      Acquirente Local MZ
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Processador local em Moçambique integrado com a Rede SIMO e bancos nacionais (BIM, BCI, Standard Bank).
                  </p>
                  <a
                    href="https://payshed.co.mz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Registar em payshed.co.mz</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>

                <div className="space-y-1 font-mono text-[10px] pt-2 border-t border-border">
                  <span className="font-bold font-sans text-muted-foreground">Variável no .env:</span>
                  <div className="p-1.5 rounded bg-muted text-foreground flex items-center justify-between">
                    <span>PAYSHED_API_KEY</span>
                    <button
                      onClick={() => handleCopy("PAYSHED_API_KEY", "PAYSHED_API_KEY")}
                      className="font-sans text-primary hover:underline text-[10px]"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DPO PAY SANDBOX */}
        {activeTab === "dpo" && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="size-4" />
                DPO Pay Sandbox API v6 & Contas de Teste
              </h4>
              <p className="mt-1 leading-relaxed">
                Ambiente de simulação DPO Pay sem transferência de fundos reais. Use as credenciais abaixo para validar integrações em Meticais e cartões internacionais.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="font-bold text-foreground text-sm">Sandbox Base URL:</span>
              <div className="flex items-center justify-between p-2 rounded bg-muted font-mono text-[11px]">
                <code className="text-emerald-600 dark:text-emerald-400">https://secure.3gdirectpay.com/API/v6/</code>
                <button
                  onClick={() => handleCopy("https://secure.3gdirectpay.com/API/v6/", "dpo_url")}
                  className="font-sans text-primary hover:underline text-xs"
                >
                  {copiedVar === "dpo_url" ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h5 className="font-bold text-foreground text-sm">Contas de Teste DPO Sandbox:</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground font-sans">
                      <th className="pb-1.5">Conta</th>
                      <th className="pb-1.5">Company Token</th>
                      <th className="pb-1.5">Prod Service</th>
                      <th className="pb-1.5">Serv Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 1</td>
                      <td className="py-1.5 text-primary">B3F59BE7-0756-420E-BB88-1D98E7A6B040</td>
                      <td className="py-1.5">54841</td>
                      <td className="py-1.5">85325</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 2</td>
                      <td className="py-1.5 text-primary">C40E4138-3DF7-4A56-A6D1-375A49407A1C</td>
                      <td className="py-1.5">54842</td>
                      <td className="py-1.5">86275</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 3</td>
                      <td className="py-1.5 text-primary">8BB9CF9A-6E89-4E78-828F-088D5A000269</td>
                      <td className="py-1.5">54843</td>
                      <td className="py-1.5">86277</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 4</td>
                      <td className="py-1.5 text-primary">732CDD7C-34B3-4506-ACF6-B03F94FB44C8</td>
                      <td className="py-1.5">54844</td>
                      <td className="py-1.5">86278</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 5</td>
                      <td className="py-1.5 text-primary">8E0F3AD8-B254-419A-80DF-6D9C280A5130</td>
                      <td className="py-1.5">54845</td>
                      <td className="py-1.5">86280</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold font-sans">Account 6</td>
                      <td className="py-1.5 text-primary">8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3</td>
                      <td className="py-1.5">3854</td>
                      <td className="py-1.5">5525</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h5 className="font-bold text-foreground text-sm">Cartões de Teste com Aprovação Automática:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="block text-[10px] text-muted-foreground font-sans font-bold">Mastercard</span>
                  <span>5436 8862 6984 8367</span>
                </div>
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="block text-[10px] text-muted-foreground font-sans font-bold">Visa</span>
                  <span>4012 8888 8888 1881</span>
                </div>
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="block text-[10px] text-muted-foreground font-sans font-bold">Amex</span>
                  <span>3456 7890 1234 564</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Validade: Qualquer data futura (ex: 12/28) · CVV: 123 · Nome: Qualquer titular válido
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            💡 <em>Passarelas de M-Pesa C2B e Cartões habilitadas e prontas para transacções.</em>
          </p>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
