import React, { useState } from 'react';
import { Bike as BikeIcon, CalendarPlus, Edit2, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { Bike } from '../../types';

interface CustomerBikesProps {
  bikes: Bike[];
  onRefresh: () => Promise<void>;
  onBookForBike: (bikeId: string) => void;
}

export function CustomerBikes({
  bikes,
  onRefresh,
  onBookForBike,
}: CustomerBikesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [year, setYear] = useState('');
  const [engineCC, setEngineCC] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditingBike(null);
    setBrand('');
    setModel('');
    setRegistrationNumber('');
    setYear('');
    setEngineCC('');
    setNotes('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (b: Bike) => {
    setEditingBike(b);
    setBrand(b.brand);
    setModel(b.model);
    setRegistrationNumber(b.registrationNumber);
    setYear(b.year ? String(b.year) : '');
    setEngineCC(b.engineCC ? String(b.engineCC) : '');
    setNotes(b.notes || '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (brand.trim().length < 2 || model.trim().length < 1) {
      setError('Please enter valid brand and model names.');
      return;
    }
    if (registrationNumber.trim().length < 4) {
      setError('Please enter a valid registration number.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        brand: brand.trim(),
        model: model.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        year: year ? Number(year) : undefined,
        engineCC: engineCC ? Number(engineCC) : undefined,
        notes: notes.trim(),
      };
      if (editingBike) {
        await apiRequest(`/api/bikes/${editingBike.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/bikes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bike details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/bikes/${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-zinc-600">
          Add and manage your motorcycles for faster appointment booking.
        </p>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Bike
        </button>
      </div>

      {bikes.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto">
            <BikeIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-zinc-950">
              Your garage is empty
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Add your bike brand, model, and registration number to book a service.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800"
          >
            <Plus className="w-4 h-4" />
            Add First Bike
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bikes.map((bike) => (
            <div
              key={bike.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-zinc-950">
                      {bike.brand} {bike.model}
                    </h3>
                    <p className="font-mono text-xs font-semibold text-zinc-700 mt-1">
                      {bike.registrationNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(bike)}
                      aria-label={`Edit ${bike.model}`}
                      className="p-1.5 text-zinc-400 hover:text-zinc-950 rounded-md hover:bg-zinc-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bike.id)}
                      aria-label={`Delete ${bike.model}`}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-zinc-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-zinc-500 space-y-1 tabular-nums">
                  {(bike.year || bike.engineCC) && (
                    <p>
                      {bike.year ? `Year: ${bike.year}` : ''}
                      {bike.year && bike.engineCC ? ' · ' : ''}
                      {bike.engineCC ? `${bike.engineCC} cc` : ''}
                    </p>
                  )}
                  {bike.notes && <p className="text-zinc-600">{bike.notes}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBookForBike(bike.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-900 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Book Service for This Bike
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Bike Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-950">
                {editingBike ? 'Edit Bike Details' : 'Add Bike to Garage'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Yamaha"
                    required
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="MT-15 V2"
                    required
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) =>
                    setRegistrationNumber(e.target.value.toUpperCase())
                  }
                  placeholder="MH-02-FR-9014"
                  required
                  className="w-full px-3 py-2 text-sm font-mono uppercase border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Model Year (Optional)
                  </label>
                  <input
                    type="number"
                    min={1970}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Engine CC (Optional)
                  </label>
                  <input
                    type="number"
                    min={49}
                    max={3000}
                    value={engineCC}
                    onChange={(e) => setEngineCC(e.target.value)}
                    placeholder="155"
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Color or custom accessories"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Bike'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
