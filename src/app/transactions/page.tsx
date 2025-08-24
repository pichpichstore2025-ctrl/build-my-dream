
"use client";

import { MoreHorizontal, PlusCircle, Trash2, Calendar as CalendarIcon, Pencil, Filter, User, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { collection, getDocs, addDoc, doc, updateDoc, runTransaction, deleteDoc, where, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale, Purchase, Client, Vendor, Product, SaleItem, PurchaseItem, Transaction, Expense, TransactionFormData } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Receipt as ReceiptComponent } from "@/components/receipt";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/ui/numeric-input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPiggyBank, faBuildingColumns } from "@fortawesome/free-solid-svg-icons";
import { faTwitter } from "@fortawesome/free-brands-svg-icons";


const provinces = [
  "បន្ទាយមានជ័យ", "បាត់ដំបង", "កំពង់ចាម", "កំពង់ឆ្នាំង", 
  "កំពង់ស្ពឺ", "កំពង់ធំ", "កំពត", "កណ្តាល", "កែប", "កោះកុង", 
  "ក្រចេះ", "មណ្ឌលគិរី", "ឧត្តរមានជ័យ", "ប៉ៃលិន", "ភ្នំពេញ", 
  "ព្រះសីហនុ", "ព្រះវិហារ", "ព្រៃវែង", "ពោធិ៍សាត់", "រតនគិរី", 
  "សៀមរាប", "ស្ទឹងត្រែង", "ស្វាយរៀង", "តាកែវ", "ត្បូងឃ្មុំ"
].sort((a, b) => a.localeCompare(b, 'km'));

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  
  const [fromDate, setFromDate] = React.useState<Date | undefined>();
  const [toDate, setToDate] = React.useState<Date | undefined>();
  
  const [filterType, setFilterType] = React.useState<'All' | 'Sale' | 'Purchase' | 'Expense'>('All');

  const [addProductOpen, setAddProductOpen] = React.useState(false);
  
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [printingTransaction, setPrintingTransaction] = React.useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = React.useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [totalCogs, setTotalCogs] = React.useState(0);
  const [totalExpenses, setTotalExpenses] = React.useState(0);

  const { toast } = useToast();

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [salesSnap, purchasesSnap, expensesSnap, clientsSnap, vendorsSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, "sales")),
        getDocs(collection(db, "purchases")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "vendors")),
        getDocs(collection(db, "products")),
      ]);
      
      const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), transactionType: 'Sale' } as Sale & { transactionType: 'Sale' }));
      const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), transactionType: 'Purchase' } as Purchase & { transactionType: 'Purchase' }));
      const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), transactionType: 'Expense' } as Expense & { transactionType: 'Expense' }));

      const clientsData = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)).sort((a,b) => a.name.localeCompare(b.name));
      const vendorsData = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .sort((a, b) => a.name.localeCompare(b.name));

      setClients(clientsData);
      setVendors(vendorsData);
      setProducts(productsData);

      const combinedTransactions: Transaction[] = [...sales, ...purchases, ...expenses];
      
      combinedTransactions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setAllTransactions(combinedTransactions);
    } catch (error) {
      console.error("Error fetching initial data: ", error);
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInitialData();
  }, []);

  const transactionsByDate = React.useMemo(() => {
    const filtered = allTransactions.filter(transaction => {
      if (filterType !== 'All' && transaction.transactionType !== filterType) {
        return false;
      }
      const transactionDate = new Date(transaction.date);
      if (fromDate && transactionDate < fromDate) {
        return false;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        if (transactionDate > endDate) {
          return false;
        }
      }
      return true;
    });

    return filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [allTransactions, fromDate, toDate, filterType]);
  

  const grandTotalCashIn = React.useMemo(() => {
    return Object.values(transactionsByDate).flat()
      .filter(t => t.transactionType === 'Sale')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsByDate]);

  const grandTotalCashOut = React.useMemo(() => {
    return Object.values(transactionsByDate).flat()
      .filter(t => t.transactionType === 'Purchase' || t.transactionType === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsByDate]);
  
  React.useEffect(() => {
    const productsMap = new Map(products.map(p => [p.name, p]));
    const sales = Object.values(transactionsByDate).flat().filter(t => t.transactionType === 'Sale') as Sale[];
    
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

    const currentTotalExpenses = Object.values(transactionsByDate).flat()
      .filter(t => t.transactionType === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalCogs(currentTotalCogs);
    setTotalExpenses(currentTotalExpenses);
  }, [transactionsByDate, products]);
  
  const cashFlowChartData = React.useMemo(() => [
    { name: 'Cash In', value: grandTotalCashIn, fill: 'var(--color-sales)' },
    { name: 'Cash Out', value: grandTotalCashOut, fill: 'var(--color-expenses)' },
  ], [grandTotalCashIn, grandTotalCashOut]);
  
  const cashFlowConfig = {
    sales: { label: 'Cash In', color: 'hsl(var(--chart-1))' },
    expenses: { label: 'Cash Out', color: 'hsl(var(--chart-3))' },
  };

  const netCashFlow = grandTotalCashIn - grandTotalCashOut;

  const totalSales = grandTotalCashIn;
  const profitAndLoss = totalSales - totalCogs - totalExpenses;
  
  const profitLossChartData = React.useMemo(() => [
    { name: 'Total Sales', value: totalSales, fill: 'var(--color-sales)' },
    { name: 'COGS', value: totalCogs, fill: 'var(--color-cogs)' },
    { name: 'Expenses', value: totalExpenses, fill: 'var(--color-expenses)' },
  ], [totalSales, totalCogs, totalExpenses]);

  const profitLossConfig = {
    sales: { label: 'Sales', color: 'hsl(var(--chart-1))' },
    cogs: { label: 'COGS', color: 'hsl(var(--chart-2))' },
    expenses: { label: 'Expenses', color: 'hsl(var(--chart-3))' },
  };

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>, onSuccess: () => void) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const cost = parseFloat(formData.get("cost") as string);
    const stock = parseInt(formData.get("stock") as string);
    const lowStock = parseInt(formData.get("lowStock") as string) || 0;
    
    if (!name || isNaN(price) || isNaN(stock) || isNaN(cost)) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProduct = {
        name,
        price,
        cost,
        stock,
        lowStock,
      };

      await addDoc(collection(db, "products"), newProduct);
      toast({
        title: "Success",
        description: "Product added successfully.",
      });
      onSuccess();
    } catch (e) {
      console.error("Error adding product: ", e);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    const {
      transactionType, transactionDate, selectedClient, saleItems, deliveryFee, 
      paymentMethod, purchaseItems, selectedVendor, 
      expenseAmount, expenseDescription, selectedExpenseVendor
    } = data;

    const date = transactionDate || new Date();
    const dateKey = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'MM-dd');
    
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', dateKey);
        const counterDoc = await transaction.get(counterRef);

        let productDocs: any[] = [];
        let vendorDoc: any;
        
        if (transactionType === 'Sale' && saleItems) {
            const productRefs = saleItems.map(item => doc(db, "products", item.productId));
            productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        } else if (transactionType === 'Purchase' && purchaseItems) {
            const productRefs = purchaseItems.map(item => doc(db, "products", item.productId));
            productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
            if (selectedVendor) {
              const vendorRef = doc(db, "vendors", selectedVendor);
              vendorDoc = await transaction.get(vendorRef);
              if (!vendorDoc.exists()) throw new Error("Vendor does not exist!");
            }
        }
        
        let newCount = 1;
        if (counterDoc.exists()) {
          newCount = counterDoc.data().count + 1;
        }
        
        const displayId = `${displayDate}-${String(newCount).padStart(2, '0')}`;
        const activityRef = doc(collection(db, "recentActivities"));

        if (transactionType === 'Sale') {
          const client = clients.find(c => c.id === selectedClient);
          if (!client || !saleItems || saleItems.length === 0) throw new Error("Invalid sale data");

          const totalAmount = saleItems.reduce((sum, item) => sum + (item.price * item.quantity - (item.discount || 0)), 0) + (deliveryFee || 0);
          const totalQuantity = saleItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalDiscount = saleItems.reduce((sum, item) => sum + (item.discount || 0), 0);

          const newSale = {
            displayId,
            clientName: client.name,
            productName: saleItems.map(item => item.productName).join(', '),
            date: date.toISOString(),
            amount: totalAmount,
            quantity: totalQuantity,
            discount: totalDiscount,
            items: saleItems,
            deliveryFee,
            paymentMethod: paymentMethod || '',
            transactionType: 'Sale'
          };
          
          productDocs.forEach((doc, index) => {
            if (!doc.exists()) throw new Error(`Product "${saleItems[index].productName}" not found!`);
            const currentStock = doc.data().stock;
            const quantitySold = saleItems[index].quantity;
            if (quantitySold > currentStock) {
              throw new Error(`Not enough stock for ${saleItems[index].productName}! Only ${currentStock} left.`);
            }
            transaction.update(doc.ref, { stock: currentStock - quantitySold });
          });

          const salesCollectionRef = collection(db, "sales");
          transaction.set(doc(salesCollectionRef), newSale);
          transaction.set(activityRef, { 
            type: 'sale', 
            description: `New sale of $${totalAmount.toFixed(2)} to ${client.name}`,
            time: new Date().toISOString(),
            person: client.name 
          });

        } else if (transactionType === 'Purchase') {
            const vendor = vendors.find(v => v.id === selectedVendor);
            if (!vendor) throw new Error("Invalid purchase data: vendor not found.");
            if (!purchaseItems || purchaseItems.length === 0) throw new Error("Invalid purchase data: no items.");
            
            const totalAmount = purchaseItems.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
            const totalQuantity = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);

            const newPurchase = {
              displayId,
              vendorName: vendor.name,
              date: date.toISOString(),
              amount: totalAmount,
              quantity: totalQuantity,
              items: purchaseItems,
              item: purchaseItems.map(i => i.itemName).join(', '),
              transactionType: 'Purchase'
            };
            
            if (vendorDoc && vendorDoc.exists()) {
              const newOrders = (vendorDoc.data()?.orders || 0) + 1;
              const newTotalAmount = (vendorDoc.data()?.totalAmount || 0) + totalAmount;
              transaction.update(vendorDoc.ref, { orders: newOrders, totalAmount: newTotalAmount });
            }
            
            productDocs.forEach((doc, index) => {
              if (!doc.exists()) throw new Error(`Product "${purchaseItems[index].itemName}" not found!`);
              const currentStock = doc.data().stock;
              const quantityPurchased = purchaseItems[index].quantity;
              transaction.update(doc.ref, { stock: currentStock + quantityPurchased });
            });

            const purchaseCollectionRef = collection(db, "purchases");
            transaction.set(doc(purchaseCollectionRef), newPurchase);
            transaction.set(activityRef, {
              type: 'purchase',
              description: `New purchase of $${totalAmount.toFixed(2)} from ${vendor.name}`,
              time: new Date().toISOString(),
              person: vendor.name
            });
        } else if (transactionType === 'Expense') {
          if (!expenseDescription || !expenseAmount || expenseAmount <= 0) throw new Error("Invalid expense data");
          const vendor = vendors.find(v => v.id === selectedExpenseVendor);

          const newExpense = {
            displayId,
            vendorName: vendor?.name || '',
            description: expenseDescription,
            date: date.toISOString(),
            amount: expenseAmount,
            transactionType: 'Expense'
          };
          const expensesCollectionRef = collection(db, "expenses");
          transaction.set(doc(expensesCollectionRef), newExpense);
          transaction.set(activityRef, {
            type: 'expense',
            description: `Expense: ${expenseDescription} for $${expenseAmount.toFixed(2)}`,
            time: new Date().toISOString(),
            person: 'Internal'
          });
        }

        if (counterDoc.exists()) {
            transaction.update(counterRef, { count: newCount });
        } else {
            transaction.set(counterRef, { count: newCount });
        }
      });
      
      toast({ title: "Success", description: "Transaction added successfully." });
      fetchInitialData();
      setOpen(false);
    } catch (e: any) {
      console.error("Error adding transaction: ", e);
      toast({ title: "Error", description: e.message || "Failed to add transaction.", variant: "destructive" });
    }
  };
  
  const handleEditTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction) return;

    const { transactionType } = editingTransaction;
    const collectionName = (transactionType.toLowerCase() + 's') as 'sales' | 'purchases' | 'expenses';
    const txDocRef = doc(db, collectionName, editingTransaction.id);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const originalTxDoc = await firestoreTransaction.get(txDocRef);
            if (!originalTxDoc.exists()) {
                throw new Error("Transaction to edit does not exist!");
            }
            const originalTx = originalTxDoc.data() as Sale | Purchase;

            const productIdsToFetch = new Set<string>();
            if (originalTx.transactionType === 'Sale' || originalTx.transactionType === 'Purchase') {
                originalTx.items?.forEach(item => productIdsToFetch.add(item.productId));
            }
            if (data.transactionType === 'Sale') {
                data.saleItems?.forEach(item => productIdsToFetch.add(item.productId));
            } else if (data.transactionType === 'Purchase') {
                data.purchaseItems?.forEach(item => productIdsToFetch.add(item.productId));
            }

            const productRefs = Array.from(productIdsToFetch).map(id => doc(db, "products", id));
            const productDocs = await Promise.all(productRefs.map(ref => firestoreTransaction.get(ref)));
            const productsMap = new Map(productDocs.map(d => [d.id, d.data() as Product]));

            const stockUpdates: { [productId: string]: number } = {};

            if (originalTx.transactionType === 'Sale') {
                originalTx.items?.forEach(item => {
                    stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) + item.quantity;
                });
            } else if (originalTx.transactionType === 'Purchase') {
                originalTx.items?.forEach(item => {
                    stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) - item.quantity;
                });
            }

            if (data.transactionType === 'Sale') {
                data.saleItems?.forEach(item => {
                    stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) - item.quantity;
                });
            } else if (data.transactionType === 'Purchase') {
                data.purchaseItems?.forEach(item => {
                    stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) + item.quantity;
                });
            }

            for (const productId in stockUpdates) {
                const originalStock = productsMap.get(productId)?.stock || 0;
                const newStock = originalStock + stockUpdates[productId];
                if (newStock < 0) {
                    throw new Error(`Not enough stock for ${productsMap.get(productId)?.name}.`);
                }
            }
            
            let updatedTxData: Partial<Sale | Purchase | Expense> = {};
            if (data.transactionType === 'Sale') {
                const client = clients.find(c => c.id === data.selectedClient);
                if (!client || !data.saleItems) throw new Error("Invalid new sale data");
                const totalAmount = data.saleItems.reduce((sum, item) => sum + (item.price * item.quantity - (item.discount || 0)), 0) + (data.deliveryFee || 0);
                updatedTxData = {
                    clientName: client.name, date: (data.transactionDate || new Date()).toISOString(),
                    amount: totalAmount, items: data.saleItems, deliveryFee: data.deliveryFee, paymentMethod: data.paymentMethod
                };
            } else if (data.transactionType === 'Purchase') {
                const vendor = vendors.find(v => v.id === data.selectedVendor);
                if (!vendor || !data.purchaseItems) throw new Error("Invalid new purchase data");
                const totalAmount = data.purchaseItems.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
                updatedTxData = {
                    vendorName: vendor.name, date: (data.transactionDate || new Date()).toISOString(),
                    amount: totalAmount, items: data.purchaseItems,
                };
            } else if (data.transactionType === 'Expense') {
                if (!data.expenseDescription || !data.expenseAmount) throw new Error("Invalid new expense data");
                const vendor = vendors.find(v => v.id === data.selectedExpenseVendor);
                updatedTxData = {
                    description: data.expenseDescription, amount: data.expenseAmount,
                    date: (data.transactionDate || new Date()).toISOString(), vendorName: vendor?.name || '',
                };
            }

            for (const productId in stockUpdates) {
                const productRef = doc(db, 'products', productId);
                const originalStock = productsMap.get(productId)?.stock || 0;
                const newStock = originalStock + stockUpdates[productId];
                firestoreTransaction.update(productRef, { stock: newStock });
            }

            firestoreTransaction.update(txDocRef, updatedTxData);
        });

        toast({ title: "Success", description: "Transaction updated successfully." });
        fetchInitialData();
        setEditOpen(false);

    } catch (e: any) {
        console.error("Error updating transaction: ", e);
        toast({ title: "Error", description: e.message || "Failed to update transaction.", variant: "destructive" });
        fetchInitialData();
    }
  };

  const handleDeleteTransaction = async (transactionId: string, type: 'Sale' | 'Purchase' | 'Expense') => {
    const collectionName = type.toLowerCase() + 's' as 'sales' | 'purchases' | 'expenses';
    const txDocRef = doc(db, collectionName, transactionId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const txDoc = await firestoreTransaction.get(txDocRef);
            if (!txDoc.exists()) {
                throw new Error("Transaction does not exist!");
            }

            const transactionData = txDoc.data();
            let productRefs: any[] = [];
            let productDocs: any[] = [];
            
            if (type === 'Sale' && (transactionData as Sale).items) {
                productRefs = (transactionData as Sale).items.map(item => doc(db, "products", item.productId));
                productDocs = await Promise.all(productRefs.map(ref => firestoreTransaction.get(ref)));
            } else if (type === 'Purchase' && (transactionData as Purchase).items) {
                productRefs = (transactionData as Purchase).items.map(item => doc(db, "products", item.productId));
                productDocs = await Promise.all(productRefs.map(ref => firestoreTransaction.get(ref)));
            }

            if (type === 'Sale') {
                const sale = transactionData as Sale;
                if (sale.items && sale.items.length > 0) {
                    productDocs.forEach((productDoc, index) => {
                         if (productDoc.exists()) {
                            const currentStock = productDoc.data().stock;
                            firestoreTransaction.update(productDoc.ref, { stock: currentStock + sale.items[index].quantity });
                        }
                    });
                }
            } else if (type === 'Purchase') {
                const purchase = transactionData as Purchase;
                if (purchase.items && purchase.items.length > 0) {
                     productDocs.forEach((productDoc, index) => {
                        if (productDoc.exists()) {
                            const currentStock = productDoc.data().stock;
                            firestoreTransaction.update(productDoc.ref, { stock: currentStock - purchase.items[index].quantity });
                        }
                    });
                }
            }
            
            firestoreTransaction.delete(txDocRef);
        });

        toast({ title: "Success", description: "Transaction deleted successfully and stock restored." });
        fetchInitialData();
    } catch (error: any) {
        console.error("Error deleting transaction: ", error);
        toast({ title: "Error", description: error.message || "Failed to delete transaction.", variant: "destructive" });
    }
  };


  const handleViewReceipt = (transaction: Transaction) => {
    setPrintingTransaction(transaction);
    setReceiptOpen(true);
  };
  
  const openEditDialog = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditOpen(true);
  };
  
  const openViewDialog = (tx: Transaction) => {
    setViewingTransaction(tx);
    setViewOpen(true);
  };
  
  const getContactForTransaction = (transaction: Transaction | null) => {
    if (!transaction) return null;
    if (transaction.transactionType === 'Sale') {
      return clients.find(c => c.name === (transaction as Sale).clientName) || null;
    } else if (transaction.transactionType === 'Purchase' || transaction.transactionType === 'Expense'){
      return vendors.find(v => v.name === (transaction as Purchase | Expense).vendorName) || null;
    }
    return null;
  };
  
  const renderAddProductDialog = () => (
    <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={(e) => handleAddProduct(e, () => {
          fetchInitialData();
          setAddProductOpen(false);
        })}>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Silk Tie" className="col-span-3" required />
            </div>
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">Cost</Label>
              <Input id="cost" name="cost" type="number" step="0.01" placeholder="e.g. 25.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="e.g. 45.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">Stock</Label>
              <Input id="stock" name="stock" type="number" placeholder="e.g. 200" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lowStock" className="text-right">Low Stock</Label>
              <Input id="lowStock" name="lowStock" type="number" placeholder="e.g. 20" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAddProductOpen(false)}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const TransactionForm = ({ isEdit, transaction, onFormSubmit, onCancel }: { isEdit: boolean, transaction?: Transaction | null, onFormSubmit: (data: TransactionFormData) => void, onCancel: () => void }) => {
    const [addClientOpen, setAddClientOpen] = React.useState(false);
    
    const defaultValues: Partial<TransactionFormData> = React.useMemo(() => {
        if (isEdit && transaction) {
            const base = {
                transactionType: transaction.transactionType,
                transactionDate: new Date(transaction.date),
            };
            if (transaction.transactionType === 'Sale') {
                const client = clients.find(c => c.name === transaction.clientName);
                return {
                    ...base,
                    selectedClient: client?.id || '',
                    saleItems: transaction.items || [],
                    deliveryFee: transaction.deliveryFee || 0,
                    paymentMethod: transaction.paymentMethod || '',
                }
            }
            if (transaction.transactionType === 'Purchase') {
                const vendor = vendors.find(v => v.name === (transaction as Purchase).vendorName);
                return {
                    ...base,
                    selectedVendor: vendor?.id || '',
                    purchaseItems: transaction.items || [],
                }
            }
            if (transaction.transactionType === 'Expense') {
                const vendor = vendors.find(v => v.name === transaction.vendorName);
                return {
                    ...base,
                    selectedExpenseVendor: vendor?.id || '',
                    expenseDescription: transaction.description,
                    expenseAmount: transaction.amount,
                }
            }
        }
        return {
            transactionType: 'Sale',
            transactionDate: new Date(),
            saleItems: [],
            purchaseItems: [],
            deliveryFee: 0,
            saleDiscount: 0,
            purchaseCost: 0,
            saleQuantity: 1,
            purchaseQuantity: 1
        };
    }, [isEdit, transaction, clients, vendors]);

    const form = useForm<TransactionFormData>({ defaultValues });
    const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
    
    React.useEffect(() => {
        reset(defaultValues);
    }, [isEdit, transaction, reset, defaultValues]);

    const { fields: saleFields, append: appendSale, remove: removeSale } = useFieldArray({ control, name: "saleItems" });
    const { fields: purchaseFields, append: appendPurchase, remove: removePurchase } = useFieldArray({ control, name: "purchaseItems" });

    const transactionType = watch("transactionType");
    const saleItems = watch("saleItems");
    const deliveryFee = watch("deliveryFee");
    const purchaseItems = watch("purchaseItems");
    const paymentMethod = watch("paymentMethod");
    
    const selectedProductId = watch("selectedProduct");
    const saleQuantity = watch("saleQuantity", 1);
    const saleDiscount = watch("saleDiscount", 0);

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const lineTotal = selectedProduct ? (selectedProduct.price * saleQuantity) - saleDiscount : 0;


    const handleAddProductToSale = () => {
        const product = products.find(p => p.id === watch('selectedProduct'));
        const quantity = watch('saleQuantity');
        if (!product || quantity <= 0) return;

        if (quantity > product.stock) {
            toast({
                title: "Not enough stock",
                description: `You can only sell up to ${product.stock} units of ${product.name}.`,
                variant: "destructive",
            });
            return;
        }

        appendSale({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: product.price,
            discount: watch('saleDiscount') || 0,
        });
        setValue('selectedProduct', '');
        setValue('saleQuantity', 1);
        setValue('saleDiscount', 0);
    };

    const handleAddItemToPurchase = () => {
        const product = products.find(p => p.id === watch('selectedProductForPurchase'));
        if (!product || watch('purchaseQuantity') <= 0 || watch('purchaseCost') <= 0) return;

        appendPurchase({
            productId: product.id,
            itemName: product.name,
            quantity: watch('purchaseQuantity'),
            cost: watch('purchaseCost') || 0,
        });
        setValue('selectedProductForPurchase', '');
        setValue('purchaseQuantity', 1);
        setValue('purchaseCost', 0);
    };
    
    const subtotal = (saleItems || []).reduce((sum, item) => sum + (item.price * item.quantity - (item.discount || 0)), 0);
    const grandTotalSale = subtotal + (deliveryFee || 0);
    const grandTotalPurchase = (purchaseItems || []).reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0);
    
    const handleAddNewClient = async (data: { name: string, phone: string, province: string, location: string }) => {
        if (!data.name || !data.phone) {
            toast({ title: "Error", description: "Client Name and Phone are required.", variant: "destructive" });
            return;
        }
        
        const q = query(collection(db, "clients"), where("phone", "==", data.phone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({
                title: "Client Already Exists",
                description: `A client with this phone number is already registered.`,
                variant: "destructive",
            });
            return;
        }

        try {
            const newClientData = { ...data, totalSpent: 0, orders: 0 };
            const docRef = await addDoc(collection(db, "clients"), newClientData);
            const newClientWithId = { ...newClientData, id: docRef.id };
            const updatedClients = [...clients, newClientWithId].sort((a,b) => a.name.localeCompare(b.name));
            setClients(updatedClients);
            setValue('selectedClient', docRef.id);
            toast({ title: "Success", description: "New client added." });
            setAddClientOpen(false);
        } catch (e) {
            console.error("Error adding client: ", e);
            toast({ title: "Error", description: "Could not add new client.", variant: "destructive" });
        }
    };

    const AddClientDialog = () => {
      const { register, handleSubmit: handleClientSubmit, control: clientControl } = useForm<{name: string, phone: string, province: string, location: string}>();

      return (
        <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleClientSubmit(handleAddNewClient)} className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                  <Label htmlFor="new-client-name">Full Name</Label>
                  <Input id="new-client-name" {...register('name', { required: true })} />
              </div>
              <div className="grid gap-1.5">
                  <Label htmlFor="new-client-phone">Phone Number</Label>
                  <Input id="new-client-phone" {...register('phone', { required: true })} />
              </div>
              <div className="grid gap-1.5">
                  <Label htmlFor="new-client-province">Province</Label>
                   <Controller
                      name="province"
                      control={clientControl}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue placeholder="Select a province" /></SelectTrigger>
                              <SelectContent>
                              {provinces.map((province) => (
                                  <SelectItem key={province} value={province}>{province}</SelectItem>
                              ))}
                              </SelectContent>
                          </Select>
                      )}
                    />
              </div>
              <div className="grid gap-1.5">
                  <Label htmlFor="new-client-location">Location/Address</Label>
                  <Input id="new-client-location" {...register('location')} />
              </div>
              <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setAddClientOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Client</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )
    };

    return (
        <>
        <AddClientDialog />
        <form onSubmit={handleSubmit(onFormSubmit)}>
            <DialogHeader>
                <DialogTitle>{isEdit ? `Edit ${transaction?.transactionType}` : 'New Transaction'}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue={transactionType || "Sale"} onValueChange={(v) => setValue('transactionType', v as any)} className="w-full pt-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Sale">Sale</TabsTrigger>
                    <TabsTrigger value="Purchase">Purchase</TabsTrigger>
                    <TabsTrigger value="Expense">Expense</TabsTrigger>
                </TabsList>

                <TabsContent value="Sale" className="max-h-[60vh] overflow-y-auto p-1">
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="grid gap-1.5">
                                <Label htmlFor="client">Client</Label>
                                <div className="flex gap-2">
                                  <Controller
                                      name="selectedClient"
                                      control={control}
                                      rules={{ required: "Client is required for a sale" }}
                                      render={({ field }) => (
                                          <Select onValueChange={field.onChange} value={field.value}>
                                              <SelectTrigger id="client" className="flex-grow"><SelectValue placeholder="Select a client" /></SelectTrigger>
                                              <SelectContent>
                                              {clients.map((client) => (
                                                  <SelectItem key={client.id} value={client.id}>{client.name} - {client.phone}</SelectItem>
                                              ))}
                                              </SelectContent>
                                          </Select>
                                      )}
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setAddClientOpen(true)}><User className="h-4 w-4"/></Button>
                                </div>
                                {errors.selectedClient && <p className="text-sm text-destructive">{errors.selectedClient.message}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="date">Date</Label>
                                <Controller
                                    name="transactionDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button id="date" variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator/>
                        <h4 className="font-semibold text-lg">Items</h4>
                        <div className="p-4 border rounded-md">
                          <div className="max-h-40 overflow-y-auto">
                            <Table>
                                <TableBody>
                                  {saleFields.map((item, index) => (
                                    <TableRow key={item.id} className="flex flex-col md:flex-row gap-2">
                                      <TableCell className="p-1 flex-grow">
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} ea. {item.discount > 0 && `(-$${item.discount.toFixed(2)})`}</p>
                                      </TableCell>
                                      <TableCell className="p-1 md:w-1/6">
                                        <Controller control={control} name={`saleItems.${index}.quantity`} render={({field}) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} className="w-full text-center" />} />
                                      </TableCell>
                                      <TableCell className="p-1 md:w-1/6">
                                         <Controller control={control} name={`saleItems.${index}.discount`} render={({field}) => <NumericInput {...field} className="w-full" />} />
                                      </TableCell>
                                      <TableCell className="p-1 md:w-1/6 font-medium text-right">
                                        ${((item.price * item.quantity) - (item.discount || 0)).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="p-1 text-right">
                                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSale(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  </TableBody>
                              </Table>
                            </div>
                           <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="w-full md:col-span-1">
                                    <Controller
                                        name="selectedProduct"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                                <SelectContent>
                                                {products.map((product) => (
                                                    <SelectItem key={product.id} value={product.id} disabled={product.stock <= 0}>{product.name} ({product.stock} left)</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                 <div className="w-full md:col-span-1 grid grid-cols-4 gap-2 items-center">
                                    <Input className="col-span-1" type="number" placeholder="Qty" {...register('saleQuantity', { valueAsNumber: true, min: 1 })} />
                                    <Controller name="saleDiscount" control={control} render={({ field }) => <NumericInput className="col-span-1" {...field} placeholder="Discount" />} />
                                    <div className="font-bold text-lg text-right flex items-center justify-end">
                                        <span>${lineTotal.toFixed(2)}</span>
                                    </div>
                                    <Button className="col-span-1" type="button" onClick={handleAddProductToSale} disabled={!watch('selectedProduct')}>Add</Button>
                                 </div>
                             </div>
                        </div>
                        
                        <Separator />
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-lg mb-2">Payment Method</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                      <button type="button" onClick={() => setValue('paymentMethod', 'COD')} className={cn("flex items-center justify-center w-20 h-20 rounded-full border-2 transition-colors", paymentMethod === 'COD' ? "border-primary bg-primary/10" : "border-border")}>
                                          <FontAwesomeIcon icon={faPiggyBank} className="text-4xl" />
                                      </button>
                                      <Label>COD</Label>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <button type="button" onClick={() => setValue('paymentMethod', 'BANK')} className={cn("flex items-center justify-center w-20 h-20 rounded-full border-2 transition-colors", paymentMethod === 'BANK' ? "border-primary bg-primary/10" : "border-border")}>
                                      <FontAwesomeIcon icon={faBuildingColumns} className="text-4xl" />
                                    </button>
                                    <Label>BANK</Label>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <button type="button" onClick={() => setValue('paymentMethod', 'WING')} className={cn("flex items-center justify-center w-20 h-20 rounded-full border-2 transition-colors", paymentMethod === 'WING' ? "border-primary bg-primary/10" : "border-border")}>
                                      <FontAwesomeIcon icon={faTwitter} className="text-4xl" />
                                    </button>
                                    <Label>WING</Label>
                                  </div>
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-lg mb-2">Delivery</h4>
                                <div className="grid gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="delivery-fee">Delivery Fee</Label>
                                        <Controller name="deliveryFee" control={control} render={({ field }) => <NumericInput {...field} placeholder="$0.00" />} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card className="bg-muted/50 mt-4">
                            <CardContent className="p-4 flex justify-between items-center">
                                <CardTitle className="text-xl">Grand Total</CardTitle>
                                <p className="text-3xl font-bold text-primary">${grandTotalSale.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="Purchase" className="max-h-[60vh] overflow-y-auto p-1">
                   <div className="grid gap-6 py-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="vendor">Vendor</Label>
                                <Controller
                                    name="selectedVendor"
                                    control={control}
                                    rules={{ required: "Vendor is required for a purchase" }}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="vendor"><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                                            <SelectContent>
                                            {vendors.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                  />
                                {errors.selectedVendor && <p className="text-sm text-destructive">{errors.selectedVendor.message}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="purchase-date">Date</Label>
                                <Controller
                                    name="transactionDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button id="purchase-date" variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                        </div>
                        <Separator/>
                        <h4 className="font-semibold text-lg">Items</h4>
                         <div className="p-4 border rounded-md">
                          <div className="max-h-40 overflow-y-auto">
                            <Table>
                                <TableBody>
                                  {purchaseFields.map((item, index) => (
                                    <TableRow key={item.id} className="flex flex-col md:flex-row gap-2">
                                      <TableCell className="p-1 flex-grow">
                                        <p className="font-medium">{item.itemName}</p>
                                        <p className="text-sm text-muted-foreground">${(item.cost || 0).toFixed(2)} ea.</p>
                                      </TableCell>
                                      <TableCell className="p-1 md:w-1/6"><Controller control={control} name={`purchaseItems.${index}.quantity`} render={({field}) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} className="w-full text-center" />} /></TableCell>
                                      <TableCell className="p-1 md:w-1/6"><Controller control={control} name={`purchaseItems.${index}.cost`} render={({field}) => <NumericInput {...field} className="w-full" />} /></TableCell>
                                      <TableCell className="p-1 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => removePurchase(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                    </TableRow>
                                  ))}
                                  </TableBody>
                              </Table>
                            </div>
                             <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="w-full">
                                    <Controller
                                        name="selectedProductForPurchase"
                                        control={control}
                                        render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        )}
                                    />
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Input type="number" placeholder="Qty" {...register('purchaseQuantity', { valueAsNumber: true, min: 1 })} />
                                    <Controller name="purchaseCost" control={control} render={({ field }) => <NumericInput {...field} placeholder="Unit Cost" />} />
                                    <Button type="button" onClick={handleAddItemToPurchase} disabled={!watch('selectedProductForPurchase')} className="w-full">Add</Button>
                                 </div>
                             </div>
                        </div>
                        <Card className="bg-muted/50 mt-4">
                            <CardContent className="p-4 flex justify-between items-center">
                                <CardTitle className="text-xl">Total Cost</CardTitle>
                                <p className="text-3xl font-bold text-primary">${grandTotalPurchase.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                   </div>
                </TabsContent>

                <TabsContent value="Expense" className="max-h-[60vh] overflow-y-auto p-1">
                   <div className="grid gap-6 py-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="expense-desc">Description</Label>
                        <Input id="expense-desc" {...register('expenseDescription', { required: transactionType === 'Expense' })} />
                        {errors.expenseDescription && <p className="text-sm text-destructive">Description is required.</p>}
                      </div>
                       <div className="grid gap-1.5">
                        <Label htmlFor="expense-amount">Amount</Label>
                         <Controller
                            name="expenseAmount"
                            control={control}
                            rules={{ required: transactionType === 'Expense', min: 0.01 }}
                            render={({ field }) => <NumericInput {...field} placeholder="$0.00" />}
                          />
                        {errors.expenseAmount && <p className="text-sm text-destructive">A valid amount is required.</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="grid gap-1.5">
                          <Label htmlFor="expense-vendor">Vendor (Optional)</Label>
                           <Controller
                              name="selectedExpenseVendor"
                              control={control}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                                      <SelectContent>
                                      {vendors.map((vendor) => (
                                          <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                                      ))}
                                      </SelectContent>
                                  </Select>
                              )}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="expense-date">Date</Label>
                             <Controller
                                name="transactionDate"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id="expense-date" variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                      </div>
                   </div>
                </TabsContent>
            </Tabs>

            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{isEdit ? 'Save Changes' : `Create ${transactionType}`}</Button>
            </DialogFooter>
        </form>
        </>
    );
  };
  
  const renderViewDialog = () => {
    if (!viewingTransaction) return null;
    const tx = viewingTransaction;
    const client = tx.transactionType === 'Sale' ? clients.find(c => c.name === tx.clientName) : null;
    const items = tx.transactionType === 'Sale' ? tx.items : tx.transactionType === 'Purchase' ? tx.items : [];
    const totalAmount = tx.amount;
    const deliveryFee = tx.transactionType === 'Sale' ? tx.deliveryFee : 0;
    
    return (
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Viewing transaction ID: {tx.displayId || tx.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label>Date</Label>
                    <Input value={format(new Date(tx.date), "PPP")} disabled />
                </div>
                <div className="grid gap-1.5">
                    <Label>Type</Label>
                    <Input value={tx.transactionType} disabled />
                </div>
            </div>

            {tx.transactionType === 'Sale' && (
                <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <Label>Client</Label>
                        <Input value={tx.clientName} disabled />
                    </div>
                    {client && 
                    <div className="grid gap-1.5">
                        <Label>Client Province</Label>
                        <Input value={client.province} disabled />
                    </div>
                    }
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <Label>Delivery Fee</Label>
                        <Input value={`$${(deliveryFee || 0).toFixed(2)}`} disabled />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="grid gap-1.5">
                        <Label>Payment Method</Label>
                        <Input value={tx.paymentMethod || 'N/A'} disabled />
                    </div>
                 </div>
                </>
            )}

            {(tx.transactionType === 'Purchase' || tx.transactionType === 'Expense') && (
                <div className="grid gap-1.5">
                    <Label>Vendor</Label>
                    <Input value={(tx as Purchase | Expense).vendorName} disabled />
                </div>
            )}
            
            {tx.transactionType === 'Expense' && (
                 <div className="grid gap-1.5">
                    <Label>Description</Label>
                    <Textarea value={tx.description} disabled />
                </div>
            )}
            
            {(tx.transactionType === 'Sale' || tx.transactionType === 'Purchase') && items && items.length > 0 && (
                <>
                <Separator />
                <h4 className="font-medium text-center">Items</h4>
                <div className="space-y-2">
                    {items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md border">
                            <div>
                                <p className="font-medium">{item.productName || item.itemName}</p>
                                <p className="text-sm text-muted-foreground">
                                    Qty: {item.quantity} x Price: ${tx.transactionType === 'Sale' ? item.price.toFixed(2) : (item.cost || 0).toFixed(2)}
                                    {tx.transactionType === 'Sale' && (item.discount || 0) > 0 && ` - Disc: $${(item.discount || 0).toFixed(2)}`}
                                </p>
                            </div>
                            <p className="font-medium">
                                ${tx.transactionType === 'Sale' 
                                    ? (item.quantity * item.price - (item.discount || 0)).toFixed(2)
                                    : (item.quantity * (item.cost || 0)).toFixed(2)
                                }
                            </p>
                        </div>
                    ))}
                </div>
                </>
            )}

            <Separator />
            <div className="flex justify-end items-center gap-4 pt-4 font-bold text-lg">
                <Label>Grand Total</Label>
                <div>${totalAmount.toFixed(2)}</div>
            </div>
          </div>
          <DialogFooter className="justify-between">
            <div>
              <Button variant="secondary" onClick={() => setViewOpen(false)}>Close</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setViewOpen(false); openEditDialog(tx); }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => { handleDeleteTransaction(tx.id, tx.transactionType); setViewOpen(false); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              {tx.transactionType === 'Sale' && (
                <Button onClick={() => handleViewReceipt(tx)}>
                  View Receipt
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Transactions"
        description="A unified log of all your sales and purchases."
      >
        <div className="flex items-center gap-2">
            <Button onClick={fetchInitialData} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2" />
                {filterType === 'All' ? 'All Transactions' : `TS- ${filterType}s`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <DropdownMenuRadioItem value="All">All Transactions</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Sale">TS- Sales</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Purchase">TS- Purchases</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Expense">TS- Expenses</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <TransactionForm isEdit={false} onFormSubmit={handleAddTransaction} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-4xl">
              <TransactionForm isEdit={true} transaction={editingTransaction} onFormSubmit={handleEditTransaction} onCancel={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
       <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>A breakdown of your core financial metrics.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border p-4 rounded-lg">
                <h3 className="font-semibold text-center mb-4">Cash Flow Analysis</h3>
                <div className="grid grid-cols-5 items-center gap-4">
                    <div className="col-span-3 h-60">
                        <ChartContainer config={cashFlowConfig} className="w-full h-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie data={cashFlowChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5}>
                            {cashFlowChartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                            </Pie>
                        </PieChart>
                        </ChartContainer>
                    </div>
                    <div className="col-span-2 flex flex-col gap-2 text-sm">
                        <div className="flex flex-col p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                            <p className="text-muted-foreground">Cash In</p>
                        </div>
                        <p className="font-bold ml-4">${grandTotalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex flex-col p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                            <p className="text-muted-foreground">Cash Out</p>
                        </div>
                        <p className="font-bold ml-4">${grandTotalCashOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className={cn("p-2 rounded-lg font-bold", netCashFlow >= 0 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300')}>
                        <span>Net Flow</span>
                        <p>${netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-lg">
               <h3 className="font-semibold text-center mb-4">Profit & Loss Analysis</h3>
               <div className="grid grid-cols-5 items-center gap-4">
                  <div className="col-span-3 h-60">
                    <ChartContainer config={profitLossConfig} className="w-full h-full">
                        <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={profitLossChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5}>
                            {profitLossChartData.map((entry) => (
                            <Cell key={`cell-pl-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="col-span-2 flex flex-col gap-2 text-sm">
                      <div className="flex flex-col p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                            <p className="text-muted-foreground">Sales</p>
                        </div>
                        <p className="font-bold ml-4">${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                            <p className="text-muted-foreground">COGS</p>
                        </div>
                        <p className="font-bold ml-4">${totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                            <p className="text-muted-foreground">Expenses</p>
                        </div>
                        <p className="font-bold ml-4">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className={cn("p-2 rounded-lg font-bold", profitAndLoss >= 0 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300')}>
                        <span>Profit/Loss</span>
                        <p>${profitAndLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="font-headline">Transaction History</CardTitle>
                <CardDescription>
                  Review all cash-in and cash-out activities.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="from-date"
                        variant={"outline"}
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : <span>From Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="to-date"
                        variant={"outline"}
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : <span>To Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-y-auto">
            <div className="relative overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {Object.keys(transactionsByDate).map(date => (
                      <React.Fragment key={date}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={3} className="font-bold text-primary">
                            {format(new Date(date), "dd MMM, yyyy")}
                          </TableCell>
                        </TableRow>
                        {transactionsByDate[date].map(transaction => {
                          const contact = getContactForTransaction(transaction);
                          const name = transaction.transactionType === 'Sale' 
                                      ? transaction.clientName
                                      : transaction.vendorName || '-';

                          const productsList = transaction.transactionType === 'Sale' 
                            ? transaction.items.map(i => i.productName).join(', ')
                            : transaction.transactionType === 'Purchase'
                            ? transaction.items.map(i => i.itemName).join(', ')
                            : transaction.description;
                            
                          const province = transaction.transactionType === 'Sale' 
                            ? contact?.province || ''
                            : '';

                          return (
                          <TableRow key={transaction.id} onDoubleClick={() => openViewDialog(transaction)} className="cursor-pointer">
                             <TableCell className="w-2/3">
                               <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white",
                                    transaction.transactionType === 'Sale' && 'bg-green-500',
                                    transaction.transactionType === 'Purchase' && 'bg-yellow-500',
                                    transaction.transactionType === 'Expense' && 'bg-red-500'
                                  )}>
                                    {transaction.transactionType === 'Sale' ? 'ST' :
                                    transaction.transactionType === 'Purchase' ? 'PT' : 'XP'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {name}
                                    <span className="text-sm text-muted-foreground md:block">{contact?.phone}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {productsList}
                                  </div>
                                </div>
                               </div>
                            </TableCell>
                             <TableCell>
                              {province}
                            </TableCell>
                             <TableCell className={cn(
                                "text-right font-bold",
                                transaction.transactionType === 'Sale' ? 'text-green-600' : 'text-red-600'
                             )}>
                              {`$${transaction.amount.toFixed(2)}`}
                            </TableCell>
                          </TableRow>
                        )})}
                      </React.Fragment>
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
           <ReceiptComponent
              transaction={printingTransaction}
              contact={getContactForTransaction(printingTransaction)}
              onClose={() => setReceiptOpen(false)}
            />
        </DialogContent>
      </Dialog>
      
      {renderAddProductDialog()}
      {renderViewDialog()}

    </div>
  );
}
