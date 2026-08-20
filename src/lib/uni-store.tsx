import React, { createContext, useContext, useEffect, useState } from "react";
import {
  students as initialStudents,
  payments as initialPayments,
  fees as initialFees,
  type Student,
  type Payment,
  type Fee,
  type Method,
  findFee,
  feeDue,
} from "./uni-data";

interface UniStoreContextType {
  students: Student[];
  payments: Payment[];
  fees: Fee[];
  addStudent: (data: {
    id?: string;
    nome: string;
    docId: string;
    email: string;
    curso: string;
    ano: number;
  }) => Student;
  processPayment: (
    paymentId: string,
    amount: number,
    metodo: Method
  ) => { success: boolean; payment?: Payment };
  payInvoiceDirect: (
    studentId: string,
    feeId: string,
    amount: number,
    metodo: Method
  ) => { success: boolean; payment: Payment };
  recordServerPayment: (payment: Partial<Payment> & { studentId: string; valorPago: number }) => Payment;
  syncFromServer: (studentId?: string) => Promise<void>;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentOutstandingInvoices: (studentId: string) => {
    payment?: Payment;
    fee: Fee;
    dueAmount: number;
  }[];
  getStudentStats: (studentId: string) => {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  resetData: () => void;
}

const UniStoreContext = createContext<UniStoreContextType | null>(null);

const STORAGE_KEYS = {
  STUDENTS: "upm_students_v1",
  PAYMENTS: "upm_payments_v1",
};

export function UniStoreProvider({ children }: { children: React.ReactNode }) {
  const [studentsList, setStudentsList] = useState<Student[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return initialStudents;
  });

  const [paymentsList, setPaymentsList] = useState<Payment[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return initialPayments;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(studentsList));
    }
  }, [studentsList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(paymentsList));
    }
  }, [paymentsList]);

  // Synchronize state with backend server database so server ledger is authoritative
  const syncFromServer = async (studentId?: string) => {
    try {
      const queryParam = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
      const res = await fetch(`/api/payments/history${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
          setPaymentsList((prev) => {
            const serverItems: Payment[] = data.payments.map((sp: any) => ({
              id: sp.id || sp.reference || (sp._id ? String(sp._id) : `PAG-SRV-${Date.now()}`),
              studentId: sp.studentId || studentId || "EST-2024-001",
              feeId: sp.feeId || "PROP-01",
              valorPago: Number(sp.valorPago || sp.amount || 0),
              data: sp.data || (sp.timestamp ? sp.timestamp.split("T")[0] : new Date().toISOString().split("T")[0]),
              metodo: sp.metodo || (sp.channel ? (sp.channel.includes("mpesa") ? "M-Pesa" : "Debito Pay") : "Mobile Money"),
              estado: (sp.estado as any) || (sp.status === "completed" || sp.status === "success" ? "pago" : "pendente"),
              recibo: sp.recibo || sp.receiptNo || (sp.reference ? `REC-${sp.reference}` : `REC-SRV-${Date.now()}`),
            }));

            // Server ledger is authoritative: merge server items with non-duplicated local records
            const merged = [...serverItems];
            for (const localP of prev) {
              const existsOnServer = merged.some(
                (s) =>
                  s.id === localP.id ||
                  (localP.recibo && s.recibo === localP.recibo) ||
                  (s.feeId === localP.feeId && s.studentId === localP.studentId && s.valorPago === localP.valorPago)
              );
              if (!existsOnServer) {
                merged.push(localP);
              }
            }
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("[UniStore] Server sync notice (offline mode fallback):", err);
    }
  };

  useEffect(() => {
    // Initial background sync against /api/payments/history so payments made via backend gateway routes immediately reflect
    syncFromServer();

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("upm_auth_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) {
            syncFromServer(parsed.id);
          }
        }
      } catch {
        // Ignore JSON parse errors in local storage
      }
    }
  }, []);

  const recordServerPayment = (paymentData: Partial<Payment> & { studentId: string; valorPago: number }): Payment => {
    const feeId = paymentData.feeId || "PROP-01";
    const fee = findFee(feeId);
    const totalFeeVal = fee?.valor ?? paymentData.valorPago;
    const isFullyPaid = paymentData.valorPago >= totalFeeVal;

    const receipt =
      paymentData.recibo ||
      (isFullyPaid ? `REC-${Math.floor(1000 + Math.random() * 9000)}` : "");

    const newPayment: Payment = {
      id: paymentData.id || `PAG-SRV-${Date.now()}`,
      studentId: paymentData.studentId,
      feeId,
      valorPago: paymentData.valorPago,
      data: paymentData.data || new Date().toISOString().split("T")[0],
      metodo: paymentData.metodo || "Mobile Money",
      estado: (paymentData.estado as any) || (isFullyPaid ? "pago" : "pendente"),
      recibo: receipt,
    };

    setPaymentsList((prev) => {
      const idx = prev.findIndex(
        (p) => p.id === newPayment.id || (newPayment.recibo && p.recibo === newPayment.recibo)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newPayment;
        return copy;
      }
      return [newPayment, ...prev];
    });

    // Asynchronously push to server ledger history
    fetch("/api/payments/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPayment),
    }).catch((e) => console.warn("[UniStore] Background server sync warning:", e));

    return newPayment;
  };

  const addStudent = (data: {
    id?: string;
    nome: string;
    docId: string;
    email: string;
    curso: string;
    ano: number;
  }): Student => {
    const studentId =
      data.id && data.id.trim()
        ? data.id.trim()
        : `EST-${new Date().getFullYear()}-${String(studentsList.length + 1).padStart(3, "0")}`;

    const newStudent: Student = {
      id: studentId,
      nome: data.nome,
      docId: data.docId,
      email: data.email,
      curso: data.curso,
      ano: Number(data.ano),
    };

    setStudentsList((prev) => [newStudent, ...prev]);

    // Automatically generate applicable pending invoices for this new student
    const applicableFees = initialFees.filter(
      (f) => f.curso === "Todos" || f.curso === data.curso
    );

    const todayIso = new Date().toISOString().split("T")[0];
    const newPayments: Payment[] = applicableFees.map((fee, idx) => ({
      id: `PAG-${Date.now() + idx}`,
      studentId: studentId,
      feeId: fee.id,
      valorPago: 0,
      data: todayIso,
      metodo: "Mobile Money",
      estado: "pendente",
      recibo: "",
    }));

    setPaymentsList((prev) => [...newPayments, ...prev]);

    return newStudent;
  };

  const processPayment = (paymentId: string, amount: number, metodo: Method) => {
    let updatedPayment: Payment | undefined;

    setPaymentsList((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          const fee = findFee(p.feeId);
          const totalFeeVal = fee?.valor ?? 0;
          const newValorPago = p.valorPago + amount;
          const isFullyPaid = newValorPago >= totalFeeVal;
          const receiptNo =
            p.recibo || (isFullyPaid ? `REC-${Math.floor(1000 + Math.random() * 9000)}` : "");

          updatedPayment = {
            ...p,
            valorPago: Math.min(newValorPago, totalFeeVal),
            data: new Date().toISOString().split("T")[0],
            metodo,
            estado: isFullyPaid ? "pago" : "pendente",
            recibo: receiptNo,
          };
          return updatedPayment;
        }
        return p;
      })
    );

    if (updatedPayment) {
      fetch("/api/payments/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayment),
      }).catch((e) => console.warn("[UniStore] Background payment sync warning:", e));
    }

    return { success: !!updatedPayment, payment: updatedPayment };
  };

  const payInvoiceDirect = (
    studentId: string,
    feeId: string,
    amount: number,
    metodo: Method
  ) => {
    // Check if an existing payment record exists for this student & fee
    const existing = paymentsList.find(
      (p) => p.studentId === studentId && p.feeId === feeId && p.estado !== "pago"
    );

    if (existing) {
      const res = processPayment(existing.id, amount, metodo);
      return { success: res.success, payment: res.payment! };
    }

    // Create a new payment record if none exists
    const fee = findFee(feeId);
    const totalFeeVal = fee?.valor ?? amount;
    const isFullyPaid = amount >= totalFeeVal;
    const receiptNo = isFullyPaid ? `REC-${Math.floor(1000 + Math.random() * 9000)}` : "";

    const newPayment: Payment = {
      id: `PAG-${Date.now()}`,
      studentId,
      feeId,
      valorPago: Math.min(amount, totalFeeVal),
      data: new Date().toISOString().split("T")[0],
      metodo,
      estado: isFullyPaid ? "pago" : "pendente",
      recibo: receiptNo,
    };

    setPaymentsList((prev) => [newPayment, ...prev]);

    fetch("/api/payments/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPayment),
    }).catch((e) => console.warn("[UniStore] Background payment direct sync warning:", e));

    return { success: true, payment: newPayment };
  };

  const getStudentPayments = (studentId: string) => {
    return paymentsList.filter((p) => p.studentId === studentId);
  };

  const getStudentOutstandingInvoices = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId);
    if (!student) return [];

    // All fees applicable to student
    const applicableFees = initialFees.filter(
      (f) => f.curso === "Todos" || f.curso === student.curso
    );

    return applicableFees
      .map((fee) => {
        const payment = paymentsList.find(
          (p) => p.studentId === studentId && p.feeId === fee.id
        );
        const paid = payment ? payment.valorPago : 0;
        const dueAmount = Math.max(fee.valor - paid, 0);

        return {
          payment,
          fee,
          dueAmount,
        };
      })
      .filter((item) => item.dueAmount > 0);
  };

  const getStudentStats = (studentId: string) => {
    const studentPayments = getStudentPayments(studentId);
    const totalPaid = studentPayments.reduce((a, p) => a + p.valorPago, 0);

    const student = studentsList.find((s) => s.id === studentId);
    const applicableFees = initialFees.filter(
      (f) => f && (f.curso === "Todos" || f.curso === student?.curso)
    );

    const totalInvoiced = applicableFees.reduce((a, f) => a + f.valor, 0);
    const totalOutstanding = Math.max(totalInvoiced - totalPaid, 0);

    return { totalInvoiced, totalPaid, totalOutstanding };
  };

  const resetData = () => {
    setStudentsList(initialStudents);
    setPaymentsList(initialPayments);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    }
  };

  return (
    <UniStoreContext.Provider
      value={{
        students: studentsList,
        payments: paymentsList,
        fees: initialFees,
        addStudent,
        processPayment,
        payInvoiceDirect,
        recordServerPayment,
        syncFromServer,
        getStudentPayments,
        getStudentOutstandingInvoices,
        getStudentStats,
        resetData,
      }}
    >
      {children}
    </UniStoreContext.Provider>
  );
}

export function useUniStore() {
  const ctx = useContext(UniStoreContext);
  if (!ctx) {
    throw new Error("useUniStore must be used within UniStoreProvider");
  }
  return ctx;
}
