import mongoose, { Schema } from 'mongoose';

export type UserRole = 'admin' | 'customer';

export type ServiceStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Bike Received'
  | 'Under Service'
  | 'Service Completed'
  | 'Delivered'
  | 'Rejected';

export interface IUser {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface IBike {
  customerId: mongoose.Types.ObjectId;
  brand: string;
  model: string;
  registrationNumber: string;
  year?: number;
  engineCC?: number;
  notes?: string;
  createdAt: Date;
}

export interface IServiceType {
  name: string;
  description: string;
  price: number;
  estimatedHours: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IMechanic {
  name: string;
  phone: string;
  specialty: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface IBookingStatusHistory {
  status: ServiceStatus;
  note: string;
  updatedAt: Date;
}

export interface IBooking {
  bookingCode: string;
  customerId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  serviceTypeId: mongoose.Types.ObjectId;
  mechanicId?: mongoose.Types.ObjectId | null;
  preferredDate: string;
  timeSlot: string;
  status: ServiceStatus;
  customerNotes?: string;
  adminNotes?: string;
  statusHistory: IBookingStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice {
  invoiceNumber: string;
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  bikeId: mongoose.Types.ObjectId;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Unpaid' | 'Paid';
  notes?: string;
  issuedAt: Date;
  paidAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const BikeSchema = new Schema<IBike>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, uppercase: true, trim: true },
    year: { type: Number },
    engineCC: { type: Number },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ServiceTypeSchema = new Schema<IServiceType>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    estimatedHours: { type: Number, required: true, min: 0.5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const MechanicSchema = new Schema<IMechanic>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingCode: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true },
    serviceTypeId: { type: Schema.Types.ObjectId, ref: 'ServiceType', required: true },
    mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic', default: null },
    preferredDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Bike Received',
        'Under Service',
        'Service Completed',
        'Delivered',
        'Rejected',
      ],
      default: 'Pending',
    },
    customerNotes: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    notes: { type: String, trim: true },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
  },
  { timestamps: false }
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const BikeModel =
  mongoose.models.Bike || mongoose.model<IBike>('Bike', BikeSchema);
export const ServiceTypeModel =
  mongoose.models.ServiceType ||
  mongoose.model<IServiceType>('ServiceType', ServiceTypeSchema);
export const MechanicModel =
  mongoose.models.Mechanic || mongoose.model<IMechanic>('Mechanic', MechanicSchema);
export const BookingModel =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export const InvoiceModel =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
