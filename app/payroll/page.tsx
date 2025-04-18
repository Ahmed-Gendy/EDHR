import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { PayrollCalculation } from "@/components/payroll-calculation"

export default async function PayrollPage() {
  await requireAuth()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
      </div>
      <PayrollCalculation />
    </DashboardShell>
  )
}
