import React, { useState } from "react";
import { useRole, WORKER_PRESETS } from "@/lib/role";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  Briefcase,
  GraduationCap,
  ChevronDown,
  ShieldCheck,
  Building,
  UserCheck,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";

export function RoleSwitcherBadge({ variant = "header" }: { variant?: "header" | "floating" | "banner" }) {
  const { currentRole, setRole, isWorker, isStudent, workerProfile, setWorkerProfile } = useRole();
  const { user } = useAuth();
  const { t } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (variant === "header") {
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs backdrop-blur-xs ${
            isWorker
              ? "bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border-amber-300/40"
              : "bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border-emerald-300/40"
          }`}
          title={t("Mudar perfil de visualização")}
        >
          {isWorker ? (
            <>
              <Briefcase className="size-3.5 text-amber-300 shrink-0" />
              <span className="font-bold">{t("Modo Funcionário")}</span>
            </>
          ) : (
            <>
              <GraduationCap className="size-3.5 text-emerald-300 shrink-0" />
              <span className="font-bold">{t("Modo Estudante")}</span>
            </>
          )}
          <ChevronDown className="size-3 opacity-75" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-card border border-border/80 shadow-2xl p-2 z-50 text-foreground animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("Controlo de Visibilidade & Papel")}
                </p>
                <p className="text-xs text-foreground/80 mt-0.5">
                  {t("Alterne para testar as vistas e permissões exclusivas:")}
                </p>
              </div>

              <div className="space-y-1.5 py-2">
                {/* Worker Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("worker");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                    isWorker
                      ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t("Secretário Financeiro / Staff")}
                      </span>
                      {isWorker && <Check className="size-3.5 text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {t("Acesso a Tesouraria, Emissão, Gestão de Propinas, SMS e Auditoria.")}
                    </p>
                  </div>
                </button>

                {/* Student Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                    isStudent
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t("Estudante / Aluno")}
                      </span>
                      {isStudent && <Check className="size-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {t("Acesso a Pagamentos Pessoais, Cartão Digital, Pedidos de Bolsas e Histórico.")}
                    </p>
                  </div>
                </button>
              </div>

              {/* Preset workers selector if in worker mode */}
              {isWorker && (
                <div className="pt-2 border-t border-border/60">
                  <span className="block px-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    {t("Perfil do Funcionário em Sessão")}:
                  </span>
                  <div className="space-y-1">
                    {WORKER_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setWorkerProfile(p);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                          workerProfile.id === p.id
                            ? "bg-muted font-bold text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{p.cargo}</p>
                        </div>
                        {workerProfile.id === p.id && (
                          <div className="size-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/60 border border-border rounded-xl">
      <button
        type="button"
        onClick={() => setRole("worker")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
          isWorker
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Briefcase className="size-3.5" />
        <span>{t("Vista Funcionário")}</span>
      </button>

      <button
        type="button"
        onClick={() => setRole("student")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
          isStudent
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <GraduationCap className="size-3.5" />
        <span>{t("Vista Estudante")}</span>
      </button>
    </div>
  );
}
