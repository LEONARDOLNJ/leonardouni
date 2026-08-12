import React, { useState, useEffect } from "react";
import { X, Smartphone, CreditCard, ExternalLink, ShieldCheck, Check, Copy, HelpCircle, Key, RefreshCw, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PaymentCredentialsModalProps {
  onClose: () => void;
}

export function PaymentCredentialsModal({ onClose }: PaymentCredentialsModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"mpesa" | "cards">("mpesa");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<{
    mpesa?: { configured: boolean; environment: string; shortcode: string; provider: string };
    card?: { configured: boolean; provider: string };
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

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
            Como Obter Credenciais: M-Pesa & Cartões de Crédito/Débito
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Instruções passo-a-passo e locais de registo oficial para integrar pagamentos em Meticais (MZN).
          </p>
        </div>

        {/* Gateway Config Status Banner */}
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Estado das Chaves de API no Servidor (.env)
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-500" />
                <div>
                  <p className="font-bold text-foreground">M-Pesa C2B Vodacom (mpesa-api)</p>
                  <p className="text-[10px] text-muted-foreground">
                    {gatewayStatus?.mpesa?.provider || "Vodacom OpenAPI (mpesa-api SDK)"}
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
                <CreditCard className="size-4 text-blue-500" />
                <div>
                  <p className="font-bold text-foreground">Cartões Visa / Mastercard / SIMO</p>
                  <p className="text-[10px] text-muted-foreground">
                    {gatewayStatus?.card?.provider || "Flutterwave / PayShed"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gatewayStatus?.card?.configured
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                }`}
              >
                {gatewayStatus?.card?.configured ? "Ativo (Chave API OK)" : "Modo Teste / Sandbox"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("mpesa")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "mpesa"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="size-4" />
            <span>1. Vodacom M-Pesa Moçambique</span>
          </button>

          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "cards"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="size-4" />
            <span>2. Cartões de Crédito / Débito (Visa, Mastercard, SIMO)</span>
          </button>
        </div>

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
                  Aceda a <strong>developer.mpesa.vm.co.mz</strong> ou <strong>apix.voda.co.mz</strong>, crie a sua conta de empresa ou programador e crie uma nova aplicação no painel da Vodacom.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h5 className="font-bold text-foreground text-sm">
                  Passo 2: Solicitar Acesso à API C2B (Single Stage Payment)
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  No painel de M-Pesa OpenAPI, subscreva o produto <strong>C2B Payment</strong> para receber pagamentos instantâneos com pop-up USSD no telemóvel dos estudantes.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h5 className="font-bold text-foreground text-sm">
                  Passo 3: Chaves e Variáveis de Ambiente a Configurar
                </h5>
                <p className="text-muted-foreground">
                  Após aprovação pela Vodacom, copie as seguintes chaves para as variáveis de ambiente:
                </p>

                <div className="space-y-2 font-mono text-[11px] pt-1">
                  {[
                    { key: "MPESA_API_KEY", desc: "Chave da API OpenAPI Vodacom" },
                    { key: "MPESA_PUBLIC_KEY", desc: "Chave pública RSA para encriptação do Bearer Token" },
                    { key: "MPESA_SERVICE_PROVIDER_CODE", desc: "Shortcode de Empresa (ex: 171717 ou 88888)" },
                    { key: "MPESA_INITIATOR_IDENTIFIER", desc: "Identificador do Iniciador Autorizado" },
                    { key: "MPESA_SECURITY_CREDENTIAL", desc: "Credencial de Segurança / PIN Encriptado" },
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
                            <span>Copiar Nome</span>
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
                Pode utilizar um gateway nacional de Moçambique (PayShed / DPO Pay) ou um gateway pan-africano com suporte nativo a Meticais (Flutterwave / Paystack).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção A: Flutterwave */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">Opção A: Flutterwave</h5>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-bold text-[10px]">
                      Suporta Meticais (MZN)
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Gateway líder em África com suporte nativo a pagamentos em Metical moçambicano (MZN), cartões Visa/Mastercard e M-Pesa.
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

              {/* Opção B: PayShed / DPO Pay Moçambique */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">Opção B: PayShed / DPO Pay</h5>
                    <span className="rounded bg-blue-500/10 text-blue-600 px-2 py-0.5 font-bold text-[10px]">
                      Acquirente Local Moçambique
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Processador local em Moçambique integrado com a Rede SIMO, bancos nacionais (BIM, BCI, Standard Bank) e Visa/Mastercard.
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

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            💡 <em>Nota: A aplicação está pré-configurada em modo Sandbox para testes instantâneos.</em>
          </p>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
