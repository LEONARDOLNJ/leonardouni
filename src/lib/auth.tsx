import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { students, type Student } from "./uni-data";

export interface BaseAuthSession {
  address: string;
  signature: string;
  message: string;
  timestamp: string;
}

interface AuthContextType {
  user: Student | null;
  baseSession: BaseAuthSession | null;
  login: (emailOrId: string, password: string) => { success: boolean; error?: string };
  loginWithBaseAccount: (address: string, signature: string, message: string) => { success: boolean };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  resetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  baseSession: null,
  login: () => ({ success: false }),
  loginWithBaseAccount: () => ({ success: false }),
  logout: () => {},
  requestPasswordReset: () => ({ success: false, message: "" }),
  resetModalOpen: false,
  setResetModalOpen: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [baseSession, setBaseSession] = useState<BaseAuthSession | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    // Restore saved Base session if available
    const savedBaseSession = localStorage.getItem("ul-auth-base-session");
    if (savedBaseSession) {
      try {
        const parsed: BaseAuthSession = JSON.parse(savedBaseSession);
        setBaseSession(parsed);

        const shortAddr = `${parsed.address.slice(0, 6)}...${parsed.address.slice(-4)}`;
        const baseStudent: Student = {
          id: `BASE-${parsed.address.slice(2, 8).toUpperCase()}`,
          nome: `Estudante Base (${shortAddr})`,
          docId: parsed.address,
          tipoDocumento: "BI",
          curso: "Engenharia Informática",
          ano: 3,
          email: `${parsed.address.slice(2, 10).toLowerCase()}@base.eth`,
          nacionalidade: "Moçambique",
          isInternational: false,
          foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
        };
        setUser(baseStudent);
        return;
      } catch (e) {
        console.warn("Base auth session restore error:", e);
      }
    }

    const savedId = localStorage.getItem("ul-auth-student");
    if (savedId) {
      const found = students.find((s) => s.id === savedId || s.email === savedId);
      if (found) {
        setUser(found);
      }
    }
  }, []);

  const login = (emailOrId: string, _password: string) => {
    const trimmed = emailOrId.trim().toLowerCase();
    const found = students.find(
      (s) => s.id.toLowerCase() === trimmed || s.email.toLowerCase() === trimmed
    );

    if (!found) {
      return {
        success: false,
        error: "Nenhum estudante encontrado com este ID ou Email.",
      };
    }

    setUser(found);
    localStorage.setItem("ul-auth-student", found.id);
    return { success: true };
  };

  const loginWithBaseAccount = (address: string, signature: string, message: string) => {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    // Check if we have a default student or construct a Base-authenticated profile
    const existing = students.find((s) => s.email.toLowerCase().includes(address.toLowerCase().slice(2, 8))) || students[0];

    const baseStudent: Student = {
      ...existing,
      id: `BASE-${address.slice(2, 8).toUpperCase()}`,
      nome: `${existing.nome} (Base Account)`,
      email: `${address.slice(2, 10).toLowerCase()}@base.eth`,
    };

    const session: BaseAuthSession = {
      address,
      signature,
      message,
      timestamp: new Date().toISOString(),
    };

    setUser(baseStudent);
    setBaseSession(session);
    localStorage.setItem("ul-auth-student", baseStudent.id);
    localStorage.setItem("ul-auth-base-session", JSON.stringify(session));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setBaseSession(null);
    localStorage.removeItem("ul-auth-student");
    localStorage.removeItem("ul-auth-base-session");
    localStorage.removeItem("ul-web3-address");
    localStorage.removeItem("ul-web3-type");
    localStorage.removeItem("ul-web3-signature");
  };

  const requestPasswordReset = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    const found = students.find(
      (s) => s.email.toLowerCase() === trimmed || s.id.toLowerCase() === trimmed
    );

    if (!found) {
      return {
        success: false,
        message: "Não encontramos registo associado a este email.",
      };
    }

    return {
      success: true,
      message: `Enviamos as instruções de redefinição de senha para ${found.email}. Por favor verifique a sua caixa de entrada e spam.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        baseSession,
        login,
        loginWithBaseAccount,
        logout,
        requestPasswordReset,
        resetModalOpen,
        setResetModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

