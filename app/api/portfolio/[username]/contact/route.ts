import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendContactEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { senderEmail, senderName, message } = await request.json();

    if (!senderEmail || !senderName || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const userResult = await query<{ email: string }>(
      'SELECT email FROM users WHERE github_username = $1 OR id::text = $1',
      [username]
    );

    const user = userResult.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    await sendContactEmail(user.email, senderEmail, senderName, message);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
