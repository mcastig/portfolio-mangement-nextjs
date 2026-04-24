/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/portfolio/[username]/contact/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/email', () => ({
  sendContactEmail: jest.fn().mockResolvedValue(undefined),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };
const { sendContactEmail } = require('@/lib/email') as { sendContactEmail: jest.Mock };

function makeRequest(username: string, body: object) {
  return new NextRequest(`http://localhost:3000/api/portfolio/${username}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/portfolio/[username]/contact', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest('testuser', { senderEmail: 'a@b.com' });
    const res = await POST(req, { params: Promise.resolve({ username: 'testuser' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/all fields are required/i);
  });

  it('returns 400 when message is absent', async () => {
    const req = makeRequest('testuser', { senderEmail: 'a@b.com', senderName: 'Alice' });
    const res = await POST(req, { params: Promise.resolve({ username: 'testuser' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 when portfolio user does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const req = makeRequest('nobody', {
      senderEmail: 'a@b.com',
      senderName: 'Alice',
      message: 'Hello',
    });
    const res = await POST(req, { params: Promise.resolve({ username: 'nobody' }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/portfolio not found/i);
  });

  it('sends the email and returns 200 on success', async () => {
    query.mockResolvedValueOnce({ rows: [{ email: 'owner@example.com' }], rowCount: 1 });
    const req = makeRequest('janedev', {
      senderEmail: 'sender@example.com',
      senderName: 'Alice',
      message: 'Hello there!',
    });
    const res = await POST(req, { params: Promise.resolve({ username: 'janedev' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/sent successfully/i);
    expect(sendContactEmail).toHaveBeenCalledWith(
      'owner@example.com',
      'sender@example.com',
      'Alice',
      'Hello there!'
    );
  });
});
