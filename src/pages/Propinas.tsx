import React, { useState } from "react";
import { Panel, Shell } from "@/components/Shell";
import { dataPt, fees, mzn, type Fee } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { FeeCalculator } from "@/components/FeeCalculator";
import { MobileMoneyRefModal } from "@/components/MobileMoneyRefModal";
import financeImg from "@/assets/finance.jpg";
import { Smartphone, ArrowRight } from "lucide-react";

function Tabela({
  titulo,
  lista,
  onGenerateRef,
}: {
  titulo: string;
  lista: typeof fees;
  onGenerateRef: (f: Fee) => void;
}) {
  const { t } = useI18n();
  return (
    <Panel titulo={`${t(titulo)} · ${lista.length} ${t("registos")}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
              <th className="px-5 py-2.5 font-medium">{t("Código")}</th>
              <th className="px-5 py-2.5 font-medium">{t("Designação")}</th>
              <th className="px-5 py-2.5 font-medium">{t("Abrangência")}</th>
              <th className="px-5 py-2.5 font-medium">{t("Vencimento")}</th>
              <th className="px-5 py-2.5 text-right font-medium">{t("Valor")}</th>
              <th className="px-5 py-2.5 text-right font-medium">{t("Referência")}</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id} className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition">
                <td className="px-5 py-3 font-mono text-xs">{f.id}</td>
                <td className="px-5 py-3 font-medium">{t(f.designacao)}</td>
                <td className="px-5 py-3 text-muted-foreground">{t(f.curso)}</td>
                <td className="px-5 py-3 text-muted-foreground">{dataPt(f.vencimento)}</td>
                <td className="px-5 py-3 text-right font-bold text-foreground">{mzn(f.valor)}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onGenerateRef(f)}
                    className="inline-flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5"
                  >
                    <Smartphone className="size-3 text-primary" />
                    <span>M-Pesa</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function Propinas() {
  const { t } = useI18n();
  const [activeRefFee, setActiveRefFee] = useState<Fee | null>(null);
  const [showRefModal, setShowRefModal] = useState(false);

  const handleOpenRef = (f?: Fee) => {
    setActiveRefFee(f || null);
    setShowRefModal(true);
  };

  return (
    <Shell
      titulo="Propinas & Taxas"
      descricao="Configuração dos encargos lectivos: propinas por semestre, taxas administrativas, calculadora de bolsas e referências M-Pesa."
      imagem={financeImg}
    >
      <div className="space-y-6">
        {/* Mobile Money Callout Banner */}
        <div className="rounded-sm border border-primary/20 bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent-foreground shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                {t("Gerador de Referência M-Pesa / Mobile Money")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("Pague rapidamente pro seu telemóvel via M-Pesa, e-Mola ou mKesh utilizando a Entidade Leonardo University 88888.")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenRef()}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition shrink-0"
          >
            <span>{t("Gerar Referência USSD")}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Interactive Fee & Scholarship Calculator */}
        <FeeCalculator />

        <Tabela
          titulo="Propinas"
          lista={fees.filter((f) => f.tipo === "propina")}
          onGenerateRef={handleOpenRef}
        />
        <Tabela
          titulo="Taxas"
          lista={fees.filter((f) => f.tipo === "taxa")}
          onGenerateRef={handleOpenRef}
        />
      </div>

      {showRefModal && (
        <MobileMoneyRefModal
          fee={activeRefFee || undefined}
          onClose={() => {
            setShowRefModal(false);
            setActiveRefFee(null);
          }}
        />
      )}
    </Shell>
  );
}

