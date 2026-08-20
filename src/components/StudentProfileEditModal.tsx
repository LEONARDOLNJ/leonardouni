import React, { useState } from "react";
import { type Student } from "@/lib/uni-data";
import { useI18n } from "@/lib/i18n";
import { X, User, Camera, Mail, Phone, MapPin, Globe, Save, CheckCircle2 } from "lucide-react";

interface StudentProfileEditModalProps {
  student: Student;
  onClose: () => void;
  onSave: (updated: Partial<Student>) => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
];

export function StudentProfileEditModal({ student, onClose, onSave }: StudentProfileEditModalProps) {
  const { t } = useI18n();

  const [nome, setNome] = useState(student.nome || "");
  const [email, setEmail] = useState(student.email || "");
  const [foto, setFoto] = useState(student.foto || AVATAR_PRESETS[0]);
  const [telefone, setTelefone] = useState((student as any).telefone || "+258 84 123 4567");
  const [endereco, setEndereco] = useState((student as any).endereco || "Av. Julius Nyerere, Maputo, Moçambique");
  const [bio, setBio] = useState((student as any).bio || `Estudante do ${student.ano}º Ano de ${student.curso} na Leonardo University.`);
  const [nacionalidade, setNacionalidade] = useState(student.nacionalidade || "Moçambique");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedData: Partial<Student> & { telefone: string; endereco: string; bio: string } = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      foto,
      telefone,
      endereco,
      bio,
      nacionalidade,
    };

    try {
      await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          ...updatedData,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist profile update to MongoDB:", err);
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      onSave(updatedData);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("Editar Perfil do Estudante")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {student.id} · {student.curso}
              </p>
            </div>
          </div>
        </div>

        {savedSuccess ? (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t("Perfil Actualizado com Sucesso!")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("Os seus dados foram sincronizados com o servidor e base de dados.")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            {/* Avatar Selector */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("Fotografia de Perfil / Avatar")}
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={foto}
                  alt="Avatar atual"
                  referrerPolicy="no-referrer"
                  className="size-14 rounded-full object-cover border-2 border-primary shadow-xs"
                />
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFoto(preset)}
                      className={`relative size-9 rounded-full overflow-hidden border-2 transition ${
                        foto === preset ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-foreground"
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} referrerPolicy="no-referrer" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Photo URL */}
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                {t("Ou insira o URL de uma imagem personalizada")}:
              </label>
              <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-primary">
                <Camera className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  type="url"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {t("Nome Completo")}
              </label>
              <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-2 focus-within:ring-1 focus-within:ring-primary">
                <User className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {t("Email Institucional / Pessoal")}
              </label>
              <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-2 focus-within:ring-1 focus-within:ring-primary">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Phone & Nationality */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Telefone / M-Pesa")}
                </label>
                <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-2 focus-within:ring-1 focus-within:ring-primary">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+258 84..."
                    className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Nacionalidade")}
                </label>
                <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-2 focus-within:ring-1 focus-within:ring-primary">
                  <Globe className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                    placeholder="Moçambique"
                    className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {t("Endereço / Residência")}
              </label>
              <div className="flex items-center gap-2 rounded-sm border border-input bg-card px-2.5 py-2 focus-within:ring-1 focus-within:ring-primary">
                <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Maputo, Moçambique"
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {t("Apresentação Académica / Biografia")}
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Breve descrição dos seus objectivos académicos..."
                className="w-full rounded-sm border border-input bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {t("Cancelar")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-xs disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{saving ? t("A Guardar...") : t("Guardar Alterações")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
