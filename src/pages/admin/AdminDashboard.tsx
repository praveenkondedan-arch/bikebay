import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Users,
  Wrench,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout, type NavItem } from '../../components/DashboardLayout';
import { InvoiceModal } from '../../components/InvoiceModal';
import { GenerateInvoiceModal } from '../../components/GenerateInvoiceModal';
import { AdminOverview } from './AdminOverview';
import { AdminBookings } from './AdminBookings';
import { AdminCustomers } from './AdminCustomers';
import { AdminServices } from './AdminServices';
import { AdminInvoices } from './AdminInvoices';
import type {
  AdminStats,
  Booking,
  CustomerWithBikes,
  Invoice,
  Mechanic,
  ServiceStatus,
  ServiceType,
} from '../../types';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerWithBikes[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [billingBooking, setBillingBooking] = useState<Booking | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, bookingsRes, customersRes, servicesRes, mechanicsRes, invoicesRes] =
        await Promise.all([
          apiRequest<{ stats: AdminStats; recentBookings: Booking[] }>(
            '/api/admin/stats'
          ),
          apiRequest<{ bookings: Booking[] }>('/api/bookings'),
          apiRequest<{ customers: CustomerWithBikes[] }>('/api/admin/customers'),
          apiRequest<{ services: ServiceType[] }>('/api/services?all=true'),
          apiRequest<{ mechanics: Mechanic[] }>('/api/mechanics'),
          apiRequest<{ invoices: Invoice[] }>('/api/invoices'),
        ]);

      setStats(statsRes.stats);
      setRecentBookings(statsRes.recentBookings);
      setBookings(bookingsRes.bookings);
      setCustomers(customersRes.customers);
      setServices(servicesRes.services);
      setMechanics(mechanicsRes.mechanics);
      setInvoices(invoicesRes.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleDecision = async (
    bookingId: string,
    decision: 'accept' | 'reject'
  ) => {
    await apiRequest(`/api/bookings/${bookingId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision }),
    });
    await loadAllData();
  };

  const handleAssignMechanic = async (
    bookingId: string,
    mechanicId: string | null
  ) => {
    await apiRequest(`/api/bookings/${bookingId}/assign-mechanic`, {
      method: 'PATCH',
      body: JSON.stringify({ mechanicId }),
    });
    await loadAllData();
  };

  const handleUpdateStatus = async (
    bookingId: string,
    status: ServiceStatus,
    note?: string
  ) => {
    await apiRequest(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    await loadAllData();
  };

  const handleDeleteBooking = async (bookingId: string) => {
    await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    await loadAllData();
  };

  const handleTogglePayment = async (
    invoiceId: string,
    paymentStatus: 'Paid' | 'Unpaid'
  ) => {
    await apiRequest(`/api/invoices/${invoiceId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    });
    await loadAllData();
    if (selectedInvoice?.id === invoiceId) {
      const updated = await apiRequest<{ invoice: Invoice }>(
        `/api/invoices/${invoiceId}`
      );
      setSelectedInvoice(updated.invoice);
    }
  };

  const handleViewInvoiceById = async (invoiceId: string) => {
    const local = invoices.find((i) => i.id === invoiceId);
    if (local) {
      setSelectedInvoice(local);
      return;
    }
    const res = await apiRequest<{ invoice: Invoice }>(
      `/api/invoices/${invoiceId}`
    );
    setSelectedInvoice(res.invoice);
  };

  if (!user) return null;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'bookings',
      label: 'Service Bookings',
      icon: CalendarCheck,
      badge: stats?.pendingBookings || 0,
    },
    { id: 'customers', label: 'Customers & Bikes', icon: Users },
    { id: 'services', label: 'Services & Mechanics', icon: Wrench },
    { id: 'invoices', label: 'Bills & Invoices', icon: FileText },
  ];

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Workshop Overview',
      subtitle: 'Live operations, booking queue, and revenue summary',
    },
    bookings: {
      title: 'Service Bookings',
      subtitle: 'Accept appointments, assign mechanics, and update service stages',
    },
    customers: {
      title: 'Customers & Bikes',
      subtitle: 'Manage customer profiles and registered motorcycles',
    },
    services: {
      title: 'Services & Mechanics',
      subtitle: 'Configure service packages, pricing, and workshop technicians',
    },
    invoices: {
      title: 'Bills & Invoices',
      subtitle: 'Generate itemized customer bills and track payment status',
    },
  };

  const unbilledBookings = bookings.filter(
    (b) => !b.invoiceId && !['Pending', 'Rejected'].includes(b.status)
  );

  return (
    <DashboardLayout
      user={user}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={logout}
      title={titles[activeTab].title}
      subtitle={titles[activeTab].subtitle}
      headerAction={
        <button
          type="button"
          onClick={loadAllData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {activeTab === 'overview' && (
        <AdminOverview
          stats={stats}
          recentBookings={recentBookings}
          loading={loading}
          onDecision={handleDecision}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'bookings' && (
        <AdminBookings
          bookings={bookings}
          mechanics={mechanics}
          onDecision={handleDecision}
          onAssignMechanic={handleAssignMechanic}
          onUpdateStatus={handleUpdateStatus}
          onDeleteBooking={handleDeleteBooking}
          onOpenGenerateInvoice={(b) => setBillingBooking(b)}
          onViewInvoice={handleViewInvoiceById}
        />
      )}

      {activeTab === 'customers' && (
        <AdminCustomers customers={customers} onRefresh={loadAllData} />
      )}

      {activeTab === 'services' && (
        <AdminServices
          services={services}
          mechanics={mechanics}
          onRefresh={loadAllData}
        />
      )}

      {activeTab === 'invoices' && (
        <AdminInvoices
          invoices={invoices}
          unbilledBookings={unbilledBookings}
          onViewInvoice={(inv) => setSelectedInvoice(inv)}
          onTogglePayment={handleTogglePayment}
          onOpenGenerateInvoice={(b) => setBillingBooking(b)}
        />
      )}

      <GenerateInvoiceModal
        key={billingBooking?.id || 'closed'}
        booking={billingBooking}
        onClose={() => setBillingBooking(null)}
        onCreated={async (invoice) => {
          setBillingBooking(null);
          await loadAllData();
          setSelectedInvoice(invoice);
        }}
      />

      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        canManagePayment={true}
        onTogglePayment={handleTogglePayment}
      />
    </DashboardLayout>
  );
}
