import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createRecord, getAllRecords, queryRecordsByField } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const {
      first_name,
      last_name,
      phone,
      specialization,
      daily_rate,
      status,
      hire_date,
      bank_name,
      account_number,
      notes,
    } = await request.json()

    // Validate required fields
    if (!first_name || !last_name || !phone || !specialization || !daily_rate || !status || !hire_date) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Create daily worker
    const result = await createRecord("dailyWorkers", {
      firstName: first_name,
      lastName: last_name,
      phone,
      specialization,
      dailyRate: Number.parseFloat(daily_rate),
      status,
      hireDate: hire_date,
      bankName: bank_name || null,
      accountNumber: account_number || null,
      notes: notes || null,
      createdBy: session.id,
      deleted: false,
    })

    if (!result.success) {
      throw new Error("Failed to create daily worker")
    }

    return NextResponse.json({
      success: true,
      message: "Daily worker created successfully",
      workerId: result.id,
    })
  } catch (error) {
    console.error("Error creating daily worker:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while creating the daily worker" },
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
    const status = searchParams.get("status")
    const specialization = searchParams.get("specialization")

    let workersResult

    if (status) {
      workersResult = await queryRecordsByField("dailyWorkers", "status", status)
    } else if (specialization) {
      workersResult = await queryRecordsByField("dailyWorkers", "specialization", specialization)
    } else {
      workersResult = await getAllRecords("dailyWorkers")
    }

    if (!workersResult.success) {
      throw new Error("Failed to fetch daily workers")
    }

    // Filter out deleted workers
    const workers = workersResult.data
      .filter((worker) => !worker.deleted)
      .map((worker) => ({
        id: worker.id,
        first_name: worker.firstName,
        last_name: worker.lastName,
        phone: worker.phone || "",
        specialization: worker.specialization || "",
        daily_rate: worker.dailyRate || 0,
        status: worker.status || "ACTIVE",
        hire_date: worker.hireDate || new Date().toISOString().split("T")[0],
        last_attendance: worker.lastAttendance || null,
        bank_name: worker.bankName || null,
        account_number: worker.accountNumber || null,
        notes: worker.notes || null,
      }))

    return NextResponse.json({ success: true, workers })
  } catch (error) {
    console.error("Error fetching daily workers:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching daily workers" },
      { status: 500 },
    )
  }
}
