/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/profile/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

const { query } = require('@/lib/db') as { query: jest.Mock };
const { getSession } = require('@/lib/session') as { getSession: jest.Mock };

const MOCK_SESSION = { userId: 'user-123', email: 'test@example.com' };
const MOCK_USER = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  job_title: 'Developer',
  bio: 'Hello world',
  profile_image: null,
  github_username: null,
};

describe('GET /api/user/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns the user profile when authenticated', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe(MOCK_USER.email);
    expect(data.name).toBe(MOCK_USER.name);
  });

  it('returns 404 when user is not found', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET();
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/user/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('updates the profile and returns 200', async () => {
    getSession.mockResolvedValueOnce(MOCK_SESSION);
    query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', job_title: 'Engineer', bio: 'Updated bio' }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/updated/i);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users'),
      expect.arrayContaining(['New Name'])
    );
  });
});
