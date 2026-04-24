/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/forgot-password/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock-reset-token' }),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };
const { sendPasswordResetEmail } = require('@/lib/email') as { sendPasswordResetEmail: jest.Mock };

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/user/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/user/forgot-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 200 with generic message when email does not exist (prevents enumeration)', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await POST(makeRequest({ email: 'nobody@example.com' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/if an account exists/i);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends reset email and stores token when email exists', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'user-123' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', 'mock-reset-token');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO password_reset_tokens'),
      expect.any(Array)
    );
  });
});
