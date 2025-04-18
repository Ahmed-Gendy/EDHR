import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { BankAccountList } from "@/components/bank-account-list"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getBankAccounts() {
  // Get all bank accounts
  const accountsQuery = query(collection(firestore, "bankAccounts"), where("deleted", "==", false))
  const accountsSnapshot = await getDocs(accountsQuery)

  // Map bank accounts
  const accounts = accountsSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      bank_name: data.bankName,
      account_number: data.accountNumber,
      account_name: data.accountName,
      branch: data.branch || "",
      currency: data.currency || "USD",
      balance: data.balance || 0,
      status: data.status || "ACTIVE",
      last_transaction_date: data.lastTransactionDate || null,
    }
  })

  return accounts
}

export default async function BankAccountsPage() {
  await requireAuth()
  const accounts = await getBankAccounts()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bank Accounts</h1>
        <Link href="/bank-accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </Link>
      </div>
      <BankAccountList accounts={accounts} />
    </DashboardShell>
  )
}
