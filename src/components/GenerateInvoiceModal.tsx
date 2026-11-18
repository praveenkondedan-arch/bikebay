import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/format';
import type { Booking, Invoice } from '../types';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface GenerateInvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
}

export function GenerateInvoiceModal({
  booking,
  onClose,
  onCreated,
}: GenerateInvoiceModalProps) {
  const [items, setItems] = useState<LineItem[]>(() =>
    booking
      ? [
          {
            description: `${booking.serviceType?.name || 'Bike Service'} (Base Service)`,
            quantity: 1,
            unitPrice: booking.serviceType?.price || 0,
          },
        ]
      : []
  );
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = Math.round((taxable * taxRate) / 100);
  const totalAmount = Math.max(0, taxable + taxAmount);

  const addLineItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.some((i) => !i.description.trim())) {
      setError('Every line item requires a description.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ invoice: Invoice }>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id,
          items,
          taxRate: Number(taxRate),
          discount: Number(discount),
          paymentStatus,
          notes,
        }),
      });
      onCreated(res.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h3 className="font-display text-base font-semibold text-zinc-950">
              Generate Customer Invoice
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {booking.bookingCode} · {booking.customer?.name} ·{' '}
              {booking.bike?.brand} {booking.bike?.model}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">
                Billable Services & Spare Parts
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:text-zinc-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Spare / Charge
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, 'description', e.target.value)
                    }
                    placeholder="Service or part description"
                    className="col-span-6 px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))
                    }
                    placeholder="Qty"
                    className="col-span-2 px-3 py-2 text-sm font-mono tabular-nums border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, 'unitPrice', Math.max(0, Number(e.target.value)))
                    }
                    placeholder="Price"
                    className="col-span-3 px-3 py-2 text-sm font-mono tabular-nums border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    disabled={items.length <= 1}
                    className="col-span-1 p-2 text-zinc-400 hover:text-red-600 disabled:opacity-30 flex justify-center"
                    aria-label="Remove line item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Discount (INR)
              </label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as 'Unpaid' | 'Paid')
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Invoice Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Warranty valid for 1,000 km or 30 days"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="space-y-0.5 text-xs text-zinc-600">
              <p>
                Subtotal:{' '}
                <span className="font-mono font-medium text-zinc-900">
                  {formatCurrency(subtotal)}
                </span>
              </p>
              <p>
                GST ({taxRate}%):{' '}
                <span className="font-mono font-medium text-zinc-900">
                  {formatCurrency(taxAmount)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Final Payable Total</p>
              <p className="font-mono text-xl font-bold text-zinc-950 tabular-nums">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
