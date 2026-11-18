import { ArrowUpRight, Check, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/format';
import { StatusBadge } from '../../components/StatusBadge';
import { SERVICE_PIPELINE, type AdminStats, type Booking } from '../../types';

interface AdminOverviewProps {
  stats: AdminStats | null;
  recentBookings: Booking[];
  loading: boolean;
  onDecision: (bookingId: string, decision: 'accept' | 'reject') => Promise<void>;
  onNavigate: (tab: string) => void;
}

export function AdminOverview({
  stats,
  recentBookings,
  loading,
  onDecision,
  onNavigate,
}: AdminOverviewProps) {
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-white border border-zinc-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-white border border-zinc-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Total Customers</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {stats?.totalCustomers ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            {stats?.totalBikes ?? 0} registered bikes
          </p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Total Bookings</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {stats?.totalBookings ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            {stats?.pendingBookings ?? 0} pending · {stats?.inProgressBookings ?? 0} active
          </p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-xl">
          <p className="text-xs font-medium text-zinc-500">Completed Services</p>
          <p className="font-mono text-3xl font-bold text-zinc-950 tabular-nums mt-2">
            {stats?.completedServices ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Service Completed & Delivered
          </p>
        </div>

        <div className="p-5 bg-zinc-950 text-white border border-zinc-950 rounded-xl">
          <p className="text-xs font-medium text-zinc-400">Collected Revenue</p>
          <p className="font-mono text-3xl font-bold text-white tabular-nums mt-2">
            {formatCurrency(stats?.totalRevenue ?? 0)}
          </p>
          <p className="text-xs text-zinc-400 mt-2 tabular-nums">
            {formatCurrency(stats?.outstandingRevenue ?? 0)} unpaid invoices
          </p>
        </div>
      </div>

      {/* Workshop Pipeline Breakdown */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            Workshop Pipeline Breakdown
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('bookings')}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950"
          >
            <span>Manage All Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SERVICE_PIPELINE.map((status) => (
            <div
              key={status}
              className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg"
            >
              <p className="text-xs text-zinc-500 truncate">{status}</p>
              <p className="font-mono text-xl font-bold text-zinc-950 tabular-nums mt-1">
                {stats?.statusCounts?.[status] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-950">
              Recent Service Bookings
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Latest appointments requiring review or bay updates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('bookings')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
          >
            View All
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No service bookings found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                  <th className="py-3 px-6">Booking</th>
                  <th className="py-3 px-4">Customer & Bike</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Mechanic</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50/70">
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-zinc-900 whitespace-nowrap">
                      {booking.bookingCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-zinc-950">
                        {booking.customer?.name || '—'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {booking.bike?.brand} {booking.bike?.model} ·{' '}
                        <span className="font-mono">
                          {booking.bike?.registrationNumber}
                        </span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-zinc-900">{booking.serviceType?.name}</p>
                      <p className="font-mono text-xs text-zinc-500 tabular-nums">
                        {formatCurrency(booking.serviceType?.price ?? 0)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-600 whitespace-nowrap tabular-nums">
                      <p>{formatDate(booking.preferredDate)}</p>
                      <p className="text-zinc-500">{booking.timeSlot}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-700 whitespace-nowrap">
                      {booking.mechanic?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      {booking.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDecision(booking.id, 'accept')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => onDecision(booking.id, 'reject')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-zinc-300 text-zinc-700 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate('bookings')}
                          className="text-xs font-medium text-zinc-700 hover:text-zinc-950 underline-offset-2 hover:underline"
                        >
                          Manage
                        </button>
                      )}
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
