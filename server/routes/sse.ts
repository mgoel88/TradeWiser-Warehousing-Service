import express from 'express';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = express.Router();

// In-memory store for active SSE connections
const clients: { [userId: string]: express.Response } = {};

// SSE endpoint
router.get('/:userId', (req, res, next) => {
  // EventSource does not support custom headers, so we pass the token as a query parameter.
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticateJWT, (req, res) => {
  const userId = req.params.userId;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Store the client connection
  clients[userId] = res;
  console.log(`SSE client connected: ${userId}`);

  // Send a welcome message
  res.write('data: {"message": "SSE connection established"}\n\n');

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE client disconnected: ${userId}`);
    delete clients[userId];
  });
});

// Function to broadcast updates to a specific user
export function broadcastToUser(userId: string, data: any) {
  const client = clients[userId];
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export default router;
