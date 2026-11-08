import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  getSavedBiometricCredentials,
  getStudentBiometricSettings,
  saveStudentBiometricSettings,
  registerBiometricCredential,
  deleteBiometricCredential,
  isWebAuthnSupported,
  playBiometricSuccessSound,
  type BiometricCredential,
  type StudentBiometricSettings,
} from "@/lib/biometrics";
import {
  Fingerprint,
  ScanFace,
  Key,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  Smartphone,
  Laptop,
  Lock,
  RefreshCw,
  Trash2,
  Sliders,
  Camera,
  Check,
  Zap,
  Info,
  Shield,
  HelpCircle,
} from "lucide-react";

interface BiometricSecuritySettingsProps {
  studentId?: string;
  studentName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function BiometricSecuritySettingsView({
  studentId,
  studentName,
  onClose,
  isModal = false,
}: BiometricSecuritySettingsProps) {
  const { user } = useAuth();
  const { t } = useI18n();

  const currentStudentId = studentId || user?.id || "EST-2024-001";
  const currentStudentName = studentName || user?.nome || "Estudante";

  const [settings, setSettings] = useState<StudentBiometricSettings>(() =>
    getStudentBiometricSettings(currentStudentId)
  );
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [activeSubView, setActiveSubView] = useState<"overview" | "enroll_face" | "enroll_fingerprint">("overview");

  // Save feedback state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Enrollment states
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStep, setEnrollStep] = useState<number>(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollDeviceName, setEnrollDeviceName] = useState("");

  const webAuthnNative = isWebAuthnSupported();

  const loadData = () => {
    const s = getStudentBiometricSettings(currentStudentId);
    setSettings(s);
    const allCreds = getSavedBiometricCredentials();
    const studentCreds = allCreds.filter((c) => c.studentId === currentStudentId);
    setCredentials(studentCreds);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener("ul_biometric_settings_updated", handleStorage);
    return () => window.removeEventListener("ul_biometric_settings_updated", handleStorage);
  }, [currentStudentId]);

  const handleToggle = (key: keyof StudentBiometricSettings, value: any) => {
    const updated = saveStudentBiometricSettings(currentStudentId, { [key]: value });
    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRevokeCredential = (credId: string) => {
    deleteBiometricCredential(credId, currentStudentId);
    loadData();
    setActionNotice(t("Credencial biométrica revogada com sucesso."));
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Face Registration Simulator
  const startFaceEnrollment = () => {
    setActiveSubView("enroll_face");
    setEnrollProgress(0);
    setEnrollStep(1);
    setIsEnrolling(true);
    setEnrollError("");
    setEnrollDeviceName(
      navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
        ? "iPhone / iPad (TrueDepth Face ID)"
        : navigator.userAgent.includes("Mac")
        ? "MacBook (FaceMesh HD / Secure Enclave)"
        : "Dispositivo com Sensor Facial 3D"
    );

    // Step 1: Detect face & center
    setTimeout(() => {
      setEnrollStep(2);
      setEnrollProgress(35);
    }, 1200);

    // Step 2: 3D Depth mesh mapping
    setTimeout(() => {
      setEnrollStep(3);
      setEnrollProgress(70);
    }, 2800);

    // Step 3: Cryptographic keypair generation & completion
    setTimeout(() => {
      setEnrollStep(4);
      setEnrollProgress(100);
      setIsEnrolling(false);
      playBiometricSuccessSound();

      registerBiometricCredential(
        currentStudentId,
        currentStudentName,
        "face_id",
        enrollDeviceName || "Sensor Facial 3D (Face ID)",
        99.2
      );
      loadData();
      setActionNotice(t("Rosto registado com sucesso! Autenticação rápida por Face ID ativa."));
      setTimeout(() => {
        setActionNotice(null);
        setActiveSubView("overview");
      }, 2000);
    }, 4400);
  };

  // Fingerprint Registration Simulator (Multi-tap interactive)
  const startFingerprintEnrollment = () => {
    setActiveSubView("enroll_fingerprint");
    setEnrollProgress(0);
    setEnrollStep(1);
    setIsEnrolling(false);
    setEnrollError("");
    setEnrollDeviceName(
      navigator.userAgent.includes("Mac")
        ? "Touch ID (MacBook Secure Enclave)"
        : navigator.userAgent.includes("Windows")
        ? "Windows Hello (Sensor Biométrico FIDO2)"
        : "Sensor Biométrico de Impressão Digital"
    );
  };

  const handleFingerprintTap = () => {
    if (enrollProgress >= 100) return;

    const nextStep = enrollStep + 1;
    const nextProgress = Math.min(100, enrollProgress + 25);
    setEnrollStep(nextStep);
    setEnrollProgress(nextProgress);

    if (nextProgress >= 100) {
      setIsEnrolling(false);
      playBiometricSuccessSound();
      registerBiometricCredential(
        currentStudentId,
        currentStudentName,
        "fingerprint",
        enrollDeviceName || "Sensor Biométrico (Touch ID)",
        98.9
      );
      loadData();
      setActionNotice(t("Impressão digital registada com sucesso! Acesso biométrico rápido ativo."));
      setTimeout(() => {
        setActionNotice(null);
        setActiveSubView("overview");
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {t("WebAuthn FIDO2 / Passkey")}
                </span>
                <span className="text-[10px] font-bold text-white/70">
                  {webAuthnNative ? t("Suporte Nativo ao Navegador Detectado") : t("Modo de Emulação Criptográfica")}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                {t("Configuração de Segurança & Autenticação Biométrica")}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {t("Registe o seu rosto ou impressão digital para iniciar sessão instantaneamente no portal sem digitar senha.")}
              </p>
            </div>
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="self-end sm:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* OVERVIEW & ENROLLMENT SELECTOR */}
      {activeSubView === "overview" && (
        <div className="space-y-6">
          {/* Registration Cards: Face ID & Fingerprint */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* FACE ID REGISTRATION CARD */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-xl flex items-center justify-center ${
                    settings.faceRegistered
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    <ScanFace className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{t("Reconhecimento Facial (Face ID)")}</h3>
                      {settings.faceRegistered && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {t("Ativo")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings.faceRegistered
                        ? t("Mapeamento 3D registado e sincronizado com o cofre de chaves.")
                        : t("Ainda não registou o seu rosto neste dispositivo.")}
                    </p>
                  </div>
                </div>
              </div>

              {settings.faceRegistered && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{t("Dispositivo:")}</span>
                    <span className="font-mono text-foreground font-semibold">
                      {settings.faceModelName || "Sensor Facial 3D"}
                    </span>
                  </div>
                  {settings.faceRegisteredAt && (
                    <div className="flex items-center justify-between">
                      <span>{t("Registado em:")}</span>
                      <span>{new Date(settings.faceRegisteredAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startFaceEnrollment}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  <Camera className="size-3.5" />
                  <span>{settings.faceRegistered ? t("Atualizar / Re-escanear Rosto") : t("Registar Rosto (Face ID)")}</span>
                </button>

                {settings.faceRegistered && (
                  <button
                    type="button"
                    onClick={() => {
                      const faceCred = credentials.find((c) => c.type === "face_id");
                      if (faceCred) handleRevokeCredential(faceCred.id);
                      else {
                        saveStudentBiometricSettings(currentStudentId, { faceRegistered: false });
                        loadData();
                      }
                    }}
                    className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition cursor-pointer"
                    title={t("Remover Face ID")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* TOUCH ID / FINGERPRINT REGISTRATION CARD */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-xl flex items-center justify-center ${
                    settings.fingerprintRegistered
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    <Fingerprint className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{t("Impressão Digital (Touch ID)")}</h3>
                      {settings.fingerprintRegistered && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {t("Ativo")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings.fingerprintRegistered
                        ? t("Cristas papilares criptografadas no Enclave Seguro do hardware.")
                        : t("Nenhuma impressão digital associada à sua conta.")}
                    </p>
                  </div>
                </div>
              </div>

              {settings.fingerprintRegistered && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{t("Sensor:")}</span>
                    <span className="font-mono text-foreground font-semibold">
                      {settings.fingerprintDeviceName || "Touch ID / FIDO2"}
                    </span>
                  </div>
                  {settings.fingerprintRegisteredAt && (
                    <div className="flex items-center justify-between">
                      <span>{t("Registado em:")}</span>
                      <span>{new Date(settings.fingerprintRegisteredAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startFingerprintEnrollment}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  <Fingerprint className="size-3.5" />
                  <span>{settings.fingerprintRegistered ? t("Atualizar / Adicionar Digital") : t("Registar Impressão Digital")}</span>
                </button>

                {settings.fingerprintRegistered && (
                  <button
                    type="button"
                    onClick={() => {
                      const fingerCred = credentials.find((c) => c.type === "fingerprint");
                      if (fingerCred) handleRevokeCredential(fingerCred.id);
                      else {
                        saveStudentBiometricSettings(currentStudentId, { fingerprintRegistered: false });
                        loadData();
                      }
                    }}
                    className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition cursor-pointer"
                    title={t("Remover Touch ID")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* USER PREFERENCES SECTION */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  {t("Preferências de Autenticação Rápida & Segurança")}
                </h3>
              </div>
              {saveSuccess && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="size-3.5" />
                  {t("Preferências guardadas")}
                </span>
              )}
            </div>

            <div className="divide-y divide-border space-y-4">
              {/* FAST LOGIN TOGGLE */}
              <div className="flex items-center justify-between gap-4 pt-3 first:pt-0">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    {t("Autenticação Rápida no Portal (Fast Login)")}
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Permite iniciar sessão no portal com 1 toque no sensor biométrico sem digitar senha.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("fastLoginEnabled", !settings.fastLoginEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.fastLoginEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.fastLoginEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* PAYMENTS BIOMETRIC PROTECTION */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    {t("Confirmação Biométrica para Pagamentos de Propinas")}
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Exige confirmação por Face ID / Touch ID antes de autorizar liquidações financeiras e USSD M-Pesa.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("biometricPaymentsEnabled", !settings.biometricPaymentsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.biometricPaymentsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.biometricPaymentsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* CLEARANCE & GRADES PROTECTION */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    {t("Proteção para Emissão de Certificados e Declarações")}
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Solicita validação biométrica antes de transferir declarações de quitação e histórico escolar.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("requireBiometricsForClearance", !settings.requireBiometricsForClearance)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.requireBiometricsForClearance ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.requireBiometricsForClearance ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* PREFERRED METHOD SELECTOR */}
              <div className="pt-4 space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  {t("Método Biométrico Preferencial")}
                </label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { id: "face_id", label: "Face ID (Facial)", icon: ScanFace },
                    { id: "fingerprint", label: "Touch ID (Digital)", icon: Fingerprint },
                    { id: "passkey", label: "Passkey / TPM 2.0", icon: Key },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = settings.preferredMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggle("preferredMethod", m.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary shadow-xs"
                            : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* REGISTERED WEBAUTHN CREDENTIALS TABLE */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Lock className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  {t("Chaves de Acesso e Dispositivos Registados (Credenciais)")}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {credentials.length} {t("dispositivos")}
              </span>
            </div>

            {credentials.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Shield className="size-8 mx-auto opacity-30 mb-2" />
                {t("Nenhum dispositivo biométrico registado. Utilize os botões acima para registar o seu rosto ou impressão digital.")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {credentials.map((c) => (
                  <div key={c.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        {c.type === "face_id" && <ScanFace className="size-4" />}
                        {c.type === "fingerprint" && <Fingerprint className="size-4" />}
                        {c.type === "passkey" && <Key className="size-4" />}
                        {c.type === "security_key" && <Lock className="size-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{c.deviceName}</span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {c.biometricScore ? `${c.biometricScore}% match` : "FIDO2"}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {c.publicKeyFingerprint}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {new Date(c.registeredAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevokeCredential(c.id)}
                        className="px-2.5 py-1 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition cursor-pointer"
                      >
                        {t("Revogar")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW: INTERACTIVE 3D FACE ID ENROLLMENT SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubView === "enroll_face" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-md max-w-xl mx-auto text-center animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ScanFace className="size-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">{t("Assistente de Registo Facial (Face ID)")}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubView("overview")}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scanner Simulation Display */}
          <div className="relative mx-auto size-64 rounded-full border-4 border-dashed border-emerald-400/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden shadow-2xl">
            {/* Live radar scanner line */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] animate-pulse" />
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce duration-1000" />

            {/* Target 3D Face Frame */}
            <div className="relative size-32 rounded-full border-2 border-emerald-400/80 flex items-center justify-center">
              <ScanFace className="size-20 text-emerald-300 animate-pulse" />
              
              {/* Landmark points animation */}
              <div className="absolute top-8 left-8 size-1.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="absolute top-8 right-8 size-1.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="absolute bottom-8 inset-x-0 mx-auto size-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Progress Circular ring text */}
            <div className="absolute bottom-4 text-xs font-mono font-bold text-emerald-300">
              {enrollProgress}%
            </div>
          </div>

          {/* Steps Feedback */}
          <div className="space-y-2 max-w-sm mx-auto">
            <h4 className="font-bold text-sm text-foreground">
              {enrollStep === 1 && t("1. A centrar rosto na câmara...")}
              {enrollStep === 2 && t("2. A verificar iluminação e contraste...")}
              {enrollStep === 3 && t("3. A mapear malha 3D e geometria facial...")}
              {enrollStep === 4 && t("4. A gerar par de chaves no Enclave Seguro...")}
            </h4>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${enrollProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Mantenha o seu rosto imóvel e olhe diretamente para a câmara do dispositivo.")}
            </p>
          </div>

          {enrollProgress === 100 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {t("✓ Mapeamento biométrico facial concluído e guardado com sucesso!")}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW: INTERACTIVE TOUCH ID / FINGERPRINT ENROLLMENT SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubView === "enroll_fingerprint" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-md max-w-xl mx-auto text-center animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="size-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">{t("Assistente de Registo de Impressão Digital")}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubView("overview")}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {t("Toque repetidamente no sensor de impressão digital abaixo para capturar todas as áreas do seu dedo.")}
            </p>

            {/* Interactive Tap Pad */}
            <button
              type="button"
              onClick={handleFingerprintTap}
              className="group relative mx-auto flex flex-col items-center justify-center cursor-pointer p-6"
            >
              <div className="relative size-32 rounded-full border-4 border-dashed border-emerald-400/80 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-105 transition-all">
                <Fingerprint className="size-20 group-hover:scale-110 transition duration-200" />
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping opacity-20" />
              </div>
              <span className="mt-3 text-xs font-bold text-primary group-hover:underline">
                {enrollProgress >= 100 ? t("✓ Registo Completo") : t("Clique / Toque aqui para ler o dedo")}
              </span>
            </button>

            {/* Progress breakdown */}
            <div className="space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">{t("Progresso de Captura")}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{enrollProgress}%</span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-200 rounded-full shadow-[0_0_8px_#10b981]"
                  style={{ width: `${enrollProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-2 text-[10px] font-bold">
                <span className={`p-1.5 rounded-lg border ${enrollProgress >= 25 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40" : "bg-muted text-muted-foreground border-border"}`}>
                  Centro
                </span>
                <span className={`p-1.5 rounded-lg border ${enrollProgress >= 50 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40" : "bg-muted text-muted-foreground border-border"}`}>
                  Superior
                </span>
                <span className={`p-1.5 rounded-lg border ${enrollProgress >= 75 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40" : "bg-muted text-muted-foreground border-border"}`}>
                  Bordas
                </span>
                <span className={`p-1.5 rounded-lg border ${enrollProgress >= 100 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40" : "bg-muted text-muted-foreground border-border"}`}>
                  Chave
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BiometricSecuritySettingsModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-background border border-border/80 text-foreground rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto p-4 sm:p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <BiometricSecuritySettingsView
          studentId={studentId}
          studentName={studentName}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
}
