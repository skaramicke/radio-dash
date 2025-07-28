import { NextRequest, NextResponse } from 'next/server';
import { js8CallAPI } from '@/lib/js8call';
import { database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { to, text } = await request.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send message via JS8Call
    await js8CallAPI.sendMessage(`${to} ${text}`);
    
    // Store outgoing message in database
    const myCallsign = await js8CallAPI.getStationCallsign() || 'UNKNOWN';
    
    const message = {
      conversation: to === '@allcall' ? '@allcall' : to,
      from: myCallsign,
      to,
      text,
      timestamp: Date.now(),
      direction: 'outgoing' as const,
      isRead: true
    };

    const messageId = await database.addMessage(message);
    
    // Update conversation
    await database.updateConversation(message.conversation, text, message.timestamp);
    
    return NextResponse.json({ 
      success: true, 
      message: { ...message, id: messageId }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
