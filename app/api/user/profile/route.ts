import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<{
      id: string; email: string; name: string; job_title: string;
      bio: string; profile_image: string; github_username: string;
    }>(
      'SELECT id, email, name, job_title, bio, profile_image, github_username FROM users WHERE id = $1',
      [session.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, job_title, bio, profile_image } = body;

    if (name && name.length > 255) {
      return NextResponse.json({ error: 'Name must be under 255 characters' }, { status: 400 });
    }
    if (job_title && job_title.length > 255) {
      return NextResponse.json({ error: 'Job title must be under 255 characters' }, { status: 400 });
    }
    if (bio && bio.length > 2000) {
      return NextResponse.json({ error: 'Bio must be under 2000 characters' }, { status: 400 });
    }
    if (profile_image && !isValidHttpUrl(profile_image)) {
      return NextResponse.json({ error: 'Profile image must be a valid http/https URL' }, { status: 400 });
    }

    await query(
      'UPDATE users SET name = $1, job_title = $2, bio = $3, profile_image = $4, updated_at = NOW() WHERE id = $5',
      [name || null, job_title || null, bio || null, profile_image || null, session.userId]
    );

    return NextResponse.json({ message: 'Profile updated' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
