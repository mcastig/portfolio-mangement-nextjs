/** @jest-environment node */
import { POST } from '@/app/api/user/logout/route';

jest.mock('@/lib/session', () => ({
  clearSessionCookie: jest
    .fn()
    .mockReturnValue('portfolio_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'),
}));

describe('POST /api/user/logout', () => {
  it('returns 200 and clears the session cookie', async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/logged out/i);
    expect(res.headers.get('Set-Cookie')).toContain('portfolio_session=;');
  });
});
