import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const JournalSchema = z.object({
  tripId: z.string(),
  userId: z.string(),
  dayNumber: z.number().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  mood: z.enum(['happy', 'excited', 'tired', 'adventurous', 'relaxed', 'amazed']).optional(),
  images: z.array(z.string()).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = JournalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

    const { tripId, userId, dayNumber, title, notes, mood, images } = parsed.data;
    const entry = await prisma.journal.create({
      data: {
        tripId,
        userId,
        dayNumber,
        title,
        notes,
        mood,
        images: JSON.stringify(images || []),
      }
    });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

router.get('/:tripId', async (req: Request, res: Response) => {
  try {
    const entries = await prisma.journal.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    });
    res.json(entries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { title, notes, mood, images } = req.body;
    const entry = await prisma.journal.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(mood !== undefined && { mood }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
      }
    });
    res.json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

export default router;
