export type UserRole = 'admin' | 'customer';

export type ServiceStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Bike Received'
  | 'Under Service'
  | 'Service Completed'
  | 'Delivered'
  | 'Rejected';

export const SERVICE_PIPELINE: ServiceStatus[] = [
  'Pending',
  'Confirmed',
  'Bike Received',
  'Under Service',
  'Service Completed',
  'Delivered',
];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Bike {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  registrationNumber: string;
  year?: number;
  engineCC?: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerWithBikes extends User {
  bikes: Bike[];
  bookingCount: number;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: ServiceStatus;
  note: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  bikeId: string;
  serviceTypeId: string;
  mechanicId: string | null;
  preferredDate: string;
  timeSlot: string;
  status: ServiceStatus;
  customerNotes?: string;
  adminNotes?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  customer?: User;
  bike?: Bike;
  serviceType?: ServiceType;
  mechanic?: Mechanic | null;
  invoiceId?: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  bikeId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Unpaid' | 'Paid';
  notes?: string;
  issuedAt: string;
  paidAt: string | null;
  customer?: User;
  bike?: Bike;
  booking?: Booking;
}

export interface AdminStats {
  totalCustomers: number;
  totalBikes: number;
  totalBookings: number;
  pendingBookings: number;
  inProgressBookings: number;
  completedServices: number;
  totalRevenue: number;
  outstandingRevenue: number;
  totalMechanics: number;
  activeServices: number;
  statusCounts: Record<string, number>;
  databaseMode: string;
}
