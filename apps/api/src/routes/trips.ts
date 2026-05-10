import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check auth would go here
// router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    let { title, destination, latitude, longitude, startDate, endDate, budgetLimit, ownerId, days } = req.body;
    
    // For Hackathon Demo: If no ownerId, create a guest user
    if (!ownerId) {
      let guest = await prisma.user.findFirst({ where: { email: 'guest@traveloop.com' } });
      if (!guest) {
        guest = await prisma.user.create({
          data: { email: 'guest@traveloop.com', passwordHash: 'mock', name: 'Guest Explorer' }
        });
      }
      ownerId = guest.id;
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        destination,
        latitude,
        longitude,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budgetLimit,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER'
          }
        },
        days: days ? {
          create: days.map((day: any) => ({
            date: new Date(day.date || Date.now()),
            activities: {
              create: day.activities.map((act: any) => ({
                title: act.title,
                type: act.type || 'SIGHTSEEING',
                costEstimate: act.cost || 0
              }))
            }
          }))
        } : undefined
      }
    });
    res.json(trip);
  } catch (error: any) {
    console.error('Failed to create trip:', error);
    res.status(500).json({ error: 'Failed to create trip', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        days: {
          include: { activities: true }
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        expenses: true
      }
    });
    
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Add activity to a day
router.post('/days/:dayId/activities', async (req, res) => {
  try {
    const { title, type, startTime, costEstimate } = req.body;
    const activity = await prisma.activity.create({
      data: {
        dayId: req.params.dayId,
        title,
        type: type || 'SIGHTSEEING',
        startTime: startTime ? new Date(startTime) : null,
        costEstimate: Number(costEstimate) || 0
      }
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Add expense to a trip
router.post('/:tripId/expenses', async (req, res) => {
  try {
    const { amount, category, date } = req.body;
    const expense = await prisma.expense.create({
      data: {
        tripId: req.params.tripId,
        amount: Number(amount),
        category,
        date: new Date(date || Date.now())
      }
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get trip expenses
router.get('/:tripId/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

export default router;
