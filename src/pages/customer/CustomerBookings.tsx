import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';
import { ServiceProgressTracker } from '../../components/ServiceProgressTracker';
import { StatusBadge } from '../../components/StatusBadge';
import type { Booking } from '../../types';

interface CustomerBookingsProps {
  bookings: Booking[];
  onCancelPending: (bookingId: string) => Promise<void>;
  onViewInvoice: (invoiceId: string) => void;
  onGoToBook: () => void;
}

export function CustomerBookings({
  bookings,
  onCancelPending,
  onViewInvoice,
  onGoToBook,
}: CustomerBookingsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    bookings[0]?.id || null
  );
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = bookings.filter((b) => {
    if (filter === 'active') {
      return !['Delivered', 'Rejected'].includes(b.status);
    }
    if (filter === 'completed') {
      return ['Service Completed', 'Delivered'].includes(b.status);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-zinc-200/70 rounded-lg self-start">
          {(
            [
              { id: 'all', label: 'All Bookings' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onGoToBook}
          className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap self-start sm:self-auto"
        >
          New Appointment
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-zinc-600">
            No service bookings found in this view.
          </p>
          <button
            type="button"
            onClick={onGoToBook}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800"
          >
            Book a Service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const isExpanded = expandedId === booking.id;
            return (
              <div
                key={booking.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-zinc-500">
                        {booking.bookingCode}
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>
                    <h3 className="font-display text-base font-bold text-zinc-950">
                      {booking.bike?.brand} {booking.bike?.model} ·{' '}
                      {booking.serviceType?.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 tabular-nums">
                      <span className="font-mono">
                        {booking.bike?.registrationNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {formatDate(booking.preferredDate)} at {booking.timeSlot}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-medium text-zinc-800">
                        {formatCurrency(booking.serviceType?.price ?? 0)}
                      </span>
                      {booking.mechanic && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Mechanic: {booking.mechanic.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {booking.invoiceId && (
                      <button
                        type="button"
                        onClick={() => onViewInvoice(booking.invoiceId!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Invoice
                      </button>
                    )}

                    {booking.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => onCancelPending(booking.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : booking.id)
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
                    >
                      <span>{isExpanded ? 'Hide Tracker' : 'Track Status'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-4 border-t border-zinc-100 bg-zinc-50/70 space-y-5">
                    <ServiceProgressTracker status={booking.status} />

                    {booking.statusHistory && booking.statusHistory.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-700 mb-2">
                          Service Activity Log
                        </p>
                        <div className="space-y-2">
                          {[...booking.statusHistory]
                            .reverse()
                            .map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-2 border-b border-zinc-200/70 last:border-0"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900">
                                    {entry.status}
                                  </span>
                                  <span className="text-zinc-500">—</span>
                                  <span className="text-zinc-700">
                                    {entry.note}
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-zinc-500 tabular-nums shrink-0">
                                  {formatDateTime(entry.updatedAt)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
