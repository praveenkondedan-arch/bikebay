import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', async (_req, res) => {
  try {
    const [customers, bikes, bookings, invoices, mechanics, services] = await Promise.all([
      db.listCustomers(),
      db.listBikes(),
      db.listBookings(),
      db.listInvoices(),
      db.listMechanics(),
      db.listServiceTypes(false),
    ]);

    const completedServices = bookings.filter(
      (b) => b.status === 'Service Completed' || b.status === 'Delivered'
    ).length;

    const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;
    const inProgressBookings = bookings.filter((b) =>
      ['Confirmed', 'Bike Received', 'Under Service'].includes(b.status)
    ).length;

    const totalRevenue = invoices
      .filter((inv) => inv.paymentStatus === 'Paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const outstandingRevenue = invoices
      .filter((inv) => inv.paymentStatus === 'Unpaid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const statusCounts: Record<string, number> = {
      Pending: 0,
      Confirmed: 0,
      'Bike Received': 0,
      'Under Service': 0,
      'Service Completed': 0,
      Delivered: 0,
      Rejected: 0,
    };
    for (const b of bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    res.json({
      stats: {
        totalCustomers: customers.length,
        totalBikes: bikes.length,
        totalBookings: bookings.length,
        pendingBookings,
        inProgressBookings,
        completedServices,
        totalRevenue,
        outstandingRevenue,
        totalMechanics: mechanics.length,
        activeServices: services.filter((s) => s.isActive).length,
        statusCounts,
        databaseMode: db.isMongoMode() ? 'MongoDB Atlas' : 'Local Store',
      },
      recentBookings: bookings.slice(0, 6),
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

router.get('/customers', async (_req, res) => {
  try {
    const [customers, bikes, bookings] = await Promise.all([
      db.listCustomers(),
      db.listBikes(),
      db.listBookings(),
    ]);

    const enriched = customers.map((c) => ({
      ...c,
      bikes: bikes.filter((b) => b.customerId === c.id),
      bookingCount: bookings.filter((bk) => bk.customerId === c.id).length,
    }));

    res.json({ customers: enriched });
  } catch (err) {
    console.error('[Admin] Customers list error:', err);
    res.status(500).json({ error: 'Failed to load customers.' });
  }
});

const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Full name is required.'),
  email: z.string().trim().email('Valid email is required.'),
  phone: z.string().trim().min(7, 'Valid phone number is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

router.post('/customers', async (req, res) => {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid customer data.' });
      return;
    }
    const existing = await db.findUserByEmail(parsed.data.email);
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const created = await db.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: 'customer',
    });
    res.status(201).json({
      customer: {
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role,
        createdAt: created.createdAt,
        bikes: [],
        bookingCount: 0,
      },
    });
  } catch (err) {
    console.error('[Admin] Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer.' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).optional(),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().min(7).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid customer update.' });
      return;
    }
    const updated = await db.updateUser(String(req.params.id), parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json({ customer: updated });
  } catch (err) {
    console.error('[Admin] Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const deleted = await db.deleteCustomer(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json({ message: 'Customer and associated records deleted.' });
  } catch (err) {
    console.error('[Admin] Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer.' });
  }
});

export default router;
