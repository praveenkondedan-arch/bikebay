import React, { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { Bike, ServiceType } from '../../types';

interface CustomerBookServiceProps {
  bikes: Bike[];
  services: ServiceType[];
  preselectedBikeId?: string;
  onBookingCreated: () => Promise<void>;
  onGoToBikes: () => void;
}

const TIME_SLOTS = [
  '09:30 AM',
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
];

export function CustomerBookService({
  bikes,
  services,
  preselectedBikeId,
  onBookingCreated,
  onGoToBikes,
}: CustomerBookServiceProps) {
  const [bikeId, setBikeId] = useState(preselectedBikeId || bikes[0]?.id || '');
  const [serviceTypeId, setServiceTypeId] = useState(services[0]?.id || '');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedBikeId) {
      setBikeId(preselectedBikeId);
    } else if (!bikeId && bikes.length > 0) {
      setBikeId(bikes[0].id);
    }
  }, [preselectedBikeId, bikes, bikeId]);

  useEffect(() => {
    if (!serviceTypeId && services.length > 0) {
      setServiceTypeId(services[0].id);
    }
  }, [services, serviceTypeId]);

  const selectedService = services.find((s) => s.id === serviceTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!bikeId) {
      setError('Please select a bike.');
      return;
    }
    if (!serviceTypeId) {
      setError('Please select a service package.');
      return;
    }
    if (!preferredDate) {
      setError('Please choose a preferred appointment date.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          bikeId,
          serviceTypeId,
          preferredDate,
          timeSlot,
          customerNotes,
        }),
      });
      await onBookingCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book service.');
    } finally {
      setSubmitting(false);
    }
  };

  if (bikes.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4 max-w-xl mx-auto">
        <h3 className="font-display text-lg font-semibold text-zinc-950">
          Add a bike before booking
        </h3>
        <p className="text-sm text-zinc-600">
          You need at least one registered motorcycle in your garage to schedule a service appointment.
        </p>
        <button
          type="button"
          onClick={onGoToBikes}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" />
          Go to My Garage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        {error && (
          <div className="p-3.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Select Bike */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            1. Select Motorcycle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bikes.map((b) => {
              const selected = b.id === bikeId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBikeId(b.id)}
                  className={`p-4 text-left rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div>
                    <p className="font-display text-sm font-semibold">
                      {b.brand} {b.model}
                    </p>
                    <p
                      className={`font-mono text-xs mt-1 ${
                        selected ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {b.registrationNumber}
                    </p>
                  </div>
                  {selected && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Service Type */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            2. Select Service Package
          </h2>
          <div className="space-y-2.5">
            {services.map((s) => {
              const selected = s.id === serviceTypeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceTypeId(s.id)}
                  className={`w-full p-4 text-left rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    selected
                      ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div>
                    <p className="font-display text-sm font-semibold text-zinc-950">
                      {s.name}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">{s.description}</p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-1.5 tabular-nums">
                      Est. duration: {s.estimatedHours} hrs
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                      {formatCurrency(s.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Schedule & Notes */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-zinc-950">
            3. Preferred Date, Time & Notes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Arrival Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Reported Issues or Special Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g., Front brake squeaking at low speeds, check chain slack."
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
            />
          </div>
        </div>
      </div>

      {/* Booking Summary Sidebar */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
          <h3 className="font-display text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
            Appointment Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Bike</p>
              <p className="font-medium text-zinc-950">
                {bikes.find((b) => b.id === bikeId)?.brand}{' '}
                {bikes.find((b) => b.id === bikeId)?.model}
              </p>
              <p className="font-mono text-xs text-zinc-500">
                {bikes.find((b) => b.id === bikeId)?.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Selected Service</p>
              <p className="font-medium text-zinc-950">
                {selectedService?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Schedule</p>
              <p className="font-mono text-xs text-zinc-900 tabular-nums">
                {preferredDate} · {timeSlot}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600">
              Estimated Base Cost
            </span>
            <span className="font-mono text-xl font-bold text-zinc-950 tabular-nums">
              {formatCurrency(selectedService?.price ?? 0)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting Booking...' : 'Confirm Service Booking'}
          </button>
        </div>
      </div>
    </form>
  );
}
