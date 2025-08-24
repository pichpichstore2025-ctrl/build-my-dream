
"use client";

import { PlusCircle, MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, YAxis, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";


const chartConfig = {
  cost: {
    label: "Stock Cost",
    color: "hsl(var(--chart-2))",
  },
  saleValue: {
    label: "Stock Sale Value",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig;


export default function ProductsPage() {
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);


  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .sort((a, b) => a.name.localeCompare(b.name));
      setProducts(productsData);
    } catch (error) {
       console.error("Error fetching products: ", error);
       toast({
        title: "Error",
        description: "Could not fetch products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const totalStockValue = products.reduce((sum, product) => sum + (product.stock * (product.cost || 0)), 0);
  const totalStockSaleValue = products.reduce((sum, product) => sum + (product.stock * product.price), 0);

  const stockChartData = [
    {
      name: "Stock Value",
      cost: totalStockValue,
      saleValue: totalStockSaleValue,
    },
  ];

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

  const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const cost = parseFloat(formData.get("cost") as string);
    const stock = parseInt(formData.get("stock") as string);
    const lowStock = parseInt(formData.get("lowStock") as string) || 0;

    try {
      const updatedProduct = {
        name,
        price,
        cost,
        stock,
        lowStock,
      };

      const productDocRef = doc(db, "products", editingProduct.id);
      await updateDoc(productDocRef, updatedProduct);
       toast({
        title: "Success",
        description: "Product updated successfully.",
      });
      fetchProducts(); 
      setEditOpen(false);
      setEditingProduct(null);
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!productId) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      fetchProducts(); 
    } catch (error) {
      console.error("Error deleting product: ", error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };
  
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Products"
        description="Manage your product catalog, pricing, and inventory."
      >
        <div className="flex items-center gap-2">
            <Button onClick={fetchProducts} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={(e) => handleAddProduct(e, () => {
                  fetchProducts();
                  setOpen(false);
                })}>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new product to your catalog.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" name="name" placeholder="e.g. Silk Tie" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cost" className="text-right">
                        Cost
                      </Label>
                      <Input id="cost" name="cost" type="number" step="0.01" placeholder="e.g. 25.00" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price
                      </Label>
                      <Input id="price" name="price" type="number" step="0.01" placeholder="e.g. 45.00" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right">
                        Stock
                      </Label>
                      <Input id="stock" name="stock" type="number" placeholder="e.g. 200" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="lowStock" className="text-right">
                        Low Stock
                      </Label>
                      <Input id="lowStock" name="lowStock" type="number" placeholder="e.g. 20" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Product</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </PageHeader>

      <div className="mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Inventory Value Analysis</CardTitle>
            <CardDescription>
              A comparison of your stock's cost vs. its potential sale value.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="h-60">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={stockChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Legend />
                  <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
                  <Bar dataKey="saleValue" fill="var(--color-saleValue)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-2))' }}/>
                  <div>
                      <p className="text-sm text-muted-foreground">Total Stock Cost</p>
                      <p className="text-2xl font-bold">${totalStockValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-1))' }}/>
                  <div>
                      <p className="text-sm text-muted-foreground">Total Stock Sale Value</p>
                      <p className="text-2xl font-bold">${totalStockSaleValue.toLocaleString()}</p>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditProduct}>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the details of your product below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input id="edit-name" name="name" defaultValue={editingProduct?.name} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cost" className="text-right">
                  Cost
                </Label>
                <Input id="edit-cost" name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">
                  Stock
                </Label>
                <Input id="edit-stock" name="stock" type="number" defaultValue={editingProduct?.stock} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-lowStock" className="text-right">
                    Low Stock
                  </Label>
                  <Input id="edit-lowStock" name="lowStock" type="number" defaultValue={editingProduct?.lowStock} className="col-span-3" />
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
            <CardTitle className="font-headline">Products List</CardTitle>
            <CardDescription>
              A list of all products in your inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-y-auto">
            <div className="relative overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {'PD-' + product.id.substring(0,3).toUpperCase().padStart(3, '0')}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <Badge variant={product.stock > (product.lowStock || 0) ? "default" : "destructive"}>
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${(product.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.price.toFixed(2)}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
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
