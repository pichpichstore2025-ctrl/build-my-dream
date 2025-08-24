
"use client";

import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CalendarDays,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import React from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale, Purchase, Client, RecentActivity, Product, Expense } from "@/lib/types";
import { format, subDays, startOfDay, isSameDay, getMonth, getYear, eachDayOfInterval, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface DashboardData {
  sales: Sale[];
  purchases: Purchase[];
  clients: Client[];
  products: Product[];
  expenses: Expense[];
  recentActivities: RecentActivity[];
}

interface DashboardClientPageProps {
    initialData: DashboardData;
}

export default function DashboardClientPage({ initialData }: DashboardClientPageProps) {
  const [sales, setSales] = React.useState<Sale[]>(initialData.sales);
  const [clients, setClients] = React.useState<Client[]>(initialData.clients);
  const [products, setProducts] = React.useState<Product[]>(initialData.products);
  const [expenses, setExpenses] = React.useState<Expense[]>(initialData.expenses);
  const [recentActivities, setRecentActivities] = React.useState<RecentActivity[]>(initialData.recentActivities);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();


  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
    setTimeout(() => setIsLoading(false), 1000); // Simulate loading state
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalClients = clients.length;

  const { profitOrLoss, totalCogs, totalExpenses } = React.useMemo(() => {
    const productsMap = new Map(products.map(p => [p.name, p]));
    
    const currentTotalCogs = sales.reduce((cogsSum, sale) => {
      if (sale.items) {
        return cogsSum + sale.items.reduce((itemCogsSum, item) => {
          const product = productsMap.get(item.productName);
          if (product && product.cost) {
            return itemCogsSum + (product.cost * item.quantity);
          }
          return itemCogsSum;
        }, 0);
      }
      return cogsSum;
    }, 0);

    const currentTotalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const grossProfit = totalSales - currentTotalCogs;
    const netProfitOrLoss = grossProfit - currentTotalExpenses;

    return { profitOrLoss: netProfitOrLoss, totalCogs: currentTotalCogs, totalExpenses: currentTotalExpenses };
  }, [sales, products, expenses, totalSales]);
  
  const today = new Date();
  const dailySales = sales
    .filter(sale => isSameDay(new Date(sale.date), today))
    .reduce((sum, sale) => sum + sale.amount, 0);
    
  const monthlySales = sales
    .filter(sale => {
        const saleDate = new Date(sale.date);
        return getMonth(saleDate) === getMonth(today) && getYear(saleDate) === getYear(today);
    })
    .reduce((sum, sale) => sum + sale.amount, 0);
    
  const clientTotals = sales.reduce((acc, sale) => {
    if (!acc[sale.clientName]) {
      acc[sale.clientName] = 0;
    }
    acc[sale.clientName] += sale.amount;
    return acc;
  }, {} as Record<string, number>);

  const topClients = Object.entries(clientTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, total]) => {
      const clientInfo = clients.find(c => c.name === name);
      return { 
        name, 
        total,
        phone: clientInfo?.phone || 'N/A'
      };
    });
    
  const getMedalBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400';
      case 2:
      case 3:
        return 'bg-slate-400';
      case 4:
      case 5:
        return 'bg-orange-400';
      default:
        return 'bg-gray-200';
    }
  };

  const salesChartData = React.useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map(day => {
      const dailySales = sales
        .filter(sale => isSameDay(new Date(sale.date), day))
        .reduce((sum, sale) => sum + sale.amount, 0);

      return {
        date: format(day, 'dd'),
        sales: dailySales,
      };
    });
  }, [sales, today]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a summary of your sales activity."
      >
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All-time sales performance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
             <p className="text-xs text-muted-foreground">
              Total number of active clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
             <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${dailySales.toLocaleString()}
            </div>
             <p className="text-xs text-muted-foreground">
              Sales for today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit / Loss</CardTitle>
             {profitOrLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(profitOrLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
             <p className="text-xs text-muted-foreground">
              All-time net profit
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Daily Sales Performance</CardTitle>
            <CardDescription>
              Your sales performance over the current month.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="w-full h-72">
                <BarChart data={salesChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} />
                   <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
                </BarChart>
              </ChartContainer>
          </CardContent>
        </Card>
       </div>
       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-8">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Top 5 Clients</CardTitle>
            <CardDescription>
              Your most valuable clients based on total spending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((client, index) => (
                      <TableRow key={client.name}>
                        <TableCell>
                          <div className={cn("font-medium text-lg text-white text-center rounded-full h-6 w-6 flex items-center justify-center", getMedalBackground(index + 1))}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">
                              {client.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${client.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Recent Activities</CardTitle>
            <CardDescription>
              What's new in your sales pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => (
            <div key={activity.id} className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {activity.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(activity.time), "PPpp")}
              </p>
            </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
