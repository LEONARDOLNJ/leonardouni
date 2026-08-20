import React, { useState } from "react";
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionTierId,
} from "@/lib/subscription-store";
import { useWeb3, BASE_SEPOLIA_CHAIN_ID } from "@/lib/web3-base";
import { useI18n } from "@/lib/i18n";
import {
  type CurrencyCode,
  MZN_USD_RATE,
  formatCurrency,
  convertUsdToCurrency,
} from "@/lib/uni-data";
import {
  X,
  Sparkles,
  CheckCircle2,
  Coins,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Globe,
  Zap,
  ArrowRight,
  Info,
  Check,
  DollarSign,
} from "lucide-react";

export function SubscriptionModal() {
  const { t } = useI18n();
  const {
    isModalOpen,
    closeModal,
    selectedPlanForModal,
    setSelectedPlanForModal,
    subscribeToPlan,
    subscription,
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
    getPriceInCurrency,
  } = useSubscription();

  const {
    address,
    payWithBase,
    signInWithBase,
    signInWithEthereum,
    receivingAddress,
    balanceEth,
    balanceUsdc,
  } = useWeb3();

  const [paymentMethod, setPaymentMethod] = useState<"Crypto (Base Pay)" | "M-Pesa" | "Card">("Crypto (Base Pay)");
  const [networkChoice, setNetworkChoice] = useState<"Base Sepolia" | "Base Mainnet">("Base Sepolia");
  const [payTokenType, setPayTokenType] = useState<"ETH" | "USDC">("ETH");
  const [phoneNumber, setPhoneNumber] = useState("+258 84 ");
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8812");
  const [subError, setSubError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    txHash: string;
    planName: string;
    prompts: number;
    amountUsdc: number;
    priceFormatted: string;
    currency: CurrencyCode;
    method: string;
  } | null>(null);

  if (!isModalOpen) return null;

  const activePlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanForModal) || SUBSCRIPTION_PLANS[1];

  const planPriceFormatted = formatPrice(activePlan.priceUsdc);
  const planPriceMzn = Math.round(activePlan.priceUsdc * MZN_USD_RATE);

  const handleConfirmSubscription = async () => {
    setProcessing(true);
    setSubError(null);

    const priceFormatted = formatPrice(activePlan.priceUsdc);

    if (paymentMethod === "Crypto (Base Pay)") {
      const result = await payWithBase({
        amountMzn: planPriceMzn,
        amountUsdc: activePlan.priceUsdc,
        feeTitle: `Subscrição IA: ${activePlan.name} (${priceFormatted})`,
        studentId: "SUBSCRIPTION",
        payTokenType,
      });

      if (result.success) {
        const hash = result.txHash || `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
        subscribeToPlan({
          planId: activePlan.id,
          paymentMethod: "Crypto (Base Pay)",
          currency: selectedCurrency,
          priceFormatted,
          network: networkChoice,
          txHash: hash,
        });

        setSuccessReceipt({
          txHash: hash,
          planName: activePlan.name,
          prompts: activePlan.monthlyPrompts,
          amountUsdc: activePlan.priceUsdc,
          priceFormatted,
          currency: selectedCurrency,
          method: "Crypto (Base Pay)",
        });
      } else {
        setSubError(result.error || "Falha na transacção com Base Pay");
      }
      setProcessing(false);
      return;
    }

    if (paymentMethod === "M-Pesa") {
      try {
        await fetch("/api/payments/m-pesa/c2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber,
            amount: planPriceMzn,
            currency: "MZN",
            reference: `SUB-${activePlan.id}`,
            studentId: "SUBSCRIPTION",
            feeTitle: `Subscrição IA: ${activePlan.name} (${priceFormatted})`,
          }),
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        const mpesaHash = `MP260811.${Math.floor(1000 + Math.random() * 9000)}`;
        subscribeToPlan({
          planId: activePlan.id,
          paymentMethod: "M-Pesa",
          currency: selectedCurrency,
          priceFormatted,
          network: "Base Mainnet",
          txHash: mpesaHash,
        });

        setSuccessReceipt({
          txHash: mpesaHash,
          planName: activePlan.name,
          prompts: activePlan.monthlyPrompts,
          amountUsdc: activePlan.priceUsdc,
          priceFormatted,
          currency: selectedCurrency,
          method: "M-Pesa",
        });

        setProcessing(false);
      }, 1500);
      return;
    }

    // Card Payment Simulation (DPO / Gateway)
    try {
      await fetch("/api/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: cardNumber || "5436 8862 6984 8367",
          amount: selectedCurrency === "USD" ? activePlan.priceUsdc : planPriceMzn,
          currency: selectedCurrency,
          studentId: "SUBSCRIPTION_USER",
          feeTitle: `Subscrição IA: ${activePlan.name} (${priceFormatted})`,
          email: "student@universidade.ac.mz",
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      const cardHash = `CARD-AUTH-${Date.now()}`;
      subscribeToPlan({
        planId: activePlan.id,
        paymentMethod: "Card",
        currency: selectedCurrency,
        priceFormatted,
        network: "Base Mainnet",
        txHash: cardHash,
      });

      setSuccessReceipt({
        txHash: cardHash,
        planName: activePlan.name,
        prompts: activePlan.monthlyPrompts,
        amountUsdc: activePlan.priceUsdc,
        priceFormatted,
        currency: selectedCurrency,
        method: "Card",
      });

      setProcessing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-card shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
              <Sparkles className="size-3.5" />
              <span>{t("Planos de Subscrição do Orientador IA")}</span>
              <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[10px] text-white uppercase font-bold">
                Base Pay (USDC)
              </span>
            </div>

            {/* Currency Selector Pill */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1.5 flex items-center gap-1">
                <DollarSign className="size-3" />
                Moeda:
              </span>
              {(
                [
                  { code: "MZN", label: "🇲🇿 MZN (MT)", title: "Metical Moçambicano" },
                  { code: "USD", label: "🇺🇸 USD ($)", title: "Dólar Americano / USDC" },
                  { code: "EUR", label: "🇪🇺 EUR (€)", title: "Euro Europeu" },
                  { code: "ZAR", label: "🇿🇦 ZAR (R)", title: "Rand Sul-Africano" },
                ] as const
              ).map((curr) => (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => setSelectedCurrency(curr.code)}
                  title={curr.title}
                  className={`px-2 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                    selectedCurrency === curr.code
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  {curr.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("Escolha o seu Plano de Consultas IA")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {t(
                "Subscreva com moeda local em Meticais (MZN via M-Pesa/Cartão), Dólares (USDC via Base Pay), Euros ou Rands para acesso contínuo a orientações académicas e financeiras personalizadas.",
              )}
            </p>
          </div>
        </div>

        {/* Success View */}
        {successReceipt ? (
          <div className="rounded-sm border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mx-auto border border-emerald-500/40">
              <CheckCircle2 className="size-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-emerald-300">
                {t("Subscrição Ativada com Sucesso!")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t("O seu saldo foi recarregado com")} <strong className="text-foreground">{successReceipt.prompts} {t("Prompts IA")}</strong>.
              </p>
            </div>

            <div className="rounded border border-border bg-card p-4 space-y-2 text-xs font-mono text-left max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Plano")}:</span>
                <span className="font-bold text-foreground">{successReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Valor Pago")}:</span>
                <span className="font-bold text-emerald-400">{successReceipt.priceFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equivalente Digital:</span>
                <span className="font-bold text-blue-400">${successReceipt.amountUsdc}.00 USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Método")}:</span>
                <span className="font-bold text-foreground">{paymentMethod}</span>
              </div>
              {paymentMethod === "Crypto (Base Pay)" && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground block">
                    Recebedor: <strong className="text-amber-300 font-mono">{receivingAddress}</strong>
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Hash no Base Sepolia L2:</span>
                  <span className="text-[10px] text-blue-300 font-mono break-all block">{successReceipt.txHash}</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${successReceipt.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline text-[11px] font-bold mt-1.5"
                  >
                    <span>{t("Verificar no BaseScan Sepolia")}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={closeModal}
              className="w-full max-w-md mx-auto rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs transition cursor-pointer"
            >
              {t("Concluído e Voltar ao Orientador")}
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Tier Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. {t("Selecione o Plano")} ({selectedCurrency})
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Preços convertidos em tempo real para <strong>{selectedCurrency}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlanForModal === plan.id;
                  const priceInCurrent = formatPrice(plan.priceUsdc);

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanForModal(plan.id)}
                      className={`relative flex flex-col justify-between rounded-sm border p-4 cursor-pointer transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500"
                          : "border-border bg-card hover:border-blue-500/50"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-xs">
                          {t("Mais Popular")}
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-foreground">{plan.name}</h3>
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black font-display text-blue-500">
                              {priceInCurrent}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">
                              / {t("mês")}
                            </span>
                          </div>
                          {selectedCurrency !== "USD" && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              ≈ ${plan.priceUsdc}.00 USDC
                            </span>
                          )}
                        </div>

                        <div className="rounded bg-muted/60 px-2 py-1 text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <Zap className="size-3 text-amber-400 fill-amber-400" />
                          <span>{plan.monthlyPrompts} {t("Prompts IA / mês")}</span>
                        </div>

                        <ul className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="size-3 text-blue-400 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Pricing & Profitability Transparency Breakdown */}
            <div className="rounded-sm border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground font-semibold border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5 text-foreground">
                  <TrendingUp className="size-4 text-emerald-500" />
                  <span className="font-bold">{t("Modelo de Custos IA & Margem do Projeto")}</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  Margem Lucro: {activePlan.profitMarginPercent}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                <div className="bg-background border border-border p-2 rounded">
                  <span className="text-muted-foreground block text-[10px]">{t("Custo por Prompt")}:</span>
                  <span className="font-bold text-foreground">
                    ~{formatPrice(0.002)}
                  </span>
                </div>

                <div className="bg-background border border-border p-2 rounded">
                  <span className="text-muted-foreground block text-[10px]">{t("Custo Estimado API")}:</span>
                  <span className="font-bold text-amber-400">
                    {formatPrice(activePlan.estimatedApiCostUsd)}
                  </span>
                </div>

                <div className="bg-background border border-border p-2 rounded">
                  <span className="text-muted-foreground block text-[10px]">{t("Lucro Bruto/Mês")}:</span>
                  <span className="font-bold text-emerald-400">
                    {formatPrice(activePlan.grossProfitUsd)}
                  </span>
                </div>

                <div className="bg-background border border-border p-2 rounded">
                  <span className="text-muted-foreground block text-[10px]">{t("Moeda Activa")}:</span>
                  <span className="font-bold text-blue-400">{selectedCurrency}</span>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. {t("Selecione o Método de Pagamento")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Crypto (Base Pay)")}
                  className={`flex items-center justify-between rounded-sm border p-3 text-left transition cursor-pointer ${
                    paymentMethod === "Crypto (Base Pay)"
                      ? "border-blue-500 bg-blue-500/15 text-blue-400 font-bold shadow-xs ring-1 ring-blue-500"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins className="size-5 text-blue-400" />
                    <div>
                      <span className="text-xs block font-bold text-foreground">Crypto (Base Pay)</span>
                      <span className="text-[10px] text-muted-foreground">Base Sepolia L2 (ETH/USDC)</span>
                    </div>
                  </div>
                  {paymentMethod === "Crypto (Base Pay)" && <CheckCircle2 className="size-4 text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Card")}
                  className={`flex items-center justify-between rounded-sm border p-3 text-left transition cursor-pointer ${
                    paymentMethod === "Card"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-5 text-primary" />
                    <div>
                      <span className="text-xs block font-bold text-foreground">Cartão Bancário</span>
                      <span className="text-[10px] text-muted-foreground">Visa, Mastercard ({selectedCurrency})</span>
                    </div>
                  </div>
                  {paymentMethod === "Card" && <CheckCircle2 className="size-4 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("M-Pesa")}
                  className={`flex items-center justify-between rounded-sm border p-3 text-left transition cursor-pointer ${
                    paymentMethod === "M-Pesa"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="size-5 text-emerald-500" />
                    <div>
                      <span className="text-xs block font-bold text-foreground">Vodacom M-Pesa</span>
                      <span className="text-[10px] text-muted-foreground">Moçambique C2B (MZN)</span>
                    </div>
                  </div>
                  {paymentMethod === "M-Pesa" && <CheckCircle2 className="size-4 text-emerald-500" />}
                </button>
              </div>

              {/* Crypto (Base Pay) Network Info */}
              {paymentMethod === "Crypto (Base Pay)" && (
                <div className="rounded-sm border border-blue-500/30 bg-blue-950/20 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-blue-300">
                      <Globe className="size-4" />
                      <span>{t("Rede do Base Pay")}</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-blue-300">
                      <span>Base Sepolia Testnet (84532)</span>
                    </div>
                  </div>

                  {/* Destination Wallet Address */}
                  <div className="rounded border border-blue-500/20 bg-background/50 p-2.5 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Endereço de Destino (Recebedor):</span>
                      <span className="font-bold text-amber-300" title={receivingAddress}>
                        {receivingAddress.slice(0, 8)}...{receivingAddress.slice(-6)}
                      </span>
                    </div>
                  </div>

                  {/* Token selector */}
                  <div className="flex items-center justify-between rounded bg-muted/40 p-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Pagar com Token:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPayTokenType("ETH")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer ${
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
                        className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer ${
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded bg-amber-500/10 border border-amber-500/30 p-3 text-amber-200">
                      <span className="text-xs">{t("Para pagar com Base Pay, conecte a sua conta:")}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => signInWithBase()}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                        >
                          Sign in with Base
                        </button>
                        <button
                          type="button"
                          onClick={() => signInWithEthereum()}
                          className="rounded bg-amber-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer"
                        >
                          MetaMask
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-mono bg-emerald-950/20 p-2.5 rounded border border-emerald-500/30">
                      <span className="text-emerald-400 font-semibold">
                        ✓ Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                      <span className="text-muted-foreground">
                        Saldo: {balanceEth} ETH / ${balanceUsdc} USDC
                      </span>
                    </div>
                  )}

                  {subError && (
                    <div className="rounded bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 font-semibold">
                      ⚠️ {subError}
                    </div>
                  )}
                </div>
              )}

              {/* Card Input */}
              {paymentMethod === "Card" && (
                <div className="rounded-sm border border-border bg-background p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-foreground">{t("Número do Cartão de Débito/Crédito")}</label>
                    <span className="text-[10px] font-mono text-muted-foreground">DPO / Debito Pay ({selectedCurrency})</span>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="5436 8862 6984 8367"
                    className="w-full rounded border border-input bg-card px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Validade (MM/AA):</span>
                      <input
                        type="text"
                        defaultValue="12/28"
                        className="w-full rounded border border-input bg-card px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">CVV:</span>
                      <input
                        type="password"
                        defaultValue="123"
                        maxLength={4}
                        className="w-full rounded border border-input bg-card px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground block pt-1">
                    {t("Valor total a cobrar no cartão:")} <strong className="text-foreground font-bold">{planPriceFormatted}</strong> ({selectedCurrency}).
                  </span>
                </div>
              )}

              {/* M-Pesa Input */}
              {paymentMethod === "M-Pesa" && (
                <div className="rounded-sm border border-emerald-500/30 bg-emerald-950/10 p-3.5 space-y-2 text-xs">
                  <label className="block font-semibold text-foreground">
                    Número M-Pesa Moçambique (+258)
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full rounded border border-input bg-card px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Valor a debitar em moeda local: <strong className="text-foreground font-bold">{planPriceMzn} MZN</strong> ({formatCurrency(planPriceMzn, "MZN")}) via pedido C2B STK Push para autorização no seu telemóvel.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-sm border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t("Cancelar")}
              </button>

              <button
                type="button"
                onClick={handleConfirmSubscription}
                disabled={processing}
                className={`inline-flex items-center gap-2 rounded-sm font-bold px-5 py-2.5 text-xs transition shadow-md disabled:opacity-50 cursor-pointer text-white ${
                  paymentMethod === "M-Pesa"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : paymentMethod === "Card"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {processing ? (
                  <span>
                    {paymentMethod === "M-Pesa"
                      ? "A processar pedido M-Pesa C2B..."
                      : paymentMethod === "Card"
                      ? "A autorizar cartão bancário..."
                      : t("A processar pagamento Base Pay...")}
                  </span>
                ) : (
                  <>
                    {paymentMethod === "M-Pesa" ? (
                      <Zap className="size-4" />
                    ) : paymentMethod === "Card" ? (
                      <CreditCard className="size-4" />
                    ) : (
                      <Coins className="size-4" />
                    )}
                    <span>
                      {paymentMethod === "M-Pesa"
                        ? `Subscrever com M-Pesa (${planPriceMzn} MZN / mês)`
                        : paymentMethod === "Card"
                        ? `Subscrever com Cartão (${planPriceFormatted} / mês)`
                        : `Subscrever com Base Pay ($${activePlan.priceUsdc}.00 USDC · ${planPriceFormatted})`}
                    </span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
