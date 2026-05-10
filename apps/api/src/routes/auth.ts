import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

// --- Validation Schemas ---
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// --- Register ---
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        travelDnaProfile: JSON.stringify({ style: 'adventurer', budget: 'medium', interests: [] }),
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'register', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Login ---
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'login', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, travelDnaProfile: user.travelDnaProfile }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Refresh Token ---
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// --- Guest Auth (Demo mode) ---
router.post('/guest', async (req: Request, res: Response) => {
  try {
    let guest = await prisma.user.findFirst({ where: { email: 'guest@traveloop.com' } });
    if (!guest) {
      guest = await prisma.user.create({
        data: {
          email: 'guest@traveloop.com',
          passwordHash: await bcrypt.hash('guest-demo-2026', 10),
          name: 'Guest Explorer',
          travelDnaProfile: JSON.stringify({ style: 'adventurer', budget: 'medium', interests: ['food', 'culture'] }),
        }
      });
    }
    const token = jwt.sign({ userId: guest.id, email: guest.email, isGuest: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: guest.id, email: guest.email, name: guest.name, isGuest: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

export default router;
