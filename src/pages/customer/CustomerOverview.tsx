import { ArrowRight, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/format';
import { ServiceProgressTracker } from '../../components/ServiceProgressTracker';
import { StatusBadge } from '../../components/StatusBadge';
import type { Bike, Booking, Invoice } from '../../types';

interface CustomerOverviewProps {
  bikes: Bike[];
  bookings: Booking[];
  invoices: Invoice[];
  onNavigate: (tab: string) => void;
}

export function CustomerOverview({
  bikes,
  bookings,
  invoices,
  onNavigate,
}: CustomerOverviewProps) {
  const activeBookings = bookings.filter(
    (b) => !['Delivered', 'Rejected'].includes(b.status)
  );
  const completedCount = bookings.filter((b) =>
    ['Service Completed', 'Delivered'].includes(b.status)
  ).length;
  const unpaidTotal = invoices
    .filter((i) => i.paymentStatus === 'Unpaid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const primaryActive = activeBookings[0] || null;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Registered Bikes</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {bikes.length}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('bikes')}
            className="text-xs font-medium text-zinc-700 hover:text-zinc-950 mt-2 inline-flex items-center gap-1"
          >
            Manage Garage →
          </button>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Active Services</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {activeBookings.length}
          </p>
          <p className="text-xs text-zinc-500 mt-2">Currently in pipeline</p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Completed Services</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {completedCount}
          </p>
          <p className="text-xs text-zinc-500 mt-2">Lifetime workshop visits</p>
        </div>

        <div className="p-5 bg-zinc-950 text-white border border-zinc-950 rounded-xl">
          <p className="text-xs font-medium text-zinc-400">Pending Bills</p>
          <p className="font-mono text-3xl font-bold text-white tabular-nums mt-2">
            {formatCurrency(unpaidTotal)}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('invoices')}
            className="text-xs font-medium text-zinc-300 hover:text-white mt-2 inline-flex items-center gap-1"
          >
            View Invoices →
          </button>
        </div>
      </div>

      {/* Live Service Tracker Spotlight */}
      {primaryActive ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold text-zinc-500">
                  {primaryActive.bookingCode}
                </span>
                <StatusBadge status={primaryActive.status} />
              </div>
              <h2 className="font-display text-lg font-bold text-zinc-950 mt-1.5">
                {primaryActive.bike?.brand} {primaryActive.bike?.model} ·{' '}
                {primaryActive.serviceType?.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                Scheduled {formatDate(primaryActive.preferredDate)} at{' '}
                {primaryActive.timeSlot}
                {primaryActive.mechanic
                  ? ` · Mechanic: ${primaryActive.mechanic.name}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 whitespace-nowrap self-start"
            >
              <span>Full Tracking Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <ServiceProgressTracker status={primaryActive.status} />
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-950">
              No active service appointments
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              {bikes.length === 0
                ? 'Add your first bike to start booking maintenance appointments.'
                : 'Ready for a tune-up? Book your next service slot in under a minute.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(bikes.length === 0 ? 'bikes' : 'book')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            {bikes.length === 0 ? 'Add Your Bike' : 'Book Service'}
          </button>
        </div>
      )}
    </div>
  );
}
