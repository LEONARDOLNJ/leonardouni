import { LanguageProvider } from "@/lib/i18n";
import { RouterProvider, useRouter } from "@/lib/router";
import { UniStoreProvider } from "@/lib/uni-store";
import { Dashboard } from "@/pages/Dashboard";
import { Estudantes } from "@/pages/Estudantes";
import { Propinas } from "@/pages/Propinas";
import { Pagamentos } from "@/pages/Pagamentos";
import { Recibos } from "@/pages/Recibos";
import { Documentos } from "@/pages/Documentos";
import { OrientadorPage } from "@/pages/Orientador";

function AppRoutes() {
  const { path } = useRouter();

  if (path === "/orientador") {
    return <OrientadorPage />;
  }
  if (path === "/estudantes") {
    return <Estudantes />;
  }
  if (path === "/propinas") {
    return <Propinas />;
  }
  if (path === "/pagamentos") {
    return <Pagamentos />;
  }
  if (path === "/recibos") {
    return <Recibos />;
  }
  if (path === "/documentos") {
    return <Documentos />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <LanguageProvider>
      <UniStoreProvider>
        <RouterProvider>
          <AppRoutes />
        </RouterProvider>
      </UniStoreProvider>
    </LanguageProvider>
  );
}
