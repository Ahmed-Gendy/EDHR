import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

interface AttendanceRecord {
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { records } = await request.json()

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: "No records provided" }, { status: 400 })
    }

    let imported = 0
    let updated = 0
    let errors = 0

    for (const record of records) {
      try {
        // Validate record
        if (!record.employeeId || !record.date) {
          errors++
          continue
        }

        // Parse date
        const dateObj = new Date(record.date)
        if (isNaN(dateObj.getTime())) {
          errors++
          continue
        }
        dateObj.setHours(0, 0, 0, 0)

        // Check if employee exists
        const employeeQuery = query(collection(firestore, "employees"), where("id", "==", record.employeeId))
        const employeeSnapshot = await getDocs(employeeQuery)

        if (employeeSnapshot.empty) {
          errors++
          continue
        }

        // Check if attendance record already exists
        const attendanceQuery = query(
          collection(firestore, "attendance"),
          where("employeeId", "==", record.employeeId),
          where("date", "==", Timestamp.fromDate(dateObj)),
        )
        const attendanceSnapshot = await getDocs(attendanceQuery)

        // Parse check-in and check-out times
        let checkIn = null
        let checkOut = null

        if (record.checkIn) {
          const [hours, minutes] = record.checkIn.split(":").map(Number)
          if (!isNaN(hours) && !isNaN(minutes)) {
            const checkInDate = new Date(dateObj)
            checkInDate.setHours(hours, minutes, 0, 0)
            checkIn = Timestamp.fromDate(checkInDate)
          }
        }

        if (record.checkOut) {
          const [hours, minutes] = record.checkOut.split(":").map(Number)
          if (!isNaN(hours) && !isNaN(minutes)) {
            const checkOutDate = new Date(dateObj)
            checkOutDate.setHours(hours, minutes, 0, 0)
            checkOut = Timestamp.fromDate(checkOutDate)
          }
        }

        // Determine status
        const status = record.status || "PRESENT"

        if (!attendanceSnapshot.empty) {
          // Update existing record
          const attendanceDoc = attendanceSnapshot.docs[0]
          await updateDoc(attendanceDoc.ref, {
            checkIn: checkIn,
            checkOut: checkOut,
            status,
            updatedAt: serverTimestamp(),
            updatedBy: session.id,
          })
          updated++
        } else {
          // Create new record
          await addDoc(collection(firestore, "attendance"), {
            employeeId: record.employeeId,
            date: Timestamp.fromDate(dateObj),
            checkIn,
            checkOut,
            status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: session.id,
            updatedBy: session.id,
          })
          imported++
        }
      } catch (error) {
        console.error("Error processing record:", error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      errors,
      message: `Successfully imported ${imported} records, updated ${updated} records, with ${errors} errors.`,
    })
  } catch (error) {
    console.error("Error importing attendance records:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while importing attendance records" },
      { status: 500 },
    )
  }
}
