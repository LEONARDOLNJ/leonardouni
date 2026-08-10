import React, { useState } from "react";
import { CURSOS, mzn, formatCurrency } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { Calculator, Sparkles, Check, Download, ShieldCheck, DollarSign, Calendar, Award, Globe } from "lucide-react";

export function FeeCalculator() {
  const { t } = useI18n();

  const [curso, setCurso] = useState(CURSOS[0]);
  const [currency, setCurrency] = useState<"MZN" | "USD" | "EUR">("MZN");
  const [planOption, setPlanOption] = useState<"annual" | "semester" | "monthly">("semester");
  const [bolsa, setBolsa] = useState<number>(0); // 0%, 20%, 30%, 50%, 100%
  const [irmaoDiscount, setIrmaoDiscount] = useState<boolean>(false); // 15% discount

  // Course base pricing lookup
  const getCourseBasePrice = (c: string) => {
    if (c === "Medicina") return 48000;
    if (c === "Arquitectura" || c === "Engenharia Informática") return 39000;
    return 37000;
  };

  const currentBasePrice = getCourseBasePrice(curso);

  // Discount Calculations
  let paymentPlanDiscountRate = 0;
  if (planOption === "annual") paymentPlanDiscountRate = 0.10; // 10% for full annual
  else if (planOption === "semester") paymentPlanDiscountRate = 0.05; // 5% for bi-annual

  const irmaoDiscountRate = irmaoDiscount ? 0.15 : 0;
  const bolsaDiscountRate = bolsa / 100;

  const totalDiscountRate = Math.min(paymentPlanDiscountRate + irmaoDiscountRate + bolsaDiscountRate, 1.0);
  const totalDiscountValue = currentBasePrice * totalDiscountRate;
  const finalAnnualPrice = Math.max(currentBasePrice - totalDiscountValue, 0);

  // Installments calculation
  let numInstallments = 1;
  let installmentValue = finalAnnualPrice;

  if (planOption === "semester") {
    numInstallments = 2;
    installmentValue = finalAnnualPrice / 2;
  } else if (planOption === "monthly") {
    numInstallments = 10;
    installmentValue = finalAnnualPrice / 10;
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            <Calculator className="size-3.5" />
            <span>{t("Simulador de Planos & Bolsas de Estudo")}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("Calculadora de Propinas, Descontos & Mensalidades")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("Calcule poupanças com pagamentos anuais, descontos para irmãos e conversão para estudantes internacionais.")}
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 rounded-sm border border-border bg-muted/40 p-1 text-xs">
          <span className="px-1.5 font-semibold text-muted-foreground flex items-center gap-1">
            <Globe className="size-3.5" />
            {t("Moeda")}:
          </span>
          {(["MZN", "USD", "EUR"] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setCurrency(curr)}
              className={`rounded-xs px-2 py-1 font-bold text-xs transition ${
                currency === curr
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("Curso Académico")}
            </label>
            <select
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CURSOS.map((c) => (
                <option key={c} value={c}>
                  {t(c)} — {formatCurrency(getCourseBasePrice(c), currency)}/{t("ano")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("Plano de Liquidação")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPlanOption("annual")}
                className={`rounded-sm border p-2.5 text-center text-xs transition ${
                  planOption === "annual"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <p className="font-bold">{t("Anual Único")}</p>
                <p className="text-[11px] text-success mt-0.5">-10% {t("Desconto")}</p>
              </button>

              <button
                type="button"
                onClick={() => setPlanOption("semester")}
                className={`rounded-sm border p-2.5 text-center text-xs transition ${
                  planOption === "semester"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <p className="font-bold">{t("2 Semestres")}</p>
                <p className="text-[11px] text-success mt-0.5">-5% {t("Desconto")}</p>
              </button>

              <button
                type="button"
                onClick={() => setPlanOption("monthly")}
                className={`rounded-sm border p-2.5 text-center text-xs transition ${
                  planOption === "monthly"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <p className="font-bold">{t("10 Prestações")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("Sem juros")}</p>
              </button>
            </div>
          </div>

          {/* Scholarship / Special Discounts */}
          <div className="space-y-3 rounded-sm border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Award className="size-4 text-accent" />
              <span>{t("Bolsas de Estudo & Descontos Especiais UL")}</span>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("Candidatura a Bolsa de Estudo / Mérito")}:
              </label>
              <select
                value={bolsa}
                onChange={(e) => setBolsa(Number(e.target.value))}
                className="w-full rounded-sm border border-input bg-card px-3 py-1.5 text-xs text-foreground"
              >
                <option value={0}>{t("Sem Bolsa de Estudo")}</option>
                <option value={20}>{t("Bolsa Parcial de Mérito (20% de Isenção)")}</option>
                <option value={30}>{t("Bolsa de Apoio Social (30% de Isenção)")}</option>
                <option value={50}>{t("Bolsa de Excelência Académica (50% de Isenção)")}</option>
                <option value={100}>{t("Bolsa Integral Leonardo University (100% Isenção)")}</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground pt-1">
              <input
                type="checkbox"
                checked={irmaoDiscount}
                onChange={(e) => setIrmaoDiscount(e.target.checked)}
                className="rounded-xs border-input text-primary focus:ring-primary"
              />
              <span>{t("Desconto Agregado Familiar / Irmãos na Leonardo University (-15%)")}</span>
            </label>
          </div>
        </div>

        {/* Financial Calculation Results Card */}
        <div className="lg:col-span-6 rounded-sm border border-primary/20 bg-muted/30 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Resumo do Plano Financeiro")}
              </span>
              <span className="text-xs font-mono font-bold bg-success/15 text-success px-2 py-0.5 rounded-sm">
                {t("Poupança Total")}: {formatCurrency(totalDiscountValue, currency)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("Propina Anual Base (Tabela)")}:</span>
                <span className="font-mono text-foreground">{formatCurrency(currentBasePrice, currency)}</span>
              </div>

              <div className="flex justify-between text-xs text-success font-medium">
                <span>{t("Desconto Total Acumulado")} ({Math.round(totalDiscountRate * 100)}%):</span>
                <span className="font-mono">- {formatCurrency(totalDiscountValue, currency)}</span>
              </div>

              <div className="border-t border-border pt-2 flex justify-between items-baseline">
                <span className="font-display font-bold text-foreground text-sm">
                  {t("Propina Anual Final Liquidável")}:
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  {formatCurrency(finalAnnualPrice, currency)}
                </span>
              </div>
            </div>

            {/* Installment breakdown list */}
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Plano de Pagamento Seleccionado")}:
              </p>
              <div className="rounded-sm border border-border bg-card p-3 text-xs space-y-1.5">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>
                    {numInstallments} {numInstallments === 1 ? t("Prestação Única") : t("Prestações")}
                  </span>
                  <span className="text-primary font-bold">{formatCurrency(installmentValue, currency)} / {t("parcela")}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {planOption === "annual" && t("Liquidação até 28 de Fevereiro com emissão de recibo único.")}
                  {planOption === "semester" && t("1ª Prestação em Março (50%) e 2ª Prestação em Agosto (50%).")}
                  {planOption === "monthly" && t("Pagamento de Março a Dezembro (dia 10 de cada mês).")}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <span className="text-[11px] text-muted-foreground block">
              * {t("Simulação válida para estudantes nacionais e internacionais (ano lectivo 2026).")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

