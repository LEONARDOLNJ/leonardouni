import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useWeb3 } from "./web3-base";

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
      "Pagamento instantâneo via Base Pay (USDC)",
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
      "Suporte a Base Sepolia e Base Mainnet",
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

export interface UserSubscription {
  tierId: SubscriptionTierId;
  planName: string;
  promptsRemaining: number;
  totalPromptsQuota: number;
  promptsUsed: number;
  activeUntil: string | null; // ISO Date string
  paymentMethod: "Base Pay (USDC)" | "Card" | "Grátis";
  networkUsed?: "Base Mainnet" | "Base Sepolia";
  lastTxHash?: string;
}

interface SubscriptionContextType {
  subscription: UserSubscription;
  isModalOpen: boolean;
  openModal: (selectedPlanId?: SubscriptionTierId) => void;
  closeModal: () => void;
  selectedPlanForModal: SubscriptionTierId;
  setSelectedPlanForModal: (planId: SubscriptionTierId) => void;
  consumePrompt: () => boolean;
  subscribeToPlan: (params: {
    planId: SubscriptionTierId;
    paymentMethod: "Base Pay (USDC)" | "Card";
    network: "Base Mainnet" | "Base Sepolia";
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

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: DEFAULT_SUBSCRIPTION,
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  selectedPlanForModal: "5usdc",
  setSelectedPlanForModal: () => {},
  consumePrompt: () => true,
  subscribeToPlan: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<SubscriptionTierId>("5usdc");

  useEffect(() => {
    localStorage.setItem("ul-ai-subscription", JSON.stringify(subscription));
  }, [subscription]);

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
    network,
    txHash,
  }: {
    planId: SubscriptionTierId;
    paymentMethod: "Base Pay (USDC)" | "Card";
    network: "Base Mainnet" | "Base Sepolia";
    txHash?: string;
  }) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];

    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const updated: UserSubscription = {
      tierId: plan.id,
      planName: plan.name,
      promptsRemaining: plan.monthlyPrompts,
      totalPromptsQuota: plan.monthlyPrompts,
      promptsUsed: 0,
      activeUntil: nextMonthDate.toISOString(),
      paymentMethod,
      networkUsed: network,
      lastTxHash: txHash || `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")}`,
    };

    setSubscription(updated);
    closeModal();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isModalOpen,
        openModal,
        closeModal,
        selectedPlanForModal,
        setSelectedPlanForModal,
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
