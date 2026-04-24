/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/reset-password/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt'),
  setSessionCookie: jest
    .fn()
    .mockReturnValue('portfolio_session=mock-jwt; HttpOnly; Path=/'),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/user/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_TOKEN_ROW = {
  id: 'tok-1',
  user_id: 'user-123',
  expires_at: new Date(Date.now() + 3600 * 1000),
  used: false,
};

describe('POST /api/user/reset-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({ password: 'Password1!' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ token: 'some-token' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeRequest({ token: 'some-token', password: 'short' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/8 characters/i);
  });

  it('returns 400 when token is not found in the database', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await POST(makeRequest({ token: 'invalid', password: 'Password1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid or expired/i);
  });

  it('returns 400 when token has already been used', async () => {
    query.mockResolvedValueOnce({
      rows: [{ ...VALID_TOKEN_ROW, used: true }],
      rowCount: 1,
    });
    const res = await POST(makeRequest({ token: 'used-token', password: 'Password1!' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/expired or already been used/i);
  });

  it('returns 400 when token has expired', async () => {
    query.mockResolvedValueOnce({
      rows: [{ ...VALID_TOKEN_ROW, expires_at: new Date(Date.now() - 1000) }],
      rowCount: 1,
    });
    const res = await POST(makeRequest({ token: 'expired', password: 'Password1!' }));
    expect(res.status).toBe(400);
  });

  it('resets the password and sets session cookie on success', async () => {
    query
      .mockResolvedValueOnce({ rows: [VALID_TOKEN_ROW], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE users
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE tokens
      .mockResolvedValueOnce({
        rows: [{ id: 'user-123', email: 'test@example.com' }],
        rowCount: 1,
      });

    const res = await POST(makeRequest({ token: 'valid-token', password: 'Password1!' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/reset successfully/i);
    expect(res.headers.get('Set-Cookie')).toContain('portfolio_session');
  });
});
