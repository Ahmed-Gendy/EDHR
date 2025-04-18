import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { PerformanceEvaluationForm } from "@/components/performance-evaluation-form"
import { doc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getWorker(id: string) {
  const workerDoc = await getDoc(doc(firestore, "dailyWorkers", id))

  if (!workerDoc.exists()) {
    throw new Error("Worker not found")
  }

  return {
    id: workerDoc.id,
    ...workerDoc.data(),
  }
}

export default async function NewPerformanceEvaluationPage({ params }: { params: { id: string } }) {
  await requireAuth()
  const worker = await getWorker(params.id)

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">New Performance Evaluation</h1>
          <p className="text-muted-foreground">
            {worker.firstName} {worker.lastName} - {worker.skillType}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <PerformanceEvaluationForm worker={worker} />
      </div>
    </DashboardShell>
  )
}
