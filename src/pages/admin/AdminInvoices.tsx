import { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/format';
import { PaymentStatusBadge } from '../../components/StatusBadge';
import type { Booking, Invoice } from '../../types';

interface AdminInvoicesProps {
  invoices: Invoice[];
  unbilledBookings: Booking[];
  onViewInvoice: (invoice: Invoice) => void;
  onTogglePayment: (invoiceId: string, nextStatus: 'Paid' | 'Unpaid') => Promise<void>;
  onOpenGenerateInvoice: (booking: Booking) => void;
}

export function AdminInvoices({
  invoices,
  unbilledBookings,
  onViewInvoice,
  onTogglePayment,
  onOpenGenerateInvoice,
}: AdminInvoicesProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  const filtered = invoices.filter((inv) => {
    const matchesStatus = filter === 'All' || inv.paymentStatus === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customer?.name || '').toLowerCase().includes(q) ||
      (inv.bike?.registrationNumber || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Unbilled Bookings Callout */}
      {unbilledBookings.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-zinc-950 mb-3">
            Bookings Ready for Billing ({unbilledBookings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unbilledBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-zinc-950">
                    {b.bookingCode}
                  </p>
                  <p className="text-xs text-zinc-700 truncate mt-0.5">
                    {b.customer?.name} · {b.bike?.brand} {b.bike?.model}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {b.serviceType?.name} ({b.status})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenGenerateInvoice(b)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-zinc-950 rounded-md hover:bg-zinc-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Bill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer, bike reg..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
          />
        </div>

        <div className="inline-flex p-1 bg-zinc-200/70 rounded-lg self-start">
          {(['All', 'Paid', 'Unpaid'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                  <th className="py-3 px-6">Invoice No.</th>
                  <th className="py-3 px-4">Customer & Bike</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/70">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-zinc-950 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-zinc-950">
                        {inv.customer?.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {inv.bike?.brand} {inv.bike?.model} ·{' '}
                        <span className="font-mono">
                          {inv.bike?.registrationNumber}
                        </span>
                      </p>
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
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onTogglePayment(
                              inv.id,
                              inv.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'
                            )
                          }
                          className="px-2.5 py-1.5 text-xs font-medium border border-zinc-300 bg-white text-zinc-800 rounded-md hover:bg-zinc-50"
                        >
                          {inv.paymentStatus === 'Paid'
                            ? 'Mark Unpaid'
                            : 'Mark Paid'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
