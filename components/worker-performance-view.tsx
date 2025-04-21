"use client"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Download } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadStringAsFile, objectsToCSV } from "@/lib/csv-utils"

interface WorkerPerformanceViewProps {
  performanceData: {
    worker: any
    evaluations: any[]
    averageScores: any
    attendanceStats: {
      total: number
      present: number
      absent: number
      late: number
      halfDay: number
    }
    attendanceRate: number
  }
}

export function WorkerPerformanceView({ performanceData }: WorkerPerformanceViewProps) {
  const { worker, evaluations, averageScores, attendanceStats, attendanceRate } = performanceData

  const handleExportEvaluations = () => {
    const data = evaluations.map((evaluation) => ({
      Date: evaluation.evaluationDate,
      Type: evaluation.evaluationType,
      Quality: evaluation.qualityScore,
      Productivity: evaluation.productivityScore,
      Reliability: evaluation.reliabilityScore,
      Safety: evaluation.safetyScore,
      Teamwork: evaluation.teamworkScore,
      Overall: evaluation.overallRating,
      Strengths: evaluation.strengths,
      "Areas for Improvement": evaluation.weaknesses,
      "Improvement Plan": evaluation.improvementPlan,
      Comments: evaluation.comments || "",
    }))

    // Use our CSV utilities directly
    const csvContent = objectsToCSV(data)
    downloadStringAsFile(csvContent, `Performance_${worker.firstName}_${worker.lastName}.csv`)
  }

  const getRatingColor = (score: number) => {
    if (score >= 4.5) return "text-green-600 bg-green-50"
    if (score >= 3.5) return "text-blue-600 bg-blue-50"
    if (score >= 2.5) return "text-yellow-600 bg-yellow-50"
    if (score >= 1.5) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-50"
    if (rate >= 85) return "text-blue-600 bg-blue-50"
    if (rate >= 75) return "text-yellow-600 bg-yellow-50"
    if (rate >= 65) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {worker.firstName} {worker.lastName} - Performance
          </h1>
          <p className="text-muted-foreground">
            {worker.skillType} | ID: {worker.idNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportEvaluations}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Link href={`/daily-workers/${worker.id}/performance/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Evaluation
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {averageScores ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Overall Performance</CardTitle>
                  <CardDescription>Average of all evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-4xl font-bold ${getRatingColor(averageScores.overall)} p-4 rounded-lg text-center`}
                  >
                    {averageScores.overall.toFixed(1)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-sm text-muted-foreground">Quality</div>
                      <div className="font-bold">{averageScores.quality.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-sm text-muted-foreground">Productivity</div>
                      <div className="font-bold">{averageScores.productivity.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-sm text-muted-foreground">Reliability</div>
                      <div className="font-bold">{averageScores.reliability.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-sm text-muted-foreground">Safety</div>
                      <div className="font-bold">{averageScores.safety.toFixed(1)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Attendance Rate</CardTitle>
                  <CardDescription>Based on {attendanceStats.total} records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-4xl font-bold ${getAttendanceRateColor(attendanceRate)} p-4 rounded-lg text-center`}
                  >
                    {attendanceRate.toFixed(1)}%
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-sm text-green-600">Present</div>
                      <div className="font-bold">{attendanceStats.present}</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-sm text-red-600">Absent</div>
                      <div className="font-bold">{attendanceStats.absent}</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-sm text-yellow-600">Late</div>
                      <div className="font-bold">{attendanceStats.late}</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-sm text-orange-600">Half Day</div>
                      <div className="font-bold">{attendanceStats.halfDay}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Latest Evaluation</CardTitle>
                  <CardDescription>
                    {evaluations.length > 0
                      ? format(new Date(evaluations[0].evaluationDate), "MMMM d, yyyy")
                      : "No evaluations yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evaluations.length > 0 ? (
                    <>
                      <div
                        className={`text-4xl font-bold ${getRatingColor(evaluations[0].overallRating)} p-4 rounded-lg text-center`}
                      >
                        {evaluations[0].overallRating.toFixed(1)}
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-medium">Strengths:</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{evaluations[0].strengths}</p>

                        <div className="text-sm font-medium mt-2">Areas for Improvement:</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{evaluations[0].weaknesses}</p>

                        <Link
                          href={`/daily-workers/${worker.id}/performance/${evaluations[0].id}`}
                          className="text-sm text-primary mt-2 block"
                        >
                          View full evaluation
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40">
                      <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No evaluations yet</p>
                      <Link href={`/daily-workers/${worker.id}/performance/new`}>
                        <Button variant="outline" className="mt-2">
                          Create First Evaluation
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Performance Data</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  There are no performance evaluations for this worker yet. Create the first evaluation to start
                  tracking performance.
                </p>
                <Link href={`/daily-workers/${worker.id}/performance/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Evaluation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Performance Evaluations</CardTitle>
              <CardDescription>History of all performance evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No evaluations found</p>
                  <Link href={`/daily-workers/${worker.id}/performance/new`}>
                    <Button variant="outline" className="mt-2">
                      Create First Evaluation
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{format(new Date(evaluation.evaluationDate), "MMMM d, yyyy")}</h3>
                          <p className="text-sm text-muted-foreground">
                            <Badge variant="outline">{evaluation.evaluationType}</Badge>
                          </p>
                        </div>
                        <div
                          className={`text-2xl font-bold ${getRatingColor(evaluation.overallRating)} px-3 py-1 rounded`}
                        >
                          {evaluation.overallRating.toFixed(1)}
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Quality</div>
                          <div className="font-medium">{evaluation.qualityScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Productivity</div>
                          <div className="font-medium">{evaluation.productivityScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Reliability</div>
                          <div className="font-medium">{evaluation.reliabilityScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Safety</div>
                          <div className="font-medium">{evaluation.safetyScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Teamwork</div>
                          <div className="font-medium">{evaluation.teamworkScore}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Strengths: </span>
                          <span className="text-sm">{evaluation.strengths}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Areas for Improvement: </span>
                          <span className="text-sm">{evaluation.weaknesses}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Link href={`/daily-workers/${worker.id}/performance/${evaluation.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Analysis</CardTitle>
              <CardDescription>Attendance records and reliability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Attendance Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Records</div>
                      <div className="text-2xl font-bold">{attendanceStats.total}</div>
                    </div>
                    <div className={`p-4 rounded-lg ${getAttendanceRateColor(attendanceRate)}`}>
                      <div className="text-sm">Attendance Rate</div>
                      <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600">Present Days</div>
                      <div className="text-2xl font-bold">{attendanceStats.present}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Absent Days</div>
                      <div className="text-2xl font-bold">{attendanceStats.absent}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-yellow-600">Late Arrivals</div>
                      <div className="text-2xl font-bold">{attendanceStats.late}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm text-orange-600">Half Days</div>
                      <div className="text-2xl font-bold">{attendanceStats.halfDay}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Reliability Assessment</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Punctuality Score</div>
                        <div
                          className={`px-2 py-1 rounded ${
                            attendanceStats.late === 0
                              ? "bg-green-50 text-green-600"
                              : attendanceStats.late <= 2
                                ? "bg-blue-50 text-blue-600"
                                : attendanceStats.late <= 5
                                  ? "bg-yellow-50 text-yellow-600"
                                  : "bg-red-50 text-red-600"
                          }`}
                        >
                          {attendanceStats.late === 0
                            ? "Excellent"
                            : attendanceStats.late <= 2
                              ? "Good"
                              : attendanceStats.late <= 5
                                ? "Average"
                                : "Poor"}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {attendanceStats.late === 0
                          ? "Worker always arrives on time."
                          : `Worker has been late ${attendanceStats.late} times.`}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Consistency Score</div>
                        <div
                          className={`px-2 py-1 rounded ${
                            attendanceRate >= 95
                              ? "bg-green-50 text-green-600"
                              : attendanceRate >= 85
                                ? "bg-blue-50 text-blue-600"
                                : attendanceRate >= 75
                                  ? "bg-yellow-50 text-yellow-600"
                                  : "bg-red-50 text-red-600"
                          }`}
                        >
                          {attendanceRate >= 95
                            ? "Excellent"
                            : attendanceRate >= 85
                              ? "Good"
                              : attendanceRate >= 75
                                ? "Average"
                                : "Poor"}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on overall attendance rate and consistency of presence.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Recommendation</div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {attendanceRate >= 90
                          ? "Highly reliable worker with excellent attendance record."
                          : attendanceRate >= 80
                            ? "Generally reliable worker with good attendance."
                            : attendanceRate >= 70
                              ? "Average reliability, could improve attendance."
                              : "Attendance issues need to be addressed."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
