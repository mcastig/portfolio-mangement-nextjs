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

    const result = await query(
      'SELECT id, name, demo_url, repo_url, description, image_url FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [session.userId]
    );

    return NextResponse.json(result.rows);
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
    const { id, name, demo_url, repo_url, description, image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    if (name.length > 255) {
      return NextResponse.json({ error: 'Project name must be under 255 characters' }, { status: 400 });
    }
    if (description && description.length > 2000) {
      return NextResponse.json({ error: 'Description must be under 2000 characters' }, { status: 400 });
    }
    if (demo_url && !isValidHttpUrl(demo_url)) {
      return NextResponse.json({ error: 'Demo URL must be a valid http/https URL' }, { status: 400 });
    }
    if (repo_url && !isValidHttpUrl(repo_url)) {
      return NextResponse.json({ error: 'Repo URL must be a valid http/https URL' }, { status: 400 });
    }
    if (image_url && !isValidHttpUrl(image_url)) {
      return NextResponse.json({ error: 'Image URL must be a valid http/https URL' }, { status: 400 });
    }

    if (id) {
      // Update existing project
      const existing = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, session.userId]
      );
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      await query(
        'UPDATE projects SET name = $1, demo_url = $2, repo_url = $3, description = $4, image_url = $5, updated_at = NOW() WHERE id = $6 AND user_id = $7',
        [name, demo_url || null, repo_url || null, description || null, image_url || null, id, session.userId]
      );
      return NextResponse.json({ message: 'Project updated' });
    } else {
      // Create new project
      const result = await query<{ id: string }>(
        'INSERT INTO projects (user_id, name, demo_url, repo_url, description, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [session.userId, name, demo_url || null, repo_url || null, description || null, image_url || null]
      );
      return NextResponse.json({ message: 'Project created', id: result.rows[0].id }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
