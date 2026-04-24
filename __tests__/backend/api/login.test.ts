/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/login/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt'),
  setSessionCookie: jest.fn().mockReturnValue('portfolio_session=mock-jwt; HttpOnly; Path=/'),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };
const bcrypt = require('bcrypt') as { compare: jest.Mock };

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const MOCK_USER = { id: 'user-123', email: 'test@example.com', password_hash: 'hashed' };

describe('POST /api/user/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when credentials are missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await POST(makeRequest({ email: 'nobody@example.com', password: 'pass' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/invalid email or password/i);
  });

  it('returns 401 when password is incorrect', async () => {
    query.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });
    bcrypt.compare.mockResolvedValueOnce(false);
    const res = await POST(makeRequest({ email: 'test@example.com', password: 'wrongpass' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 and sets session cookie on success', async () => {
    query.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });
    bcrypt.compare.mockResolvedValueOnce(true);
    const res = await POST(makeRequest({ email: 'test@example.com', password: 'Password1!' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/logged in/i);
    expect(res.headers.get('Set-Cookie')).toContain('portfolio_session');
  });
});
