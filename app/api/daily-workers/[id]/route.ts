import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getRecord, updateRecord } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const result = await getRecord("dailyWorkers", params.id)

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Worker not found" }, { status: 404 })
    }

    const worker = result.data

    return NextResponse.json({
      success: true,
      worker: {
        id: worker.id,
        first_name: worker.firstName,
        last_name: worker.lastName,
        phone: worker.phone || "",
        specialization: worker.specialization || "",
        daily_rate: worker.dailyRate || 0,
        status: worker.status || "ACTIVE",
        hire_date: worker.hireDate || new Date().toISOString().split("T")[0],
        bank_name: worker.bankName || null,
        account_number: worker.accountNumber || null,
        notes: worker.notes || null,
      },
    })
  } catch (error) {
    console.error("Error fetching daily worker:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching the daily worker" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Update worker
    const result = await updateRecord("dailyWorkers", params.id, {
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
      updatedBy: session.id,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Failed to update worker" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Worker updated successfully",
    })
  } catch (error) {
    console.error("Error updating daily worker:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while updating the daily worker" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Instead of physically deleting, we'll mark as deleted
    const result = await updateRecord("dailyWorkers", params.id, {
      deleted: true,
      updatedBy: session.id,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Failed to delete worker" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Worker deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting daily worker:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while deleting the daily worker" },
      { status: 500 },
    )
  }
}
