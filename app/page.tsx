import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { sql } from "@/lib/db"
import { initDb } from "@/lib/init-db"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { signOut } from "@/app/actions/auth"

// Helper to format currency
const formatCurrency = (amount: number | string) => {
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericAmount)
}

export default async function Dashboard() {
  // Initialize database
  await initDb()

  // Get authenticated user
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userId = session.user.id

  try {
    // Ensure user profile exists
    await sql`
      INSERT INTO user_profiles (id, email, full_name)
      VALUES (${userId}, ${session.user.email}, ${session.user.user_metadata?.full_name || session.user.email})
      ON CONFLICT (id) DO NOTHING
    `

    const totalBalanceResult = await sql`
      SELECT COALESCE(SUM(balance), 0) as total 
      FROM accounts 
      WHERE user_id = ${userId}
    `
    const totalBalance = totalBalanceResult[0]?.total ?? 0

    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE amount > 0 
        AND account_id IN (SELECT id FROM accounts WHERE user_id = ${userId})
    `
    const income = incomeResult[0]?.total ?? 0

    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE amount < 0 
        AND account_id IN (SELECT id FROM accounts WHERE user_id = ${userId})
    `
    const expenses = expensesResult[0]?.total ?? 0

    const savingsResult = await sql`
      SELECT COALESCE(balance, 0) as balance 
      FROM accounts 
      WHERE user_id = ${userId} AND account_type = 'savings'
      LIMIT 1
    `
    const savings = savingsResult[0]?.balance ?? 0

    const transactions = await sql`
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.status,
        t.type,
        t.date,
        up.full_name as customer_name,
        up.email as customer_email
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN user_profiles up ON a.user_id = up.id
      WHERE a.user_id = ${userId}
      ORDER BY t.date DESC
      LIMIT 5
    `

    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Package2 className="h-6 w-6" />
                <span className="">V-Bank</span>
              </Link>
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8 bg-transparent">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Transactions
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Package className="h-4 w-4" />
                  Accounts
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <CreditCard className="h-4 w-4" />
                  Cards
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <LineChart className="h-4 w-4" />
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="mt-auto p-4">
              <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle className="text-sm">
                    Welcome, {session.user.user_metadata?.full_name || session.user.email}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <form action={signOut}>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Income</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(income)}</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Savings</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(savings)}</div>
                  <p className="text-xs text-muted-foreground">+10% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Recent transactions from your accounts.</CardDescription>
                  </div>
                  <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="#">
                      View All
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="hidden xl:table-column">Type</TableHead>
                        <TableHead className="hidden xl:table-column">Status</TableHead>
                        <TableHead className="hidden xl:table-column">Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="font-medium">{tx.description}</div>
                              <div className="hidden text-sm text-muted-foreground md:inline">{tx.customer_name}</div>
                            </TableCell>
                            <TableCell className="hidden xl:table-column capitalize">{tx.type}</TableCell>
                            <TableCell className="hidden xl:table-column">
                              <Badge className="text-xs" variant="outline">
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                              {new Date(tx.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Button>Send Money</Button>
                  <Button variant="outline">Request Money</Button>
                  <Button variant="outline">Add Funds</Button>
                  <Button variant="outline">Pay a Bill</Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Database Error</CardTitle>
            <CardDescription>Failed to load dashboard data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please check your database connection and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
