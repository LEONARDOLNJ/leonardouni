import { Panel, Shell } from "@/components/Shell";
import { downloadLetterhead, downloadSystemPlan, type LetterheadVariant } from "@/lib/pdf";
import { useI18n } from "@/lib/i18n";
import graduationImg from "@/assets/graduation.jpg";

const TIMBRADOS: { id: LetterheadVariant; nome: string; desc: string }[] = [
  { id: "geral", nome: "Papel timbrado · Uso geral", desc: "Cabeçalho institucional, referência, data e zona de assinatura." },
  { id: "financas", nome: "Papel timbrado · Direcção de Finanças", desc: "Modelo de notificação de propinas e taxas em dívida." },
  { id: "declaracao", nome: "Papel timbrado · Declaração de quitação", desc: "Declaração de situação financeira regularizada." },
];

export function Documentos() {
  const { t } = useI18n();
  return (
    <Shell
      titulo="Documentos"
      descricao="Plano do sistema e modelos institucionais de papel timbrado, gerados em PDF no navegador."
      imagem={graduationImg}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel titulo={t("Plano do sistema")}>
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm text-muted-foreground">
              {t(
                "Documento de três páginas com âmbito funcional dos módulos (Pagamentos, Propinas, Taxas, Estado dos pagamentos, Recibos), modelo de dados, fluxos de utilização, faseamento de implementação e um anexo com a configuração actual de encargos e estudantes.",
              )}
            </p>
            <button
              onClick={downloadSystemPlan}
              className="rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {t("Descarregar plano em PDF")}
            </button>
          </div>
        </Panel>

        <Panel titulo={t("Papel timbrado")}>
          <ul className="divide-y divide-border/60">
            {TIMBRADOS.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="max-w-sm">
                  <p className="text-sm font-medium">{t(item.nome)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(item.desc)}</p>
                </div>
                <button
                  onClick={() => downloadLetterhead(item.id)}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary"
                >
                  PDF
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
