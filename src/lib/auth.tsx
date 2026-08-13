import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { students, type Student } from "./uni-data";
import { logStudentActivity, trackStudentLocation } from "./location";

export interface BaseAuthSession {
  address: string;
  signature: string;
  message: string;
  timestamp: string;
}

export interface SignupData {
  nome: string;
  email: string;
  password?: string;
  curso?: string;
  ano?: number;
  docId?: string;
  tipoDocumento?: "BI" | "Passaporte" | "DIRE";
  nacionalidade?: string;
  isInternational?: boolean;
  foto?: string;
}

interface AuthContextType {
  user: Student | null;
  baseSession: BaseAuthSession | null;
  login: (emailOrId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  loginWithBaseAccount: (address: string, signature: string, message: string) => { success: boolean };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  resetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  baseSession: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
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

    const savedUserJson = localStorage.getItem("ul-auth-student-obj");
    if (savedUserJson) {
      try {
        setUser(JSON.parse(savedUserJson));
        return;
      } catch (err) {
        console.warn("User restore error:", err);
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

  const signup = async (data: SignupData) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        return { success: false, error: body.error || "Erro ao criar conta." };
      }

      const newStudent: Student = body.student;
      setUser(newStudent);
      localStorage.setItem("ul-auth-student", newStudent.id);
      localStorage.setItem("ul-auth-student-obj", JSON.stringify(newStudent));

      // Trigger location tracking and activity logging in background
      trackStudentLocation(newStudent.id);
      logStudentActivity(newStudent.id, "SIGNUP_SUCCESS", { email: newStudent.email });

      return { success: true };
    } catch (err: any) {
      console.warn("MongoDB signup sync fallback:", err);

      // Fallback local creation if offline
      const fallbackStudent: Student = {
        id: `EST-2026-${Math.floor(100 + Math.random() * 900)}`,
        nome: data.nome,
        email: data.email,
        docId: data.docId || `${Math.floor(10000000 + Math.random() * 90000000)}M`,
        tipoDocumento: data.tipoDocumento || "BI",
        curso: data.curso || "Engenharia Informática",
        ano: data.ano || 1,
        nacionalidade: data.nacionalidade || "Moçambique",
        isInternational: Boolean(data.isInternational),
        foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      };

      setUser(fallbackStudent);
      localStorage.setItem("ul-auth-student", fallbackStudent.id);
      localStorage.setItem("ul-auth-student-obj", JSON.stringify(fallbackStudent));
      return { success: true };
    }
  };

  const login = async (emailOrId: string, password: string) => {
    const trimmed = emailOrId.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmed, password }),
      });

      const body = await res.json();
      if (res.ok && body.success && body.student) {
        const student: Student = body.student;
        setUser(student);
        localStorage.setItem("ul-auth-student", student.id);
        localStorage.setItem("ul-auth-student-obj", JSON.stringify(student));

        // Track location and record activity log
        trackStudentLocation(student.id);
        logStudentActivity(student.id, "LOGIN_SUCCESS", { email: student.email });

        return { success: true };
      }
    } catch (err) {
      console.warn("MongoDB login sync fallback:", err);
    }

    // Local default students fallback
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
    localStorage.setItem("ul-auth-student-obj", JSON.stringify(found));

    // Track location and activity
    trackStudentLocation(found.id);
    logStudentActivity(found.id, "LOGIN_SUCCESS", { email: found.email });

    return { success: true };
  };

  const loginWithBaseAccount = (address: string, signature: string, message: string) => {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    localStorage.setItem("ul-auth-student-obj", JSON.stringify(baseStudent));
    localStorage.setItem("ul-auth-base-session", JSON.stringify(session));

    // Log Base Account login in MongoDB
    trackStudentLocation(baseStudent.id);
    logStudentActivity(baseStudent.id, "BASE_ACCOUNT_LOGIN", { address, signature });

    return { success: true };
  };

  const logout = () => {
    if (user?.id) {
      logStudentActivity(user.id, "LOGOUT", {});
    }
    setUser(null);
    setBaseSession(null);
    localStorage.removeItem("ul-auth-student");
    localStorage.removeItem("ul-auth-student-obj");
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
        signup,
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
