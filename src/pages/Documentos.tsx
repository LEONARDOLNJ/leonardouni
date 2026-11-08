import React, { useState } from "react";
import { Panel, Shell } from "@/components/Shell";
import { downloadLetterhead, downloadSystemPlan, type LetterheadVariant } from "@/lib/pdf";
import { useI18n } from "@/lib/i18n";
import { useRole } from "@/lib/role";
import { OfflineDocumentsHub } from "@/components/OfflineDocumentsHub";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";
import {
  FileText,
  ShieldCheck,
  Download,
  Award,
  Briefcase,
  GraduationCap,
  HardDrive,
  WifiOff,
  Sparkles,
  Layers,
} from "lucide-react";

const TIMBRADOS: {
  id: LetterheadVariant;
  nome: string;
  desc: string;
  roleOnly?: "worker" | "all";
}[] = [
  {
    id: "geral",
    nome: "Papel timbrado · Uso geral",
    desc: "Cabeçalho institucional, referência, data e zona de assinatura.",
    roleOnly: "all",
  },
  {
    id: "financas",
    nome: "Papel timbrado · Direcção de Finanças",
    desc: "Modelo de notificação de propinas e taxas em dívida e aviso de cobrança.",
    roleOnly: "worker",
  },
  {
    id: "declaracao",
    nome: "Papel timbrado · Declaração de quitação",
    desc: "Declaração oficial de situação financeira regularizada emitida pela tesouraria.",
    roleOnly: "all",
  },
];

export function Documentos() {
  const { t } = useI18n();
  const { isWorker, isStudent } = useRole();
  const [activeTab, setActiveTab] = useState<"offline_hub" | "templates">("offline_hub");

  return (
    <Shell
      titulo={t("Documentos Académicos & Cache Offline")}
      descricao={t(
        "Aceda a certificados, declarações de matrícula, recibos e matrizes curriculares salvos em cache Service Worker mesmo sem ligação à internet."
      )}
      imagem={studentSupportImg}
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("offline_hub")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "offline_hub"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <HardDrive className="size-4" />
              <span>{t("Documentos em Cache Offline (Service Worker)")}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-400 text-slate-950">
                PWA
              </span>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "templates"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="size-4" />
              <span>{t("Modelos Institucionais & Plano")}</span>
            </button>
          </div>
        </div>

        {activeTab === "offline_hub" ? (
          <OfflineDocumentsHub />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel titulo={t("Plano do sistema")}>
              <div className="space-y-4 px-5 py-5">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Documento de três páginas com âmbito funcional dos módulos (Pagamentos, Propinas, Taxas, Estado dos pagamentos, Recibos), modelo de dados, fluxos de utilização, faseamento de implementação e um anexo com a configuração actual de encargos e estudantes."
                  )}
                </p>
                <button
                  onClick={downloadSystemPlan}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  <Download className="size-4" />
                  <span>{t("Descarregar plano em PDF")}</span>
                </button>
              </div>
            </Panel>

            <Panel titulo={t("Papel timbrado & Minutas Institucionais")}>
              <ul className="divide-y divide-border/60">
                {TIMBRADOS.map((item) => {
                  if (item.roleOnly === "worker" && !isWorker) return null;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-muted/10 transition"
                    >
                      <div className="max-w-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{t(item.nome)}</p>
                          {item.roleOnly === "worker" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Exclusivo Staff
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t(item.desc)}</p>
                      </div>
                      <button
                        onClick={() => downloadLetterhead(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary cursor-pointer"
                      >
                        <Download className="size-3" />
                        <span>PDF</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </Shell>
  );
}
