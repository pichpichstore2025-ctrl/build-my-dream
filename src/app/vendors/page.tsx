
'use client';

import { PlusCircle, MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
import React from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import type { Vendor, Purchase, Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";



export default function VendorsPage() {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingVendor, setEditingVendor] = React.useState<Vendor | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchVendorsAndData = async () => {
    setIsLoading(true);
    try {
      const [vendorsSnap, purchasesSnap, expensesSnap] = await Promise.all([
        getDocs(collection(db, "vendors")),
        getDocs(collection(db, "purchases")),
        getDocs(collection(db, "expenses")),
      ]);

      const vendorsData = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      const purchasesData = purchasesSnap.docs.map(doc => doc.data() as Purchase);
      const expensesData = expensesSnap.docs.map(doc => doc.data() as Expense);

      const vendorsWithTotals = vendorsData.map(vendor => {
        const vendorPurchases = purchasesData.filter(p => p.vendorName === vendor.name);
        const vendorExpenses = expensesData.filter(e => e.vendorName === vendor.name);
        
        const totalPurchaseAmount = vendorPurchases.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenseAmount = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalAmount = totalPurchaseAmount + totalExpenseAmount;
        const orders = vendorPurchases.length + vendorExpenses.length;
        
        return { ...vendor, totalAmount, orders };
      });
      
      setVendors(vendorsWithTotals);
    } catch (error) {
      console.error("Error fetching data:", error);
       toast({
        title: "Error",
        description: "Could not fetch vendor data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  React.useEffect(() => {
    fetchVendorsAndData();
  }, []);

  const handleAddVendor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newVendor = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      contactPerson: '', 
      email: '',
      category: '',
      orders: 0,
      totalAmount: 0,
    };

    try {
      await addDoc(collection(db, "vendors"), newVendor);
      fetchVendorsAndData();
      setOpen(false);
      toast({
        title: "Success",
        description: "Vendor added successfully.",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        title: "Error",
        description: "Failed to add vendor.",
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVendor) return;

    const formData = new FormData(event.currentTarget);
    const updatedVendor = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
    };

    try {
      const vendorDocRef = doc(db, "vendors", editingVendor.id);
      await updateDoc(vendorDocRef, updatedVendor);
      fetchVendorsAndData();
      setEditOpen(false);
      setEditingVendor(null);
      toast({
        title: "Success",
        description: "Vendor updated successfully.",
      });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
        title: "Error",
        description: "Failed to update vendor.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await deleteDoc(doc(db, "vendors", vendorId));
      fetchVendorsAndData();
      toast({
        title: "Success",
        description: "Vendor deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting vendor: ", error);
      toast({
        title: "Error",
        description: "Failed to delete vendor.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Vendors"
        description="Manage your vendor list and purchase history."
      >
        <div className="flex items-center gap-2">
            <Button onClick={fetchVendorsAndData} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddVendor}>
                  <DialogHeader>
                    <DialogTitle>Add New Vendor</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new vendor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" name="name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        Phone
                      </Label>
                      <Input id="phone" name="phone" type="tel" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">
                        Location
                      </Label>
                      <Input id="location" name="location" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Vendor</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditVendor}>
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>
                Update the details of your vendor below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input id="edit-name" name="name" defaultValue={editingVendor?.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editingVendor?.phone} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  Location
                </Label>
                <Input id="edit-location" name="location" defaultValue={editingVendor?.location} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">Vendor List</CardTitle>
              <CardDescription>
                A list of all your vendors and their contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-y-auto">
              <div className="relative overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name & Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">
                             {'VD-' + vendor.id.substring(0, 4).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium">{vendor.name}</p>
                              <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{vendor.location}</TableCell>
                          <TableCell>{vendor.orders}</TableCell>
                          <TableCell className="text-right">${(vendor.totalAmount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditDialog(vendor)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
    </div>
  );
}
