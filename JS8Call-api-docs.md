# JS8Call TCP API Documentation

## Overview

JS8Call provides a TCP-based API that allows external applications to control and interact with the JS8Call software. The API uses JSON messages sent over TCP connections to enable automation, logging integration, and custom user interfaces.

## Connection Setup

### Configuration

The TCP server can be configured through the JS8Call settings:
- **Host/IP Address**: Interface to bind the server to (default: localhost)
- **Port**: TCP port number (default: 2442)
- **Max Connections**: Maximum number of concurrent client connections
- **Enable TCP Server**: Master switch to enable/disable the TCP API

### Connecting

1. Enable the TCP server in JS8Call settings
2. Connect to the configured host and port using a TCP client
3. Send and receive JSON messages over the connection

## Message Format

All API messages use JSON format with the following structure:

```json
{
  "type": "COMMAND.ACTION",
  "value": "optional_string_value",
  "params": {
    "_ID": 12345,
    "additional_param": "value"
  }
}
```

### Message Fields

- **type** (required): Command type in format `CATEGORY.ACTION`
- **value** (optional): String value associated with the command
- **params** (optional): Object containing additional parameters
- **_ID** (auto-generated): Unique message identifier for request/response correlation

### Response Format

Responses follow the same JSON structure. The `_ID` field in responses matches the request `_ID` to correlate requests with responses.

## API Commands

### RIG Control

#### Get Current Frequency
```json
Request:  {"type": "RIG.GET_FREQ"}
Response: {
  "type": "RIG.FREQ",
  "value": "",
  "params": {
    "_ID": 12345,
    "FREQ": 14078000,
    "DIAL": 14078000,
    "OFFSET": 1500
  }
}
```
- **FREQ**: Total frequency (dial + offset) in Hz
- **DIAL**: Dial frequency in Hz
- **OFFSET**: Audio offset frequency in Hz

#### Set Frequency
```json
Request: {
  "type": "RIG.SET_FREQ",
  "params": {
    "DIAL": 14078000,
    "OFFSET": 1500
  }
}
```
- **DIAL** (optional): Set dial frequency in Hz
- **OFFSET** (optional): Set audio offset in Hz
- Either or both parameters can be provided

### Station Information

#### Get Station Callsign
```json
Request:  {"type": "STATION.GET_CALLSIGN"}
Response: {
  "type": "STATION.CALLSIGN",
  "value": "N0CALL",
  "params": {"_ID": 12345}
}
```

#### Get Grid Locator
```json
Request:  {"type": "STATION.GET_GRID"}
Response: {
  "type": "STATION.GRID",
  "value": "FN20",
  "params": {"_ID": 12345}
}
```

#### Set Grid Locator
```json
Request: {
  "type": "STATION.SET_GRID",
  "value": "FN20"
}
Response: {
  "type": "STATION.GRID",
  "value": "FN20",
  "params": {"_ID": 12345}
}
```

#### Get Station Info
```json
Request:  {"type": "STATION.GET_INFO"}
Response: {
  "type": "STATION.INFO",
  "value": "Station information text",
  "params": {"_ID": 12345}
}
```

#### Set Station Info
```json
Request: {
  "type": "STATION.SET_INFO",
  "value": "New station information"
}
Response: {
  "type": "STATION.INFO",
  "value": "New station information",
  "params": {"_ID": 12345}
}
```

#### Get Station Status
```json
Request:  {"type": "STATION.GET_STATUS"}
Response: {
  "type": "STATION.STATUS",
  "value": "Current status message",
  "params": {"_ID": 12345}
}
```

#### Set Station Status
```json
Request: {
  "type": "STATION.SET_STATUS",
  "value": "New status message"
}
Response: {
  "type": "STATION.STATUS",
  "value": "New status message",
  "params": {"_ID": 12345}
}
```

### Receive (RX) Functions

#### Get Call Activity
```json
Request:  {"type": "RX.GET_CALL_ACTIVITY"}
Response: {
  "type": "RX.CALL_ACTIVITY",
  "value": "",
  "params": {
    "_ID": 12345,
    "N0CALL": {
      "SNR": -15,
      "GRID": "FN20",
      "UTC": 1627234567890
    },
    "W1AW": {
      "SNR": -8,
      "GRID": "FN41",
      "UTC": 1627234600000
    }
  }
}
```
Returns active callsigns with their signal reports, grid squares, and timestamps. Only includes callsigns within the configured aging time.

#### Get Selected Callsign
```json
Request:  {"type": "RX.GET_CALL_SELECTED"}
Response: {
  "type": "RX.CALL_SELECTED",
  "value": "N0CALL",
  "params": {"_ID": 12345}
}
```

#### Get Band Activity
```json
Request:  {"type": "RX.GET_BAND_ACTIVITY"}
Response: {
  "type": "RX.BAND_ACTIVITY",
  "value": "",
  "params": {
    "_ID": 12345,
    "1500": {
      "FREQ": 14079500,
      "DIAL": 14078000,
      "OFFSET": 1500,
      "TEXT": "N0CALL: Hello world",
      "SNR": -12,
      "UTC": 1627234567890
    }
  }
}
```
Returns recent activity by frequency offset, showing the latest message for each active frequency.

#### Get Received Text
```json
Request:  {"type": "RX.GET_TEXT"}
Response: {
  "type": "RX.TEXT",
  "value": "Recent received text content...",
  "params": {"_ID": 12345}
}
```
Returns the last 1024 characters from the RX text window.

### Transmit (TX) Functions

#### Get TX Text
```json
Request:  {"type": "TX.GET_TEXT"}
Response: {
  "type": "TX.TEXT",
  "value": "Current message to transmit",
  "params": {"_ID": 12345}
}
```
Returns the last 1024 characters from the TX message field.

#### Set TX Text
```json
Request: {
  "type": "TX.SET_TEXT",
  "value": "New message to add to TX buffer"
}
Response: {
  "type": "TX.TEXT",
  "value": "Updated TX buffer content...",
  "params": {"_ID": 12345}
}
```
Adds text to the TX message buffer and returns the updated content.

#### Send Message
```json
Request: {
  "type": "TX.SEND_MESSAGE",
  "value": "Message to send immediately"
}
```
Queues the message for immediate transmission. No response is sent for this command.

### Mode Control

#### Get Speed Mode
```json
Request:  {"type": "MODE.GET_SPEED"}
Response: {
  "type": "MODE.SPEED",
  "value": "",
  "params": {
    "_ID": 12345,
    "SPEED": 0
  }
}
```

Speed values:
- **0**: JS8 Normal
- **1**: JS8 Fast  
- **2**: JS8 Turbo
- **4**: JS8 Slow
- **8**: JS8 Ultra

#### Set Speed Mode
```json
Request: {
  "type": "MODE.SET_SPEED",
  "params": {
    "SPEED": 1
  }
}
Response: {
  "type": "MODE.SPEED",
  "value": "",
  "params": {
    "_ID": 12345,
    "SPEED": 1
  }
}
```

### Inbox/Messaging

#### Get Messages
```json
Request: {
  "type": "INBOX.GET_MESSAGES",
  "params": {
    "CALLSIGN": "N0CALL"
  }
}
Response: {
  "type": "INBOX.MESSAGES",
  "value": "",
  "params": {
    "_ID": 12345,
    "MESSAGES": [
      {
        "type": "STORE",
        "params": {
          "FROM": "W1AW",
          "TO": "N0CALL",
          "TEXT": "Hello there!",
          "UTC": 1627234567890
        }
      }
    ]
  }
}
```
- **CALLSIGN** (optional): Filter messages for specific callsign. Use "%" or omit for all messages.
- Returns up to 1000 messages sorted by timestamp (newest first)

#### Store Message
```json
Request: {
  "type": "INBOX.STORE_MESSAGE",
  "params": {
    "CALLSIGN": "N0CALL",
    "TEXT": "Message to store"
  }
}
Response: {
  "type": "INBOX.MESSAGE",
  "value": "",
  "params": {
    "_ID": 12345,
    "ID": 42
  }
}
```
Stores a message in the inbox and returns the message ID.

### Window Control

#### Raise Window
```json
Request: {"type": "WINDOW.RAISE"}
```
Brings the JS8Call window to the foreground. No response is sent.

### Utility Commands

#### Ping
```json
Request: {"type": "PING"}
```
Simple connectivity test. No response is sent, but the connection remains active.

## Error Handling

### Connection Errors

When the maximum number of connections is reached:
```json
{
  "type": "API.ERROR",
  "value": "Connections Full"
}
```

### JSON Parsing Errors

For invalid JSON syntax:
```json
{
  "type": "API.ERROR",
  "value": "Invalid JSON (unparsable)"
}
```

For JSON that isn't an object:
```json
{
  "type": "API.ERROR",
  "value": "Invalid JSON (not an object)"
}
```

### Unrecognized Commands

For unknown command types, no response is sent, but a debug message is logged:
```
Unable to process networkMessage: UNKNOWN.COMMAND
```

## Connection Management

- **Multiple Connections**: The server supports multiple concurrent client connections
- **Connection Limits**: When the maximum connection count is reached, new connections cause the oldest connections to be closed (FIFO)
- **Automatic Cleanup**: Disconnected clients are automatically removed from the connection pool
- **Message Queuing**: Each client maintains a request queue for proper request/response correlation

## Best Practices

1. **Include _ID**: Always include an `_ID` parameter for commands that expect responses
2. **Handle Disconnects**: Implement reconnection logic as the server may close connections when capacity is reached
3. **Parse Responses**: Always validate JSON responses before processing
4. **Rate Limiting**: Avoid sending commands too rapidly to prevent overwhelming the application
5. **Error Handling**: Implement proper error handling for connection failures and API errors

## Example Client Code

### Python Example
```python
import socket
import json
import time

class JS8CallAPI:
    def __init__(self, host='localhost', port=2442):
        self.host = host
        self.port = port
        self.socket = None
        self.message_id = 1
    
    def connect(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((self.host, self.port))
        return self.socket.makefile('rw')
    
    def send_command(self, command_type, value="", params=None):
        if params is None:
            params = {}
        
        params["_ID"] = self.message_id
        self.message_id += 1
        
        message = {
            "type": command_type,
            "value": value,
            "params": params
        }
        
        with self.connect() as f:
            f.write(json.dumps(message) + '\n')
            f.flush()
            
            response = f.readline()
            return json.loads(response)

# Usage example
api = JS8CallAPI()
freq_info = api.send_command("RIG.GET_FREQ")
print(f"Current frequency: {freq_info['params']['FREQ']} Hz")
```

### JavaScript/Node.js Example
```javascript
const net = require('net');

class JS8CallAPI {
    constructor(host = 'localhost', port = 2442) {
        this.host = host;
        this.port = port;
        this.messageId = 1;
    }
    
    sendCommand(commandType, value = '', params = {}) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            
            params._ID = this.messageId++;
            
            const message = {
                type: commandType,
                value: value,
                params: params
            };
            
            client.connect(this.port, this.host, () => {
                client.write(JSON.stringify(message) + '\n');
            });
            
            client.on('data', (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
                client.destroy();
            });
            
            client.on('error', reject);
        });
    }
}

// Usage example
const api = new JS8CallAPI();
api.sendCommand('STATION.GET_CALLSIGN')
    .then(response => console.log(`Callsign: ${response.value}`))
    .catch(console.error);
```

## Planned Features

The following commands are planned but not yet implemented:

- `MAIN.RX` - Turn on RX mode
- `MAIN.TX` - Start transmission
- `MAIN.PTT` - PTT control
- `MAIN.TUNE` - Start tuning
- `MAIN.HALT` - Halt operation
- `MAIN.AUTO` - Auto mode control
- `MAIN.SPOT` - Spotting control
- `MAIN.HB` - Heartbeat functionality

These commands are mentioned in the source code but do not currently have implementations.
