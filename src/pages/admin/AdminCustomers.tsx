import React, { useState } from 'react';
import { Bike as BikeIcon, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Bike, CustomerWithBikes } from '../../types';

interface AdminCustomersProps {
  customers: CustomerWithBikes[];
  onRefresh: () => Promise<void>;
}

export function AdminCustomers({ customers, onRefresh }: AdminCustomersProps) {
  const [search, setSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithBikes | null>(null);
  const [bikeModalCustomer, setBikeModalCustomer] = useState<CustomerWithBikes | null>(null);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  // Customer form state
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPassword, setCPassword] = useState('');

  // Bike form state
  const [bBrand, setBBrand] = useState('');
  const [bModel, setBModel] = useState('');
  const [bReg, setBReg] = useState('');
  const [bYear, setBYear] = useState('');
  const [bCC, setBCC] = useState('');
  const [bNotes, setBNotes] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.bikes.some(
        (b) =>
          b.registrationNumber.toLowerCase().includes(q) ||
          b.brand.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q)
      )
    );
  });

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCName('');
    setCEmail('');
    setCPhone('');
    setCPassword('');
    setError('');
    setShowAddCustomer(true);
  };

  const openEditCustomer = (c: CustomerWithBikes) => {
    setEditingCustomer(c);
    setCName(c.name);
    setCEmail(c.email);
    setCPhone(c.phone);
    setCPassword('');
    setError('');
    setShowAddCustomer(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await apiRequest(`/api/admin/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: cName, email: cEmail, phone: cPhone }),
        });
      } else {
        await apiRequest('/api/admin/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: cName,
            email: cEmail,
            phone: cPhone,
            password: cPassword,
          }),
        });
      }
      setShowAddCustomer(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    await apiRequest(`/api/admin/customers/${id}`, { method: 'DELETE' });
    await onRefresh();
  };

  const openAddBike = (customer: CustomerWithBikes) => {
    setBikeModalCustomer(customer);
    setEditingBike(null);
    setBBrand('');
    setBModel('');
    setBReg('');
    setBYear('');
    setBCC('');
    setBNotes('');
    setError('');
  };

  const openEditBike = (customer: CustomerWithBikes, bike: Bike) => {
    setBikeModalCustomer(customer);
    setEditingBike(bike);
    setBBrand(bike.brand);
    setBModel(bike.model);
    setBReg(bike.registrationNumber);
    setBYear(bike.year ? String(bike.year) : '');
    setBCC(bike.engineCC ? String(bike.engineCC) : '');
    setBNotes(bike.notes || '');
    setError('');
  };

  const handleSaveBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeModalCustomer) return;
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        customerId: bikeModalCustomer.id,
        brand: bBrand,
        model: bModel,
        registrationNumber: bReg,
        year: bYear ? Number(bYear) : undefined,
        engineCC: bCC ? Number(bCC) : undefined,
        notes: bNotes,
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
      setBikeModalCustomer(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bike.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    await apiRequest(`/api/bikes/${bikeId}`, { method: 'DELETE' });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, email, or bike registration..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
          />
        </div>
        <button
          type="button"
          onClick={openAddCustomer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-sm text-zinc-500">
          No customers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="font-display text-base font-semibold text-zinc-950">
                    {customer.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
                    <span>{customer.email}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{customer.phone}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {customer.bookingCount} bookings
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Joined {formatDate(customer.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAddBike(customer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-900 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Bike
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCustomer(customer)}
                    aria-label={`Edit ${customer.name}`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-950 rounded-lg hover:bg-zinc-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(customer.id)}
                    aria-label={`Delete ${customer.name}`}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {customer.bikes.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No motorcycles registered for this customer yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customer.bikes.map((bike) => (
                    <div
                      key={bike.id}
                      className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <BikeIcon className="w-4 h-4 text-zinc-700 shrink-0" />
                          <p className="text-sm font-semibold text-zinc-950 truncate">
                            {bike.brand} {bike.model}
                          </p>
                        </div>
                        <p className="font-mono text-xs text-zinc-700 mt-1">
                          {bike.registrationNumber}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                          {bike.year ? `${bike.year}` : ''}
                          {bike.year && bike.engineCC ? ' · ' : ''}
                          {bike.engineCC ? `${bike.engineCC} cc` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditBike(customer, bike)}
                          className="p-1 text-zinc-400 hover:text-zinc-950"
                          aria-label="Edit bike"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBike(bike.id)}
                          className="p-1 text-zinc-400 hover:text-red-600"
                          aria-label="Delete bike"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-950">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
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

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    value={cPassword}
                    onChange={(e) => setCPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bike Modal */}
      {bikeModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-zinc-950">
                  {editingBike ? 'Edit Bike Details' : 'Add Motorcycle'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Owner: {bikeModalCustomer.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBikeModalCustomer(null)}
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

            <form onSubmit={handleSaveBike} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={bBrand}
                    onChange={(e) => setBBrand(e.target.value)}
                    placeholder="Royal Enfield"
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
                    value={bModel}
                    onChange={(e) => setBModel(e.target.value)}
                    placeholder="Classic 350"
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
                  value={bReg}
                  onChange={(e) => setBReg(e.target.value.toUpperCase())}
                  placeholder="KA-01-MJ-4821"
                  required
                  className="w-full px-3 py-2 text-sm font-mono uppercase border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Year (Optional)
                  </label>
                  <input
                    type="number"
                    value={bYear}
                    onChange={(e) => setBYear(e.target.value)}
                    placeholder="2023"
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Engine CC (Optional)
                  </label>
                  <input
                    type="number"
                    value={bCC}
                    onChange={(e) => setBCC(e.target.value)}
                    placeholder="349"
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={bNotes}
                  onChange={(e) => setBNotes(e.target.value)}
                  placeholder="Color, custom exhaust, etc."
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBikeModalCustomer(null)}
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
