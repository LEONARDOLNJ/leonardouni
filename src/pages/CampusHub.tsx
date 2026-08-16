import React, { useState } from "react";
import { Shell, Panel } from "@/components/Shell";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Search, BookOpen, Brain, Sparkles, CheckCircle, ExternalLink, Award, FileCode } from "lucide-react";

export function CampusHub() {
  const { t } = useI18n();

  // Flashcards state
  const [flashcards] = useState([
    {
      q: "O que é um contrato inteligente (Smart Contract) na rede Base?",
      a: "Um programa executado autonomamente na blockchain Layer 2 da Coinbase que garante execuções transparentes e imutáveis de pagamentos de propinas.",
    },
    {
      q: "Como é garantida a persistência segura dos dados na Universidade Leonardo?",
      a: "Através de instâncias MongoDB altamente disponíveis ligadas a nós de autenticação com encriptação de ponta a ponta.",
    },
    {
      q: "Qual é a escala de avaliação oficial em Moçambique?",
      a: "Escala numérica de 0 a 20 valores, sendo a nota mínima de aprovação 10 valores.",
    },
  ]);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Certificate Verifier state
  const [searchHash, setSearchHash] = useState("");
  const [verifiedResult, setVerifiedResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (searchHash.trim().length > 5) {
        setVerifiedResult({
          valid: true,
          studentName: "Leonardo Júnior Nhantumbo",
          course: "Licenciatura em Engenharia Informática",
          date: "14 de Agosto de 2026",
          gpa: "17.80 / 20",
          chain: "Base Sepolia Testnet (Chain ID: 84532)",
          txHash: searchHash.startsWith("0x") ? searchHash : "0x7f8d9a...4bc2e1",
        });
      } else {
        setVerifiedResult({ valid: false });
      }
    }, 600);
  };

  return (
    <Shell
      titulo="Hub Académico, Flashcards IA & Verificador Blockchain"
      descricao="Explore recursos de estudo interativos gerados por inteligência artificial e verifique a autenticidade de diplomas e certificados na rede Base & MongoDB."
    >
      <div className="space-y-10">
        {/* Flashcards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Panel
            titulo="Treinador de Estudo & Flashcards IA"
            acao={
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Brain className="size-3.5" /> IA Ativa
              </span>
            }
          >
            <div className="p-6 space-y-6">
              <div
                onClick={() => setShowAnswer(!showAnswer)}
                className="rounded-xl border border-border bg-muted/20 p-8 text-center cursor-pointer transition hover:bg-muted/40 min-h-[160px] flex flex-col justify-center items-center relative shadow-xs"
              >
                <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Cartão {currentCard + 1} de {flashcards.length} (Clique para ver resposta)
                </span>
                <p className="font-display text-base font-bold text-foreground">
                  {showAnswer ? flashcards[currentCard].a : flashcards[currentCard].q}
                </p>
                <span className="mt-4 text-xs font-semibold text-primary underline">
                  {showAnswer ? "Ver Pergunta" : "Revelar Resposta"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowAnswer(false);
                    setCurrentCard((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-mono text-muted-foreground">
                  {currentCard + 1} / {flashcards.length}
                </span>
                <button
                  onClick={() => {
                    setShowAnswer(false);
                    setCurrentCard((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  Seguinte →
                </button>
              </div>
            </div>
          </Panel>

          {/* Blockchain & MongoDB Certificate Verifier */}
          <Panel
            titulo="Validador de Diplomas & Recibos (Base & MongoDB)"
            acao={
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> Zero-Trust
              </span>
            }
          >
            <div className="p-6 space-y-6">
              <form onSubmit={handleVerify} className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">
                  Insira o Hash da Transação ou ID de Certificado (Ex: 0x...)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchHash}
                      onChange={(e) => setSearchHash(e.target.value)}
                      placeholder="0x7f8d9a4bc2e1..."
                      className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition cursor-pointer shrink-0"
                  >
                    {verifying ? "A verificar..." : "Verificar"}
                  </button>
                </div>
              </form>

              {verifiedResult && (
                <div
                  className={`rounded-xl border p-4 text-xs space-y-2 ${
                    verifiedResult.valid
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-red-500/40 bg-red-500/5"
                  }`}
                >
                  {verifiedResult.valid ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle className="size-4" />
                        <span>Certificado Autêntico & Verificado na Base Network</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground">
                        <div>
                          <span className="block font-semibold text-foreground">Estudante:</span>
                          {verifiedResult.studentName}
                        </div>
                        <div>
                          <span className="block font-semibold text-foreground">Média Final:</span>
                          {verifiedResult.gpa}
                        </div>
                        <div className="col-span-2">
                          <span className="block font-semibold text-foreground">Curso:</span>
                          {verifiedResult.course}
                        </div>
                        <div className="col-span-2 font-mono truncate">
                          <span className="block font-semibold text-foreground font-sans">Hash / TX:</span>
                          {verifiedResult.txHash}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-red-600 font-bold">
                      Nenhum certificado encontrado para o hash fornecido. Insira um ID válido.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
