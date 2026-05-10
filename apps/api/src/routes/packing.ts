import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get packing list for a trip
router.get('/:tripId', async (req, res) => {
  try {
    let packingList = await prisma.packingList.findUnique({
      where: { tripId: req.params.tripId }
    });

    // If no list exists, generate a smart default one for the demo
    if (!packingList) {
      const defaultItems = JSON.stringify([
        { name: "Passport & Visas", isChecked: true, category: "Essentials" },
        { name: "Universal Adapter", isChecked: false, category: "Tech" },
        { name: "Portable Charger", isChecked: false, category: "Tech" },
        { name: "First Aid Kit", isChecked: false, category: "Health" },
        { name: "Rain Jacket", isChecked: false, category: "Clothing" }
      ]);
      
      packingList = await prisma.packingList.create({
        data: {
          tripId: req.params.tripId,
          items: defaultItems
        }
      });
    }

    res.json(JSON.parse(packingList.items));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packing list' });
  }
});

// Update packing list
router.put('/:tripId', async (req, res) => {
  try {
    const { items } = req.body;
    const packingList = await prisma.packingList.update({
      where: { tripId: req.params.tripId },
      data: { items: JSON.stringify(items) }
    });
    res.json(JSON.parse(packingList.items));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update packing list' });
  }
});

export default router;
