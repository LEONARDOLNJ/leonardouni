import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Mail, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";

export function ForgotPasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { requestPasswordReset } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: "error", msg: t("Por favor introduza o seu email académico.") });
      return;
    }

    const res = requestPasswordReset(email);
    if (res.success) {
      setStatus({ type: "success", msg: res.message });
    } else {
      setStatus({ type: "error", msg: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-md bg-card border border-border p-6 shadow-xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition p-1 rounded-sm"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-display">
              {t("Recuperar Conta de Estudante")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("Instruções de redefinição de senha da Leonardo University.")}
            </p>
          </div>
        </div>

        {status.type === "success" ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-4 space-y-3">
            <div className="flex items-start gap-2.5 text-success">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">{t("Email Enviado com Sucesso")}</p>
                <p className="text-muted-foreground">{status.msg}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              {t("Voltar ao Login")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.type === "error" && (
              <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{status.msg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("Email Académico ou Nº de Estudante")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: leonardo.m@ul.ac.mz ou EST-2024-001"
                  className="w-full rounded-sm border border-input bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("Enviaremos um token de segurança de utilização única para o seu endereço institucional.")}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                {t("Cancelar")}
              </button>
              <button
                type="submit"
                className="rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                {t("Enviar Link de Recuperação")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
