/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/portfolio/[username]/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));

const { query } = require('@/lib/db') as { query: jest.Mock };

const MOCK_USER = { id: 'user-123', name: 'Jane Dev', job_title: 'Frontend Developer', bio: 'Hello!', profile_image: null, email: 'jane@example.com' };
const MOCK_PROJECTS = [{ id: 'p-1', name: 'My App', demo_url: null, repo_url: null, description: null, image_url: null }];

function makeRequest(username: string) {
  return new NextRequest(`http://localhost:3000/api/portfolio/${username}`);
}

describe('GET /api/portfolio/[username]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when portfolio does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const req = makeRequest('unknown-user');
    const res = await GET(req, { params: Promise.resolve({ username: 'unknown-user' }) });
    expect(res.status).toBe(404);
  });

  it('returns user and projects for a valid github username', async () => {
    query
      .mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 })
      .mockResolvedValueOnce({ rows: MOCK_PROJECTS, rowCount: 1 });

    const req = makeRequest('janedev');
    const res = await GET(req, { params: Promise.resolve({ username: 'janedev' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.name).toBe('Jane Dev');
    expect(data.projects).toHaveLength(1);
  });

  it('returns user and projects when looking up by UUID', async () => {
    query
      .mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = makeRequest('user-123');
    const res = await GET(req, { params: Promise.resolve({ username: 'user-123' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe('jane@example.com');
    expect(data.projects).toHaveLength(0);
  });
});
