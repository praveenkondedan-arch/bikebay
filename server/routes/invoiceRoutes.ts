import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import {
  authenticate,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';

const router = Router();

const createInvoiceSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required.'),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, 'Line item description is required.'),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .min(1, 'At least one billing item is required.'),
  taxRate: z.coerce.number().min(0).max(50).default(18),
  discount: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(['Unpaid', 'Paid']).default('Unpaid'),
  notes: z.string().trim().optional(),
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const customerId = req.user.role === 'admin' ? undefined : req.user.id;
    const invoices = await db.listInvoices(customerId);
    res.json({ invoices });
  } catch (err) {
    console.error('[Invoices] List error:', err);
    res.status(500).json({ error: 'Failed to load invoices.' });
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const invoice = await db.findInvoiceById(String(req.params.id));
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found.' });
      return;
    }
    if (req.user.role !== 'admin' && invoice.customerId !== req.user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.json({ invoice });
  } catch (err) {
    console.error('[Invoices] Detail error:', err);
    res.status(500).json({ error: 'Failed to load invoice.' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid invoice details.' });
      return;
    }

    const booking = await db.findBookingById(parsed.data.bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const existing = await db.findInvoiceByBookingId(booking.id);
    if (existing) {
      res.status(409).json({ error: 'An invoice has already been generated for this booking.' });
      return;
    }

    const computedItems = parsed.data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: Math.round(item.quantity * item.unitPrice),
    }));

    const created = await db.createInvoice({
      bookingId: booking.id,
      customerId: booking.customerId,
      bikeId: booking.bikeId,
      items: computedItems,
      taxRate: parsed.data.taxRate,
      discount: parsed.data.discount,
      paymentStatus: parsed.data.paymentStatus,
      notes: parsed.data.notes,
    });

    const populated = await db.findInvoiceById(created.id);
    res.status(201).json({ invoice: populated || created });
  } catch (err) {
    console.error('[Invoices] Create error:', err);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
});

router.patch(
  '/:id/payment',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const schema = z.object({
        paymentStatus: z.enum(['Unpaid', 'Paid']),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payment status.' });
        return;
      }
      const updated = await db.updateInvoicePayment(
        String(req.params.id),
        parsed.data.paymentStatus
      );
      if (!updated) {
        res.status(404).json({ error: 'Invoice not found.' });
        return;
      }
      res.json({ invoice: updated });
    } catch (err) {
      console.error('[Invoices] Payment update error:', err);
      res.status(500).json({ error: 'Failed to update payment status.' });
    }
  }
);

export default router;
