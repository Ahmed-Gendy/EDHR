import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createRecord, getAllRecords, queryRecordsByField } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { worker_id, site_id, date, check_in, check_out, hours_worked, status, notes } = await request.json()

    // Validate required fields
    if (!worker_id || !site_id || !date || !status) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Create attendance record
    const result = await createRecord("dailyAttendance", {
      workerId: worker_id,
      siteId: site_id,
      date,
      checkIn: check_in || null,
      checkOut: check_out || null,
      hoursWorked: hours_worked || null,
      status,
      notes: notes || null,
      createdBy: session.id,
    })

    if (!result.success) {
      throw new Error("Failed to create attendance record")
    }

    // Update the worker's last attendance date
    await fetch(`/api/daily-workers/${worker_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_attendance: date,
      }),
    })

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully",
      attendanceId: result.id,
    })
  } catch (error) {
    console.error("Error recording attendance:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while recording attendance" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get("worker_id")
    const siteId = searchParams.get("site_id")
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    let attendanceResult

    if (workerId) {
      attendanceResult = await queryRecordsByField("dailyAttendance", "workerId", workerId)
    } else if (siteId) {
      attendanceResult = await queryRecordsByField("dailyAttendance", "siteId", siteId)
    } else if (date) {
      attendanceResult = await queryRecordsByField("dailyAttendance", "date", date)
    } else if (status) {
      attendanceResult = await queryRecordsByField("dailyAttendance", "status", status)
    } else {
      attendanceResult = await getAllRecords("dailyAttendance")
    }

    if (!attendanceResult.success) {
      throw new Error("Failed to fetch attendance records")
    }

    // Get all workers and sites for reference
    const workersResult = await getAllRecords("dailyWorkers")
    const sitesResult = await getAllRecords("constructionSites")

    if (!workersResult.success || !sitesResult.success) {
      throw new Error("Failed to fetch reference data")
    }

    const workers = workersResult.data.reduce(
      (acc, worker) => {
        acc[worker.id] = `${worker.firstName} ${worker.lastName}`
        return acc
      },
      {} as Record<string, string>,
    )

    const sites = sitesResult.data.reduce(
      (acc, site) => {
        acc[site.id] = site.name
        return acc
      },
      {} as Record<string, string>,
    )

    // Sort the records manually after fetching
    const sortedAttendanceData = [...attendanceResult.data].sort((a, b) => {
      // Sort by date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const attendance = sortedAttendanceData.map((record) => ({
      id: record.id,
      worker_id: record.workerId,
      worker_name: workers[record.workerId] || "Unknown Worker",
      site_id: record.siteId,
      site_name: sites[record.siteId] || "Unknown Site",
      date: record.date,
      check_in: record.checkIn || null,
      check_out: record.checkOut || null,
      hours_worked: record.hoursWorked || null,
      status: record.status,
      notes: record.notes || null,
      created_at: record.createdAt || Date.now(),
    }))

    return NextResponse.json({ success: true, attendance })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching attendance records" },
      { status: 500 },
    )
  }
}
