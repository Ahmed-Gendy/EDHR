"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search } from "lucide-react"
import { format } from "date-fns"

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_name: string
  branch: string
  currency: string
  balance: number
  status: string
  last_transaction_date: string | null
}

interface BankAccountListProps {
  accounts: BankAccount[]
}

export function BankAccountList({ accounts }: BankAccountListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAccounts = accounts.filter((account) => {
    const searchValue = searchTerm.toLowerCase()
    return (
      account.bank_name.toLowerCase().includes(searchValue) ||
      account.account_number.toLowerCase().includes(searchValue) ||
      account.account_name.toLowerCase().includes(searchValue) ||
      account.branch.toLowerCase().includes(searchValue)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bank accounts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank Name</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Transaction</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No bank accounts found
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.bank_name}</TableCell>
                  <TableCell>{account.account_number}</TableCell>
                  <TableCell>{account.account_name}</TableCell>
                  <TableCell>{account.branch}</TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell>
                    {account.currency} {account.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>
                    {account.last_transaction_date ? (
                      format(new Date(account.last_transaction_date), "MMM d, yyyy")
                    ) : (
                      <span className="text-muted-foreground">No transactions</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/bank-accounts/${account.id}`} className="w-full">
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/bank-accounts/${account.id}/edit`} className="w-full">
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/bank-accounts/${account.id}/transactions`} className="w-full">
                            View Transactions
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
