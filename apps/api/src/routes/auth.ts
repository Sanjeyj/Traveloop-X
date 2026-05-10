import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Mock password hashing for hackathon speed (Use bcrypt in prod)
const hashPassword = (password: string) => Buffer.from(password).toString('base64');
const checkPassword = (password: string, hash: string) => hashPassword(password) === hash;

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        travelDnaProfile: JSON.stringify({ style: "adventurer", budget: "medium" })
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !checkPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
