import { NextResponse } from 'next/server';
import { js8CallAPI } from '@/lib/js8call';

export async function GET() {
  try {
    const [callsign, grid, freqInfo] = await Promise.all([
      js8CallAPI.getStationCallsign(),
      js8CallAPI.getStationGrid(),
      js8CallAPI.getFrequency()
    ]);

    return NextResponse.json({
      callsign,
      grid,
      frequency: freqInfo.freq,
      dial: freqInfo.dial,
      offset: freqInfo.offset,
      connected: js8CallAPI.connected
    });
  } catch (error) {
    console.error('Error getting station info:', error);
    return NextResponse.json({ 
      error: 'Unable to connect to JS8Call',
      connected: false 
    }, { status: 503 });
  }
}
