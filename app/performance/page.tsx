"use client"

import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { downloadStringAsFile, objectsToCSV } from "@/lib/csv-utils"

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

  const handleExportData = () => {
    const data = workerPerformance
      .filter((wp) => wp.averageScores)
      .map((wp) => ({
        "Worker Name": `${wp.worker.firstName} ${wp.worker.lastName}`,
        "Skill Type": wp.worker.skillType,
        "Overall Rating": wp.averageScores.overall.toFixed(1),
        Quality: wp.averageScores.quality.toFixed(1),
        Productivity: wp.averageScores.productivity.toFixed(1),
        Reliability: wp.averageScores.reliability.toFixed(1),
        Safety: wp.averageScores.safety.toFixed(1),
        Teamwork: wp.averageScores.teamwork.toFixed(1),
        Evaluations: wp.evaluationCount,
        "Latest Evaluation": wp.latestEvaluation.evaluationDate,
      }))

    // Use our CSV utilities directly instead of exportToExcel
    const csvContent = objectsToCSV(data)
    downloadStringAsFile(csvContent, "Worker_Performance_Summary.csv")
  }

  const getRatingColor = (score: number) => {
    if (score >= 4.5) return "text-green-600"
    if (score >= 3.5) return "text-blue-600"
    if (score >= 2.5) return "text-yellow-600"
    if (score >= 1.5) return "text-orange-600"
    return "text-red-600"
  }

  const getRatingBadge = (score: number) => {
    if (score >= 4.5) return <Badge className="bg-green-500">Excellent</Badge>
    if (score >= 3.5) return <Badge className="bg-blue-500">Good</Badge>
    if (score >= 2.5) return <Badge className="bg-yellow-500">Average</Badge>
    if (score >= 1.5) return <Badge className="bg-orange-500">Below Average</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Performance Management</h1>
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalWorkers}</div>
            <p className="text-xs text-muted-foreground">{overallStats.evaluatedWorkers} with evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(overallStats.averageOverallScore)}`}>
              {overallStats.averageOverallScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Overall performance rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.topPerformers}</div>
            <p className="text-xs text-muted-foreground">Workers with 4.0+ rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.lowPerformers}</div>
            <p className="text-xs text-muted-foreground">Workers with 2.5- rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Performance</CardTitle>
          <CardDescription>Overview of all worker performance evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Skill Type</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Productivity</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>Safety</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workerPerformance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No workers found
                  </TableCell>
                </TableRow>
              ) : (
                workerPerformance.map((wp) => (
                  <TableRow key={wp.worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`/placeholder.svg?height=40&width=40&text=${wp.worker.firstName[0]}${wp.worker.lastName[0]}`}
                          />
                          <AvatarFallback>
                            {wp.worker.firstName[0]}
                            {wp.worker.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {wp.worker.firstName} {wp.worker.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{wp.evaluationCount} evaluations</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{wp.worker.skillType}</TableCell>
                    <TableCell>
                      {wp.averageScores ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getRatingColor(wp.averageScores.overall)}`}>
                            {wp.averageScores.overall.toFixed(1)}
                          </span>
                          {getRatingBadge(wp.averageScores.overall)}
                        </div>
                      ) : (
                        <Badge variant="outline">Not Evaluated</Badge>
                      )}
                    </TableCell>
                    <TableCell>{wp.averageScores ? wp.averageScores.quality.toFixed(1) : "-"}</TableCell>
                    <TableCell>{wp.averageScores ? wp.averageScores.productivity.toFixed(1) : "-"}</TableCell>
                    <TableCell>{wp.averageScores ? wp.averageScores.reliability.toFixed(1) : "-"}</TableCell>
                    <TableCell>{wp.averageScores ? wp.averageScores.safety.toFixed(1) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/daily-workers/${wp.worker.id}/performance`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/daily-workers/${wp.worker.id}/performance/new`}>
                          <Button size="sm">Evaluate</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
