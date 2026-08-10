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
