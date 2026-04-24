import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL!;
  const scope = 'user:email';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}`;

  return NextResponse.redirect(githubAuthUrl);
}
