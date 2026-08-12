import { Shell } from "@/components/Shell";
import { AIOrientador } from "@/components/AIOrientador";
import { useI18n } from "@/lib/i18n";
import studentSupportImg from "@/assets/images/student_support_1786439415676.jpg";

export function OrientadorPage() {
  const { t } = useI18n();

  return (
    <Shell
      titulo="Orientador IA do Estudante"
      descricao="Ferramenta de Inteligência Artificial para orientar os estudantes da Leonardo University com base nas suas escolhas de curso, ano lectivo e preferências financeiras."
      imagem={studentSupportImg}
    >
      <AIOrientador />
    </Shell>
  );
}
