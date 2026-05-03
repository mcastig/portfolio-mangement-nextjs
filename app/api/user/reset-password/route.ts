import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 });
    }

    const result = await query<{ id: string; user_id: string; expires_at: Date; used: boolean }>(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    const resetToken = result.rows[0];
    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (resetToken.used || new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired or already been used' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      password_hash,
      resetToken.user_id,
    ]);
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetToken.id]);

    const userResult = await query<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE id = $1',
      [resetToken.user_id]
    );
    const user = userResult.rows[0];
    const sessionToken = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ message: 'Password reset successfully' });
    response.headers.set('Set-Cookie', setSessionCookie(sessionToken));
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
