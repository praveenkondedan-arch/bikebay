import { useCallback, useEffect, useState } from 'react';
import {
  Bike as BikeIcon,
  CalendarPlus,
  ClipboardList,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout, type NavItem } from '../../components/DashboardLayout';
import { InvoiceModal } from '../../components/InvoiceModal';
import { CustomerOverview } from './CustomerOverview';
import { CustomerBikes } from './CustomerBikes';
import { CustomerBookService } from './CustomerBookService';
import { CustomerBookings } from './CustomerBookings';
import { CustomerInvoices } from './CustomerInvoices';
import type { Bike, Booking, Invoice, ServiceType } from '../../types';

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [preselectedBikeId, setPreselectedBikeId] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bikesRes, servicesRes, bookingsRes, invoicesRes] = await Promise.all([
        apiRequest<{ bikes: Bike[] }>('/api/bikes'),
        apiRequest<{ services: ServiceType[] }>('/api/services'),
        apiRequest<{ bookings: Booking[] }>('/api/bookings'),
        apiRequest<{ invoices: Invoice[] }>('/api/invoices'),
      ]);
      setBikes(bikesRes.bikes);
      setServices(servicesRes.services);
      setBookings(bookingsRes.bookings);
      setInvoices(invoicesRes.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookForBike = (bikeId: string) => {
    setPreselectedBikeId(bikeId);
    setActiveTab('book');
  };

  const handleCancelPending = async (bookingId: string) => {
    await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    await loadData();
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

  const activeServicesCount = bookings.filter(
    (b) => !['Delivered', 'Rejected'].includes(b.status)
  ).length;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bikes', label: 'My Bikes', icon: BikeIcon },
    { id: 'book', label: 'Book Service', icon: CalendarPlus },
    {
      id: 'tracking',
      label: 'Track & History',
      icon: ClipboardList,
      badge: activeServicesCount,
    },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Customer Dashboard',
      subtitle: 'Active service status, garage summary, and pending bills',
    },
    bikes: {
      title: 'My Garage',
      subtitle: 'Add and manage your registered motorcycles',
    },
    book: {
      title: 'Book Service Appointment',
      subtitle: 'Choose your bike, service package, and preferred arrival slot',
    },
    tracking: {
      title: 'Service Tracking & History',
      subtitle: 'Follow live 6-stage progress from check-in to delivery',
    },
    invoices: {
      title: 'Service Invoices',
      subtitle: 'View and print itemized workshop bills',
    },
  };

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
        activeTab !== 'book' ? (
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 whitespace-nowrap"
          >
            Book Service
          </button>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {loading && bookings.length === 0 && bikes.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 bg-white border border-zinc-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-52 bg-white border border-zinc-200 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <CustomerOverview
              bikes={bikes}
              bookings={bookings}
              invoices={invoices}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'bikes' && (
            <CustomerBikes
              bikes={bikes}
              onRefresh={loadData}
              onBookForBike={handleBookForBike}
            />
          )}

          {activeTab === 'book' && (
            <CustomerBookService
              bikes={bikes}
              services={services}
              preselectedBikeId={preselectedBikeId}
              onBookingCreated={async () => {
                setPreselectedBikeId(undefined);
                await loadData();
                setActiveTab('tracking');
              }}
              onGoToBikes={() => setActiveTab('bikes')}
            />
          )}

          {activeTab === 'tracking' && (
            <CustomerBookings
              bookings={bookings}
              onCancelPending={handleCancelPending}
              onViewInvoice={handleViewInvoiceById}
              onGoToBook={() => setActiveTab('book')}
            />
          )}

          {activeTab === 'invoices' && (
            <CustomerInvoices
              invoices={invoices}
              onViewInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}
        </>
      )}

      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        canManagePayment={false}
      />
    </DashboardLayout>
  );
}
