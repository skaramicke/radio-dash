# Radio Dash - JS8Call Chat Interface

A modern, intuitive chat application that interfaces with JS8Call's TCP API to provide a sleek messaging experience for amateur radio operators.

## Features

- **Modern Chat Interface**: Clean, Discord-like UI with conversation tabs
- **Real-time Messaging**: Instant message updates via WebSocket connection
- **Conversation Management**: Automatic conversation creation when mentioned
- **Message History**: Persistent SQLite database storage
- **Station Information**: Display current frequency, callsign, and grid
- **Connection Status**: Visual indicators for JS8Call connection status
- **Unread Counters**: Track unread messages per conversation
- **All Call Support**: General calling frequency monitoring

## Prerequisites

- **JS8Call**: Must be installed and running
- **Node.js**: Version 16 or higher
- **npm**: Node package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd radio-dash
```

2. Install dependencies:
```bash
npm install
```

3. Configure JS8Call:
   - Open JS8Call
   - Go to **File > Settings**
   - Navigate to **Reporting** tab
   - Enable **TCP Server**
   - Set **TCP Server Port** to `2442` (default)
   - Set **TCP Server Network Interface** to `127.0.0.1` (localhost)
   - Click **OK** to save settings

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:3000`

3. Ensure JS8Call is running with TCP server enabled

4. Start chatting! The interface will automatically:
   - Create conversation tabs when someone mentions your callsign
   - Show all general activity in the "@allcall" tab
   - Store message history in a local SQLite database
   - Display connection status and station information

## Architecture

### Backend Components

- **JS8Call API Client** (`lib/js8call.ts`): Handles TCP connection to JS8Call
- **Database Layer** (`lib/database.ts`): SQLite database for message persistence
- **Socket.IO Server** (`lib/socket.ts`): Real-time WebSocket communication
- **API Routes** (`app/api/`): REST endpoints for data access

### Frontend Components

- **Chat Interface** (`components/ChatApp.tsx`): Main React component
- **Real-time Updates**: Socket.IO client for live message updates
- **Responsive Design**: Tailwind CSS for modern styling

### Database Schema

**Messages Table:**
- `id`: Primary key
- `conversation`: Callsign or '@allcall'
- `from_callsign`: Sender callsign
- `to_callsign`: Recipient callsign
- `text`: Message content
- `timestamp`: Unix timestamp
- `snr`: Signal-to-noise ratio (optional)
- `frequency`: Frequency in Hz (optional)
- `direction`: 'incoming' or 'outgoing'
- `is_read`: Boolean read status

**Conversations Table:**
- `callsign`: Primary key (conversation identifier)
- `last_message`: Most recent message text
- `last_timestamp`: Timestamp of last activity
- `unread_count`: Number of unread messages
- `snr`: Latest signal report
- `grid`: Station grid square

## API Endpoints

- `GET /api/conversations` - Fetch all conversations
- `GET /api/messages?conversation=<callsign>` - Fetch messages for conversation
- `PUT /api/conversations/<callsign>/read` - Mark conversation as read
- `GET /api/station` - Get station information

## JS8Call API Integration

The application uses JS8Call's TCP API for:

- **RIG.GET_FREQ**: Current frequency information
- **STATION.GET_CALLSIGN**: Local station callsign
- **STATION.GET_GRID**: Local station grid square
- **RX.GET_CALL_ACTIVITY**: Active stations list
- **RX.GET_BAND_ACTIVITY**: Band activity monitoring
- **TX.SEND_MESSAGE**: Transmit messages
- **RX.TEXT**: Monitor incoming messages

## Configuration

### Environment Variables

Create a `.env.local` file for custom configuration:

```
PORT=3000
JS8CALL_HOST=localhost
JS8CALL_PORT=2442
```

### JS8Call Settings

Recommended JS8Call configuration:
- **TCP Server**: Enabled
- **Port**: 2442
- **Interface**: 127.0.0.1 (localhost)
- **Max Connections**: 10+

## Development

### Project Structure

```
radio-dash/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   └── ChatApp.tsx        # Main chat interface
├── lib/                   # Utility libraries
│   ├── database.ts        # SQLite database
│   ├── js8call.ts         # JS8Call API client
│   └── socket.ts          # Socket.IO server
├── data/                  # SQLite database files
├── server.ts              # Custom server with Socket.IO
└── README.md
```

### Development Commands

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Adding Features

1. **Database Changes**: Modify `lib/database.ts` and update schema
2. **API Changes**: Add routes in `app/api/`
3. **UI Changes**: Update `components/ChatApp.tsx`
4. **JS8Call Integration**: Extend `lib/js8call.ts`

## Troubleshooting

### JS8Call Connection Issues

1. **Check JS8Call TCP Server**: Ensure it's enabled in settings
2. **Port Conflicts**: Verify port 2442 is not in use by other applications
3. **Firewall**: Allow JS8Call and Radio Dash through firewall
4. **Network Interface**: Use 127.0.0.1 (localhost) for local connections

### Common Issues

- **"Not connected to JS8Call"**: Enable TCP server in JS8Call settings
- **Database errors**: Check file permissions in `data/` directory
- **Port in use**: Change PORT environment variable
- **Missing messages**: Verify JS8Call is actively receiving

## License

This project is released under the MIT License. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check JS8Call documentation for API details
- Review console logs for error messages
- Ensure all prerequisites are met
- Test with minimal JS8Call configuration

---

**Note**: This application requires JS8Call to be running with TCP server enabled. It's designed for amateur radio operators familiar with JS8Call operation.
