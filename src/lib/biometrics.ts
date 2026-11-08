/**
 * Biometrics & WebAuthn / Passkey Authentication Manager
 * Handles browser Credentials API detection, PublicKeyCredential simulation,
 * and biometric identity assertions for Leonardo University Student Portal.
 */

export interface BiometricCredential {
  id: string;
  studentId: string;
  studentName: string;
  type: "fingerprint" | "face_id" | "passkey" | "security_key";
  deviceName: string;
  registeredAt: string;
  lastUsedAt: string;
  credentialId: string;
  publicKeyFingerprint: string;
  isRegistered: boolean;
  biometricScore?: number;
}

export interface StudentBiometricSettings {
  studentId: string;
  fastLoginEnabled: boolean;
  biometricPaymentsEnabled: boolean;
  biometricGradesEnabled: boolean;
  preferredMethod: "fingerprint" | "face_id" | "passkey";
  autoPromptOnPortal: boolean;
  requireBiometricsForClearance: boolean;
  faceRegistered: boolean;
  faceRegisteredAt?: string;
  faceModelName?: string;
  fingerprintRegistered: boolean;
  fingerprintRegisteredAt?: string;
  fingerprintDeviceName?: string;
  tpmProtected: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "ul_biometric_credentials_v1";
const SETTINGS_STORAGE_PREFIX = "ul_biometric_settings_v1_";

export const DEFAULT_BIOMETRIC_CREDENTIALS: BiometricCredential[] = [
  {
    id: "bio_est_001",
    studentId: "EST-2024-001",
    studentName: "Leonardo Nhantumbo",
    type: "fingerprint",
    deviceName: "MacBook Pro (Touch ID / Secure Enclave)",
    registeredAt: "2026-02-10T09:30:00Z",
    lastUsedAt: "2026-08-21T14:20:00Z",
    credentialId: "cred_ul_touchid_98f4e2a1b7c3d5",
    publicKeyFingerprint: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    isRegistered: true,
    biometricScore: 98.4,
  },
  {
    id: "bio_est_002",
    studentId: "EST-2024-002",
    studentName: "Amina Abdala",
    type: "face_id",
    deviceName: "iPhone 15 Pro (Face ID)",
    registeredAt: "2026-03-14T11:15:00Z",
    lastUsedAt: "2026-08-19T08:45:00Z",
    credentialId: "cred_ul_faceid_12a7c4e9b0d8f3",
    publicKeyFingerprint: "SHA256:7d8a29b4e5f61038c92a183b0f7e41d8a2c4e6f9b1d3a5c7e8f0b2d4a6c8e1f3",
    isRegistered: true,
    biometricScore: 99.1,
  },
  {
    id: "bio_est_006",
    studentId: "EST-2024-006",
    studentName: "Jean-Luc Dubois",
    type: "passkey",
    deviceName: "Windows Hello (Biometria Facial / TPM 2.0)",
    registeredAt: "2026-04-02T16:00:00Z",
    lastUsedAt: "2026-08-20T10:10:00Z",
    credentialId: "cred_ul_winhello_55e3a8b2c1d9f4",
    publicKeyFingerprint: "SHA256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    isRegistered: true,
    biometricScore: 97.8,
  },
];

export function getDefaultBiometricSettings(studentId: string): StudentBiometricSettings {
  const isDefaultEnrolled = studentId === "EST-2024-001" || studentId === "EST-2024-002";
  return {
    studentId,
    fastLoginEnabled: true,
    biometricPaymentsEnabled: true,
    biometricGradesEnabled: false,
    preferredMethod: studentId === "EST-2024-002" ? "face_id" : "fingerprint",
    autoPromptOnPortal: false,
    requireBiometricsForClearance: true,
    faceRegistered: studentId === "EST-2024-002",
    faceRegisteredAt: studentId === "EST-2024-002" ? "2026-03-14T11:15:00Z" : undefined,
    faceModelName: studentId === "EST-2024-002" ? "TrueDepth Camera 3D Mesh" : undefined,
    fingerprintRegistered: studentId === "EST-2024-001" || isDefaultEnrolled,
    fingerprintRegisteredAt: isDefaultEnrolled ? "2026-02-10T09:30:00Z" : undefined,
    fingerprintDeviceName: isDefaultEnrolled ? "Touch ID (Enclave Seguro FIDO2)" : undefined,
    tpmProtected: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Checks if the browser natively supports WebAuthn / PublicKeyCredential
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.get === "function"
  );
}

/**
 * Retrieve saved biometric credentials from localStorage or defaults
 */
export function getSavedBiometricCredentials(): BiometricCredential[] {
  if (typeof window === "undefined") return DEFAULT_BIOMETRIC_CREDENTIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BIOMETRIC_CREDENTIALS));
      return DEFAULT_BIOMETRIC_CREDENTIALS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load biometric credentials from localStorage", err);
    return DEFAULT_BIOMETRIC_CREDENTIALS;
  }
}

/**
 * Retrieve saved biometric settings for a specific student
 */
export function getStudentBiometricSettings(studentId: string): StudentBiometricSettings {
  if (typeof window === "undefined") return getDefaultBiometricSettings(studentId);
  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${studentId}`);
    if (!raw) {
      const defaults = getDefaultBiometricSettings(studentId);
      localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${studentId}`, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return { ...getDefaultBiometricSettings(studentId), ...parsed };
  } catch (err) {
    console.warn("Failed to load biometric settings from localStorage", err);
    return getDefaultBiometricSettings(studentId);
  }
}

/**
 * Save updated biometric settings for a specific student
 */
export function saveStudentBiometricSettings(
  studentId: string,
  settings: Partial<StudentBiometricSettings>
): StudentBiometricSettings {
  const current = getStudentBiometricSettings(studentId);
  const updated: StudentBiometricSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${studentId}`, JSON.stringify(updated));
    // Dispatch custom storage event for live UI reactivity
    window.dispatchEvent(
      new CustomEvent("ul_biometric_settings_updated", {
        detail: { studentId, settings: updated },
      })
    );
  }

  return updated;
}

/**
 * Register a new device biometric credential for a student
 */
export function registerBiometricCredential(
  studentId: string,
  studentName: string,
  type: "fingerprint" | "face_id" | "passkey" | "security_key",
  deviceName?: string,
  score?: number
): BiometricCredential {
  const creds = getSavedBiometricCredentials();
  const hex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  const newCred: BiometricCredential = {
    id: `bio_${Date.now()}`,
    studentId,
    studentName,
    type,
    deviceName: deviceName || (type === "face_id" ? "Sensor Facial 3D (Face ID)" : "Sensor Biométrico (Touch ID / FIDO2)"),
    registeredAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    credentialId: `cred_ul_${type}_${hex}`,
    publicKeyFingerprint: `SHA256:${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`,
    isRegistered: true,
    biometricScore: score || 98.6,
  };

  const filtered = creds.filter((c) => !(c.studentId === studentId && c.type === type));
  const updated = [newCred, ...filtered];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Also update student biometric preferences
  const currentSettings = getStudentBiometricSettings(studentId);
  if (type === "face_id") {
    saveStudentBiometricSettings(studentId, {
      faceRegistered: true,
      faceRegisteredAt: newCred.registeredAt,
      faceModelName: newCred.deviceName,
      preferredMethod: currentSettings.preferredMethod || "face_id",
    });
  } else if (type === "fingerprint") {
    saveStudentBiometricSettings(studentId, {
      fingerprintRegistered: true,
      fingerprintRegisteredAt: newCred.registeredAt,
      fingerprintDeviceName: newCred.deviceName,
      preferredMethod: currentSettings.preferredMethod || "fingerprint",
    });
  }

  return newCred;
}

/**
 * Delete / revoke a specific biometric credential
 */
export function deleteBiometricCredential(credentialId: string, studentId?: string): boolean {
  const creds = getSavedBiometricCredentials();
  const target = creds.find((c) => c.id === credentialId);
  const updated = creds.filter((c) => c.id !== credentialId);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  if (target && target.studentId) {
    const sId = studentId || target.studentId;
    if (target.type === "face_id") {
      saveStudentBiometricSettings(sId, {
        faceRegistered: false,
        faceRegisteredAt: undefined,
        faceModelName: undefined,
      });
    } else if (target.type === "fingerprint") {
      saveStudentBiometricSettings(sId, {
        fingerprintRegistered: false,
        fingerprintRegisteredAt: undefined,
        fingerprintDeviceName: undefined,
      });
    }
  }

  return true;
}

/**
 * Simulates a subtle synthesized audio cue for biometric verification
 */
export function playBiometricSuccessSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}
