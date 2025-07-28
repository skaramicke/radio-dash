import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { js8CallAPI, BandActivity } from './js8call';
import { database, Message } from './database';

export interface StationInfo {
  callsign: string;
  grid: string;
  frequency: number;
  dial: number;
  offset: number;
}

export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'conversation:updated': (conversation: { callsign: string; unreadCount: number }) => void;
  'connection:status': (status: { connected: boolean }) => void;
  'station:info': (info: { callsign: string; grid: string; frequency: number }) => void;
  'activity:call': (activity: Record<string, { SNR: number; GRID: string; UTC: number }>) => void;
  'activity:band': (activity: BandActivity) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: { to: string; text: string }, callback: (success: boolean) => void) => void;
  'conversation:read': (callsign: string) => void;
  'station:get': (callback: (info: StationInfo | null) => void) => void;
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initializeSocketIO(httpServer: HttpServer) {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Initialize JS8Call connection
  initializeJS8Call();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current connection status
    socket.emit('connection:status', { connected: js8CallAPI.connected });

    // Handle message sending
    socket.on('message:send', async (data, callback) => {
      try {
        await js8CallAPI.sendMessage(`${data.to} ${data.text}`);
        
        // Store outgoing message in database
        const message: Omit<Message, 'id'> = {
          conversation: data.to === '@allcall' ? '@allcall' : data.to,
          from: await js8CallAPI.getStationCallsign() || 'UNKNOWN',
          to: data.to,
          text: data.text,
          timestamp: Date.now(),
          direction: 'outgoing',
          isRead: true
        };

        const messageId = await database.addMessage(message);
        const savedMessage = { ...message, id: messageId };
        
        // Update conversation
        await database.updateConversation(message.conversation, data.text, message.timestamp);
        
        // Broadcast to all clients
        io?.emit('message:new', savedMessage);
        
        callback(true);
      } catch (error) {
        console.error('Error sending message:', error);
        callback(false);
      }
    });

    // Handle marking conversation as read
    socket.on('conversation:read', async (callsign) => {
      try {
        await database.markConversationAsRead(callsign);
        io?.emit('conversation:updated', { callsign, unreadCount: 0 });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    });

    // Handle station info request
    socket.on('station:get', async (callback) => {
      try {
        const [callsign, grid, freqInfo] = await Promise.all([
          js8CallAPI.getStationCallsign(),
          js8CallAPI.getStationGrid(),
          js8CallAPI.getFrequency()
        ]);

        callback({
          callsign,
          grid,
          frequency: freqInfo.freq,
          dial: freqInfo.dial,
          offset: freqInfo.offset
        });
      } catch (error) {
        console.error('Error getting station info:', error);
        callback(null);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

async function initializeJS8Call() {
  try {
    await js8CallAPI.connect();
    
    // Set up event handlers for incoming messages
    js8CallAPI.on('connected', () => {
      io?.emit('connection:status', { connected: true });
    });

    js8CallAPI.on('disconnected', () => {
      io?.emit('connection:status', { connected: false });
    });

    js8CallAPI.on('rx.text', async (message) => {
      await handleIncomingMessage(message);
    });

    js8CallAPI.on('rx.call_activity', (message) => {
      if (message.params) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _ID, ...activity } = message.params;
        io?.emit('activity:call', activity);
      }
    });

    js8CallAPI.on('rx.band_activity', (message) => {
      if (message.params) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _ID, ...activity } = message.params;
        io?.emit('activity:band', activity);
      }
    });

    // Periodically fetch station info and activity
    setInterval(async () => {
      try {
        const [callsign, grid, freqInfo, callActivity] = await Promise.all([
          js8CallAPI.getStationCallsign(),
          js8CallAPI.getStationGrid(),
          js8CallAPI.getFrequency(),
          js8CallAPI.getCallActivity()
        ]);

        io?.emit('station:info', {
          callsign,
          grid,
          frequency: freqInfo.freq
        });

        io?.emit('activity:call', callActivity);
      } catch (error) {
        console.error('Error fetching periodic updates:', error);
      }
    }, 10000); // Every 10 seconds

  } catch (error) {
    console.error('Failed to connect to JS8Call:', error);
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
    const message: Omit<Message, 'id'> = {
      conversation,
      from: fromCallsign,
      to: isDirected ? myCallsign : '@allcall',
      text: messageText,
      timestamp: Date.now(),
      direction: 'incoming',
      isRead: false
    };

    const messageId = await database.addMessage(message);
    const savedMessage = { ...message, id: messageId };

    // Update conversation
    await database.updateConversation(conversation, messageText, message.timestamp);
    
    // Increment unread count for directed messages
    if (isDirected) {
      await database.incrementUnreadCount(fromCallsign);
      io?.emit('conversation:updated', { 
        callsign: fromCallsign, 
        unreadCount: await getUnreadCount(fromCallsign) 
      });
    } else {
      await database.incrementUnreadCount('@allcall');
      io?.emit('conversation:updated', { 
        callsign: '@allcall', 
        unreadCount: await getUnreadCount('@allcall') 
      });
    }

    // Broadcast message to all clients
    io?.emit('message:new', savedMessage);

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

async function getUnreadCount(callsign: string): Promise<number> {
  try {
    const conversations = await database.getConversations();
    const conversation = conversations.find(c => c.callsign === callsign);
    return conversation?.unreadCount || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export function getSocketIO() {
  return io;
}
