import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { setupSocketHandlers } from './sockets/socketHandlers.js';
import roomRoutes from './routes/roomRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

setupSocketHandlers(io);

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Orbit Canvas API' });
});

// API Routes
app.use('/api', roomRoutes);
app.use('/api', aiRoutes);

// Static Client Fallback (Single Service Deployment on Railway / Heroku / Render)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving static React SPA from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

import { migrateBase64Previews } from './migrations/migratePreviewBase64.js';

async function startServer() {
  await connectDB();
  await migrateBase64Previews();
  server.listen(PORT, () => {
    console.log(`[Server] Orbit Canvas backend listening on port ${PORT}`);
  });
}

startServer();

export { app, server, io };
