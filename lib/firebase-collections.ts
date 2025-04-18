import { collection, doc, addDoc, updateDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

// Collection references
export const constructionSitesCollection = collection(firestore, "constructionSites")
export const dailyWorkersCollection = collection(firestore, "dailyWorkers")
export const dailyAttendanceCollection = collection(firestore, "dailyAttendance")
export const payrollCollection = collection(firestore, "payroll")
export const penaltiesCollection = collection(firestore, "penalties")
export const bankInformationCollection = collection(firestore, "bankInformation")
export const bankTransactionsCollection = collection(firestore, "bankTransactions")

// Helper functions for construction sites
export async function createConstructionSite(siteData: any) {
  return await addDoc(constructionSitesCollection, {
    ...siteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  })
}

export async function updateConstructionSite(siteId: string, siteData: any) {
  const siteRef = doc(firestore, "constructionSites", siteId)
  return await updateDoc(siteRef, {
    ...siteData,
    updatedAt: serverTimestamp(),
  })
}

// Helper functions for daily workers
export async function createDailyWorker(workerData: any) {
  return await addDoc(dailyWorkersCollection, {
    ...workerData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  })
}

export async function updateDailyWorker(workerId: string, workerData: any) {
  const workerRef = doc(firestore, "dailyWorkers", workerId)
  return await updateDoc(workerRef, {
    ...workerData,
    updatedAt: serverTimestamp(),
  })
}

// Helper functions for daily attendance
export async function recordDailyAttendance(attendanceData: any) {
  // Check if attendance record already exists for this worker and date
  const attendanceQuery = query(
    dailyAttendanceCollection,
    where("workerId", "==", attendanceData.workerId),
    where("date", "==", attendanceData.date),
  )

  const snapshot = await getDocs(attendanceQuery)

  if (!snapshot.empty) {
    // Update existing record
    const docId = snapshot.docs[0].id
    const attendanceRef = doc(firestore, "dailyAttendance", docId)
    return await updateDoc(attendanceRef, {
      ...attendanceData,
      updatedAt: serverTimestamp(),
    })
  } else {
    // Create new record
    return await addDoc(dailyAttendanceCollection, {
      ...attendanceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

// Helper functions for payroll
export async function createPayroll(payrollData: any) {
  return await addDoc(payrollCollection, {
    ...payrollData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updatePayrollStatus(payrollId: string, status: string, paymentDetails?: any) {
  const payrollRef = doc(firestore, "payroll", payrollId)
  return await updateDoc(payrollRef, {
    status,
    ...(paymentDetails || {}),
    updatedAt: serverTimestamp(),
  })
}

// Helper functions for penalties
export async function createPenalty(penaltyData: any) {
  return await addDoc(penaltiesCollection, {
    ...penaltyData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Helper functions for bank information
export async function createBankInformation(bankData: any) {
  return await addDoc(bankInformationCollection, {
    ...bankData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Helper functions for bank transactions
export async function recordBankTransaction(transactionData: any) {
  return await addDoc(bankTransactionsCollection, {
    ...transactionData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
