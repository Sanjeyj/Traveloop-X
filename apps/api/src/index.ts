import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import packingRoutes from './routes/packing';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // TODO: restrict in production
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Traveloop X API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/packing', packingRoutes);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join-trip', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined trip ${roomId}`);
  });

  socket.on('cursor-move', (data) => {
    // Broadcast to everyone else in the room
    socket.to(data.roomId).emit('cursor-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Let all rooms know this cursor is gone
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
