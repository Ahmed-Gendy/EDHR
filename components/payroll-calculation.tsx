"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, Calculator, Download, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createPayroll } from "@/lib/firebase-collections"

interface PayrollRecord {
  id?: string
  workerId: string
  workerName: string
  skillType: string
  totalDays: number
  totalHours: number
  dailyRate: number
  baseAmount: number
  bonusAmount: number
  deductionAmount: number
  netAmount: number
  period: string
  status: string
}

export function PayrollCalculation() {
  const [month, setMonth] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [workerType, setWorkerType] = useState<string>("daily")
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const { toast } = useToast()

  const handleCalculate = async () => {
    setIsCalculating(true)

    try {
      const periodStart = format(startOfMonth(month), "yyyy-MM-dd")
      const periodEnd = format(endOfMonth(month), "yyyy-MM-dd")

      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          workerType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to calculate payroll")
      }

      const data = await response.json()
      setPayrollRecords(data.payroll)

      toast({
        title: "Calculation complete",
        description: `Successfully calculated payroll for ${data.payroll.length} workers.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate payroll",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSavePayroll = async () => {
    setIsLoading(true)

    try {
      // Save each payroll record
      for (const record of payrollRecords) {
        await createPayroll({
          workerId: record.workerId,
          periodStart: format(startOfMonth(month), "yyyy-MM-dd"),
          periodEnd: format(endOfMonth(month), "yyyy-MM-dd"),
          totalDays: record.totalDays,
          totalHours: record.totalHours,
          baseAmount: record.baseAmount,
          bonusAmount: record.bonusAmount,
          deductionAmount: record.deductionAmount,
          netAmount: record.netAmount,
          paymentStatus: "PENDING",
          paymentDate: null,
          paymentMethod: null,
          bankReference: null,
        })
      }

      toast({
        title: "Payroll saved",
        description: `Successfully saved payroll records for ${payrollRecords.length} workers.`,
      })

      // Clear the records after saving
      setPayrollRecords([])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payroll",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)

    try {
      const periodStart = format(startOfMonth(month), "yyyy-MM-dd")
      const periodEnd = format(endOfMonth(month), "yyyy-MM-dd")

      const response = await fetch("/api/payroll/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          workerType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to export payroll")
      }

      // Create a download link for the Excel file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Payroll_${format(month, "yyyy-MM")}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export complete",
        description: "Payroll data has been exported to Excel.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export payroll",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Calculation</CardTitle>
          <CardDescription>
            Calculate payroll for workers based on attendance, hours worked, and daily rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(month, "MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={month}
                    onSelect={(date) => date && setMonth(date)}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Worker Type</label>
              <Select value={workerType} onValueChange={setWorkerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Workers</SelectItem>
                  <SelectItem value="regular">Regular Employees</SelectItem>
                  <SelectItem value="all">All Workers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isLoading || payrollRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={payrollRecords.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCalculate} disabled={isCalculating}>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
            {payrollRecords.length > 0 && (
              <Button onClick={handleSavePayroll} disabled={isLoading}>
                Save Payroll
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {payrollRecords.length > 0 && (
        <Card className="print:shadow-none">
          <CardHeader className="print:pb-2">
            <CardTitle>Payroll Results</CardTitle>
            <CardDescription>Payroll calculation for {format(month, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border print:border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Skill Type</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.workerId}>
                      <TableCell>{record.workerName}</TableCell>
                      <TableCell>{record.skillType}</TableCell>
                      <TableCell>{record.totalDays}</TableCell>
                      <TableCell>{record.totalHours}</TableCell>
                      <TableCell>${record.dailyRate.toFixed(2)}</TableCell>
                      <TableCell>${record.baseAmount.toFixed(2)}</TableCell>
                      <TableCell>${record.bonusAmount.toFixed(2)}</TableCell>
                      <TableCell>${record.deductionAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${record.netAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Total: ${payrollRecords.reduce((sum, record) => sum + record.netAmount, 0).toFixed(2)}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
