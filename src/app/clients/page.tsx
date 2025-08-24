
'use client';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
import React from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import type { Client, Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const provinces = [
  "បន្ទាយមានជ័យ", "បាត់ដំបង", "កំពង់ចាម", "កំពង់ឆ្នាំង", 
  "កំពង់ស្ពឺ", "កំពង់ធំ", "កំពត", "កណ្តាល", "កែប", "កោះកុង", 
  "ក្រចេះ", "មណ្ឌលគិរី", "ឧត្តរមានជ័យ", "ប៉ៃលិន", "ភ្នំពេញ", 
  "ព្រះសីហនុ", "ព្រះវិហារ", "ព្រៃវែង", "ពោធិ៍សាត់", "រតនគិរី", 
  "សៀមរាប", "ស្ទឹងត្រែង", "ស្វាយរៀង", "តាកែវ", "ត្បូងឃ្មុំ"
].sort((a, b) => a.localeCompare(b, 'km'));

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [selectedProvince, setSelectedProvince] = React.useState<string | undefined>(undefined);
  const [editingProvince, setEditingProvince] = React.useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchClientsAndSales = async () => {
    setIsLoading(true);
    try {
      const clientsQuerySnapshot = await getDocs(collection(db, "clients"));
      const clientsData = clientsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const salesQuerySnapshot = await getDocs(collection(db, "sales"));
      const salesData = salesQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      
      setClients(clientsData);
      setSales(salesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClientsAndSales();
  }, []);

  const clientDataWithTotals = React.useMemo(() => {
    return clients.map(client => {
      const clientSales = sales.filter(sale => sale.clientName === client.name);
      const totalSpent = clientSales.reduce((sum, sale) => sum + sale.amount, 0);
      const orders = clientSales.length;
      return { ...client, totalSpent, orders };
    });
  }, [clients, sales]);


  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = formData.get("phone") as string;

    const existingClient = clients.find(client => client.phone === phone);
    if (existingClient) {
      toast({
        title: "Client Already Exists",
        description: `Client "${existingClient.name}" with phone number "${existingClient.phone}" is already registered.`,
        variant: "destructive",
      });
      return;
    }
    
    const newClient = {
      name: formData.get("name") as string,
      phone: phone,
      province: selectedProvince || "",
      location: formData.get("location") as string,
      totalSpent: 0,
      orders: 0,
    };

    try {
      await addDoc(collection(db, "clients"), newClient);
      fetchClientsAndSales();
      setOpen(false);
      setSelectedProvince(undefined);
       toast({
        title: "Success",
        description: "Client added successfully.",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
       toast({
        title: "Error",
        description: "Failed to add client.",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(event.currentTarget);
    const updatedClient = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      province: editingProvince || editingClient.province,
      location: formData.get("location") as string,
    };

    try {
      const clientDocRef = doc(db, "clients", editingClient.id);
      await updateDoc(clientDocRef, updatedClient);
      fetchClientsAndSales();
      setEditOpen(false);
      setEditingClient(null);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteDoc(doc(db, "clients", clientId));
      fetchClientsAndSales();
    } catch (error) {
      console.error("Error deleting client: ", error);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditingProvince(client.province);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Clients"
        description="Manage your client list and view their sales history."
      >
        <div className="flex items-center gap-2">
            <Button onClick={fetchClientsAndSales} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddClient}>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new client.
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
                      <Label htmlFor="province" className="text-right">
                        Province
                      </Label>
                      <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Button type="submit">Save Client</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditClient}>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update the details of your client below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input id="edit-name" name="name" defaultValue={editingClient?.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editingClient?.phone} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-province" className="text-right">
                  Province
                </Label>
                <Select onValueChange={setEditingProvince} value={editingProvince}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  Location
                </Label>
                <Input id="edit-location" name="location" defaultValue={editingClient?.location} className="col-span-3" />
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
              <CardTitle className="font-headline">Client List</CardTitle>
              <CardDescription>
                A list of all your clients and their total spending.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-y-auto">
               <div className="relative overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name & Phone</TableHead>
                        <TableHead>Province & Location</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientDataWithTotals.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {'CN-' + client.id.substring(0, 4).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="grid gap-1">
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="grid gap-1">
                                <p className="font-medium">{client.province}</p>
                                <p className="text-sm text-muted-foreground">{client.location}</p>
                              </div>
                          </TableCell>
                          <TableCell>{client.orders}</TableCell>
                          <TableCell className="text-right">${(client.totalSpent || 0).toFixed(2)}</TableCell>
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
                                <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
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
