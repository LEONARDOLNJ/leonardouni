import { useState, useEffect, useCallback } from "react";
import { dataPt, mzn, UNIVERSITY, type Student, type Fee, type Payment } from "./uni-data";

export type PushCategory =
  | "fee_deadline"
  | "new_receipt"
  | "clearance"
  | "secretary_alert"
  | "system";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: PushCategory;
  timestamp: string;
  studentId?: string;
  studentName?: string;
  receiptNo?: string;
  feeName?: string;
  amount?: number;
  dueDate?: string;
  daysLeft?: number;
  url: string;
  read: boolean;
  starred?: boolean;
}

const STORAGE_KEY = "ul_push_notifications_history_v2";
const SETTINGS_KEY = "ul_push_notification_settings_v1";

export interface PushSettings {
  enabled: boolean;
  soundEnabled: boolean;
  notifyFeeDeadlines: boolean;
  notifyNewReceipts: boolean;
  notifySecretaryAlerts: boolean;
  deadlineDaysThreshold: number; // 7, 3, 1 days before
}

const DEFAULT_SETTINGS: PushSettings = {
  enabled: true,
  soundEnabled: true,
  notifyFeeDeadlines: true,
  notifyNewReceipts: true,
  notifySecretaryAlerts: true,
  deadlineDaysThreshold: 5,
};

// Play a gentle dual-frequency audio chime using Web Audio API
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    // Pleasant high melodic chime D5 -> A5 (587Hz -> 880Hz)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  } catch {
    // Audio Context might be restricted before user gesture
  }
}

// Initial pre-seeded notifications for demonstration
export function getInitialNotifications(): AppNotification[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 20 * 60 * 1000).toISOString(); // 20 mins ago
  const d2 = new Date(now.getTime() - 3 * 3600 * 1000).toISOString(); // 3 hours ago
  const d3 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString(); // 1 day ago
  const d4 = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(); // 3 days ago

  return [
    {
      id: "NOTIF-REC-01",
      title: "📄 Novo Recibo Emitido pela Secretaria",
      body: "O recibo nº 2026/08-9412 (8.500,00 MT - Propina de Agosto) foi emitido e autenticado digitalmente.",
      category: "new_receipt",
      timestamp: d1,
      studentId: "EST-2024-001",
      studentName: "Leonardo Júnior Nhantumbo",
      receiptNo: "2026/08-9412",
      amount: 8500,
      url: "/recibos",
      read: false,
      starred: true,
    },
    {
      id: "NOTIF-DEADLINE-01",
      title: "⏰ Alerta de Prazo: Propina de Setembro",
      body: "Atenção: A propina do mês de Setembro (8.500,00 MT) vence em 5 dias (05/09/2026). Evite a sobretaxa de 10%.",
      category: "fee_deadline",
      timestamp: d2,
      studentId: "EST-2024-001",
      feeName: "Propina Mensal - Setembro 2026",
      amount: 8500,
      dueDate: "2026-09-05",
      daysLeft: 5,
      url: "/propinas",
      read: false,
    },
    {
      id: "NOTIF-CLEARANCE-01",
      title: "🎓 Certidão de Quitação Financeira Pronta",
      body: "O seu Certificado de Quitação de Propinas foi emitido e armazenado no seu cache offline para acesso imediato.",
      category: "clearance",
      timestamp: d3,
      studentId: "EST-2024-001",
      url: "/documentos",
      read: true,
    },
    {
      id: "NOTIF-SEC-01",
      title: "🏛️ Comunicado da Direcção Financeira",
      body: "Informamos que o pagamento via M-Pesa e Débito Direto já emite confirmação instantânea por Push e SMS.",
      category: "secretary_alert",
      timestamp: d4,
      url: "/portal",
      read: true,
    },
  ];
}

// Check push notifications capability
export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

export function getPushPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// Request Notification Permission from Browser
export async function requestPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn("[Push] Error requesting notification permission:", err);
    return Notification.permission;
  }
}

// Dispatch push notification via Service Worker & store in history
export async function dispatchPushNotification(
  notification: Omit<AppNotification, "id" | "timestamp" | "read"> & {
    id?: string;
    timestamp?: string;
    read?: boolean;
  }
): Promise<AppNotification> {
  const finalNotification: AppNotification = {
    id: notification.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: notification.title,
    body: notification.body,
    category: notification.category,
    timestamp: notification.timestamp || new Date().toISOString(),
    studentId: notification.studentId,
    studentName: notification.studentName,
    receiptNo: notification.receiptNo,
    feeName: notification.feeName,
    amount: notification.amount,
    dueDate: notification.dueDate,
    daysLeft: notification.daysLeft,
    url: notification.url || "/portal",
    read: false,
    starred: notification.starred || false,
  };

  // 1. Save to local storage history
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AppNotification[] = stored ? JSON.parse(stored) : getInitialNotifications();
      const updated = [finalNotification, ...list.filter((n) => n.id !== finalNotification.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Emit custom window event for reactive UI updates
      window.dispatchEvent(
        new CustomEvent("ul_new_push_notification", { detail: finalNotification })
      );
    } catch (e) {
      console.warn("[Push] Failed to persist notification history:", e);
    }

    // 2. Play sound chime
    const settingsStr = localStorage.getItem(SETTINGS_KEY);
    const settings: PushSettings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SETTINGS;
    if (settings.soundEnabled) {
      playNotificationChime();
    }
  }

  // 3. Trigger Service Worker Native System Notification if supported & granted
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg && Notification.permission === "granted") {
        const options: any = {
          body: finalNotification.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: finalNotification.id,
          renotify: true,
          data: {
            url: finalNotification.url,
            id: finalNotification.id,
            category: finalNotification.category,
          },
          actions: [
            {
              action: finalNotification.category === "new_receipt" ? "view_receipt" : "view_portal",
              title: finalNotification.category === "new_receipt" ? "📄 Ver Recibo" : "💳 Ver no Portal",
            },
            {
              action: "dismiss",
              title: "Dispensar",
            },
          ],
        };
        await reg.showNotification(finalNotification.title, options);
      } else if (navigator.serviceWorker.controller) {
        // Fallback: post message to SW
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: {
            title: finalNotification.title,
            body: finalNotification.body,
            icon: "/favicon.ico",
            tag: finalNotification.id,
            data: { url: finalNotification.url, id: finalNotification.id },
          },
        });
      }
    } catch (swErr) {
      console.warn("[Push] Service worker notification trigger fallback:", swErr);
    }
  }

  return finalNotification;
}

// React Hook for Managing Push Notifications
export function usePushNotifications(currentStudentId = "EST-2024-001") {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  // Initialize and load notifications
  useEffect(() => {
    if (typeof window === "undefined") return;

    setPermission(getPushPermissionState());

    // Load settings
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch {}
    }

    // Load notifications
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        } else {
          const init = getInitialNotifications();
          setNotifications(init);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        }
      } catch {
        const init = getInitialNotifications();
        setNotifications(init);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      }
    } else {
      const init = getInitialNotifications();
      setNotifications(init);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    }

    // Listen for real-time push events within the app
    const handleNewNotification = (e: any) => {
      const newNotif: AppNotification = e.detail;
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
    };

    window.addEventListener("ul_new_push_notification", handleNewNotification);

    return () => {
      window.removeEventListener("ul_new_push_notification", handleNewNotification);
    };
  }, []);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<PushSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    const res = await requestPushPermission();
    setPermission(res);
    if (res === "granted") {
      updateSettings({ enabled: true });
      // Send confirmation push
      await dispatchPushNotification({
        title: "🔔 Notificações Push Activadas com Sucesso!",
        body: "A partir de agora receberá alertas instantâneos de prazos de propinas e emissão de recibos.",
        category: "system",
        url: "/portal",
      });
    }
    return res;
  }, [updateSettings]);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Toggle star
  const toggleStar = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Dispatch interactive test push
  const triggerTestPush = useCallback(
    async (type: "fee_deadline" | "new_receipt" | "secretary_alert") => {
      if (type === "fee_deadline") {
        await dispatchPushNotification({
          title: "⏰ Alerta de Vencimento: Propina Mensal",
          body: "A propina de Agosto/2026 no valor de 8.500,00 MT atinge o prazo de liquidação em breve. Regularize para evitar multas.",
          category: "fee_deadline",
          studentId: currentStudentId,
          feeName: "Propina de Agosto",
          amount: 8500,
          dueDate: "2026-08-31",
          daysLeft: 3,
          url: "/propinas",
        });
      } else if (type === "new_receipt") {
        const randRec = `REC-2026/${Math.floor(1000 + Math.random() * 9000)}`;
        await dispatchPushNotification({
          title: "📄 Novo Recibo Emitido pela Secretaria",
          body: `O recibo oficial nº ${randRec} (8.500,00 MT) foi emitido e está pronto para download autenticado.`,
          category: "new_receipt",
          studentId: currentStudentId,
          receiptNo: randRec,
          amount: 8500,
          url: "/recibos",
        });
      } else {
        await dispatchPushNotification({
          title: "🏛️ Comunicado Oficial da Direcção Financeira",
          body: "As inscrições para a Época Especial e exames de melhoria de nota encontram-se abertas no Portal.",
          category: "secretary_alert",
          url: "/portal",
        });
      }
    },
    [currentStudentId]
  );

  // Secretary Broadcast Alert Helper
  const sendSecretaryBroadcast = useCallback(
    async (payload: {
      title: string;
      body: string;
      category: PushCategory;
      studentId?: string;
      studentName?: string;
      receiptNo?: string;
      amount?: number;
      dueDate?: string;
      url?: string;
    }) => {
      return await dispatchPushNotification({
        title: payload.title,
        body: payload.body,
        category: payload.category,
        studentId: payload.studentId,
        studentName: payload.studentName,
        receiptNo: payload.receiptNo,
        amount: payload.amount,
        dueDate: payload.dueDate,
        url: payload.url || "/portal",
      });
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
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
    sendSecretaryBroadcast,
    isPromptOpen,
    setIsPromptOpen,
  };
}
