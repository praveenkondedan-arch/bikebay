import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/store.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

const mechanicSchema = z.object({
  name: z.string().trim().min(2, 'Mechanic name is required.'),
  phone: z.string().trim().min(7, 'Valid phone number is required.'),
  specialty: z.string().trim().min(2, 'Specialty is required.'),
  isAvailable: z.boolean().optional(),
});

router.get('/', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const mechanics = await db.listMechanics();
    res.json({ mechanics });
  } catch (err) {
    console.error('[Mechanics] List error:', err);
    res.status(500).json({ error: 'Failed to load mechanics.' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const parsed = mechanicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid mechanic data.' });
      return;
    }
    const mechanic = await db.createMechanic({
      name: parsed.data.name,
      phone: parsed.data.phone,
      specialty: parsed.data.specialty,
      isAvailable: parsed.data.isAvailable ?? true,
    });
    res.status(201).json({ mechanic });
  } catch (err) {
    console.error('[Mechanics] Create error:', err);
    res.status(500).json({ error: 'Failed to add mechanic.' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const parsed = mechanicSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid mechanic data.' });
      return;
    }
    const updated = await db.updateMechanic(String(req.params.id), parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Mechanic not found.' });
      return;
    }
    res.json({ mechanic: updated });
  } catch (err) {
    console.error('[Mechanics] Update error:', err);
    res.status(500).json({ error: 'Failed to update mechanic.' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await db.deleteMechanic(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Mechanic not found.' });
      return;
    }
    res.json({ message: 'Mechanic removed.' });
  } catch (err) {
    console.error('[Mechanics] Delete error:', err);
    res.status(500).json({ error: 'Failed to remove mechanic.' });
  }
});

export default router;
