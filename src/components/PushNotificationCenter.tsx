import React, { useState, useRef, useEffect } from "react";
import {
  usePushNotifications,
  type AppNotification,
  type PushCategory,
} from "@/lib/push-notifications";
import { useI18n } from "@/lib/i18n";
import { Link } from "@/lib/router";
import { mzn, dataPt } from "@/lib/uni-data";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Receipt,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Clock,
  Radio,
  Sliders,
} from "lucide-react";

export function PushNotificationCenter({
  variant = "header",
}: {
  variant?: "header" | "portal" | "floating";
}) {
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    permission,
    settings,
    updateSettings,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    toggleStar,
    triggerTestPush,
  } = usePushNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | PushCategory>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterCategory === "all") return true;
    return n.category === filterCategory;
  });

  const handleRequestPermission = async () => {
    setIsActivating(true);
    await requestPermission();
    setIsActivating(false);
  };

  const getCategoryIcon = (category: PushCategory) => {
    switch (category) {
      case "new_receipt":
        return <Receipt className="size-4 text-emerald-500" />;
      case "fee_deadline":
        return <Calendar className="size-4 text-amber-500" />;
      case "clearance":
        return <ShieldCheck className="size-4 text-blue-500" />;
      case "secretary_alert":
        return <AlertCircle className="size-4 text-primary" />;
      default:
        return <Bell className="size-4 text-primary" />;
    }
  };

  const getCategoryBadge = (category: PushCategory) => {
    switch (category) {
      case "new_receipt":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {t("Recibo")}
          </span>
        );
      case "fee_deadline":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {t("Prazo Propina")}
          </span>
        );
      case "clearance":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {t("Quitação")}
          </span>
        );
      case "secretary_alert":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            {t("Secretaria")}
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
            {t("Sistema")}
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center size-8 sm:size-8.5 rounded-full border transition cursor-pointer ${
            isOpen
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-xs"
          }`}
          title={t("Notificações Push da Secretaria e Propinas")}
          aria-label={t("Notificações")}
        >
          {unreadCount > 0 ? (
            <BellRing className="size-4 animate-bounce" />
          ) : (
            <Bell className="size-4" />
          )}

          {/* Unread Badge Pill */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white shadow-xs ring-2 ring-background animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {variant === "portal" && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition text-xs font-semibold shadow-xs cursor-pointer"
        >
          <div className="relative">
            <Bell className="size-4 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive" />
            )}
          </div>
          <span>{t("Notificações Push")}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
              {unreadCount} {t("novas")}
            </span>
          )}
        </button>
      )}

      {/* Popover Dropdown Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Radio className="size-4 animate-pulse text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <span>{t("Push Notifications")}</span>
                  <span className="text-[10px] font-mono font-normal text-muted-foreground">
                    (Service Worker)
                  </span>
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {t("Prazos de propinas & emissão de recibos")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showSettings
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={t("Preferências de Alerta")}
              >
                <Sliders className="size-3.5" />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  title={t("Marcar todas como lidas")}
                >
                  <CheckCheck className="size-3.5 text-emerald-500" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Permission Alert Banner */}
          {permission !== "granted" && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px] leading-tight">
                    {t("Active as Notificações no Navegador")}
                  </p>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    {t("Receba alertas em segundo plano quando um recibo for emitido ou uma propina estiver a vencer.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isActivating}
                onClick={handleRequestPermission}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="size-3.5" />
                <span>{isActivating ? t("A solicitar...") : t("Permitir Notificações Push")}</span>
              </button>
            </div>
          )}

          {/* Settings Panel Toggle */}
          {showSettings ? (
            <div className="p-4 space-y-3 bg-muted/20 border-b border-border text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Settings className="size-3.5 text-primary" />
                  {t("Configurações do Service Worker")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                  SW Ativo
                </span>
              </div>

              {/* Toggle Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="size-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-foreground">{t("Sinal Sonoro de Notificação")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${
                    settings.soundEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition ${
                      settings.soundEnabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Receipts */}
              <div className="flex items-center justify-between">
                <span className="text-foreground">{t("Alertar Novos Recibos de Propinas")}</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ notifyNewReceipts: !settings.notifyNewReceipts })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${
                    settings.notifyNewReceipts ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition ${
                      settings.notifyNewReceipts ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Deadlines */}
              <div className="flex items-center justify-between">
                <span className="text-foreground">{t("Alertar Prazos de Vencimento")}</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ notifyFeeDeadlines: !settings.notifyFeeDeadlines })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${
                    settings.notifyFeeDeadlines ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition ${
                      settings.notifyFeeDeadlines ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Fast Test Simulators */}
              <div className="pt-2 border-t border-border space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  {t("Simular Eventos Push em Tempo Real")}:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerTestPush("new_receipt")}
                    className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Receipt className="size-3" />
                    <span>{t("Testar Recibo")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestPush("fee_deadline")}
                    className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Calendar className="size-3" />
                    <span>{t("Testar Prazo")}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Category Filter Tabs */
            <div className="px-3 py-2 border-b border-border bg-background flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: "all", label: "Todas" },
                { id: "fee_deadline", label: "Prazos" },
                { id: "new_receipt", label: "Recibos" },
                { id: "secretary_alert", label: "Secretaria" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    filterCategory === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          )}

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1.5 divide-y divide-border/30">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground space-y-2">
                <Bell className="size-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">{t("Sem notificações nesta categoria.")}</p>
                <button
                  type="button"
                  onClick={() => triggerTestPush("new_receipt")}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="size-3" />
                  <span>{t("Disparar notificação de teste")}</span>
                </button>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2.5 rounded-xl transition flex gap-2.5 group relative ${
                    !notif.read
                      ? "bg-primary/5 border border-primary/15"
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  {/* Category Icon */}
                  <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-card border border-border shadow-xs flex items-center justify-center size-8">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        {getCategoryBadge(notif.category)}
                        {!notif.read && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="size-2.5" />
                        {dataPt(notif.timestamp)}
                      </span>
                    </div>

                    <h5
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs font-bold text-foreground leading-snug hover:text-primary transition cursor-pointer"
                    >
                      {notif.title}
                    </h5>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {notif.body}
                    </p>

                    {/* Action Links */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <Link
                        to={notif.url || "/portal"}
                        onClick={() => {
                          markAsRead(notif.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                      >
                        <span>
                          {notif.category === "new_receipt"
                            ? t("Abrir Recibo")
                            : notif.category === "fee_deadline"
                            ? t("Liquidar Propina")
                            : t("Ver Detalhes")}
                        </span>
                        <ExternalLink className="size-2.5" />
                      </Link>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notif.id)}
                            className="text-[10px] text-muted-foreground hover:text-emerald-600 font-semibold px-1 cursor-pointer"
                            title={t("Marcar como lida")}
                          >
                            <CheckCircle2 className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                          title={t("Remover")}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Quick Controls */}
          {filteredNotifications.length > 0 && (
            <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] hover:text-destructive transition font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>{t("Limpar histórico")}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerTestPush("new_receipt")}
                className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Zap className="size-3" />
                <span>{t("Disparar Teste Push")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
