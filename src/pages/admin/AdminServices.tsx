import React, { useState } from 'react';
import { Edit2, Plus, Trash2, UserCheck, Wrench, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { Mechanic, ServiceType } from '../../types';

interface AdminServicesProps {
  services: ServiceType[];
  mechanics: Mechanic[];
  onRefresh: () => Promise<void>;
}

export function AdminServices({
  services,
  mechanics,
  onRefresh,
}: AdminServicesProps) {
  const [section, setSection] = useState<'services' | 'mechanics'>('services');

  // Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sHours, setSHours] = useState('2');
  const [sActive, setSActive] = useState(true);

  // Mechanic Modal State
  const [mechModalOpen, setMechModalOpen] = useState(false);
  const [editingMech, setEditingMech] = useState<Mechanic | null>(null);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mSpecialty, setMSpecialty] = useState('');
  const [mAvailable, setMAvailable] = useState(true);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openAddService = () => {
    setEditingService(null);
    setSName('');
    setSDesc('');
    setSPrice('');
    setSHours('2');
    setSActive(true);
    setError('');
    setServiceModalOpen(true);
  };

  const openEditService = (s: ServiceType) => {
    setEditingService(s);
    setSName(s.name);
    setSDesc(s.description);
    setSPrice(String(s.price));
    setSHours(String(s.estimatedHours));
    setSActive(s.isActive);
    setError('');
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: sName,
        description: sDesc,
        price: Number(sPrice),
        estimatedHours: Number(sHours),
        isActive: sActive,
      };
      if (editingService) {
        await apiRequest(`/api/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setServiceModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    await apiRequest(`/api/services/${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  const openAddMechanic = () => {
    setEditingMech(null);
    setMName('');
    setMPhone('');
    setMSpecialty('');
    setMAvailable(true);
    setError('');
    setMechModalOpen(true);
  };

  const openEditMechanic = (m: Mechanic) => {
    setEditingMech(m);
    setMName(m.name);
    setMPhone(m.phone);
    setMSpecialty(m.specialty);
    setMAvailable(m.isAvailable);
    setError('');
    setMechModalOpen(true);
  };

  const handleSaveMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: mName,
        phone: mPhone,
        specialty: mSpecialty,
        isAvailable: mAvailable,
      };
      if (editingMech) {
        await apiRequest(`/api/mechanics/${editingMech.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/mechanics', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setMechModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mechanic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMechanic = async (id: string) => {
    await apiRequest(`/api/mechanics/${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-zinc-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSection('services')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              section === 'services'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Service Types ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('mechanics')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              section === 'mechanics'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Workshop Mechanics ({mechanics.length})
          </button>
        </div>

        {section === 'services' ? (
          <button
            type="button"
            onClick={openAddService}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Service Type
          </button>
        ) : (
          <button
            type="button"
            onClick={openAddMechanic}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Mechanic
          </button>
        )}
      </div>

      {section === 'services' ? (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                  <th className="py-3 px-6">Service Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70">
                    <td className="py-4 px-6 font-semibold text-zinc-950 whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="py-4 px-4 text-xs text-zinc-600 max-w-md">
                      {s.description}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {s.estimatedHours} hrs
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-zinc-950 tabular-nums whitespace-nowrap">
                      {formatCurrency(s.price)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded border ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditService(s)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-950 rounded-md hover:bg-zinc-100"
                          aria-label={`Edit ${s.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-zinc-100"
                          aria-label={`Delete ${s.name}`}
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanics.map((m) => (
            <div
              key={m.id}
              className="p-5 bg-white border border-zinc-200 rounded-xl flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-zinc-950">
                      {m.name}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-0.5">{m.specialty}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                      m.isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {m.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-500 mt-3">{m.phone}</p>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditMechanic(m)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMechanic(m.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Type Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-950">
                {editingService ? 'Edit Service Package' : 'Add Service Package'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
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
            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sPrice}
                    onChange={(e) => setSPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={sHours}
                    onChange={(e) => setSHours(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={sActive}
                  onChange={(e) => setSActive(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Available for customer booking
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mechanic Modal */}
      {mechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-950">
                {editingMech ? 'Edit Mechanic' : 'Add Workshop Mechanic'}
              </h3>
              <button
                type="button"
                onClick={() => setMechModalOpen(false)}
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
            <form onSubmit={handleSaveMechanic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Mechanic Name
                </label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={mSpecialty}
                  onChange={(e) => setMSpecialty(e.target.value)}
                  placeholder="Engine & Transmission"
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={mAvailable}
                  onChange={(e) => setMAvailable(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Currently available for bay assignment
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMechModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Mechanic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
