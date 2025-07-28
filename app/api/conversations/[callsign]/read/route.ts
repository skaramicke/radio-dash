import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

interface Params {
  callsign: string;
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { callsign } = params;
    await database.markConversationAsRead(callsign);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
