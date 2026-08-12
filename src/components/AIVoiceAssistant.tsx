import React, { useState, useEffect, useRef } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRouter } from "@/lib/router";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  X,
  Radio,
  Compass,
  MessageSquare,
  Check,
  AlertCircle,
  Activity,
} from "lucide-react";

interface AIVoiceAssistantProps {
  variant?: "header" | "floating" | "compact";
}

export function AIVoiceAssistant({ variant = "header" }: AIVoiceAssistantProps) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { navigate } = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Map app lang to Web Speech locale
  const langLocales: Record<Lang, string> = {
    pt: "pt-PT",
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langLocales[lang] || "pt-PT";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("SpeechRecognition notice:", event.error);
        // Do not fail completely because MediaRecorder fallback will handle audio
      };

      recognition.onend = () => {
        // Handled in stopListening
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  // Speech Synthesis Helper
  const speakText = (text: string) => {
    if (voiceMuted || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // stop previous speech
    const cleanText = text.replace(/[*#_`]/g, "").substring(0, 300); // clean markdown

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langLocales[lang] || "pt-PT";
    utterance.rate = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const voiceMatch = voices.find((v) =>
      v.lang.toLowerCase().includes(lang === "pt" ? "pt" : lang === "en" ? "en" : lang === "fr" ? "fr" : "es")
    );
    if (voiceMatch) {
      utterance.voice = voiceMatch;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start Mic Listening with Audio Recording & Meter
  const startListening = async () => {
    stopSpeaking();
    setTranscript("");
    setAiResponse(null);
    setIsOpen(true);
    setStatusMessage(
      lang === "en"
        ? "Requesting microphone permission..."
        : "A solicitar permissão do microfone..."
    );

    try {
      // 1. Explicitly request microphone stream from browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup Audio Visualizer Meter
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.warn("Audio meter setup notice:", e);
      }

      // 3. Setup MediaRecorder for direct audio capturing
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);

      // 4. Try starting Web Speech Recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = langLocales[lang] || "pt-PT";
          recognitionRef.current.start();
        } catch (e) {
          console.warn("SpeechRecognition start exception:", e);
        }
      }

      setIsListening(true);
      setStatusMessage(
        lang === "en"
          ? "Microphone Active! Speak now..."
          : lang === "fr"
          ? "Microphone Actif ! Parlez maintenant..."
          : lang === "es"
          ? "¡Micrófono Activo! Hable ahora..."
          : "Microfone Activo! Fale agora..."
      );
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setIsListening(false);
      setStatusMessage(
        lang === "en"
          ? "Microphone access denied. Please allow microphone permissions in your browser bar."
          : "Acesso ao microfone negado. Por favor, permita a utilização do microfone na barra do navegador."
      );
    }
  };

  // Stop Mic Listening & Process Audio / Speech
  const stopListening = async () => {
    setIsListening(false);

    // Stop animation frame and audio context
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Stop MediaRecorder and grab recorded audio
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    // Stop audio stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsProcessing(true);
    setStatusMessage(
      lang === "en"
        ? "Processing your voice command..."
        : "A processar comando de voz..."
    );

    // Give a tiny delay for audio chunks to finish collecting
    setTimeout(async () => {
      // If Web Speech API produced a transcript:
      if (transcript.trim().length > 2) {
        processVoiceCommand(transcript);
        return;
      }

      // Otherwise, fallback to processing recorded audio blob via Gemini multimodal API
      if (audioChunksRef.current.length > 0) {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (audioBlob.size > 500) {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(",")[1];
              try {
                const response = await fetch("/api/ai/audio", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audioBase64: base64Data,
                    mimeType: "audio/webm",
                    lang,
                  }),
                });
                const data = await response.json();
                if (data.transcript) {
                  setTranscript(data.transcript);
                }
                if (data.reply) {
                  setAiResponse(data.reply);
                  speakText(data.reply);
                  // Check if transcript contains navigation command
                  processVoiceCommand(data.transcript || "");
                } else {
                  setStatusMessage(t("Voz processada sem resposta."));
                }
              } catch (apiErr) {
                console.error("Audio API error:", apiErr);
                setStatusMessage(t("Erro ao enviar o áudio de voz."));
              } finally {
                setIsProcessing(false);
              }
            };
            return;
          }
        } catch (blobErr) {
          console.error("Blob error:", blobErr);
        }
      }

      setIsProcessing(false);
      setStatusMessage(
        lang === "en"
          ? "No voice detected. Please click the mic and speak louder."
          : "Nenhuma voz detetada. Clique no microfone e fale mais alto."
      );
    }, 400);
  };

  // Voice Command Intent Processor
  const processVoiceCommand = async (rawInput: string) => {
    const input = rawInput.toLowerCase().trim();
    if (!input) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    // 1. Navigation Commands
    if (
      input.includes("painel") ||
      input.includes("dashboard") ||
      input.includes("tableau") ||
      input.includes("panel") ||
      input.includes("home")
    ) {
      const msg = t("A navegar para o Painel...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/");
      setIsProcessing(false);
      return;
    }

    if (
      input.includes("orientador") ||
      input.includes("advisor") ||
      input.includes("conseiller") ||
      input.includes("asesor") ||
      input.includes("ia") ||
      input.includes("ai")
    ) {
      const msg = t("A abrir o Orientador IA...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/orientador");
      setIsProcessing(false);
      return;
    }

    if (
      input.includes("propina") ||
      input.includes("tuition") ||
      input.includes("frais") ||
      input.includes("colegiaturas") ||
      input.includes("taxas")
    ) {
      const msg = t("A abrir Propinas e Taxas...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/propinas");
      setIsProcessing(false);
      return;
    }

    if (
      input.includes("pagamento") ||
      input.includes("payment") ||
      input.includes("paiement") ||
      input.includes("pago") ||
      input.includes("m-pesa") ||
      input.includes("cartão")
    ) {
      const msg = t("A abrir estado de Pagamentos...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/pagamentos");
      setIsProcessing(false);
      return;
    }

    if (input.includes("estudante") || input.includes("student") || input.includes("étudiant")) {
      const msg = t("A abrir lista de Estudantes...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/estudantes");
      setIsProcessing(false);
      return;
    }

    if (input.includes("recibo") || input.includes("receipt") || input.includes("reçu")) {
      const msg = t("A abrir Recibos emitidos...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/recibos");
      setIsProcessing(false);
      return;
    }

    if (input.includes("documento") || input.includes("document")) {
      const msg = t("A abrir Documentos...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/documentos");
      setIsProcessing(false);
      return;
    }

    if (
      input.includes("subscrição") ||
      input.includes("subscription") ||
      input.includes("abonnement") ||
      input.includes("suscripción") ||
      input.includes("base pay")
    ) {
      const msg = t("A abrir Subscrições...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/subscricoes");
      setIsProcessing(false);
      return;
    }

    if (input.includes("portal")) {
      const msg = t("A abrir Portal do Estudante...");
      setAiResponse(msg);
      speakText(msg);
      navigate("/portal");
      setIsProcessing(false);
      return;
    }

    // 2. Theme & Language Controls
    if (input.includes("modo escuro") || input.includes("dark mode") || input.includes("mode sombre")) {
      if (theme !== "dark") toggleTheme();
      const msg = t("Modo Escuro activado.");
      setAiResponse(msg);
      speakText(msg);
      setIsProcessing(false);
      return;
    }

    if (input.includes("modo claro") || input.includes("light mode") || input.includes("mode clair")) {
      if (theme !== "light") toggleTheme();
      const msg = t("Modo Claro activado.");
      setAiResponse(msg);
      speakText(msg);
      setIsProcessing(false);
      return;
    }

    if (input.includes("inglês") || input.includes("english") || input.includes("anglais")) {
      setLang("en");
      const msg = "Switched language to English.";
      setAiResponse(msg);
      speakText(msg);
      setIsProcessing(false);
      return;
    }

    if (input.includes("português") || input.includes("portuguese") || input.includes("portugais")) {
      setLang("pt");
      const msg = "Idioma alterado para Português.";
      setAiResponse(msg);
      speakText(msg);
      setIsProcessing(false);
      return;
    }

    // 3. Fallback AI Gemini Voice Query if not a navigation shortcut
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
          lang,
        }),
      });
      const data = await res.json();
      const reply = data.reply || t("Não consegui compreender o comando.");
      setAiResponse(reply);
      speakText(reply);
    } catch (err) {
      console.error(err);
      const errReply = t("Erro ao consultar a IA por voz.");
      setAiResponse(errReply);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Header Mic Trigger Button */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
              : isSpeaking
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
          }`}
          title={t("Comando de Voz IA")}
        >
          {isListening ? (
            <Radio className="size-3.5 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="size-3.5 animate-bounce" />
          ) : (
            <Mic className="size-3.5 text-amber-300" />
          )}
          <span className="hidden sm:inline">{t("Voz IA")}</span>
        </button>

        {/* Mute/Unmute Quick Toggle */}
        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="ml-1 rounded-full bg-red-500/20 p-1 text-red-300 hover:bg-red-500/40"
            title={t("Parar Voz")}
          >
            <VolumeX className="size-3" />
          </button>
        )}
      </div>

      {/* Interactive AI Voice Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Sparkles className="size-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span>{t("Comando de Voz IA")}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary uppercase">
                      {lang}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {t("Fale para navegar, mudar definições ou fazer perguntas sobre a Universidade.")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVoiceMuted(!voiceMuted)}
                  className={`p-1.5 rounded-md transition ${
                    voiceMuted ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={voiceMuted ? t("Ativar Voz IA") : t("Desativar Voz IA")}
                >
                  {voiceMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Live Audio Waves / Status Indicator */}
            <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted/40 border border-border space-y-3">
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <div className="absolute size-24 rounded-full bg-red-500/20 animate-ping" />
                )}
                {isSpeaking && (
                  <div className="absolute size-24 rounded-full bg-emerald-500/20 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 size-16 rounded-full flex items-center justify-center shadow-xl transition transform active:scale-95 cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white shadow-red-500/40"
                      : isSpeaking
                      ? "bg-emerald-500 text-white shadow-emerald-500/40"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isListening ? (
                    <Mic className="size-7 animate-pulse" />
                  ) : isSpeaking ? (
                    <Volume2 className="size-7 animate-bounce" />
                  ) : (
                    <Mic className="size-7" />
                  )}
                </button>
              </div>

              {/* Live Audio Volume Bar Indicator */}
              {isListening && (
                <div className="flex items-center gap-1 h-6 pt-1">
                  {[20, 40, 70, 100, 60, 30, 80, 50].map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(4, Math.min(24, (audioLevel * height) / 100))}px`,
                        opacity: audioLevel > 5 ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-foreground text-center">
                {isListening
                  ? t("A ouvir... Fale agora")
                  : isProcessing
                  ? t("A processar comando...")
                  : isSpeaking
                  ? t("A responder...")
                  : statusMessage || t("Clique no microfone para falar")}
              </p>

              {/* Transcribed text box */}
              {transcript && (
                <div className="w-full rounded bg-card border border-border p-2.5 text-xs text-foreground font-mono italic text-center">
                  "{transcript}"
                </div>
              )}
            </div>

            {/* AI Response Output */}
            {aiResponse && (
              <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <div className="flex items-center gap-1.5">
                    <Bot className="size-4" />
                    <span>Resposta IA:</span>
                  </div>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
                    >
                      <VolumeX className="size-3" />
                      <span>Parar Áudio</span>
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {aiResponse}
                </p>
              </div>
            )}

            {/* Voice Command Quick Hints */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                {t("Comandos disponíveis")} ({lang.toUpperCase()}):
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  { label: "Ir para o Painel", cmd: "Painel" },
                  { label: "Abrir Orientador IA", cmd: "Orientador" },
                  { label: "Ver Propinas", cmd: "Propinas" },
                  { label: "Ver Pagamentos", cmd: "Pagamentos" },
                  { label: "Ativar Modo Escuro", cmd: "Modo Escuro" },
                ].map((item) => (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => processVoiceCommand(item.cmd)}
                    className="rounded bg-muted px-2 py-1 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
                  >
                    "{t(item.label)}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
