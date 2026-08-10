import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI Client lazily/safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Leonardo University Context for AI system instruction
const UNIVERSITY_SYSTEM_PROMPT = `
Você é o Guia e Orientador Financeiro de Inteligência Artificial da Leonardo University (UL).
Sua missão é ajudar e orientar estudantes moçambicanos sobre suas escolhas académicas e financeiras (propinas, taxas, formas de pagamento, parcelamento, prazos, descontos e bolsas).

Conhecimento Base da Leonardo University:
- Propinas: 1º Semestre (18.500 MZN, venc. 15 Março) e 2º Semestre (18.500 MZN, venc. 15 Agosto).
- Propinas adicionais por curso: Medicina possui propina clínica adicional de 9.500 MZN.
- Taxas Administrativas: Inscrição Anual (3.200 MZN, venc. 1 Fevereiro), Biblioteca (850 MZN, venc. 28 Fevereiro), Laboratório para Engenharia Informática (2.400 MZN, venc. 10 Abril), Certificação de Documentos (500 MZN, venc. 30 Junho).
- Métodos de Pagamento em Moçambique: Mobile Money (M-Pesa / e-Mola / mKesh), Cartão de Débito/Crédito, Transferência Bancária (Millennium BIM, BCI, Standard Bank, Absa).
- Opções de Escolha do Estudante:
  1. Pagamento Próprio à Vista (desconto anual se aplicável)
  2. Pagamento em Prestações / Mensalidades
  3. Pedido de Isenção / Plano Especial de Apoio por Necessidade Financeira
  4. Mudança / Ajuste de Plano de Pagamento

Sempre responda de forma clara, acolhedora, encorajadora e estruturada com tópicos, em Português (ou no idioma solicitado se fornecido em Inglês).
Use a moeda Metical (MZN) e inclua conselhos práticos para o contexto moçambicano.
`;

// API Route: Guidance based on student choices
app.post("/api/ai/guidance", async (req, res) => {
  try {
    const { curso, ano, situacao, metodo, questaoPersonalizada, lang } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        advice:
          lang === "en"
            ? "AI Guidance mode is running in offline preview. Based on your choices, we recommend setting up a semester installment plan via Mobile Money (M-Pesa) or Bank Transfer to meet your Leonardo University fee deadlines."
            : "O serviço de Inteligência Artificial está a operar em modo de demonstração. Com base nas suas escolhas, recomendamos o plano de pagamento parcelado por semestre via Mobile Money (M-Pesa) ou Transferência Bancária para cumprir os prazos da Leonardo University.",
      });
    }

    const prompt = `
Forneça uma orientação financeira e académica personalizada para o seguinte estudante da Leonardo University:
- Curso Escolhido: ${curso || "Engenharia Informática"}
- Ano de Estudo: ${ano || "1"}º Ano
- Situação Financeira / Preferência de Escolha: ${situacao || "Pagamento parcelado por semestre"}
- Método de Pagamento Preferido: ${metodo || "Mobile Money"}
- Pergunta / Nota Adicional do Estudante: ${questaoPersonalizada || "Nenhuma"}
- Idioma de resposta preferido: ${lang === "en" ? "Inglês" : "Português"}

Por favor, elabore um Guia de Escolhas e Recomendações com:
1. Resumo dos Custos Estimados (propinas e taxas específicas para este curso e ano).
2. Plano de Acção Recomendado (prazos de vencimento e como se organizar).
3. Dicas Práticas de Pagamento (vantagens do método escolhido como ${metodo}).
4. Recomendações em caso de dificuldade financeira ou dúvidas no portal.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    res.json({ advice: response.text || "Não foi possível gerar a orientação no momento." });
  } catch (error: any) {
    console.error("Gemini Guidance Error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar orientação IA." });
  }
});

// API Route: Interactive Chat for Students
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply:
          lang === "en"
            ? "I am your Leonardo University AI Advisor. You can manage your fees under 'Propinas & Taxas' or download your receipts in PDF under 'Recibos'."
            : "Olá! Sou o seu Orientador IA da Leonardo University. Pode consultar as suas propinas no menu 'Propinas & Taxas' ou descarregar os seus recibos em PDF em 'Recibos'. Como posso ajudar mais?",
      });
    }

    const formattedContents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: "user",
        parts: [{ text: "Olá! Como o Orientador IA da Leonardo University pode me ajudar hoje?" }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || "Desculpe, não consegui processar a resposta." });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "Erro ao responder ao chat." });
  }
});

// Start Express Server with Vite Dev or Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
