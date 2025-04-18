import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { collection, query, where, getDocs, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore"
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

    // Check if attendance record exists
    const attendanceQuery = query(
      collection(firestore, "attendance"),
      where("employeeId", "==", employeeId),
      where("date", "==", Timestamp.fromDate(dateObj)),
    )

    const attendanceSnapshot = await getDocs(attendanceQuery)

    if (attendanceSnapshot.empty) {
      return NextResponse.json({ success: false, message: "No check-in record found" }, { status: 400 })
    }

    const attendanceDoc = attendanceSnapshot.docs[0]
    const attendanceData = attendanceDoc.data()

    // Update status if needed (e.g., if leaving early)
    let status = attendanceData.status
    const now = new Date()
    const workdayEnd = new Date(now)
    workdayEnd.setHours(17, 0, 0, 0) // 5:00 PM

    // If checking out before end of workday, mark as half day
    if (now < workdayEnd && status === "PRESENT") {
      status = "HALF_DAY"
    }

    // Update record with check-out time
    await updateDoc(attendanceDoc.ref, {
      checkOut: Timestamp.now(),
      status,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "Check-out recorded successfully",
    })
  } catch (error) {
    console.error("Error recording check-out:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while recording check-out" },
      { status: 500 },
    )
  }
}
