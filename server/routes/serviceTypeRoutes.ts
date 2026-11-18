import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Service name must be at least 2 characters.'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  estimatedHours: z.coerce.number().min(0.5, 'Estimated hours must be at least 0.5.'),
  isActive: z.boolean().optional(),
});

// Public catalog endpoint (optionally includes inactive for admin via ?all=true)
router.get('/', async (req, res) => {
  try {
    const includeAll = req.query.all === 'true';
    const services = await db.listServiceTypes(!includeAll);
    res.json({ services });
  } catch (err) {
    console.error('[Services] List error:', err);
    res.status(500).json({ error: 'Failed to load service types.' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid service data.' });
      return;
    }
    const created = await db.createServiceType({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      estimatedHours: parsed.data.estimatedHours,
      isActive: parsed.data.isActive ?? true,
    });
    res.status(201).json({ service: created });
  } catch (err) {
    console.error('[Services] Create error:', err);
    res.status(500).json({ error: 'Failed to create service type.' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid service data.' });
      return;
    }
    const updated = await db.updateServiceType(String(req.params.id), parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Service type not found.' });
      return;
    }
    res.json({ service: updated });
  } catch (err) {
    console.error('[Services] Update error:', err);
    res.status(500).json({ error: 'Failed to update service type.' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await db.deleteServiceType(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Service type not found.' });
      return;
    }
    res.json({ message: 'Service type deleted.' });
  } catch (err) {
    console.error('[Services] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete service type.' });
  }
});

export default router;
