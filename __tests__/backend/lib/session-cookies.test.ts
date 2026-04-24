/** @jest-environment node */
import { setSessionCookie, clearSessionCookie, getSession, signToken } from '@/lib/session';

const mockCookieStore = { get: jest.fn() };

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const { cookies } = require('next/headers') as { cookies: jest.Mock };

describe('setSessionCookie', () => {
  it('returns a Set-Cookie string containing the token', () => {
    const cookie = setSessionCookie('test-token');
    expect(cookie).toContain('portfolio_session=test-token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('includes a Max-Age of 7 days', () => {
    const cookie = setSessionCookie('test-token');
    expect(cookie).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
  });
});

describe('clearSessionCookie', () => {
  it('returns a Set-Cookie string that immediately expires the session', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('portfolio_session=;');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
  });
});

describe('getSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when no session cookie is present', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    cookies.mockResolvedValue(mockCookieStore);
    expect(await getSession()).toBeNull();
  });

  it('returns the session payload for a valid token', async () => {
    const token = signToken({ userId: 'user-123', email: 'test@example.com' });
    mockCookieStore.get.mockReturnValue({ value: token });
    cookies.mockResolvedValue(mockCookieStore);
    const session = await getSession();
    expect(session?.userId).toBe('user-123');
    expect(session?.email).toBe('test@example.com');
  });

  it('returns null when the cookie contains an invalid token', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'not-a-valid-jwt' });
    cookies.mockResolvedValue(mockCookieStore);
    expect(await getSession()).toBeNull();
  });
});
