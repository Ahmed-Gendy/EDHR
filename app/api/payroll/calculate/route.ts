import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { periodStart, periodEnd, workerType } = await request.json()

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ success: false, message: "Period start and end dates are required" }, { status: 400 })
    }

    // Get workers based on type
    let workersQuery
    if (workerType === "daily") {
      workersQuery = query(collection(firestore, "dailyWorkers"), where("status", "==", "ACTIVE"))
    } else if (workerType === "regular") {
      workersQuery = query(collection(firestore, "employees"), where("status", "==", "ACTIVE"))
    } else {
      // Get both daily workers and regular employees
      const dailyWorkersQuery = query(collection(firestore, "dailyWorkers"), where("status", "==", "ACTIVE"))
      const regularWorkersQuery = query(collection(firestore, "employees"), where("status", "==", "ACTIVE"))

      const [dailyWorkersSnapshot, regularWorkersSnapshot] = await Promise.all([
        getDocs(dailyWorkersQuery),
        getDocs(regularWorkersQuery),
      ])

      const dailyWorkers = dailyWorkersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "daily",
      }))

      const regularWorkers = regularWorkersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "regular",
      }))

      const workers = [...dailyWorkers, ...regularWorkers]

      // Calculate payroll for each worker
      const payroll = await Promise.all(
        workers.map(async (worker) => {
          if (worker.type === "daily") {
            return await calculateDailyWorkerPayroll(worker, periodStart, periodEnd)
          } else {
            return await calculateRegularEmployeePayroll(worker, periodStart, periodEnd)
          }
        }),
      )

      return NextResponse.json({
        success: true,
        payroll: payroll.filter((p) => p !== null),
      })
    }

    const workersSnapshot = await getDocs(workersQuery)
    const workers = workersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Calculate payroll for each worker
    const payroll = await Promise.all(
      workers.map(async (worker) => {
        if (workerType === "daily") {
          return await calculateDailyWorkerPayroll(worker, periodStart, periodEnd)
        } else {
          return await calculateRegularEmployeePayroll(worker, periodStart, periodEnd)
        }
      }),
    )

    return NextResponse.json({
      success: true,
      payroll: payroll.filter((p) => p !== null),
    })
  } catch (error) {
    console.error("Error calculating payroll:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while calculating payroll" },
      { status: 500 },
    )
  }
}

async function calculateDailyWorkerPayroll(worker: any, periodStart: string, periodEnd: string) {
  try {
    // Get attendance records for this worker within the period
    const attendanceQuery = query(
      collection(firestore, "dailyAttendance"),
      where("workerId", "==", worker.id),
      where("date", ">=", periodStart),
      where("date", "<=", periodEnd),
    )

    const attendanceSnapshot = await getDocs(attendanceQuery)

    if (attendanceSnapshot.empty) {
      return null // No attendance records for this period
    }

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data())

    // Calculate total days and hours
    const totalDays = attendanceRecords.filter(
      (record) => record.status === "PRESENT" || record.status === "LATE",
    ).length

    const totalHours = attendanceRecords.reduce((sum, record) => sum + (record.hoursWorked || 0), 0)

    // Calculate base amount
    const dailyRate = worker.dailyRate || 0
    const baseAmount = totalDays * dailyRate

    // Get penalties for this worker
    const penaltiesQuery = query(
      collection(firestore, "penalties"),
      where("workerId", "==", worker.id),
      where("date", ">=", periodStart),
      where("date", "<=", periodEnd),
      where("appliedToPayroll", "==", false),
    )

    const penaltiesSnapshot = await getDocs(penaltiesQuery)
    const penalties = penaltiesSnapshot.docs.map((doc) => doc.data())

    // Calculate deductions from penalties
    const deductionAmount = penalties.reduce((sum, penalty) => sum + (penalty.amount || 0), 0)

    // For simplicity, no bonuses in this example
    const bonusAmount = 0

    // Calculate net amount
    const netAmount = baseAmount + bonusAmount - deductionAmount

    return {
      workerId: worker.id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      skillType: worker.skillType || "Unknown",
      totalDays,
      totalHours,
      dailyRate,
      baseAmount,
      bonusAmount,
      deductionAmount,
      netAmount,
      period: `${periodStart} to ${periodEnd}`,
      status: "CALCULATED",
    }
  } catch (error) {
    console.error(`Error calculating payroll for worker ${worker.id}:`, error)
    return null
  }
}

async function calculateRegularEmployeePayroll(employee: any, periodStart: string, periodEnd: string) {
  try {
    // For regular employees, we would calculate based on monthly salary
    // This is a simplified example
    const monthlySalary = employee.salary || 0

    // Get attendance records for this employee within the period
    const attendanceQuery = query(
      collection(firestore, "attendance"),
      where("employeeId", "==", employee.id),
      where("date", ">=", periodStart),
      where("date", "<=", periodEnd),
    )

    const attendanceSnapshot = await getDocs(attendanceQuery)
    const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data())

    // Calculate attendance-based deductions
    const workingDays = 22 // Assuming 22 working days in a month
    const absentDays = attendanceRecords.filter((record) => record.status === "ABSENT").length

    const deductionPerDay = monthlySalary / workingDays
    const attendanceDeduction = absentDays * deductionPerDay

    // Get other deductions
    const deductionsQuery = query(
      collection(firestore, "deductions"),
      where("employeeId", "==", employee.id),
      where("date", ">=", periodStart),
      where("date", "<=", periodEnd),
    )

    const deductionsSnapshot = await getDocs(deductionsQuery)
    const deductions = deductionsSnapshot.docs.map((doc) => doc.data())

    const otherDeductions = deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0)

    // Calculate total deductions
    const totalDeductions = attendanceDeduction + otherDeductions

    // Get bonuses
    const bonusesQuery = query(
      collection(firestore, "bonuses"),
      where("employeeId", "==", employee.id),
      where("date", ">=", periodStart),
      where("date", "<=", periodEnd),
    )

    const bonusesSnapshot = await getDocs(bonusesQuery)
    const bonuses = bonusesSnapshot.docs.map((doc) => doc.data())

    const totalBonuses = bonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0)

    // Calculate net amount
    const netAmount = monthlySalary + totalBonuses - totalDeductions

    return {
      workerId: employee.id,
      workerName: `${employee.firstName} ${employee.lastName}`,
      skillType: "Regular Employee",
      totalDays: workingDays - absentDays,
      totalHours: (workingDays - absentDays) * 8, // Assuming 8 hours per day
      dailyRate: deductionPerDay,
      baseAmount: monthlySalary,
      bonusAmount: totalBonuses,
      deductionAmount: totalDeductions,
      netAmount,
      period: `${periodStart} to ${periodEnd}`,
      status: "CALCULATED",
    }
  } catch (error) {
    console.error(`Error calculating payroll for employee ${employee.id}:`, error)
    return null
  }
}
