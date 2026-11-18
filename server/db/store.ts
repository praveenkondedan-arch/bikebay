import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ENV } from '../config/env.ts';
import {
  UserModel,
  BikeModel,
  ServiceTypeModel,
  MechanicModel,
  BookingModel,
  InvoiceModel,
  type ServiceStatus,
  type UserRole,
} from '../models/mongooseModels.ts';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface BikeRecord {
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

export interface ServiceTypeRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface MechanicRecord {
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

export interface BookingRecord {
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
}

export interface InvoiceItemRecord {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  bikeId: string;
  items: InvoiceItemRecord[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Unpaid' | 'Paid';
  notes?: string;
  issuedAt: string;
  paidAt: string | null;
}

export interface PopulatedBooking extends BookingRecord {
  customer?: Omit<UserRecord, 'passwordHash'>;
  bike?: BikeRecord;
  serviceType?: ServiceTypeRecord;
  mechanic?: MechanicRecord | null;
  invoiceId?: string | null;
}

export interface PopulatedInvoice extends InvoiceRecord {
  customer?: Omit<UserRecord, 'passwordHash'>;
  bike?: BikeRecord;
  booking?: BookingRecord;
}

interface LocalStoreData {
  users: UserRecord[];
  bikes: BikeRecord[];
  serviceTypes: ServiceTypeRecord[];
  mechanics: MechanicRecord[];
  bookings: BookingRecord[];
  invoices: InvoiceRecord[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data', 'motobay-db.json');

let useMongo = false;

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function loadLocalStore(): LocalStoreData {
  if (!fs.existsSync(DATA_FILE)) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const empty: LocalStoreData = {
      users: [],
      bikes: [],
      serviceTypes: [],
      mechanics: [],
      bookings: [],
      invoices: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as LocalStoreData;
}

function saveLocalStore(data: LocalStoreData): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function docToId(doc: { _id: unknown }): string {
  return String(doc._id);
}

function sanitizeUser(user: UserRecord): Omit<UserRecord, 'passwordHash'> {
  const { passwordHash: _removed, ...safe } = user;
  return safe;
}

export async function connectDatabase(): Promise<{ mode: 'mongodb' | 'local' }> {
  if (ENV.MONGODB_URI) {
    try {
      await mongoose.connect(ENV.MONGODB_URI);
      useMongo = true;
      console.log('[DB] Connected to MongoDB Atlas via Mongoose');
      await seedDatabaseIfEmpty();
      return { mode: 'mongodb' };
    } catch (err) {
      console.error('[DB] Failed to connect to MongoDB Atlas:', err);
      throw err;
    }
  } else {
    useMongo = false;
    console.log(
      '[DB] MONGODB_URI not configured — using persistent local JSON store (./data/motobay-db.json). Set MONGODB_URI in .env for MongoDB Atlas.'
    );
    await seedDatabaseIfEmpty();
    return { mode: 'local' };
  }
}

async function seedDatabaseIfEmpty(): Promise<void> {
  const existingUsers = await db.countUsers();
  if (existingUsers > 0) return;

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const customerHash = await bcrypt.hash('Customer@123', 10);

  await db.createUser({
    name: 'Siddharth Verma',
    email: 'admin@motobay.com',
    phone: '+91 98765 00001',
    passwordHash: adminHash,
    role: 'admin',
  });

  const demoCustomer = await db.createUser({
    name: 'Arjun Kapoor',
    email: 'arjun@example.com',
    phone: '+91 98201 44512',
    passwordHash: customerHash,
    role: 'customer',
  });

  const secondCustomer = await db.createUser({
    name: 'Meera Iyer',
    email: 'meera@example.com',
    phone: '+91 98450 77821',
    passwordHash: customerHash,
    role: 'customer',
  });

  const svcGeneral = await db.createServiceType({
    name: 'Periodic General Service',
    description:
      'Complete 24-point inspection, air filter cleaning, spark plug check, chain lubrication, and safety torque check.',
    price: 1499,
    estimatedHours: 3,
    isActive: true,
  });

  const svcOil = await db.createServiceType({
    name: 'Synthetic Oil & Filter Change',
    description:
      'Full drain and refill with 10W-40 full synthetic engine oil, genuine oil filter replacement, and sump gasket check.',
    price: 1199,
    estimatedHours: 1.5,
    isActive: true,
  });

  const svcBrake = await db.createServiceType({
    name: 'Brake Pad & Fluid Overhaul',
    description:
      'Front and rear caliper cleaning, brake pad replacement, DOT-4 fluid bleed, and rotor runout inspection.',
    price: 1850,
    estimatedHours: 2.5,
    isActive: true,
  });

  await db.createServiceType({
    name: 'Chain & Sprocket Kit Tune',
    description:
      'Drive chain tension calibration, ultrasonic cleaning, sprocket wear check, and heavy-duty lube application.',
    price: 899,
    estimatedHours: 1.5,
    isActive: true,
  });

  await db.createServiceType({
    name: 'Full Engine Diagnostic & Detailing',
    description:
      'ECU OBD-II scan, throttle body cleaning, valve clearance inspection, and precision foam wash & wax.',
    price: 2799,
    estimatedHours: 5,
    isActive: true,
  });

  const mech1 = await db.createMechanic({
    name: 'Vikram Nair',
    phone: '+91 98111 22334',
    specialty: 'Engine & Transmission',
    isAvailable: true,
  });

  const mech2 = await db.createMechanic({
    name: 'Rohan Mehta',
    phone: '+91 98111 55667',
    specialty: 'Brakes & Suspension',
    isAvailable: true,
  });

  await db.createMechanic({
    name: 'Karthik Rao',
    phone: '+91 98111 88990',
    specialty: 'Electrical & Diagnostics',
    isAvailable: true,
  });

  const bike1 = await db.createBike({
    customerId: demoCustomer.id,
    brand: 'Royal Enfield',
    model: 'Classic 350',
    registrationNumber: 'MH-02-EQ-4821',
    year: 2023,
    engineCC: 349,
    notes: 'Matte Black Signals edition',
  });

  const bike2 = await db.createBike({
    customerId: demoCustomer.id,
    brand: 'Yamaha',
    model: 'MT-15 V2',
    registrationNumber: 'MH-02-FR-9014',
    year: 2024,
    engineCC: 155,
    notes: 'Metallic Black',
  });

  const bike3 = await db.createBike({
    customerId: secondCustomer.id,
    brand: 'KTM',
    model: 'Duke 390',
    registrationNumber: 'KA-01-MJ-7730',
    year: 2023,
    engineCC: 399,
    notes: 'Quickshifter calibrated',
  });

  // Seed 3 bookings: 1 Pending, 1 Under Service, 1 Delivered (with Paid Invoice)
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  await db.createBooking({
    customerId: demoCustomer.id,
    bikeId: bike1.id,
    serviceTypeId: svcGeneral.id,
    mechanicId: mech1.id,
    preferredDate: formatDate(today),
    timeSlot: '10:00 AM',
    status: 'Under Service',
    customerNotes: 'Slight tappet noise at cold start.',
    adminNotes: 'Assigned bay 2 for valve clearance check.',
    statusHistory: [
      { status: 'Pending', note: 'Booking submitted by customer.', updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { status: 'Confirmed', note: 'Slot confirmed by service desk.', updatedAt: new Date(Date.now() - 86400000 * 1.8).toISOString() },
      { status: 'Bike Received', note: 'Bike checked in at reception bay.', updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
      { status: 'Under Service', note: 'Assigned to Vikram Nair. Inspection underway.', updatedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
    ],
  });

  await db.createBooking({
    customerId: demoCustomer.id,
    bikeId: bike2.id,
    serviceTypeId: svcOil.id,
    mechanicId: null,
    preferredDate: formatDate(new Date(Date.now() + 86400000 * 2)),
    timeSlot: '02:00 PM',
    status: 'Pending',
    customerNotes: '5,000 km scheduled oil change.',
    adminNotes: '',
    statusHistory: [
      { status: 'Pending', note: 'Awaiting service advisor confirmation.', updatedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    ],
  });

  const completedBooking = await db.createBooking({
    customerId: secondCustomer.id,
    bikeId: bike3.id,
    serviceTypeId: svcBrake.id,
    mechanicId: mech2.id,
    preferredDate: formatDate(new Date(Date.now() - 86400000 * 5)),
    timeSlot: '11:30 AM',
    status: 'Delivered',
    customerNotes: 'Front brake lever feels spongy.',
    adminNotes: 'Replaced sintered pads and bled hydraulic line.',
    statusHistory: [
      { status: 'Pending', note: 'Booking submitted.', updatedAt: new Date(Date.now() - 86400000 * 6).toISOString() },
      { status: 'Confirmed', note: 'Appointment confirmed.', updatedAt: new Date(Date.now() - 86400000 * 5.8).toISOString() },
      { status: 'Bike Received', note: 'Received at workshop.', updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
      { status: 'Under Service', note: 'Brake overhaul in progress.', updatedAt: new Date(Date.now() - 86400000 * 4.8).toISOString() },
      { status: 'Service Completed', note: 'Road test passed.', updatedAt: new Date(Date.now() - 86400000 * 4.5).toISOString() },
      { status: 'Delivered', note: 'Handed over to customer.', updatedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    ],
  });

  await db.createInvoice({
    bookingId: completedBooking.id,
    customerId: secondCustomer.id,
    bikeId: bike3.id,
    items: [
      { description: 'Brake Pad & Fluid Overhaul (Service)', quantity: 1, unitPrice: 1850, total: 1850 },
      { description: 'Brembo Sintered Front Brake Pads', quantity: 1, unitPrice: 1200, total: 1200 },
    ],
    taxRate: 18,
    discount: 150,
    paymentStatus: 'Paid',
    notes: 'Paid via UPI at workshop counter.',
  });
}

export const db = {
  isMongoMode(): boolean {
    return useMongo;
  },

  // ---------------- USERS ----------------
  async countUsers(): Promise<number> {
    if (useMongo) return UserModel.countDocuments();
    return loadLocalStore().users.length;
  },

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    if (useMongo) {
      const doc = await UserModel.findOne({ email: normalized }).lean();
      if (!doc) return null;
      return {
        id: docToId(doc),
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.users.find((u) => u.email === normalized) || null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await UserModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: docToId(doc),
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.users.find((u) => u.id === id) || null;
  },

  async listCustomers(): Promise<Array<Omit<UserRecord, 'passwordHash'>>> {
    if (useMongo) {
      const docs = await UserModel.find({ role: 'customer' }).sort({ createdAt: -1 }).lean();
      return docs.map((d) =>
        sanitizeUser({
          id: docToId(d),
          name: d.name,
          email: d.email,
          phone: d.phone,
          passwordHash: d.passwordHash,
          role: d.role,
          createdAt: new Date(d.createdAt).toISOString(),
        })
      );
    }
    const store = loadLocalStore();
    return store.users
      .filter((u) => u.role === 'customer')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(sanitizeUser);
  },

  async createUser(input: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord> {
    if (useMongo) {
      const doc = await UserModel.create({
        name: input.name,
        email: input.email.toLowerCase().trim(),
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
      });
      return {
        id: docToId(doc),
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const record: UserRecord = {
      id: generateId(),
      name: input.name,
      email: input.email.toLowerCase().trim(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    store.users.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateUser(
    id: string,
    updates: Partial<Pick<UserRecord, 'name' | 'email' | 'phone'>>
  ): Promise<Omit<UserRecord, 'passwordHash'> | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await UserModel.findByIdAndUpdate(
        id,
        {
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.email !== undefined ? { email: updates.email.toLowerCase().trim() } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        },
        { new: true }
      ).lean();
      if (!doc) return null;
      return sanitizeUser({
        id: docToId(doc),
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: new Date(doc.createdAt).toISOString(),
      });
    }
    const store = loadLocalStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    store.users[idx] = {
      ...store.users[idx],
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email.toLowerCase().trim() } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    };
    saveLocalStore(store);
    return sanitizeUser(store.users[idx]);
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await UserModel.findOneAndDelete({ _id: id, role: 'customer' });
      if (!res) return false;
      await BikeModel.deleteMany({ customerId: id });
      await BookingModel.deleteMany({ customerId: id });
      await InvoiceModel.deleteMany({ customerId: id });
      return true;
    }
    const store = loadLocalStore();
    const target = store.users.find((u) => u.id === id && u.role === 'customer');
    if (!target) return false;
    store.users = store.users.filter((u) => u.id !== id);
    store.bikes = store.bikes.filter((b) => b.customerId !== id);
    store.bookings = store.bookings.filter((b) => b.customerId !== id);
    store.invoices = store.invoices.filter((i) => i.customerId !== id);
    saveLocalStore(store);
    return true;
  },

  // ---------------- BIKES ----------------
  async listBikes(customerId?: string): Promise<BikeRecord[]> {
    if (useMongo) {
      const filter = customerId ? { customerId } : {};
      const docs = await BikeModel.find(filter).sort({ createdAt: -1 }).lean();
      return docs.map((d) => ({
        id: docToId(d),
        customerId: String(d.customerId),
        brand: d.brand,
        model: d.model,
        registrationNumber: d.registrationNumber,
        year: d.year,
        engineCC: d.engineCC,
        notes: d.notes,
        createdAt: new Date(d.createdAt).toISOString(),
      }));
    }
    const store = loadLocalStore();
    return store.bikes
      .filter((b) => (customerId ? b.customerId === customerId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findBikeById(id: string): Promise<BikeRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await BikeModel.findById(id).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        customerId: String(d.customerId),
        brand: d.brand,
        model: d.model,
        registrationNumber: d.registrationNumber,
        year: d.year,
        engineCC: d.engineCC,
        notes: d.notes,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.bikes.find((b) => b.id === id) || null;
  },

  async createBike(input: Omit<BikeRecord, 'id' | 'createdAt'>): Promise<BikeRecord> {
    if (useMongo) {
      const d = await BikeModel.create({
        ...input,
        registrationNumber: input.registrationNumber.toUpperCase().trim(),
      });
      return {
        id: docToId(d),
        customerId: String(d.customerId),
        brand: d.brand,
        model: d.model,
        registrationNumber: d.registrationNumber,
        year: d.year,
        engineCC: d.engineCC,
        notes: d.notes,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const record: BikeRecord = {
      id: generateId(),
      customerId: input.customerId,
      brand: input.brand,
      model: input.model,
      registrationNumber: input.registrationNumber.toUpperCase().trim(),
      year: input.year,
      engineCC: input.engineCC,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    store.bikes.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateBike(
    id: string,
    updates: Partial<Omit<BikeRecord, 'id' | 'customerId' | 'createdAt'>>
  ): Promise<BikeRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await BikeModel.findByIdAndUpdate(
        id,
        {
          ...updates,
          ...(updates.registrationNumber
            ? { registrationNumber: updates.registrationNumber.toUpperCase().trim() }
            : {}),
        },
        { new: true }
      ).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        customerId: String(d.customerId),
        brand: d.brand,
        model: d.model,
        registrationNumber: d.registrationNumber,
        year: d.year,
        engineCC: d.engineCC,
        notes: d.notes,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const idx = store.bikes.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    store.bikes[idx] = {
      ...store.bikes[idx],
      ...updates,
      ...(updates.registrationNumber
        ? { registrationNumber: updates.registrationNumber.toUpperCase().trim() }
        : {}),
    };
    saveLocalStore(store);
    return store.bikes[idx];
  },

  async deleteBike(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await BikeModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const store = loadLocalStore();
    const before = store.bikes.length;
    store.bikes = store.bikes.filter((b) => b.id !== id);
    if (store.bikes.length === before) return false;
    saveLocalStore(store);
    return true;
  },

  // ---------------- SERVICE TYPES ----------------
  async listServiceTypes(onlyActive = false): Promise<ServiceTypeRecord[]> {
    if (useMongo) {
      const filter = onlyActive ? { isActive: true } : {};
      const docs = await ServiceTypeModel.find(filter).sort({ price: 1 }).lean();
      return docs.map((d) => ({
        id: docToId(d),
        name: d.name,
        description: d.description,
        price: d.price,
        estimatedHours: d.estimatedHours,
        isActive: d.isActive,
        createdAt: new Date(d.createdAt).toISOString(),
      }));
    }
    const store = loadLocalStore();
    return store.serviceTypes
      .filter((s) => (onlyActive ? s.isActive : true))
      .sort((a, b) => a.price - b.price);
  },

  async findServiceTypeById(id: string): Promise<ServiceTypeRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await ServiceTypeModel.findById(id).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        name: d.name,
        description: d.description,
        price: d.price,
        estimatedHours: d.estimatedHours,
        isActive: d.isActive,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.serviceTypes.find((s) => s.id === id) || null;
  },

  async createServiceType(
    input: Omit<ServiceTypeRecord, 'id' | 'createdAt'>
  ): Promise<ServiceTypeRecord> {
    if (useMongo) {
      const d = await ServiceTypeModel.create(input);
      return {
        id: docToId(d),
        name: d.name,
        description: d.description,
        price: d.price,
        estimatedHours: d.estimatedHours,
        isActive: d.isActive,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const record: ServiceTypeRecord = {
      id: generateId(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    store.serviceTypes.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateServiceType(
    id: string,
    updates: Partial<Omit<ServiceTypeRecord, 'id' | 'createdAt'>>
  ): Promise<ServiceTypeRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await ServiceTypeModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        name: d.name,
        description: d.description,
        price: d.price,
        estimatedHours: d.estimatedHours,
        isActive: d.isActive,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const idx = store.serviceTypes.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    store.serviceTypes[idx] = { ...store.serviceTypes[idx], ...updates };
    saveLocalStore(store);
    return store.serviceTypes[idx];
  },

  async deleteServiceType(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await ServiceTypeModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const store = loadLocalStore();
    const before = store.serviceTypes.length;
    store.serviceTypes = store.serviceTypes.filter((s) => s.id !== id);
    if (store.serviceTypes.length === before) return false;
    saveLocalStore(store);
    return true;
  },

  // ---------------- MECHANICS ----------------
  async listMechanics(): Promise<MechanicRecord[]> {
    if (useMongo) {
      const docs = await MechanicModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((d) => ({
        id: docToId(d),
        name: d.name,
        phone: d.phone,
        specialty: d.specialty,
        isAvailable: d.isAvailable,
        createdAt: new Date(d.createdAt).toISOString(),
      }));
    }
    const store = loadLocalStore();
    return [...store.mechanics].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findMechanicById(id: string): Promise<MechanicRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await MechanicModel.findById(id).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        name: d.name,
        phone: d.phone,
        specialty: d.specialty,
        isAvailable: d.isAvailable,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.mechanics.find((m) => m.id === id) || null;
  },

  async createMechanic(
    input: Omit<MechanicRecord, 'id' | 'createdAt'>
  ): Promise<MechanicRecord> {
    if (useMongo) {
      const d = await MechanicModel.create(input);
      return {
        id: docToId(d),
        name: d.name,
        phone: d.phone,
        specialty: d.specialty,
        isAvailable: d.isAvailable,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const record: MechanicRecord = {
      id: generateId(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    store.mechanics.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateMechanic(
    id: string,
    updates: Partial<Omit<MechanicRecord, 'id' | 'createdAt'>>
  ): Promise<MechanicRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await MechanicModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        name: d.name,
        phone: d.phone,
        specialty: d.specialty,
        isAvailable: d.isAvailable,
        createdAt: new Date(d.createdAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    const idx = store.mechanics.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    store.mechanics[idx] = { ...store.mechanics[idx], ...updates };
    saveLocalStore(store);
    return store.mechanics[idx];
  },

  async deleteMechanic(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await MechanicModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const store = loadLocalStore();
    const before = store.mechanics.length;
    store.mechanics = store.mechanics.filter((m) => m.id !== id);
    if (store.mechanics.length === before) return false;
    saveLocalStore(store);
    return true;
  },

  // ---------------- BOOKINGS ----------------
  async listBookings(customerId?: string): Promise<PopulatedBooking[]> {
    if (useMongo) {
      const filter = customerId ? { customerId } : {};
      const docs = await BookingModel.find(filter)
        .populate('customerId', 'name email phone role createdAt')
        .populate('bikeId')
        .populate('serviceTypeId')
        .populate('mechanicId')
        .sort({ createdAt: -1 })
        .lean();

      const invoices = await InvoiceModel.find(customerId ? { customerId } : {}).lean();
      const invoiceMap = new Map<string, string>();
      for (const inv of invoices) {
        invoiceMap.set(String(inv.bookingId), String(inv._id));
      }

      return docs.map((d) => {
        const cust = d.customerId as unknown as Record<string, unknown> | null;
        const bike = d.bikeId as unknown as Record<string, unknown> | null;
        const svc = d.serviceTypeId as unknown as Record<string, unknown> | null;
        const mech = d.mechanicId as unknown as Record<string, unknown> | null;
        const id = docToId(d);
        return {
          id,
          bookingCode: d.bookingCode,
          customerId: cust ? String(cust._id) : '',
          bikeId: bike ? String(bike._id) : '',
          serviceTypeId: svc ? String(svc._id) : '',
          mechanicId: mech ? String(mech._id) : null,
          preferredDate: d.preferredDate,
          timeSlot: d.timeSlot,
          status: d.status,
          customerNotes: d.customerNotes,
          adminNotes: d.adminNotes,
          statusHistory: (d.statusHistory || []).map(
            (h: { status: ServiceStatus; note: string; updatedAt: Date }) => ({
              status: h.status,
              note: h.note,
              updatedAt: new Date(h.updatedAt).toISOString(),
            })
          ),
          createdAt: new Date(d.createdAt).toISOString(),
          updatedAt: new Date(d.updatedAt).toISOString(),
          customer: cust
            ? {
                id: String(cust._id),
                name: String(cust.name),
                email: String(cust.email),
                phone: String(cust.phone),
                role: cust.role as UserRole,
                createdAt: new Date(cust.createdAt as string).toISOString(),
              }
            : undefined,
          bike: bike
            ? {
                id: String(bike._id),
                customerId: String(bike.customerId),
                brand: String(bike.brand),
                model: String(bike.model),
                registrationNumber: String(bike.registrationNumber),
                year: bike.year as number | undefined,
                engineCC: bike.engineCC as number | undefined,
                notes: bike.notes as string | undefined,
                createdAt: new Date(bike.createdAt as string).toISOString(),
              }
            : undefined,
          serviceType: svc
            ? {
                id: String(svc._id),
                name: String(svc.name),
                description: String(svc.description),
                price: Number(svc.price),
                estimatedHours: Number(svc.estimatedHours),
                isActive: Boolean(svc.isActive),
                createdAt: new Date(svc.createdAt as string).toISOString(),
              }
            : undefined,
          mechanic: mech
            ? {
                id: String(mech._id),
                name: String(mech.name),
                phone: String(mech.phone),
                specialty: String(mech.specialty),
                isAvailable: Boolean(mech.isAvailable),
                createdAt: new Date(mech.createdAt as string).toISOString(),
              }
            : null,
          invoiceId: invoiceMap.get(id) || null,
        };
      });
    }

    const store = loadLocalStore();
    const filtered = store.bookings
      .filter((b) => (customerId ? b.customerId === customerId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return filtered.map((b) => {
      const cust = store.users.find((u) => u.id === b.customerId);
      const bike = store.bikes.find((bk) => bk.id === b.bikeId);
      const svc = store.serviceTypes.find((s) => s.id === b.serviceTypeId);
      const mech = b.mechanicId
        ? store.mechanics.find((m) => m.id === b.mechanicId) || null
        : null;
      const inv = store.invoices.find((i) => i.bookingId === b.id);
      return {
        ...b,
        customer: cust ? sanitizeUser(cust) : undefined,
        bike,
        serviceType: svc,
        mechanic: mech,
        invoiceId: inv ? inv.id : null,
      };
    });
  },

  async findBookingById(id: string): Promise<BookingRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await BookingModel.findById(id).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        bookingCode: d.bookingCode,
        customerId: String(d.customerId),
        bikeId: String(d.bikeId),
        serviceTypeId: String(d.serviceTypeId),
        mechanicId: d.mechanicId ? String(d.mechanicId) : null,
        preferredDate: d.preferredDate,
        timeSlot: d.timeSlot,
        status: d.status,
        customerNotes: d.customerNotes,
        adminNotes: d.adminNotes,
        statusHistory: (d.statusHistory || []).map(
          (h: { status: ServiceStatus; note: string; updatedAt: Date }) => ({
            status: h.status,
            note: h.note,
            updatedAt: new Date(h.updatedAt).toISOString(),
          })
        ),
        createdAt: new Date(d.createdAt).toISOString(),
        updatedAt: new Date(d.updatedAt).toISOString(),
      };
    }
    const store = loadLocalStore();
    return store.bookings.find((b) => b.id === id) || null;
  },

  async createBooking(input: {
    customerId: string;
    bikeId: string;
    serviceTypeId: string;
    mechanicId?: string | null;
    preferredDate: string;
    timeSlot: string;
    status?: ServiceStatus;
    customerNotes?: string;
    adminNotes?: string;
    statusHistory?: StatusHistoryEntry[];
  }): Promise<BookingRecord> {
    const code = `MB-${Math.floor(100000 + Math.random() * 900000)}`;
    const initialStatus: ServiceStatus = input.status || 'Pending';
    const history: StatusHistoryEntry[] = input.statusHistory || [
      {
        status: initialStatus,
        note: 'Service appointment requested by customer.',
        updatedAt: new Date().toISOString(),
      },
    ];

    if (useMongo) {
      const d = await BookingModel.create({
        bookingCode: code,
        customerId: input.customerId,
        bikeId: input.bikeId,
        serviceTypeId: input.serviceTypeId,
        mechanicId: input.mechanicId || null,
        preferredDate: input.preferredDate,
        timeSlot: input.timeSlot,
        status: initialStatus,
        customerNotes: input.customerNotes || '',
        adminNotes: input.adminNotes || '',
        statusHistory: history,
      });
      return {
        id: docToId(d),
        bookingCode: d.bookingCode,
        customerId: String(d.customerId),
        bikeId: String(d.bikeId),
        serviceTypeId: String(d.serviceTypeId),
        mechanicId: d.mechanicId ? String(d.mechanicId) : null,
        preferredDate: d.preferredDate,
        timeSlot: d.timeSlot,
        status: d.status,
        customerNotes: d.customerNotes,
        adminNotes: d.adminNotes,
        statusHistory: (d.statusHistory || []).map(
          (h: { status: ServiceStatus; note: string; updatedAt: Date }) => ({
            status: h.status,
            note: h.note,
            updatedAt: new Date(h.updatedAt).toISOString(),
          })
        ),
        createdAt: new Date(d.createdAt).toISOString(),
        updatedAt: new Date(d.updatedAt).toISOString(),
      };
    }

    const store = loadLocalStore();
    const now = new Date().toISOString();
    const record: BookingRecord = {
      id: generateId(),
      bookingCode: code,
      customerId: input.customerId,
      bikeId: input.bikeId,
      serviceTypeId: input.serviceTypeId,
      mechanicId: input.mechanicId || null,
      preferredDate: input.preferredDate,
      timeSlot: input.timeSlot,
      status: initialStatus,
      customerNotes: input.customerNotes || '',
      adminNotes: input.adminNotes || '',
      statusHistory: history,
      createdAt: now,
      updatedAt: now,
    };
    store.bookings.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateBooking(
    id: string,
    updates: {
      mechanicId?: string | null;
      status?: ServiceStatus;
      adminNotes?: string;
      statusNote?: string;
    }
  ): Promise<BookingRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const existing = await BookingModel.findById(id);
      if (!existing) return null;

      if (updates.mechanicId !== undefined) {
        existing.mechanicId = updates.mechanicId
          ? new mongoose.Types.ObjectId(updates.mechanicId)
          : null;
      }
      if (updates.adminNotes !== undefined) {
        existing.adminNotes = updates.adminNotes;
      }
      if (updates.status !== undefined && updates.status !== existing.status) {
        existing.status = updates.status;
        existing.statusHistory.push({
          status: updates.status,
          note: updates.statusNote || `Status updated to ${updates.status}.`,
          updatedAt: new Date(),
        });
      }
      await existing.save();
      return {
        id: docToId(existing),
        bookingCode: existing.bookingCode,
        customerId: String(existing.customerId),
        bikeId: String(existing.bikeId),
        serviceTypeId: String(existing.serviceTypeId),
        mechanicId: existing.mechanicId ? String(existing.mechanicId) : null,
        preferredDate: existing.preferredDate,
        timeSlot: existing.timeSlot,
        status: existing.status,
        customerNotes: existing.customerNotes,
        adminNotes: existing.adminNotes,
        statusHistory: (existing.statusHistory || []).map(
          (h: { status: ServiceStatus; note: string; updatedAt: Date }) => ({
            status: h.status,
            note: h.note,
            updatedAt: new Date(h.updatedAt).toISOString(),
          })
        ),
        createdAt: new Date(existing.createdAt).toISOString(),
        updatedAt: new Date(existing.updatedAt).toISOString(),
      };
    }

    const store = loadLocalStore();
    const idx = store.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const current = store.bookings[idx];
    const nextHistory = [...current.statusHistory];
    if (updates.status !== undefined && updates.status !== current.status) {
      nextHistory.push({
        status: updates.status,
        note: updates.statusNote || `Status updated to ${updates.status}.`,
        updatedAt: new Date().toISOString(),
      });
    }
    store.bookings[idx] = {
      ...current,
      ...(updates.mechanicId !== undefined ? { mechanicId: updates.mechanicId } : {}),
      ...(updates.adminNotes !== undefined ? { adminNotes: updates.adminNotes } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      statusHistory: nextHistory,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore(store);
    return store.bookings[idx];
  },

  async deleteBooking(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await BookingModel.findByIdAndDelete(id);
      if (!res) return false;
      await InvoiceModel.deleteMany({ bookingId: id });
      return true;
    }
    const store = loadLocalStore();
    const before = store.bookings.length;
    store.bookings = store.bookings.filter((b) => b.id !== id);
    if (store.bookings.length === before) return false;
    store.invoices = store.invoices.filter((i) => i.bookingId !== id);
    saveLocalStore(store);
    return true;
  },

  // ---------------- INVOICES ----------------
  async listInvoices(customerId?: string): Promise<PopulatedInvoice[]> {
    if (useMongo) {
      const filter = customerId ? { customerId } : {};
      const docs = await InvoiceModel.find(filter)
        .populate('customerId', 'name email phone role createdAt')
        .populate('bikeId')
        .populate('bookingId')
        .sort({ issuedAt: -1 })
        .lean();

      return docs.map((d) => {
        const cust = d.customerId as unknown as Record<string, unknown> | null;
        const bike = d.bikeId as unknown as Record<string, unknown> | null;
        const bk = d.bookingId as unknown as Record<string, unknown> | null;
        return {
          id: docToId(d),
          invoiceNumber: d.invoiceNumber,
          bookingId: bk ? String(bk._id) : '',
          customerId: cust ? String(cust._id) : '',
          bikeId: bike ? String(bike._id) : '',
          items: d.items,
          subtotal: d.subtotal,
          taxRate: d.taxRate,
          taxAmount: d.taxAmount,
          discount: d.discount,
          totalAmount: d.totalAmount,
          paymentStatus: d.paymentStatus,
          notes: d.notes,
          issuedAt: new Date(d.issuedAt).toISOString(),
          paidAt: d.paidAt ? new Date(d.paidAt).toISOString() : null,
          customer: cust
            ? {
                id: String(cust._id),
                name: String(cust.name),
                email: String(cust.email),
                phone: String(cust.phone),
                role: cust.role as UserRole,
                createdAt: new Date(cust.createdAt as string).toISOString(),
              }
            : undefined,
          bike: bike
            ? {
                id: String(bike._id),
                customerId: String(bike.customerId),
                brand: String(bike.brand),
                model: String(bike.model),
                registrationNumber: String(bike.registrationNumber),
                year: bike.year as number | undefined,
                engineCC: bike.engineCC as number | undefined,
                notes: bike.notes as string | undefined,
                createdAt: new Date(bike.createdAt as string).toISOString(),
              }
            : undefined,
          booking: bk
            ? {
                id: String(bk._id),
                bookingCode: String(bk.bookingCode),
                customerId: String(bk.customerId),
                bikeId: String(bk.bikeId),
                serviceTypeId: String(bk.serviceTypeId),
                mechanicId: bk.mechanicId ? String(bk.mechanicId) : null,
                preferredDate: String(bk.preferredDate),
                timeSlot: String(bk.timeSlot),
                status: bk.status as ServiceStatus,
                customerNotes: bk.customerNotes as string | undefined,
                adminNotes: bk.adminNotes as string | undefined,
                statusHistory: [],
                createdAt: new Date(bk.createdAt as string).toISOString(),
                updatedAt: new Date(bk.updatedAt as string).toISOString(),
              }
            : undefined,
        };
      });
    }

    const store = loadLocalStore();
    return store.invoices
      .filter((i) => (customerId ? i.customerId === customerId : true))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
      .map((inv) => {
        const cust = store.users.find((u) => u.id === inv.customerId);
        const bike = store.bikes.find((bk) => bk.id === inv.bikeId);
        const booking = store.bookings.find((b) => b.id === inv.bookingId);
        return {
          ...inv,
          customer: cust ? sanitizeUser(cust) : undefined,
          bike,
          booking,
        };
      });
  },

  async findInvoiceById(id: string): Promise<PopulatedInvoice | null> {
    const all = await this.listInvoices();
    return all.find((i) => i.id === id) || null;
  },

  async findInvoiceByBookingId(bookingId: string): Promise<InvoiceRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(bookingId)) return null;
      const d = await InvoiceModel.findOne({ bookingId }).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        invoiceNumber: d.invoiceNumber,
        bookingId: String(d.bookingId),
        customerId: String(d.customerId),
        bikeId: String(d.bikeId),
        items: d.items,
        subtotal: d.subtotal,
        taxRate: d.taxRate,
        taxAmount: d.taxAmount,
        discount: d.discount,
        totalAmount: d.totalAmount,
        paymentStatus: d.paymentStatus,
        notes: d.notes,
        issuedAt: new Date(d.issuedAt).toISOString(),
        paidAt: d.paidAt ? new Date(d.paidAt).toISOString() : null,
      };
    }
    const store = loadLocalStore();
    return store.invoices.find((i) => i.bookingId === bookingId) || null;
  },

  async createInvoice(input: {
    bookingId: string;
    customerId: string;
    bikeId: string;
    items: InvoiceItemRecord[];
    taxRate: number;
    discount: number;
    paymentStatus?: 'Unpaid' | 'Paid';
    notes?: string;
  }): Promise<InvoiceRecord> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
    const taxable = Math.max(0, subtotal - input.discount);
    const taxAmount = Math.round((taxable * input.taxRate) / 100);
    const totalAmount = Math.max(0, taxable + taxAmount);
    const paymentStatus = input.paymentStatus || 'Unpaid';
    const now = new Date().toISOString();

    if (useMongo) {
      const d = await InvoiceModel.create({
        invoiceNumber,
        bookingId: input.bookingId,
        customerId: input.customerId,
        bikeId: input.bikeId,
        items: input.items,
        subtotal,
        taxRate: input.taxRate,
        taxAmount,
        discount: input.discount,
        totalAmount,
        paymentStatus,
        notes: input.notes || '',
        issuedAt: new Date(now),
        paidAt: paymentStatus === 'Paid' ? new Date(now) : null,
      });
      return {
        id: docToId(d),
        invoiceNumber: d.invoiceNumber,
        bookingId: String(d.bookingId),
        customerId: String(d.customerId),
        bikeId: String(d.bikeId),
        items: d.items,
        subtotal: d.subtotal,
        taxRate: d.taxRate,
        taxAmount: d.taxAmount,
        discount: d.discount,
        totalAmount: d.totalAmount,
        paymentStatus: d.paymentStatus,
        notes: d.notes,
        issuedAt: new Date(d.issuedAt).toISOString(),
        paidAt: d.paidAt ? new Date(d.paidAt).toISOString() : null,
      };
    }

    const store = loadLocalStore();
    const record: InvoiceRecord = {
      id: generateId(),
      invoiceNumber,
      bookingId: input.bookingId,
      customerId: input.customerId,
      bikeId: input.bikeId,
      items: input.items,
      subtotal,
      taxRate: input.taxRate,
      taxAmount,
      discount: input.discount,
      totalAmount,
      paymentStatus,
      notes: input.notes || '',
      issuedAt: now,
      paidAt: paymentStatus === 'Paid' ? now : null,
    };
    store.invoices.push(record);
    saveLocalStore(store);
    return record;
  },

  async updateInvoicePayment(
    id: string,
    paymentStatus: 'Unpaid' | 'Paid'
  ): Promise<InvoiceRecord | null> {
    const paidAt = paymentStatus === 'Paid' ? new Date().toISOString() : null;
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const d = await InvoiceModel.findByIdAndUpdate(
        id,
        { paymentStatus, paidAt: paidAt ? new Date(paidAt) : null },
        { new: true }
      ).lean();
      if (!d) return null;
      return {
        id: docToId(d),
        invoiceNumber: d.invoiceNumber,
        bookingId: String(d.bookingId),
        customerId: String(d.customerId),
        bikeId: String(d.bikeId),
        items: d.items,
        subtotal: d.subtotal,
        taxRate: d.taxRate,
        taxAmount: d.taxAmount,
        discount: d.discount,
        totalAmount: d.totalAmount,
        paymentStatus: d.paymentStatus,
        notes: d.notes,
        issuedAt: new Date(d.issuedAt).toISOString(),
        paidAt: d.paidAt ? new Date(d.paidAt).toISOString() : null,
      };
    }
    const store = loadLocalStore();
    const idx = store.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    store.invoices[idx] = { ...store.invoices[idx], paymentStatus, paidAt };
    saveLocalStore(store);
    return store.invoices[idx];
  },
};
