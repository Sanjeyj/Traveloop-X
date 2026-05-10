import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; isGuest?: boolean };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isGuest?: boolean };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Guest-fallback auth: if no token → create/use guest user automatically (demo mode)
export async function authOrGuestMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isGuest?: boolean };
      req.user = payload;
      return next();
    } catch {
      // Fall through to guest
    }
  }

  // Auto-create guest user for demo
  try {
    let guest = await prisma.user.findFirst({ where: { email: 'guest@traveloop.com' } });
    if (!guest) {
      const bcrypt = await import('bcryptjs');
      guest = await prisma.user.create({
        data: {
          email: 'guest@traveloop.com',
          passwordHash: await bcrypt.hash('guest-demo-2026', 10),
          name: 'Guest Explorer',
          travelDnaProfile: JSON.stringify({ style: 'adventurer', budget: 'medium', interests: ['food', 'culture'] }),
        }
      });
    }
    req.user = { userId: guest.id, email: guest.email, isGuest: true };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize session' });
  }
}
