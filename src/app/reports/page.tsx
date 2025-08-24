
'use client';

import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Sale, Expense, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';


interface SoldItem {
  name: string;
  quantity: number;
  totalSales: number;
}

export default function ReportsPage() {
  const [totalSales, setTotalSales] = React.useState(0);
  const [totalCogs, setTotalCogs] = React.useState(0);
  const [totalExpenses, setTotalExpenses] = React.useState(0);
  const [soldItems, setSoldItems] = React.useState<SoldItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [salesSnap, expensesSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'products')),
      ]);

      const sales = salesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Sale)
      );
      const expenses = expensesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Expense)
      );
      const products = productsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      const productsMap = new Map(products.map(p => [p.name, p]));

      const currentTotalSales = sales.reduce(
        (sum, sale) => sum + sale.amount,
        0
      );
      setTotalSales(currentTotalSales);

      const currentTotalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      setTotalExpenses(currentTotalExpenses);

      const soldItemsMap: { [name: string]: SoldItem } = {};
      let currentTotalCogs = 0;

      sales.forEach((sale) => {
        if (sale.items) {
          sale.items.forEach((item) => {
            const product = productsMap.get(item.productName);
            if (product && product.cost) {
              currentTotalCogs += product.cost * item.quantity;
            }

            if (!soldItemsMap[item.productName]) {
              soldItemsMap[item.productName] = {
                name: item.productName,
                quantity: 0,
                totalSales: 0,
              };
            }
            soldItemsMap[item.productName].quantity += item.quantity;
            soldItemsMap[item.productName].totalSales +=
              item.price * item.quantity - (item.discount || 0);
          });
        }
      });

      setTotalCogs(currentTotalCogs);
      setSoldItems(Object.values(soldItemsMap));
    } catch (error) {
      console.error('Error fetching report data: ', error);
    } finally {
      setIsLoading(false);
    }
  };


  React.useEffect(() => {
    fetchReportData();
  }, []);

  const grossProfit = totalSales - totalCogs;
  const netProfitOrLoss = grossProfit - totalExpenses;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Reports"
          description="Loading profit and loss analysis..."
        >
          <Button onClick={fetchReportData} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </PageHeader>
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Profit & Loss Report"
        description="A summary of your business's financial performance."
      >
        <Button onClick={fetchReportData} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>Total revenue from all sales.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cost of Goods Sold</CardTitle>
            <CardDescription>
              The direct costs attributable to the production of the goods sold.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalCogs.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>
              All other business operational expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            netProfitOrLoss >= 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
          )}
        >
          <CardHeader>
            <CardTitle>Net Profit / Loss</CardTitle>
            <CardDescription>
              The final profit or loss after all costs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn('text-2xl font-bold', netProfitOrLoss >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}
            >
              ${netProfitOrLoss.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Items Sold Summary</CardTitle>
            <CardDescription>
              A breakdown of all items sold, their quantities, and total sales
              generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-y-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-center">Quantity Sold</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldItems.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.totalSales.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
