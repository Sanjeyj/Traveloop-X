import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authOrGuestMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply guest-fallback auth to all trip routes
router.use(authOrGuestMiddleware as any);

const CreateTripSchema = z.object({
  title: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  budgetLimit: z.number().positive().optional(),
  theme: z.string().optional(),
  tags: z.array(z.string()).optional(),
  days: z.array(z.object({
    day: z.number(),
    date: z.string().optional(),
    title: z.string().optional(),
    activities: z.array(z.object({
      title: z.string(),
      type: z.string().optional(),
      time: z.string().optional(),
      cost: z.number().optional(),
      aiNote: z.string().optional(),
      isAiSuggested: z.boolean().optional(),
    })).optional(),
  })).optional(),
});

// --- Create Trip ---
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }

    const { title, destination, latitude, longitude, startDate, endDate, budgetLimit, theme, tags, days } = parsed.data;
    const ownerId = req.user!.userId;

    const trip = await prisma.trip.create({
      data: {
        title,
        destination,
        latitude,
        longitude,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budgetLimit,
        theme,
        tags: tags ? JSON.stringify(tags) : undefined,
        ownerId,
        members: {
          create: { userId: ownerId, role: 'OWNER' }
        },
        days: days ? {
          create: days.map((day, idx) => ({
            dayNumber: day.day || idx + 1,
            date: day.date ? new Date(day.date) : new Date(Date.now() + idx * 86400000),
            title: day.title,
            activities: day.activities ? {
              create: day.activities.map((act, actIdx) => ({
                title: act.title,
                type: (act.type?.toUpperCase() || 'SIGHTSEEING') as any,
                costEstimate: act.cost || 0,
                aiNote: act.aiNote,
                isAiSuggested: act.isAiSuggested || false,
                order: actIdx,
              }))
            } : undefined,
          }))
        } : undefined,
      },
      include: {
        days: { include: { activities: { orderBy: { order: 'asc' } } } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      }
    });

    res.status(201).json(trip);
  } catch (error: any) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip', details: error.message });
  }
});

// --- Get All Trips (for current user) ---
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        members: { some: { userId: req.user!.userId } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { days: true, expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// --- Get Single Trip ---
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: { activities: { orderBy: { order: 'asc' } } }
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
        },
        expenses: { orderBy: { date: 'desc' }, take: 20 },
        packingList: true,
      }
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// --- Update Trip ---
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, destination, budgetLimit, isPublic, theme, coverImage } = req.body;
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(destination && { destination }),
        ...(budgetLimit !== undefined && { budgetLimit }),
        ...(isPublic !== undefined && { isPublic }),
        ...(theme && { theme }),
        ...(coverImage && { coverImage }),
      }
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// --- Add Activity to Day ---
router.post('/days/:dayId/activities', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      type: z.string().optional(),
      startTime: z.string().optional(),
      costEstimate: z.number().optional(),
      locationName: z.string().optional(),
      locationLat: z.number().optional(),
      locationLng: z.number().optional(),
      aiNote: z.string().optional(),
      isAiSuggested: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

    const { title, type, startTime, costEstimate, locationName, locationLat, locationLng, aiNote, isAiSuggested } = parsed.data;

    // Get count for order
    const count = await prisma.activity.count({ where: { dayId: req.params.dayId } });

    const activity = await prisma.activity.create({
      data: {
        dayId: req.params.dayId,
        title,
        type: (type?.toUpperCase() || 'SIGHTSEEING') as any,
        startTime: startTime ? new Date(startTime) : null,
        costEstimate: Number(costEstimate) || 0,
        locationName,
        locationLat,
        locationLng,
        aiNote,
        isAiSuggested: isAiSuggested || false,
        order: count,
      }
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// --- Vote on Activity ---
router.post('/activities/:id/vote', async (req: Request, res: Response) => {
  try {
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: { votes: { increment: 1 } }
    });
    res.json(activity);
  } catch {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// --- Update Activity (weather adaptation) ---
router.patch('/activities/:id', async (req: Request, res: Response) => {
  try {
    const { title, type, aiNote, costEstimate } = req.body;
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(type && { type: type.toUpperCase() as any }),
        ...(aiNote !== undefined && { aiNote }),
        ...(costEstimate !== undefined && { costEstimate }),
      }
    });
    res.json(activity);
  } catch {
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// --- Delete Trip ---
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
