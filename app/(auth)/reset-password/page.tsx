'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }
      router.push('/settings/profile');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-form">
        <div className="message message-error">Invalid reset link. Please request a new one.</div>
        <Link href="/forgot-password" className="btn btn-primary" style={{ textAlign: 'center' }}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="message message-error">{error}</div>}

      <input
        className="input"
        type="password"
        placeholder="Enter a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <input
        className="input"
        type="password"
        placeholder="Re-enter a password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
      />

      <PasswordRequirements password={password} />

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/Logo-small.svg" alt="DevPort" />
        <span>DevPort</span>
      </div>

      <div className="auth-heading">
        <h1>Choose new password</h1>
        <p>Enter your new password and you&apos;re all set.</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
