import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'traveloop-admin-2026';

// Simple admin token check
function adminAuth(req: Request, res: Response, next: Function) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.use(adminAuth as any);

// Live Metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTrips,
      totalActivities,
      totalExpenses,
      recentTrips,
      popularDestinations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.activity.count(),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trip.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, destination: true, createdAt: true }
      }),
      prisma.trip.groupBy({
        by: ['destination'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
    ]);

    const auditLogs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      metrics: {
        totalUsers,
        totalTrips,
        totalActivities,
        totalExpensesTracked: totalExpenses._sum.amount || 0,
      },
      recentTrips,
      popularDestinations: popularDestinations.map(d => ({
        destination: d.destination,
        count: d._count.id,
      })),
      auditLogs,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
});

// Growth data (trips per day last 30 days)
router.get('/growth', async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trips = await prisma.trip.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      byDay[key] = 0;
    }
    for (const trip of trips) {
      const key = trip.createdAt.toISOString().split('T')[0];
      if (byDay[key] !== undefined) byDay[key]++;
    }

    res.json(Object.entries(byDay).map(([date, count]) => ({ date, count })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch growth data' });
  }
});

export default router;
