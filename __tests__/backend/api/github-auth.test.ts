/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET as githubGet } from '@/app/api/auth/github/route';
import { GET as callbackGet } from '@/app/api/auth/github/callback/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt'),
  setSessionCookie: jest
    .fn()
    .mockReturnValue('portfolio_session=mock-jwt; HttpOnly; Path=/'),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const { query } = require('@/lib/db') as { query: jest.Mock };
const { cookies: mockCookies } = require('next/headers') as { cookies: jest.Mock };
global.fetch = jest.fn();

const VALID_STATE = 'test-oauth-state';
const mockCookiesGet = jest.fn();

const MOCK_TOKEN = {
  access_token: 'gho_test_token',
  token_type: 'bearer',
  scope: 'user:email',
};
const MOCK_GITHUB_USER = {
  id: 12345,
  login: 'testuser',
  name: 'Test User',
  email: 'test@github.com',
  avatar_url: 'https://avatars.github.com/u/12345',
};

describe('GET /api/auth/github', () => {
  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CALLBACK_URL =
      'http://localhost:3000/api/auth/github/callback';
  });

  it('redirects to the GitHub OAuth authorization URL', async () => {
    const res = await githubGet();
    expect(res.status).toBe(307);
    const location = res.headers.get('Location') ?? '';
    expect(location).toContain('https://github.com/login/oauth/authorize');
    expect(location).toContain('test-client-id');
    expect(location).toContain('scope=user:email');
  });
});

describe('GET /api/auth/github/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL =
      'http://localhost:3000/api/auth/github/callback';
    mockCookies.mockResolvedValue({ get: mockCookiesGet });
    mockCookiesGet.mockReturnValue({ value: VALID_STATE });
  });

  it('redirects with error when no code in query string', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/github/callback');
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toContain('github_auth_failed');
  });

  it('redirects with error when GitHub token exchange fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => ({}) });
    const req = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=bad-code&state=${VALID_STATE}`
    );
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toContain('github_auth_failed');
  });

  it('redirects with error when no email can be obtained from GitHub', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => MOCK_TOKEN })
      .mockResolvedValueOnce({ json: async () => ({ ...MOCK_GITHUB_USER, email: null }) })
      .mockResolvedValueOnce({ json: async () => [] });
    const req = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=code123&state=${VALID_STATE}`
    );
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toContain('no_github_email');
  });

  it('creates a new user and redirects to settings on first OAuth login', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => MOCK_TOKEN })
      .mockResolvedValueOnce({ json: async () => MOCK_GITHUB_USER });
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 'new-user' }], rowCount: 1 });

    const req = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=auth-code&state=${VALID_STATE}`
    );
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toBe('http://localhost:3000/settings/profile');
    expect(res.headers.getSetCookie().some(c => c.includes('portfolio_session'))).toBe(true);
  });

  it('updates an existing user and redirects to settings on repeat login', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => MOCK_TOKEN })
      .mockResolvedValueOnce({ json: async () => MOCK_GITHUB_USER });
    query
      .mockResolvedValueOnce({
        rows: [{ id: 'existing-id', email: 'test@github.com' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const req = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=auth-code&state=${VALID_STATE}`
    );
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toBe('http://localhost:3000/settings/profile');
  });

  it('fetches email from GitHub emails API when user has no public email', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => MOCK_TOKEN })
      .mockResolvedValueOnce({ json: async () => ({ ...MOCK_GITHUB_USER, email: null }) })
      .mockResolvedValueOnce({
        json: async () => [
          { email: 'private@github.com', primary: true, verified: true },
        ],
      });
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 'new-user' }], rowCount: 1 });

    const req = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=auth-code&state=${VALID_STATE}`
    );
    const res = await callbackGet(req);
    expect(res.headers.get('Location')).toBe('http://localhost:3000/settings/profile');
  });
});
