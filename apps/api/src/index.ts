import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import packingRoutes from './routes/packing';
import expenseRoutes from './routes/expenses';
import journalRoutes from './routes/journal';
import adminRoutes from './routes/admin';
import weatherRoutes from './routes/weather';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- CORS ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// --- Security Headers ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:8000', 'ws://localhost:3001'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

app.use(globalLimiter);

// --- Health Check ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Traveloop X API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);

// --- Socket.IO ---
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track connected users per trip room
const tripRooms: Record<string, Set<string>> = {};

io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);

  socket.on('join-trip', (roomId: string, userInfo?: { name: string; color: string }) => {
    socket.join(roomId);
    if (!tripRooms[roomId]) tripRooms[roomId] = new Set();
    tripRooms[roomId].add(socket.id);

    // Broadcast to room that a new user joined
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      name: userInfo?.name || `User_${socket.id.slice(0, 4)}`,
      color: userInfo?.color || '#06b6d4',
    });

    // Tell the new user how many are in the room
    socket.emit('room-info', { participants: tripRooms[roomId].size });
    console.log(`[Socket] User ${socket.id} joined trip ${roomId}`);
  });

  socket.on('cursor-move', (data: { roomId: string; x: number; y: number; name: string; color: string }) => {
    socket.to(data.roomId).emit('cursor-update', {
      id: socket.id,
      x: data.x,
      y: data.y,
      name: data.name,
      color: data.color,
    });
  });

  // Collaborative edits
  socket.on('activity-added', (data: { roomId: string; activity: any }) => {
    socket.to(data.roomId).emit('activity-added', data.activity);
  });

  socket.on('activity-voted', (data: { roomId: string; activityId: string; votes: number }) => {
    socket.to(data.roomId).emit('activity-voted', data);
  });

  socket.on('budget-updated', (data: { roomId: string; spent: number; currency: string }) => {
    socket.to(data.roomId).emit('budget-updated', data);
  });

  socket.on('disconnect', () => {
    // Remove from all rooms
    for (const [roomId, users] of Object.entries(tripRooms)) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) delete tripRooms[roomId];
        io.to(roomId).emit('user-disconnected', socket.id);
      }
    }
    console.log('[Socket] Disconnected:', socket.id);
  });
});

// --- Global Error Handler ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// --- Start ---
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Traveloop X API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: PostgreSQL`);
  console.log(`   WebSocket: enabled\n`);
});
