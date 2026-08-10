import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { students, type Student } from "./uni-data";

interface AuthContextType {
  user: Student | null;
  login: (emailOrId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  resetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => ({ success: false }),
  logout: () => {},
  requestPasswordReset: () => ({ success: false, message: "" }),
  resetModalOpen: false,
  setResetModalOpen: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ul-auth-student");
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
        login,
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
