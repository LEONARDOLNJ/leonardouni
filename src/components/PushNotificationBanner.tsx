import React, { useState } from "react";
import { usePushNotifications } from "@/lib/push-notifications";
import { useI18n } from "@/lib/i18n";
import {
  Bell,
  BellRing,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
  Shield,
  Volume2,
  VolumeX,
  Send,
  Zap,
} from "lucide-react";

export function PushNotificationBanner() {
  const { t } = useI18n();
  const {
    permission,
    settings,
    updateSettings,
    requestPermission,
    triggerTestPush,
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);

  const handleEnablePush = async () => {
    setLoading(true);
    await requestPermission();
    setLoading(false);
  };

  const handleTest = async (type: "fee_deadline" | "new_receipt" | "secretary_alert") => {
    await triggerTestPush(type);
    setLastDispatched(type);
    setTimeout(() => setLastDispatched(null), 3000);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-5 shadow-xs transition-all relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            {permission === "granted" ? (
              <BellRing className="size-6 text-emerald-500 animate-pulse" />
            ) : (
              <Bell className="size-6 text-primary" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {t("Service Worker Push API")}
              </span>
              {permission === "granted" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="size-3" />
                  {t("Notificações no Navegador Ativas")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="size-3" />
                  {t("Pendente de Permissão")}
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-foreground">
              {t("Alertas Instantâneos de Propinas e Novos Recibos")}
            </h4>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {t(
                "Receba avisos no seu dispositivo sobre prazos de vencimento de propinas, novos recibos emitidos pela Secretaria Financeira e confirmações imediatas de quitação."
              )}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {permission !== "granted" ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>{loading ? t("A solicitar...") : t("Ativar Notificações Push")}</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTest("new_receipt")}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title={t("Testar alerta de novo recibo")}
              >
                <Receipt className="size-3.5" />
                <span>{t("Testar Recibo")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTest("fee_deadline")}
                className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title={t("Testar aviso de vencimento")}
              >
                <Calendar className="size-3.5" />
                <span>{t("Testar Prazo")}</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
                title={settings.soundEnabled ? t("Desativar som") : t("Ativar som")}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="size-4 text-emerald-500" />
                ) : (
                  <VolumeX className="size-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {lastDispatched && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <Zap className="size-3.5" />
            {t("Notificação Push disparada via Service Worker com sucesso!")}
          </span>
          <span className="text-[11px] opacity-80">{t("Verifique a central de notificações.")}</span>
        </div>
      )}
    </div>
  );
}
