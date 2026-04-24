/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/signup/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt'),
  setSessionCookie: jest.fn().mockReturnValue('portfolio_session=mock-jwt; HttpOnly; Path=/'),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/user/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/user/signup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', password: 'Password1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid email/i);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeRequest({ email: 'test@example.com', password: 'short' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/8 characters/i);
  });

  it('returns 409 when email is already in use', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }], rowCount: 1 });
    const res = await POST(makeRequest({ email: 'taken@example.com', password: 'Password1!' }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/already in use/i);
  });

  it('creates a user and sets session cookie on success', async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', email: 'new@example.com' }], rowCount: 1 });

    const res = await POST(makeRequest({ email: 'new@example.com', password: 'Password1!' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toMatch(/created/i);
    expect(res.headers.get('Set-Cookie')).toContain('portfolio_session');
  });
});
