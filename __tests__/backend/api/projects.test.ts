/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/projects/route';
import { DELETE } from '@/app/api/user/projects/[id]/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

const { query } = require('@/lib/db') as { query: jest.Mock };
const { getSession } = require('@/lib/session') as { getSession: jest.Mock };

const MOCK_SESSION = { userId: 'user-123', email: 'test@example.com' };
const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'Music Player', demo_url: 'https://demo.com', repo_url: null, description: 'A music app', image_url: null },
  { id: 'proj-2', name: 'Movie Search', demo_url: null, repo_url: 'https://github.com/repo', description: null, image_url: null },
];

describe('GET /api/user/projects', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns list of projects when authenticated', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: MOCK_PROJECTS, rowCount: 2 });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Music Player');
  });
});

describe('PUT /api/user/projects', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when project name is missing', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    const req = new NextRequest('http://localhost:3000/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo_url: 'https://demo.com' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('creates a new project and returns 201', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [{ id: 'new-proj-id' }], rowCount: 1 });

    const req = new NextRequest('http://localhost:3000/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project', description: 'A great project' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('new-proj-id');
  });

  it('updates an existing project and returns 200', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query
      .mockResolvedValueOnce({ rows: [{ id: 'proj-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const req = new NextRequest('http://localhost:3000/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'proj-1', name: 'Updated Name' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/updated/i);
  });
});

describe('DELETE /api/user/projects/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/projects/proj-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when project does not belong to user', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new NextRequest('http://localhost:3000/api/user/projects/other-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'other-id' }) });
    expect(res.status).toBe(404);
  });

  it('deletes the project and returns 200', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const req = new NextRequest('http://localhost:3000/api/user/projects/proj-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/deleted/i);
  });
});
