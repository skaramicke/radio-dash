import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'messages.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface Message {
  id?: number;
  conversation: string; // callsign or '@allcall'
  from: string;
  to: string;
  text: string;
  timestamp: number;
  snr?: number;
  frequency?: number;
  direction: 'incoming' | 'outgoing';
  isRead: boolean;
}

export interface Conversation {
  callsign: string;
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount: number;
  snr?: number;
  grid?: string;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTables();
  }

  private initTables(): void {
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation TEXT NOT NULL,
        from_callsign TEXT NOT NULL,
        to_callsign TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        snr INTEGER,
        frequency INTEGER,
        direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
        is_read BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        callsign TEXT PRIMARY KEY,
        last_message TEXT,
        last_timestamp INTEGER,
        unread_count INTEGER DEFAULT 0,
        snr INTEGER,
        grid TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);
    `;

    this.db.serialize(() => {
      this.db.run(createMessagesTable);
      this.db.run(createConversationsTable);
      this.db.run(createIndexes);
      
      // Insert @allcall conversation if it doesn't exist
      this.db.run(`
        INSERT OR IGNORE INTO conversations (callsign, last_message, unread_count) 
        VALUES ('@allcall', 'General calling frequency', 0)
      `);
    });
  }

  async addMessage(message: Omit<Message, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO messages (conversation, from_callsign, to_callsign, text, timestamp, snr, frequency, direction, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        message.conversation,
        message.from,
        message.to,
        message.text,
        message.timestamp,
        message.snr || null,
        message.frequency || null,
        message.direction,
        message.isRead ? 1 : 0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getMessages(conversation: string, limit: number = 100): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, conversation, from_callsign as 'from', to_callsign as 'to', 
               text, timestamp, snr, frequency, direction, is_read as isRead
        FROM messages 
        WHERE conversation = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      this.db.all(sql, [conversation, limit], (err, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows as Message[]).reverse()); // Reverse to show oldest first
        }
      });
    });
  }

  async getConversations(): Promise<Conversation[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT callsign, last_message as lastMessage, last_timestamp as lastTimestamp, 
               unread_count as unreadCount, snr, grid
        FROM conversations 
        ORDER BY last_timestamp DESC NULLS LAST, callsign ASC
      `;
      
      this.db.all(sql, [], (err, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Conversation[]);
        }
      });
    });
  }

  async updateConversation(callsign: string, lastMessage: string, timestamp: number, snr?: number, grid?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO conversations (callsign, last_message, last_timestamp, snr, grid, unread_count, updated_at)
        VALUES (?, ?, ?, ?, ?, 
          COALESCE((SELECT unread_count FROM conversations WHERE callsign = ?), 0),
          CURRENT_TIMESTAMP)
      `;
      
      this.db.run(sql, [callsign, lastMessage, timestamp, snr || null, grid || null, callsign], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async incrementUnreadCount(callsign: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE conversations 
        SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE callsign = ?
      `;
      
      this.db.run(sql, [callsign], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async markConversationAsRead(callsign: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Mark all messages in conversation as read
        this.db.run(`
          UPDATE messages 
          SET is_read = 1 
          WHERE conversation = ? AND is_read = 0
        `, [callsign]);

        // Reset unread count
        this.db.run(`
          UPDATE conversations 
          SET unread_count = 0, updated_at = CURRENT_TIMESTAMP
          WHERE callsign = ?
        `, [callsign], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const database = new Database();
