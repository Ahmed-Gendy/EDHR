import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { PerformanceDashboard } from "@/components/performance-dashboard"

async function getPerformanceData() {
  // Get all daily workers
  const workersQuery = query(collection(firestore, "dailyWorkers"), where("status", "==", "ACTIVE"))
  const workersSnapshot = await getDocs(workersQuery)

  const workers = workersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // Get all performance evaluations
  const evaluationsQuery = query(collection(firestore, "performanceEvaluations"), orderBy("evaluationDate", "desc"))

  const evaluationsSnapshot = await getDocs(evaluationsQuery)

  const evaluations = evaluationsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // Group evaluations by worker
  const evaluationsByWorker = evaluations.reduce(
    (acc, evaluation) => {
      if (!acc[evaluation.workerId]) {
        acc[evaluation.workerId] = []
      }
      acc[evaluation.workerId].push(evaluation)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Calculate average scores for each worker
  const workerPerformance = workers.map((worker) => {
    const workerEvals = evaluationsByWorker[worker.id] || []

    if (workerEvals.length === 0) {
      return {
        worker,
        latestEvaluation: null,
        averageScores: null,
        evaluationCount: 0,
      }
    }

    const averageScores = {
      quality: workerEvals.reduce((sum, evaluation) => sum + evaluation.qualityScore, 0) / workerEvals.length,
      productivity: workerEvals.reduce((sum, evaluation) => sum + evaluation.productivityScore, 0) / workerEvals.length,
      reliability: workerEvals.reduce((sum, evaluation) => sum + evaluation.reliabilityScore, 0) / workerEvals.length,
      safety: workerEvals.reduce((sum, evaluation) => sum + evaluation.safetyScore, 0) / workerEvals.length,
      teamwork: workerEvals.reduce((sum, evaluation) => sum + evaluation.teamworkScore, 0) / workerEvals.length,
      overall: workerEvals.reduce((sum, evaluation) => sum + evaluation.overallRating, 0) / workerEvals.length,
    }

    return {
      worker,
      latestEvaluation: workerEvals[0],
      averageScores,
      evaluationCount: workerEvals.length,
    }
  })

  // Sort by overall score (highest first)
  workerPerformance.sort((a, b) => {
    if (!a.averageScores && !b.averageScores) return 0
    if (!a.averageScores) return 1
    if (!b.averageScores) return -1
    return b.averageScores.overall - a.averageScores.overall
  })

  // Calculate overall stats
  const overallStats = {
    totalWorkers: workers.length,
    evaluatedWorkers: workerPerformance.filter((wp) => wp.averageScores).length,
    averageOverallScore:
      workerPerformance.filter((wp) => wp.averageScores).reduce((sum, wp) => sum + wp.averageScores.overall, 0) /
      (workerPerformance.filter((wp) => wp.averageScores).length || 1),
    topPerformers: workerPerformance.filter((wp) => wp.averageScores && wp.averageScores.overall >= 4.0).length,
    lowPerformers: workerPerformance.filter((wp) => wp.averageScores && wp.averageScores.overall <= 2.5).length,
  }

  return { workerPerformance, overallStats }
}

export default async function PerformancePage() {
  await requireAuth()
  const { workerPerformance, overallStats } = await getPerformanceData()

  return (
    <DashboardShell>
      <PerformanceDashboard workerPerformance={workerPerformance} overallStats={overallStats} />
    </DashboardShell>
  )
}
