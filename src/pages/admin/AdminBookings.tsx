import { useState } from 'react';
import { Check, FileText, Receipt, Search, Trash2, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/format';
import { StatusBadge } from '../../components/StatusBadge';
import {
  SERVICE_PIPELINE,
  type Booking,
  type Mechanic,
  type ServiceStatus,
} from '../../types';

interface AdminBookingsProps {
  bookings: Booking[];
  mechanics: Mechanic[];
  onDecision: (bookingId: string, decision: 'accept' | 'reject') => Promise<void>;
  onAssignMechanic: (bookingId: string, mechanicId: string | null) => Promise<void>;
  onUpdateStatus: (bookingId: string, status: ServiceStatus, note?: string) => Promise<void>;
  onDeleteBooking: (bookingId: string) => Promise<void>;
  onOpenGenerateInvoice: (booking: Booking) => void;
  onViewInvoice: (invoiceId: string) => void;
}

const FILTER_TABS: Array<'All' | ServiceStatus> = [
  'All',
  ...SERVICE_PIPELINE,
  'Rejected',
];

export function AdminBookings({
  bookings,
  mechanics,
  onDecision,
  onAssignMechanic,
  onUpdateStatus,
  onDeleteBooking,
  onOpenGenerateInvoice,
  onViewInvoice,
}: AdminBookingsProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | ServiceStatus>('All');
  const [search, setSearch] = useState('');
  const [noteModalBooking, setNoteModalBooking] = useState<Booking | null>(null);
  const [nextStatus, setNextStatus] = useState<ServiceStatus>('Under Service');
  const [statusNote, setStatusNote] = useState('');

  const filtered = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.bookingCode.toLowerCase().includes(q) ||
      (b.customer?.name || '').toLowerCase().includes(q) ||
      (b.bike?.registrationNumber || '').toLowerCase().includes(q) ||
      (b.bike?.model || '').toLowerCase().includes(q) ||
      (b.serviceType?.name || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openStatusEditor = (booking: Booking) => {
    setNoteModalBooking(booking);
    setNextStatus(booking.status);
    setStatusNote(booking.adminNotes || '');
  };

  const submitStatusUpdate = async () => {
    if (!noteModalBooking) return;
    await onUpdateStatus(noteModalBooking.id, nextStatus, statusNote);
    setNoteModalBooking(null);
  };

  return (
    <div className="space-y-6">
      {/* Search + Status Filter Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking code, customer, bike reg no..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
            />
          </div>
          <p className="text-xs text-zinc-500 font-mono tabular-nums">
            Showing {filtered.length} of {bookings.length} bookings
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No bookings match your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                  <th className="py-3 px-5">Booking</th>
                  <th className="py-3 px-4">Customer & Bike</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Assigned Mechanic</th>
                  <th className="py-3 px-4">Service Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50/70 align-top">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-zinc-950">
                        {booking.bookingCode}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                        {formatDate(booking.preferredDate)}
                      </p>
                      <p className="text-xs text-zinc-400">{booking.timeSlot}</p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-medium text-zinc-950">
                        {booking.customer?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {booking.bike?.brand} {booking.bike?.model}
                      </p>
                      <p className="font-mono text-xs text-zinc-500 mt-0.5">
                        {booking.bike?.registrationNumber}
                      </p>
                      {booking.customerNotes && (
                        <p className="text-xs text-zinc-500 mt-1.5 max-w-xs italic">
                          "{booking.customerNotes}"
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-medium text-zinc-900">
                        {booking.serviceType?.name}
                      </p>
                      <p className="font-mono text-xs text-zinc-600 tabular-nums mt-0.5">
                        {formatCurrency(booking.serviceType?.price ?? 0)}
                      </p>
                    </td>

                    <td className="py-4 px-4 min-w-[180px]">
                      <select
                        value={booking.mechanicId || ''}
                        disabled={booking.status === 'Rejected'}
                        onChange={(e) =>
                          onAssignMechanic(
                            booking.id,
                            e.target.value ? e.target.value : null
                          )
                        }
                        aria-label={`Assign mechanic for ${booking.bookingCode}`}
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {mechanics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.specialty})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-4 px-4 min-w-[190px]">
                      <div className="space-y-2">
                        <StatusBadge status={booking.status} />
                        {booking.status !== 'Pending' &&
                          booking.status !== 'Rejected' && (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={booking.status}
                                onChange={(e) =>
                                  onUpdateStatus(
                                    booking.id,
                                    e.target.value as ServiceStatus
                                  )
                                }
                                aria-label={`Update status for ${booking.bookingCode}`}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                              >
                                {SERVICE_PIPELINE.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => openStatusEditor(booking)}
                                className="text-xs text-zinc-500 hover:text-zinc-950 underline"
                              >
                                Note
                              </button>
                            </div>
                          )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {booking.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onDecision(booking.id, 'accept')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => onDecision(booking.id, 'reject')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-zinc-300 text-zinc-700 rounded-md hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {booking.invoiceId ? (
                          <button
                            type="button"
                            onClick={() => onViewInvoice(booking.invoiceId!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-md hover:bg-zinc-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                        ) : (
                          booking.status !== 'Pending' &&
                          booking.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => onOpenGenerateInvoice(booking)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white text-zinc-900 border border-zinc-300 rounded-md hover:bg-zinc-100"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Bill
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteBooking(booking.id)}
                          aria-label="Delete booking"
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-zinc-100"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Status + Note Modal */}
      {noteModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-950">
                Update Service Status ({noteModalBooking.bookingCode})
              </h3>
              <button
                type="button"
                onClick={() => setNoteModalBooking(null)}
                className="p-1 text-zinc-500 hover:text-zinc-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Status Stage
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as ServiceStatus)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                {SERVICE_PIPELINE.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Workshop Note (visible to customer)
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g., Engine oil replaced, road testing completed."
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteModalBooking(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusUpdate}
                className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
