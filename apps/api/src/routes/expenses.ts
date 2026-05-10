import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const ExpenseSchema = z.object({
  title: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  category: z.enum(['Food', 'Transport', 'Stay', 'Activity', 'Shopping', 'Other']),
  date: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  addedBy: z.string().optional(),
});

// Add expense to trip
router.post('/:tripId', async (req: Request, res: Response) => {
  try {
    const parsed = ExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });

    const { title, amount, currency, category, date, receiptUrl, addedBy } = parsed.data;
    const expense = await prisma.expense.create({
      data: {
        tripId: req.params.tripId,
        title,
        amount,
        currency,
        category,
        date: date ? new Date(date) : new Date(),
        receiptUrl,
        addedBy,
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get expenses for trip
router.get('/:tripId', async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { date: 'desc' },
    });

    // Aggregate by category
    const byCategory = expenses.reduce((acc: Record<string, number>, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ expenses, byCategory, total });
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Delete expense
router.delete('/:expenseId', async (req: Request, res: Response) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.expenseId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
