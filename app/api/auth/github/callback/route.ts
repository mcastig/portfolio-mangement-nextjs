import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/session';
import { cookies } from 'next/headers';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/signin?error=github_auth_failed`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/signin?error=github_auth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });

    const tokenData: GitHubTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${APP_URL}/signin?error=github_auth_failed`);
    }

    // Fetch GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const githubUser: GitHubUser = await userRes.json();

    // Get primary email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails: GitHubEmail[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || null;
    }

    if (!email) {
      return NextResponse.redirect(`${APP_URL}/signin?error=no_github_email`);
    }

    const githubId = String(githubUser.id);

    // Upsert user
    const existing = await query<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE github_id = $1 OR email = $2',
      [githubId, email.toLowerCase()]
    );

    let userId: string;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await query(
        'UPDATE users SET github_id = $1, github_username = $2, name = COALESCE(name, $3), email_verified = TRUE, updated_at = NOW() WHERE id = $4',
        [githubId, githubUser.login, githubUser.name || githubUser.login, userId]
      );
    } else {
      const result = await query<{ id: string }>(
        'INSERT INTO users (email, github_id, github_username, name, email_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id',
        [email.toLowerCase(), githubId, githubUser.login, githubUser.name || githubUser.login]
      );
      userId = result.rows[0].id;
    }

    const token = signToken({ userId, email: email.toLowerCase() });
    const response = NextResponse.redirect(`${APP_URL}/settings/profile`);
    response.headers.set('Set-Cookie', setSessionCookie(token));
    response.headers.append('Set-Cookie', 'oauth_state=; Path=/; Max-Age=0');
    return response;
  } catch {
    return NextResponse.redirect(`${APP_URL}/signin?error=github_auth_failed`);
  }
}
