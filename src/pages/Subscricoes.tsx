import React, { useState } from "react";
import { Shell, Panel } from "@/components/Shell";
import { useI18n } from "@/lib/i18n";
import { useWeb3 } from "@/lib/web3-base";
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionTierId,
} from "@/lib/subscription-store";
import { SignInWithBaseButton, BaseLogoSvg } from "@/components/SignInWithBaseButton";
import { PaymentCredentialsModal } from "@/components/PaymentCredentialsModal";
import {
  Zap,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Copy,
  Receipt,
  Layers,
  Key,
} from "lucide-react";

export function Subscricoes() {
  const { t } = useI18n();
  const { address, walletType, networkName, chainId, signInWithBase } = useWeb3();
  const { subscription, openModal, consumePrompt } = useSubscription();

  const [copiedTx, setCopiedTx] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [demoConsumeFeedback, setDemoConsumeFeedback] = useState<string | null>(null);

  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.tierId);
  const percentUsed =
    subscription.totalPromptsQuota > 0
      ? Math.min(100, Math.round((subscription.promptsUsed / subscription.totalPromptsQuota) * 100))
      : 0;

  const handleCopyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const handleDemoConsume = () => {
    const success = consumePrompt();
    if (success) {
      setDemoConsumeFeedback("1 Prompt de teste consumido com sucesso!");
    } else {
      setDemoConsumeFeedback("Cota esgotada! Abra o modal para recarregar.");
    }
    setTimeout(() => setDemoConsumeFeedback(null), 3000);
  };

  // BaseScan link generator
  const getBasescanUrl = (txHash: string) => {
    if (chainId === "0x14a34" || subscription.networkUsed === "Base Sepolia") {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    }
    return `https://basescan.org/tx/${txHash}`;
  };

  return (
    <Shell
      titulo={t("Subscrições & Planos Base Pay")}
      descricao={t(
        "Gerencie a sua cota mensal do Orientador IA com pagamentos instantâneos em USDC na rede Base ou cartão de crédito."
      )}
    >
      <div className="space-y-8">
        {/* Banner Superior Base Pay */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-6 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                <BaseLogoSvg className="size-4" />
                <span>Base Pay · USDC Subscriptions L2</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Cota de Inteligência Artificial para Estudantes
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Subscreva com micropagamentos em USDC na Layer 2 Base com taxas quase nulas (&lt; $0.001)
                ou cartão bancário tradicional.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowCredentialsModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2 text-xs border border-white/20 backdrop-blur-md transition cursor-pointer"
              >
                <Key className="size-3.5 text-amber-300" />
                <span>Ver Guias de Credenciais M-Pesa / Cartão</span>
              </button>

              {!address ? (
                <SignInWithBaseButton variant="primary" />
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 backdrop-blur-md border border-white/20 text-xs">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="font-bold font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                    <p className="text-[10px] text-blue-200 uppercase font-medium">
                      Conectado via {walletType === "base" ? "Base Account" : "MetaMask"} ({networkName})
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => openModal()}
                className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Zap className="size-4 fill-slate-950" />
                <span>Gerir / Alterar Plano</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estado da Subscrição Actual */}
        <Panel titulo="Estado da Sua Subscrição Actual">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Principal de Cota */}
            <div className="md:col-span-2 rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Plano Activo
                  </span>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {subscription.planName}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold">
                      <CheckCircle2 className="size-3" /> Activo
                    </span>
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Método de Pagamento
                  </span>
                  <p className="text-sm font-semibold text-foreground flex items-center justify-end gap-1.5">
                    {subscription.paymentMethod === "Base Pay (USDC)" ? (
                      <>
                        <BaseLogoSvg className="size-4" />
                        <span>Base Pay (USDC)</span>
                      </>
                    ) : subscription.paymentMethod === "Card" ? (
                      <>
                        <CreditCard className="size-4 text-blue-500" />
                        <span>Cartão de Crédito</span>
                      </>
                    ) : (
                      <span>Grátis (Demonstração)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso de Prompts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="size-3.5 text-amber-500" />
                    Prompts IA Consumidos Este Mês
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {subscription.promptsRemaining} de {subscription.totalPromptsQuota} Prompts Disponíveis
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (subscription.promptsRemaining / Math.max(1, subscription.totalPromptsQuota)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Usado: {subscription.promptsUsed} prompts</span>
                  <span>Restante: {subscription.promptsRemaining} prompts ({percentUsed}% utilizado)</span>
                </div>
              </div>

              {/* Detalhes Técnicos de Validade & Tx */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="block font-semibold text-foreground">Validez do Ciclo</span>
                    <span>
                      {subscription.activeUntil
                        ? new Date(subscription.activeUntil).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Sem expiração definida"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="size-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="block font-semibold text-foreground">Rede Blockchain</span>
                    <span>{subscription.networkUsed || "Base Mainnet (0x2105)"}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Teste Demo Prompt */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-md">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Testar consumo de cota:</span>{" "}
                  Simule uma consulta ao Orientador IA para decrementar a cota.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDemoConsume}
                    className="flex items-center gap-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span>Simular Consulta (-1 Prompt)</span>
                  </button>
                </div>
              </div>
              {demoConsumeFeedback && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  {demoConsumeFeedback}
                </p>
              )}
            </div>

            {/* Comprovativo Blockchain / Tx Proof */}
            <div className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <ShieldCheck className="size-5 text-emerald-500" />
                  <span>Comprovativo On-Chain</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Todas as subscrições realizadas através do Base Pay são registadas de forma imutável na blockchain Base.
                </p>

                {subscription.lastTxHash ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Hash de Transacção
                    </span>
                    <div className="flex items-center justify-between gap-2 rounded bg-muted p-2 font-mono text-[11px] text-foreground">
                      <span className="truncate">{subscription.lastTxHash}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTx(subscription.lastTxHash!)}
                        className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                        title="Copiar Hash"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    {copiedTx && (
                      <p className="text-[10px] text-emerald-600 font-semibold">Copiado para a área de transferência!</p>
                    )}

                    <a
                      href={getBasescanUrl(subscription.lastTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 pt-1"
                    >
                      <span>Ver no BaseScan Explorer</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-muted/50 text-xs text-muted-foreground italic">
                    Nenhuma transacção blockchain recente registada.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => openModal()}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-bold px-4 py-2 text-xs hover:bg-primary/90 transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Atualizar ou Renovar Plano</span>
              </button>
            </div>
          </div>
        </Panel>

        {/* Tabela Comparativa dos Planos de Subscrição */}
        <Panel titulo="Planos e Pacotes de Consultas IA (Base Pay & Cartão)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = subscription.tierId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                    plan.popular
                      ? "border-blue-500 bg-card shadow-md ring-2 ring-blue-500/20"
                      : "border-border bg-card shadow-xs"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm uppercase tracking-wider">
                      Recomendado Estudante
                    </div>
                  )}

                  <div>
                    {/* Header do Plano */}
                    <div className="border-b border-border pb-4 space-y-1">
                      <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground">${plan.priceUsdc}</span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          USDC / mês
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 pt-1">
                        <Zap className="size-3.5 fill-amber-400 text-amber-500" />
                        {plan.monthlyPrompts} Consultas IA / Mês
                      </p>
                    </div>

                    {/* Funcionalidades */}
                    <ul className="py-4 space-y-2.5 text-xs">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Margem de Transparência Financeira */}
                    <div className="mt-2 rounded-lg bg-muted/60 p-3 text-[11px] space-y-1 border border-border/50">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Custo API estimado (Gemini):</span>
                        <span className="font-mono">${plan.estimatedApiCostUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>Margem Bruta de Lucro:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          {plan.profitMarginPercent}% (${plan.grossProfitUsd.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Plano */}
                  <div className="pt-6 space-y-2">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-2 text-xs font-bold cursor-default flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="size-4" />
                        <span>Plano Actual Ativo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openModal(plan.id as SubscriptionTierId)}
                        className={`w-full rounded-md py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                          plan.popular
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        }`}
                      >
                        <BaseLogoSvg className="size-4" />
                        <span>Subscrever com Base Pay</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Secção Explicativa Base Pay Blockchain */}
        <Panel titulo="Vantagens do Pagamento via Base Pay (USDC)">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="p-2 w-fit rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BaseLogoSvg className="size-5" />
              </div>
              <h5 className="font-bold text-sm text-foreground">Sem Comissões Bancárias</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pagamentos diretos em USDC via Layer 2 Base com custos de transação insignificantes (&lt; $0.001).
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="p-2 w-fit rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap className="size-5" />
              </div>
              <h5 className="font-bold text-sm text-foreground">Confirmação Instantânea</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A cota de Prompts IA é libertada imediatamente após o envio do pagamento na blockchain.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="p-2 w-fit rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="size-5" />
              </div>
              <h5 className="font-bold text-sm text-foreground">Transparência On-Chain</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada mensalidade gera um comprovativo imutável no BaseScan para a Tesouraria da Universidade.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="p-2 w-fit rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CreditCard className="size-5" />
              </div>
              <h5 className="font-bold text-sm text-foreground">Flexibilidade Total</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suporte nativo a Base Account, MetaMask, Smart Wallets e cartões Visa / Mastercard.
              </p>
            </div>
          </div>
        </Panel>

        {/* Histórico de Subscrições */}
        <Panel titulo="Histórico de Subscrições & Comprovativos">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Rede / Comprovativo</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card font-medium">
                <tr className="hover:bg-muted/40 transition">
                  <td className="p-3">{new Date().toLocaleDateString("pt-PT")}</td>
                  <td className="p-3 font-bold text-foreground">{subscription.planName}</td>
                  <td className="p-3 font-mono font-bold text-foreground">
                    ${activePlan?.priceUsdc || 0}.00 USDC
                  </td>
                  <td className="p-3 flex items-center gap-1.5">
                    {subscription.paymentMethod === "Base Pay (USDC)" ? (
                      <>
                        <BaseLogoSvg className="size-3.5" />
                        <span>Base Pay</span>
                      </>
                    ) : (
                      <span>{subscription.paymentMethod}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {subscription.lastTxHash ? (
                      <a
                        href={getBasescanUrl(subscription.lastTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                      >
                        <span>{subscription.lastTxHash.slice(0, 10)}...</span>
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Interno</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                      <CheckCircle2 className="size-3" /> Confirmado
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      {/* Modal de Guias de Credenciais */}
      {showCredentialsModal && (
        <PaymentCredentialsModal onClose={() => setShowCredentialsModal(false)} />
      )}
    </Shell>
  );
}
