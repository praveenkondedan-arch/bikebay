import { FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/format';
import { PaymentStatusBadge } from '../../components/StatusBadge';
import type { Invoice } from '../../types';

interface CustomerInvoicesProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
}

export function CustomerInvoices({
  invoices,
  onViewInvoice,
}: CustomerInvoicesProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      {invoices.length === 0 ? (
        <div className="p-10 text-center text-sm text-zinc-500">
          No invoices have been issued yet. Once your service is billed by the workshop, invoices will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                <th className="py-3 px-6">Invoice No.</th>
                <th className="py-3 px-4">Motorcycle</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/70">
                  <td className="py-4 px-6 font-mono text-xs font-semibold text-zinc-950 whitespace-nowrap">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-zinc-950">
                      {inv.bike?.brand} {inv.bike?.model}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      {inv.bike?.registrationNumber}
                    </p>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-zinc-600">
                    {inv.booking?.bookingCode || '—'}
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                    {formatDate(inv.issuedAt)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-semibold text-zinc-950 tabular-nums whitespace-nowrap">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="py-4 px-4">
                    <PaymentStatusBadge status={inv.paymentStatus} />
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
