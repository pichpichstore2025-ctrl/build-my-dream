
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale, Purchase, Client, RecentActivity, Product, Expense } from "@/lib/types";
import DashboardClientPage from "./client-page";

async function getDashboardData() {
  const [salesSnap, purchasesSnap, clientsSnap, activitiesSnap, productsSnap, expensesSnap] = await Promise.all([
    getDocs(collection(db, "sales")),
    getDocs(collection(db, "purchases")),
    getDocs(collection(db, "clients")),
    getDocs(query(collection(db, "recentActivities"), orderBy("time", "desc"), limit(10))),
    getDocs(collection(db, "products")),
    getDocs(collection(db, "expenses")),
  ]);

  const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
  const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
  const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  const recentActivities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity));
  
  // The objects returned from firebase are not serializable, so we need to convert them
  return {
    sales: JSON.parse(JSON.stringify(sales)),
    purchases: JSON.parse(JSON.stringify(purchases)),
    clients: JSON.parse(JSON.stringify(clients)),
    products: JSON.parse(JSON.stringify(products)),
    expenses: JSON.parse(JSON.stringify(expenses)),
    recentActivities: JSON.parse(JSON.stringify(recentActivities)),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return <DashboardClientPage initialData={data} />;
}
