import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

export type DarkPalette = "midnight" | "charcoal" | "oled" | "emerald" | "amethyst";

export interface DarkPaletteInfo {
  id: DarkPalette;
  name: string;
  shortName: string;
  description: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  contrastRatio: string;
  tag: string;
}

export const DARK_PALETTES: DarkPaletteInfo[] = [
  {
    id: "midnight",
    name: "Midnight Blue",
    shortName: "Azul Meia-Noite",
    description: "Tons profundos de azul marinho com contraste suave, excelente para foco e redução de luz azul.",
    bgHex: "#0a1120",
    cardHex: "#131d33",
    accentHex: "#3b82f6",
    contrastRatio: "WCAG AA (8.5:1)",
    tag: "Padrão",
  },
  {
    id: "charcoal",
    name: "Deep Charcoal",
    shortName: "Carvão Mineral",
    description: "Neutro escuro com grafite mineral e obsidiana pura, ideal para longas jornadas de trabalho sem fadiga.",
    bgHex: "#121316",
    cardHex: "#1b1d22",
    accentHex: "#94a3b8",
    contrastRatio: "WCAG AA (9.2:1)",
    tag: "Neutro",
  },
  {
    id: "oled",
    name: "OLED Pitch Black",
    shortName: "Preto Absoluto",
    description: "Fundo preto 100% puro (#000) com bordas de alto contraste. Poupa bateria e oferece nitidez máxima.",
    bgHex: "#000000",
    cardHex: "#0d0d0d",
    accentHex: "#60a5fa",
    contrastRatio: "WCAG AAA (16:1)",
    tag: "Alto Contraste",
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    shortName: "Floresta Esmeralda",
    description: "Fundo botânico verde ardósia escuro com destaques esmeralda, sensação relaxante para balanço financeiro.",
    bgHex: "#081612",
    cardHex: "#0e241e",
    accentHex: "#10b981",
    contrastRatio: "WCAG AA (8.8:1)",
    tag: "Botânico",
  },
  {
    id: "amethyst",
    name: "Amethyst Void",
    shortName: "Ametista Noturna",
    description: "Tons refinados de violeta e roxo cósmico, estética executiva distinta com alta elegância.",
    bgHex: "#120d1c",
    cardHex: "#1e162d",
    accentHex: "#a855f7",
    contrastRatio: "WCAG AA (8.2:1)",
    tag: "Executivo",
  },
];

type ThemeContextType = {
  theme: Theme;
  darkPalette: DarkPalette;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setDarkPalette: (p: DarkPalette) => void;
  palettes: DarkPaletteInfo[];
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  darkPalette: "midnight",
  toggleTheme: () => {},
  setTheme: () => {},
  setDarkPalette: () => {},
  palettes: DARK_PALETTES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [darkPalette, setDarkPaletteState] = useState<DarkPalette>("midnight");

  useEffect(() => {
    // 1. Load Theme Mode
    const savedTheme = localStorage.getItem("ul-theme") as Theme | null;
    let effectiveTheme: Theme = "light";

    if (savedTheme === "dark" || savedTheme === "light") {
      effectiveTheme = savedTheme;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) effectiveTheme = "dark";
    }

    setThemeState(effectiveTheme);

    // 2. Load Dark Palette
    const savedPalette = localStorage.getItem("ul-dark-palette") as DarkPalette | null;
    const validPalettes: DarkPalette[] = ["midnight", "charcoal", "oled", "emerald", "amethyst"];
    const effectivePalette = savedPalette && validPalettes.includes(savedPalette) ? savedPalette : "midnight";
    setDarkPaletteState(effectivePalette);

    // 3. Apply to documentElement
    applyThemeToDOM(effectiveTheme, effectivePalette);
  }, []);

  const applyThemeToDOM = (t: Theme, p: DarkPalette) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-dark-palette", p);
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-dark-palette");
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("ul-theme", t);
    applyThemeToDOM(t, darkPalette);
  };

  const setDarkPalette = (p: DarkPalette) => {
    setDarkPaletteState(p);
    localStorage.setItem("ul-dark-palette", p);
    if (theme === "dark") {
      document.documentElement.setAttribute("data-dark-palette", p);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        darkPalette,
        toggleTheme,
        setTheme,
        setDarkPalette,
        palettes: DARK_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

