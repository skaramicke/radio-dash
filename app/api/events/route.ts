import { NextRequest } from 'next/server';
import { js8CallAPI } from '@/lib/js8call';
import { database } from '@/lib/database';

// Keep track of connected clients
const clients = new Set<ReadableStreamDefaultController>();

// Initialize JS8Call connection and event handlers
let isInitialized = false;

async function initializeJS8Call() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    await js8CallAPI.connect();
    console.log('JS8Call API connected');

    // Handle incoming messages
    js8CallAPI.on('rx.text', async (message) => {
      await handleIncomingMessage(message);
    });

    js8CallAPI.on('connected', () => {
      broadcast({ type: 'connection:status', data: { connected: true } });
    });

    js8CallAPI.on('disconnected', () => {
      broadcast({ type: 'connection:status', data: { connected: false } });
    });

    // Periodic updates
    setInterval(async () => {
      try {
        const [callsign, grid, freqInfo] = await Promise.all([
          js8CallAPI.getStationCallsign(),
          js8CallAPI.getStationGrid(),
          js8CallAPI.getFrequency()
        ]);

        broadcast({
          type: 'station:info',
          data: {
            callsign,
            grid,
            frequency: freqInfo.freq
          }
        });
      } catch (error) {
        console.error('Error fetching periodic updates:', error);
      }
    }, 10000);

  } catch (error) {
    console.error('Failed to initialize JS8Call:', error);
  }
}

async function handleIncomingMessage(jsMessage: { value?: string; params?: Record<string, unknown> }) {
  try {
    const text = jsMessage.value || '';
    if (!text.trim()) return;

    // Parse JS8Call message format
    const parts = text.split(':');
    if (parts.length < 2) return;

    const fromCallsign = parts[0].trim();
    const messageText = parts.slice(1).join(':').trim();
    
    // Get our station callsign
    const myCallsign = await js8CallAPI.getStationCallsign();
    
    // Determine if this is directed at us or general
    const isDirected = messageText.toLowerCase().includes(myCallsign.toLowerCase());
    const conversation = isDirected ? fromCallsign : '@allcall';

    // Store message in database
    const message = {
      conversation,
      from: fromCallsign,
      to: isDirected ? myCallsign : '@allcall',
      text: messageText,
      timestamp: Date.now(),
      direction: 'incoming' as const,
      isRead: false
    };

    const messageId = await database.addMessage(message);
    const savedMessage = { ...message, id: messageId };

    // Update conversation
    await database.updateConversation(conversation, messageText, message.timestamp);
    
    // Increment unread count
    if (isDirected) {
      await database.incrementUnreadCount(fromCallsign);
    } else {
      await database.incrementUnreadCount('@allcall');
    }

    // Broadcast to all clients
    broadcast({
      type: 'message:new',
      data: savedMessage
    });

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

function broadcast(message: { type: string; data: unknown }) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  
  clients.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      // Client disconnected, remove from set
      clients.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  // Initialize JS8Call connection
  await initializeJS8Call();

  const stream = new ReadableStream({
    start(controller) {
      // Add client to set
      clients.add(controller);

      // Send initial connection status
      const initialData = `data: ${JSON.stringify({
        type: 'connection:status',
        data: { connected: js8CallAPI.connected }
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(initialData));

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
