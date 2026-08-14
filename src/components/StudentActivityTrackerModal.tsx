import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import {
  X,
  Database,
  MapPin,
  Clock,
  Activity,
  Globe,
  Monitor,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface StudentActivityTrackerModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export function StudentActivityTrackerModal({
  studentId,
  studentName,
  onClose,
}: StudentActivityTrackerModalProps) {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"profile" | "activity" | "location">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, actRes, locRes] = await Promise.all([
        fetch(`/api/user/profile?studentId=${studentId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/activity?studentId=${studentId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/location?studentId=${studentId}`).then((r) => r.json()).catch(() => null),
      ]);

      if (profRes && profRes.success) {
        setProfile(profRes.user);
        if (profRes.payments) setPayments(profRes.payments);
      }
      setActivities(actRes?.activities || []);
      setLocations(locRes?.locations || []);
    } catch (err) {
      console.warn("Error fetching activity/location from MongoDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-md border border-border bg-card shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Registo de Atividades & Localização no MongoDB
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Estudante: <span className="font-semibold text-foreground">{studentName}</span> ({studentId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-background px-4 pt-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Perfil & Carteira Web3</span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "activity"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-4" />
            <span>Atividades ({activities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "location"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="size-4" />
            <span>Geolocalização ({locations.length})</span>
          </button>
          <button
            onClick={fetchData}
            className="ml-auto p-1.5 text-xs text-muted-foreground hover:text-primary transition cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="size-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">A carregar dados do MongoDB...</p>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-md border border-border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Detalhes do Perfil Guardado no MongoDB</span>
                  </h4>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-bold">
                    Coleção: users
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nome Completo:</span>
                    <span className="font-bold text-foreground">{profile?.nome || studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Email Registado:</span>
                    <span className="font-bold text-foreground">{profile?.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">ID de Estudante:</span>
                    <span className="font-mono font-bold text-primary">{profile?.id || studentId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Curso:</span>
                    <span className="font-medium text-foreground">{profile?.curso || "Engenharia Informática"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Documento de Identificação:</span>
                    <span className="font-mono text-foreground">{profile?.docId || "BI Verified"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nacionalidade:</span>
                    <span className="text-foreground">{profile?.nacionalidade || "Moçambique"}</span>
                  </div>
                </div>

                {/* Wallet Address section */}
                <div className="mt-2 pt-3 border-t border-border/50">
                  <span className="text-muted-foreground block text-[10px] mb-1 font-semibold">
                    Endereço de Carteira Web3 / Base Sepolia (MongoDB):
                  </span>
                  {profile?.walletAddress ? (
                    <div className="flex items-center justify-between bg-background p-2.5 rounded border border-emerald-500/30 font-mono text-xs">
                      <span className="font-bold text-emerald-600 truncate">{profile.walletAddress}</span>
                      <span className="shrink-0 text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-sans font-bold">
                        Ligado na Base
                      </span>
                    </div>
                  ) : (
                    <div className="bg-background p-2.5 rounded border border-border text-muted-foreground text-[11px] italic">
                      Nenhuma carteira Web3 associada até ao momento. Ao conetar com a Base Wallet / MetaMask, o endereço é guardado automaticamente no perfil MongoDB.
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Records from MongoDB */}
              {payments.length > 0 && (
                <div className="rounded-md border border-border p-3 bg-muted/10 space-y-2">
                  <h5 className="font-bold text-xs text-foreground">
                    Pagamentos Registados no MongoDB ({payments.length})
                  </h5>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {payments.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background p-2 rounded border border-border/50 text-[11px]">
                        <div>
                          <span className="font-bold text-foreground">{p.feeTitle || p.metodo}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Recibo: {p.recibo || p.transactionId || "N/A"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600">{p.valorPago || p.amount} MZN</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {new Date(p.timestamp || p.data).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "activity" ? (
            activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                Nenhum registo de atividade encontrado para este estudante na base de dados.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.map((act, i) => (
                  <div
                    key={act._id || i}
                    className="flex items-start gap-3 rounded-md border border-border p-3 bg-muted/20 text-xs hover:border-primary/50 transition"
                  >
                    <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground font-mono uppercase tracking-wider text-[11px]">
                          {act.actionType}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {act.details && (
                        <p className="text-muted-foreground text-[11px] font-mono bg-background p-1.5 rounded border border-border/50 break-words">
                          {JSON.stringify(act.details)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Monitor className="size-3" />
                          IP: {act.ip || "127.0.0.1"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Location Tab */
            locations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                Nenhum registo de localização capturado para este estudante.
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc, i) => (
                  <div
                    key={loc._id || i}
                    className="rounded-md border border-border p-3 bg-muted/20 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <MapPin className="size-4 text-emerald-500" />
                        <span>
                          {loc.city || "Maputo"}, {loc.country || "Moçambique"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(loc.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-background p-2 rounded border border-border font-mono">
                        <span className="text-muted-foreground block text-[10px]">Coordenadas GPS:</span>
                        <span className="font-bold text-primary">
                          {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
                        </span>
                      </div>
                      <div className="bg-background p-2 rounded border border-border font-mono">
                        <span className="text-muted-foreground block text-[10px]">Endereço IP / Precisão:</span>
                        <span className="font-bold text-foreground">
                          {loc.ip || "Direct Access"} {loc.accuracy ? `(±${Math.round(loc.accuracy)}m)` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Quick Google Maps External Link */}
                    <a
                      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Globe className="size-3.5" />
                      <span>Ver Localização no Mapa Externo</span>
                    </a>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <ShieldCheck className="size-3.5" />
            <span>Dados gravados e encriptados na coleção MongoDB</span>
          </span>
          <button
            onClick={onClose}
            className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
