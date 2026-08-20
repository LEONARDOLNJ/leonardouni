import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useWeb3 } from "./web3-base";
import {
  type CurrencyCode,
  formatUsdInCurrency,
  convertUsdToCurrency,
  MZN_USD_RATE,
} from "./uni-data";

export type SubscriptionTierId = "free" | "1usdc" | "5usdc" | "10usdc";

export interface SubscriptionPlan {
  id: SubscriptionTierId;
  name: string;
  priceUsdc: number; // in USD / USDC
  monthlyPrompts: number;
  estimatedApiCostUsd: number;
  grossProfitUsd: number;
  profitMarginPercent: number;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "1usdc",
    name: "Estudante Básico",
    priceUsdc: 1,
    monthlyPrompts: 50,
    estimatedApiCostUsd: 0.10,
    grossProfitUsd: 0.90,
    profitMarginPercent: 90,
    features: [
      "50 Consultas / Prompts IA por mês",
      "Acesso ao Orientador de Propinas & Prazos",
      "Suporte a Português e Inglês",
      "Pagamento instantâneo via Base Pay, M-Pesa ou Cartão",
    ],
  },
  {
    id: "5usdc",
    name: "Estudante Pro",
    priceUsdc: 5,
    monthlyPrompts: 300,
    estimatedApiCostUsd: 0.60,
    grossProfitUsd: 4.40,
    profitMarginPercent: 88,
    popular: true,
    features: [
      "300 Consultas / Prompts IA por mês",
      "Simulações ilimitadas de planos de pagamento",
      "Acesso prioritário a respostas complexas",
      "Suporte a Base Sepolia, M-Pesa e Cartões",
      "Relatórios financeiros em PDF e comprovativos",
    ],
  },
  {
    id: "10usdc",
    name: "Estudante Power / Ilimitado",
    priceUsdc: 10,
    monthlyPrompts: 1000,
    estimatedApiCostUsd: 2.00,
    grossProfitUsd: 8.00,
    profitMarginPercent: 80,
    features: [
      "1,000 Consultas / Prompts IA por mês",
      "Orientador IA sem restrições de frequência",
      "Suporte a múltiplos utilizadores e delegados",
      "Atendimento prioritário na Tesouraria Académica",
      "Comprovativos em blockchain no BaseScan",
    ],
  },
];

export type SubscriptionPaymentMethod =
  | "Crypto (Base Pay)"
  | "Card"
  | "M-Pesa"
  | "Base Pay (USDC)"
  | "Grátis";

export interface SubscriptionHistoryItem {
  id: string;
  planId: SubscriptionTierId;
  planName: string;
  priceUsdc: number;
  priceFormatted?: string;
  currency?: CurrencyCode;
  paymentMethod: SubscriptionPaymentMethod;
  network?: string;
  txHash?: string;
  date: string;
}

export interface UserSubscription {
  tierId: SubscriptionTierId;
  planName: string;
  promptsRemaining: number;
  totalPromptsQuota: number;
  promptsUsed: number;
  activeUntil: string | null; // ISO Date string
  paymentMethod: SubscriptionPaymentMethod;
  networkUsed?: "Base Mainnet" | "Base Sepolia";
  lastTxHash?: string;
  currency?: CurrencyCode;
}

interface SubscriptionContextType {
  subscription: UserSubscription;
  history: SubscriptionHistoryItem[];
  isModalOpen: boolean;
  openModal: (selectedPlanId?: SubscriptionTierId) => void;
  closeModal: () => void;
  selectedPlanForModal: SubscriptionTierId;
  setSelectedPlanForModal: (planId: SubscriptionTierId) => void;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amountUsd: number, overrideCurrency?: CurrencyCode) => string;
  getPriceInCurrency: (amountUsd: number, overrideCurrency?: CurrencyCode) => number;
  consumePrompt: () => boolean;
  subscribeToPlan: (params: {
    planId: SubscriptionTierId;
    paymentMethod: SubscriptionPaymentMethod;
    currency?: CurrencyCode;
    priceFormatted?: string;
    network?: "Base Mainnet" | "Base Sepolia";
    txHash?: string;
  }) => void;
}

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tierId: "free",
  planName: "Plano Gratuito Inicial",
  promptsRemaining: 5,
  totalPromptsQuota: 5,
  promptsUsed: 0,
  activeUntil: null,
  paymentMethod: "Grátis",
};

const DEFAULT_HISTORY: SubscriptionHistoryItem[] = [
  {
    id: "SUB-HIST-1",
    planId: "free",
    planName: "Plano Gratuito Inicial",
    priceUsdc: 0,
    priceFormatted: "Grátis",
    currency: "MZN",
    paymentMethod: "Grátis",
    date: new Date().toISOString(),
  },
];

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: DEFAULT_SUBSCRIPTION,
  history: DEFAULT_HISTORY,
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  selectedPlanForModal: "5usdc",
  setSelectedPlanForModal: () => {},
  selectedCurrency: "MZN",
  setSelectedCurrency: () => {},
  formatPrice: () => "",
  getPriceInCurrency: () => 0,
  consumePrompt: () => true,
  subscribeToPlan: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem("ul-subscription-currency");
    if (saved && ["MZN", "USD", "EUR", "ZAR"].includes(saved)) {
      return saved as CurrencyCode;
    }
    return "MZN"; // Default to Mozambique Metical as requested
  });

  const setSelectedCurrency = (curr: CurrencyCode) => {
    setSelectedCurrencyState(curr);
    localStorage.setItem("ul-subscription-currency", curr);
  };

  const formatPrice = (amountUsd: number, overrideCurrency?: CurrencyCode) => {
    const curr = overrideCurrency || selectedCurrency;
    return formatUsdInCurrency(amountUsd, curr);
  };

  const getPriceInCurrency = (amountUsd: number, overrideCurrency?: CurrencyCode) => {
    const curr = overrideCurrency || selectedCurrency;
    return convertUsdToCurrency(amountUsd, curr);
  };

  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    const saved = localStorage.getItem("ul-ai-subscription");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SUBSCRIPTION;
      }
    }
    return DEFAULT_SUBSCRIPTION;
  });

  const [history, setHistory] = useState<SubscriptionHistoryItem[]>(() => {
    const saved = localStorage.getItem("ul-ai-subscription-history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_HISTORY;
      }
    }
    return DEFAULT_HISTORY;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<SubscriptionTierId>("5usdc");

  useEffect(() => {
    localStorage.setItem("ul-ai-subscription", JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem("ul-ai-subscription-history", JSON.stringify(history));
  }, [history]);

  const openModal = (planId?: SubscriptionTierId) => {
    if (planId) setSelectedPlanForModal(planId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const consumePrompt = (): boolean => {
    if (subscription.promptsRemaining <= 0) {
      openModal();
      return false;
    }

    setSubscription((prev) => ({
      ...prev,
      promptsRemaining: Math.max(0, prev.promptsRemaining - 1),
      promptsUsed: prev.promptsUsed + 1,
    }));
    return true;
  };

  const subscribeToPlan = ({
    planId,
    paymentMethod,
    currency,
    priceFormatted,
    network,
    txHash,
  }: {
    planId: SubscriptionTierId;
    paymentMethod: SubscriptionPaymentMethod;
    currency?: CurrencyCode;
    priceFormatted?: string;
    network?: "Base Mainnet" | "Base Sepolia";
    txHash?: string;
  }) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];

    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const generatedHash =
      txHash ||
      (paymentMethod === "Crypto (Base Pay)" || paymentMethod === "Base Pay (USDC)"
        ? `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")}`
        : paymentMethod === "M-Pesa"
        ? `MP260811.${Math.floor(1000 + Math.random() * 9000)}`
        : `CARD-AUTH-${Math.floor(100000 + Math.random() * 900000)}`);

    const activeCurr = currency || selectedCurrency;
    const formattedPrice = priceFormatted || formatPrice(plan.priceUsdc, activeCurr);

    const updated: UserSubscription = {
      tierId: plan.id,
      planName: plan.name,
      promptsRemaining: plan.monthlyPrompts,
      totalPromptsQuota: plan.monthlyPrompts,
      promptsUsed: 0,
      activeUntil: nextMonthDate.toISOString(),
      paymentMethod,
      networkUsed: network || "Base Mainnet",
      lastTxHash: generatedHash,
    };

    const newHistoryItem: SubscriptionHistoryItem = {
      id: `SUB-TX-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      priceUsdc: plan.priceUsdc,
      priceFormatted: formattedPrice,
      currency: activeCurr,
      paymentMethod,
      network: network || "Base Mainnet",
      txHash: generatedHash,
      date: new Date().toISOString(),
    };

    setSubscription(updated);
    setHistory((prev) => [newHistoryItem, ...prev]);

    // Also persist activity / payment in backend if available
    try {
      fetch("/api/payments/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "SUBSCRIPTION_USER",
          feeTitle: `Subscrição IA: ${plan.name} (${formattedPrice})`,
          amount: Math.round(plan.priceUsdc * MZN_USD_RATE),
          amountFormatted: formattedPrice,
          currency: activeCurr,
          method: paymentMethod,
          reference: generatedHash,
        }),
      }).catch(() => {});
    } catch (e) {
      console.warn("Could not log subscription payment to server:", e);
    }

    closeModal();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        history,
        isModalOpen,
        openModal,
        closeModal,
        selectedPlanForModal,
        setSelectedPlanForModal,
        selectedCurrency,
        setSelectedCurrency,
        formatPrice,
        getPriceInCurrency,
        consumePrompt,
        subscribeToPlan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
