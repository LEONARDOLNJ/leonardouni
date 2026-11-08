import React, { useState, useEffect } from "react";
import { useOfflineDocuments } from "@/lib/offline-documents";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { WifiOff, HardDrive, ArrowRight, X, CheckCircle2 } from "lucide-react";

export function OfflineStatusBanner() {
  const { isOnline, simulatedOffline, toggleSimulatedOffline, documents } = useOfflineDocuments();
  const { t } = useI18n();
  const { navigate, path } = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div className="bg-slate-900 text-white border-b border-amber-500/40 px-4 py-2 text-xs transition-all animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <WifiOff className="size-3.5" />
          </div>
          <div>
            <span className="font-bold text-amber-400">
              {simulatedOffline ? t("Modo Offline Simulado") : t("Sem Conexão à Internet")}
            </span>
            <span className="text-white/80 ml-2">
              {t("O Service Worker está a servir")} <strong>{documents.length} {t("documentos académicos em cache")}</strong> {t("com verificação criptográfica.")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {path !== "/documentos" && (
            <button
              onClick={() => navigate("/documentos")}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition cursor-pointer shadow-2xs"
            >
              <HardDrive className="size-3" />
              <span>{t("Ver Documentos Salvos")}</span>
              <ArrowRight className="size-3" />
            </button>
          )}

          {simulatedOffline && (
            <button
              onClick={() => toggleSimulatedOffline(false)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition cursor-pointer"
            >
              {t("Desactivar")}
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="size-6 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar aviso"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
