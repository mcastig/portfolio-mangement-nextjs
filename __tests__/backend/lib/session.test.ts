/** @jest-environment node */
import { signToken, verifyToken } from '@/lib/session';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const PAYLOAD = { userId: 'user-123', email: 'test@example.com' };

describe('session utilities', () => {
  describe('signToken', () => {
    it('returns a JWT string', () => {
      const token = signToken(PAYLOAD);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('embeds the payload', () => {
      const token = signToken(PAYLOAD);
      const decoded = verifyToken(token);
      expect(decoded?.userId).toBe(PAYLOAD.userId);
      expect(decoded?.email).toBe(PAYLOAD.email);
    });
  });

  describe('verifyToken', () => {
    it('returns the payload for a valid token', () => {
      const token = signToken(PAYLOAD);
      const result = verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(PAYLOAD.userId);
      expect(result?.email).toBe(PAYLOAD.email);
    });

    it('returns null for a tampered token', () => {
      const token = signToken(PAYLOAD);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(verifyToken(tampered)).toBeNull();
    });

    it('returns null for a completely invalid string', () => {
      expect(verifyToken('not-a-token')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(verifyToken('')).toBeNull();
    });
  });
});
