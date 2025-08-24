
'use client';

import React from 'react';
import type { Transaction, SaleItem, PurchaseItem, Sale, Purchase, Client, Vendor, Expense } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { X, FileDown } from 'lucide-react';
import { exportToPdf } from '@/lib/export';


interface ReceiptProps {
  transaction: Transaction | null;
  contact: Client | Vendor | null;
  onClose: () => void;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, contact, onClose }, ref) => {

  if (!transaction || transaction.transactionType === 'Expense') return null;
  
  const receiptId = `receipt-${transaction.id}`;

  const isSale = transaction.transactionType === 'Sale';
  const saleTransaction = transaction as Sale;
  const purchaseTransaction = transaction as Purchase;
  const items = (isSale ? saleTransaction.items : purchaseTransaction.items) || [];
  
  const grandTotal = transaction.amount;
  
  const clientContact = contact as Client;
  
  const itemsString = items.map((item: any) => {
    const itemName = isSale ? (item as SaleItem).productName : (item as PurchaseItem).itemName;
    return `${itemName} (${item.quantity})`;
  }).join(', ');

  const handleExport = () => {
    exportToPdf(receiptId, transaction.id);
  };

  return (
    <div className="bg-background text-foreground">
        <div id={receiptId} className="bg-white text-black" style={{ padding: '6px' }}>
            {/* Header */}
            <div className="flex items-center">
                <div className="w-1/5">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-11.5 -10.23174 23 20.46348"
                    className="w-auto h-12 text-black"
                    fill="currentColor"
                  >
                    <circle cx="0" cy="0" r="2.05" fill="currentColor"></circle>
                    <g stroke="currentColor" strokeWidth="1" fill="none">
                      <ellipse rx="11" ry="4.2"></ellipse>
                      <ellipse rx="11" ry="4.2" transform="rotate(60)"></ellipse>
                      <ellipse rx="11" ry="4.2" transform="rotate(120)"></ellipse>
                    </g>
                  </svg>
                </div>
                <div className="w-4/5 text-right">
                    <h2 className="font-bold text-xl">PICH Online Shop</h2>
                    <p className="text-sm">Phnom Penh, Ta Kmaov</p>
                    <p className="text-lg font-bold">096 308 93 28</p>
                </div>
            </div>

            {/* Body */}
            <div className="my-4">
                <div className="text-sm">
                    <div className="flex justify-between">
                        {contact && <p><span className="font-semibold">Name:</span> {contact.name}</p>}
                        <p><span className="font-semibold">Date:</span> {format(new Date(transaction.date), 'dd MMM, yyyy')}</p>
                    </div>
                    {contact?.phone && <p><span className="font-semibold">Phone:</span> <span className="font-bold text-lg">{contact.phone}</span></p>}
                    {(clientContact?.province || clientContact?.location) && 
                        <p>
                            <span className="font-semibold">Address:</span> {`${clientContact.province}, ${clientContact.location}`}
                        </p>
                    }
                </div>

                <div className="my-4">
                  <p className="text-sm">
                    <span className="font-semibold">Items: </span>
                    {itemsString}
                  </p>
                </div>

            </div>

            <div className="bg-black text-white font-bold p-2 flex items-center justify-center" style={{ fontSize: '20px' }}>
                <span>Grand Total: ${grandTotal.toFixed(2)}</span>
            </div>
        </div>
        <div className="p-4 flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
                <X className="mr-2 h-4 w-4"/>
                Close
            </Button>
            <Button size="sm" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
        </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

    
