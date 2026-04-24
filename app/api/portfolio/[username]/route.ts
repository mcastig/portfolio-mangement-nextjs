import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const userResult = await query<{
      id: string; name: string; job_title: string; bio: string; profile_image: string; email: string;
    }>(
      'SELECT id, name, job_title, bio, profile_image, email FROM users WHERE github_username = $1 OR id::text = $1',
      [username]
    );

    const user = userResult.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const projectsResult = await query(
      'SELECT id, name, demo_url, repo_url, description, image_url FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    return NextResponse.json({ user, projects: projectsResult.rows });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
