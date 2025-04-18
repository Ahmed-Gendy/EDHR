import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { importDailyWorkers } from "@/lib/excel-import"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { data } = await request.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, message: "No data provided" }, { status: 400 })
    }

    const result = await importDailyWorkers(data, session.id)

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      errors: result.errors,
      errorDetails: result.errorDetails,
      message: `Successfully imported ${result.imported} workers with ${result.errors} errors.`,
    })
  } catch (error) {
    console.error("Error importing daily workers:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while importing daily workers" },
      { status: 500 },
    )
  }
}
