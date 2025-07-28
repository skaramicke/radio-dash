import net from 'net';
import { EventEmitter } from 'events';

export interface JS8CallMessage {
  type: string;
  value?: string;
  params?: {
    _ID?: number;
    [key: string]: unknown;
  };
}

export interface StationInfo {
  callsign: string;
  grid: string;
  frequency: number;
  dial: number;
  offset: number;
}

export interface CallActivity {
  [callsign: string]: {
    SNR: number;
    GRID: string;
    UTC: number;
  };
}

export interface BandActivity {
  [offset: string]: {
    FREQ: number;
    DIAL: number;
    OFFSET: number;
    TEXT: string;
    SNR: number;
    UTC: number;
  };
}

export class JS8CallAPI extends EventEmitter {
  private host: string;
  private port: number;
  private messageId: number = 1;
  private socket: net.Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private buffer: string = '';

  constructor(host: string = 'localhost', port: number = 2442) {
    super();
    this.host = host;
    this.port = port;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.socket = new net.Socket();
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.buffer = '';
        console.log('Connected to JS8Call API');
        this.emit('connected');
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        console.log('Disconnected from JS8Call API');
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.socket.on('error', (error) => {
        console.error('JS8Call API connection error:', error);
        this.emit('error', error);
        if (!this.isConnected) {
          reject(error);
        }
      });

      this.socket.connect(this.port, this.host);
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();
    
    // Process complete JSON messages (separated by newlines)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message: JS8CallMessage = JSON.parse(line);
          this.emit('message', message);
          this.processMessage(message);
        } catch (error) {
          console.error('Error parsing JS8Call message:', error, 'Raw data:', line);
        }
      }
    }
  }

  private processMessage(message: JS8CallMessage): void {
    switch (message.type) {
      case 'RX.ACTIVITY':
      case 'RX.TEXT':
        this.emit('rx.text', message);
        break;
      case 'RX.CALL_ACTIVITY':
        this.emit('rx.call_activity', message);
        break;
      case 'RX.BAND_ACTIVITY':
        this.emit('rx.band_activity', message);
        break;
      case 'STATION.CALLSIGN':
        this.emit('station.callsign', message);
        break;
      case 'RIG.FREQ':
        this.emit('rig.frequency', message);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect to JS8Call...');
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, 5000); // Reconnect after 5 seconds
  }

  async sendCommand(type: string, value: string = '', params: Record<string, unknown> = {}): Promise<JS8CallMessage | null> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to JS8Call');
    }

    const messageId = this.messageId++;
    const message: JS8CallMessage = {
      type,
      value,
      params: {
        ...params,
        _ID: messageId
      }
    };

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not available'));
        return;
      }

      // Set up response handler
      const responseTimeout = setTimeout(() => {
        this.removeListener('message', responseHandler);
        resolve(null); // Some commands don't return responses
      }, 5000);

      const responseHandler = (response: JS8CallMessage) => {
        if (response.params?._ID === messageId) {
          clearTimeout(responseTimeout);
          this.removeListener('message', responseHandler);
          resolve(response);
        }
      };

      this.on('message', responseHandler);

      // Send the message
      const messageString = JSON.stringify(message) + '\n';
      this.socket.write(messageString, (error) => {
        if (error) {
          clearTimeout(responseTimeout);
          this.removeListener('message', responseHandler);
          reject(error);
        }
      });
    });
  }

  // Convenience methods for common operations
  async getStationCallsign(): Promise<string> {
    const response = await this.sendCommand('STATION.GET_CALLSIGN');
    return response?.value || '';
  }

  async getStationGrid(): Promise<string> {
    const response = await this.sendCommand('STATION.GET_GRID');
    return response?.value || '';
  }

  async getFrequency(): Promise<{ freq: number; dial: number; offset: number }> {
    const response = await this.sendCommand('RIG.GET_FREQ');
    if (response?.params) {
      return {
        freq: response.params.FREQ as number || 0,
        dial: response.params.DIAL as number || 0,
        offset: response.params.OFFSET as number || 0
      };
    }
    return { freq: 0, dial: 0, offset: 0 };
  }

  async getCallActivity(): Promise<CallActivity> {
    const response = await this.sendCommand('RX.GET_CALL_ACTIVITY');
    if (response?.params) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _ID, ...activity } = response.params;
      return activity as CallActivity;
    }
    return {};
  }

  async getBandActivity(): Promise<BandActivity> {
    const response = await this.sendCommand('RX.GET_BAND_ACTIVITY');
    if (response?.params) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _ID, ...activity } = response.params;
      return activity as BandActivity;
    }
    return {};
  }

  async sendMessage(text: string): Promise<void> {
    await this.sendCommand('TX.SEND_MESSAGE', text);
  }

  async setTxText(text: string): Promise<void> {
    await this.sendCommand('TX.SET_TEXT', text);
  }

  async getRxText(): Promise<string> {
    const response = await this.sendCommand('RX.GET_TEXT');
    return response?.value || '';
  }

  async getTxText(): Promise<string> {
    const response = await this.sendCommand('TX.GET_TEXT');
    return response?.value || '';
  }

  async ping(): Promise<void> {
    await this.sendCommand('PING');
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance for the application
export const js8CallAPI = new JS8CallAPI();
