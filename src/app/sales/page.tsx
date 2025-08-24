
'use client';

import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';

import { db } from '@/lib/firebase';
import type { Sale, Client } from '@/lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt } from '@/components/receipt';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export default function SalesPage() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [printingTransaction, setPrintingTransaction] = React.useState<Sale | null>(null);
  const { toast } = useToast();

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const [salesSnap, clientsSnap] = await Promise.all([
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'clients')),
      ]);

      const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const clientsData = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));

      setSales(salesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching sales data: ', error);
      toast({
        title: "Error",
        description: "Could not fetch sales data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSalesData();
  }, []);
  
  const handleViewReceipt = (transaction: Sale) => {
    setPrintingTransaction(transaction);
    setReceiptOpen(true);
  };
  
  const getContactForTransaction = (transaction: Sale | null) => {
    if (!transaction) return null;
    return clients.find(c => c.name === transaction.clientName) || null;
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Sales"
          description="Loading sales history..."
        >
          <Button onClick={fetchSalesData} disabled={isLoading}>
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
        title="Sales"
        description="A detailed history of all your sales transactions."
      >
        <Button onClick={fetchSalesData} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              Sales History
            </CardTitle>
            <CardDescription>
              Browse and manage all recorded sales.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-y-auto">
            <div className="relative overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.displayId || sale.id.substring(0,6).toUpperCase()}</TableCell>
                      <TableCell>{format(new Date(sale.date), 'dd MMM, yyyy')}</TableCell>
                      <TableCell>{sale.clientName}</TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          {sale.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-muted-foreground"> (Qty: {item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                       <TableCell className="text-right">${(sale.discount || 0).toFixed(2)}</TableCell>
                       <TableCell>
                        <Badge variant="secondary">{sale.paymentMethod || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${sale.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewReceipt(sale)}>
                              View Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
            <DialogContent className="p-0 w-[80mm]">
               <DialogTitle className="sr-only">Receipt</DialogTitle>
               <Receipt
                  transaction={printingTransaction}
                  contact={getContactForTransaction(printingTransaction)}
                  onClose={() => setReceiptOpen(false)}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
}
