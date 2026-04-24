'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/settings/profile');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/Logo-small.svg" alt="DevPort" />
        <span>DevPort</span>
      </div>

      <div className="auth-heading">
        <h1>Login to account</h1>
        <p>Enter your credentials to access your account</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <a href="/api/auth/github" className="btn btn-dark">
          <img src="/github.svg" alt="" width={20} height={20} />
          Sign in with Github
        </a>

        <div className="divider"><span>or</span></div>

        {error && <div className="message message-error">{error}</div>}

        <input
          className="input"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <input
            className="input"
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Link href="/forgot-password" className="forgot-link">Forgot password</Link>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-link-row">
        Not a member? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
