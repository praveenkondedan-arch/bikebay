import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import {
  authenticate,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import type { ServiceStatus } from '../models/mongooseModels.ts';

const router = Router();

const VALID_STATUSES: ServiceStatus[] = [
  'Pending',
  'Confirmed',
  'Bike Received',
  'Under Service',
  'Service Completed',
  'Delivered',
  'Rejected',
];

const createBookingSchema = z.object({
  bikeId: z.string().min(1, 'Please select a bike.'),
  serviceTypeId: z.string().min(1, 'Please select a service type.'),
  preferredDate: z.string().min(1, 'Preferred date is required.'),
  timeSlot: z.string().min(1, 'Preferred time slot is required.'),
  customerNotes: z.string().trim().optional(),
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const customerId = req.user.role === 'admin' ? undefined : req.user.id;
    let bookings = await db.listBookings(customerId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter && statusFilter !== 'All') {
      bookings = bookings.filter((b) => b.status === statusFilter);
    }
    const search = (req.query.search as string | undefined)?.toLowerCase().trim();
    if (search) {
      bookings = bookings.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(search) ||
          b.customer?.name.toLowerCase().includes(search) ||
          b.bike?.registrationNumber.toLowerCase().includes(search) ||
          b.bike?.brand.toLowerCase().includes(search) ||
          b.bike?.model.toLowerCase().includes(search) ||
          b.serviceType?.name.toLowerCase().includes(search)
      );
    }

    res.json({ bookings });
  } catch (err) {
    console.error('[Bookings] List error:', err);
    res.status(500).json({ error: 'Failed to load bookings.' });
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid booking request.' });
      return;
    }

    const bike = await db.findBikeById(parsed.data.bikeId);
    if (!bike) {
      res.status(404).json({ error: 'Selected bike not found.' });
      return;
    }
    if (req.user.role !== 'admin' && bike.customerId !== req.user.id) {
      res.status(403).json({ error: 'You can only book services for your own bikes.' });
      return;
    }

    const serviceType = await db.findServiceTypeById(parsed.data.serviceTypeId);
    if (!serviceType) {
      res.status(404).json({ error: 'Selected service type not found.' });
      return;
    }

    const created = await db.createBooking({
      customerId: bike.customerId,
      bikeId: bike.id,
      serviceTypeId: serviceType.id,
      preferredDate: parsed.data.preferredDate,
      timeSlot: parsed.data.timeSlot,
      customerNotes: parsed.data.customerNotes,
    });

    const populated = (await db.listBookings(bike.customerId)).find(
      (b) => b.id === created.id
    );
    res.status(201).json({ booking: populated || created });
  } catch (err) {
    console.error('[Bookings] Create error:', err);
    res.status(500).json({ error: 'Failed to create service booking.' });
  }
});

router.patch(
  '/:id/decision',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const decisionSchema = z.object({
        decision: z.enum(['accept', 'reject']),
        adminNotes: z.string().trim().optional(),
      });
      const parsed = decisionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid decision payload.' });
        return;
      }

      const existing = await db.findBookingById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }

      const nextStatus: ServiceStatus =
        parsed.data.decision === 'accept' ? 'Confirmed' : 'Rejected';
      const defaultNote =
        parsed.data.decision === 'accept'
          ? 'Booking accepted and confirmed by service advisor.'
          : 'Booking declined by service center.';

      const updated = await db.updateBooking(String(req.params.id), {
        status: nextStatus,
        adminNotes: parsed.data.adminNotes ?? existing.adminNotes,
        statusNote: parsed.data.adminNotes || defaultNote,
      });

      res.json({ booking: updated });
    } catch (err) {
      console.error('[Bookings] Decision error:', err);
      res.status(500).json({ error: 'Failed to process booking decision.' });
    }
  }
);

router.patch(
  '/:id/assign-mechanic',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const schema = z.object({
        mechanicId: z.string().nullable(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid mechanic ID.' });
        return;
      }

      if (parsed.data.mechanicId) {
        const mechanic = await db.findMechanicById(parsed.data.mechanicId);
        if (!mechanic) {
          res.status(404).json({ error: 'Selected mechanic not found.' });
          return;
        }
      }

      const updated = await db.updateBooking(String(req.params.id), {
        mechanicId: parsed.data.mechanicId,
      });
      if (!updated) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      res.json({ booking: updated });
    } catch (err) {
      console.error('[Bookings] Assign mechanic error:', err);
      res.status(500).json({ error: 'Failed to assign mechanic.' });
    }
  }
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const schema = z.object({
        status: z.enum(VALID_STATUSES as [ServiceStatus, ...ServiceStatus[]]),
        note: z.string().trim().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid service status.' });
        return;
      }

      const updated = await db.updateBooking(String(req.params.id), {
        status: parsed.data.status,
        statusNote:
          parsed.data.note || `Service status updated to ${parsed.data.status}.`,
        ...(parsed.data.note ? { adminNotes: parsed.data.note } : {}),
      });
      if (!updated) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      res.json({ booking: updated });
    } catch (err) {
      console.error('[Bookings] Status update error:', err);
      res.status(500).json({ error: 'Failed to update service status.' });
    }
  }
);

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const existing = await db.findBookingById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (req.user.role !== 'admin') {
      if (existing.customerId !== req.user.id) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      if (existing.status !== 'Pending') {
        res.status(400).json({ error: 'Only pending bookings can be cancelled.' });
        return;
      }
    }

    await db.deleteBooking(String(req.params.id));
    res.json({ message: 'Booking deleted.' });
  } catch (err) {
    console.error('[Bookings] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

export default router;
