import { ref, push, set } from "firebase/database"
import { database } from "./firebase"

export interface ImportResult {
  success: boolean
  imported: number
  errors: number
  errorDetails?: string[]
}

export async function importDailyWorkers(data: any[], userId: string): Promise<ImportResult> {
  let imported = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.firstName || !row.lastName || !row.specialization || !row.dailyRate) {
        errors++
        errorDetails.push(`Missing required fields for worker: ${row.firstName || ""} ${row.lastName || ""}`)
        continue
      }

      // Create worker record
      const workerRef = push(ref(database, "dailyWorkers"))
      await set(workerRef, {
        id: workerRef.key,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone || "",
        specialization: row.specialization,
        dailyRate: Number(row.dailyRate),
        status: row.status || "ACTIVE",
        hireDate: row.hireDate || new Date().toISOString().split("T")[0],
        bankName: row.bankName || null,
        accountNumber: row.accountNumber || null,
        notes: row.notes || null,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
      })

      imported++
    } catch (error) {
      console.error("Error importing worker:", error)
      errors++
      errorDetails.push(`Error importing worker: ${row.firstName || ""} ${row.lastName || ""}`)
    }
  }

  return {
    success: imported > 0,
    imported,
    errors,
    errorDetails,
  }
}

export async function importAttendanceRecords(data: any[], userId: string): Promise<ImportResult> {
  let imported = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.workerId || !row.siteId || !row.date || !row.status) {
        errors++
        errorDetails.push(`Missing required fields for attendance record: Worker ID ${row.workerId || "unknown"}`)
        continue
      }

      // Create attendance record
      const attendanceRef = push(ref(database, "dailyAttendance"))
      await set(attendanceRef, {
        id: attendanceRef.key,
        workerId: row.workerId,
        siteId: row.siteId,
        date: row.date,
        checkIn: row.checkIn || null,
        checkOut: row.checkOut || null,
        hoursWorked: row.hoursWorked ? Number(row.hoursWorked) : null,
        status: row.status,
        notes: row.notes || null,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      imported++
    } catch (error) {
      console.error("Error importing attendance record:", error)
      errors++
      errorDetails.push(`Error importing attendance for worker ID: ${row.workerId || "unknown"}`)
    }
  }

  return {
    success: imported > 0,
    imported,
    errors,
    errorDetails,
  }
}

export async function importConstructionSites(data: any[], userId: string): Promise<ImportResult> {
  let imported = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.name || !row.location || !row.startDate || !row.expectedEndDate || !row.budget || !row.clientName) {
        errors++
        errorDetails.push(`Missing required fields for site: ${row.name || "unknown"}`)
        continue
      }

      // Create site record
      const siteRef = push(ref(database, "constructionSites"))
      await set(siteRef, {
        id: siteRef.key,
        name: row.name,
        location: row.location,
        startDate: row.startDate,
        expectedEndDate: row.expectedEndDate,
        actualEndDate: row.actualEndDate || null,
        status: row.status || "ACTIVE",
        budget: Number(row.budget),
        clientName: row.clientName,
        projectManagerId: row.projectManagerId || null,
        notes: row.notes || null,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
      })

      imported++
    } catch (error) {
      console.error("Error importing site:", error)
      errors++
      errorDetails.push(`Error importing site: ${row.name || "unknown"}`)
    }
  }

  return {
    success: imported > 0,
    imported,
    errors,
    errorDetails,
  }
}
