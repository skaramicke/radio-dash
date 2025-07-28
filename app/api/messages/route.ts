import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversation = searchParams.get('conversation');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation parameter required' }, { status: 400 });
    }

    const messages = await database.getMessages(conversation, limit);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, from, to, text, timestamp, direction, isRead, snr, frequency } = body;

    if (!conversation || !from || !to || !text || !direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messageId = await database.addMessage({
      conversation,
      from,
      to,
      text,
      timestamp: timestamp || Date.now(),
      direction,
      isRead: isRead || false,
      snr,
      frequency
    });

    return NextResponse.json({ id: messageId, success: true });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
