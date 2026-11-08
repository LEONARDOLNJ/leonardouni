import React, { useState, useEffect } from "react";
import { useRole, WORKER_PRESETS, type WorkerProfile } from "@/lib/role";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { UniversityLogo } from "./UniversityLogo";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Building,
  UserCheck,
  Smartphone,
  Fingerprint,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Terminal,
  Clock,
  Radio,
  FileKey,
} from "lucide-react";

interface AdvancedWorkerLoginFormProps {
  onSuccess?: () => void;
}

export function AdvancedWorkerLoginForm({ onSuccess }: AdvancedWorkerLoginFormProps) {
  const { t } = useI18n();
  const { setRole, setWorkerProfile } = useRole();
  const { navigate } = useRouter();

  // Selected preset or custom entry
  const [selectedStaffId, setSelectedStaffId] = useState<string>("FUNC-DIR-001");
  const [staffIdentifier, setStaffIdentifier] = useState<string>("secretaria.financas@ul.ac.mz");
  const [staffPassword, setStaffPassword] = useState<string>("admin@ul2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // MFA Flow
  const [mfaStep, setMfaStep] = useState<"credentials" | "mfa_challenge" | "pin_verification">("credentials");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "sms" | "fido2">("totp");
  const [totpCode, setTotpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [smsOtpSent, setSmsOtpSent] = useState<boolean>(false);
  const [simulatedSmsCode, setSimulatedSmsCode] = useState<string>("784109");
  const [treasuryPin, setTreasuryPin] = useState<string[]>(["", "", "", ""]);

  // Hardware FIDO2 WebAuthn state
  const [fidoScanning, setFidoScanning] = useState<boolean>(false);
  const [fidoSuccess, setFidoSuccess] = useState<boolean>(false);

  // General State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [securityStatus, setSecurityStatus] = useState<{
    ip: string;
    tls: string;
    authEnclave: string;
  }>({
    ip: "197.249.12.84 (Maputo, MZ)",
    tls: "TLS 1.3 / ChaCha20-Poly1305 (256-bit)",
    authEnclave: "HSM-FIPS-140-2 Level 3",
  });

  // Current selected profile
  const matchedProfile =
    WORKER_PRESETS.find(
      (w) =>
        w.id.toLowerCase() === selectedStaffId.toLowerCase() ||
        w.email.toLowerCase() === staffIdentifier.trim().toLowerCase() ||
        w.id.toLowerCase() === staffIdentifier.trim().toLowerCase()
    ) || WORKER_PRESETS[0];

  // Auto-fill when selecting quick presets
  const handleSelectPreset = (preset: WorkerProfile) => {
    setSelectedStaffId(preset.id);
    setStaffIdentifier(preset.email);
    setStaffPassword("admin@ul2026");
    setError("");
    setMfaStep("credentials");
    setTotpCode(["", "", "", "", "", ""]);
    setTreasuryPin(["", "", "", ""]);
  };

  // Step 1: Validate Credentials
  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffIdentifier.trim()) {
      setError(t("Introduza o seu email institucional ou ID de funcionário."));
      return;
    }
    if (!staffPassword) {
      setError(t("Introduza a sua senha institucional."));
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      // If MFA is required for level 2 & 3 or mfaEnabled
      if (matchedProfile.mfaEnabled || matchedProfile.accessLevel >= 2) {
        setMfaStep("mfa_challenge");
      } else {
        finalizeLogin(matchedProfile);
      }
    }, 600);
  };

  // Step 2: Validate MFA (TOTP / SMS / FIDO2)
  const handleVerifyMfa = () => {
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      // Next: If level 3 (SuperAdmin/Secretário Financeiro), require Treasury PIN
      if (matchedProfile.accessLevel === 3 || matchedProfile.role === "treasury") {
        setMfaStep("pin_verification");
      } else {
        finalizeLogin(matchedProfile);
      }
    }, 700);
  };

  // Trigger simulated FIDO2 / YubiKey tap
  const handleFido2Scan = () => {
    setFidoScanning(true);
    setError("");
    setTimeout(() => {
      setFidoScanning(false);
      setFidoSuccess(true);
      // Play brief subtle chime if audio context allows
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {}

      setTimeout(() => {
        if (matchedProfile.accessLevel === 3 || matchedProfile.role === "treasury") {
          setMfaStep("pin_verification");
        } else {
          finalizeLogin(matchedProfile);
        }
      }, 800);
    }, 1200);
  };

  // Step 3: Validate Treasury PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const pinStr = treasuryPin.join("");
    if (pinStr.length < 4) {
      setError(t("Introduza o PIN de Tesouraria completo de 4 dígitos."));
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      finalizeLogin(matchedProfile);
    }, 500);
  };

  // Finalize & Establish Worker Session
  const finalizeLogin = (profile: WorkerProfile) => {
    setRole("worker");
    setWorkerProfile(profile);

    // Save session metadata
    localStorage.setItem("ul_app_active_role", "worker");
    localStorage.setItem("ul_app_worker_profile", JSON.stringify(profile));
    localStorage.setItem(
      "ul_app_worker_session",
      JSON.stringify({
        authenticatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        staffId: profile.id,
        level: profile.accessLevel,
      })
    );

    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/painel-funcionario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Header with Security Badge */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 size-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-inner shrink-0">
              <Building className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {t("Gabinete Administrativo & Finanças")}
                </span>
                <span className="text-[11px] text-white/60">Sistema de Acesso Restrito</span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-extrabold text-white mt-0.5">
                {t("Portal de Acesso para Secretários & Staff")}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-xs">
              <ShieldCheck className="size-3.5" />
              <span>TLS 1.3 HSM Protegido</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Authentication Box */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          {/* Breadcrumb Steps Indicator */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  mfaStep === "credentials"
                    ? "bg-primary text-primary-foreground"
                    : "bg-emerald-500/20 text-emerald-500 font-extrabold"
                }`}
              >
                {mfaStep !== "credentials" ? "✓" : "1"}
              </div>
              <span
                className={`font-semibold ${
                  mfaStep === "credentials" ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {t("Credenciais")}
              </span>
            </div>

            <div className="w-6 border-t border-border" />

            <div className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  mfaStep === "mfa_challenge"
                    ? "bg-primary text-primary-foreground"
                    : mfaStep === "pin_verification"
                    ? "bg-emerald-500/20 text-emerald-500 font-extrabold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {mfaStep === "pin_verification" ? "✓" : "2"}
              </div>
              <span
                className={`font-semibold ${
                  mfaStep === "mfa_challenge" ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {t("2FA / Token")}
              </span>
            </div>

            <div className="w-6 border-t border-border" />

            <div className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  mfaStep === "pin_verification"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span
                className={`font-semibold ${
                  mfaStep === "pin_verification" ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {t("PIN Tesouraria")}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {mfaStep === "credentials" && (
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    {t("Email Institucional ou ID do Funcionário")}
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ex: secretaria.financas@ul.ac.mz
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value)}
                    placeholder="funcionario@ul.ac.mz ou FUNC-DIR-001"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-mono text-muted-foreground/80 pointer-events-none">
                    @ul.ac.mz
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">{t("Senha Institucional de Acesso")}</label>
                  <span className="text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                    {t("Ajuda TI / Helpdesk")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-input bg-background pr-10 pl-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Verified Identity Badge Preview */}
              {matchedProfile && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={matchedProfile.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                      alt={matchedProfile.name}
                      className="size-10 rounded-full object-cover border border-amber-400/40 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{matchedProfile.name}</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                          Nível {matchedProfile.accessLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {matchedProfile.cargo} · {matchedProfile.department}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="size-5 text-amber-500 shrink-0" />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                <span>{t("Verificar Credenciais & Prosseguir para 2FA")}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </form>
          )}

          {/* STEP 2: MFA CHALLENGE (TOTP / SMS / FIDO2) */}
          {mfaStep === "mfa_challenge" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {t("Autenticação de Dois Factores (2FA Obrigatório)")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("Acesso privilegiado de Nível")} {matchedProfile.accessLevel} {t("exige verificação criptográfica.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaStep("credentials")}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  {t("Voltar")}
                </button>
              </div>

              {/* MFA Method Switcher */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMfaMethod("totp")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    mfaMethod === "totp"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Key className="size-4" />
                  <span>Google / TOTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaMethod("sms")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    mfaMethod === "sms"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="size-4" />
                  <span>SMS OTP (+258)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaMethod("fido2")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    mfaMethod === "fido2"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Fingerprint className="size-4" />
                  <span>YubiKey / FIDO2</span>
                </button>
              </div>

              {/* TOTP 6-Digit input */}
              {mfaMethod === "totp" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {t("Abra a sua aplicação Google Authenticator ou Microsoft Authenticator e introduza o código de 6 dígitos:")}
                  </p>

                  <div className="flex justify-center gap-2">
                    {totpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`totp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          const newCode = [...totpCode];
                          newCode[idx] = val;
                          setTotpCode(newCode);
                          if (val && idx < 5) {
                            const next = document.getElementById(`totp-${idx + 1}`);
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !totpCode[idx] && idx > 0) {
                            const prev = document.getElementById(`totp-${idx - 1}`);
                            prev?.focus();
                          }
                        }}
                        className="size-11 rounded-xl border-2 border-input bg-background text-center font-mono text-lg font-bold text-foreground focus:border-primary focus:outline-none"
                      />
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setTotpCode(["8", "4", "2", "1", "9", "0"])}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {t("Preenchimento Rápido Token Demo (842190)")}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={loading || totpCode.join("").length < 6}
                    onClick={handleVerifyMfa}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    <span>{t("Validar Token & Avançar")}</span>
                  </button>
                </div>
              )}

              {/* SMS OTP verification */}
              {mfaMethod === "sms" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{t("Número de Telefone Registado:")}</span>
                      <strong className="text-foreground font-mono">{matchedProfile.phone || "+258 84 312 9901"}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSmsOtpSent(true);
                        setSimulatedSmsCode(Math.floor(100000 + Math.random() * 900000).toString());
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                    >
                      {smsOtpSent ? t("Reenviar SMS") : t("Enviar Código SMS")}
                    </button>
                  </div>

                  {smsOtpSent && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                      <span>SMS Enviado! Código de Teste: <strong className="font-mono">{simulatedSmsCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setTotpCode(simulatedSmsCode.split(""));
                          handleVerifyMfa();
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                      >
                        Auto-Preencher & Validar
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loading || !smsOtpSent}
                    onClick={handleVerifyMfa}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span>{t("Confirmar Código SMS")}</span>
                  </button>
                </div>
              )}

              {/* FIDO2 / YubiKey WebAuthn sensor */}
              {mfaMethod === "fido2" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {t("Insira a sua chave YubiKey / FIDO2 no terminal ou utilize a biometria Touch ID do seu computador:")}
                  </p>

                  <div className="py-6 flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={handleFido2Scan}
                      disabled={fidoScanning}
                      className={`size-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        fidoSuccess
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                          : fidoScanning
                          ? "bg-amber-500/20 text-amber-500 animate-pulse border-2 border-amber-500"
                          : "bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/40 hover:scale-105"
                      }`}
                    >
                      {fidoSuccess ? (
                        <CheckCircle2 className="size-10" />
                      ) : (
                        <Fingerprint className="size-10" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-foreground mt-3">
                      {fidoScanning
                        ? t("A ler chave criptográfica FIDO2...")
                        : fidoSuccess
                        ? t("Chave FIDO2 Autenticada!")
                        : t("Toque no sensor biométrico ou YubiKey")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TREASURY PIN VERIFICATION */}
          {mfaStep === "pin_verification" && (
            <form onSubmit={handleVerifyPin} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {t("PIN de Autorização de Tesouraria")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("Autorização para emissão de guias e controlo de liquidações financeiras.")}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/20">
                  Nível 3 Requerido
                </span>
              </div>

              <div className="py-4 space-y-4">
                <div className="flex justify-center gap-3">
                  {treasuryPin.map((pDigit, pIdx) => (
                    <input
                      key={pIdx}
                      id={`pin-${pIdx}`}
                      type="password"
                      maxLength={1}
                      value={pDigit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const newPin = [...treasuryPin];
                        newPin[pIdx] = val;
                        setTreasuryPin(newPin);
                        if (val && pIdx < 3) {
                          const nextPin = document.getElementById(`pin-${pIdx + 1}`);
                          nextPin?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !treasuryPin[pIdx] && pIdx > 0) {
                          const prevPin = document.getElementById(`pin-${pIdx - 1}`);
                          prevPin?.focus();
                        }
                      }}
                      className="size-12 rounded-xl border-2 border-input bg-background text-center font-mono text-xl font-bold text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setTreasuryPin((matchedProfile.pin || "1717").split(""))}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    {t("Auto-Preencher PIN Registado")} ({matchedProfile.pin || "1717"})
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || treasuryPin.join("").length < 4}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <Lock className="size-4" />}
                <span>{t("Desbloquear Gabinete & Iniciar Sessão")}</span>
              </button>
            </form>
          )}
        </div>

        {/* Quick Staff Presets & Telemetry Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Staff Selection Box */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="size-4 text-amber-500" />
                <span>{t("Perfis Institucionais Predefinidos")}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">1-Clique Demo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Selecione um funcionário abaixo para preencher automaticamente as credenciais e simular o fluxo institucional:")}
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {WORKER_PRESETS.map((preset) => {
                const isSelected = selectedStaffId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-xs"
                        : "border-border bg-muted/20 hover:border-amber-500/50 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={preset.avatar}
                        alt={preset.name}
                        className="size-9 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground truncate">{preset.name}</p>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            Nível {preset.accessLevel}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{preset.cargo}</p>
                      </div>
                    </div>

                    <UserCheck
                      className={`size-4 shrink-0 ${
                        isSelected ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Telemetry & HSM Box */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Terminal className="size-4 text-primary" />
              <span>{t("Telemetria de Segurança do Servidor")}</span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Protocolo:</span>
                <span className="text-foreground">{securityStatus.tls}</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware Enclave:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {securityStatus.authEnclave}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IP / Localização:</span>
                <span className="text-foreground">{securityStatus.ip}</span>
              </div>
              <div className="flex justify-between">
                <span>Auditoria RBAC:</span>
                <span className="text-foreground">Strict Mode (Ativo)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
