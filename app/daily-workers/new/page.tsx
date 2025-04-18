import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { DailyWorkerForm } from "@/components/daily-worker-form"

export default async function NewDailyWorkerPage() {
  await requireAuth()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Add Daily Worker</h1>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <DailyWorkerForm />
      </div>
    </DashboardShell>
  )
}
