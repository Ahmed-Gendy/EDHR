import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { employeeId, date } = await request.json()

    if (!employeeId || !date) {
      return NextResponse.json({ success: false, message: "Employee ID and date are required" }, { status: 400 })
    }

    // Parse date string to Date object
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    // Check if attendance record already exists
    const attendanceQuery = query(
      collection(firestore, "attendance"),
      where("employeeId", "==", employeeId),
      where("date", "==", Timestamp.fromDate(dateObj)),
    )

    const attendanceSnapshot = await getDocs(attendanceQuery)

    const now = new Date()
    let status = "PRESENT"

    // Check if check-in is late (after 9:00 AM)
    const workdayStart = new Date(now)
    workdayStart.setHours(9, 0, 0, 0)

    if (now > workdayStart) {
      // If more than 15 minutes late
      if (now.getTime() - workdayStart.getTime() > 15 * 60 * 1000) {
        status = "LATE"
      }
    }

    if (!attendanceSnapshot.empty) {
      // Update existing record
      const attendanceDoc = attendanceSnapshot.docs[0]
      await updateDoc(attendanceDoc.ref, {
        checkIn: Timestamp.now(),
        status,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new record
      await addDoc(collection(firestore, "attendance"), {
        employeeId,
        date: Timestamp.fromDate(dateObj),
        checkIn: Timestamp.now(),
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Check-in recorded successfully",
    })
  } catch (error) {
    console.error("Error recording check-in:", error)
    return NextResponse.json({ success: false, message: "An error occurred while recording check-in" }, { status: 500 })
  }
}
