import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const bikeSchema = z.object({
  customerId: z.string().optional(),
  brand: z.string().trim().min(2, 'Bike brand is required.'),
  model: z.string().trim().min(1, 'Bike model is required.'),
  registrationNumber: z
    .string()
    .trim()
    .min(4, 'Registration number must be at least 4 characters.'),
  year: z.coerce.number().int().min(1970).max(2030).optional(),
  engineCC: z.coerce.number().int().min(49).max(3000).optional(),
  notes: z.string().trim().optional(),
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const customerId =
      req.user.role === 'admin'
        ? (req.query.customerId as string | undefined)
        : req.user.id;
    const bikes = await db.listBikes(customerId);
    res.json({ bikes });
  } catch (err) {
    console.error('[Bikes] List error:', err);
    res.status(500).json({ error: 'Failed to load bikes.' });
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = bikeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid bike details.' });
      return;
    }

    const targetCustomerId =
      req.user.role === 'admin' && parsed.data.customerId
        ? parsed.data.customerId
        : req.user.id;

    const owner = await db.findUserById(targetCustomerId);
    if (!owner) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const bike = await db.createBike({
      customerId: targetCustomerId,
      brand: parsed.data.brand,
      model: parsed.data.model,
      registrationNumber: parsed.data.registrationNumber,
      year: parsed.data.year,
      engineCC: parsed.data.engineCC,
      notes: parsed.data.notes,
    });
    res.status(201).json({ bike });
  } catch (err) {
    console.error('[Bikes] Create error:', err);
    res.status(500).json({ error: 'Failed to add bike.' });
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const existing = await db.findBikeById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Bike not found.' });
      return;
    }
    if (req.user.role !== 'admin' && existing.customerId !== req.user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const parsed = bikeSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid bike update.' });
      return;
    }

    const updated = await db.updateBike(String(req.params.id), {
      brand: parsed.data.brand,
      model: parsed.data.model,
      registrationNumber: parsed.data.registrationNumber,
      year: parsed.data.year,
      engineCC: parsed.data.engineCC,
      notes: parsed.data.notes,
    });
    res.json({ bike: updated });
  } catch (err) {
    console.error('[Bikes] Update error:', err);
    res.status(500).json({ error: 'Failed to update bike.' });
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const existing = await db.findBikeById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Bike not found.' });
      return;
    }
    if (req.user.role !== 'admin' && existing.customerId !== req.user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    await db.deleteBike(String(req.params.id));
    res.json({ message: 'Bike removed.' });
  } catch (err) {
    console.error('[Bikes] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete bike.' });
  }
});

export default router;
