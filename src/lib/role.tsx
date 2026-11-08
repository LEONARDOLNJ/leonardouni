import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth";

export type RoleType = "student" | "worker";

export interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "treasury" | "registry" | "faculty" | "director";
  department: string;
  cargo: string;
  accessLevel: 1 | 2 | 3; // 1: Staff, 2: Manager/Finance, 3: SuperAdmin
  phone?: string;
  avatar?: string;
  pin?: string;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export const WORKER_PRESETS: WorkerProfile[] = [
  {
    id: "FUNC-DIR-001",
    name: "Dr. Alberto Cossa",
    email: "secretaria.financas@ul.ac.mz",
    role: "treasury",
    department: "Secretaria Financeira & Tesouraria Central",
    cargo: "Secretário Financeiro & Tesoureiro Geral",
    accessLevel: 3,
    phone: "+258 84 312 9901",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    pin: "1717",
    mfaEnabled: true,
    lastLogin: "2026-08-21 16:45",
  },
  {
    id: "FUNC-TES-002",
    name: "Dra. Celina Nhantumbo",
    email: "tesouraria.cobrancas@ul.ac.mz",
    role: "treasury",
    department: "Gabinete de Cobranças & Propinas",
    cargo: "Oficial de Tesouraria & Cobranças",
    accessLevel: 2,
    phone: "+258 82 455 1022",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    pin: "2026",
    mfaEnabled: true,
    lastLogin: "2026-08-21 15:30",
  },
  {
    id: "FUNC-REG-003",
    name: "Eng. Paulo Macuácua",
    email: "registo.academico@ul.ac.mz",
    role: "registry",
    department: "Secretaria & Registo Académico",
    cargo: "Oficial de Registo e Inscrições",
    accessLevel: 2,
    phone: "+258 87 900 3411",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    pin: "8899",
    mfaEnabled: false,
    lastLogin: "2026-08-21 14:10",
  },
  {
    id: "FUNC-ADM-004",
    name: "Dra. Helena Mabunda",
    email: "direcao.pedagogica@ul.ac.mz",
    role: "director",
    department: "Direcção Académica & Assuntos Pedagógicos",
    cargo: "Directora Académica & Pedagógica",
    accessLevel: 3,
    phone: "+258 84 881 7733",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    pin: "3344",
    mfaEnabled: true,
    lastLogin: "2026-08-20 18:00",
  },
  {
    id: "FUNC-SYS-005",
    name: "Dr. Simão Langa",
    email: "seguranca.sistemas@ul.ac.mz",
    role: "admin",
    department: "Centro de Tecnologias de Informação & Segurança",
    cargo: "Administrador de Sistemas & Cibersegurança",
    accessLevel: 3,
    phone: "+258 85 110 9944",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80",
    pin: "9900",
    mfaEnabled: true,
    lastLogin: "2026-08-21 17:05",
  },
];

interface RoleContextType {
  currentRole: RoleType;
  setRole: (role: RoleType) => void;
  toggleRole: () => void;
  isWorker: boolean;
  isStudent: boolean;
  workerProfile: WorkerProfile;
  setWorkerProfile: (profile: WorkerProfile) => void;
}

const RoleContext = createContext<RoleContextType>({
  currentRole: "worker",
  setRole: () => {},
  toggleRole: () => {},
  isWorker: true,
  isStudent: false,
  workerProfile: WORKER_PRESETS[0],
  setWorkerProfile: () => {},
});

const ROLE_STORAGE_KEY = "ul_app_active_role";
const WORKER_PROFILE_STORAGE_KEY = "ul_app_worker_profile";

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Default to student if a student is logged in, else worker (or read from localStorage)
  const [currentRole, setCurrentRoleState] = useState<RoleType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as RoleType | null;
      if (saved === "student" || saved === "worker") {
        return saved;
      }
    }
    return "worker"; // Default mode for high visibility of features
  });

  const [workerProfile, setWorkerProfileState] = useState<WorkerProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(WORKER_PROFILE_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return WORKER_PRESETS[0];
  });

  const setRole = (newRole: RoleType) => {
    setCurrentRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    }
  };

  const toggleRole = () => {
    const target = currentRole === "worker" ? "student" : "worker";
    setRole(target);
  };

  const setWorkerProfile = (profile: WorkerProfile) => {
    setWorkerProfileState(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole,
        toggleRole,
        isWorker: currentRole === "worker",
        isStudent: currentRole === "student",
        workerProfile,
        setWorkerProfile,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

/**
 * Access Control Wrapper Component:
 * Renders children only if current role is 'worker' (university staff / employee).
 * Optionally renders a custom fallback.
 */
export function WorkerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isWorker } = useRole();
  if (!isWorker) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Access Control Wrapper Component:
 * Renders children only if current role is 'student'.
 * Optionally renders a custom fallback.
 */
export function StudentOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isStudent } = useRole();
  if (!isStudent) return <>{fallback}</>;
  return <>{children}</>;
}
