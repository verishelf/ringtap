import { NextRequest, NextResponse } from 'next/server';

/**
 * Send RingTap invite email. Implement with Resend, SendGrid, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    // TODO: Send email via Resend/SendGrid with link to https://www.ringtap.me/signup
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
