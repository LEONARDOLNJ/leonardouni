import React, { useState } from "react";
import { useTheme, type DarkPalette, type DarkPaletteInfo } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import {
  Palette,
  Check,
  Sparkles,
  Eye,
  ShieldCheck,
  Sun,
  Moon,
  Info,
  Sliders,
  CheckCircle2,
  X,
} from "lucide-react";

interface DarkModePaletteSelectorProps {
  variant?: "modal" | "compact" | "card" | "header-dropdown";
  onClose?: () => void;
}

export function DarkModePaletteSelector({
  variant = "compact",
  onClose,
}: DarkModePaletteSelectorProps) {
  const { theme, darkPalette, setDarkPalette, setTheme, palettes } = useTheme();
  const { t } = useI18n();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isDarkMode = theme === "dark";

  const handleSelectPalette = (paletteId: DarkPalette) => {
    // If currently light mode, switch to dark mode automatically when choosing a dark palette
    if (theme !== "dark") {
      setTheme("dark");
    }
    setDarkPalette(paletteId);
  };

  // ---------------------------------------------------------------------------
  // VARIANT: HEADER DROPDOWN / COMPACT BUTTON
  // ---------------------------------------------------------------------------
  if (variant === "header-dropdown") {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 transition text-xs font-medium cursor-pointer backdrop-blur-xs border border-white/10 text-white"
          title={t("Personalizar Paleta de Dark Mode")}
        >
          <Palette className="size-3.5 text-amber-300" />
          <span className="hidden sm:inline text-[11px] font-semibold">
            {palettes.find((p) => p.id === darkPalette)?.shortName || t("Tema Escuro")}
          </span>
        </button>

        {showPreviewModal && (
          <DarkModePaletteModal
            onClose={() => setShowPreviewModal(false)}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT: COMPACT TOOLBAR PILL ROW (used in Employee Panel Header)
  // ---------------------------------------------------------------------------
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5 bg-card/60 dark:bg-card/40 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground">
          <Palette className="size-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-wider">{t("Dark Mode")}:</span>
        </div>

        <div className="flex items-center gap-1">
          {palettes.map((p) => {
            const isSelected = isDarkMode && darkPalette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPalette(p.id)}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-xs scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                title={`${p.name} - ${p.description}`}
              >
                {/* Swatch Dot */}
                <span
                  className="size-2.5 rounded-full ring-1 ring-border/80 shrink-0 transition group-hover:scale-125"
                  style={{
                    backgroundColor: p.bgHex,
                    borderColor: p.accentHex,
                  }}
                />
                <span className="text-[11px] whitespace-nowrap">{p.shortName}</span>
                {isSelected && <Check className="size-3 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
          title={t("Ver detalhes e métricas de contraste")}
        >
          <Sliders className="size-3.5" />
        </button>

        {showPreviewModal && (
          <DarkModePaletteModal
            onClose={() => setShowPreviewModal(false)}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT: RICH INTERACTIVE CARD (For Settings & Employee Panel Hub)
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-2xs">
            <Palette className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-foreground">
                {t("Preferências Visuais & Paletas Dark Mode")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                WCAG 2.1 AA / AAA
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Ajuste os tons de contraste e profundidade para reduzir o cansaço ocular na secretaria.")}
            </p>
          </div>
        </div>

        {/* Global Light/Dark toggle switch */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              !isDarkMode
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="size-3.5 text-amber-500" />
            <span>{t("Modo Claro")}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isDarkMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="size-3.5" />
            <span>{t("Modo Escuro")}</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 Palette Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {palettes.map((p) => {
          const isSelected = isDarkMode && darkPalette === p.id;

          return (
            <div
              key={p.id}
              onClick={() => handleSelectPalette(p.id)}
              className={`relative rounded-xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between group ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs scale-[1.01]"
                  : "border-border/80 hover:border-border hover:bg-muted/30 bg-card"
              }`}
            >
              <div>
                {/* Header Swatch & Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Visual Color Preview Pill */}
                    <div
                      className="h-6 w-12 rounded-lg border border-white/20 shadow-inner flex overflow-hidden p-0.5 gap-0.5 shrink-0"
                      style={{ backgroundColor: p.bgHex }}
                    >
                      <div
                        className="w-1/2 h-full rounded-sm"
                        style={{ backgroundColor: p.cardHex }}
                      />
                      <div
                        className="w-1/2 h-full rounded-sm"
                        style={{ backgroundColor: p.accentHex }}
                      />
                    </div>

                    <div>
                      <span className="font-bold text-xs text-foreground group-hover:text-primary transition flex items-center gap-1">
                        {p.shortName}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {p.name}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator or Tag */}
                  {isSelected ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                      <Check className="size-3 stroke-[3]" />
                      {t("Ativo")}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                      {p.tag}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Contrast and Details Footer */}
              <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1 font-mono">
                  <Eye className="size-3" />
                  {p.contrastRatio}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPalette(p.id);
                  }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition ${
                    isSelected
                      ? "text-primary font-extrabold"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {isSelected ? t("Selecionado") : t("Aplicar")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessibility Information Notice */}
      <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-foreground font-semibold">
            {t("Ergonomia e Conforto Visual Certificado")}:
          </strong>{" "}
          {t(
            "Todas as paletas cumprem os requisitos internacionais de contraste WCAG AA/AAA para tabelas de tesouraria, gráficos estatísticos e recibos académicos. As suas preferências são guardadas automaticamente neste dispositivo."
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MODAL DETALHADO DE CONFIGURAÇÃO DE PALETAS
// -----------------------------------------------------------------------------
function DarkModePaletteModal({ onClose }: { onClose: () => void }) {
  const { theme, darkPalette, setDarkPalette, setTheme, palettes } = useTheme();
  const { t } = useI18n();

  const handleSelect = (id: DarkPalette) => {
    if (theme !== "dark") {
      setTheme("dark");
    }
    setDarkPalette(id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-foreground border border-border w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 size-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
            <Palette className="size-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-foreground">
              {t("Seletor de Paleta Dark Mode")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Personalize a atmosfera visual do painel com tons ergonómicos certificados.")}
            </p>
          </div>
        </div>

        {/* Palettes List */}
        <div className="space-y-3">
          {palettes.map((p) => {
            const isSelected = theme === "dark" && darkPalette === p.id;

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                    : "bg-muted/30 hover:bg-muted/60 border-border/80"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Swatch box */}
                  <div
                    className="size-12 rounded-xl border border-white/20 shadow-sm flex flex-col justify-end p-1.5 shrink-0"
                    style={{ backgroundColor: p.bgHex }}
                  >
                    <div
                      className="h-2 w-full rounded-sm"
                      style={{ backgroundColor: p.accentHex }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {p.shortName} ({p.name})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60">
                        {p.contrastRatio}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                      <CheckCircle2 className="size-4" />
                      {t("Ativo")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground border border-border text-xs font-bold transition cursor-pointer"
                    >
                      {t("Selecionar")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            {t("Concluir")}
          </button>
        </div>
      </div>
    </div>
  );
}
