import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { WorkerPerformanceView } from "@/components/worker-performance-view"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getWorkerPerformance(workerId: string) {
  // Get worker details
  const workerDoc = await getDoc(doc(firestore, "dailyWorkers", workerId))

  if (!workerDoc.exists()) {
    throw new Error("Worker not found")
  }

  const worker = {
    id: workerDoc.id,
    ...workerDoc.data(),
  }

  // Get performance evaluations - removed orderBy to avoid needing a composite index
  const evaluationsQuery = query(collection(firestore, "performanceEvaluations"), where("workerId", "==", workerId))

  const evaluationsSnapshot = await getDocs(evaluationsQuery)

  const evaluations = evaluationsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    evaluationDate: doc.data().evaluationDate,
  }))

  // Sort evaluations manually after fetching
  evaluations.sort((a, b) => {
    // Sort by date (most recent first)
    return new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime()
  })

  // Calculate average scores
  const averageScores =
    evaluations.length > 0
      ? {
          quality: evaluations.reduce((sum, evaluation) => sum + evaluation.qualityScore, 0) / evaluations.length,
          productivity:
            evaluations.reduce((sum, evaluation) => sum + evaluation.productivityScore, 0) / evaluations.length,
          reliability:
            evaluations.reduce((sum, evaluation) => sum + evaluation.reliabilityScore, 0) / evaluations.length,
          safety: evaluations.reduce((sum, evaluation) => sum + evaluation.safetyScore, 0) / evaluations.length,
          teamwork: evaluations.reduce((sum, evaluation) => sum + evaluation.teamworkScore, 0) / evaluations.length,
          overall: evaluations.reduce((sum, evaluation) => sum + evaluation.overallRating, 0) / evaluations.length,
        }
      : null

  // Get attendance data for reliability analysis - removed orderBy to avoid needing a composite index
  const attendanceQuery = query(collection(firestore, "dailyAttendance"), where("workerId", "==", workerId))

  const attendanceSnapshot = await getDocs(attendanceQuery)

  const attendance = attendanceSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // Sort attendance manually after fetching
  attendance.sort((a, b) => {
    // Sort by date (most recent first)
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "PRESENT").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    late: attendance.filter((a) => a.status === "LATE").length,
    halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
  }

  const attendanceRate = attendance.length > 0 ? (attendanceStats.present / attendance.length) * 100 : 0

  return { worker, evaluations, averageScores, attendanceStats, attendanceRate }
}

export default async function WorkerPerformancePage({ params }: { params: { id: string } }) {
  await requireAuth()
  const performanceData = await getWorkerPerformance(params.id)

  return (
    <DashboardShell>
      <WorkerPerformanceView performanceData={performanceData} />
    </DashboardShell>
  )
}
