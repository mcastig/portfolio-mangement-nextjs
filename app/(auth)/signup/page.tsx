'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'one lower case character', met: /[a-z]/.test(password) },
    { label: 'one special character', met: /[^a-zA-Z0-9]/.test(password) },
    { label: 'one uppercase character', met: /[A-Z]/.test(password) },
    { label: '8 character minimum', met: password.length >= 8 },
    { label: 'one number', met: /[0-9]/.test(password) },
  ];

  return (
    <div className="pw-requirements">
      {checks.map((c) => (
        <span key={c.label} className={`pw-req${c.met ? ' met' : ''}`}>
          <img src={c.met ? '/check circle.svg' : '/check circle-1.svg'} alt="" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignUpPage() {
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
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign up failed');
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
        <h1>Create your account</h1>
        <p>Enter the fields below to get started</p>
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

        <input
          className="input"
          type="password"
          placeholder="Enter a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <PasswordRequirements password={password} />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-link-row">
        Already have an account? <Link href="/signin">Log in</Link>
      </p>
    </div>
  );
}
