import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { SalaryCalculation } from "@/components/salary-calculation"

export default async function SalaryPage() {
  await requireAuth()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Salary Management</h1>
      </div>
      <SalaryCalculation />
    </DashboardShell>
  )
}
