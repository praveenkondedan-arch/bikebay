import { Printer, X, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import { PaymentStatusBadge } from './StatusBadge';
import type { Invoice } from '../types';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  canManagePayment?: boolean;
  onTogglePayment?: (invoiceId: string, nextStatus: 'Paid' | 'Unpaid') => Promise<void>;
}

export function InvoiceModal({
  invoice,
  onClose,
  canManagePayment = false,
  onTogglePayment,
}: InvoiceModalProps) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden print-only-container my-auto">
        {/* Modal Actions Header (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50 no-print">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-zinc-900">
              {invoice.invoiceNumber}
            </span>
            <PaymentStatusBadge status={invoice.paymentStatus} />
          </div>
          <div className="flex items-center gap-2">
            {canManagePayment && onTogglePayment && (
              <button
                type="button"
                onClick={() =>
                  onTogglePayment(
                    invoice.id,
                    invoice.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {invoice.paymentStatus === 'Paid' ? 'Mark Unpaid' : 'Mark as Paid'}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-200">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-zinc-950">
                MotoBay Service Center
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Precision Motorcycle Maintenance & Diagnostics
              </p>
              <p className="text-xs text-zinc-500">
                Plot 42, Industrial Estate, Bengaluru · +91 80 4120 9900
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Tax Invoice</p>
              <p className="font-mono text-base font-semibold text-zinc-950 mt-0.5">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                Issued: {formatDate(invoice.issuedAt)}
              </p>
              {invoice.paidAt && (
                <p className="text-xs text-emerald-700 mt-0.5 tabular-nums">
                  Paid: {formatDate(invoice.paidAt)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Billed To</p>
              <p className="font-semibold text-zinc-950">
                {invoice.customer?.name || 'Customer'}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{invoice.customer?.email}</p>
              <p className="text-xs text-zinc-600">{invoice.customer?.phone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Vehicle & Booking</p>
              <p className="font-semibold text-zinc-950">
                {invoice.bike
                  ? `${invoice.bike.brand} ${invoice.bike.model}`
                  : 'Motorcycle'}
              </p>
              <p className="font-mono text-xs text-zinc-700 mt-0.5">
                {invoice.bike?.registrationNumber || '—'}
              </p>
              {invoice.booking && (
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                  Ref: {invoice.booking.bookingCode}
                </p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-zinc-900">
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="flex-1">
              {invoice.notes && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 mb-1">Workshop Notes</p>
                  <p className="text-xs text-zinc-700">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>GST ({invoice.taxRate}%)</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 text-base font-bold text-zinc-950">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
