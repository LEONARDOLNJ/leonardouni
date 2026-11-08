import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { RoleProvider } from "@/lib/role";
import { Web3Provider } from "@/lib/web3-base";
import { SubscriptionProvider } from "@/lib/subscription-store";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { OfflineStatusBanner } from "@/components/OfflineStatusBanner";
import { RouterProvider, useRouter } from "@/lib/router";
import { UniStoreProvider } from "@/lib/uni-store";
import { Dashboard } from "@/pages/Dashboard";
import { Estudantes } from "@/pages/Estudantes";
import { Propinas } from "@/pages/Propinas";
import { Pagamentos } from "@/pages/Pagamentos";
import { Recibos } from "@/pages/Recibos";
import { Documentos } from "@/pages/Documentos";
import { OrientadorPage } from "@/pages/Orientador";
import { Subscricoes } from "@/pages/Subscricoes";
import { Login } from "@/pages/Login";
import { StudentPortal } from "@/pages/StudentPortal";
import { AcademicAnalytics } from "@/pages/AcademicAnalytics";
import { CampusHub } from "@/pages/CampusHub";
import { PainelFuncionario } from "@/pages/PainelFuncionario";
import { VerificarDocumento } from "@/pages/VerificarDocumento";

function AppRoutes() {
  const { path } = useRouter();

  if (path === "/login") {
    return <Login />;
  }
  if (path === "/portal" || path === "/perfil" || path === "/profile") {
    return <StudentPortal />;
  }
  if (path === "/analytics") {
    return <AcademicAnalytics />;
  }
  if (path === "/hub") {
    return <CampusHub />;
  }
  if (path === "/orientador") {
    return <OrientadorPage />;
  }
  if (path === "/subscricoes") {
    return <Subscricoes />;
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
  if (path === "/verificar" || path === "/verify" || path === "/validar") {
    return <VerificarDocumento />;
  }
  if (path === "/painel-funcionario" || path === "/administracao" || path === "/staff") {
    return <PainelFuncionario />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RoleProvider>
            <Web3Provider>
              <SubscriptionProvider>
                <UniStoreProvider>
                  <RouterProvider>
                    <OfflineStatusBanner />
                    <AppRoutes />
                    <SubscriptionModal />
                  </RouterProvider>
                </UniStoreProvider>
              </SubscriptionProvider>
            </Web3Provider>
          </RoleProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
