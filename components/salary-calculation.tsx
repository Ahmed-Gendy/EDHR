"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Calculator, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SalaryRecord {
  id: string
  employee_name: string
  employee_id: string
  base_salary: number
  attendance_days: number
  overtime_hours: number
  bonuses: number
  deductions: number
  penalties: number
  total_salary: number
}

export function SalaryCalculation() {
  const [month, setMonth] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [salaryType, setSalaryType] = useState<string>("all")
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const { toast } = useToast()

  const handleCalculate = async () => {
    setIsCalculating(true)

    try {
      const response = await fetch("/api/salary/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: format(month, "yyyy-MM"),
          type: salaryType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to calculate salaries")
      }

      const data = await response.json()
      setSalaryRecords(data.salaries)

      toast({
        title: "Calculation complete",
        description: `Successfully calculated salaries for ${data.salaries.length} employees.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate salaries",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/salary/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: format(month, "yyyy-MM"),
          type: salaryType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to export salaries")
      }

      // Create a download link for the Excel file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Salaries_${format(month, "yyyy-MM")}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export complete",
        description: "Salary data has been exported to Excel.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export salaries",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Salary Calculation</CardTitle>
          <CardDescription>
            Calculate salaries for employees based on attendance, overtime, and other factors.
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
              <label className="text-sm font-medium">Employee Type</label>
              <Select value={salaryType} onValueChange={setSalaryType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="regular">Regular Employees</SelectItem>
                  <SelectItem value="daily">Daily Workers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              "Exporting..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </>
            )}
          </Button>
          <Button onClick={handleCalculate} disabled={isCalculating}>
            {isCalculating ? (
              "Calculating..."
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Salaries
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {salaryRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Results</CardTitle>
            <CardDescription>Salary calculation results for {format(month, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Bonuses</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Penalties</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employee_name}</TableCell>
                      <TableCell>${record.base_salary.toFixed(2)}</TableCell>
                      <TableCell>{record.attendance_days} days</TableCell>
                      <TableCell>{record.overtime_hours} hrs</TableCell>
                      <TableCell>${record.bonuses.toFixed(2)}</TableCell>
                      <TableCell>${record.deductions.toFixed(2)}</TableCell>
                      <TableCell>${record.penalties.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${record.total_salary.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Total: ${salaryRecords.reduce((sum, record) => sum + record.total_salary, 0).toFixed(2)}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
