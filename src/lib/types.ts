
export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  lowStock?: number;
  cost?: number;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  province: string;
  location: string;
  orders: number;
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  category: string;
  phone: string;
  location: string;
  orders: number;
  totalAmount: number;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
}

export type Sale = {
  id: string;
  displayId: string;
  clientName: string;
  productName: string; // This can be the name of the first product or a general description
  date: string;
  amount: number;
  quantity: number; // This can be the total quantity of items
  discount?: number; // This can be the total discount
  items: SaleItem[];
  transactionType: 'Sale';
  deliveryFee?: number;
  paymentMethod?: string;
};

export type PurchaseItem = {
  productId: string;
  itemName: string;
  quantity: number;
  cost: number;
};

export type Purchase = {
  id:string;
  displayId: string;
  vendorName: string;
  item: string; // Fallback for old data
  date: string;
  amount: number;
  quantity: number; // Fallback for old data
  items: PurchaseItem[];
  transactionType: 'Purchase';
};

export type Expense = {
  id: string;
  displayId: string;
  description: string;
  date: string;
  amount: number;
  vendorName?: string;
  transactionType: 'Expense';
};

export type Transaction = Sale | Purchase | Expense;

export type RecentActivity = {
  id: string;
  type: 'sale' | 'client' | 'product' | 'purchase' | 'expense';
  description: string;
  time: string;
  person: string;
};
    
export type TransactionFormData = {
  transactionType: 'Sale' | 'Purchase' | 'Expense' | '';
  transactionDate?: Date;
  // Sale
  selectedClient?: string;
  saleItems: SaleItem[];
  selectedProduct?: string;
  saleQuantity: number;
  saleDiscount: number;
  deliveryFee?: number;
  paymentMethod?: 'COD' | 'BANK' | 'WING' | '';
  // Purchase
  selectedVendor?: string;
  purchaseItems: PurchaseItem[];
  selectedProductForPurchase?: string;
  purchaseQuantity: number;
  purchaseCost: number;
  // Expense
  expenseDescription?: string;
  expenseAmount?: number;
  selectedExpenseVendor?: string;
};
