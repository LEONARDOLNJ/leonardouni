import React from "react";
import { useWeb3 } from "@/lib/web3-base";
import { useSubscription } from "@/lib/subscription-store";
import { useI18n } from "@/lib/i18n";
import { SignInWithBaseButton } from "@/components/SignInWithBaseButton";
import { Wallet, LogOut, Zap } from "lucide-react";

export function Web3AuthButtons({ showBaseButton = true }: { showBaseButton?: boolean }) {
  const { t } = useI18n();
  const {
    address,
    walletType,
    isConnecting,
    signInWithEthereum,
    disconnectWallet,
  } = useWeb3();

  const { subscription, openModal } = useSubscription();

  return (
    <div className="flex items-center gap-2 border-l border-primary-foreground/20 pl-2 sm:pl-3">
      {/* Subscription Base Pay Badge */}
      <button
        onClick={() => openModal()}
        className="flex items-center gap-1 rounded-sm bg-blue-500/20 border border-blue-400/40 px-2 py-0.5 text-[11px] font-bold text-blue-200 hover:bg-blue-500/30 transition shrink-0"
        title={t("Subscrição Base Pay (USDC)")}
      >
        <Zap className="size-3 fill-amber-400 text-amber-400" />
        <span className="font-mono">{subscription.promptsRemaining} Prompts</span>
      </button>

      {address ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-xs text-amber-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <span className="text-[10px] bg-blue-600/60 text-white px-1.5 py-0.2 rounded font-medium ml-1 uppercase">
              {walletType === "base" ? "Base" : "ETH"}
            </span>
          </div>

          <button
            onClick={disconnectWallet}
            title={t("Desconectar carteira")}
            className="rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition"
          >
            <LogOut className="size-3.5 text-red-200" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {/* Sign in with Base Button */}
          {showBaseButton && <SignInWithBaseButton variant="compact" />}

          {/* Sign in with MetaMask */}
          <button
            type="button"
            onClick={() => signInWithEthereum()}
            disabled={isConnecting}
            className="flex items-center gap-1.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 px-2.5 py-1 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            title={t("Sign in with MetaMask (Ethereum / Base)")}
          >
            <Wallet className="size-3.5 text-amber-300 shrink-0" />
            <span className="whitespace-nowrap">
              {isConnecting ? t("A conectar...") : "MetaMask"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
