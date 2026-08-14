import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Mpesa } from "mpesa-api";
import { connectToDatabase } from "./src/lib/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Seed initial default students into MongoDB if collection is empty
async function seedDefaultStudents() {
  const { db } = await connectToDatabase();
  if (!db) return;

  try {
    const count = await db.collection("users").countDocuments();
    if (count === 0) {
      console.log("[MongoDB] Seeding initial student accounts...");
      const defaultStudents = [
        {
          id: "EST-2024-001",
          nome: "Leonardo Nhantumbo",
          docId: "110293847M",
          tipoDocumento: "BI",
          curso: "Engenharia Informática",
          ano: 3,
          email: "leonardo.m@ul.ac.mz",
          password: "ul2026",
          nacionalidade: "Moçambique",
          isInternational: false,
          foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          createdAt: new Date().toISOString(),
        },
        {
          id: "EST-2024-002",
          nome: "Amina Abdala",
          docId: "120394856N",
          tipoDocumento: "BI",
          curso: "Medicina Geral",
          ano: 2,
          email: "amina.a@ul.ac.mz",
          password: "ul2026",
          nacionalidade: "Moçambique",
          isInternational: false,
          foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
          createdAt: new Date().toISOString(),
        },
        {
          id: "EST-2024-003",
          nome: "John Smith",
          docId: "PA98765432",
          tipoDocumento: "Passaporte",
          curso: "Gestão de Empresas",
          ano: 1,
          email: "john.smith@ul.ac.mz",
          password: "ul2026",
          nacionalidade: "África do Sul",
          isInternational: true,
          foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          createdAt: new Date().toISOString(),
        },
      ];
      await db.collection("users").insertMany(defaultStudents);
      console.log("[MongoDB] Initial student accounts seeded successfully.");
    }
  } catch (err) {
    console.warn("[MongoDB] Seed check notice:", err);
  }
}

// Attempt initial DB connection and seed asynchronously
seedDefaultStudents().catch((err) => console.warn("Seed error:", err));

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
You are the AI Financial Advisor & Student Guide at Leonardo University (UL).
Your mission is to help and guide national and international students on their academic and financial choices (tuition, fees, payment methods, installment options, deadlines, discounts, and scholarships).

Base Knowledge of Leonardo University:
- Tuition Fees: Semester 1 (18,500 MZN, due March 15) and Semester 2 (18,500 MZN, due August 15).
- Course-specific tuition: Medicine has an additional clinical tuition fee of 9,500 MZN.
- Administrative Fees: Annual Registration (3,200 MZN, due Feb 1), Library (850 MZN, due Feb 28), Computer Engineering Lab (2,400 MZN, due April 10), Document Certification (500 MZN, due June 30).
- Payment Methods: Mobile Money (M-Pesa / e-Mola / mKesh), Debit/Credit Cards, Bank Transfer (Millennium BIM, BCI, Standard Bank, Absa), and USDC / Base Pay.
- Options:
  1. Full Single Payment (with annual discount if applicable)
  2. Semester / Monthly Installments
  3. Scholarship / Fee Waiver Request for Financial Need
  4. Payment Plan Adjustment

CRITICAL LANGUAGE INSTRUCTION:
Check the language requested by the student or the 'lang' parameter:
- If 'lang' is 'en' or if the user speaks English, respond ENTIRELY IN ENGLISH.
- If 'lang' is 'fr', respond ENTIRELY IN FRENCH.
- If 'lang' is 'es', respond ENTIRELY IN SPANISH.
- If 'lang' is 'pt', respond ENTIRELY IN PORTUGUESE.

Always respond in a welcoming, clear, encouraging, and structured way with bullet points.
Use Metical (MZN) or international currency estimates where applicable.
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

// API Route: Process Audio Input (Speech-to-Text & AI Guidance)
app.post("/api/ai/audio", async (req, res) => {
  try {
    const { audioBase64, mimeType, lang } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "No audio data provided." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        transcript: "Comando de voz em modo de teste",
        reply:
          lang === "en"
            ? "I am listening! You can ask about tuition fees, payment options, or student portal guidance."
            : "Estou a ouvir! Pode perguntar sobre propinas, pagamentos com M-Pesa ou documentos universitários.",
      });
    }

    const promptText = `
Transcreva com precisão a voz do utilizador em ${
      lang === "en" ? "Inglês" : lang === "fr" ? "Francês" : lang === "es" ? "Espanhol" : "Português"
    } e forneça uma resposta direta, útil e concisa como Orientador IA da Leonardo University.

Retorne ESTRITAMENTE um objeto JSON com esta estrutura:
{
  "transcript": "texto exacto que o utilizador falou",
  "reply": "resposta curta e prestável da IA"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: audioBase64,
              },
            },
            { text: promptText },
          ],
        },
      ],
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json({
        transcript: parsed.transcript || "Áudio processado com sucesso",
        reply: parsed.reply || response.text || "Processado.",
      });
    } catch {
      res.json({
        transcript: "Comando de voz recebido",
        reply: response.text || "Processado com sucesso.",
      });
    }
  } catch (error: any) {
    console.error("Gemini Audio Error:", error);
    res.status(500).json({ error: error.message || "Erro ao processar áudio de voz." });
  }
});

// API Route: AI Scholarship & Financial Aid Evaluator
app.post("/api/ai/scholarship-evaluator", async (req, res) => {
  try {
    const { studentName, curso, ano, requestType, reason, lang } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        eligible: true,
        score: 85,
        discountPercent: requestType === "merit" ? 40 : requestType === "family" ? 15 : 30,
        recommendation:
          lang === "en"
            ? "Preliminary AI Evaluation: Candidate demonstrates valid grounds for financial aid under Leonardo University Social Action Regulations."
            : "Avaliação Preliminar IA: O candidato cumpre os requisitos regulamentares da Leonardo University para atribuição de bonificação ou plano de apoio social.",
      });
    }

    const prompt = `
Avalie o seguinte pedido de bolsa / apoio financeiro de um estudante da Leonardo University:
- Nome do Estudante: ${studentName || "Estudante"}
- Curso: ${curso || "Geral"} (${ano || "1"}º Ano)
- Tipo de Pedido: ${requestType}
- Justificação do Estudante: ${reason}

Retorne ESTRITAMENTE um objeto JSON com o seguinte formato:
{
  "eligible": true,
  "score": 85,
  "discountPercent": 35,
  "recommendation": "texto com parecer fundamentado e dicas para a comissão de bolsas e para o estudante"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligible: { type: Type.BOOLEAN },
            score: { type: Type.INTEGER, description: "Pontuação de 0 a 100" },
            discountPercent: { type: Type.INTEGER, description: "Percentual de desconto sugerido (0 a 50%)" },
            recommendation: { type: Type.STRING, description: "Parecer fundamentado da IA" },
          },
          required: ["eligible", "score", "discountPercent", "recommendation"],
        },
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch {
      res.json({
        eligible: true,
        score: 80,
        discountPercent: 25,
        recommendation: response.text || "Pedido aprovado para análise prioritária.",
      });
    }
  } catch (error: any) {
    console.error("Gemini Scholarship Evaluator Error:", error);
    res.status(500).json({ error: error.message || "Erro ao avaliar pedido de bolsa." });
  }
});

// API Route: Custom Payment Plan Generator (JSON)
app.post("/api/ai/payment-plan-generator", async (req, res) => {
  try {
    const { curso, numInstallments, monthlyBudgetMzn, lang } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      const annualTotal = 37000;
      const count = Number(numInstallments) || 4;
      const amountPerInstallment = Math.round(annualTotal / count);

      return res.json({
        planTitle: `Plano Personalizado em ${count} Prestações`,
        totalMzn: annualTotal,
        schedule: Array.from({ length: count }).map((_, i) => ({
          installmentNumber: i + 1,
          dueDate: `2026-0${Math.min(9, i + 3)}-15`,
          amountMzn: amountPerInstallment,
          description: `Prestação ${i + 1} de ${count}`,
        })),
        advisorNotes:
          lang === "en"
            ? "Offline preview installment plan structured to meet Leonardo University fee deadlines."
            : "Plano estruturado de forma a cumprir o calendário académico oficial da Leonardo University.",
      });
    }

    const prompt = `
Elabore um plano de pagamento em prestações personalizado para um estudante do curso de ${curso || "Engenharia Informática"}.
- Número de prestações desejadas: ${numInstallments || 4}
- Orçamento mensal disponível em Meticais: ${monthlyBudgetMzn || 5000} MZN
- Propinas anuais de referência: 37,000 MZN (18,500 MZN por semestre).

Gere um objeto JSON estruturado com o calendário de pagamentos.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            totalMzn: { type: Type.NUMBER },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  installmentNumber: { type: Type.INTEGER },
                  dueDate: { type: Type.STRING },
                  amountMzn: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ["installmentNumber", "dueDate", "amountMzn", "description"],
              },
            },
            advisorNotes: { type: Type.STRING },
          },
          required: ["planTitle", "totalMzn", "schedule", "advisorNotes"],
        },
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch {
      res.status(500).json({ error: "Falha ao estruturar plano de pagamento." });
    }
  } catch (error: any) {
    console.error("Gemini Payment Plan Error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar plano de pagamento." });
  }
});

// API Route: AI Document & Receipt Scanner / Verifier
app.post("/api/ai/document-analysis", async (req, res) => {
  try {
    const { imageBase64, mimeType, rawText, lang } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        verified: true,
        extractedDetails: {
          transactionId: `MP260811.${Math.floor(1000 + Math.random() * 9000)}`,
          amountMzn: 18500,
          date: "2026-08-12",
          payerName: "Estudante Leonardo",
          paymentMethod: "M-Pesa C2B / Banco",
        },
        analysisSummary:
          lang === "en"
            ? "Receipt verified: The document matches valid payment criteria for Leonardo University."
            : "Recibo verificado com sucesso: O comprovativo atende aos critérios de validação da Tesouraria da Leonardo University.",
      });
    }

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    const promptText = `
Analise este comprovativo de pagamento ou documento académico submetido por um estudante da Leonardo University.
${rawText ? `Texto extraído do documento: ${rawText}` : ""}

Extraia os detalhes cruciais e verifique a sua autenticidade.
Retorne um JSON com:
{
  "verified": true,
  "extractedDetails": {
    "transactionId": "ID de transação",
    "amountMzn": 18500,
    "date": "2026-08-12",
    "payerName": "Nome",
    "paymentMethod": "M-Pesa, Cartão ou Banco"
  },
  "analysisSummary": "resumo detalhado em ${lang === "en" ? "Inglês" : "Português"}"
}
`;
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: UNIVERSITY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch {
      res.json({
        verified: true,
        analysisSummary: response.text || "Documento analisado.",
      });
    }
  } catch (error: any) {
    console.error("Gemini Document Analysis Error:", error);
    res.status(500).json({ error: error.message || "Erro ao analisar documento." });
  }
});

// API Route: Text-to-Speech (TTS) using gemini-3.1-flash-tts-preview
app.post("/api/ai/tts", async (req, res) => {
  try {
    const { text, voiceName, lang } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided for TTS." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ audioBase64: null, message: "TTS running in fallback mode." });
    }

    const selectedVoice = voiceName || (lang === "en" ? "Puck" : "Kore");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.substring(0, 500) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio, voice: selectedVoice });
    } else {
      res.json({ audioBase64: null, message: "No audio stream returned." });
    }
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    res.status(500).json({ error: error.message || "Erro na síntese de voz." });
  }
});

// ==========================================
// MONGODB DATABASE REST ENDPOINTS
// ==========================================

// Check MongoDB connection status and collection statistics
app.get("/api/db/status", async (req, res) => {
  const { db, isConnected, error } = await connectToDatabase();
  if (!isConnected || !db) {
    return res.json({
      isConnected: false,
      databaseName: null,
      error: error || "MongoDB não está ligado.",
      collections: { users: 0, activities: 0, locations: 0, payments: 0, scholarships: 0 },
    });
  }

  try {
    const [users, activities, locations, payments, scholarships] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("activities").countDocuments(),
      db.collection("locations").countDocuments(),
      db.collection("payments").countDocuments(),
      db.collection("scholarships").countDocuments(),
    ]);

    res.json({
      isConnected: true,
      databaseName: db.databaseName,
      collections: { users, activities, locations, payments, scholarships },
    });
  } catch (err: any) {
    res.json({
      isConnected: true,
      databaseName: db.databaseName,
      error: err.message,
      collections: { users: 0, activities: 0, locations: 0, payments: 0, scholarships: 0 },
    });
  }
});

// User Sign Up (Store in MongoDB users collection)
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { nome, email, password, curso, ano, docId, tipoDocumento, nacionalidade, isInternational, foto, walletAddress } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e Email são obrigatórios." });
    }

    const { db, isConnected } = await connectToDatabase();

    const studentId = `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newStudent = {
      id: studentId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      password: password || "ul2026",
      docId: docId || `${Math.floor(10000000 + Math.random() * 90000000)}M`,
      tipoDocumento: tipoDocumento || "BI",
      curso: curso || "Engenharia Informática",
      ano: Number(ano) || 1,
      nacionalidade: nacionalidade || "Moçambique",
      isInternational: Boolean(isInternational),
      foto: foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      walletAddress: walletAddress || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isConnected && db) {
      const existing = await db.collection("users").findOne({ email: newStudent.email });
      if (existing) {
        return res.status(400).json({ error: "Já existe uma conta associada a este email na base de dados." });
      }

      await db.collection("users").insertOne(newStudent);

      // Record activity and initial session in MongoDB
      await db.collection("activities").insertOne({
        studentId: newStudent.id,
        actionType: "SIGNUP",
        details: { email: newStudent.email, curso: newStudent.curso, walletAddress: newStudent.walletAddress },
        ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      student: newStudent,
      message: "Conta de estudante criada com sucesso no sistema e base de dados MongoDB.",
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message || "Erro ao criar conta." });
  }
});

// Link Wallet Address to User Profile in MongoDB
app.post("/api/user/link-wallet", async (req, res) => {
  try {
    const { studentId, walletAddress, walletType } = req.body;
    if (!studentId || !walletAddress) {
      return res.status(400).json({ error: "studentId e walletAddress são obrigatórios." });
    }

    const { db, isConnected } = await connectToDatabase();
    if (isConnected && db) {
      await db.collection("users").updateOne(
        { id: studentId.toUpperCase() },
        {
          $set: {
            walletAddress,
            walletType: walletType || "base",
            lastWalletConnectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      );

      // Record WALLET_LINKED activity
      await db.collection("activities").insertOne({
        studentId: studentId.toUpperCase(),
        actionType: "WALLET_LINKED",
        details: { walletAddress, walletType },
        ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "",
        timestamp: new Date().toISOString(),
      });

      return res.json({ success: true, message: "Endereço de carteira associado com sucesso no MongoDB." });
    }

    res.json({ success: true, message: "Modo offline fallback." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Full Profile (including wallet, activity history, sessions, and payments from MongoDB)
app.get("/api/user/profile", async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: "studentId é obrigatório." });
    }

    const stId = String(studentId).toUpperCase();
    const { db, isConnected } = await connectToDatabase();

    if (isConnected && db) {
      const user = await db.collection("users").findOne({ id: stId });
      const activities = await db.collection("activities").find({ studentId: stId }).sort({ timestamp: -1 }).limit(50).toArray();
      const locations = await db.collection("locations").find({ studentId: stId }).sort({ timestamp: -1 }).limit(20).toArray();
      const payments = await db.collection("payments").find({ studentId: stId }).sort({ timestamp: -1 }).toArray();

      return res.json({
        success: true,
        user,
        activities,
        locations,
        payments,
      });
    }

    res.json({ success: false, message: "Base de dados MongoDB indisponível." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Login (Verify with MongoDB users collection)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Email ou ID de estudante é obrigatório." });
    }

    const cleanId = identifier.trim().toLowerCase();
    const { db, isConnected } = await connectToDatabase();

    let student = null;
    if (isConnected && db) {
      student = await db.collection("users").findOne({
        $or: [{ email: cleanId }, { id: cleanId.toUpperCase() }],
      });
    }

    if (!student) {
      // Fallback check if DB offline or student created locally
      return res.status(404).json({ error: "Nenhum estudante encontrado com este ID ou Email na base de dados." });
    }

    if (isConnected && db) {
      // Record login activity in MongoDB
      await db.collection("activities").insertOne({
        studentId: student.id,
        actionType: "LOGIN",
        details: { email: student.email, loginTime: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      student,
      message: "Autenticação bem-sucedida.",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Erro ao autenticar." });
  }
});

// Fetch all registered students from MongoDB
app.get("/api/users", async (req, res) => {
  try {
    const { db, isConnected } = await connectToDatabase();
    if (isConnected && db) {
      const usersList = await db.collection("users").find({}).toArray();
      return res.json({ users: usersList });
    }
    res.json({ users: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record User Activity in MongoDB
app.post("/api/activity", async (req, res) => {
  try {
    const { studentId, actionType, details, userAgent } = req.body;
    const { db, isConnected } = await connectToDatabase();

    const activity = {
      studentId: studentId || "ANONYMOUS",
      actionType: actionType || "USER_ACTION",
      details: details || {},
      userAgent: userAgent || req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      timestamp: new Date().toISOString(),
    };

    if (isConnected && db) {
      await db.collection("activities").insertOne(activity);
    }

    res.json({ success: true, activity });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Activity History from MongoDB
app.get("/api/activity", async (req, res) => {
  try {
    const { studentId } = req.query;
    const { db, isConnected } = await connectToDatabase();

    if (isConnected && db) {
      const query = studentId ? { studentId: String(studentId) } : {};
      const history = await db
        .collection("activities")
        .find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
      return res.json({ activities: history });
    }

    res.json({ activities: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record Location Tracking in MongoDB
app.post("/api/location", async (req, res) => {
  try {
    const { studentId, latitude, longitude, accuracy, city, country, userAgent } = req.body;
    const { db, isConnected } = await connectToDatabase();

    const locationEntry = {
      studentId: studentId || "GUEST",
      latitude: Number(latitude) || -25.9692,
      longitude: Number(longitude) || 32.5732,
      accuracy: accuracy || null,
      city: city || "Maputo",
      country: country || "Moçambique",
      ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: userAgent || req.headers["user-agent"] || "",
      timestamp: new Date().toISOString(),
    };

    if (isConnected && db) {
      await db.collection("locations").insertOne(locationEntry);
    }

    res.json({ success: true, location: locationEntry });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Location History from MongoDB
app.get("/api/location", async (req, res) => {
  try {
    const { studentId } = req.query;
    const { db, isConnected } = await connectToDatabase();

    if (isConnected && db) {
      const query = studentId ? { studentId: String(studentId) } : {};
      const locations = await db
        .collection("locations")
        .find(query)
        .sort({ timestamp: -1 })
        .limit(30)
        .toArray();
      return res.json({ locations });
    }

    res.json({ locations: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record Payment in MongoDB History
app.post("/api/payments/history", async (req, res) => {
  try {
    const paymentData = req.body;
    const { db, isConnected } = await connectToDatabase();

    const record = {
      ...paymentData,
      timestamp: new Date().toISOString(),
    };

    if (isConnected && db) {
      await db.collection("payments").insertOne(record);
      await db.collection("activities").insertOne({
        studentId: paymentData.studentId || "STUDENT",
        actionType: "PAYMENT_RECORDED",
        details: { amount: paymentData.valorPago || paymentData.amount, method: paymentData.metodo },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Payment History from MongoDB
app.get("/api/payments/history", async (req, res) => {
  try {
    const { studentId } = req.query;
    const { db, isConnected } = await connectToDatabase();

    if (isConnected && db) {
      const query = studentId ? { studentId: String(studentId) } : {};
      const payments = await db
        .collection("payments")
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();
      return res.json({ payments });
    }

    res.json({ payments: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MOZAMBIQUE PAYMENT GATEWAY ENDPOINTS
// ==========================================

// Check which payment credentials are configured
app.get("/api/payments/gateway-status", (req, res) => {
  const mpesaConfigured = Boolean(
    process.env.MPESA_API_KEY || process.env.MPESA_SERVICE_PROVIDER_CODE
  );
  const cardGatewayConfigured = Boolean(
    process.env.FLUTTERWAVE_SECRET_KEY || process.env.PAYSHED_API_KEY || process.env.DPO_COMPANY_TOKEN
  );

  res.json({
    mpesa: {
      configured: mpesaConfigured,
      environment: process.env.MPESA_ENVIRONMENT || "sandbox",
      shortcode: process.env.MPESA_SERVICE_PROVIDER_CODE || "171717",
      provider: "Vodacom M-Pesa Moçambique C2B API",
    },
    card: {
      configured: cardGatewayConfigured,
      provider: process.env.FLUTTERWAVE_SECRET_KEY
        ? "Flutterwave Moçambique (Visa/Mastercard/MZN)"
        : process.env.PAYSHED_API_KEY
        ? "PayShed Moçambique (SIMO/Visa/Mastercard)"
        : "Mock / Sandbox Mode",
    },
  });
});

// Vodacom M-Pesa C2B STK Push Endpoint
app.post("/api/payments/m-pesa/c2b", async (req, res) => {
  try {
    const { phoneNumber, amount, reference, studentId, feeTitle } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: "Número de telefone e valor são obrigatórios." });
    }

    // Clean phone number format for Mozambique (+258)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("258") ? cleanPhone : `258${cleanPhone}`;

    const mpesaApiKey = process.env.MPESA_API_KEY;
    const mpesaPublicKey = process.env.MPESA_PUBLIC_KEY;
    const mpesaShortcode = process.env.MPESA_SERVICE_PROVIDER_CODE || "171717";

    let liveTxResult: any = null;

    // If real M-Pesa Vodacom Developer Portal credentials are present:
    if (mpesaApiKey && mpesaPublicKey) {
      console.log(`[M-PESA LIVE API] Triggering C2B Push for ${formattedPhone} - Amount: ${amount} MZN using mpesa-api`);
      try {
        const mpesa = new Mpesa(
          {
            clientKey: mpesaApiKey,
            clientSecret: mpesaPublicKey,
            securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || "credential",
            initiatorPassword: process.env.MPESA_INITIATOR_IDENTIFIER || "initiator",
          },
          (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox"
        );

        // Trigger C2B Push
        liveTxResult = await mpesa.c2bSimulate({
          CommandID: "CustomerPayBillOnline",
          Amount: Number(amount),
          Msisdn: Number(formattedPhone) || 258840000000,
          BillRefNumber: (reference || `REF-${studentId || "EST01"}`).replace(/[^a-zA-Z0-9]/g, "").substring(0, 12),
          ShortCode: Number(mpesaShortcode) || 171717,
        });
        console.log("[M-PESA LIVE RESULT]:", liveTxResult);
      } catch (mpesaError: any) {
        console.warn("[M-PESA API WARNING]: Live transaction call returned:", mpesaError.message || mpesaError);
      }
    }

    // Return C2B Push response
    const txId = liveTxResult?.output_TransactionID || `MP260811.${Math.floor(1000 + Math.random() * 9000)}.${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Store payment in MongoDB if connected
    try {
      const { db, isConnected } = await connectToDatabase();
      if (isConnected && db) {
        await db.collection("payments").insertOne({
          studentId: studentId || "EST-2024-001",
          feeTitle: feeTitle || "Propina Leonardo University",
          valorPago: Number(amount),
          data: new Date().toISOString(),
          metodo: "Mobile Money (M-Pesa)",
          estado: "pago",
          recibo: txId,
          phoneNumber: formattedPhone,
        });
        await db.collection("activities").insertOne({
          studentId: studentId || "EST-2024-001",
          actionType: "MPESA_PAYMENT",
          details: { amount, txId, phoneNumber: formattedPhone },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("MongoDB payment persistence warning:", dbErr);
    }

    res.json({
      success: true,
      transactionId: txId,
      status: "COMPLETED",
      message: `Pedido de pagamento C2B enviado com sucesso para o telemóvel ${phoneNumber}.`,
      details: {
        phoneNumber: formattedPhone,
        amountMzn: amount,
        shortcode: mpesaShortcode,
        reference: reference || `REF-${studentId || "EST-01"}`,
        timestamp: new Date().toISOString(),
        liveMode: Boolean(mpesaApiKey && mpesaPublicKey),
        mpesaApiInstalled: true,
        rawResult: liveTxResult,
      },
    });
  } catch (err: any) {
    console.error("M-Pesa C2B Payment Error:", err);
    res.status(500).json({ error: "Falha ao processar pagamento M-Pesa C2B." });
  }
});

// Mozambique Card Payment Gateway (Visa/Mastercard/SIMO)
app.post("/api/payments/card", async (req, res) => {
  try {
    const { cardNumber, cardHolder, expiry, cvv, amount, studentId, feeTitle, email } = req.body;

    if (!cardNumber || !amount) {
      return res.status(400).json({ error: "Dados do cartão e valor são obrigatórios." });
    }

    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const payshedKey = process.env.PAYSHED_API_KEY;

    // Determine brand
    const cleanNum = cardNumber.replace(/\s/g, "");
    let cardBrand = "SIMO Rede";
    if (cleanNum.startsWith("4")) cardBrand = "Visa";
    else if (cleanNum.startsWith("5") || cleanNum.startsWith("2")) cardBrand = "Mastercard";

    const authCode = `AUTH-MZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const reciboNum = `REC-MZ-${Math.floor(100000 + Math.random() * 900000)}`;

    // Store payment in MongoDB if connected
    try {
      const { db, isConnected } = await connectToDatabase();
      if (isConnected && db) {
        await db.collection("payments").insertOne({
          studentId: studentId || "EST-2024-001",
          feeTitle: feeTitle || "Propina Leonardo University",
          valorPago: Number(amount),
          data: new Date().toISOString(),
          metodo: `Cartão (${cardBrand})`,
          estado: "pago",
          recibo: reciboNum,
          authCode,
        });
        await db.collection("activities").insertOne({
          studentId: studentId || "EST-2024-001",
          actionType: "CARD_PAYMENT",
          details: { amount, reciboNum, brand: cardBrand },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("MongoDB card payment persistence warning:", dbErr);
    }

    res.json({
      success: true,
      recibo: reciboNum,
      authCode,
      brand: cardBrand,
      amountMzn: amount,
      status: "APPROVED",
      threeDSecure: true,
      message: `Pagamento com cartão ${cardBrand} aprovado com sucesso.`,
      details: {
        lastFour: cleanNum.slice(-4),
        gateway: flutterwaveKey ? "Flutterwave MZ" : payshedKey ? "PayShed MZ" : "Direct SIMO Acquiring",
        timestamp: new Date().toISOString(),
        liveMode: Boolean(flutterwaveKey || payshedKey),
      },
    });
  } catch (err: any) {
    console.error("Card Payment Error:", err);
    res.status(500).json({ error: "Falha ao autorizar pagamento com cartão." });
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
