import React from "react";
import { useWeb3 } from "@/lib/web3-base";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";

export function BaseLogoSvg({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="#0052FF" />
      <path
        d="M16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25Z"
        fill="white"
      />
      <path
        d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21Z"
        fill="#0052FF"
      />
      <rect x="15" y="7" width="10" height="9" fill="#0052FF" />
    </svg>
  );
}

interface SignInWithBaseButtonProps {
  variant?: "primary" | "outline" | "compact" | "header";
  className?: string;
  onClick?: () => void;
}

export function SignInWithBaseButton({
  variant = "primary",
  className = "",
  onClick,
}: SignInWithBaseButtonProps) {
  const { t } = useI18n();
  const { signInWithBase, isConnecting, address, walletType } = useWeb3();
  const { baseSession } = useAuth();

  const handleSignIn = async () => {
    if (onClick) {
      onClick();
    } else {
      await signInWithBase();
    }
  };

  const isBaseAuth = walletType === "base" && address;
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isConnecting}
        className={`inline-flex items-center gap-1.5 rounded-full bg-white text-[#0052FF] hover:bg-blue-50 active:bg-blue-100 px-3 py-1 text-xs font-black shadow-md transition-all duration-150 disabled:opacity-60 cursor-pointer shrink-0 border-2 border-[#0052FF] ${className}`}
        title={isBaseAuth ? `Base Account Autenticado: ${address}` : "Sign in with Base Account"}
      >
        <BaseLogoSvg className="size-4 shrink-0" />
        <span className="whitespace-nowrap font-sans font-extrabold tracking-tight flex items-center gap-1">
          {isConnecting ? (
            t("A autenticar...")
          ) : isBaseAuth ? (
            <>
              <span>Base ({shortAddr})</span>
              <ShieldCheck className="size-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
            </>
          ) : (
            "Sign in with Base"
          )}
        </span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isConnecting}
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#0052FF] hover:bg-[#0045D8] text-white px-3 py-1 text-xs font-bold shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer border border-white/30 ${className}`}
        title="Sign in with Base Account"
      >
        <BaseLogoSvg className="size-3.5 shrink-0" />
        <span className="whitespace-nowrap flex items-center gap-1">
          {isConnecting ? t("A autenticar...") : isBaseAuth ? `Base ${shortAddr}` : "Sign in with Base"}
          {isBaseAuth && <ShieldCheck className="size-3 text-emerald-300" />}
        </span>
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isConnecting}
        className={`inline-flex items-center justify-center gap-2 rounded-md border border-[#0052FF] bg-transparent text-[#0052FF] dark:text-blue-400 hover:bg-[#0052FF]/10 active:bg-[#0052FF]/20 px-3 py-1.5 text-xs font-bold transition-all duration-150 disabled:opacity-60 cursor-pointer ${className}`}
      >
        <BaseLogoSvg className="size-4 shrink-0" />
        <span className="whitespace-nowrap flex items-center gap-1">
          {isConnecting ? t("A autenticar...") : isBaseAuth ? `Autenticado (${shortAddr})` : "Sign in with Base"}
          {isBaseAuth && <ShieldCheck className="size-3.5 text-emerald-500" />}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isConnecting}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#0052FF] hover:bg-[#0045D8] active:bg-[#0039B3] text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all duration-150 disabled:opacity-60 cursor-pointer w-full ${className}`}
    >
      <BaseLogoSvg className="size-4 shrink-0" />
      <span className="whitespace-nowrap flex items-center gap-1">
        {isConnecting ? t("A autenticar com Base...") : isBaseAuth ? `Sessão Iniciada: Base (${shortAddr})` : "Sign in with Base"}
        {isBaseAuth && <ShieldCheck className="size-4 text-emerald-300 fill-emerald-950/40" />}
      </span>
    </button>
  );
}


